import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Load environment variables for Edge/Serverless environments
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const webhookSecret = process.env.SHIPROCKET_WEBHOOK_SECRET;

export async function POST(request: Request) {
  try {
    // 1. Verify that the webhook signature matches our configuration
    const signature = request.headers.get('x-shiprocket-signature');
    if (!webhookSecret || !signature || signature !== webhookSecret) {
      return NextResponse.json({ error: 'Unauthorized signature payload verification failed' }, { status: 401 });
    }

    // 2. Parse the webhook payload
    const payload = await request.json();
    console.log('Shiprocket Webhook received:', payload);

    // Shiprocket status event fields: 'awb' contains the tracking number, and 'current_status' contains the tracking status
    const trackingNumber = payload.awb || payload.tracking_number;
    const currentStatus = (payload.current_status || payload.status || '').toLowerCase();

    if (!trackingNumber) {
      return NextResponse.json({ error: 'Missing tracking number (awb) in payload' }, { status: 400 });
    }

    // Check if we have the database service role key to execute administrative tasks
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Database connection credentials not configured on the server');
      return NextResponse.json({ error: 'Internal Server Configuration Error' }, { status: 500 });
    }

    // Bypassing Row Level Security (RLS) using service_role client for aggregator updates
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 3. Monitor for "DELIVERED" package status
    if (currentStatus === 'delivered') {
      const deliveryTimestamp = new Date().toISOString();

      // Step A: Update order status to 'Delivered' and record the delivered_at timestamp
      // This officially starts our strict 7-day PayU escrow auto-release countdown
      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'Delivered',
          delivered_at: deliveryTimestamp,
          updated_at: deliveryTimestamp,
        })
        .eq('tracking_number', trackingNumber)
        .select('id, profile_id')
        .maybeSingle();

      if (updateError) {
        console.error('Database update failed:', updateError.message);
        return NextResponse.json({ error: 'Order delivery status update failed', details: updateError.message }, { status: 500 });
      }

      if (!updatedOrder) {
        console.warn(`No active order found with tracking number: ${trackingNumber}`);
        return NextResponse.json({ error: `Order with tracking number ${trackingNumber} not found` }, { status: 404 });
      }

      // Step B: Fetch the buyer's email address and profile name
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', updatedOrder.profile_id)
        .maybeSingle();

      if (profileError || !profile || !profile.email) {
        console.error('Failed to retrieve buyer email address associated with the order profile:', profileError);
        return NextResponse.json({ success: true, message: 'Order marked delivered, but buyer profile has no valid email address' });
      }

      // Step C: Trigger transactional email using Resend API (Direct REST Call)
      if (resendApiKey) {
        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: 'MechItAll Sourcing <onboarding@resend.dev>',
              to: [profile.email],
              subject: 'Your custom parts have arrived! 🛠️',
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; rounded: 8px;">
                  <h2 style="color: #10b981; font-weight: bold;">Your custom mechatronic parts have arrived!</h2>
                  <p>Hi <strong>${profile.full_name || 'Builder'}</strong>,</p>
                  <p>Our logistics network registers that your package (Tracking: <strong>${trackingNumber}</strong>) was physically delivered.</p>
                  <p style="background-color: #f4f4f5; padding: 12px; border-left: 4px solid #10b981; font-size: 13px; color: #3f3f46;">
                    "Your custom CNC parts have arrived! Upload a photo of your build to confirm delivery and claim your 50 Bolts."
                  </p>
                  <p>Uploading a verification photo helps release funds from escrow securely and gives you immediate reward points!</p>
                  <div style="margin-top: 24px;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://mechitall.io'}/profile?tab=orders" 
                       style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 13px;">
                      Confirm Delivery
                    </a>
                  </div>
                  <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
                  <p style="font-size: 11px; color: #71717a;">You have received this automated email because a shipment was dispatched to your address.</p>
                </div>
              `,
            }),
          });

          if (!emailResponse.ok) {
            const errBody = await emailResponse.text();
            console.error('Resend API response failure:', errBody);
          } else {
            console.log(`Notification email successfully sent to: ${profile.email}`);
          }
        } catch (resendErr) {
          console.error('Resend API execution error:', resendErr);
        }
      } else {
        console.warn('Resend API key is not configured. Email notification skipped.');
      }

      return NextResponse.json({ success: true, message: 'Order marked delivered and notification processed' });
    }

    // Webhook processed successfully for other status updates
    return NextResponse.json({ success: true, message: `Status event '${currentStatus}' logged` });

  } catch (error: any) {
    console.error('Webhook execution failure:', error);
    return NextResponse.json({ error: 'Webhook processing failed', details: error.message }, { status: 500 });
  }
}
