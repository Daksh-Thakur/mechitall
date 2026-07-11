'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies, headers } from 'next/headers';
import { generatePayUHash, getPayUEndpoint } from '@/utils/payu';

/**
 * Handles the initial order dispatch by the seller.
 * Updates status to 'Shipped', stores tracking number, and links the sealed box label photo.
 */
export async function dispatchOrder(
  orderId: string,
  trackingNumber: string,
  dispatchPhotoUrl: string
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Verify user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized: User session is missing or expired' };
  }

  // 2. Resolve user to their profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { success: false, error: 'Unauthorized: Seller profile not found' };
  }

  // 3. Verify that the user is indeed the authorized seller for this order
  const { data: order, error: orderFetchError } = await supabase
    .from('orders')
    .select('seller_id')
    .eq('id', orderId)
    .maybeSingle();

  if (orderFetchError || !order) {
    return { success: false, error: 'Order not found or database fetch failed' };
  }

  if (order.seller_id !== profile.id) {
    return { success: false, error: 'Forbidden: You are not the authorized seller of this order' };
  }

  // 4. Update the order row in the Supabase database
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'Shipped',
      tracking_number: trackingNumber,
      dispatch_photo_url: dispatchPhotoUrl,
      dispatched_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (updateError) {
    return { success: false, error: `Failed to update order status: ${updateError.message}` };
  }

  return { success: true };
}

/**
 * Marks an order as disputed by the buyer, freezing escrow funds.
 */
export async function disputeOrder(orderId: string, reason: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Verify user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized: User session is missing or expired' };
  }

  // 2. Resolve user to their profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile) {
    return { success: false, error: 'Unauthorized: Buyer profile not found' };
  }

  // 3. Verify that the user is the owner of this order
  const { data: order, error: orderFetchError } = await supabase
    .from('orders')
    .select('profile_id, status, disputed')
    .eq('id', orderId)
    .maybeSingle();

  if (orderFetchError || !order) {
    return { success: false, error: 'Order not found or database fetch failed' };
  }

  if (order.profile_id !== profile.id) {
    return { success: false, error: 'Forbidden: You are not authorized to dispute this order' };
  }

  if (order.disputed) {
    return { success: false, error: 'Order has already been disputed.' };
  }

  // 4. Update the order row in the Supabase database
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      disputed: true,
      dispute_reason: reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (updateError) {
    return { success: false, error: `Failed to record dispute: ${updateError.message}` };
  }

  return { success: true };
}

/**
 * Initiates PayU transaction for an existing pending order (e.g. after seller accepts counter-offer).
 */
export async function initiatePayUExistingOrderPayment(orderId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Verify user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized: User session is missing or expired' };
  }

  // 2. Resolve user to their profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile) {
    return { success: false, error: 'Unauthorized: Buyer profile not found' };
  }

  // 3. Fetch order details
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) {
    return { success: false, error: 'Order not found' };
  }

  if (order.profile_id !== profile.id) {
    return { success: false, error: 'Forbidden: You are not authorized to pay for this order' };
  }

  if (order.status !== 'Pending Payment' || order.payment_status === 'Success') {
    return { success: false, error: 'Order is already paid or cannot be paid.' };
  }

  // 4. Generate PayU hash and parameters
  const amountNum = Number(order.total_amount);
  
  // Resolve host for callback URLs
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const surl = `${protocol}://${host}/api/payu/callback`;
  const furl = `${protocol}://${host}/api/payu/callback`;

  // Check split info
  let childMerchantKey = '';
  if (order.seller_id) {
    const { data: sellerProf } = await supabase
      .from('profiles')
      .select('child_merchant_key')
      .eq('id', order.seller_id)
      .single();
    if (sellerProf && sellerProf.child_merchant_key) {
      childMerchantKey = sellerProf.child_merchant_key;
    }
  }
  if (!childMerchantKey) {
    childMerchantKey = `CM-MOCK-SELLER-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  const sellerShare = (amountNum * 0.9).toFixed(2);
  const splitRequest = JSON.stringify({
    splitInfo: [
      {
        childMerchantKey: childMerchantKey,
        amount: sellerShare,
      }
    ]
  });

  const productinfo = orderId.startsWith('RFQ-') ? `Machining Quote Order ${orderId}` : 'MechItAll Parts Order';
  const firstname = profile.full_name || 'Guest';
  const email = profile.email || 'guest@mechitall.io';

  const hash = generatePayUHash({
    txnid: orderId,
    amount: amountNum.toFixed(2),
    productinfo,
    firstname,
    email,
    udf1: profile.id,
    udf2: orderId.startsWith('RFQ-') ? 'quote' : 'shop',
    udf3: '', // existing order
    udf4: '0',
    udf5: '[]',
  });

  return {
    success: true,
    payuParams: {
      key: process.env.PAYU_MERCHANT_KEY || 'mock_key',
      txnid: orderId,
      amount: amountNum.toFixed(2),
      productinfo,
      firstname,
      email,
      phone: '9999999999',
      surl,
      furl,
      hash,
      splitRequest,
      udf1: profile.id,
      udf2: orderId.startsWith('RFQ-') ? 'quote' : 'shop',
      udf3: '',
      udf4: '0',
      udf5: '[]',
      service_provider: 'payu_paisa',
    },
    payuUrl: getPayUEndpoint(),
  };
}


