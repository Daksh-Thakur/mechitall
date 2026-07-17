'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Target, Eye, ChevronRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 font-sans flex flex-col overflow-x-clip">
      <Navbar />

      <main className="flex-1 py-16">
        {/* Header Block */}
        <section className="max-w-7xl mx-auto px-6 text-center space-y-4">
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-emerald-400 bg-emerald-400/5 border border-emerald-400/15 px-3 py-1 rounded">
            Our Mission &amp; Ecosystem
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight font-['Space_Grotesk']">
            Solving Sourcing Fragmentation in Mechatronics
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl mx-auto font-medium">
            MechItAll is the ultimate hub for off-the-shelf robotics hardware and on-demand CAD custom machining. We connect DIY hobbyists with manufacturing professionals to <strong className="text-white font-mono tracking-wider">BUILD. UPGRADE. CREATE.</strong>
          </p>
        </section>

        {/* Mission & Vision Section */}
        <section className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-zinc-800 border border-zinc-700/60 p-8 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white font-['Space_Grotesk']">Our Mission</h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              To empower the DIY robotics community, hobbyists, and professional hardware developers by providing instant, unified access to high-fidelity mechatronics. The platform aims to eradicate sourcing delays, eliminate order minimums, and ensure verified part specifications with every single transaction.
            </p>
          </div>

          <div className="bg-zinc-800 border border-zinc-700/60 p-8 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Eye className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white font-['Space_Grotesk']">Our Vision</h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              To build a frictionless mechatronic supply chain. We envision a world where a builder can prototype complex kinematic systems by selecting catalog components and procuring custom CNC, SLA, or sheet metal parts on a single interface, backed by transparent digital escrow.
            </p>
          </div>
        </section>

        {/* Technical Metrics Section */}
        <section className="bg-zinc-950 py-16 border-y border-zinc-800">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <span className="block text-3xl md:text-4xl font-extrabold text-emerald-400 font-mono">10,000+</span>
              <span className="block text-[9px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Catalog Parts</span>
            </div>
            <div className="space-y-1">
              <span className="block text-3xl md:text-4xl font-extrabold text-blue-500 font-mono">48 Hours</span>
              <span className="block text-[9px] uppercase tracking-wider text-zinc-500 font-bold font-mono">CAD Estimations</span>
            </div>
            <div className="space-y-1">
              <span className="block text-3xl md:text-4xl font-extrabold text-emerald-400 font-mono">100%</span>
              <span className="block text-[9px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Escrow Protected</span>
            </div>
            <div className="space-y-1">
              <span className="block text-3xl md:text-4xl font-extrabold text-blue-500 font-mono">0 Min</span>
              <span className="block text-[9px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Order MOQ Limit</span>
            </div>
          </div>
        </section>

        {/* Case Studies Section */}
        <section id="case-studies" className="max-w-7xl mx-auto px-6 py-20 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-blue-400 bg-blue-500/5 border border-blue-500/15 px-3 py-1 rounded">
              Engineering Case Studies
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white font-['Space_Grotesk']">Proven Robotics Deployments</h2>
            <p className="text-xs text-zinc-400 max-w-lg mx-auto">See how academic labs and hardware companies prototype faster on MechItAll.</p>
          </div>

          <div className="text-center py-16 border border-dashed border-zinc-800 bg-zinc-900/40 rounded-2xl">
            <Target className="w-10 h-10 text-zinc-650 mx-auto mb-3" />
            <p className="text-sm font-bold text-white">No deployments found</p>
            <p className="text-xs text-zinc-500">Check back later for new aerospace and autonomous rover case studies.</p>
          </div>
        </section>

        {/* Blog & Resources Section */}
        <section id="blog" className="max-w-7xl mx-auto px-6 py-10 border-t border-zinc-800 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-emerald-400 bg-emerald-400/5 border border-emerald-400/15 px-3 py-1 rounded">
              Engineering Blog
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white font-['Space_Grotesk']">Resources &amp; Tutorials</h2>
            <p className="text-xs text-zinc-400 max-w-lg mx-auto">Get firmware architectures, sensor integration templates, and mechatronic design guides.</p>
          </div>

          <div className="text-center py-16 border border-dashed border-zinc-800 bg-zinc-900/40 rounded-2xl">
            <Eye className="w-10 h-10 text-zinc-650 mx-auto mb-3" />
            <p className="text-sm font-bold text-white">No articles found</p>
            <p className="text-xs text-zinc-500">Tutorials, design guides, and mechatronic sizing resources are coming soon.</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
