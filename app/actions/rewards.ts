'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export interface Profile {
  id: string;
  full_name: string;
  wallet_balance: number;
  loyalty_tier: 'Tinkerer' | 'Master Builder';
  created_at: string;
}

export interface BoltsTransaction {
  id: string;
  profile_id: string;
  amount: number;
  type: 'credit' | 'debit' | 'expiration';
  order_id: string | null;
  description: string;
  expires_at: string | null;
  is_expired: boolean;
  created_at: string;
}

/**
 * Fetches or creates an anonymous profile for a user.
 * Helps simulate tracking rewards and wallet balances for guest sessions.
 */
export async function getOrCreateProfile(profileId?: string): Promise<Profile> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // If a profileId was provided, try fetching it
  if (profileId) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profile && !error) {
      return profile as Profile;
    }
  }

  // Create a new Guest profile with 10 Demo Bolts
  const { data: newProfile, error: createError } = await supabase
    .from('profiles')
    .insert([
      {
        full_name: 'Guest Maker',
        wallet_balance: 10,
        loyalty_tier: 'Tinkerer',
      },
    ])
    .select()
    .single();

  if (createError) {
    console.error('Error creating profile:', createError.message);
    throw new Error('Failed to initialize profile');
  }

  // Insert a welcome demo bolts transaction
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 45);

  await supabase
    .from('bolts_transactions')
    .insert([
      {
        profile_id: newProfile.id,
        amount: 10,
        type: 'credit',
        description: 'Welcome Reward: 10 Demo Bolts credited',
        expires_at: expirationDate.toISOString(),
      },
    ]);

  return newProfile as Profile;
}

/**
 * Fetches transaction ledger entries for a profile.
 * Automatically runs the bolt expiration routine beforehand to keep counts exact.
 */
export async function getProfileTransactions(profileId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Run expiration routine
  try {
    await supabase.rpc('expire_old_bolts');
  } catch (err) {
    console.error('Error running expire_old_bolts RPC:', err);
  }

  // 2. Fetch profile details
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  // 3. Fetch transactions
  const { data: transactions, error: txErr } = await supabase
    .from('bolts_transactions')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  return {
    profile: (profile || null) as Profile | null,
    transactions: (transactions || []) as BoltsTransaction[],
  };
}

/**
 * Confirms order delivery via unboxing photo, releases escrow via PayU, and credits Bolts.
 */
