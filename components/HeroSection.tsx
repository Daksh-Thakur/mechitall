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
      gradient: 'from-blue-500/10 to-cobalt/5 border-cobalt/15',
      cta: 'Shuffle Catalog Parts',
      action: () => onShuffle(),
      content: (
        <div className="space-y-2.5">
          {[
            { icon: Zap, color: 'text-cobalt', bg: 'bg-cobalt/10', label: 'Custom CAD Quoting', desc: 'Upload STEP/STL/PDF, sellers quote your design' },
            { icon: Package, color: 'text-emerald', bg: 'bg-emerald/10', label: 'Same-Day Dispatch', desc: 'Orders placed before 2 PM ship today' },
            { icon: CheckCircle2, color: 'text-coral', bg: 'bg-coral/10', label: 'Quality Certified', desc: 'ISO 9001:2015 & RoHS compliant parts' },
          ].map(({ icon: Icon, color, bg, label, desc }) => (
            <div key={label} className="flex items-center gap-3 p-2 bg-white/40 border border-[#E4E4E7] rounded-xl">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-[#0F172A] leading-tight">{label}</span>
                <span className="block text-[10px] text-slate-text-muted">{desc}</span>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      badge: 'Loyalty Club',
      title: 'Join & Get 25 Welcome Bolts',
      gradient: 'from-amber-500/10 to-amber-500/5 border-amber-500/20',
      cta: 'Create Free Account',
      link: '/login',
      content: (
        <div className="py-3 text-center space-y-4">
          <div className="inline-flex w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 items-center justify-center text-amber-500 shadow-sm animate-bounce">
            <Zap className="w-6 h-6 fill-amber-500" />
          </div>
          <div className="space-y-1 px-2">
            <span className="block text-lg font-mono font-black text-amber-500">25 BOLTS WELCOME BONUS</span>
            <p className="text-[11px] text-[#45464d] leading-relaxed font-semibold">
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
      gradient: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
      cta: 'Browse Actuators',
      link: '/products',
      content: (
        <div className="py-3 text-center space-y-4">
          <div className="inline-flex w-12 h-12 rounded-xl bg-emerald/10 border border-emerald/30 items-center justify-center text-emerald shadow-sm">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1 px-2">
            <span className="block text-xs font-black uppercase text-emerald leading-tight">High-Torque Actuators</span>
            <p className="text-[11px] text-[#45464d] leading-relaxed font-semibold">
              Closed-loop steppers, NEMA motors, and high-performance servo controllers. Complete stock with detailed specifications!
            </p>
          </div>
        </div>
      )
    },
    {
      badge: 'Electronics',
      title: 'Control Boards & Sensors',
      gradient: 'from-purple-500/10 to-purple-500/5 border-purple-500/20',
      cta: 'Explore Controllers',
      link: '/products',
      content: (
        <div className="py-3 text-center space-y-4">
          <div className="inline-flex w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 items-center justify-center text-purple-500 shadow-sm">
            <Package className="w-6 h-6" />
          </div>
          <div className="space-y-1 px-2">
            <span className="block text-xs font-black uppercase text-purple-500 leading-tight">Makers &amp; Industrial controllers</span>
            <p className="text-[11px] text-[#45464d] leading-relaxed font-semibold">
              ESP32 modules, Arduino boards, lidar modules, and visual sensor shields. All items include fully validated datasheets!
            </p>
          </div>
        </div>
      )
    },
    {
      badge: 'Custom Manufacturing',
      title: 'Get Custom Parts Made',
      gradient: 'from-orange-500/10 to-red-500/5 border-orange-500/20',
      cta: 'Browse Machining Services',
      link: '/machining',
      content: (
        <div className="space-y-2.5">
          {[
            { icon: Upload, color: 'text-orange-600', bg: 'bg-orange-500/10', label: 'Upload Your CAD File', desc: 'STEP, STL, IGES, DXF, OBJ or PDF' },
            { icon: Settings, color: 'text-blue-600', bg: 'bg-blue-500/10', label: 'CNC, 3D Print, Laser Cut', desc: 'Multiple processes, one platform' },
            { icon: CheckCircle2, color: 'text-emerald', bg: 'bg-emerald/10', label: 'Seller Sends You a Quote', desc: 'Accept when the price suits you' },
          ].map(({ icon: Icon, color, bg, label, desc }) => (
            <div key={label} className="flex items-center gap-3 p-2 bg-white/40 border border-[#E4E4E7] rounded-xl">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-[#0F172A] leading-tight">{label}</span>
                <span className="block text-[10px] text-slate-text-muted">{desc}</span>
              </div>
            </div>
          ))}
        </div>
      )
    }
  ];

  return (
    <section 
      className="relative overflow-hidden bg-white border-b border-[#E4E4E7] min-h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3.5rem)] flex items-center justify-center mt-0"
      style={{
        backgroundImage: 'linear-gradient(to right, rgba(6,182,212,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(6,182,212,0.03) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-cobalt/5 to-emerald/3 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-emerald/3 to-cobalt/3 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="max-w-7xl mx-auto px-6 py-8 md:py-0 w-full flex flex-col md:flex-row items-center gap-8 md:gap-16 relative z-10">
        <div className="flex-1 space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#0F172A] leading-[1.05] font-['Space_Grotesk']">
            Shop Premium<br />
            <span className="bg-gradient-to-r from-cobalt via-blue-500 to-emerald bg-clip-text text-transparent">
              Mechatronic Hardware
            </span>
          </h1>

          <p className="text-sm md:text-base text-[#45464d] max-w-xl font-medium leading-relaxed">
            Buy actuators, sensors, controllers, and premium components for makers, engineers, and businesses. Same-day dispatch and quality verification on all items.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/products"
              className="bg-[#0F172A] hover:bg-[#06B6D4] text-white px-7 py-3.5 rounded font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-slate-900/10 font-['JetBrains_Mono'] uppercase tracking-wider"
            >
              <span>Shop All Parts</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/machining"
              className="bg-white border border-[#E4E4E7] hover:border-[#0F172A] text-[#0F172A] px-7 py-3.5 rounded font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors font-['JetBrains_Mono'] uppercase tracking-wider"
            >
              <Settings className="w-4 h-4" />
              <span>Get Custom Parts</span>
            </Link>
          </div>

          <div className="border-t border-[#E4E4E7] pt-8 grid grid-cols-3 gap-8">
            <div>
              <span className="block text-2xl md:text-3xl font-bold text-cobalt font-['Space_Grotesk']">2 - 4 Days</span>
              <span className="block text-[9px] uppercase tracking-wider text-slate-text-muted font-bold font-mono mt-0.5">Avg. Delivery</span>
            </div>
            <div>
              <span className="block text-2xl md:text-3xl font-bold text-emerald font-['Space_Grotesk']">No Min.</span>
              <span className="block text-[9px] uppercase tracking-wider text-slate-text-muted font-bold font-mono mt-0.5">Order MOQ</span>
            </div>
            <div>
              <span className="block text-2xl md:text-3xl font-bold text-[#0F172A] font-['Space_Grotesk']">10,000+</span>
              <span className="block text-[9px] uppercase tracking-wider text-slate-text-muted font-bold font-mono mt-0.5">Parts in Stock</span>
            </div>
          </div>
        </div>

        <div className="w-full md:w-[460px] z-10 shrink-0 select-none">
          <div 
            className={`bg-white border border-[#E4E4E7] p-6 rounded-2xl shadow-lg flex flex-col justify-between h-[360px] transition-all duration-500 bg-gradient-to-br ${adSlides[currentAdSlide].gradient}`}
            style={{
              boxShadow: '0 10px 15px -3px rgba(15,23,42,0.08), 0 4px 6px -4px rgba(15,23,42,0.08)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white border border-[#E4E4E7] text-[#45464d] font-mono shadow-sm">
                {adSlides[currentAdSlide].badge}
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentAdSlide((prev) => (prev - 1 + AD_SLIDE_COUNT) % AD_SLIDE_COUNT)}
                  className="p-1 rounded hover:bg-white/60 text-[#45464d] hover:text-[#0F172A] transition-colors cursor-pointer"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setCurrentAdSlide((prev) => (prev + 1) % AD_SLIDE_COUNT)}
                  className="p-1 rounded hover:bg-white/60 text-[#45464d] hover:text-[#0F172A] transition-colors cursor-pointer"
                  aria-label="Next Slide"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 py-4 flex flex-col justify-center animate-slide-in">
              <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider text-center mb-3 font-mono">
                {adSlides[currentAdSlide].title}
              </h3>
              {adSlides[currentAdSlide].content}
            </div>

            <div className="space-y-4">
              {adSlides[currentAdSlide].link ? (
                <Link
                  href={adSlides[currentAdSlide].link!}
                  className="w-full bg-[#0F172A] hover:bg-[#06B6D4] text-white py-2.5 rounded font-bold text-xs text-center flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md font-['JetBrains_Mono'] uppercase tracking-wider"
                >
                  <span>{adSlides[currentAdSlide].cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <button
                  onClick={adSlides[currentAdSlide].action}
                  className="w-full bg-[#0F172A] hover:bg-[#06B6D4] text-white py-2.5 rounded font-bold text-xs text-center flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md font-['JetBrains_Mono'] uppercase tracking-wider"
                >
                  <span>{adSlides[currentAdSlide].cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              <div className="flex justify-center gap-1.5 pt-1">
                {adSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentAdSlide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      currentAdSlide === idx
                        ? 'bg-[#0F172A] w-4'
                        : 'w-1.5 bg-[#E4E4E7] hover:bg-slate-300'
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
