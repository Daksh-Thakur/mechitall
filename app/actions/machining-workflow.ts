'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { 
  RFQInput, 
  QuoteInput, 
  ActionResponse, 
  RFQ, 
  Quote, 
  Profile,
  ChatMessage,
  ChatMessageInput,
  ChatThread
} from '@/types/machining';

/**
 * Helper to fetch the authenticated user's profile from the database.
 */
async function getAuthProfile(supabase: ReturnType<typeof createClient>): Promise<Profile> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error('User profile not found. Please complete registration.');
  }

  return profile as Profile;
}

/**
 * Creates a new Request for Quote (RFQ).
 */
export async function createRFQ(data: RFQInput): Promise<ActionResponse<RFQ>> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const profile = await getAuthProfile(supabase);

    const { data: rfq, error } = await supabase
      .from('rfqs')
      .insert([
        {
          buyer_id: profile.id,
          title: data.title,
          description: data.description || null,
          material_preference: data.materialPreference || null,
          quantity: data.quantity,
          cad_file_path: data.cadFilePath || null,
          status: data.status || 'DRAFT',
        },
      ])
      .select()
      .single();

    if (error) {
      return { success: false, error: `Failed to create RFQ: ${error.message}` };
    }

    return { success: true, data: rfq as RFQ };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}

/**
 * Generates a short-lived signed upload URL for raw CAD file storage.
 */
export async function getUploadSignedUrl(
  quoteId: string, 
  fileName: string
): Promise<ActionResponse<{ signedUrl: string; token: string; path: string }>> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const profile = await getAuthProfile(supabase);

    // Verify user owns the quote or parent RFQ
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('seller_id, rfq_id, rfqs(buyer_id)')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return { success: false, error: 'Quotation request not found' };
    }

    const rfqBuyerId = (quote.rfqs as any)?.buyer_id;
    const sellerId = quote.seller_id;

    if (profile.id !== rfqBuyerId && profile.id !== sellerId) {
      return { success: false, error: 'Unauthorized: You do not own this RFQ/Quote' };
    }

    const filePath = `${quoteId}/${fileName}`;
    const { data, error } = await supabase.storage
      .from('rfq-cad-files')
      .createSignedUploadUrl(filePath);

    if (error || !data) {
      return { success: false, error: `Failed to create signed upload URL: ${error?.message || 'Storage error'}` };
    }

    return { 
      success: true, 
      data: {
        signedUrl: data.signedUrl,
        token: data.token,
        path: filePath
      } 
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}

/**
 * Submits a quote bid for an open RFQ. Only accessible to verified sellers.
 */
export async function submitQuote(data: QuoteInput): Promise<ActionResponse<Quote>> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const profile = await getAuthProfile(supabase);

    // Check if profile is authorized to bid (seller, both, or admin)
    if (profile.role === 'BUYER') {
      return { success: false, error: 'Unauthorized: Only sellers can submit quotes' };
    }

    // Verify that the RFQ is still open for bidding
    const { data: rfq, error: rfqError } = await supabase
      .from('rfqs')
      .select('status')
      .eq('id', data.rfqId)
      .single();

    if (rfqError || !rfq) {
      return { success: false, error: 'Target RFQ not found' };
    }

    if (rfq.status !== 'OPEN_FOR_BIDS') {
      return { success: false, error: 'Unauthorized: Bidding is closed on this RFQ' };
    }

    const { data: quote, error } = await supabase
      .from('quotes')
      .insert([
        {
          rfq_id: data.rfqId,
          seller_id: profile.id,
          total_cost: data.totalCost,
          lead_time_days: data.leadTimeDays,
          seller_notes: data.sellerNotes || null,
          status: 'SUBMITTED',
        },
      ])
      .select()
      .single();

    if (error) {
      return { success: false, error: `Failed to submit quote: ${error.message}` };
    }

    return { success: true, data: quote as Quote };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}

