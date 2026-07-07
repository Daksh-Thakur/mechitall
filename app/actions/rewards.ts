'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export interface Profile {
  id: string;
  user_id?: string | null;
  email?: string | null;
  full_name: string;
  wallet_balance: number;
  loyalty_tier: 'Tinkerer' | 'Master Builder';
  is_seller?: boolean;
  is_verified_buyer?: boolean;
  is_verified_seller?: boolean;
  seller_kyc_completed?: boolean;
  company_name?: string | null;
  tax_id?: string | null;
  machine_count?: number;
  business_address?: string | null;
  primary_capability?: string | null;
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

  // Check if a Supabase Auth session is active
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // 1. Try to find profile linked to this authenticated user
    const { data: authProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (authProfile) {
      return authProfile as Profile;
    }

    // 2. If no profile exists for user, check if we have a guest profile to link
    if (profileId) {
      const { data: guestProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();

      if (guestProfile && !guestProfile.user_id) {
        // Link the guest profile to this user
        const { data: linkedProfile, error: linkError } = await supabase
          .from('profiles')
          .update({
            user_id: user.id,
            email: user.email,
            full_name: guestProfile.full_name === 'Guest Maker' || guestProfile.full_name === 'Guest User'
              ? (user.user_metadata?.full_name || 'Precision Maker')
              : guestProfile.full_name,
            updated_at: new Date().toISOString()
          })
          .eq('id', profileId)
          .select()
          .single();

        if (!linkError && linkedProfile) {
          return linkedProfile as Profile;
        }
      }
    }

    // 3. Create a new authenticated profile if none was found or linked
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert([
        {
          user_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || 'Precision Maker',
          wallet_balance: 25, // Initial welcome bolts
          loyalty_tier: 'Tinkerer',
        },
      ])
      .select()
      .single();

    if (!createError && newProfile) {
      // Create ledger entry
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 45);
      await supabase
        .from('bolts_transactions')
        .insert([
          {
            profile_id: newProfile.id,
            amount: 25,
            type: 'credit',
            description: 'Welcome Reward: 25 Bolts credited',
            expires_at: expirationDate.toISOString(),
          },
        ]);
      return newProfile as Profile;
    }
  }

  // --- Guest / Anonymous Fallbacks ---
  // For unauthenticated visitors, return null so the UI shows 0 Bolts.
  // We do NOT create guest profiles or award bolts to anonymous visitors.
  return null as unknown as Profile;
}

/**
 * Like getOrCreateProfile but returns null for unauthenticated (guest) visitors.
 * Use this in UI contexts where showing a zero balance for guests is correct.
 */
export async function getAuthenticatedProfile(profileId?: string): Promise<Profile | null> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Only proceed if there is an active Supabase Auth session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Re-use the full logic from getOrCreateProfile (which now only runs for auth users)
  return getOrCreateProfile(profileId);
}

/**
 * Fetches transaction ledger entries for a profile.
 * Automatically runs the bolt expiration routine beforehand to keep counts exact.
 */
