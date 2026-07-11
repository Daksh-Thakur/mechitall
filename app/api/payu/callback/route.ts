import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPayUResponse } from '@/utils/payu';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim() !== '')
  ? process.env.SUPABASE_SERVICE_ROLE_KEY
  : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'mock-key-fallback';

export async function POST(request: Request) {
  let orderId = 'unknown';
  try {
    const formData = await request.formData();
    const body: any = {};
    formData.forEach((value, key) => {
      body[key] = value.toString();
    });

    console.log('[PayU Callback] Received POST payload:', body);

    orderId = body.txnid || 'unknown';
    const status = body.status || 'failed';
    const mihpayid = body.mihpayid || '';

    // Extract custom parameters (UDFs)
    const profileId = body.udf1 || '';
    const orderType = body.udf2 || '';
    const quoteId = body.udf3 || '';
    const boltsSpent = parseInt(body.udf4 || '0') || 0;
    const cartItemsStr = body.udf5 || '[]';

    // 1. Verify response hash using Platform Secret Salt to prevent tampering
    const isHashValid = verifyPayUResponse(body);

    // Dynamic redirect URL construction
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const redirectBase = `${protocol}://${host}/profile?tab=orders`;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (!isHashValid) {
      console.error('[PayU Callback] Hash validation failed! Tampering suspected for order:', orderId);
      // Update order to fail
      if (orderId !== 'unknown') {
        await supabase
          .from('orders')
          .update({ payment_status: 'Failed' })
          .eq('id', orderId);
      }
      return NextResponse.redirect(`${redirectBase}&payment=failed&reason=hash_invalid`, 303);
    }

    if (status !== 'success') {
      console.warn('[PayU Callback] Payment failed/cancelled for order:', orderId);
      await supabase
        .from('orders')
        .update({ payment_status: 'Failed' })
        .eq('id', orderId);
      return NextResponse.redirect(`${redirectBase}&payment=failed&orderId=${orderId}`, 303);
    }

    // 2. The Payment is Verified & Successful
    console.log('[PayU Callback] Payment verified. Commencing database order fulfillment...', orderId);

    // Update order status to 'Processing' and payment_status to 'Success'
    const { error: orderUpdateErr } = await supabase
      .from('orders')
      .update({
        status: 'Processing',
        payment_status: 'Success',
        payu_txnid: orderId,
        payu_mihpayid: mihpayid,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (orderUpdateErr) {
      console.error('[PayU Callback] Failed to update order status in DB:', orderUpdateErr.message);
    }

    // 3. Trigger order-type specific fulfillment
    if (orderType === 'quote' || orderId.startsWith('RFQ-')) {
      // Custom machining contract workflow fulfillment
      if (quoteId) {
        // Mark quote as Accepted
        await supabase
          .from('machining_quotes')
          .update({ status: 'Accepted' })
          .eq('id', quoteId);

        // Update main quotes status to ACCEPTED
        await supabase
          .from('quotes')
          .update({ status: 'ACCEPTED' })
          .eq('rfq_id', body.udf6 || quoteId); // Fallback to quoteId or search

        // Find quote detail to link RFQ
        const { data: quoteObj } = await supabase
          .from('machining_quotes')
          .select('rfq_id, buyer_profile_id')
          .eq('id', quoteId)
          .single();

        if (quoteObj && quoteObj.rfq_id) {
          // Close RFQ
          await supabase
            .from('rfqs')
            .update({ status: 'CLOSED' })
            .eq('id', quoteObj.rfq_id);

          // Insert system message in chat
          await supabase
            .from('chat_messages')
            .insert({
              rfq_id: quoteObj.rfq_id,
              quote_id: quoteId,
              sender_id: quoteObj.buyer_profile_id,
              message_text: `[SYSTEM] PayU Escrow Payment Verified! Escrow funds secured in Nodal Account. Order ${orderId} has transitioned to Processing.`,
            });
        }
      }
    } else {
      // Standard catalog inventory checkouts
      if (profileId) {
        // Mark profile as verified buyer
        await supabase
          .from('profiles')
          .update({ is_verified_buyer: true })
          .eq('id', profileId);

        // Decrement product inventory stock
        try {
          const cartItems = JSON.parse(cartItemsStr);
          if (cartItems && cartItems.length > 0) {
            const { error: stockError } = await supabase.rpc('decrement_product_stock', {
              p_order_id: orderId,
              p_items: cartItems,
            });
            if (stockError) {
              console.error('[PayU Callback] Stock decrement error:', stockError.message);
            }
          }
        } catch (e) {
          console.error('[PayU Callback] Failed parsing cart items for stock decrement:', e);
        }

        // Deduct Bolts rewards if spent
        if (boltsSpent > 0) {
          await supabase
            .from('bolts_transactions')
            .insert({
              profile_id: profileId,
              amount: -boltsSpent,
              type: 'debit',
              order_id: orderId,
              description: `Spent ${boltsSpent} Bolts for discount on order ${orderId}`,
            });

          // Fetch current wallet balance to adjust
          const { data: profileObj } = await supabase
            .from('profiles')
            .select('wallet_balance')
            .eq('id', profileId)
            .single();

          if (profileObj) {
            await supabase
              .from('profiles')
              .update({
                wallet_balance: Math.max(0, profileObj.wallet_balance - boltsSpent)
              })
              .eq('id', profileId);
          }
        }
      }
    }

    return NextResponse.redirect(`${redirectBase}&payment=success&orderId=${orderId}`, 303);
  } catch (err: any) {
    console.error('[PayU Callback] Exception during webhook handling:', err);
    // Redirect with error
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    return NextResponse.redirect(`${protocol}://${host}/profile?tab=orders&payment=failed&reason=exception`, 303);
  }
}