/**
 * A transaction-like flow allowing a buyer to accept a quote.
 * Updates target quote status to ACCEPTED, parent RFQ status to CLOSED,
 * and sets all other bids for the RFQ to REJECTED.
 */
export async function acceptQuote(quoteId: string, rfqId: string): Promise<ActionResponse<{ success: boolean }>> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const profile = await getAuthProfile(supabase);

    // Verify that this user is the buyer who created the RFQ
    const { data: rfq, error: rfqError } = await supabase
      .from('rfqs')
      .select('buyer_id, status')
      .eq('id', rfqId)
      .single();

    if (rfqError || !rfq) {
      return { success: false, error: 'RFQ not found' };
    }

    if (rfq.buyer_id !== profile.id) {
      return { success: false, error: 'Unauthorized: You do not own this RFQ' };
    }

    if (rfq.status === 'CLOSED') {
      return { success: false, error: 'This RFQ is already closed' };
    }

    // Step 1: Set the chosen quote status to ACCEPTED
    const { error: acceptQuoteError } = await supabase
      .from('quotes')
      .update({ status: 'ACCEPTED' })
      .eq('id', quoteId)
      .eq('rfq_id', rfqId);

    if (acceptQuoteError) {
      return { success: false, error: `Failed to accept quote: ${acceptQuoteError.message}` };
    }

    // Step 2: Set the RFQ status to CLOSED
    const { error: closeRfqError } = await supabase
      .from('rfqs')
      .update({ status: 'CLOSED' })
      .eq('id', rfqId);

    if (closeRfqError) {
      // Rollback selected quote status
      await supabase.from('quotes').update({ status: 'SUBMITTED' }).eq('id', quoteId);
      return { success: false, error: `Failed to close RFQ: ${closeRfqError.message}` };
    }

    // Step 3: Reject all other quotes associated with this RFQ
    const { error: rejectOthersError } = await supabase
      .from('quotes')
      .update({ status: 'REJECTED' })
      .eq('rfq_id', rfqId)
      .neq('id', quoteId);

    if (rejectOthersError) {
      console.warn('Failed to reject other quotes on target RFQ:', rejectOthersError.message);
      // We don't rollback since accepting the primary quote was already complete, but report warning or complete.
    }

    // Step 4: Create a simulated matching order in the orders table
    try {
      const { data: quoteObj } = await supabase
        .from('quotes')
        .select('*, rfqs(quantity)')
        .eq('id', quoteId)
        .single();

      if (quoteObj) {
        const orderId = `RFQ-${quoteObj.id.substring(0, 8).toUpperCase()}`;
        const qty = (quoteObj.rfqs as any)?.quantity || 1;
        const { error: orderErr } = await supabase
          .from('orders')
          .insert([
            {
              id: orderId,
              profile_id: rfq.buyer_id,
              total_amount: quoteObj.total_cost,
              items_count: qty,
              status: 'Processing',
              rewards_claimed: false,
              seller_id: quoteObj.seller_id,
            }
          ]);
        if (orderErr) {
          console.error('Failed to create RFQ order log in acceptQuote:', orderErr.message);
        }
      }
    } catch (orderInsertErr: any) {
      console.error('Non-fatal: Failed to create simulated order in acceptQuote:', orderInsertErr.message);
    }

    return { success: true, data: { success: true } };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}

/**
 * Fetches all ongoing quote chat threads for the current user (as buyer or seller).
 * Uses a two-step fetch to bypass RLS join nulls on rfqs for sellers with closed/draft RFQs.
 */
