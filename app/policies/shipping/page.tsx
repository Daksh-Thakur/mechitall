import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 font-sans flex flex-col overflow-x-clip">
      <Navbar />
      <main className="flex-1 py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-8 bg-zinc-800 p-8 rounded-2xl border border-zinc-700/60 shadow-xl">
          <h1 className="text-3xl font-bold text-white font-['Space_Grotesk'] border-b border-zinc-700/60 pb-4">Shipping Policy</h1>
          <div className="space-y-6 text-sm text-zinc-300 leading-relaxed">
            <h2 className="text-xl font-semibold text-white">1. Off-the-Shelf Parts</h2>
            <p>
              Standard off-the-shelf components are typically dispatched by the sellers within <strong className="font-mono text-white">24-48 hours</strong> of order confirmation.
            </p>
            <h2 className="text-xl font-semibold text-white">2. Custom Machined Parts</h2>
            <p>
              For custom parts (RFQ), the dispatch date depends strictly on the quoted lead time selected during checkout and the complexity of fabrication.
            </p>
            <h2 className="text-xl font-semibold text-white">3. Transit Times</h2>
            <p>
              Once dispatched, standard transit times typically range from <strong className="font-mono text-white">3 to 7 business days</strong> depending on your delivery location. Expedited shipping options may be available at an additional cost.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
