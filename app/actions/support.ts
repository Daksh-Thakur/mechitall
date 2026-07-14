'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

/**
 * Sends support complaint email directly to the official mail id.
 * Prints email payload to server log (simulating SMTP automation).
 */
export async function sendSupportEmail(data: { 
  subject: string; 
  message: string; 
  attachments?: { name: string; dataUrl: string }[];
}) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Get current user profile details
    const { data: { user } } = await supabase.auth.getUser();
    
    let userEmail = 'Anonymous';
    let fullName = 'Guest User';
    
    if (user) {
      userEmail = user.email || 'No email';
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (profile) {
        fullName = profile.full_name;
      }
    }

    const officialSupportEmail = 'mechitallsupport@gmail.com';

    console.log('==================================================');
    console.log(`[EMAIL AUTOMATION] SENDING COMPLAINT TO ${officialSupportEmail}`);
    console.log(`FROM: ${fullName} <${userEmail}>`);
    console.log(`SUBJECT: ${data.subject}`);
    console.log(`MESSAGE:\n${data.message}`);
    if (data.attachments && data.attachments.length > 0) {
      console.log('ATTACHMENTS:');
      data.attachments.forEach(att => {
        console.log(`- ${att.name} (${att.dataUrl.slice(0, 30)}...)`);
      });
    }
    console.log('==================================================');

    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return { success: true };
  } catch (err: any) {
    console.error('Support email automation error:', err);
    return { success: false, error: err.message || 'Failed to send complaint' };
  }
}
