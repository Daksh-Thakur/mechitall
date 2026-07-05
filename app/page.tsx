'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import ServiceModal from '../components/ServiceModal';
import { Part } from '../components/mockData';
import { createClient } from '@/utils/supabase/client';
import {
  Cpu,
  ChevronRight,
  ChevronLeft,
  FileUp,
  ShieldCheck,
  Info,
  Shuffle,
  CheckCircle2,
  Zap,
  Package,
  Users,
  ArrowRight,
  Star,
} from 'lucide-react';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Home() {
  const [allParts, setAllParts] = useState<Part[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [selectedService, setSelectedService] = useState<any | null>(null);

  // Shuffled subsets for discovery
  const [displayedParts, setDisplayedParts] = useState<Part[]>([]);
  const [displayedServices, setDisplayedServices] = useState<any[]>([]);
  const [shuffleKey, setShuffleKey] = useState(0);

  // Hero Ad Carousel state
  const [currentAdSlide, setCurrentAdSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentAdSlide((prev) => (prev + 1) % 4);
    }, 5000); // 5 seconds auto-scroll
    return () => clearInterval(timer);
  }, []);

  const adSlides = [
    {
      badge: 'Mech Ecosystem',
      title: 'Why MechItAll?',
      gradient: 'from-blue-500/10 to-cobalt/5 border-cobalt/15',
      cta: 'Shuffle Catalog Parts',
      action: () => handleShuffle(),
      content: (
        <div className="space-y-2.5">
          {[
            { icon: Zap, color: 'text-cobalt', bg: 'bg-cobalt/10', label: 'Instant CAD Quoting', desc: 'Upload STEP/STL, get price in seconds' },
            { icon: Package, color: 'text-emerald', bg: 'bg-emerald/10', label: 'Same-Day Dispatch', desc: 'Orders placed before 2 PM ship today' },
            { icon: CheckCircle2, color: 'text-coral', bg: 'bg-coral/10', label: 'Quality Certified', desc: 'ISO 9001:2015 & RoHS compliant parts' },
          ].map(({ icon: Icon, color, bg, label, desc }) => (
            <div key={label} className="flex items-center gap-3 p-2 bg-white/40 border border-slate-border/50 rounded-xl">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-slate-text-primary leading-tight">{label}</span>
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
            <span className="block text-lg font-mono font-black text-amber-500">25 BOLTS SIGN-IN BONUS</span>
            <p className="text-[11px] text-slate-text-secondary leading-relaxed font-semibold">
              Create your Shopper Account today. Get 25 Bolts instantly to redeem as discount at checkout!
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
            <p className="text-[11px] text-slate-text-secondary leading-relaxed font-semibold">
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
            <p className="text-[11px] text-slate-text-secondary leading-relaxed font-semibold">
              ESP32 modules, Arduino boards, lidar modules, and visual sensor shields. All items include fully validated datasheets!
            </p>
          </div>
        </div>
      )
    }
  ];

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const { data: productsData } = await supabase.from('products').select('*');
        const { data: servicesData } = await supabase.from('services').select('*');

        const mappedParts: Part[] = (productsData || []).map((p: any) => ({
          id: p.id,
          partNumber: p.part_number,
          title: p.title,
          category: p.category,
          price: Number(p.price),
          stock: p.stock,
          description: p.description || '',
          gradientClass: p.gradient_class || '',
          specs: p.specs || {},
          bulkPricing: p.bulk_pricing || [],
          datasheetUrl: p.datasheet_url || '',
          cadFile: p.cad_file || '',
          extendedSpecs: p.extended_specs || { dimensions: '', temperatureRange: '', mtbf: '', ingressProtection: '' },
        }));

        setAllParts(mappedParts);
        setAllServices(servicesData || []);
        setDisplayedParts(shuffle(mappedParts).slice(0, 5));
        setDisplayedServices(shuffle(servicesData || []).slice(0, 5));
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleShuffle = useCallback(() => {
    setDisplayedParts(shuffle(allParts).slice(0, 5));
    setDisplayedServices(shuffle(allServices).slice(0, 5));
    setShuffleKey(k => k + 1);
  }, [allParts, allServices]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-white border-b border-slate-border">
          {/* Background blobs */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-cobalt/8 to-emerald/5 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-emerald/5 to-cobalt/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

          <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 flex flex-col md:flex-row items-center gap-16 relative z-10" style={{ paddingTop: '20px' }}>
            <div className="flex-1 space-y-8">
              {/* <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cobalt/5 border border-cobalt/15 text-cobalt text-[11px] font-bold">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cobalt opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cobalt"></span>
                </span>
                ISO 9001:2015 Certified · Free Shipping above ₹5,000
              </div>*/}

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-text-primary leading-[1.02]">
                Shop Premium<br />
                <span className="bg-gradient-to-r from-cobalt via-blue-500 to-emerald bg-clip-text text-transparent">
                  Mechatronic Hardware
                </span>
              </h1>

              <p className="text-base md:text-lg text-slate-text-secondary max-w-xl font-medium leading-relaxed">
                Buy actuators, sensors, controllers, and premium components for makers, engineers, and businesses. Same-day dispatch and quality verification on all items.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/products"
                  className="btn-cobalt px-7 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <span>Shop All Parts</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Stats */}
              <div className="border-t border-slate-border/60 pt-8 grid grid-cols-3 gap-8">
                <div>
                  <span className="block text-2xl md:text-3xl font-extrabold text-cobalt">2 - 4 days</span>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-text-muted font-bold mt-0.5">Avg. Delivery</span>
                </div>
                <div>
                  <span className="block text-2xl md:text-3xl font-extrabold text-emerald">No Min.</span>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-text-muted font-bold mt-0.5">Order 1 or 10,000 units</span>
                </div>
                <div>
                  <span className="block text-2xl md:text-3xl font-extrabold text-slate-text-primary">10,000+</span>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-text-muted font-bold mt-0.5">Parts In Stock</span>
                </div>
              </div>
            </div>

            {/* Hero card - Advertisement Carousel Panel */}
            <div className="w-full md:w-[460px] z-10 shrink-0 select-none">
              <div className={`glassmorphism p-6 rounded-2xl border shadow-lg flex flex-col justify-between h-[360px] transition-all duration-500 bg-gradient-to-br ${adSlides[currentAdSlide].gradient}`}>
                
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/80 text-slate-text-secondary border border-slate-border shadow-sm">
                    {adSlides[currentAdSlide].badge}
                  </span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setCurrentAdSlide((prev) => (prev - 1 + 4) % 4)}
                      className="p-1 rounded-md hover:bg-slate-bg/80 text-slate-text-secondary hover:text-slate-text-primary transition-colors cursor-pointer"
                      aria-label="Previous Slide"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setCurrentAdSlide((prev) => (prev + 1) % 4)}
                      className="p-1 rounded-md hover:bg-slate-bg/80 text-slate-text-secondary hover:text-slate-text-primary transition-colors cursor-pointer"
                      aria-label="Next Slide"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 py-4 flex flex-col justify-center animate-slide-in">
                  <h3 className="text-sm font-black text-slate-text-primary uppercase tracking-tight text-center mb-3">
                    {adSlides[currentAdSlide].title}
                  </h3>
                  {adSlides[currentAdSlide].content}
                </div>

                {/* Action CTA Button & Dots */}
                <div className="space-y-4">
                  {adSlides[currentAdSlide].link ? (
                    <Link
                      href={adSlides[currentAdSlide].link!}
                      className="w-full btn-cobalt py-2.5 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>{adSlides[currentAdSlide].cta}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <button
                      onClick={adSlides[currentAdSlide].action}
                      className="w-full btn-cobalt py-2.5 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>{adSlides[currentAdSlide].cta}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Indicator Dots */}
                  <div className="flex justify-center gap-1.5 pt-1">
                    {adSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentAdSlide(idx)}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                          currentAdSlide === idx 
                            ? 'bg-cobalt w-3.5' 
                            : 'bg-slate-text-muted/40 hover:bg-slate-text-muted/60'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      ></button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* DISCOVER PRODUCTS */}
        <section className="max-w-7xl mx-auto px-6 py-16 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-cobalt">Discover Today</span>
              <h2 className="text-3xl font-extrabold text-slate-text-primary tracking-tight">Featured Products</h2>
              <p className="text-xs text-slate-text-muted font-medium">A curated selection of our in-stock mechatronics parts — refreshed every visit.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShuffle}
                className="btn-secondary px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" /> Shuffle
              </button>
              <Link
                href="/products"
                className="btn-cobalt px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                View Full Catalog <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 animate-pulse">
              {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className="bg-slate-bg/30 border border-slate-border/50 rounded-xl p-5 h-72"></div>
              ))}
            </div>
          ) : displayedParts.length > 0 ? (
            <div key={`parts-${shuffleKey}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {displayedParts.map(part => (
                <ProductCard key={part.id} part={part} onViewDetails={setSelectedPart} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-slate-border rounded-2xl bg-white">
              <Cpu className="w-12 h-12 text-slate-text-muted/30 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-text-primary">No products yet</p>
              <p className="text-xs text-slate-text-muted">Products will appear here once added to the catalog.</p>
            </div>
          )}

          {/* CTA strip */}
          <div className="flex items-center justify-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm font-bold text-cobalt hover:text-cobalt-hover transition-colors group"
            >
              Explore all {allParts.length > 0 ? `${allParts.length}+` : ''} parts in our catalog
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>



        {/* COMMUNITY TEASER */}
        <section className="bg-gradient-to-br from-slate-text-primary to-slate-text-secondary text-white">
          <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold">
                <Users className="w-3.5 h-3.5" /> MechItAll Community
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                Join a community of<br />
                <span className="text-cobalt">makers &amp; engineers</span>
              </h2>
              <p className="text-sm text-white/70 max-w-md leading-relaxed">
                Share your builds, read peer reviews, stay updated with product announcements, and connect with fellow mechatronics enthusiasts.
              </p>
              <div className="flex items-center gap-3">
                {[
                  { icon: Star, label: 'Reviews' },
                  { icon: Zap, label: 'News' },
                  { icon: Info, label: 'Announcements' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
                    <Icon className="w-3 h-3" /> {label}
                  </span>
                ))}
              </div>
            </div>
            <Link
              href="/community"
              className="shrink-0 btn-cobalt px-8 py-4 rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer shadow-xl"
            >
              Visit Community <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />

      {/* Product Modal */}
      {selectedPart && (
        <ProductModal part={selectedPart} onClose={() => setSelectedPart(null)} />
      )}

      {/* Service Modal */}
      {selectedService && (
        <ServiceModal service={selectedService} onClose={() => setSelectedService(null)} />
      )}
    </div>
  );
}
