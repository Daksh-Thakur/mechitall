'use client';

import React from 'react';
import Link from 'next/link';
import { Cpu, ShieldCheck, Clock, Package, Mail, MapPin, Send, HelpCircle, FileText, MessageSquare, Zap } from 'lucide-react';
import { useCart } from './CartProvider';

export default function Footer() {
  const { profile } = useCart();
  const handleSubmitNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you for subscribing to MechItAll engineering updates!');
  };

  return (
    <footer className="relative bg-[#090F1C] text-zinc-100 mt-20 border-t border-[#E4E4E7]/10 overflow-hidden">
      {/* Blueprint Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(6,182,212,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(6,182,212,0.5) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Gradient Highlight bar */}
      <div className="h-[3px] w-full bg-gradient-to-r from-cobalt via-[#06B6D4] to-emerald"></div>

      <div className="relative max-w-7xl mx-auto px-6 py-12 z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">

          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <img
                src="/logo.png"
                alt="MechItAll Logo"
                className="w-9 h-9 object-contain rounded group-hover:scale-105 transition-transform duration-200"
              />
              <div>
                <div className="flex items-center">
                  <span className="font-extrabold text-lg text-white tracking-tight">Mech</span>
                  <span className="font-extrabold text-lg text-cobalt tracking-tight">It</span>
                  <span className="font-extrabold text-lg text-white tracking-tight">All</span>
                </div>
                <span className="block text-[8px] uppercase tracking-[0.12em] text-zinc-400 font-bold -mt-1">
                  Browse • Buy • Build
                </span>
              </div>
            </Link>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Connecting designers, builders, and precision machining shops.
            </p>
            <div className="space-y-1.5 font-mono text-[9px] uppercase font-bold text-zinc-400 tracking-wider">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cobalt" />
                <span>Verified Sourcing Network</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald" />
                <span>Secure Digital Escrow Protection</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white border-l-2 border-cobalt pl-2">
              Platform Portal
            </h4>
            <ul className="space-y-2.5 text-xs text-zinc-400 font-mono">
              <li>
                <Link href="/products" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>&gt;</span> Catalog Store
                </Link>
              </li>
              <li>
                <Link href="/machining" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>&gt;</span> Custom Machining
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>&gt;</span> Community Hub
                </Link>
              </li>
              <li>
                <Link href="/profile?tab=seller-mode" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>&gt;</span> Verified Seller Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Case Studies */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white border-l-2 border-[#06B6D4] pl-2">
              Company &amp; Resources
            </h4>
            <ul className="space-y-2.5 text-xs text-zinc-400 font-mono">
              <li>
                <Link href="/about" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>&gt;</span> About Us
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>&gt;</span> Pricing Matrix
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>&gt;</span> Contact Us
                </Link>
              </li>
              <li>
                <Link href="/about#case-studies" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>&gt;</span> Case Studies
                </Link>
              </li>
              <li>
                <Link href="/about#blog" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>&gt;</span> Blog/Resources
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Specifications / Resources */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white border-l-2 border-emerald pl-2">
              Operations
            </h4>
            <ul className="space-y-2 text-xs text-zinc-400 font-sans">
              <li className="flex items-start gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-cobalt shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] font-bold text-white uppercase font-mono">Negotiation Desk</span>
                  <span className="text-[10px] text-zinc-500 leading-none font-sans">Live quote counter-offers &amp; chats</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] font-bold text-white uppercase font-mono">Escrow Payments</span>
                  <span className="text-[10px] text-zinc-500 leading-none font-sans">Secure escrow auto-releases</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] font-bold text-white uppercase font-mono">Bolts Rewards</span>
                  <span className="text-[10px] text-zinc-500 leading-none font-sans">Progression milestones &amp; seller tiers</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Corporate / Newsletter */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white border-l-2 border-coral pl-2">
              Accreditation & Contacts
            </h4>
            <div className="space-y-2 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-cobalt shrink-0" />
                <span className="font-mono">support@mechitall.in</span>
              </div>
            </div>

            {/* Newsletter form */}
            <form onSubmit={handleSubmitNewsletter} className="space-y-2 pt-1">
              <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-mono">
                Subscribe to Catalog Updates
              </span>
              <div className="flex border border-white/10 rounded overflow-hidden">
                <input
                  type="email"
                  required
                  placeholder="engineer@corp.com"
                  className="flex-1 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:bg-white/10 border-r border-white/10 font-sans"
                />
                <button
                  type="submit"
                  className="bg-cobalt hover:bg-emerald text-white px-3 py-1.5 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Subscribe"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>

        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
          <span>
            © 2026 MechItAll. All rights reserved.
          </span>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/policies/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span className="hidden md:inline">•</span>
            <Link href="/policies/refund" className="hover:text-white transition-colors">Refund Policy</Link>
            <span className="hidden md:inline">•</span>
            <Link href="/policies/cancellation" className="hover:text-white transition-colors">Cancellation Policy</Link>
            <span className="hidden md:inline">•</span>
            <Link href="/policies/shipping" className="hover:text-white transition-colors">Shipping Policy</Link>
            {profile?.is_seller && profile?.vendor_agreement_pdf && (
              <>
                <span className="hidden md:inline">•</span>
                <a
                  href={profile.vendor_agreement_pdf}
                  download={`MechItAll_Vendor_Agreement_${(profile.company_name || profile.full_name || 'Seller').replace(/\s+/g, '_')}.pdf`}
                  className="hover:text-white transition-colors"
                >
                  Vendor Agreement
                </a>
              </>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
}
