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
  const { cartSummary, setIsCartOpen } = useCart();

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
                GU
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-border bg-white shadow-lg py-1.5 z-20 animate-slide-in md:origin-top-right">
                    <div className="px-4 py-2 border-b border-slate-border mb-1">
                      <span className="block text-xs text-slate-text-muted">Shopper Account</span>
                      <span className="block text-xs font-bold text-slate-text-primary truncate">Guest User</span>
                      <span className="inline-block mt-1 text-[9px] uppercase tracking-wider font-extrabold bg-slate-bg text-slate-text-secondary border border-slate-border/80 px-1.5 py-0.5 rounded">
                        GUEST SESSION
                      </span>
                    </div>
                    <button
                      onClick={() => { setProfileOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-text-secondary hover:bg-slate-bg hover:text-slate-text-primary flex items-center gap-2 cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" /> Account settings
                    </button>
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
