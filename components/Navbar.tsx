'use client';

import React, { useState } from 'react';
import { Cpu, Search, ShoppingCart, ChevronDown, Bell, Settings, LogOut, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  onNavigateToRFQ: () => void;
  onNavigateToInventory: () => void;
  onNavigateToServices: () => void;
}

export default function Navbar({ cartCount, onCartClick, onNavigateToRFQ, onNavigateToInventory, onNavigateToServices }: NavbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="sticky top-0 z-40 w-full glassmorphism border-b border-slate-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div 
          onClick={onNavigateToInventory}
          className="flex items-center gap-2 cursor-pointer group"
        >
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
        </div>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-8">
          <button 
            onClick={onNavigateToInventory}
            className="text-sm font-semibold text-slate-text-secondary hover:text-cobalt transition-colors duration-200 cursor-pointer"
          >
            Parts Catalog
          </button>
          <button 
            onClick={onNavigateToServices}
            className="text-sm font-semibold text-slate-text-secondary hover:text-cobalt transition-colors duration-200 cursor-pointer"
          >
            Services & Capabilities
          </button>
          <button 
            onClick={onNavigateToRFQ}
            className="text-sm font-semibold text-slate-text-secondary hover:text-cobalt transition-colors duration-200 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Custom Parts</span>
            <span className="text-[9px] uppercase tracking-wider font-bold bg-emerald/10 text-emerald px-1.5 py-0.5 rounded border border-emerald/20">
              3D CAD
            </span>
          </button>
          <a 
            href="#specs" 
            className="text-sm font-semibold text-slate-text-secondary hover:text-cobalt transition-colors duration-200"
          >
            Specifications
          </a>
        </nav>

        {/* Search Bar, Cart, User controls */}
        <div className="flex items-center gap-4 flex-1 md:flex-initial max-w-md justify-end">
          {/* Search Input */}
          <div className="relative hidden sm:block w-64 lg:w-80">
            <input
              type="text"
              placeholder="Search parts, products, datasheets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-slate-bg border border-slate-border text-slate-text-primary px-3 py-2 pl-9 rounded-lg focus:outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt/20 transition-all placeholder-slate-text-muted font-medium"
            />
            <Search className="w-3.5 h-3.5 text-slate-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center h-5 select-none pointer-events-none rounded border border-slate-border bg-white px-1.5 font-mono text-[9px] font-medium text-slate-text-muted">
              Ctrl K
            </kbd>
          </div>

          {/* Cart Icon with count indicator */}
          <button
            onClick={onCartClick}
            className="relative p-2.5 rounded-lg border border-slate-border bg-white hover:bg-slate-bg hover:border-slate-text-secondary/20 transition-all text-slate-text-secondary flex items-center justify-center cursor-pointer"
            aria-label="Open Shopping Cart"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-coral text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg border border-slate-border bg-white hover:bg-slate-bg transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-md bg-slate-border/50 text-slate-text-secondary flex items-center justify-center font-bold text-xs border border-slate-border">
                GU
              </div>
              <div className="hidden lg:block text-left">
                <span className="block text-[11px] font-bold text-slate-text-primary leading-tight">Guest User</span>
                <span className="block text-[8px] text-slate-text-muted font-extrabold uppercase tracking-wider">
                  Shop Account
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-text-muted hidden sm:block" />
            </button>

            {profileOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setProfileOpen(false)}
                ></div>
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
  );
}
