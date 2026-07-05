'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useCart } from '@/components/CartProvider';
import Link from 'next/link';
import { Cpu, ArrowRight, Eye, EyeOff, Sparkles, CheckCircle2, Zap, Package, ShieldCheck } from 'lucide-react';

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
    <div className="h-screen w-screen overflow-hidden flex font-sans bg-[#F8FAFC]">

      {/* ── Left panel — branding (hidden on small screens) ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-gradient-to-br from-[#0F172A] via-[#1e293b] to-[#0F172A] flex-col justify-between p-10 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cobalt/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 z-10 w-fit">
          <div className="w-9 h-9 rounded-xl bg-cobalt flex items-center justify-center shadow-lg">
            <Cpu className="w-5 h-5 text-white animate-pulse" />
          </div>
          <span className="text-white font-black text-lg tracking-tight">MechItAll</span>
        </Link>

        {/* Centre copy */}
        <div className="z-10 space-y-6">
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-cobalt">Precision Mechatronics Platform</span>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight">
              The marketplace<br />
              <span className="text-cobalt">engineers trust</span>
            </h1>
            <p className="text-sm text-white/60 leading-relaxed max-w-xs">
              Parts catalog, on-demand CNC machining, community reviews — all in one place.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: Zap, color: 'text-amber-400', label: '25 Bolts welcome bonus on sign-up' },
              { icon: Package, color: 'text-emerald-400', label: 'Same-day dispatch, no minimum order' },
              { icon: ShieldCheck, color: 'text-cobalt', label: 'ISO 9001:2015 quality verified parts' },
            ].map(({ icon: Icon, color, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                </div>
                <span className="text-xs text-white/70 font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-[10px] text-white/30 font-semibold z-10">
          © 2026 MechItAll · All rights reserved
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10 relative overflow-hidden">
        {/* Subtle dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.04] pointer-events-none" />

        {/* Mobile logo */}
        <Link href="/" className="flex lg:hidden items-center gap-2 mb-6 z-10">
          <div className="w-8 h-8 rounded-xl bg-cobalt flex items-center justify-center shadow-md">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-slate-text-primary text-base tracking-tight">MechItAll</span>
        </Link>

        <div className="w-full max-w-sm z-10 space-y-5">
          {/* Header */}
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-text-primary tracking-tight">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-xs text-slate-text-muted font-semibold">
              {isSignUp
                ? 'Join thousands of makers and engineers'
                : 'Sign in to your MechItAll account'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {isSignUp && (
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-text-secondary uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Elias Thorne"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  className="w-full text-xs font-bold p-2.5 border border-slate-border rounded-lg bg-white text-slate-text-primary placeholder:text-slate-text-muted focus:outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt/20 transition-all"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-text-secondary uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full text-xs font-bold p-2.5 border border-slate-border rounded-lg bg-white text-slate-text-primary placeholder:text-slate-text-muted focus:outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt/20 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-text-secondary uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full text-xs font-bold p-2.5 pr-10 border border-slate-border rounded-lg bg-white text-slate-text-primary placeholder:text-slate-text-muted focus:outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt/20 transition-all"
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
          <div className="bg-amber-500/6 border border-amber-500/15 p-3 rounded-lg flex items-start gap-2 text-[10px] leading-relaxed text-amber-700 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span>
              {isSignUp
                ? 'You\'ll receive 25 Bolts instantly on sign-up — redeemable as store credit at checkout!'
                : 'Your Nuts & Bolts reward balance is restored on every login.'}
            </span>
          </div>

          {/* Toggle */}
          <p className="text-center text-xs text-slate-text-muted font-semibold">
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
            <Link href="/" className="hover:text-cobalt transition-colors font-semibold">← Back to homepage</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
