'use client';
import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, Mail, Send } from 'lucide-react';
import { sendSupportEmail } from '@/app/actions/support';

export default function SupportTab(props: any) {
  const { showToast } = props;
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      showToast('Please fill out all fields.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await sendSupportEmail({
        subject: subject.trim(),
        message: message.trim(),
      });

      if (res.success) {
        setSent(true);
        setSubject('');
        setMessage('');
        showToast('Complaint sent to support@mechitall.com!', 'success');
      } else {
        showToast(res.error || 'Failed to send complaint.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An unexpected error occurred.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-6 shadow-sm space-y-6">
      <div>
        <h2 className="text-base font-black text-white tracking-tight uppercase">Customer Support Desk</h2>
        <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
          Get assistance directly from our mechatronic engineers. All complaints are automatically dispatched to our official support mailbox.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex gap-3 p-4 bg-zinc-900 border border-zinc-700/60 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white">Email Automation</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5 font-semibold">
                Your report goes directly to <strong className="text-[#00D0F5] font-mono">support@mechitall.com</strong> for rapid review.
              </p>
            </div>
          </div>

          <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl space-y-2 text-[10px] text-zinc-400 leading-relaxed font-semibold">
            <span className="block font-black text-zinc-300 uppercase tracking-wider font-mono">Support Policy</span>
            <p>• CAD file audits are completed within 4 hours.</p>
            <p>• Payout and transaction queries are settled in T+1 business days.</p>
            <p>• All mechatronic assembly designs are protected under Strict IPNDA protocols.</p>
          </div>
        </div>

        {sent ? (
          <div className="flex flex-col items-center justify-center p-6 bg-zinc-900/30 border border-zinc-800 rounded-xl text-center space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Complaint Sent Successfully</h4>
              <p className="text-[10px] text-zinc-500 mt-1 max-w-xs font-semibold leading-relaxed">
                The automated relay has forwarded your report directly to our official support email. Our desk team will contact you back soon.
              </p>
            </div>
            <button
              onClick={() => setSent(false)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border border-zinc-700/60"
            >
              Send Another Complaint
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. CAD model dimension discrepancy"
                className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#00D0F5] transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-550 uppercase">Complaint details</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or feedback in detail..."
                className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#00D0F5] resize-none transition-colors"
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg text-xs font-bold cursor-pointer transition-all bg-[#00D0F5] hover:bg-[#00e5ff] text-zinc-950 font-black uppercase tracking-wider shadow flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending Complaint...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Support Mail</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
