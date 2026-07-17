'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useCart } from '@/components/CartProvider';
import Link from 'next/link';
import { Cpu, ArrowRight, Eye, EyeOff, Sparkles, CheckCircle2, Zap, Package, ShieldCheck } from 'lucide-react';

const BoltIcon = ({ className = "w-3.5 h-3.5 text-amber-500" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="8,3 16,3 18,7 16,11 8,11 6,7" fill="none" />
    <line x1="10" y1="3" x2="10" y2="11" />
    <line x1="14" y1="3" x2="14" y2="11" />
    <path d="M9,11v9c0,0.6 0.4,1 1,1h4c0.6,0 1,-0.4 1,-1v-9" />
    <line x1="9" y1="13.5" x2="15" y2="12" />
    <line x1="9" y1="16" x2="15" y2="14.5" />
    <line x1="9" y1="18.5" x2="15" y2="17" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { fetchProfile, showToast } = useCart();
  const supabase = createClient();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !fullName)) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        showToast('Account created! Logging you in...', 'success');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showToast('Welcome back!', 'success');
      }

      await fetchProfile();
      setTimeout(() => router.push('/profile'), 900);
    } catch (err: any) {
      showToast(err.message || 'Authentication failed. Please check credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex font-sans bg-zinc-900 text-zinc-100">

      {/* ── Left panel — branding (hidden on small screens) ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex-col justify-between p-10 relative overflow-hidden border-r border-zinc-800">
        {/* Engineering grid lines */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{
            backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        {/* Glow blur elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 z-10 w-fit">
          <div className="w-9 h-9 rounded-xl bg-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-400/10 transition-transform hover:scale-105">
            <Cpu className="w-5 h-5 text-zinc-950 animate-pulse" />
          </div>
          <span className="text-white font-black text-lg tracking-tight font-['Space_Grotesk']">MechItAll</span>
        </Link>

        {/* Centre Copy / Value Prop card */}
        <div className="z-10 space-y-6 max-w-sm">
          <div className="space-y-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-zinc-800 px-2.5 py-1 rounded-full border border-zinc-700/60 w-fit block font-mono">
              Precision Mechatronics Marketplace
            </span>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight font-['Space_Grotesk']">
              The marketplace<br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">engineers trust</span>
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Find premium parts, request custom CNC machining quotes, track orders, and join our verified hardware network.
            </p>
          </div>

          <div className="p-5 bg-zinc-900/50 border border-zinc-805/80 rounded-2xl space-y-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 block font-mono">Platform Benefits</span>
            <div className="space-y-3 font-sans">
              {[
                { icon: BoltIcon, color: 'text-amber-500', label: '25 Bolts welcome bonus on sign-up' },
                { icon: Package, color: 'text-emerald-400', label: 'Fast order dispatch, no minimum order' },
                { icon: ShieldCheck, color: 'text-emerald-400', label: 'Quality verified parts and sellers' },
              ].map(({ icon: Icon, color, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-zinc-850 flex items-center justify-center shrink-0 border border-zinc-750 shadow-inner">
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                  </div>
                  <span className="text-xs text-zinc-300 font-bold">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-[10px] text-zinc-500 font-bold z-10 font-mono tracking-wider">
          © 2026 MECHITALL · ALL RIGHTS RESERVED
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10 relative overflow-hidden bg-zinc-900">
        {/* Subtle dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.02] pointer-events-none" />

        {/* Mobile logo */}
        <Link href="/" className="flex lg:hidden items-center gap-2 mb-6 z-10">
          <div className="w-8 h-8 rounded-xl bg-emerald-400 flex items-center justify-center shadow-md">
            <Cpu className="w-4 h-4 text-zinc-955" />
          </div>
          <span className="font-black text-white text-base tracking-tight font-['Space_Grotesk']">MechItAll</span>
        </Link>

        <div className="w-full max-w-sm z-10 bg-zinc-800 border border-zinc-700/60 rounded-2xl p-6 md:p-8 shadow-2xl space-y-5 animate-slide-in">
          {/* Header */}
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-white tracking-tight font-['Space_Grotesk']">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-xs text-zinc-400 font-bold font-sans">
              {isSignUp
                ? 'Join thousands of makers and engineers'
                : 'Sign in to your MechItAll account'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignUp && (
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Elias Thorne"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  className="w-full text-xs font-sans font-semibold p-2.5 border border-zinc-705 rounded-lg bg-zinc-900 text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 transition-all shadow-inner"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full text-xs font-sans font-semibold p-2.5 border border-zinc-705 rounded-lg bg-zinc-900 text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 transition-all shadow-inner"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full text-xs font-sans font-semibold p-2.5 pr-10 border border-zinc-705 rounded-lg bg-zinc-900 text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-white cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-400 hover:bg-emerald-350 text-zinc-950 py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-400/5 hover:shadow-emerald-400/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-1 font-mono uppercase tracking-wider"
            >
              {isLoading ? (
                'Authenticating...'
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Bolts reward hint */}
          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-start gap-2.5 text-[10px] leading-relaxed text-amber-400 font-bold font-mono">
            <div className="shrink-0 mt-0.5">
              <BoltIcon className="w-4 h-4 text-amber-500 animate-pulse" />
            </div>
            <span>
              {isSignUp
                ? "You'll receive 25 Bolts instantly on sign-up — redeemable as store credit at checkout!"
                : 'Welcome back! Keep track of your mechatronics orders, quotes, and reward balances.'}
            </span>
          </div>

          {/* Toggle */}
          <p className="text-center text-xs text-zinc-400 font-bold font-sans">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setEmail(''); setPassword(''); setFullName(''); }}
              disabled={isLoading}
              className="text-emerald-400 font-bold hover:underline cursor-pointer transition-opacity disabled:opacity-50"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>

          {/* Back to home */}
          <p className="text-center text-[10px] text-zinc-500">
            <Link href="/" className="hover:text-emerald-400 transition-colors font-mono font-bold">← Back to homepage</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
