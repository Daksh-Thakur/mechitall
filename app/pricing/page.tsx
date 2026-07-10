'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { HelpCircle, ChevronRight, Percent, Award, ShieldAlert } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 font-sans flex flex-col overflow-x-clip">
      <Navbar />

      <main className="flex-1 py-16">
        {/* Header Block */}
        <section className="max-w-7xl mx-auto px-6 text-center space-y-4">
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-emerald-400 bg-emerald-400/5 border border-emerald-400/15 px-3 py-1 rounded">
            Transparent Pricing
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight font-['Space_Grotesk']">
            Marketplace Commission &amp; Loyalty Matrix
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl mx-auto font-medium">
            No hidden costs. Simple commission rates for sellers and robust loyalty credit offsets for DIY developers and businesses.
          </p>
        </section>

        {/* Pricing Tiers / Commissions */}
        <section className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* standard catalog */}
          <div className="bg-zinc-800 border border-zinc-700/60 p-8 rounded-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Percent className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white font-['Space_Grotesk'] leading-none">Catalog Sourcing</h2>
                <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">Catalog Component Sales</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium">Seller Listing Fee</span>
                <span className="font-mono text-sm font-bold text-white uppercase">FREE</span>
              </div>
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium">Marketplace Commission</span>
                <span className="font-mono text-sm font-bold text-emerald-400">5.0%</span>
              </div>
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium">Minimum Transaction Fee</span>
                <span className="font-mono text-sm font-bold text-white">₹0.00</span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              For standard off-the-shelf actuators, sensors, and controllers, we levy a flat <span className="font-mono text-emerald-400">5.0% commission</span> on successful checkouts.
            </p>
          </div>

          {/* custom machining */}
          <div className="bg-zinc-800 border border-zinc-700/60 p-8 rounded-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Percent className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white font-['Space_Grotesk'] leading-none">Custom CAD RFQ Contracts</h2>
                <span className="text-[10px] text-blue-400 font-mono font-bold uppercase tracking-wider">CNC, SLA, Fabrication quotes</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium">File Upload &amp; Estimation</span>
                <span className="font-mono text-sm font-bold text-white uppercase">FREE</span>
              </div>
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium">Contract Escrow Commission</span>
                <span className="font-mono text-sm font-bold text-blue-500">8.0%</span>
              </div>
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium">PayU Digital Escrow Setup</span>
                <span className="font-mono text-sm font-bold text-white">Included</span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              Custom fabrication contracts run with an escrow safety lock. We charge an <span className="font-mono text-blue-500">8.0% commission</span> to cover logistics validation, quality checkpoints, and escrow overheads.
            </p>
          </div>
        </section>

        {/* Nuts & Bolts Loyalty Program Details */}
        <section className="max-w-7xl mx-auto px-6 py-8 border-t border-zinc-800">
          <div className="bg-zinc-800 border border-zinc-700/60 p-8 rounded-3xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white font-['Space_Grotesk'] leading-none">Nuts &amp; Bolts Loyalty Offsets</h2>
                <span className="text-xs text-amber-500 font-mono font-bold">Earn credits on every purchase to offset platform fees</span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              We reward frequent builders. When you order catalog hardware, we grant Bolts directly to your wallet. You can redeem these points at checkouts to offset purchase costs and commissions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 font-mono">
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-2">
                <span className="block text-[10px] text-zinc-500 uppercase font-bold">Earning Rate</span>
                <span className="block text-lg font-bold text-emerald-400">1.0 Bolt</span>
                <span className="block text-[10px] text-zinc-400 font-sans">For every ₹1 spent on mechatronics.</span>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-2">
                <span className="block text-[10px] text-zinc-500 uppercase font-bold">Redemption Value</span>
                <span className="block text-lg font-bold text-amber-500">10 Bolts = ₹1.00</span>
                <span className="block text-[10px] text-zinc-400 font-sans">Redeemed instantly at cart checkout.</span>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-2">
                <span className="block text-[10px] text-zinc-500 uppercase font-bold">Per-Order Cap</span>
                <span className="block text-lg font-bold text-orange-400">100 Bolts max</span>
                <span className="block text-[10px] text-zinc-400 font-sans">Maximum offset threshold per transaction.</span>
              </div>
            </div>

            <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-700/40 text-[11px] text-zinc-400 flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Expiration Rule</strong>: Bolts earned are credited to your profile and must be spent within <span className="font-mono text-amber-500">45 days</span>. Expired bolts are automatically debited from the ledger via our background database transaction manager.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto px-6 py-12 space-y-6">
          <h3 className="text-lg font-bold text-white text-center font-['Space_Grotesk']">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div className="p-5 bg-zinc-800 border border-zinc-700/60 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-white">How do I get my custom parts quoted?</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                Navigate to the Custom Machining Hub, upload your STEP or CAD file, choose tolerances and material, and post the RFQ. Sellers quote custom prices asynchronously.
              </p>
            </div>
            <div className="p-5 bg-zinc-800 border border-zinc-700/60 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-white">Are there payment gateway charges?</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                No, MechItAll covers baseline payment processing. Commission values are flat and transparently deducted on the merchant side.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
