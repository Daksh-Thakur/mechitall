'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import ServiceCard from '../components/ServiceCard';
import ProductModal from '../components/ProductModal';
import ServiceModal from '../components/ServiceModal';
import HeroSection from '../components/HeroSection';
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
  Settings,
  Upload,
  Clock,
  Layers,
  Sparkles,
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
  const router = useRouter();
  const [allParts, setAllParts] = useState<Part[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [selectedService, setSelectedService] = useState<any | null>(null);

  const handleGetQuote = useCallback((service: any) => {
    router.push(`/machining?quote=${service.id}`);
  }, [router]);

  // Shuffled subsets for discovery
  const [displayedParts, setDisplayedParts] = useState<Part[]>([]);
  const [displayedServices, setDisplayedServices] = useState<any[]>([]);
  const [displayedMachining, setDisplayedMachining] = useState<any[]>([]);
  const [shuffleKey, setShuffleKey] = useState(0);



  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const { data: productsData } = await supabase.from('products').select('*');
        const { data: servicesData } = await supabase.from('services').select('*');
        const { data: machiningData } = await supabase
          .from('machining_services')
          .select('*, profiles:seller_profile_id(full_name)')
          .order('created_at', { ascending: false })
          .limit(6);

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
          imageData: p.image_data || undefined,
          imagesData: p.images_data || []
        }));

        setAllParts(mappedParts);
        setAllServices(servicesData || []);
        setDisplayedParts(shuffle(mappedParts).slice(0, 4));
        setDisplayedServices(shuffle(servicesData || []).slice(0, 4));
        setDisplayedMachining((machiningData || []).map((s: any) => ({
          ...s,
          seller_name: s.profiles?.full_name || 'Expert Maker'
        })));
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleShuffle = useCallback(() => {
    setDisplayedParts(shuffle(allParts).slice(0, 4));
    setDisplayedServices(shuffle(allServices).slice(0, 4));
    setShuffleKey(k => k + 1);
  }, [allParts, allServices]);

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 font-sans flex flex-col overflow-x-clip">
      <Navbar />

      <main className="flex-1 mt-0">
        <HeroSection onShuffle={handleShuffle} />

        {/* WHY MECHITALL MATRIX */}
        <section className="bg-zinc-950 text-zinc-100 py-16 border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-6 space-y-10">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-emerald-400 bg-emerald-400/5 border border-emerald-400/15 px-3 py-1 rounded">
                Why MechItAll?
              </span>
              <h2 className="text-3xl font-bold text-white tracking-tight font-['Space_Grotesk'] mt-2">Engineered for Reliability</h2>
              <p className="text-xs text-zinc-400 max-w-lg mx-auto font-medium">We solve mechatronic sourcing fragmentation by offering verified hardware and rapid local manufacturing.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* PayU Escrow Protection */}
              <div className="bg-zinc-800 border border-zinc-700/60 p-6 rounded-2xl space-y-4 hover:border-emerald-400/40 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white font-['Space_Grotesk']">PayU Escrow Protection</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans font-medium">
                    Sellers are only paid once you inspect and approve the delivered parts. Zero risk of unfulfilled custom orders or counterfeit components.
                  </p>
                </div>
              </div>

              {/* Instant 3D File Estimations */}
              <div className="bg-zinc-800 border border-zinc-700/60 p-6 rounded-2xl space-y-4 hover:border-blue-500/40 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                  <FileUp className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white font-['Space_Grotesk']">Instant 3D File Estimations</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans font-medium">
                    Upload your STEP, STL, or PDF files. Our manufacturing partners parse your CAD model to return instant cost estimations and lead times.
                  </p>
                </div>
              </div>

              {/* Same-Day Dispatch */}
              <div className="bg-zinc-800 border border-zinc-700/60 p-6 rounded-2xl space-y-4 hover:border-emerald-400/40 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white font-['Space_Grotesk']">Same-Day Dispatch</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans font-medium">
                    Catalog components ordered before <span className="font-mono text-emerald-400">14:00 IST</span> are dispatched same-day. Express logistics across pan-India routes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRUSTED MAKERS & CASE STUDIES */}
        <section className="bg-zinc-900 text-zinc-100 py-16 border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-6 space-y-12">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-blue-400 bg-blue-400/5 border border-blue-400/15 px-3 py-1 rounded">
                Trusted Makers &amp; Case Studies
              </span>
              <h2 className="text-3xl font-bold text-white tracking-tight font-['Space_Grotesk'] mt-2">Powering Next-Gen Robotics</h2>
              <p className="text-xs text-zinc-400 max-w-lg mx-auto font-medium">From premier university labs to venture-backed UAV startups, engineers choose MechItAll.</p>
            </div>

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-zinc-805 border border-zinc-800 p-6 rounded-2xl space-y-4 relative">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <p className="text-xs text-zinc-300 italic leading-relaxed">
                  "MechItAll solved our sourcing bottlenecks overnight. We were able to procure NEMA 23 motors and get custom CNC-milled mounting plates quoted and dispatched within 4 days. The PayU escrow protection gave our finance team peace of mind."
                </p>
                <div>
                  <span className="block text-xs font-bold text-white font-['Space_Grotesk']">Dr. Aris Thorne</span>
                  <span className="block text-[10px] text-zinc-500 font-mono">Lead Kinematics Researcher, AeroDrive Labs</span>
                </div>
              </div>

              <div className="bg-zinc-805 border border-zinc-800 p-6 rounded-2xl space-y-4 relative">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <p className="text-xs text-zinc-300 italic leading-relaxed">
                  "As a DIY maker building autonomous rovers, finding high-quality mechatronics without high MOQs was nearly impossible. MechItAll has changed that. The Nuts &amp; Bolts loyalty program keeps my prototyping costs extremely low."
                </p>
                <div>
                  <span className="block text-xs font-bold text-white font-['Space_Grotesk']">Kabir Sen</span>
                  <span className="block text-[10px] text-zinc-500 font-mono">Founding Engineer, Veloce UAVs</span>
                </div>
              </div>
            </div>

            {/* Maker Logo Grid Placeholder */}
            <div className="pt-6 border-t border-zinc-800/60">
              <p className="text-center text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 mb-6">
                Accredited Collaborations &amp; Maker Networks
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-items-center opacity-40">
                <div className="flex items-center gap-2 text-white font-['Space_Grotesk'] font-bold text-sm tracking-wide">
                  <Cpu className="w-5 h-5 text-blue-400" /> AERO_DRIVE
                </div>
                <div className="flex items-center gap-2 text-white font-['Space_Grotesk'] font-bold text-sm tracking-wide">
                  <Settings className="w-5 h-5 text-emerald-400" /> HINDUSTAN_ROBOTICS
                </div>
                <div className="flex items-center gap-2 text-white font-['Space_Grotesk'] font-bold text-sm tracking-wide">
                  <Zap className="w-5 h-5 text-blue-400" /> VELOCE_UAVS
                </div>
                <div className="flex items-center gap-2 text-white font-['Space_Grotesk'] font-bold text-sm tracking-wide">
                  <Users className="w-5 h-5 text-emerald-400" /> IIT_MECHATRONICS
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED PRODUCTS SECTION */}
        <section className="max-w-7xl mx-auto px-6 py-16 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/5 border border-emerald-400/15 px-3 py-1 rounded">
                E-Commerce Catalog
              </span>
              <h2 className="text-3xl font-bold text-white tracking-tight font-['Space_Grotesk'] mt-2">Featured Products</h2>
              <p className="text-xs text-zinc-400 font-medium">A curated selection of our in-stock mechatronics parts — refreshed every visit.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShuffle}
                className="bg-zinc-800 border border-zinc-700/60 hover:bg-zinc-700 hover:text-white text-zinc-300 px-4 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all font-['JetBrains_Mono'] uppercase tracking-wider"
              >
                <Shuffle className="w-3.5 h-3.5" /> Shuffle
              </button>
              <Link
                href="/products"
                className="bg-emerald-400 hover:bg-emerald-350 text-zinc-950 px-4 py-2 text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all font-['JetBrains_Mono'] uppercase tracking-wider shadow-lg shadow-emerald-950/20"
              >
                View Full Catalog <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="bg-zinc-800 border border-zinc-700/60 h-64">
                  <div className="h-32 md:h-36 bg-zinc-900/50" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-zinc-700 w-3/4" />
                    <div className="h-2 bg-zinc-700 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayedParts.length > 0 ? (
            <div key={`parts-${shuffleKey}`} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayedParts.map(part => (
                <ProductCard key={part.id} part={part} onViewDetails={setSelectedPart} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-zinc-800 bg-zinc-900/40 rounded-2xl">
              <Cpu className="w-12 h-12 text-zinc-750 mx-auto mb-3" />
              <p className="text-sm font-bold text-white">No products yet</p>
              <p className="text-xs text-zinc-500">Products will appear here once added to the catalog.</p>
            </div>
          )}

          {/* CTA strip */}
          <div className="flex items-center justify-center pt-2">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors group font-['JetBrains_Mono'] uppercase tracking-wider"
            >
              Explore all {allParts.length > 0 ? `${allParts.length}+` : ''} parts in our catalog
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* CUSTOM MANUFACTURING TEASER */}
        <section className="max-w-7xl mx-auto px-6 py-16 space-y-8 border-t border-zinc-800/80">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-400 bg-blue-500/5 border border-blue-500/15 px-3 py-1 rounded">
                On-Demand Fabrication
              </span>
              <h2 className="text-3xl font-bold text-white tracking-tight font-['Space_Grotesk'] mt-2">Custom Machining Hub</h2>
              <p className="text-xs text-zinc-400 font-medium">Upload your CAD files and get custom parts made by verified local machining services.</p>
            </div>
            <Link
              href="/machining"
              className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors font-['JetBrains_Mono'] uppercase tracking-wider shrink-0"
            >
              Browse All Services <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* How it works grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: Upload, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/15', step: '01', title: 'Upload Design File', desc: 'Share your STEP, STL, IGES, DXF, OBJ or PDF file directly with a seller.' },
              { icon: Settings, color: 'text-blue-450', bg: 'bg-blue-500/5 border-blue-500/10', step: '02', title: 'Seller Reviews & Quotes', desc: 'The machining expert reviews your geometry and sends back a custom price quote.' },
              { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/15', step: '03', title: 'Accept & Get Parts Made', desc: 'Accept the offer when satisfied. Track your manufacturing order from your dashboard.' },
            ].map(({ icon: Icon, color, bg, step, title, desc }) => (
              <div 
                key={step} 
                className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-6 space-y-4 hover:border-blue-500/40 hover:-translate-y-0.5 transition-all duration-200"
                style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -2px rgba(0,0,0,0.2)' }}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded flex items-center justify-center ${bg} border`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 font-mono uppercase tracking-widest">Step {step}</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white font-['Space_Grotesk']">{title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-1 font-semibold opacity-85">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Featured machining service cards */}
          {displayedMachining.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
              {displayedMachining.slice(0, 3).map((service: any) => (
                <ServiceCard key={service.id} service={service} onGetQuote={handleGetQuote} />
              ))}
            </div>
          )}

          <div className="flex items-center justify-center pt-2">
            <Link
              href="/machining"
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors group font-['JetBrains_Mono'] uppercase tracking-wider"
            >
              Explore all machining services
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* COMMUNITY TEASER */}
        <section className="bg-[#0F172A] text-white relative overflow-hidden"
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(6,182,212,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(6,182,212,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        >
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-cobalt/10 to-transparent rounded-full blur-3xl pointer-events-none -ml-40 -mt-45" />
          
          <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold font-mono uppercase tracking-widest text-[#06B6D4]">
                <Users className="w-3.5 h-3.5" /> MechItAll Community
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-[1.1] font-['Space_Grotesk']">
                Join a community of<br />
                <span className="bg-gradient-to-r from-cobalt to-emerald bg-clip-text text-transparent">makers &amp; engineers</span>
              </h2>
              <p className="text-sm text-slate-text-muted max-w-md leading-relaxed font-semibold opacity-90">
                Share your builds, read peer reviews, stay updated with product announcements, and connect with fellow mechatronics enthusiasts.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {[
                  { icon: Star, label: 'Reviews' },
                  { icon: Zap, label: 'News Log' },
                  { icon: Info, label: 'Bulletins' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 text-[10px] font-bold font-mono uppercase tracking-wider px-3.5 py-1.5 rounded bg-white/5 border border-white/10">
                    <Icon className="w-3.5 h-3.5 text-[#06B6D4]" /> {label}
                  </span>
                ))}
              </div>
            </div>
            <Link
              href="/community"
              className="shrink-0 bg-[#06B6D4] hover:bg-[#0891B2] text-[#0F172A] px-8 py-4 rounded font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-xl shadow-cyan-950/20 font-['JetBrains_Mono'] uppercase tracking-wider"
            >
              Visit Community <ArrowRight className="w-4.5 h-4.5" />
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
