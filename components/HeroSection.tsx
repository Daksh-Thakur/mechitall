'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Zap,
  Package,
  ArrowRight,
  Settings,
  Upload,
  Cpu,
} from 'lucide-react';

interface HeroSectionProps {
  onShuffle: () => void;
}

export default function HeroSection({ onShuffle }: HeroSectionProps) {
  const [currentAdSlide, setCurrentAdSlide] = useState(0);
  const AD_SLIDE_COUNT = 5;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentAdSlide((prev) => (prev + 1) % AD_SLIDE_COUNT);
    }, 5000);
    return () => clearInterval(timer);
  }, [AD_SLIDE_COUNT]);

  const adSlides = [
    {
      badge: 'Mech Ecosystem',
      title: 'Why MechItAll?',
      gradient: 'from-blue-500/10 to-zinc-900/40 border-blue-500/20',
      cta: 'Shuffle Catalog Parts',
      action: () => onShuffle(),
      content: (
        <div className="space-y-2.5">
          {[
            { icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Custom CAD Quoting', desc: 'Upload STEP/STL/PDF, sellers quote your design' },
            { icon: Package, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Same-Day Dispatch', desc: 'Orders placed before 2 PM ship today' },
            { icon: CheckCircle2, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Quality Certified', desc: 'ISO 9001:2015 & RoHS compliant parts' },
          ].map(({ icon: Icon, color, bg, label, desc }) => (
            <div key={label} className="flex items-center gap-3 p-2 bg-zinc-900/60 border border-zinc-700/60 rounded-xl">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-white leading-tight">{label}</span>
                <span className="block text-[10px] text-zinc-400">{desc}</span>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      badge: 'Loyalty Club',
      title: 'Join & Get 25 Welcome Bolts',
      gradient: 'from-amber-500/10 to-zinc-900/40 border-amber-500/20',
      cta: 'Create Free Account',
      link: '/login',
      content: (
        <div className="py-3 text-center space-y-4">
          <div className="inline-flex w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 items-center justify-center text-amber-500 shadow-sm animate-bounce">
            <Zap className="w-6 h-6 fill-amber-500" />
          </div>
          <div className="space-y-1 px-2">
            <span className="block text-lg font-mono font-black text-amber-400">25 BOLTS WELCOME BONUS</span>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-semibold">
              Create your Shopper Account today. Get 25 Bolts instantly to redeem as discount at checkout!
              Our points expire in 45 days.
            </p>
          </div>
        </div>
      )
    },
    {
      badge: 'Motors & Drives',
      title: 'Actuators & Stepper Motors',
      gradient: 'from-emerald-500/10 to-zinc-900/40 border-emerald-500/20',
      cta: 'Browse Actuators',
      link: '/products',
      content: (
        <div className="py-3 text-center space-y-4">
          <div className="inline-flex w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 items-center justify-center text-emerald-400 shadow-sm">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1 px-2">
            <span className="block text-xs font-black uppercase text-emerald-400 leading-tight">High-Torque Actuators</span>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-semibold">
              Closed-loop steppers, NEMA motors, and high-performance servo controllers. Complete stock with detailed specifications!
            </p>
          </div>
        </div>
      )
    },
    {
      badge: 'Electronics',
      title: 'Control Boards & Sensors',
      gradient: 'from-purple-500/10 to-zinc-900/40 border-purple-500/20',
      cta: 'Explore Controllers',
      link: '/products',
      content: (
        <div className="py-3 text-center space-y-4">
          <div className="inline-flex w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 items-center justify-center text-purple-400 shadow-sm">
            <Package className="w-6 h-6" />
          </div>
          <div className="space-y-1 px-2">
            <span className="block text-xs font-black uppercase text-purple-400 leading-tight">Makers &amp; Industrial controllers</span>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-semibold">
              ESP32 modules, Arduino boards, lidar modules, and visual sensor shields. All items include fully validated datasheets!
            </p>
          </div>
        </div>
      )
    },
    {
      badge: 'Custom Manufacturing',
      title: 'Get Custom Parts Made',
      gradient: 'from-blue-500/10 to-zinc-900/40 border-blue-500/20',
      cta: 'Browse Machining Services',
      link: '/machining',
      content: (
        <div className="space-y-2.5">
          {[
            { icon: Upload, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Upload Your CAD File', desc: 'STEP, STL, IGES, DXF, OBJ or PDF' },
            { icon: Settings, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'CNC, 3D Print, Laser Cut', desc: 'Multiple processes, one platform' },
            { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Seller Sends You a Quote', desc: 'Accept when the price suits you' },
          ].map(({ icon: Icon, color, bg, label, desc }) => (
            <div key={label} className="flex items-center gap-3 p-2 bg-zinc-900/60 border border-zinc-700/60 rounded-xl">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-white leading-tight">{label}</span>
                <span className="block text-[10px] text-zinc-400">{desc}</span>
              </div>
            </div>
          ))}
        </div>
      )
    }
  ];

  return (
    <section 
      className="relative overflow-hidden bg-zinc-900 border-b border-zinc-800 min-h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3.5rem)] flex items-center justify-center mt-0 text-zinc-100"
      style={{
        backgroundImage: 'linear-gradient(to right, rgba(59,130,246,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(59,130,246,0.02) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-500/10 to-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-emerald-500/5 to-blue-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="max-w-7xl mx-auto px-6 py-8 md:py-0 w-full flex flex-col md:flex-row items-center gap-8 md:gap-16 relative z-10">
        <div className="flex-1 space-y-8 animate-fade-in">
          <div className="space-y-2.5">
            <span className="inline-block font-mono text-[10px] font-extrabold uppercase tracking-[0.25em] text-emerald-400 bg-emerald-400/5 border border-emerald-400/15 px-2.5 py-1 rounded">
              Browse. Buy. Build
            </span>
            <p className="text-xs md:text-sm text-zinc-400 max-w-xl leading-relaxed font-semibold">
              Stop wrestling with fragmented sourcing and machining delays. The all-in-one hub for off-the-shelf components and instant custom CAD quoting.
            </p>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-[1.05] font-['Space_Grotesk']">
            Off-The-Shelf &amp;<br />
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-emerald-400 bg-clip-text text-transparent">
              Custom CAD Sourcing
            </span>
          </h1>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/products"
              className="bg-emerald-400 hover:bg-emerald-350 text-zinc-950 px-7 py-3.5 rounded font-extrabold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-emerald-950/20 font-['JetBrains_Mono'] uppercase tracking-wider"
            >
              <span>Shop All Parts</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/machining"
              className="bg-zinc-800 border border-zinc-700/60 hover:bg-zinc-700/80 hover:border-blue-500/30 text-white px-7 py-3.5 rounded font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors font-['JetBrains_Mono'] uppercase tracking-wider"
            >
              <Settings className="w-4 h-4 text-blue-400" />
              <span>Get Custom Parts</span>
            </Link>
          </div>

          <div className="border-t border-zinc-800 pt-8 grid grid-cols-3 gap-8">
            <div>
              <span className="block text-2xl md:text-3xl font-bold text-blue-400 font-mono">2 - 4 Days</span>
              <span className="block text-[9px] uppercase tracking-wider text-zinc-500 font-bold font-mono mt-0.5">Avg. Delivery</span>
            </div>
            <div>
              <span className="block text-2xl md:text-3xl font-bold text-emerald-400 font-mono">No Min.</span>
              <span className="block text-[9px] uppercase tracking-wider text-zinc-500 font-bold font-mono mt-0.5">Order MOQ</span>
            </div>
            <div>
              <span className="block text-2xl md:text-3xl font-bold text-white font-mono">10,000+</span>
              <span className="block text-[9px] uppercase tracking-wider text-zinc-500 font-bold font-mono mt-0.5">Parts in Stock</span>
            </div>
          </div>
        </div>

        <div className="w-full md:w-[460px] z-10 shrink-0 select-none">
          <div 
            className={`bg-zinc-800 border border-zinc-700/60 p-6 rounded-2xl shadow-lg flex flex-col justify-between h-[360px] transition-all duration-500 bg-gradient-to-br ${adSlides[currentAdSlide].gradient}`}
            style={{
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3), 0 4px 6px -4px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-700/60 text-zinc-300 font-mono shadow-sm">
                {adSlides[currentAdSlide].badge}
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentAdSlide((prev) => (prev - 1 + AD_SLIDE_COUNT) % AD_SLIDE_COUNT)}
                  className="p-1 rounded hover:bg-zinc-700/60 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setCurrentAdSlide((prev) => (prev + 1) % AD_SLIDE_COUNT)}
                  className="p-1 rounded hover:bg-zinc-700/60 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Next Slide"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 py-4 flex flex-col justify-center animate-slide-in">
              <h3 className="text-xs font-black text-white uppercase tracking-wider text-center mb-3 font-mono">
                {adSlides[currentAdSlide].title}
              </h3>
              {adSlides[currentAdSlide].content}
            </div>

            <div className="space-y-4">
              {adSlides[currentAdSlide].link ? (
                <Link
                  href={adSlides[currentAdSlide].link!}
                  className="w-full bg-zinc-900 hover:bg-zinc-700 text-white py-2.5 rounded border border-zinc-700/60 font-bold text-xs text-center flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md font-['JetBrains_Mono'] uppercase tracking-wider"
                >
                  <span>{adSlides[currentAdSlide].cta}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                </Link>
              ) : (
                <button
                  onClick={adSlides[currentAdSlide].action}
                  className="w-full bg-zinc-900 hover:bg-zinc-700 text-white py-2.5 rounded border border-zinc-700/60 font-bold text-xs text-center flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md font-['JetBrains_Mono'] uppercase tracking-wider"
                >
                  <span>{adSlides[currentAdSlide].cta}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                </button>
              )}

              <div className="flex justify-center gap-1.5 pt-1">
                {adSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentAdSlide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      currentAdSlide === idx
                        ? 'bg-blue-400 w-4'
                        : 'w-1.5 bg-zinc-750 hover:bg-zinc-600'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
