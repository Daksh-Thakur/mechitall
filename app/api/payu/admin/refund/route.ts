import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { refundPayUTransaction, releasePayUEscrow } from '@/utils/payu';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim() !== '')
  ? process.env.SUPABASE_SERVICE_ROLE_KEY
  : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'mock-key-fallback';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, adminDecision, adminSecret } = body;

    // Verify admin access
    const expectedSecret = process.env.ADMIN_SECRET || 'super_admin_secret_token';
    if (adminSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized admin credentials' }, { status: 401 });
    }

    if (!orderId || !adminDecision) {
      return NextResponse.json({ error: 'Missing parameters: orderId and adminDecision' }, { status: 400 });
    }

    if (adminDecision !== 'REFUND' && adminDecision !== 'RELEASE') {
      return NextResponse.json({ error: 'Invalid adminDecision. Must be REFUND or RELEASE.' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Fetch order details
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*, profiles:seller_id(child_merchant_key)')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: `Order ${orderId} not found` }, { status: 404 });
    }

    const childMerchantKey = (order.profiles as any)?.child_merchant_key || `CM-MOCK-SELLER-${Math.floor(100000 + Math.random() * 900000)}`;

    if (adminDecision === 'REFUND') {
      console.log(`[Admin Mediation] Refunding Order ${orderId} using PayU Refund API...`);
      
      const refundRes = await refundPayUTransaction({
        txnid: orderId,
        amount: Number(order.total_amount),
        payuMihpayid: order.payu_mihpayid,
        childMerchantKey,
      });

      // Update order state to reflect Refunded
      await supabase
        .from('orders')
        .update({
          payment_status: 'Failed',
          disputed: false,
          dispute_reason: `Resolved by admin: refunded. Refund ID: ${refundRes.refundId}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      return NextResponse.json({
        success: true,
        message: `Order ${orderId} refunded successfully.`,
        refundId: refundRes.refundId,
      });
    } else {
      // RELEASE - side with seller
      console.log(`[Admin Mediation] Overriding dispute and releasing escrow funds for Order ${orderId}...`);
      
      const releaseRes = await releasePayUEscrow(orderId, Number(order.total_amount), childMerchantKey);

      await supabase
        .from('orders')
        .update({
          status: 'Completed',
          escrow_released: true,
          disputed: false,
          released_at: new Date().toISOString(),
          released_transaction_id: releaseRes.transactionId,
          dispute_reason: `Resolved by admin: escrow released to seller.`,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      return NextResponse.json({
        success: true,
        message: `Escrow funds for Order ${orderId} released to seller successfully.`,
        transactionId: releaseRes.transactionId,
      });
    }
  } catch (error: any) {
    console.error('[Admin Mediation API] Exception:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
