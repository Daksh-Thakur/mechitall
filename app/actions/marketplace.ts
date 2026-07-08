'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export interface MachiningService {
  id: string;
  seller_profile_id: string;
  title: string;
  process_type: 'CNC Machining' | '3D Printing' | 'Sheet Metal' | 'Laser Cutting';
  description: string;
  base_price: number;
  lead_time: string;
  material_capabilities: string[];
  finish_options: string[];
  created_at: string;
  seller_name?: string;
}

export interface MachiningQuote {
  id: string;
  buyer_profile_id: string;
  service_id: string;
  cad_file_name: string;
  quantity: number;
  selected_material: string;
  selected_finish: string;
  status: 'Pending' | 'Offered' | 'Accepted' | 'Completed';
  offer_price: number | null;
  seller_notes: string | null;
  created_at: string;
  service_title?: string;
  process_type?: string;
  buyer_name?: string;
}

/**
 * Creates a new machining service listing by a seller.
 */
export async function listMachiningService(
  sellerProfileId: string,
  data: {
    title: string;
    processType: 'CNC Machining' | '3D Printing' | 'Sheet Metal' | 'Laser Cutting';
    description: string;
    basePrice: number;
    leadTime: string;
    materials: string[];
    finishes: string[];
  }
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: service, error } = await supabase
    .from('machining_services')
    .insert([
      {
        seller_profile_id: sellerProfileId,
        title: data.title,
        process_type: data.processType,
        description: data.description,
        base_price: data.basePrice,
        lead_time: data.leadTime,
        material_capabilities: data.materials,
        finish_options: data.finishes,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating service listing:', error.message);
    throw new Error(`Failed to list service: ${error.message}`);
  }

  return service as MachiningService;
}

/**
 * Retrieves all listed machining services.
 */
export async function getMachiningServices() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: services, error } = await supabase
    .from('machining_services')
    .select(`
      *,
      profiles:seller_profile_id (
        full_name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading services:', error.message);
    return [];
  }

  return (services || []).map((s: any) => ({
    ...s,
    seller_name: s.profiles?.full_name || 'Expert Maker',
  })) as MachiningService[];
}

/**
 * Submits a new CAD quote request by a buyer.
 */
export async function requestMachiningQuote(
  buyerProfileId: string,
  serviceId: string,
  data: {
    cadFileName: string;
  }
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Fetch capability details to get seller_profile_id and info
  const { data: service } = await supabase
    .from('machining_services')
    .select('title, description, seller_profile_id')
    .eq('id', serviceId)
    .single();

  // 2. Insert into machining_quotes for local machining marketplace view
  const { data: quote, error } = await supabase
    .from('machining_quotes')
    .insert([
      {
        buyer_profile_id: buyerProfileId,
        service_id: serviceId,
        cad_file_name: data.cadFileName,
        quantity: 1, // Default pending review
        selected_material: 'Pending Review',
        selected_finish: 'Pending Review',
        status: 'Pending',
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating quote request:', error.message);
    throw new Error(`Failed to submit quote request: ${error.message}`);
  }

  // 3. Insert matching RFQ & Quote records to integrate with Chat & Profile Seller Hub
  try {
    const { data: rfq } = await supabase
      .from('rfqs')
      .insert([
        {
          buyer_id: buyerProfileId,
          title: `Quote Request: ${service?.title || 'Machining Job'}`,
          description: service?.description || 'Custom machining quote request.',
          material_preference: 'Pending Review',
          quantity: 1,
          cad_file_path: data.cadFileName,
          status: 'OPEN_FOR_BIDS',
        }
      ])
      .select()
      .single();

    let rfqId: string | null = null;
    if (rfq) {
      rfqId = rfq.id;
      if (service?.seller_profile_id) {
        await supabase
          .from('quotes')
          .insert([
            {
              rfq_id: rfq.id,
              seller_id: service.seller_profile_id,
              total_cost: 0,
              lead_time_days: 7,
              seller_notes: 'Awaiting seller custom pricing offer.',
              status: 'SUBMITTED',
            }
          ]);
      }
    }
    return { quote: quote as MachiningQuote, rfqId };
  } catch (linkErr) {
    console.error('Non-fatal: Failed to link to RFQs/Quotes tables:', linkErr);
    return { quote: quote as MachiningQuote, rfqId: null };
  }
}

/**
 * Retrieves all incoming quote requests for services owned by a seller.
 */
export async function getIncomingQuotes(sellerProfileId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // First fetch the services owned by this seller
  const { data: services } = await supabase
    .from('machining_services')
    .select('id')
    .eq('seller_profile_id', sellerProfileId);

  const serviceIds = (services || []).map((s) => s.id);
  if (serviceIds.length === 0) return [];

  const { data: quotes, error } = await supabase
    .from('machining_quotes')
    .select(`
      *,
      machining_services:service_id (
        title,
        process_type
      ),
      profiles:buyer_profile_id (
        full_name
      )
    `)
    .in('service_id', serviceIds)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching incoming quotes:', error.message);
    return [];
  }

  return (quotes || []).map((q: any) => ({
    ...q,
    service_title: q.machining_services?.title || 'Machining Capability',
    process_type: q.machining_services?.process_type || 'CNC',
    buyer_name: q.profiles?.full_name || 'Guest User',
  })) as MachiningQuote[];
}

/**
 * Retrieves all quotes requested by a buyer.
 */
export async function getSubmittedQuotes(buyerProfileId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: quotes, error } = await supabase
    .from('machining_quotes')
    .select(`
      *,
      machining_services:service_id (
        title,
        process_type
      )
    `)
    .eq('buyer_profile_id', buyerProfileId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading submitted quotes:', error.message);
    return [];
  }

  return (quotes || []).map((q: any) => ({
    ...q,
    service_title: q.machining_services?.title || 'Machining Capability',
    process_type: q.machining_services?.process_type || 'CNC',
  })) as MachiningQuote[];
}

export async function submitQuoteOffer(
  quoteId: string,
  data: {
    price: number;
    notes: string;
    quantity: number;
    material: string;
    finish: string;
  }
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: quote, error } = await supabase
    .from('machining_quotes')
    .update({
      offer_price: data.price,
      seller_notes: data.notes,
      quantity: data.quantity,
      selected_material: data.material,
      selected_finish: data.finish,
      status: 'Offered',
    })
    .eq('id', quoteId)
    .select()
    .single();

  if (error) {
    console.error('Error submitting quote offer:', error.message);
    throw new Error(`Failed to submit offer: ${error.message}`);
  }

  // Update corresponding quotes table record if exists
  try {
    const { data: rfqRecord } = await supabase
      .from('rfqs')
      .select('id')
      .eq('buyer_id', quote.buyer_profile_id)
      .eq('cad_file_path', quote.cad_file_name)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rfqRecord) {
      await supabase
        .from('quotes')
        .update({
          total_cost: data.price,
          seller_notes: data.notes,
          status: 'SUBMITTED', // active offer
        })
        .eq('rfq_id', rfqRecord.id);
    }
  } catch (linkErr) {
    console.error('Non-fatal: Failed to sync offer to quotes table:', linkErr);
  }

  return quote as MachiningQuote;
}

/**
 * Allows a buyer to accept an offer and place an order.
 */
export async function acceptQuoteOffer(quoteId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Get the quote details, joining machining_services to get seller_profile_id
  const { data: quote, error: quoteErr } = await supabase
    .from('machining_quotes')
    .select('*, machining_services:service_id(*)')
    .eq('id', quoteId)
    .single();

  if (quoteErr || !quote) {
    throw new Error('Quote details not found');
  }

  if (quote.status !== 'Offered' || !quote.offer_price) {
    throw new Error('No valid offer is active on this quote');
  }

  // 2. Mark the quote as Accepted
  const { error: updateErr } = await supabase
    .from('machining_quotes')
    .update({ status: 'Accepted' })
    .eq('id', quoteId);

  if (updateErr) {
    throw new Error(`Failed to accept offer: ${updateErr.message}`);
  }

  // Update corresponding quotes table record status to ACCEPTED
  try {
    const { data: rfqRecord } = await supabase
      .from('rfqs')
      .select('id')
      .eq('buyer_id', quote.buyer_profile_id)
      .eq('cad_file_path', quote.cad_file_name)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rfqRecord) {
      await supabase
        .from('quotes')
        .update({ status: 'ACCEPTED' })
        .eq('rfq_id', rfqRecord.id);
      
      // Also update RFQ status to CLOSED (or ACCEPTED status if it exists)
      await supabase
        .from('rfqs')
        .update({ status: 'CLOSED' })
        .eq('id', rfqRecord.id);
    }
  } catch (linkErr) {
    console.error('Non-fatal: Failed to sync acceptance status to quotes/rfqs tables:', linkErr);
  }

  // 3. Create a simulated matching order in the orders table
  const orderId = `RFQ-${quote.id.substring(0, 8).toUpperCase()}`;
  const sellerId = quote.machining_services?.seller_profile_id;

  const { error: orderErr } = await supabase
    .from('orders')
    .insert([
      {
        id: orderId,
        profile_id: quote.buyer_profile_id,
        total_amount: quote.offer_price,
        items_count: quote.quantity,
        status: 'Processing',
        rewards_claimed: false,
        seller_id: sellerId || null,
      },
    ]);

  if (orderErr) {
    console.error('Failed to create RFQ order log:', orderErr.message);
  }

  return { success: true, orderId };
}
