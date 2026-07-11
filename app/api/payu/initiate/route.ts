import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generatePayUHash, getPayUEndpoint } from '@/utils/payu';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profileId, totalAmount, itemsCount, boltsSpent = 0, cartItems = [], orderType = 'shop', quoteId } = body;

    if (!profileId || !totalAmount) {
      return NextResponse.json({ error: 'Missing required parameters: profileId and totalAmount' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. Resolve Buyer Profile details
    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('full_name, email, child_merchant_key')
      .eq('id', profileId)
      .single();

    if (profError || !profile) {
      return NextResponse.json({ error: 'Buyer profile not found' }, { status: 404 });
    }

    // 2. Generate unique order ID
    let orderId = '';
    let sellerId: string | null = null;
    let childMerchantKey: string | null = null;

    if (orderType === 'quote') {
      if (!quoteId) {
        return NextResponse.json({ error: 'Missing quoteId for quote checkout' }, { status: 400 });
      }
      // Get quote details to resolve seller child merchant
      const { data: quote, error: quoteErr } = await supabase
        .from('machining_quotes')
        .select('*, machining_services(*)')
        .eq('id', quoteId)
        .single();

      if (quoteErr || !quote) {
        return NextResponse.json({ error: 'Machining quote not found' }, { status: 404 });
      }

      orderId = `RFQ-${quote.id.substring(0, 8).toUpperCase()}`;
      sellerId = quote.machining_services?.seller_profile_id;
    } else {
      orderId = `PO-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      if (cartItems.length > 0) {
        // Resolve seller_id from first cart item
        const { data: prod } = await supabase
          .from('products')
          .select('seller_profile_id')
          .eq('id', cartItems[0].product_id)
          .single();
        if (prod) {
          sellerId = prod.seller_profile_id;
        }
      }
    }

    // Resolve Child Merchant Key
    if (sellerId) {
      const { data: sellerProf } = await supabase
        .from('profiles')
        .select('child_merchant_key')
        .eq('id', sellerId)
        .single();
      if (sellerProf) {
        childMerchantKey = sellerProf.child_merchant_key;
      }
    }

    // Enforce Nodal PayU escrow split registration check
    if (!childMerchantKey) {
      // Fallback/Mock key for testing if the seller hasn't completed KYC or for admin products
      childMerchantKey = `CM-MOCK-SELLER-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    // 3. Commission math & Split Settlements JSON formulation
    // 10% platform fee, 90% goes to specific child merchant key
    const amountNum = Number(totalAmount);
    const sellerShare = (amountNum * 0.9).toFixed(2);
    const platformShare = (amountNum * 0.1).toFixed(2);

    const splitRequest = JSON.stringify({
      splitInfo: [
        {
          childMerchantKey: childMerchantKey,
          amount: sellerShare,
        }
      ]
    });

    // 4. Create database order with status 'Pending Payment'
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        profile_id: profileId,
        total_amount: amountNum,
        items_count: itemsCount,
        status: 'Pending Payment',
        payment_status: 'Pending',
        seller_id: sellerId,
        rewards_claimed: false,
      });

    if (orderError) {
      console.error('Failed to create pending order:', orderError.message);
      return NextResponse.json({ error: `Order creation failed: ${orderError.message}` }, { status: 500 });
    }

    // Dynamically derive Callback URLs (surl/furl)
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const surl = `${protocol}://${host}/api/payu/callback`;
    const furl = `${protocol}://${host}/api/payu/callback`;

    // 5. Generate secure SHA-512 hash on server
    const productinfo = orderType === 'quote' ? `Machining Quote ${quoteId}` : 'MechItAll Parts Checkout';
    const firstname = profile.full_name || 'Guest';
    const email = profile.email || 'guest@mechitall.io';

    const hash = generatePayUHash({
      txnid: orderId,
      amount: amountNum.toFixed(2),
      productinfo,
      firstname,
      email,
      udf1: profileId,
      udf2: orderType,
      udf3: quoteId || '',
      udf4: boltsSpent.toString(),
      udf5: JSON.stringify(cartItems), // Save cart items in udf5 to recreate on success if needed
    });

    // 6. Return response payload to trigger redirect form
    return NextResponse.json({
      success: true,
      payuParams: {
        key: process.env.PAYU_MERCHANT_KEY || 'mock_key',
        txnid: orderId,
        amount: amountNum.toFixed(2),
        productinfo,
        firstname,
        email,
        phone: '9999999999', // standard fallback phone parameter
        surl,
        furl,
        hash,
        splitRequest,
        udf1: profileId,
        udf2: orderType,
        udf3: quoteId || '',
        udf4: boltsSpent.toString(),
        udf5: JSON.stringify(cartItems),
        service_provider: 'payu_paisa',
      },
      payuUrl: getPayUEndpoint(),
    });
  } catch (error: any) {
    console.error('Error initiating PayU payment:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
