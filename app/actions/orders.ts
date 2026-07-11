'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

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