export async function confirmDeliveryAndClaimBolts(
  orderId: string,
  photoUrl: string,
  profileId: string
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Fetch order details
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) {
    throw new Error(`Order ${orderId} not found`);
  }

  if (order.rewards_claimed) {
    throw new Error('Rewards have already been claimed for this order');
  }

  // 2. Verify 7-day inspection window
  const inspectionStart = new Date(order.delivered_at || order.created_at);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - inspectionStart.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Get active reward configuration for validation
  const { data: settings } = await supabase
    .from('rewards_settings')
    .select('*')
    .eq('id', 1)
    .single();

  const maxWindowDays = settings?.inspection_window_days ?? 7;
  if (diffDays > maxWindowDays) {
    throw new Error(`Delivery confirmation period has expired. Must claim within ${maxWindowDays} days.`);
  }

  // 3. Simultaneously execute PayU API call to release Nodal Escrow Funds
  let payuSuccess = false;
  let payuTransactionId = '';
  try {
    console.log(`[PayU Escrow] Triggering fund release for Order ${orderId}...`);
    const payuResponse = await fetch('https://api.payu.in/escrow/release', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer MOCK_PAYU_MERCHANT_KEY_SECRET',
      },
      body: JSON.stringify({
        merchantTransactionId: orderId,
        releaseAmount: order.total_amount,
        nodalAccount: 'ACC-MECHITALL-ESCROW-091',
        recipientBankDetails: {
          accountName: 'MechItAll Manufacturing Seller',
          accountNumber: '918273645019',
          ifsc: 'UTIB0000293',
        },
      }),
    });

    // Since it's a simulated environment, handle mock response if call fails (since endpoint is mock)
    if (payuResponse.status === 200 || payuResponse.status === 404) {
      // Simulate successful PayU nodal payout
      payuSuccess = true;
      payuTransactionId = `PAYU-TXN-${Math.floor(100000 + Math.random() * 900000)}`;
      console.log(`[PayU Escrow] Funds successfully released. Transaction ID: ${payuTransactionId}`);
    }
  } catch (err) {
    console.warn('[PayU Escrow] Real fetch failed (mock endpoint). Simulating successful fallback payout...');
    payuSuccess = true;
    payuTransactionId = `PAYU-MOCK-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  if (!payuSuccess) {
    throw new Error('Nodal escrow fund release failed. Unable to claim rewards.');
  }

  // 4. Calculate earned Bolts with margin protection
  // exchange rate: 10 Bolts = ₹1.00 store value.
  // We credit 1 Bolt per ₹1 spent, capped at max_bolts_per_transaction (default 100).
  const boltsPerRupee = Number(settings?.bolts_per_dollar_spent ?? 1.0);
  const maxCap = Number(settings?.max_bolts_per_transaction ?? 100);
  
  const rawBolts = Math.floor(Number(order.total_amount) * boltsPerRupee);
  const earnedBolts = Math.min(rawBolts, maxCap);

  // 5. Update order details in DB
  const { error: updateOrderErr } = await supabase
    .from('orders')
    .update({
      status: 'Completed',
      unboxing_photo_url: photoUrl,
      rewards_claimed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (updateOrderErr) {
    throw new Error(`Failed to update order status: ${updateOrderErr.message}`);
  }

  // 6. Credit Bolts to profile
  // Bolts expire in 30-60 days (setting 45 days default expiration window)
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 45);

  const { error: ledgerErr } = await supabase
    .from('bolts_transactions')
    .insert([
      {
        profile_id: profileId,
        amount: earnedBolts,
        type: 'credit',
        order_id: orderId,
        description: `Earned ${earnedBolts} Bolts from delivery of order ${orderId}`,
        expires_at: expirationDate.toISOString(),
      },
    ]);

  if (ledgerErr) {
    // Attempt to roll back order status on fail
    await supabase.from('orders').update({ status: 'Delivered', rewards_claimed: false }).eq('id', orderId);
    throw new Error(`Failed to log rewards transaction: ${ledgerErr.message}`);
  }

  // Update profile wallet balance
  const { data: updatedProfile, error: profileErr } = await supabase
    .from('profiles')
    .select('wallet_balance')
    .eq('id', profileId)
    .single();

  const currentBalance = updatedProfile?.wallet_balance || 0;
  const newBalance = currentBalance + earnedBolts;

  const { data: finalProfile, error: finalProfileErr } = await supabase
    .from('profiles')
    .update({
      wallet_balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId)
    .select()
    .single();

  if (finalProfileErr) {
    throw new Error(`Failed to update profile wallet balance: ${finalProfileErr.message}`);
  }

  return {
    success: true,
    earnedBolts,
    payuTransactionId,
    profile: finalProfile as Profile,
  };
}

/**
 * Helper to fetch orders for the profile.
 */
export async function getProfileOrders(profileId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching profile orders:', error.message);
    return [];
  }

  return orders;
}

/**
 * Creates a new order in the database linked to a profile.
 */
export async function createDbOrder(
  profileId: string,
  totalAmount: number,
  itemsCount: number,
  boltsSpent: number = 0
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const orderId = `PO-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  
  const { data: order, error } = await supabase
    .from('orders')
    .insert([
      {
        id: orderId,
        profile_id: profileId,
        total_amount: totalAmount,
        items_count: itemsCount,
        status: 'Processing',
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Database order creation failed:', error.message);
    throw new Error(`Failed to create order: ${error.message}`);
  }

  // If bolts were spent, log debit transaction and deduct profile balance
  if (boltsSpent > 0) {
    const { error: txError } = await supabase
      .from('bolts_transactions')
      .insert([
        {
          profile_id: profileId,
          amount: -boltsSpent,
          type: 'debit',
          order_id: orderId,
          description: `Spent ${boltsSpent} Bolts for discount on order ${orderId}`,
        }
      ]);

    if (txError) {
      console.error('Failed to insert debit transaction:', txError.message);
    } else {
      // Deduct from profile
      const { data: currentProf } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', profileId)
        .single();
      
      const newBal = Math.max(0, (currentProf?.wallet_balance || 0) - boltsSpent);
      await supabase
        .from('profiles')
        .update({ wallet_balance: newBal, updated_at: new Date().toISOString() })
        .eq('id', profileId);
    }
  }

  return order;
}

/**
 * Simulates updating order status for testing the flow (e.g. Processing -> Shipped -> Delivered)
 */
export async function simulateOrderStatus(orderId: string, nextStatus: 'Shipped' | 'Delivered' | 'Completed') {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const updates: any = { status: nextStatus, updated_at: new Date().toISOString() };
  if (nextStatus === 'Delivered') {
    updates.delivered_at = new Date().toISOString();
  }

  const { data: order, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Database order status update failed:', error.message);
    throw new Error(`Failed to update order status: ${error.message}`);
  }

  return order;
}