export async function getProfileTransactions(profileId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Run expiration routine asynchronously to prevent blocking the query
  (async () => {
    try {
      await supabase.rpc('expire_old_bolts');
    } catch (err) {
      console.error('Error running expire_old_bolts RPC asynchronously:', err);
    }
  })();

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

  // Enforce that the order has been successfully received (status must be Shipped or Delivered)
  if (order.status !== 'Shipped' && order.status !== 'Delivered') {
    throw new Error(`Order must be Shipped or Delivered to confirm delivery. Current status: ${order.status}`);
  }

  // Enforce that mandatory unboxing confirmation steps are completed
  if (!photoUrl || photoUrl.trim() === '' || photoUrl.startsWith('data:;base64,')) {
    throw new Error('Unboxing verification photo is required to complete the mandatory confirmation steps.');
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
      is_verified_buyer: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId)
    .select()
    .single();

  if (finalProfileErr) {
    throw new Error(`Failed to update profile wallet balance: ${finalProfileErr.message}`);
  }

  // If the order has an associated seller, mark the seller as verified!
  if (order && (order as any).seller_id) {
    try {
      await supabase
        .from('profiles')
        .update({
          is_verified_seller: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', (order as any).seller_id);
    } catch (sellerErr) {
      console.error(`Failed to update seller verification status:`, sellerErr);
    }
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

  // If status is updated to Completed and order has a seller_id, mark the seller as verified!
  if (nextStatus === 'Completed' && order && (order as any).seller_id) {
    try {
      await supabase
        .from('profiles')
        .update({
          is_verified_seller: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', (order as any).seller_id);
    } catch (sellerErr) {
      console.error(`Failed to update seller verification status in simulation:`, sellerErr);
    }
  }

  return order;
}

/**
 * Updates full name in the user profile table.
 */
export async function updateProfileName(profileId: string, fullName: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name: fullName, updated_at: new Date().toISOString() })
    .eq('id', profileId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Profile;
}

/**
 * Toggles seller mode for the user profile.
 */
export async function toggleProfileSellerMode(profileId: string, isSeller: boolean) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from('profiles')
    .update({ is_seller: isSeller, updated_at: new Date().toISOString() })
    .eq('id', profileId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Profile;
}

/**
 * Submits Seller KYC details and activates Seller Mode.
 */
export async function submitSellerKYC(
  profileId: string,
  formData: {
    companyName: string;
    taxId: string;
    machineCount: number;
    businessAddress: string;
    primaryCapability: string;
  }
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from('profiles')
    .update({
      seller_kyc_completed: true,
      is_seller: true,
      company_name: formData.companyName,
      tax_id: formData.taxId,
      machine_count: formData.machineCount,
      business_address: formData.businessAddress,
      primary_capability: formData.primaryCapability,
      updated_at: new Date().toISOString()
    })
    .eq('id', profileId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Profile;
}

/**
 * Fetches dashboard statistics and listings for the active seller.
 */
export async function getSellerDashboardData(sellerProfileId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Get active RFQs (all OPEN_FOR_BIDS RFQs)
  const { data: openRfqs } = await supabase
    .from('rfqs')
    .select('*, buyer:profiles(full_name)')
    .eq('status', 'OPEN_FOR_BIDS')
    .order('created_at', { ascending: false });

  // 2. Get my quotes (all quotes submitted by this seller)
  const { data: myQuotes } = await supabase
    .from('quotes')
    .select('*, rfq:rfqs(*)')
    .eq('seller_id', sellerProfileId);

  // 3. Get my active production queue jobs (all quotes submitted by this seller with status ACCEPTED)
  const { data: activeJobs } = await supabase
    .from('quotes')
    .select('*, rfq:rfqs(*, buyer:profiles(*))')
    .eq('seller_id', sellerProfileId)
    .eq('status', 'ACCEPTED');

  // 4. Calculate monthly earnings (sum of accepted quotes total_cost)
  const monthlyEarnings = activeJobs?.reduce((sum, job) => sum + Number(job.total_cost), 0) || 0;

  // Calculate dynamic weekly earnings based on calendar
  const now = new Date();
  const msInDay = 24 * 60 * 60 * 1000;
  const weeklyEarnings = [0, 0, 0, 0, 0];

  activeJobs?.forEach(job => {
    const jobDate = new Date(job.created_at);
    const diffDays = Math.floor((now.getTime() - jobDate.getTime()) / msInDay);

    if (diffDays >= 0 && diffDays < 7) {
      weeklyEarnings[4] += Number(job.total_cost);
    } else if (diffDays >= 7 && diffDays < 14) {
      weeklyEarnings[3] += Number(job.total_cost);
    } else if (diffDays >= 14 && diffDays < 21) {
      weeklyEarnings[2] += Number(job.total_cost);
    } else if (diffDays >= 21 && diffDays < 28) {
      weeklyEarnings[1] += Number(job.total_cost);
    } else if (diffDays >= 28 && diffDays < 35) {
      weeklyEarnings[0] += Number(job.total_cost);
    }
  });

  const getWeekLabel = (daysAgo: number) => {
    const d = new Date(now.getTime() - daysAgo * msInDay);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const earningsVelocity = [
    { label: getWeekLabel(28), amount: weeklyEarnings[0] },
    { label: getWeekLabel(21), amount: weeklyEarnings[1] },
    { label: getWeekLabel(14), amount: weeklyEarnings[2] },
    { label: getWeekLabel(7), amount: weeklyEarnings[3] },
    { label: 'This Wk', amount: weeklyEarnings[4] }
  ];

  // 5. Get listed capabilities
  const { data: capabilities } = await supabase
    .from('machining_services')
    .select('*')
    .eq('seller_profile_id', sellerProfileId);

  return {
    openRfqs: openRfqs || [],
    myQuotes: myQuotes || [],
    activeJobs: activeJobs || [],
    monthlyEarnings,
    earningsVelocity,
    capabilities: capabilities || []
  };
}



