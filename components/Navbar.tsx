'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cpu, ShoppingCart, Bell, Settings, LogOut, ShieldCheck, Users, User, Menu, X, ChevronRight } from 'lucide-react';
import { useCart } from './CartProvider';
import CartDrawer from './CartDrawer';
import { createClient } from '../utils/supabase/client';

export default function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const pathname = usePathname();
  const { cartSummary, setIsCartOpen, profile, fetchProfile, showToast } = useCart();
  const supabase = createClient();



  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    setProfileOpen(false);
    await supabase.auth.signOut();
    document.cookie = 'mechitall_profile_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    if (typeof window !== 'undefined') {
      localStorage.removeItem('local_listed_products');
      localStorage.removeItem('local_listed_services');
    }
    await fetchProfile();
    showToast('Successfully signed out.', 'success');
    window.location.href = '/';
  };

  const navLinks: { href: string; label: string; activeColor: string }[] = [
    { href: '/products', label: 'Products', activeColor: 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/25' },
    { href: '/machining', label: 'Custom Machining', activeColor: 'bg-blue-500/10 text-blue-400 border border-blue-500/25' },
    { href: '/community', label: 'Community', activeColor: 'bg-zinc-800 text-zinc-200 border border-zinc-700/60' },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800/80">
        <div className="h-[2px] w-full bg-gradient-to-r from-blue-500 via-[#06B6D4] to-emerald-400"></div>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer group">
            <img 
              src="/logo.png" 
              alt="MechItAll Logo" 
              className="w-9 h-9 object-contain rounded-full group-hover:scale-105 transition-transform duration-200"
            />
            <div>
              <div className="flex items-center">
                <span className="font-extrabold text-lg text-white tracking-tight">Mech</span>
                <span className="font-extrabold text-lg text-blue-500 tracking-tight">It</span>
                <span className="font-extrabold text-lg text-white tracking-tight">All</span>
              </div>
              <span className="block text-[8px] uppercase tracking-[0.12em] text-zinc-400 font-bold -mt-1">
                Browse • Buy • Build
              </span>
            </div>
          </Link>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-3">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href.split('#')[0]));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[11px] font-mono font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 cursor-pointer px-3 py-2 rounded-md ${
                    isActive 
                      ? link.activeColor 
                      : 'text-zinc-400 hover:bg-zinc-850 hover:text-white'
                  }`}
                >
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-3">


            {/* Rewards Wallet Widget with Hover Rules Card */}
            <div className="hidden sm:block relative group/rewards">
              <Link
                href="/profile?tab=rewards"
                className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all text-amber-400 cursor-pointer group"
              >
                {/* 2D Screw Vector Illustration */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 text-amber-500 animate-spin-slow group-hover:rotate-45 transition-transform duration-300"
                >
                  {/* 3D Faceted Hexagonal Head */}
                  <polygon points="8,3 16,3 18,7 16,11 8,11 6,7" fill="none" />
                  <line x1="10" y1="3" x2="10" y2="11" />
                  <line x1="14" y1="3" x2="14" y2="11" />
                  
                  {/* Bolt Shaft */}
                  <path d="M9,11v9c0,0.6 0.4,1 1,1h4c0.6,0 1,-0.4 1,-1v-9" />
                  
                  {/* Thread Ridges (Real Thread Pitch Look) */}
                  <line x1="9" y1="13.5" x2="15" y2="12" />
                  <line x1="9" y1="16" x2="15" y2="14.5" />
                  <line x1="9" y1="18.5" x2="15" y2="17" />
                </svg>
                 <span className="font-mono text-xs font-bold tracking-tight">
                   {profile ? profile.wallet_balance : '0'}<span className="hidden md:inline"> Bolts</span>
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
                <ul className="space-y-2 text-[10.5px] leading-relaxed text-zinc-300 font-semibold font-sans">
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
                  Click to view full Bolts Wallet
                </div>
              </div>
            </div>

            {/* Cart Icon */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-md border border-zinc-700 bg-zinc-850 hover:bg-zinc-800 hover:border-zinc-650 transition-all text-zinc-200 flex items-center justify-center cursor-pointer"
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
            <div
              className="relative py-2"
              onMouseEnter={() => setProfileOpen(true)}
              onMouseLeave={() => setProfileOpen(false)}
            >
              <button
                onClick={() => {
                  setProfileOpen(false);
                  if (user) {
                    window.location.href = '/profile';
                  } else {
                    window.location.href = '/login';
                  }
                }}
                className="w-9 h-9 rounded-full border border-zinc-700 bg-zinc-850 text-zinc-200 flex items-center justify-center font-bold text-xs hover:bg-zinc-800 hover:border-zinc-650 transition-all cursor-pointer"
                aria-label="Open profile menu"
              >
                {user ? (profile?.full_name ? profile.full_name[0] + (profile.full_name.split(' ').pop() || 'U')[0] : 'U') : 'GU'}
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-1 w-56 rounded-xl border border-zinc-700 bg-zinc-800 shadow-lg py-1.5 z-[9999] animate-slide-in md:origin-top-right text-zinc-100">
                  <div className="px-4 py-2 border-b border-zinc-700/60 mb-1">
                    <span className="block text-xs text-zinc-400">
                      {user ? 'Shopper Account' : 'Guest Shopper'}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="block text-xs font-bold text-zinc-100 truncate">
                        {profile?.full_name || 'Guest User'}
                      </span>
                      {profile?.is_verified_buyer && (
                        <span className="text-emerald shrink-0" title="Verified Buyer">
                          <ShieldCheck className="w-3.5 h-3.5 fill-emerald/5" />
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span className="inline-block text-[9px] uppercase tracking-wider font-extrabold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded">
                        {profile?.loyalty_tier || 'Tinkerer'}
                      </span>
                      {profile?.is_verified_buyer && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider font-extrabold bg-emerald/10 text-emerald-400 border border-emerald/20 px-1.5 py-0.5 rounded">
                          Verified
                        </span>
                      )}
                      {profile?.is_verified_seller && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider font-extrabold bg-emerald/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                          Seller Verified
                        </span>
                      )}
                    </div>
                  </div>
                  {user && (
                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="w-full text-left px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2 cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5" /> My Profile
                    </Link>
                  )}
                  <div className="border-t border-zinc-700/60 my-1"></div>
                  {user ? (
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-950/20 flex items-center gap-2 cursor-pointer font-bold"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setProfileOpen(false)}
                      className="w-full text-left px-4 py-2 text-xs text-blue-400 hover:bg-blue-950/20 flex items-center gap-2 cursor-pointer font-bold"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Sign in / Create Account
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2.5 rounded border border-zinc-700 bg-zinc-850 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-650 transition-all flex items-center justify-center cursor-pointer"
              aria-label="Toggle Mobile Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Dropdown Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-[58px] left-0 right-0 z-[9999] bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 shadow-lg p-4 space-y-4 animate-fade-in-down text-zinc-100">
          <nav className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href.split('#')[0]));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-xs font-mono font-bold uppercase tracking-wider p-3 rounded border-l-2 transition-all flex items-center justify-between ${
                    isActive 
                      ? 'bg-zinc-800 border-blue-500 text-blue-400 font-bold' 
                      : 'border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <span>{link.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                </Link>
              );
            })}
          </nav>



          {profile && (
            <div className="border-t border-zinc-800/80 pt-3 px-1 flex items-center justify-between text-[10px] font-bold text-zinc-400 font-mono uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3.5 h-3.5 text-amber-500 animate-pulse"
                >
                  <polygon points="8,3 16,3 18,7 16,11 8,11 6,7" fill="none" />
                  <line x1="10" y1="3" x2="10" y2="11" />
                  <line x1="14" y1="3" x2="14" y2="11" />
                  <path d="M9,11v9c0,0.6 0.4,1 1,1h4c0.6,0 1,-0.4 1,-1v-9" />
                  <line x1="9" y1="13.5" x2="15" y2="12" />
                  <line x1="9" y1="16" x2="15" y2="14.5" />
                  <line x1="9" y1="18.5" x2="15" y2="17" />
                </svg>
                <span>Bolts Wallet:</span>
              </span>
              <span className="text-amber-500 font-extrabold font-mono text-xs">
                {profile.wallet_balance || 0} Bolts
              </span>
            </div>
          )}
        </div>
      )}

      {/* Cart Drawer — rendered at layout level */}
      <CartDrawer />
    </>
  );
}
