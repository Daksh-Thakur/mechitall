import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;

    // Validation: Missing fields
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required parameters: razorpay_payment_id, razorpay_order_id, and razorpay_signature are required." },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { error: "Razorpay credentials are not configured on the server." },
        { status: 500 }
      );
    }

    // Verify signature using SHA256 HMAC
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.warn("Razorpay payment signature mismatch!");
      return NextResponse.json(
        { error: "Payment verification failed: Signature mismatch." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Failed to verify payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify Razorpay payment." },
      { status: 500 }
    );
  }
}
