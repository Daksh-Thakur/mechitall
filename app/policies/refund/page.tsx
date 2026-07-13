import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 font-sans flex flex-col overflow-x-clip">
      <Navbar />
      <main className="flex-1 py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-8 bg-zinc-800 p-8 rounded-2xl border border-zinc-700/60 shadow-xl">
          <h1 className="text-3xl font-bold text-white font-['Space_Grotesk'] border-b border-zinc-700/60 pb-4">Return &amp; Refund Policy</h1>
          <div className="space-y-6 text-sm text-zinc-300 leading-relaxed">
            <h2 className="text-xl font-semibold text-white">1. Inspection Window</h2>
            <p>
              We enforce a strict <strong className="text-white">7-day inspection window</strong> upon delivery. Please inspect all items, components, and custom machined parts immediately upon receipt. Any discrepancies, damages, or missing items must be reported within this period.
            </p>
            <h2 className="text-xl font-semibold text-white">2. Refund Process</h2>
            <p>
              If your return is approved and verified, refunds will be credited back to your original mode of payment. Please allow <strong className="font-mono text-white">5 to 7 business days</strong> for the credited amount to reflect in your account.
            </p>
            <h2 className="text-xl font-semibold text-white">3. Eligibility for Return</h2>
            <p>
              Only standard, off-the-shelf items are eligible for returns. Custom machined parts (RFQ orders) are non-returnable unless they fail to meet the provided CAD specifications or agreed tolerances. 
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
