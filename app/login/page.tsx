'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useCart } from '@/components/CartProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Cpu, ArrowRight, Eye, EyeOff, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

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
        // Sign Up Flow
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        showToast('Account created successfully! Logging you in...', 'success');
      } else {
        // Sign In Flow
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        showToast('Welcome back! Successfully logged in.', 'success');
      }

      // Sync active Supabase profile with cart context
      await fetchProfile();
      
      // Delay navigation slightly so user sees success toast
      setTimeout(() => {
        router.push('/profile');
      }, 1000);
    } catch (err: any) {
      console.error('Auth action failed:', err);
      showToast(err.message || 'Authentication failed. Please check credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-bg font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-16 px-4 relative overflow-hidden">
        {/* Subtle grid visual effect */}
        <div className="absolute inset-0 bg-[radial-gradient(#0f172a_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none"></div>

        <div className="w-full max-w-md bg-white border border-slate-border rounded-2xl shadow-xl overflow-hidden relative z-10 p-8 space-y-6 animate-slide-in">
          {/* Logo Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cobalt text-white shadow-md mb-2">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-slate-text-primary tracking-tight">
              {isSignUp ? 'Create Mech-Core Account' : 'Sign in to MechItAll'}
            </h2>
            <p className="text-xs font-semibold text-slate-text-muted">
              {isSignUp 
                ? 'Join precision engineers and start earning loyalty rewards' 
                : 'Access your custom machining configurations and Nuts & Bolts wallet'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-text-secondary uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Elias Thorne"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  className="w-full text-xs font-bold p-3 border border-slate-border rounded-lg bg-slate-bg/30 text-slate-text-primary placeholder:text-slate-text-muted focus:outline-none focus:border-cobalt transition-colors"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-text-secondary uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full text-xs font-bold p-3 border border-slate-border rounded-lg bg-slate-bg/30 text-slate-text-primary placeholder:text-slate-text-muted focus:outline-none focus:border-cobalt transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[11px] font-bold text-slate-text-secondary uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full text-xs font-bold p-3 pr-10 border border-slate-border rounded-lg bg-slate-bg/30 text-slate-text-primary placeholder:text-slate-text-muted focus:outline-none focus:border-cobalt transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-text-muted hover:text-slate-text-primary cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-cobalt py-3.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-cobalt/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>Authenticating...</>
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social Proof info */}
          <div className="bg-amber-500/5 border border-amber-500/15 p-3 rounded-lg flex items-start gap-2 text-[10px] leading-relaxed text-amber-700 font-semibold">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>Registration automatically registers you to our Nuts &amp; Bolts Reward program. Returning profiles keep earned balances!</span>
          </div>

          {/* Sign Up / Sign In Toggle */}
          <div className="text-center pt-2">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={isLoading}
              className="text-xs font-bold text-cobalt hover:opacity-80 transition-opacity cursor-pointer"
            >
              {isSignUp 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