export async function getOngoingChats(): Promise<ActionResponse<ChatThread[]>> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const profile = await getAuthProfile(supabase);

    // Step 1: Fetch quotes where this user is seller OR buyer (via rfq)
    const { data: quotesData, error: quotesError } = await supabase
      .from('quotes')
      .select(`
        *,
        seller_profile:seller_id (
          full_name
        )
      `);

    if (quotesError) {
      return { success: false, error: `Failed to fetch quote threads: ${quotesError.message}` };
    }

    // Step 2: Fetch thread details in parallel
    const threadPromises = (quotesData || []).map(async (q) => {
      const sellerProfile = q.seller_profile as any;
      const sellerId = q.seller_id;

      // This is necessary because nested joins are blocked by RLS for non-buyers on closed RFQs.
      const { data: rfq } = await supabase
        .from('rfqs')
        .select('id, title, buyer_id, cad_file_path, profiles:buyer_id(full_name)')
        .eq('id', q.rfq_id)
        .maybeSingle();

      if (!rfq) {
        return null;
      }

      const buyerId = rfq.buyer_id;

      // Only include threads where this user is buyer or seller
      if (profile.id !== buyerId && profile.id !== sellerId) {
        return null;
      }

      // Determine the other participant name
      const otherParticipantName = profile.id === buyerId
        ? (sellerProfile?.full_name || 'Seller')
        : ((rfq.profiles as any)?.full_name || 'Buyer');

      // Fetch latest message preview & corresponding machining_quotes record in parallel
      const [latestMsgResult, machQuoteResult] = await Promise.all([
        supabase
          .from('chat_messages')
          .select('message_text, created_at')
          .eq('quote_id', q.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('machining_quotes')
          .select('*, machining_services(material_capabilities, finish_options)')
          .eq('rfq_id', rfq.id)
          .maybeSingle()
      ]);

      const latestMsg = latestMsgResult.data;
      const machQuote = machQuoteResult.data;

      const mappedMachQuote = machQuote ? {
        id: machQuote.id,
        rfq_id: machQuote.rfq_id || null,
        status: machQuote.status as any,
        offer_price: machQuote.offer_price ? Number(machQuote.offer_price) : null,
        quantity: machQuote.quantity,
        selected_material: machQuote.selected_material,
        selected_finish: machQuote.selected_finish,
        seller_notes: machQuote.seller_notes,
        service_id: machQuote.service_id,
        material_capabilities: (machQuote.machining_services as any)?.material_capabilities || [],
        finish_options: (machQuote.machining_services as any)?.finish_options || [],
      } : null;

      return {
        quoteId: q.id,
        rfqId: rfq.id,
        rfqTitle: rfq.title,
        otherParticipantName,
        status: q.status,
        lastMessageText: latestMsg?.message_text || null,
        lastMessageTime: latestMsg?.created_at || null,
        cadFilePath: rfq.cad_file_path || null,
        machiningQuote: mappedMachQuote,
        createdAt: q.created_at,
      } as ChatThread;
    });

    const threadsArray = await Promise.all(threadPromises);
    const threads = threadsArray.filter((t): t is ChatThread => t !== null);

    // Sort by latest message time or creation time descending (newest on top)
    threads.sort((a, b) => {
      const timeA = a.lastMessageTime || a.createdAt;
      const timeB = b.lastMessageTime || b.createdAt;
      return timeB.localeCompare(timeA);
    });

    return { success: true, data: threads };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}




/**
 * Sends a message in the secure negotiation/dispute chat.
 */
export async function sendChatMessage(data: ChatMessageInput): Promise<ActionResponse<ChatMessage>> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const profile = await getAuthProfile(supabase);

    let isAuthorized = false;

    // Check seller authorization via quote (sellers can always read their own quotes)
    if (data.quoteId) {
      const { data: quote } = await supabase
        .from('quotes')
        .select('seller_id')
        .eq('id', data.quoteId)
        .maybeSingle();

      if (quote && quote.seller_id === profile.id) {
        isAuthorized = true;
      }
    }

    // Check buyer authorization via RFQ (buyers always have SELECT on their own RFQs)
    if (!isAuthorized) {
      const { data: rfq } = await supabase
        .from('rfqs')
        .select('buyer_id')
        .eq('id', data.rfqId)
        .maybeSingle();

      if (rfq && rfq.buyer_id === profile.id) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return { success: false, error: 'Unauthorized: You are not a participant in this conversation' };
    }

    const { data: msg, error } = await supabase
      .from('chat_messages')
      .insert([
        {
          rfq_id: data.rfqId,
          quote_id: data.quoteId || null,
          sender_id: profile.id,
          message_text: data.messageText,
          file_attachment_path: data.fileAttachmentPath || null,
        },
      ])
      .select()
      .single();

    if (error) {
      return { success: false, error: `Failed to send message: ${error.message}` };
    }

    // Attach sender_name for visual rendering convenience
    const chatMsg: ChatMessage = {
      ...msg,
      sender_name: profile.full_name,
    };

    return { success: true, data: chatMsg };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}


