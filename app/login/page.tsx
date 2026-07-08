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
    <div className="h-screen w-screen overflow-hidden flex font-sans bg-slate-bg">

      {/* ── Left panel — branding (hidden on small screens) ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-gradient-to-br from-slate-text-primary via-slate-text-secondary to-slate-text-primary flex-col justify-between p-10 relative overflow-hidden">
        {/* Engineering grid lines */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{
            backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        {/* Glow blur elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cobalt/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald/5 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 z-10 w-fit">
          <div className="w-9 h-9 rounded-xl bg-cobalt flex items-center justify-center shadow-lg transition-transform hover:scale-105">
            <Cpu className="w-5 h-5 text-white animate-pulse" />
          </div>
          <span className="text-white font-black text-lg tracking-tight font-['Space_Grotesk']">MechItAll</span>
        </Link>

        {/* Centre Copy / Value Prop card */}
        <div className="z-10 space-y-6 max-w-sm">
          <div className="space-y-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#06B6D4] bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm border border-white/5 w-fit block">
              Precision Mechatronics Marketplace
            </span>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight font-['Space_Grotesk']">
              The marketplace<br />
              <span className="bg-gradient-to-r from-cobalt to-[#38bdf8] bg-clip-text text-transparent">engineers trust</span>
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Find premium parts, request custom CNC machining quotes, track orders, and join our verified hardware network.
            </p>
          </div>

          <div className="p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md glow-cobalt-lg space-y-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#38bdf8] block font-mono">Platform Benefits</span>
            <div className="space-y-3">
              {[
                { icon: BoltIcon, color: 'text-amber-500', label: '25 Bolts welcome bonus on sign-up' },
                { icon: Package, color: 'text-emerald-400', label: 'Same-day dispatch, no minimum order' },
                { icon: ShieldCheck, color: 'text-[#38bdf8]', label: 'ISO 9001:2015 quality verified parts' },
              ].map(({ icon: Icon, color, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                  </div>
                  <span className="text-xs text-white/80 font-bold">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-[10px] text-slate-400 font-bold z-10 font-mono tracking-wider">
          © 2026 MECHITALL · ALL RIGHTS RESERVED
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10 relative overflow-hidden bg-slate-bg">
        {/* Subtle dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.03] pointer-events-none" />

        {/* Mobile logo */}
        <Link href="/" className="flex lg:hidden items-center gap-2 mb-6 z-10">
          <div className="w-8 h-8 rounded-xl bg-cobalt flex items-center justify-center shadow-md">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-slate-text-primary text-base tracking-tight font-['Space_Grotesk']">MechItAll</span>
        </Link>

        <div className="w-full max-w-sm z-10 bg-white border border-slate-border rounded-2xl p-6 md:p-8 shadow-xl glow-cobalt space-y-5 animate-slide-in">
          {/* Header */}
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-text-primary tracking-tight font-['Space_Grotesk']">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-xs text-slate-text-muted font-bold">
              {isSignUp
                ? 'Join thousands of makers and engineers'
                : 'Sign in to your MechItAll account'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignUp && (
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-text-secondary uppercase tracking-wider font-mono">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Elias Thorne"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  className="w-full text-xs font-bold p-2.5 border border-slate-border rounded-lg bg-white text-slate-text-primary placeholder:text-slate-text-muted focus:outline-none focus:border-cobalt focus:ring-4 focus:ring-cobalt/10 transition-all shadow-inner"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-text-secondary uppercase tracking-wider font-mono">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full text-xs font-bold p-2.5 border border-slate-border rounded-lg bg-white text-slate-text-primary placeholder:text-slate-text-muted focus:outline-none focus:border-cobalt focus:ring-4 focus:ring-cobalt/10 transition-all shadow-inner"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-text-secondary uppercase tracking-wider font-mono">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full text-xs font-bold p-2.5 pr-10 border border-slate-border rounded-lg bg-white text-slate-text-primary placeholder:text-slate-text-muted focus:outline-none focus:border-cobalt focus:ring-4 focus:ring-cobalt/10 transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-text-muted hover:text-slate-text-primary cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-cobalt py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-cobalt/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-1"
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
          <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl flex items-start gap-2.5 text-[10px] leading-relaxed text-amber-700 font-bold">
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
          <p className="text-center text-xs text-slate-text-muted font-bold">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setEmail(''); setPassword(''); setFullName(''); }}
              disabled={isLoading}
              className="text-cobalt font-bold hover:underline cursor-pointer transition-opacity disabled:opacity-50"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>

          {/* Back to home */}
          <p className="text-center text-[10px] text-slate-text-muted/60">
            <Link href="/" className="hover:text-cobalt transition-colors font-bold">← Back to homepage</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
