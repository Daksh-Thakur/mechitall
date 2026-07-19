'use client';

import React, { useState, useEffect } from 'react';
import { Cookie, Shield, Settings, Check, X } from 'lucide-react';

// Declare global gtag and hj for TypeScript
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
    hj?: (...args: any[]) => void;
  }
}

interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    analytics: true,
    marketing: true,
  });

  const applyConsent = (prefs: ConsentPreferences) => {
    if (typeof window !== 'undefined') {
      // Update Google Consent Mode
      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          'ad_storage': prefs.marketing ? 'granted' : 'denied',
          'analytics_storage': prefs.analytics ? 'granted' : 'denied',
          'personalization_storage': prefs.essential ? 'granted' : 'denied',
        });
      }
      
      // Update Hotjar Consent
      if (typeof window.hj === 'function') {
        window.hj('consent', prefs.analytics);
      }
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: prefs }));
    }
  };

  useEffect(() => {
    // Check if user already made a choice
    const savedConsent = localStorage.getItem('mechitall_cookie_consent');
    if (!savedConsent) {
      setIsOpen(true);
    } else {
      try {
        const parsed = JSON.parse(savedConsent);
        const resolvedPrefs = {
          essential: true,
          analytics: !!parsed.analytics,
          marketing: !!parsed.marketing,
        };
        setPreferences(resolvedPrefs);
        // Apply consent on initial load
        applyConsent(resolvedPrefs);
      } catch (e) {
        // Fallback if parsing fails
        setIsOpen(true);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = { essential: true, analytics: true, marketing: true };
    localStorage.setItem('mechitall_cookie_consent', JSON.stringify(allAccepted));
    setPreferences(allAccepted);
    setIsOpen(false);
    applyConsent(allAccepted);
  };

  const handleRejectAll = () => {
    const essentialOnly = { essential: true, analytics: false, marketing: false };
    localStorage.setItem('mechitall_cookie_consent', JSON.stringify(essentialOnly));
    setPreferences(essentialOnly);
    setIsOpen(false);
    applyConsent(essentialOnly);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('mechitall_cookie_consent', JSON.stringify(preferences));
    setIsOpen(false);
    applyConsent(preferences);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[999] max-w-md w-[calc(100vw-3rem)] animate-slide-in">
      <div className="bg-zinc-950/90 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-[0_0_50px_0_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Top decorative gradient bar */}
        <div className="h-[2px] w-full bg-gradient-to-r from-blue-500 via-[#06B6D4] to-emerald-400"></div>

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl shrink-0">
              <Cookie className="w-6 h-6 animate-pulse" />
            </div>
            
            <div className="flex-1 space-y-1">
              <h3 className="font-mono font-bold text-sm tracking-wider uppercase text-zinc-100 flex items-center gap-2">
                Cookie Consent <span className="text-[10px] text-zinc-500 font-normal lowercase bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded-full">mechitall.io</span>
              </h3>
              <p className="text-xs text-zinc-450 leading-relaxed font-sans">
                We use cookies to secure your session, personalize content, and analyze our traffic. Please choose which cookies you permit us to use.
              </p>
            </div>

            <button 
              onClick={handleRejectAll}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
              aria-label="Close and reject non-essential cookies"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Expanded customization section */}
          {showCustomize ? (
            <div className="mt-6 pt-5 border-t border-zinc-800/60 space-y-4">
              <h4 className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 mb-3">
                Cookie Preferences
              </h4>

              {/* Essential */}
              <div className="flex items-start justify-between gap-4 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/40">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-bold text-xs text-zinc-200">Necessary & Security</span>
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-semibold">Always Active</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    Required for basic site functionality, user login, and cart persistence.
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  disabled 
                  checked 
                  className="mt-1 h-4 w-4 rounded border-zinc-800 bg-zinc-950 text-blue-500 focus:ring-0 focus:ring-offset-0 disabled:opacity-50 accent-blue-500 cursor-not-allowed"
                />
              </div>

              {/* Analytics */}
              <div className="flex items-start justify-between gap-4 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/40">
                <div className="space-y-1">
                  <span className="font-sans font-bold text-xs text-zinc-200 block">Performance & Analytics</span>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    Allows us to count visits, track traffic sources, and monitor behavior (Google Analytics & Hotjar) to improve platform usability.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white peer-checked:after:border-emerald-500"></div>
                </label>
              </div>

              {/* Marketing */}
              <div className="flex items-start justify-between gap-4 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/40">
                <div className="space-y-1">
                  <span className="font-sans font-bold text-xs text-zinc-200 block">Marketing & Targeting</span>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    Used to track visitor actions across sites for relevant advertising and integrated campaign telemetry (Google Tag Manager).
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500 peer-checked:after:bg-white peer-checked:after:border-blue-500"></div>
                </label>
              </div>

              {/* Preference Actions */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setShowCustomize(false)}
                  className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-zinc-350 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="px-4 py-1.5 rounded-lg bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all font-mono text-[10px] uppercase tracking-wider border border-zinc-800"
                >
                  Save Selection
                </button>
              </div>
            </div>
          ) : (
            /* Main view actions */
            <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={() => setShowCustomize(true)}
                className="order-3 sm:order-1 px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl"
              >
                <Settings className="w-3.5 h-3.5" />
                Customize
              </button>
              
              <button
                onClick={handleRejectAll}
                className="order-2 sm:order-2 px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center bg-zinc-900/30 border border-zinc-800/20 hover:border-zinc-800 rounded-xl"
              >
                Necessary Only
              </button>

              <button
                onClick={handleAcceptAll}
                className="order-1 sm:order-3 flex-1 px-4 py-2 text-[10px] font-mono uppercase tracking-wider font-bold text-zinc-950 bg-gradient-to-r from-blue-400 to-[#06B6D4] hover:brightness-110 active:brightness-95 transition-all rounded-xl shadow-lg shadow-blue-500/10 flex items-center justify-center gap-1"
              >
                <Check className="w-3.5 h-3.5 stroke-[3px]" />
                Accept All
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