/**
 * Fetches secure negotiation/dispute message history for a quote/RFQ.
 */
export async function getChatMessages(quoteId: string): Promise<ActionResponse<ChatMessage[]>> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const profile = await getAuthProfile(supabase);

    // Fetch the quote to get seller and rfq_id
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('seller_id, rfq_id')
      .eq('id', quoteId)
      .maybeSingle();

    if (quoteError || !quote) {
      return { success: false, error: 'Quote not found' };
    }

    const sellerId = quote.seller_id;

    // Fetch RFQ separately so buyer_id is accessible even on non-open RFQs
    const { data: rfq } = await supabase
      .from('rfqs')
      .select('buyer_id')
      .eq('id', quote.rfq_id)
      .maybeSingle();

    const rfqBuyerId = rfq?.buyer_id;

    if (profile.id !== rfqBuyerId && profile.id !== sellerId) {
      return { success: false, error: 'Unauthorized: You are not a participant in this conversation' };
    }

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        profiles:sender_id (
          full_name
        )
      `)
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: true });

    if (error) {
      return { success: false, error: `Failed to fetch messages: ${error.message}` };
    }

    const mappedMessages = (messages || []).map((m: any) => ({
      id: m.id,
      rfq_id: m.rfq_id,
      quote_id: m.quote_id,
      sender_id: m.sender_id,
      message_text: m.message_text,
      file_attachment_path: m.file_attachment_path,
      created_at: m.created_at,
      sender_name: m.profiles?.full_name || 'Participant',
    })) as ChatMessage[];

    return { success: true, data: mappedMessages };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}

/**
 * Generates signed upload URL for attachments (CAD edits, inspection photos) shared in chat.
 */
export async function getChatUploadSignedUrl(
  quoteId: string,
  fileName: string
): Promise<ActionResponse<{ signedUrl: string; token: string; path: string }>> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const profile = await getAuthProfile(supabase);

    // Verify user owns the quote or parent RFQ
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('seller_id, rfq_id, rfqs(buyer_id)')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return { success: false, error: 'Quote not found' };
    }

    const rfqBuyerId = (quote.rfqs as any)?.buyer_id;
    const sellerId = quote.seller_id;

    if (profile.id !== rfqBuyerId && profile.id !== sellerId) {
      return { success: false, error: 'Unauthorized: You do not own this RFQ/Quote' };
    }

    const filePath = `${quoteId}/${fileName}`;
    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .createSignedUploadUrl(filePath);

    if (error || !data) {
      return { success: false, error: `Failed to create signed upload URL: ${error?.message || 'Storage error'}` };
    }

    return {
      success: true,
      data: {
        signedUrl: data.signedUrl,
        token: data.token,
        path: filePath
      }
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}

/**
 * Allows a buyer or seller to reject a quote.
 * Updates target quote status to REJECTED.
 * Sends a message in the chat thread explaining why it was rejected.
 */
export async function rejectQuote(
  quoteId: string, 
  rfqId: string, 
  rejectionReason: string
): Promise<ActionResponse<{ success: boolean }>> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const profile = await getAuthProfile(supabase);

    // 1. Fetch quote and RFQ details to verify participant relationship
    const { data: quote, error: quoteErr } = await supabase
      .from('quotes')
      .select('*, rfqs:rfq_id(*)')
      .eq('id', quoteId)
      .single();

    if (quoteErr || !quote) {
      return { success: false, error: 'Quote not found' };
    }

    const rfq = quote.rfqs as any;
    const buyerId = rfq?.buyer_id;
    const sellerId = quote.seller_id;

    if (profile.id !== buyerId && profile.id !== sellerId) {
      return { success: false, error: 'Unauthorized: You are not a participant in this quote negotiation.' };
    }

    // 2. Update quote status to REJECTED
    const { error: updateErr } = await supabase
      .from('quotes')
      .update({ status: 'REJECTED' })
      .eq('id', quoteId);

    if (updateErr) {
      return { success: false, error: `Failed to update quote status: ${updateErr.message}` };
    }

    // Also update machining_quotes status to Rejected if exists
    try {
      const { data: machQuote } = await supabase
        .from('machining_quotes')
        .select('id')
        .eq('rfq_id', rfqId)
        .maybeSingle();

      if (machQuote) {
        await supabase
          .from('machining_quotes')
          .update({ status: 'Rejected' })
          .eq('id', machQuote.id);
      }
    } catch (linkErr) {
      console.warn('Failed to sync rejection to machining_quotes:', linkErr);
    }

    // 3. Send automatic chat message with the rejection reason
    const { error: msgErr } = await supabase
      .from('chat_messages')
      .insert([
        {
          rfq_id: rfqId,
          quote_id: quoteId,
          sender_id: profile.id,
          sender_name: profile.full_name || 'User',
          message_text: `🔴 QUOTATION REJECTED. Reason: ${rejectionReason}`,
        }
      ]);

    if (msgErr) {
      console.warn('Failed to send rejection chat message:', msgErr.message);
    }

    return { success: true, data: { success: true } };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}

/**
 * Allows a buyer or seller to cancel the entire RFQ quotation contract.
 * Updates target quote status to REJECTED, and updates RFQ status to CLOSED.
 * Sends a message in the chat thread notifying of the cancellation.
 */
export async function cancelQuoteNegotiation(
  quoteId: string, 
  rfqId: string
): Promise<ActionResponse<{ success: boolean }>> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const profile = await getAuthProfile(supabase);

    // 1. Fetch quote and RFQ details to verify participant relationship
    const { data: quote, error: quoteErr } = await supabase
      .from('quotes')
      .select('*, rfqs:rfq_id(*)')
      .eq('id', quoteId)
      .single();

    if (quoteErr || !quote) {
      return { success: false, error: 'Quote not found' };
    }

    const rfq = quote.rfqs as any;
    const buyerId = rfq?.buyer_id;
    const sellerId = quote.seller_id;

    if (profile.id !== buyerId && profile.id !== sellerId) {
      return { success: false, error: 'Unauthorized: You are not a participant in this quote negotiation.' };
    }

    // 2. Update quote status to REJECTED (cancelling the quote)
    await supabase
      .from('quotes')
      .update({ status: 'REJECTED' })
      .eq('id', quoteId);

    // 3. Update RFQ status to CLOSED
    await supabase
      .from('rfqs')
      .update({ status: 'CLOSED' })
      .eq('id', rfqId);

    // Update machining_quotes status to Canceled if exists
    try {
      const { data: machQuote } = await supabase
        .from('machining_quotes')
        .select('id')
        .eq('rfq_id', rfqId)
        .maybeSingle();

      if (machQuote) {
        await supabase
          .from('machining_quotes')
          .update({ status: 'Rejected' })
          .eq('id', machQuote.id);
      }
    } catch (linkErr) {
      console.warn('Failed to sync cancellation to machining_quotes:', linkErr);
    }

    // 4. Send automatic message to the chat channel
    const { error: msgErr } = await supabase
      .from('chat_messages')
      .insert([
        {
          rfq_id: rfqId,
          quote_id: quoteId,
          sender_id: profile.id,
          sender_name: profile.full_name || 'User',
          message_text: `⚠️ QUOTATION NEGOTIATION CANCELLED.`,
        }
      ]);

    if (msgErr) {
      console.warn('Failed to send cancellation message:', msgErr.message);
    }

    return { success: true, data: { success: true } };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}

