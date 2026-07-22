import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, currency, receipt, items } = body;

    // Validation: Enforce minimum of 100 paise
    if (!amount || typeof amount !== 'number' || amount < 100) {
      return NextResponse.json(
        { error: "The amount must be at least 100 paise (INR 1.00)" },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay credentials are not configured on the server." },
        { status: 401 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // Resolve seller's linked account (child_merchant_key) to route escrow payments
    let transfers: any[] = [];
    if (items && items.length > 0) {
      try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: prod } = await supabase
          .from('products')
          .select('seller_profile_id')
          .eq('id', items[0].product_id)
          .single();

        if (prod && prod.seller_profile_id) {
          const { data: seller } = await supabase
            .from('profiles')
            .select('child_merchant_key')
            .eq('id', prod.seller_profile_id)
            .single();

          if (seller && seller.child_merchant_key) {
            // Route 90% of the funds to the seller, held in escrow on_hold: true
            const sellerAmount = Math.round(amount * 0.90);
            transfers.push({
              account: seller.child_merchant_key,
              amount: sellerAmount,
              currency: currency || 'INR',
              on_hold: true, // Escrow hold
            });
          }
        }
      } catch (dbErr) {
        console.warn("Soft warning: Failed to resolve seller route transfers:", dbErr);
      }
    }

    const orderOptions: any = {
      amount,
      currency: currency || 'INR',
      receipt: receipt || `receipt_${Date.now()}`
    };

    if (transfers.length > 0) {
      orderOptions.transfers = transfers;
    }

    const order = await razorpay.orders.create(orderOptions);

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });

  } catch (error: any) {
    console.error("Failed to create order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Razorpay order." },
      { status: 500 }
    );
  }
}
