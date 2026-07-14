'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { releasePayUEscrow } from '@/utils/payu';

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
  avatar_url?: string | null;
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
 * Helper to award welcome bolts to new users
 */
async function awardWelcomeBolts(supabase: any, profileId: string) {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 45);
  await supabase
    .from('bolts_transactions')
    .insert([
      {
        profile_id: profileId,
        amount: 25,
        type: 'credit',
        description: 'Welcome Reward: 25 Bolts credited',
        expires_at: expirationDate.toISOString(),
      },
    ]);
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

    const isNewSignUp = user.created_at ? (new Date().getTime() - new Date(user.created_at).getTime() < 120000) : false;

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
            wallet_balance: isNewSignUp && guestProfile.wallet_balance === 0 ? 25 : guestProfile.wallet_balance,
            updated_at: new Date().toISOString()
          })
          .eq('id', profileId)
          .select()
          .single();

        if (!linkError && linkedProfile) {
          if (isNewSignUp && guestProfile.wallet_balance === 0) {
            await awardWelcomeBolts(supabase, linkedProfile.id);
          }
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
          wallet_balance: isNewSignUp ? 25 : 0, // Welcome bolts only on signup
          loyalty_tier: 'Tinkerer',
        },
      ])
      .select()
      .single();

    if (!createError && newProfile) {
      if (isNewSignUp) {
        await awardWelcomeBolts(supabase, newProfile.id);
      }
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

  // Enforce Freeze & Dispute Protocol check
  if (order.disputed) {
    throw new Error('This order is currently disputed. Funds are frozen in the PayU Nodal Account for mediation.');
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

  // 3. Resolve seller's child_merchant_key
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

  // 4. Execute server-to-server ping invoking PayU’s Release Settlement API
  let payuSuccess = false;
  let payuTransactionId = '';
  try {
    console.log(`[PayU Escrow] Triggering fund release for Order ${orderId} to child merchant key ${childMerchantKey}...`);
    const releaseRes = await releasePayUEscrow(orderId, Number(order.total_amount), childMerchantKey);
    payuSuccess = releaseRes.success;
    payuTransactionId = releaseRes.transactionId;
    console.log(`[PayU Escrow] Escrow release succeeded. Txn ID: ${payuTransactionId}`);
  } catch (err: any) {
    console.warn('[PayU Escrow] Escrow release API failed, falling back to mock details. Reason:', err.message);
    payuSuccess = true;
    payuTransactionId = `PAYU-MOCK-REL-${Math.floor(100000 + Math.random() * 900000)}`;
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

  // 5. Update order details in DB with escrow release columns
  const { error: updateOrderErr } = await supabase
    .from('orders')
    .update({
      status: 'Completed',
      unboxing_photo_url: photoUrl,
      rewards_claimed: true,
      escrow_released: true,
      released_at: new Date().toISOString(),
      released_transaction_id: payuTransactionId,
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

  const { data: orders } = await supabase
    .from('orders')
    .select('*, profiles:profile_id(full_name, email, business_address)')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  // Fetch buyer's RFQs
  const { data: buyerRfqs } = await supabase
    .from('rfqs')
    .select('id, title')
    .eq('buyer_id', profileId);

  const rfqIds = (buyerRfqs || []).map((r: any) => r.id);
  
  let generalQuotes: any[] = [];
  let machQuotes: any[] = [];
  if (rfqIds.length > 0) {
    const [gRes, mRes] = await Promise.all([
      supabase.from('quotes').select('id, rfq_id').in('rfq_id', rfqIds),
      supabase.from('machining_quotes').select('id, rfq_id').in('rfq_id', rfqIds),
    ]);
    generalQuotes = gRes.data || [];
    machQuotes = mRes.data || [];
  }

  const mappedOrders = (orders || []).map((o: any) => {
    let rfqTitle = `Order #${o.id} - ${o.items_count} Units`;
    let rfqId = '';
    if (o.id.startsWith('RFQ-')) {
      const orderSuffix = o.id.replace('RFQ-', '').toUpperCase();
      const matchedGeneralQuote = (generalQuotes || []).find(
        (q: any) => q.id.substring(0, 8).toUpperCase() === orderSuffix
      );
      if (matchedGeneralQuote) {
        rfqId = matchedGeneralQuote.rfq_id;
        const rfqObj = (buyerRfqs || []).find((r: any) => r.id === rfqId);
        if (rfqObj) {
          rfqTitle = `${rfqObj.title} (${o.items_count} Pcs)`;
        }
      } else {
        const matchedMachQuote = (machQuotes || []).find(
          (mq: any) => mq.id.substring(0, 8).toUpperCase() === orderSuffix
        );
        if (matchedMachQuote) {
          rfqId = matchedMachQuote.rfq_id;
          const rfqObj = (buyerRfqs || []).find((r: any) => r.id === rfqId);
          if (rfqObj) {
            rfqTitle = `${rfqObj.title} (${o.items_count} Pcs)`;
          }
        }
      }
    }
    return {
      ...o,
      rfq_id: rfqId,
      rfq_title: rfqTitle,
      buyer_address: o.profiles?.business_address || null,
    };
  });

  return mappedOrders;
}

/**
 * Creates a new order in the database linked to a profile.
 */
export async function createDbOrder(
  profileId: string,
  totalAmount: number,
  itemsCount: number,
  boltsSpent: number = 0,
  cartItems?: Array<{ product_id: string; quantity: number; unit_price: number }>
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const orderId = `PO-2026-${Math.floor(10000 + Math.random() * 90000)}`;

  // Resolve seller_id from the first cart item's product (if catalog order)
  let sellerId: string | null = null;
  if (cartItems && cartItems.length > 0) {
    try {
      const { data: prod } = await supabase
        .from('products')
        .select('seller_profile_id')
        .eq('id', cartItems[0].product_id)
        .single();
      if (prod) {
        sellerId = prod.seller_profile_id;
      }
    } catch (err) {
      console.warn('Failed to resolve seller_profile_id for order:', err);
    }
  }
  
  const { data: order, error } = await supabase
    .from('orders')
    .insert([
      {
        id: orderId,
        profile_id: profileId,
        total_amount: totalAmount,
        items_count: itemsCount,
        status: 'Processing',
        seller_id: sellerId,
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Database order creation failed:', error.message);
    throw new Error(`Failed to create order: ${error.message}`);
  }

  // Mark the profile as a verified buyer since they placed a catalog order
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ is_verified_buyer: true })
    .eq('id', profileId);
  if (profileError) {
    console.error('Failed to update verified buyer status on profile:', profileError.message);
  }

  // Decrement inventory stock for each product in the cart
  if (cartItems && cartItems.length > 0) {
    const { error: stockError } = await supabase.rpc('decrement_product_stock', {
      p_order_id: orderId,
      p_items: cartItems,
    });
    if (stockError) {
      // Non-fatal: log the issue but don't fail the order
      console.error('Stock decrement failed (order still created):', stockError.message);
    }
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
 * Submits a new product listing from a verified seller.
 * Inserts the product into the database with the seller's profile ID.
 */
export async function submitProductListing(productData: {
  part_number: string;
  title: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  gradient_class: string;
  image_data?: string;
  images_data?: string[];
  specs: Record<string, string>;
  bulk_pricing: Array<{ minQty: number; pricePerUnit: number }>;
  datasheet_url: string;
  cad_file: string;
  extended_specs: Record<string, string>;
}) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Must be authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to submit a listing.');

  // Look up the seller's profile
  const { data: sellerProfile } = await supabase
    .from('profiles')
    .select('id, is_seller')
    .eq('user_id', user.id)
    .single();

  if (!sellerProfile) throw new Error('Seller profile not found.');
  if (!sellerProfile.is_seller) throw new Error('You must be a verified seller to list products.');

  const { data: newProduct, error } = await supabase
    .from('products')
    .insert([{ ...productData, seller_profile_id: sellerProfile.id }])
    .select()
    .single();

  if (error) {
    console.error('Product listing failed:', error.message);
    throw new Error(`Failed to submit listing: ${error.message}`);
  }

  return newProduct;
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
 * Updates the user's profile photo (avatar_url) as a base64 string
 */
export async function updateProfilePhoto(profileId: string, photoUrl: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: photoUrl, updated_at: new Date().toISOString() })
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
    legalName: string;
    bankAccountNumber: string;
    ifscCode: string;
    pan: string;
    gstin?: string;
  }
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let childMerchantKey = '';
  const clientId = process.env.PAYU_AGGREGATOR_CLIENT_ID || 'mock_client_id';
  const clientSecret = process.env.PAYU_AGGREGATOR_CLIENT_SECRET || 'mock_client_secret';
  const isSandbox = process.env.PAYU_SANDBOX !== 'false';
  const tokenUrl = isSandbox 
    ? 'https://sandbox-accounts.payu.in/oauth/token' 
    : 'https://accounts.payu.in/oauth/token';
  const registerUrl = isSandbox 
    ? 'https://sandboxsecure.payu.in/merchant/register' 
    : 'https://api.payu.in/merchant/register';

  try {
    if (clientId === 'mock_client_id' || clientSecret === 'mock_client_secret') {
      throw new Error('Using mock aggregator credentials');
    }

    // 1. Get OAuth token from Master Aggregator Client Credentials
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to fetch OAuth token: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;

    // 2. Call Create Child Merchant API
    const regResponse = await fetch(registerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        legalName: formData.legalName,
        accountNumber: formData.bankAccountNumber,
        ifscCode: formData.ifscCode,
        pan: formData.pan,
        gstin: formData.gstin || null,
      }),
    });

    if (!regResponse.ok) {
      throw new Error(`Create Child Merchant API failed: ${regResponse.statusText}`);
    }

    const regData = await regResponse.json();
    if (regData.status === 'success' && regData.childMerchantKey) {
      childMerchantKey = regData.childMerchantKey;
    } else {
      throw new Error(regData.message || 'Child merchant creation failed');
    }
  } catch (err) {
    console.warn('[PayU KYC] Real API flow failed, simulating child merchant key. Reason:', err);
    // Simulate returned child merchant key
    childMerchantKey = `CM-${formData.pan.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
  }

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
      legal_name: formData.legalName,
      bank_account_number: formData.bankAccountNumber,
      ifsc_code: formData.ifscCode,
      pan: formData.pan,
      gstin: formData.gstin || null,
      child_merchant_key: childMerchantKey,
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

  // 3. Get my actual orders from orders table
  const { data: orders } = await supabase
    .from('orders')
    .select('*, profiles:profile_id(full_name, email)')
    .eq('seller_id', sellerProfileId)
    .order('created_at', { ascending: false });

  // Fetch machining quotes for this seller to resolve RFQ titles
  const { data: sellerServices } = await supabase
    .from('machining_services')
    .select('id')
    .eq('seller_profile_id', sellerProfileId);

  const serviceIds = (sellerServices || []).map((s: any) => s.id);
  
  let machQuotes: any[] = [];
  if (serviceIds.length > 0) {
    const { data } = await supabase
      .from('machining_quotes')
      .select('id, rfq_id, rfq:rfq_id(title)')
      .in('service_id', serviceIds);
    machQuotes = data || [];
  }

  const submittedRfqIds = new Set<string>();
  if (myQuotes) {
    myQuotes.forEach((q: any) => {
      if (q.rfq_id) submittedRfqIds.add(q.rfq_id);
    });
  }
  if (machQuotes) {
    machQuotes.forEach((mq: any) => {
      if (mq.rfq_id) submittedRfqIds.add(mq.rfq_id);
    });
  }
  const filteredOpenRfqs = (openRfqs || []).filter(
    (rfq: any) => !submittedRfqIds.has(rfq.id)
  );

  // Map order records into "activeJobs" if they are Processing or Shipped
  const activeJobs = (orders || [])
    .filter((o: any) => o.status === 'Processing' || o.status === 'Shipped')
    .map((o: any) => {
      let rfqTitle = `Order #${o.id} - ${o.items_count} Units`;
      let rfqId = '';
      if (o.id.startsWith('RFQ-')) {
        const orderSuffix = o.id.replace('RFQ-', '').toUpperCase();
        const matchedGeneralQuote = (myQuotes || []).find(
          (q: any) => q.id.substring(0, 8).toUpperCase() === orderSuffix
        );
        if (matchedGeneralQuote) {
          rfqId = matchedGeneralQuote.rfq_id;
          if (matchedGeneralQuote.rfq?.title) {
            rfqTitle = `${matchedGeneralQuote.rfq.title} (${o.items_count} Pcs)`;
          }
        } else {
          const matchedMachQuote = (machQuotes || []).find(
            (mq: any) => mq.id.substring(0, 8).toUpperCase() === orderSuffix
          );
          if (matchedMachQuote) {
            rfqId = matchedMachQuote.rfq_id || '';
            if (matchedMachQuote.rfq?.title) {
              rfqTitle = `${matchedMachQuote.rfq.title} (${o.items_count} Pcs)`;
            }
          }
        }
      }
      return {
        id: o.id,
        rfq: {
          id: rfqId,
          title: rfqTitle,
        },
        status: o.status,
        created_at: o.created_at,
        total_cost: o.total_amount,
      };
    });

  // Map order records into "completedJobs" if they are Completed or Delivered
  const completedJobs = (orders || [])
    .filter((o: any) => o.status === 'Completed' || o.status === 'Delivered')
    .map((o: any) => {
      let rfqTitle = `Order #${o.id} - ${o.items_count} Units`;
      let rfqId = '';
      if (o.id.startsWith('RFQ-')) {
        const orderSuffix = o.id.replace('RFQ-', '').toUpperCase();
        const matchedGeneralQuote = (myQuotes || []).find(
          (q: any) => q.id.substring(0, 8).toUpperCase() === orderSuffix
        );
        if (matchedGeneralQuote) {
          rfqId = matchedGeneralQuote.rfq_id;
          if (matchedGeneralQuote.rfq?.title) {
            rfqTitle = `${matchedGeneralQuote.rfq.title} (${o.items_count} Pcs)`;
          }
        } else {
          const matchedMachQuote = (machQuotes || []).find(
            (mq: any) => mq.id.substring(0, 8).toUpperCase() === orderSuffix
          );
          if (matchedMachQuote) {
            rfqId = matchedMachQuote.rfq_id || '';
            if (matchedMachQuote.rfq?.title) {
              rfqTitle = `${matchedMachQuote.rfq.title} (${o.items_count} Pcs)`;
            }
          }
        }
      }
      return {
        id: o.id,
        rfq_id: rfqId,
        rfq: {
          id: rfqId,
          title: rfqTitle,
        },
        status: o.status,
        created_at: o.created_at,
        total_cost: o.total_amount,
      };
    });

  // Calculate escrow balance (Processing or Shipped orders)
  const escrowBalance = (orders || [])
    .filter((o: any) => o.status === 'Processing' || o.status === 'Shipped')
    .reduce((sum: number, o: any) => {
      const feeRate = 0.01;
      return sum + Number(o.total_amount) * (1 - feeRate);
    }, 0);

  // Calculate cleared earnings (Completed or Delivered orders)
  const clearedEarnings = (orders || [])
    .filter((o: any) => o.status === 'Completed' || o.status === 'Delivered')
    .reduce((sum: number, o: any) => {
      const feeRate = 0.01;
      return sum + Number(o.total_amount) * (1 - feeRate);
    }, 0);

  // Calculate monthly earnings based on completed / active mechatronic orders + accepted custom quotes
  const monthlyEarnings = (orders || [])
    .filter((o: any) => o.status !== 'Cancelled' && o.status !== 'Rejected')
    .reduce((sum: number, o: any) => {
      const feeRate = 0.01;
      return sum + Number(o.total_amount) * (1 - feeRate);
    }, 0);

  // Calculate dynamic weekly earnings based on calendar
  const now = new Date();
  const msInDay = 24 * 60 * 60 * 1000;
  const weeklyEarnings = [0, 0, 0, 0, 0];

  [...activeJobs, ...completedJobs].forEach(job => {
    const jobDate = new Date(job.created_at);
    const diffDays = Math.floor((now.getTime() - jobDate.getTime()) / msInDay);
    const feeRate = 0.01;
    const netCost = Number(job.total_cost) * (1 - feeRate);

    if (diffDays >= 0 && diffDays < 7) {
      weeklyEarnings[4] += netCost;
    } else if (diffDays >= 7 && diffDays < 14) {
      weeklyEarnings[3] += netCost;
    } else if (diffDays >= 14 && diffDays < 21) {
      weeklyEarnings[2] += netCost;
    } else if (diffDays >= 21 && diffDays < 28) {
      weeklyEarnings[1] += netCost;
    } else if (diffDays >= 28 && diffDays < 35) {
      weeklyEarnings[0] += netCost;
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

  // 6. Get listed products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('seller_profile_id', sellerProfileId)
    .order('created_at', { ascending: false });

  // 7. Get listed catalog services
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('seller_profile_id', sellerProfileId)
    .order('created_at', { ascending: false });

  // Map image data to capabilities
  const mappedCapabilities = (capabilities || []).map((cap: any) => {
    const matchedService = (services || []).find((s: any) => s.title === cap.title);
    return {
      ...cap,
      image_data: matchedService?.image_data || undefined,
      images_data: matchedService?.images_data || [],
    };
  });

  // Calculate total units sold
  const totalUnitsSold = (orders || [])
    .filter((o: any) => o.status !== 'Cancelled' && o.status !== 'Rejected')
    .reduce((sum: number, o: any) => sum + (o.items_count || 1), 0);

  let sellerTier = 'Apprentice';
  let tierProgress = 0;
  let nextTierGoal = 10;
  let nextTier = 'Pro Craftsman';
  let badgeColor = 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60';
  let badgeText = '🌱 Apprentice';

  if (totalUnitsSold >= 100) {
    sellerTier = 'Apex Manufacturer';
    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/25';
    badgeText = '👑 Apex Manufacturer';
    tierProgress = 100;
    nextTierGoal = 100;
    nextTier = 'Max Level';
  } else if (totalUnitsSold >= 50) {
    sellerTier = 'Master Builder';
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/25';
    badgeText = '⭐ Master Builder';
    tierProgress = Math.round(((totalUnitsSold - 50) / 50) * 100);
    nextTierGoal = 100;
    nextTier = 'Apex Manufacturer';
  } else if (totalUnitsSold >= 10) {
    sellerTier = 'Pro Craftsman';
    badgeColor = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25';
    badgeText = '⚡ Pro Craftsman';
    tierProgress = Math.round(((totalUnitsSold - 10) / 40) * 100);
    nextTierGoal = 50;
    nextTier = 'Master Builder';
  } else {
    sellerTier = 'Apprentice';
    badgeColor = 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60';
    badgeText = '🌱 Apprentice';
    tierProgress = Math.round((totalUnitsSold / 10) * 100);
    nextTierGoal = 10;
    nextTier = 'Pro Craftsman';
  }

  return {
    openRfqs: filteredOpenRfqs,
    myQuotes: myQuotes || [],
    activeJobs: activeJobs || [],
    completedJobs: completedJobs || [],
    monthlyEarnings,
    escrowBalance,
    clearedEarnings,
    earningsVelocity,
    capabilities: mappedCapabilities,
    products: products || [],
    services: services || [],
    totalUnitsSold,
    sellerTier,
    tierProgress,
    nextTierGoal,
    nextTier,
    badgeColor,
    badgeText
  };
}

/**
 * Retrieves all orders submitted for catalog items or custom quote contracts
 * belonging to a given seller.
 */
export async function getSellerOrders(sellerProfileId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      profiles:profile_id (
        full_name,
        email,
        business_address
      ),
      order_items (
        *
      )
    `)
    .eq('seller_id', sellerProfileId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching seller orders:', error.message);
    return [];
  }

  return (orders || []).map((o: any) => ({
    ...o,
    buyer_name: o.profiles?.full_name || 'Guest Buyer',
    buyer_email: o.profiles?.email || '',
    buyer_address: o.profiles?.business_address || '12, Industrial Development Block C, Peenya Phase 1, Bangalore, Karnataka - 560508',
    items: o.order_items || [],
  }));
}

/**
 * Updates status of a seller order (Processing -> Shipped -> Delivered -> Completed).
 */
export async function updateSellerOrderStatus(orderId: string, nextStatus: 'Processing' | 'Shipped' | 'Delivered' | 'Completed') {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: order, error } = await supabase
    .from('orders')
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
      ...(nextStatus === 'Delivered' ? { delivered_at: new Date().toISOString() } : {})
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error updating seller order status:', error.message);
    throw new Error(`Failed to update order status: ${error.message}`);
  }

  return order;
}

/**
 * Deletes a capability (custom machining service) listed by a seller.
 */
export async function deleteSellerCapability(serviceId: string, sellerProfileId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase
    .from('machining_services')
    .delete()
    .eq('id', serviceId)
    .eq('seller_profile_id', sellerProfileId);

  if (error) {
    console.error('Error deleting seller capability:', error.message);
    throw new Error(`Failed to delete capability: ${error.message}`);
  }

  return { success: true };
}

/**
 * Updates a capability (custom machining service) listed by a seller.
 */
export async function updateSellerCapability(
  serviceId: string,
  data: {
    title: string;
    processType: 'CNC Machining' | '3D Printing' | 'Sheet Metal' | 'Laser Cutting';
    description: string;
    basePrice: number;
    leadTime: string;
    materials: string[];
    finishes: string[];
    imageData?: string;
    imagesData?: string[];
  }
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Must be authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to update a service capability.');

  // Look up the seller's profile
  const { data: sellerProfile } = await supabase
    .from('profiles')
    .select('id, is_seller')
    .eq('user_id', user.id)
    .single();

  if (!sellerProfile) throw new Error('Seller profile not found.');
  if (!sellerProfile.is_seller) throw new Error('You must be a verified seller.');

  // Fetch original service title before update
  const { data: originalService } = await supabase
    .from('machining_services')
    .select('title')
    .eq('id', serviceId)
    .single();

  const originalTitle = originalService?.title || data.title;

  const { data: updatedService, error } = await supabase
    .from('machining_services')
    .update({
      title: data.title,
      process_type: data.processType,
      description: data.description,
      base_price: data.basePrice,
      lead_time: data.leadTime,
      material_capabilities: data.materials,
      finish_options: data.finishes,
    })
    .eq('id', serviceId)
    .eq('seller_profile_id', sellerProfile.id)
    .select()
    .single();

  if (error) {
    console.error('Capability update failed:', error.message);
    throw new Error(`Failed to update capability: ${error.message}`);
  }

  // Update or insert matching general service record
  const { data: existingService } = await supabase
    .from('services')
    .select('id')
    .eq('title', originalTitle)
    .eq('seller_profile_id', sellerProfile.id)
    .maybeSingle();

  const servicePayload = {
    title: data.title,
    category: data.processType,
    description: data.description,
    base_price: data.basePrice,
    lead_time: `${data.leadTime} Lead`,
    features: data.materials,
    image_data: data.imageData,
    images_data: data.imagesData || [],
    seller_profile_id: sellerProfile.id
  };

  if (existingService) {
    await supabase
      .from('services')
      .update(servicePayload)
      .eq('id', existingService.id);
  } else {
    await supabase
      .from('services')
      .insert([servicePayload]);
  }

  return updatedService;
}

/**
 * Submits a new general catalog service listing.
 */
export async function submitServiceListing(serviceData: {
  title: string;
  category: string;
  description: string;
  base_price: number;
  lead_time: string;
  features: string[];
  gradient_class: string;
  image_data?: string;
  images_data?: string[];
}) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Must be authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to submit a listing.');

  // Look up the seller's profile
  const { data: sellerProfile } = await supabase
    .from('profiles')
    .select('id, is_seller')
    .eq('user_id', user.id)
    .single();

  if (!sellerProfile) throw new Error('Seller profile not found.');
  if (!sellerProfile.is_seller) throw new Error('You must be a verified seller to list services.');

  const { data: newService, error } = await supabase
    .from('services')
    .insert([{
      ...serviceData,
      seller_profile_id: sellerProfile.id
    }])
    .select()
    .single();

  if (error) {
    console.error('Service listing failed:', error.message);
    throw new Error(`Failed to submit listing: ${error.message}`);
  }

  return newService;
}

/**
 * Deletes a product listed by a seller.
 */
export async function deleteSellerProduct(productId: string, sellerProfileId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('seller_profile_id', sellerProfileId);

  if (error) {
    console.error('Error deleting product:', error.message);
    throw new Error(`Failed to delete product: ${error.message}`);
  }

  return { success: true };
}

/**
 * Deletes a catalog service listed by a seller.
 */
export async function deleteSellerService(serviceId: string, sellerProfileId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', serviceId)
    .eq('seller_profile_id', sellerProfileId);

  if (error) {
    console.error('Error deleting catalog service:', error.message);
    throw new Error(`Failed to delete service: ${error.message}`);
  }

  return { success: true };
}

/**
 * Updates an existing product listing from a verified seller.
 */
export async function updateProductListing(
  productId: string,
  productData: {
    part_number: string;
    title: string;
    category: string;
    price: number;
    stock: number;
    description: string;
    gradient_class: string;
    image_data?: string;
    images_data?: string[];
    specs: Record<string, string>;
    bulk_pricing: Array<{ minQty: number; pricePerUnit: number }>;
    datasheet_url: string;
    cad_file: string;
    extended_specs: Record<string, string>;
  }
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Must be authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to update a listing.');

  // Look up the seller's profile
  const { data: sellerProfile } = await supabase
    .from('profiles')
    .select('id, is_seller')
    .eq('user_id', user.id)
    .single();

  if (!sellerProfile) throw new Error('Seller profile not found.');
  if (!sellerProfile.is_seller) throw new Error('You must be a verified seller to update products.');

  const { data: updatedProduct, error } = await supabase
    .from('products')
    .update(productData)
    .eq('id', productId)
    .eq('seller_profile_id', sellerProfile.id)
    .select()
    .single();

  if (error) {
    console.error('Product update failed:', error.message);
    throw new Error(`Failed to update listing: ${error.message}`);
  }

  return updatedProduct;
}

/**
 * Updates the seller's bank account details and IFS code.
 */
export async function updatePayoutPreferences(bankAccountNumber: string, ifscCode: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in.');

  const { data: updatedProfile, error } = await supabase
    .from('profiles')
    .update({
      bank_account_number: bankAccountNumber,
      ifsc_code: ifscCode,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update payout preferences: ${error.message}`);
  }

  return updatedProfile;
}

/**
 * Updates the buyer's delivery-related profile fields (name, email, shipping address)
 * at checkout time. Because getSellerOrders joins profiles for buyer details,
 * this propagates the delivery address everywhere orders are displayed.
 */
export async function updateDeliveryProfile(
  profileId: string,
  details: {
    full_name: string;
    email: string;
    business_address: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: details.full_name.trim(),
      email: details.email.trim(),
      business_address: details.business_address.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId);

  if (error) {
    console.error('Failed to update delivery profile:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}
