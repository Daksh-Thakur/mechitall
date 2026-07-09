'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
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
  const [allParts, setAllParts] = useState<Part[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [selectedService, setSelectedService] = useState<any | null>(null);

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
    <div className="min-h-screen bg-[#F8FAFC] text-[#1b1b1d] font-sans flex flex-col overflow-x-clip">
      <Navbar />

      <main className="flex-1 mt-0">
        <HeroSection onShuffle={handleShuffle} />

        {/* FEATURED PRODUCTS SECTION */}
        <section className="max-w-7xl mx-auto px-6 py-16 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cobalt bg-cobalt/5 border border-cobalt/15 px-3 py-1 rounded">
                E-Commerce Catalog
              </span>
              <h2 className="text-3xl font-bold text-[#0F172A] tracking-tight font-['Space_Grotesk'] mt-2">Featured Products</h2>
              <p className="text-xs text-slate-text-muted font-medium">A curated selection of our in-stock mechatronics parts — refreshed every visit.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShuffle}
                className="bg-white border border-[#E4E4E7] hover:border-[#0F172A] text-[#0F172A] px-4 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all font-['JetBrains_Mono'] uppercase tracking-wider"
              >
                <Shuffle className="w-3.5 h-3.5" /> Shuffle
              </button>
              <Link
                href="/products"
                className="bg-[#0F172A] hover:bg-[#06B6D4] text-white px-4 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all font-['JetBrains_Mono'] uppercase tracking-wider"
              >
                View Full Catalog <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="bg-white border border-[#E4E4E7] h-64">
                  <div className="h-32 md:h-36 bg-[#F8FAFC]" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-[#E4E4E7] w-3/4" />
                    <div className="h-2 bg-[#E4E4E7] w-1/2" />
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
            <div className="text-center py-16 border border-dashed border-[#E4E4E7] bg-white">
              <Cpu className="w-12 h-12 text-[#76777d]/20 mx-auto mb-3" />
              <p className="text-sm font-bold text-[#0F172A]">No products yet</p>
              <p className="text-xs text-[#45464d]">Products will appear here once added to the catalog.</p>
            </div>
          )}

          {/* CTA strip */}
          <div className="flex items-center justify-center pt-2">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-xs font-bold text-cobalt hover:text-cobalt-hover transition-colors group font-['JetBrains_Mono'] uppercase tracking-wider"
            >
              Explore all {allParts.length > 0 ? `${allParts.length}+` : ''} parts in our catalog
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* CUSTOM MANUFACTURING TEASER */}
        <section className="max-w-7xl mx-auto px-6 py-16 space-y-8 border-t border-[#E4E4E7]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-orange-600 bg-orange-500/5 border border-orange-500/15 px-3 py-1 rounded">
                On-Demand Fabrication
              </span>
              <h2 className="text-3xl font-bold text-[#0F172A] tracking-tight font-['Space_Grotesk'] mt-2">Custom Machining Hub</h2>
              <p className="text-xs text-slate-text-muted font-medium">Upload your CAD files and get custom parts made by verified local machining services.</p>
            </div>
            <Link
              href="/machining"
              className="bg-[#0F172A] hover:bg-[#06B6D4] text-white px-4 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors font-['JetBrains_Mono'] uppercase tracking-wider shrink-0"
            >
              Browse All Services <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* How it works grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: Upload, color: 'text-orange-600', bg: 'bg-orange-500/5 border-orange-500/12', step: '01', title: 'Upload Design File', desc: 'Share your STEP, STL, IGES, DXF, OBJ or PDF file directly with a seller.' },
              { icon: Settings, color: 'text-cobalt', bg: 'bg-cobalt/5 border-cobalt/12', step: '02', title: 'Seller Reviews & Quotes', desc: 'The machining expert reviews your geometry and sends back a custom price quote.' },
              { icon: CheckCircle2, color: 'text-emerald', bg: 'bg-emerald/5 border-emerald/12', step: '03', title: 'Accept & Get Parts Made', desc: 'Accept the offer when satisfied. Track your manufacturing order from your dashboard.' },
            ].map(({ icon: Icon, color, bg, step, title, desc }) => (
              <div 
                key={step} 
                className={`bg-white border rounded p-6 space-y-4 hover:border-[#06B6D4] hover:-translate-y-0.5 transition-all duration-200 border-[#E4E4E7]`}
                style={{ boxShadow: '0 4px 6px -1px rgba(15,23,42,0.02), 0 2px 4px -2px rgba(15,23,42,0.02)' }}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded flex items-center justify-center ${bg} border`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <span className="text-[10px] font-bold text-[#76777d] font-mono uppercase tracking-widest">Step {step}</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#0F172A] font-['Space_Grotesk']">{title}</h3>
                  <p className="text-xs text-[#45464d] leading-relaxed mt-1 font-semibold opacity-85">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Featured machining service cards */}
          {displayedMachining.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
              {displayedMachining.slice(0, 3).map((service: any) => {
                const gradientClass =
                  service.process_type === 'CNC Machining'
                    ? 'from-blue-600/20 to-indigo-600/5'
                    : service.process_type === '3D Printing'
                    ? 'from-violet-500/20 to-purple-500/5'
                    : service.process_type === 'Sheet Metal'
                    ? 'from-amber-500/20 to-orange-500/5'
                    : 'from-red-500/20 to-pink-500/5';

                const ProcessIcon =
                  service.process_type === 'CNC Machining'
                    ? Settings
                    : service.process_type === '3D Printing'
                    ? Layers
                    : service.process_type === 'Sheet Metal'
                    ? Settings
                    : Zap;

                return (
                  <div 
                    key={service.id} 
                    onClick={() => setSelectedService(service)}
                    className="bg-white border border-[#E4E4E7] overflow-hidden flex flex-col justify-between hover:border-[#06B6D4] hover:-translate-y-1 transition-all duration-200 cursor-pointer group relative"
                    style={{
                      boxShadow: '0 4px 6px -1px rgba(15,23,42,0.04), 0 2px 4px -2px rgba(15,23,42,0.04)',
                      transition: 'transform 0.2s ease, border-color 0.2s ease'
                    }}
                  >
                    <div className="h-40 bg-[#F8FAFC] overflow-hidden relative border-b border-[#E4E4E7]/60">
                      <div className={`w-full h-full bg-gradient-to-br ${gradientClass} group-hover:scale-105 transition-transform duration-500 flex items-center justify-center`}>
                        <ProcessIcon className="w-12 h-12 text-[#0F172A] opacity-25 group-hover:rotate-12 transition-transform duration-500" />
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="bg-[#0F172A] text-white text-[9px] font-mono px-1.5 py-0.5 uppercase tracking-wider font-bold">
                          {service.lead_time}
                        </span>
                      </div>
                      <div className="absolute top-2 left-2">
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 uppercase tracking-wider border font-bold ${
                          service.process_type === 'CNC Machining' ? 'bg-blue-500/10 text-blue-750 border-blue-500/20'
                          : service.process_type === '3D Printing' ? 'bg-violet-500/10 text-violet-750 border-violet-500/20'
                          : service.process_type === 'Sheet Metal' ? 'bg-amber-500/10 text-amber-750 border-amber-500/20'
                          : 'bg-red-500/10 text-red-750 border-red-500/20'
                        }`}>
                          {service.process_type}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                      <div>
                        <div className="mb-2">
                          <h3 className="font-['Space_Grotesk'] text-sm font-semibold text-[#0F172A] leading-tight group-hover:text-[#06B6D4] transition-colors line-clamp-1">
                            {service.title}
                          </h3>
                          <p className="text-[10px] text-slate-text-muted mt-0.5 font-semibold">by {service.seller_name}</p>
                        </div>
                        <p className="text-xs text-[#45464d] line-clamp-2 leading-relaxed font-semibold opacity-85">{service.description}</p>
                      </div>

                      <div className="pt-4 border-t border-[#E4E4E7] flex items-center justify-between">
                        <div>
                          <p className="text-[9px] font-['Inter'] text-[#45464d] uppercase tracking-wider mb-0.5">Setup Fee</p>
                          <p className="font-['Space_Grotesk'] text-sm font-bold text-[#0F172A]">
                            ₹{Number(service.base_price).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedService(service); }}
                          className="px-3.5 py-2 bg-[#0F172A] text-white hover:bg-[#06B6D4] transition-colors flex items-center justify-center gap-1.5 font-bold text-xs font-['Inter'] cursor-pointer"
                        >
                          <span>Get Quote</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-center pt-2">
            <Link
              href="/machining"
              className="inline-flex items-center gap-2 text-xs font-bold text-cobalt hover:text-cobalt-hover transition-colors group font-['JetBrains_Mono'] uppercase tracking-wider"
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
