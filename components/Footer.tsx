'use client';

import React from 'react';
import Link from 'next/link';
import { Cpu, ShieldCheck, Clock, Package } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-text-primary text-white mt-20 border-t border-slate-text-muted/20">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-cobalt text-white">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">MechItAll</span>
          </div>
          <p className="text-xs text-slate-text-muted leading-relaxed">
            Premium mechatronics parts and components for makers, engineers, and businesses.
          </p>
          <span className="block text-[10px] text-slate-text-muted">
            © 2026 MechItAll. All rights reserved. ISO 9001:2015 compliant.
          </span>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-white border-l-2 border-cobalt pl-2">Platform</h4>
          <ul className="space-y-2 text-xs text-slate-text-muted">
            <li><Link href="/products" className="hover:text-white transition-colors">Shop Parts</Link></li>
            <li><Link href="/community" className="hover:text-white transition-colors">Community</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-white border-l-2 border-amber-500 pl-2">Support &amp; Info</h4>
          <ul className="space-y-2 text-xs text-slate-text-muted text-left">
            <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-cobalt" /> Secure Payments</li>
            <li className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald" /> 7-Day Easy Returns</li>
            <li className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-coral" /> Pan-India Shipping</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
