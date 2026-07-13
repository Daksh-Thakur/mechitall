import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 font-sans flex flex-col overflow-x-clip">
      <Navbar />
      <main className="flex-1 py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-8 bg-zinc-800 p-8 rounded-2xl border border-zinc-700/60 shadow-xl">
          <h1 className="text-3xl font-bold text-white font-['Space_Grotesk'] border-b border-zinc-700/60 pb-4">Cancellation Policy</h1>
          <div className="space-y-6 text-sm text-zinc-300 leading-relaxed">
            <h2 className="text-xl font-semibold text-white">1. Ready-to-Ship Inventory</h2>
            <p>
              Orders containing <strong className="text-white">"Ready-to-Ship"</strong> inventory can be cancelled anytime before dispatch. Once the item has been shipped and a tracking number provided, the order cannot be cancelled, but you may initiate a return under our Return &amp; Refund Policy.
            </p>
            <h2 className="text-xl font-semibold text-white">2. Custom Machining (RFQ) Orders</h2>
            <p>
              Due to the unique nature of on-demand manufacturing, <strong className="text-white">Custom Machining (RFQ)</strong> orders can only be cancelled <em className="text-white">before</em> fabrication or machining has commenced. Once materials are procured or machining begins, the order is locked and cancellation is no longer possible.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
