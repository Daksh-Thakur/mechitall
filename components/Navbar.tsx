'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cpu, ShoppingCart, Bell, Settings, LogOut, ShieldCheck, Users } from 'lucide-react';
import { useCart } from './CartProvider';
import CartDrawer from './CartDrawer';

export default function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const { cartSummary, setIsCartOpen, profile } = useCart();

  const navLinks = [
    { href: '/products', label: 'Parts Catalog' },
    { href: '/machining', label: 'Custom Machining', badge: '3D CAD' },
    { href: '/community', label: 'Community' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full glassmorphism border-b border-slate-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 cursor-pointer group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-cobalt text-white shadow-md group-hover:scale-105 transition-transform duration-200">
              <Cpu className="w-5 h-5 animate-pulse" />
              <div className="absolute inset-0 rounded-lg border border-white/20"></div>
            </div>
            <div>
              <div className="flex items-center">
                <span className="font-extrabold text-lg text-slate-text-primary tracking-tight">Mech</span>
                <span className="font-extrabold text-lg text-cobalt tracking-tight">It</span>
                <span className="font-extrabold text-lg text-slate-text-primary tracking-tight">All</span>
              </div>
              <span className="block text-[8px] uppercase tracking-[0.15em] text-slate-text-muted font-bold -mt-1">
                Mechatronics Store
              </span>
            </div>
          </Link>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href.split('#')[0]));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 cursor-pointer ${isActive ? 'text-cobalt' : 'text-slate-text-secondary hover:text-cobalt'
                    }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[9px] uppercase tracking-wider font-bold bg-emerald/10 text-emerald px-1.5 py-0.5 rounded border border-emerald/20">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {/* Rewards Wallet Widget with Hover Rules Card */}
            <div className="relative group/rewards">
              <Link
                href="/dashboard?tab=rewards"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all text-amber-600 dark:text-amber-400 cursor-pointer group"
              >
                {/* 2D Screw Vector Illustration */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 text-amber-500 animate-spin-slow group-hover:rotate-45 transition-transform duration-300"
                >
                  <circle cx="12" cy="6" r="4" />
                  <path d="M12 2v8" />
                  <path d="M10 6h4" />
                  <rect x="10" y="10" width="4" height="10" rx="1" />
                  <path d="M10 12h4" />
                  <path d="M10 15h4" />
                  <path d="M10 18h4" />
                </svg>
                <span className="font-mono text-xs font-bold tracking-tight">
                  {profile ? `${profile.wallet_balance} Bolts` : '0 Bolts'}
                </span>
              </Link>

              {/* Hover Rules Card */}
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-zinc-700 bg-zinc-800 p-4 shadow-xl z-50 transition-all duration-200 origin-top-right scale-95 opacity-0 pointer-events-none group-hover/rewards:scale-100 group-hover/rewards:opacity-100 group-hover/rewards:pointer-events-auto text-zinc-100">
                <div className="flex items-center gap-1.5 mb-2.5 pb-1.5 border-b border-zinc-700/60">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-4 h-4 text-amber-400"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                    Nuts &amp; Bolts Rules
                  </span>
                </div>
                <ul className="space-y-2 text-[10.5px] leading-relaxed text-zinc-300 font-semibold">
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span><strong>10 Bolts = ₹1.00</strong> store credit value</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span><strong>100 Bolts max</strong> earned per order</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-orange-400 mt-0.5">•</span>
                    <span><strong>45-Day window</strong> before earned Bolts expire</span>
                  </li>
                </ul>
                <div className="mt-3 pt-2 border-t border-zinc-700/40 text-[10px] text-zinc-400 text-center font-bold">
                  Click to view full loyalty vault
                </div>
              </div>
            </div>

            {/* Cart Icon */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-lg border border-slate-border bg-white hover:bg-slate-bg hover:border-slate-text-secondary/20 transition-all text-slate-text-secondary flex items-center justify-center cursor-pointer"
              aria-label="Open Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartSummary.itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-coral text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                  {cartSummary.itemCount}
                </span>
              )}
            </button>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-9 h-9 rounded-full border border-slate-border bg-slate-border/50 text-slate-text-secondary flex items-center justify-center font-bold text-xs hover:bg-slate-bg hover:border-slate-text-secondary/40 transition-all cursor-pointer"
                aria-label="Open profile menu"
              >
                {profile ? profile.loyalty_tier[0] + profile.loyalty_tier.split(' ').pop()![0] : 'GU'}
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-border bg-white shadow-lg py-1.5 z-20 animate-slide-in md:origin-top-right">
                    <div className="px-4 py-2 border-b border-slate-border mb-1">
                      <span className="block text-xs text-slate-text-muted">Shopper Account</span>
                      <span className="block text-xs font-bold text-slate-text-primary truncate">
                        {profile?.full_name || 'Guest User'}
                      </span>
                      <span className="inline-block mt-1 text-[9px] uppercase tracking-wider font-extrabold bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.5 rounded">
                        {profile?.loyalty_tier || 'Tinkerer'}
                      </span>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="w-full text-left px-4 py-2 text-xs text-slate-text-secondary hover:bg-slate-bg hover:text-slate-text-primary flex items-center gap-2 cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" /> Rewards & Orders
                    </Link>
                    <div className="border-t border-slate-border my-1"></div>
                    <button
                      onClick={() => { setProfileOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-cobalt hover:bg-blue-50 flex items-center gap-2 cursor-pointer font-bold"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Sign in / Create Account
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Cart Drawer — rendered at layout level */}
      <CartDrawer />
    </>
  );
}
