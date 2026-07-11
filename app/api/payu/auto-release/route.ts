import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { releasePayUEscrow } from '@/utils/payu';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim() !== '')
  ? process.env.SUPABASE_SERVICE_ROLE_KEY
  : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'mock-key-fallback';

export async function GET(request: Request) {
  try {
    // Verify optional CRON signature / auth token to prevent unauthorized pings
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron signature verification failed' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. Get inspection window settings
    const { data: settings } = await supabase
      .from('rewards_settings')
      .select('inspection_window_days')
      .eq('id', 1)
      .single();
    
    const windowDays = settings?.inspection_window_days ?? 7;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - windowDays);

    // 2. Fetch orders where status is 'Delivered', not disputed, not released yet, and past the inspection window
    const { data: eligibleOrders, error: fetchErr } = await supabase
      .from('orders')
      .select('*, profiles:seller_id(child_merchant_key)')
      .eq('status', 'Delivered')
      .eq('disputed', false)
      .eq('escrow_released', false)
      .lt('delivered_at', thresholdDate.toISOString());

    if (fetchErr) {
      throw new Error(`Failed to fetch eligible orders: ${fetchErr.message}`);
    }

    console.log(`[Auto-Release Cron] Found ${eligibleOrders?.length || 0} orders eligible for auto-release.`);

    const results: any[] = [];

    if (eligibleOrders && eligibleOrders.length > 0) {
      for (const order of eligibleOrders) {
        try {
          const childMerchantKey = (order.profiles as any)?.child_merchant_key || `CM-MOCK-SELLER-${Math.floor(100000 + Math.random() * 900000)}`;

          console.log(`[Auto-Release Cron] Auto-releasing escrow funds for Order ${order.id}...`);
          const releaseRes = await releasePayUEscrow(order.id, Number(order.total_amount), childMerchantKey);

          // Update order status to 'Completed' and escrow_released = true
          await supabase
            .from('orders')
            .update({
              status: 'Completed',
              escrow_released: true,
              released_at: new Date().toISOString(),
              released_transaction_id: releaseRes.transactionId,
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);

          results.push({ orderId: order.id, success: true, txnId: releaseRes.transactionId });
        } catch (err: any) {
          console.error(`[Auto-Release Cron] Failed to auto-release order ${order.id}:`, err.message);
          results.push({ orderId: order.id, success: false, error: err.message });
        }
      }
    }

    return NextResponse.json({ success: true, processedCount: results.length, details: results });
  } catch (error: any) {
    console.error('[Auto-Release Cron] Execution failure:', error);
    return NextResponse.json({ error: 'Cron execution failed', details: error.message }, { status: 500 });
  }
}
export async function POST(request: Request) {
  return GET(request);
}
