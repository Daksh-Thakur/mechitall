'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useCart } from '@/components/CartProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  getMachiningServices, listMachiningService, requestMachiningQuote, 
  getIncomingQuotes, getSubmittedQuotes, submitQuoteOffer, acceptQuoteOffer,
  MachiningService, MachiningQuote 
} from '@/app/actions/marketplace';
import { 
  Cpu, FileUp, Settings, Plus, Sparkles, CheckCircle2, Clock, 
  HelpCircle, ShieldCheck, ShoppingBag, Send, AlertTriangle, Layers, 
  ChevronRight, Info, X, Upload, File, Trash2, Eye, ArrowRight, 
  Zap, Tag, RotateCcw, Package, Search
} from 'lucide-react';

const MOCK_DEMO_SERVICES: MachiningService[] = [
  {
    id: 'demo-1',
    seller_profile_id: 'mock-seller-1',
    title: '5-Axis Precision CNC Milling',
    process_type: 'CNC Machining',
    description: 'High-fidelity subtractive CNC milling for custom metal parts. Aerospace tolerances, micro-inch finishes, and fully validated material certifications.',
    base_price: 2500.00,
    lead_time: '4 business days',
    material_capabilities: ['Aluminium 6061', 'Stainless Steel 316', 'Brass C360', 'POM Delrin'],
    finish_options: ['As-Machined', 'Bead Blasted', 'Clear Anodized', 'Hard Anodized (Black)'],
    created_at: new Date().toISOString(),
    seller_name: 'Alpha CNC Labs'
  },
  {
    id: 'demo-2',
    seller_profile_id: 'mock-seller-2',
    title: 'Industrial SLS Nylon 3D Printing',
    process_type: '3D Printing',
    description: 'Selective Laser Sintering (SLS) using premium carbon-composite Nylon 12. Ideal for rugged gears, snap-fits, and structural prototyping.',
    base_price: 650.00,
    lead_time: '3 business days',
    material_capabilities: ['Nylon PA12', 'Glass-Filled Nylon', 'Alumide Composite'],
    finish_options: ['As-Printed', 'Media Tumbled', 'Black Dyed (Satin)'],
    created_at: new Date().toISOString(),
    seller_name: 'RapidPolymer 3D'
  },
  {
    id: 'demo-3',
    seller_profile_id: 'mock-seller-3',
    title: 'High-Detail SLA Clear Resin Printing',
    process_type: '3D Printing',
    description: 'High-resolution laser stereolithography (SLA) resin printing. Ultra-smooth layers down to 25 microns. Perfect for clear lenses and microfluidics.',
    base_price: 450.00,
    lead_time: '2 business days',
    material_capabilities: ['Standard Clear Resin', 'Tough ABS-like Resin', 'High-Temp 300C Resin'],
    finish_options: ['As-Cured', 'UV Polished Clear', 'Frosted Matte Finish'],
    created_at: new Date().toISOString(),
    seller_name: 'OpticMicro Fab'
  },
  {
    id: 'demo-4',
    seller_profile_id: 'mock-seller-4',
    title: 'Precision Sheet Metal Fabrication',
    process_type: 'Sheet Metal',
    description: 'CNC press brake bending, forming, and welding. Perfect for electrical enclosures, custom brackets, server racks, and metal panels.',
    base_price: 1200.00,
    lead_time: '5 business days',
    material_capabilities: ['Aluminium 5052-H32', 'Cold Rolled Steel', 'Stainless Steel 304'],
    finish_options: ['As-Bent', 'Powder Coated (Black)', 'Zinc Plated Clear'],
    created_at: new Date().toISOString(),
    seller_name: 'Metalsmith Enclosures'
  },
  {
    id: 'demo-5',
    seller_profile_id: 'mock-seller-5',
    title: 'Fiber Laser Profile Sheet Cutting',
    process_type: 'Laser Cutting',
    description: 'Fiber laser profile sheet cutting. Ultra-clean kerf cuts, deburred edges, high dimensional accuracy on metals and plastics.',
    base_price: 800.00,
    lead_time: '2 business days',
    material_capabilities: ['Mild Steel', 'Aluminium 5052', 'Copper C101', 'Acrylic PMMA'],
    finish_options: ['As-Cut', 'Polished Edges', 'Passivated Coating'],
    created_at: new Date().toISOString(),
    seller_name: 'Quantum Cuts'
  }
];

const PROCESS_COLORS: Record<string, string> = {
  'CNC Machining': 'bg-blue-500/8 text-blue-600 border-blue-500/15',
  '3D Printing': 'bg-violet-500/8 text-violet-600 border-violet-500/15',
  'Sheet Metal': 'bg-amber-500/8 text-amber-600 border-amber-500/15',
  'Laser Cutting': 'bg-red-500/8 text-red-600 border-red-500/15',
};

export default function MachiningMarketplacePage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile, showToast } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeView, setActiveView] = useState<'buyer' | 'seller'>('buyer');
  const [services, setServices] = useState<MachiningService[]>([]);
  const [myServices, setMyServices] = useState<MachiningService[]>([]);
  const [buyerQuotes, setBuyerQuotes] = useState<MachiningQuote[]>([]);
  const [sellerQuotes, setSellerQuotes] = useState<MachiningQuote[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingQuotes, setLoadingQuotes] = useState(true);

  // Search & filter state (buyer view)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProcess, setSelectedProcess] = useState('All');

  // Buyer: Get Quote modal state
  const [selectedService, setSelectedService] = useState<MachiningService | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // Seller: Add Service modal state
  const [showListingModal, setShowListingModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newProcess, setNewProcess] = useState<'CNC Machining' | '3D Printing' | 'Sheet Metal' | 'Laser Cutting'>('CNC Machining');
  const [newDescription, setNewDescription] = useState('');
  const [newBasePrice, setNewBasePrice] = useState(100);
  const [newLeadTime, setNewLeadTime] = useState('5 business days');
  const [newMaterials, setNewMaterials] = useState('');
  const [newFinishes, setNewFinishes] = useState('');
  const [listingService, setListingService] = useState(false);

  // Seller: Submit Offer state
  const [quotingItem, setQuotingItem] = useState<MachiningQuote | null>(null);
  const [offerPrice, setOfferPrice] = useState(0);
  const [offerQuantity, setOfferQuantity] = useState(1);
  const [offerMaterial, setOfferMaterial] = useState('');
  const [offerFinish, setOfferFinish] = useState('');
  const [sellerNotes, setSellerNotes] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);

  // Filtered services (buyer search + process filter)
  const filteredServices = useMemo(() => {
    let result = [...services];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.process_type.toLowerCase().includes(q) ||
        (s.seller_name || '').toLowerCase().includes(q) ||
        s.material_capabilities.some(m => m.toLowerCase().includes(q))
      );
    }
    if (selectedProcess !== 'All') {
      result = result.filter(s => s.process_type === selectedProcess);
    }
    return result;
  }, [services, searchQuery, selectedProcess]);

  // Load services
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingServices(true);
        const activeServices = await getMachiningServices();
        if (activeServices && activeServices.length > 0) {
          setServices(activeServices);
        } else {
          setServices(MOCK_DEMO_SERVICES);
        }
      } catch (err) {
        console.error('Failed to load services:', err);
        setServices(MOCK_DEMO_SERVICES);
      } finally {
        setLoadingServices(false);
      }
    }
    loadData();
  }, []);

  // Automatically determine buyer/seller active view based on profile setting
  useEffect(() => {
    if (profile) {
      setActiveView(profile.is_seller ? 'seller' : 'buyer');
    } else {
      setActiveView('buyer');
    }
  }, [profile]);

  // Load my seller services and quotes
  useEffect(() => {
    async function loadQuotes() {
      if (!profile) return;
      try {
        setLoadingQuotes(true);
        if (activeView === 'buyer') {
          const quotes = await getSubmittedQuotes(profile.id);
          setBuyerQuotes(quotes);
        } else {
          const quotes = await getIncomingQuotes(profile.id);
          setSellerQuotes(quotes);
          // Also filter my listed services from the full list
          const allServices = await getMachiningServices();
          setMyServices(allServices.filter(s => s.seller_profile_id === profile.id));
        }
      } catch (err) {
        console.error('Failed to load quotes:', err);
      } finally {
        setLoadingQuotes(false);
      }
    }
    loadQuotes();
  }, [profile, activeView]);

  // File upload handlers
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setUploadedFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  // Handle buyer submitting a quote request with file upload
  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      showToast('Please sign in to request a quote.', 'error');
      router.push('/login');
      return;
    }
    if (!selectedService || !uploadedFile) {
      showToast('Please upload your design file.', 'error');
      return;
    }

    setSubmittingQuote(true);
    try {
      await requestMachiningQuote(profile.id, selectedService.id, {
        cadFileName: uploadedFile.name,
      });

      showToast(`"${uploadedFile.name}" shared with seller! Awaiting custom quote.`, 'success');
      setSelectedService(null);
      setUploadedFile(null);

      const quotes = await getSubmittedQuotes(profile.id);
      setBuyerQuotes(quotes);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit request.', 'error');
    } finally {
      setSubmittingQuote(false);
    }
  };

  // Handle seller listing a new service
  const handleListServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      showToast('Please sign in to list services.', 'error');
      router.push('/login');
      return;
    }
    if (!newTitle || !newDescription || newBasePrice < 0 || !newLeadTime) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    setListingService(true);
    try {
      const materialList = newMaterials.split(',').map((m) => m.trim()).filter(Boolean);
      const finishList = newFinishes.split(',').map((f) => f.trim()).filter(Boolean);

      const newService = await listMachiningService(profile.id, {
        title: newTitle,
        processType: newProcess,
        description: newDescription,
        basePrice: newBasePrice,
        leadTime: newLeadTime,
        materials: materialList.length > 0 ? materialList : ['Aluminium 6061', 'Stainless Steel 304'],
        finishes: finishList.length > 0 ? finishList : ['As-Machined', 'Anodized'],
      });

      showToast('Service listed successfully!', 'success');
      setShowListingModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewMaterials('');
      setNewFinishes('');
      setNewBasePrice(100);

      // Refresh
      setMyServices(prev => [newService, ...prev]);
      const allServices = await getMachiningServices();
      setServices(allServices.length > 0 ? allServices : MOCK_DEMO_SERVICES);
    } catch (err: any) {
      showToast(err.message || 'Failed to list service.', 'error');
    } finally {
      setListingService(false);
    }
  };

  // Handle seller submitting a quote offer
  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotingItem || offerPrice <= 0 || !offerMaterial || !offerFinish || offerQuantity < 1) {
      showToast('Please fill in all offer details.', 'error');
      return;
    }

    setSubmittingOffer(true);
    try {
      await submitQuoteOffer(quotingItem.id, {
        price: offerPrice,
        notes: sellerNotes,
        quantity: offerQuantity,
        material: offerMaterial,
        finish: offerFinish,
      });
      showToast('Pricing offer sent to buyer!', 'success');
      setQuotingItem(null);
      setSellerNotes('');
      setOfferPrice(0);

      if (profile) {
        const quotes = await getIncomingQuotes(profile.id);
        setSellerQuotes(quotes);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to submit offer.', 'error');
    } finally {
      setSubmittingOffer(false);
    }
  };

  // Handle buyer accepting an offer
  const handleAcceptOffer = async (quoteId: string) => {
    try {
      const res = await acceptQuoteOffer(quoteId);
      showToast(`Offer accepted! Order ${res.orderId} placed.`, 'success');
      if (profile) {
        const quotes = await getSubmittedQuotes(profile.id);
        setBuyerQuotes(quotes);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to accept offer.', 'error');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-bg font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full space-y-10">

        {/* Marketplace Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-border">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-cobalt bg-cobalt/5 border border-cobalt/20 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" /> Machining Marketplace
            </span>
            <h1 className="text-3xl font-black text-slate-text-primary tracking-tight">On-Demand Manufacturing Hub</h1>
            <p className="text-xs text-slate-text-muted font-semibold max-w-2xl leading-relaxed">
              Connect directly with verified local fabrication facilities. Browse machining services, upload your CAD files, and receive custom quotes.
            </p>
          </div>

          {activeView === 'seller' && (
            <button
              onClick={() => setShowListingModal(true)}
              className="btn-cobalt px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" /> List New Service
            </button>
          )}
        </div>

        {/* ==========================================
            BUYER VIEW
            ========================================== */}
        {activeView === 'buyer' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* Services Grid */}
            <div className="lg:col-span-2 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-text-primary tracking-tight uppercase">Available Services</h2>
                <span className="text-[10px] font-bold text-slate-text-muted">{filteredServices.length} of {services.length} services</span>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white rounded-xl border border-slate-border shadow-sm">
                {/* Search input */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search by service, material, seller..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs bg-slate-bg border border-slate-border text-slate-text-primary px-3 py-2.5 pl-9 rounded-lg focus:outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt/20 transition-all placeholder-slate-text-muted font-medium"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-text-muted hover:text-coral cursor-pointer transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Process type filter tabs */}
                <div className="bg-slate-bg border border-slate-border p-1 rounded-lg flex items-center gap-1 flex-wrap">
                  {(['All', 'CNC Machining', '3D Printing', 'Sheet Metal', 'Laser Cutting'] as const).map((proc) => (
                    <button
                      key={proc}
                      onClick={() => setSelectedProcess(proc)}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                        selectedProcess === proc
                          ? 'bg-white text-cobalt shadow-sm border border-slate-border/50'
                          : 'text-slate-text-secondary hover:text-slate-text-primary'
                      }`}
                    >
                      {proc}
                    </button>
                  ))}
                </div>
              </div>

              {loadingServices ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="h-52 bg-white border border-slate-border rounded-2xl" />
                  ))}
                </div>
              ) : filteredServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredServices.map((service) => (
                    <div
                      key={service.id}
                      className="bg-white border border-slate-border rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                    >
                      {/* Top accent line */}
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cobalt/60 to-violet-500/60 opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider ${PROCESS_COLORS[service.process_type] || 'bg-cobalt/5 text-cobalt border-cobalt/10'}`}>
                            {service.process_type}
                          </span>
                          <span className="text-[9px] font-bold text-slate-text-muted flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3" /> {service.lead_time}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm font-black text-slate-text-primary leading-tight group-hover:text-cobalt transition-colors">
                            {service.title}
                          </h3>
                          <p className="text-[11px] text-slate-text-muted font-semibold mt-0.5">by {service.seller_name}</p>
                        </div>
                        <p className="text-xs text-slate-text-secondary leading-relaxed line-clamp-2">{service.description}</p>

                        {/* Material chips */}
                        <div className="flex flex-wrap gap-1">
                          {service.material_capabilities.slice(0, 3).map((m) => (
                            <span key={m} className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-bg/80 border border-slate-border rounded text-slate-text-secondary">
                              {m}
                            </span>
                          ))}
                          {service.material_capabilities.length > 3 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-bg/80 border border-slate-border rounded text-slate-text-muted">
                              +{service.material_capabilities.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-3.5 border-t border-slate-border/40 flex items-center justify-between mt-3">
                        <div>
                          <span className="block text-[8px] uppercase tracking-widest text-slate-text-muted font-bold">Base setup fee</span>
                          <span className="text-base font-black text-coral">₹{Number(service.base_price).toLocaleString('en-IN')}</span>
                        </div>
                        <button
                          onClick={() => setSelectedService(service)}
                          className="btn-cobalt text-[10px] font-black px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer"
                        >
                          Get Quote <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 border border-dashed border-slate-border rounded-2xl bg-white">
                  <Cpu className="w-12 h-12 text-slate-text-muted/20 mx-auto mb-3" />
                  {searchQuery || selectedProcess !== 'All' ? (
                    <>
                      <p className="text-sm font-bold text-slate-text-primary">No services match your search.</p>
                      <button
                        onClick={() => { setSearchQuery(''); setSelectedProcess('All'); }}
                        className="mt-3 text-xs font-bold text-cobalt hover:underline cursor-pointer"
                      >
                        Clear filters
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-slate-text-primary">No machining services yet.</p>
                      <p className="text-xs text-slate-text-muted mt-1">Sellers can list their capabilities from their profile.</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* My Quotes Sidebar */}
            <div className="space-y-5">
              <h2 className="text-sm font-black text-slate-text-primary tracking-tight uppercase">My Quote Requests</h2>

              {!profile ? (
                <div className="bg-white border border-slate-border rounded-2xl p-5 text-center space-y-3">
                  <ShieldCheck className="w-8 h-8 text-slate-text-muted/30 mx-auto" />
                  <p className="text-xs font-bold text-slate-text-primary">Sign in to track quotes</p>
                  <button onClick={() => router.push('/login')} className="btn-cobalt text-xs font-bold px-4 py-2 rounded-lg cursor-pointer">
                    Sign In
                  </button>
                </div>
              ) : loadingQuotes ? (
                <div className="h-40 bg-white border border-slate-border rounded-2xl animate-pulse" />
              ) : buyerQuotes.length > 0 ? (
                <div className="space-y-3">
                  {buyerQuotes.map((quote) => (
                    <div key={quote.id} className="bg-white border border-slate-border rounded-2xl p-4 shadow-sm space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-mono text-[10px] font-black text-slate-text-primary truncate flex items-center gap-1">
                          <File className="w-3 h-3 shrink-0" /> {quote.cad_file_name}
                        </span>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                          quote.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : quote.status === 'Offered' ? 'bg-blue-500/10 text-cobalt border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        }`}>
                          {quote.status}
                        </span>
                      </div>

                      <p className="text-[11px] font-bold text-slate-text-secondary">{quote.service_title}</p>

                      {quote.status === 'Offered' && quote.offer_price && (
                        <div className="bg-slate-bg/60 border border-slate-border p-3 rounded-xl space-y-2">
                          <div className="flex justify-between items-baseline">
                            <span className="text-[10px] text-slate-text-muted font-bold">Seller's Offer</span>
                            <span className="text-sm font-black text-coral">₹{Number(quote.offer_price).toLocaleString('en-IN')}</span>
                          </div>
                          {quote.seller_notes && (
                            <p className="text-[10px] text-slate-text-secondary italic">"{quote.seller_notes}"</p>
                          )}
                          <button
                            onClick={() => handleAcceptOffer(quote.id)}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Accept & Order
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-slate-border bg-white rounded-2xl">
                  <FileUp className="w-8 h-8 text-slate-text-muted/20 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-text-primary">No requests yet</p>
                  <p className="text-[10px] text-slate-text-muted mt-1">Click "Get Quote" on a service</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            SELLER VIEW
            ========================================== */}
        {activeView === 'seller' && (
          <div className="space-y-10">

            {/* My Listed Services */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-text-primary tracking-tight uppercase">My Listed Services</h2>
                <span className="text-[10px] font-bold text-slate-text-muted">{myServices.length} active listing{myServices.length !== 1 ? 's' : ''}</span>
              </div>

              {loadingQuotes ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
                  {[1, 2, 3].map(n => <div key={n} className="h-44 bg-white border border-slate-border rounded-2xl" />)}
                </div>
              ) : myServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {myServices.map((service) => (
                    <div key={service.id} className="bg-white border border-slate-border rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider ${PROCESS_COLORS[service.process_type] || 'bg-cobalt/5 text-cobalt border-cobalt/10'}`}>
                            {service.process_type}
                          </span>
                          <span className="text-[9px] text-slate-text-muted font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {service.lead_time}
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-slate-text-primary leading-tight">{service.title}</h3>
                        <p className="text-[11px] text-slate-text-secondary leading-relaxed line-clamp-2">{service.description}</p>
                      </div>
                      <div className="pt-3 border-t border-slate-border/40 flex items-center justify-between">
                        <span className="text-sm font-black text-coral">₹{Number(service.base_price).toLocaleString('en-IN')}</span>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/8 border border-emerald-500/15 px-2 py-1 rounded-full uppercase tracking-wide">
                          Active
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-14 border border-dashed border-slate-border rounded-2xl bg-white space-y-3">
                  <Package className="w-10 h-10 text-slate-text-muted/20 mx-auto" />
                  <div>
                    <p className="text-sm font-bold text-slate-text-primary">No services listed yet</p>
                    <p className="text-xs text-slate-text-muted mt-1">Click "List New Service" above to publish your first machining capability.</p>
                  </div>
                  <button onClick={() => setShowListingModal(true)} className="btn-cobalt text-xs font-bold px-4 py-2.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> List First Service
                  </button>
                </div>
              )}
            </div>

            {/* Incoming RFQs */}
            <div className="space-y-5">
              <h2 className="text-sm font-black text-slate-text-primary tracking-tight uppercase">Incoming Quote Requests</h2>

              {loadingQuotes ? (
                <div className="h-40 bg-white border border-slate-border rounded-2xl animate-pulse" />
              ) : sellerQuotes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sellerQuotes.map((quote) => (
                    <div key={quote.id} className="bg-white border border-slate-border rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start gap-2 pb-3 border-b border-slate-border/40">
                        <div className="min-w-0">
                          <span className={`inline-block px-2 py-0.5 rounded border text-[8px] font-black uppercase ${PROCESS_COLORS[quote.process_type || ''] || 'bg-cobalt/5 text-cobalt border-cobalt/10'}`}>
                            {quote.process_type}
                          </span>
                          <p className="font-mono text-[10px] font-black text-slate-text-primary mt-1.5 truncate flex items-center gap-1">
                            <File className="w-3 h-3 shrink-0" /> {quote.cad_file_name}
                          </p>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                          quote.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : quote.status === 'Offered' ? 'bg-blue-500/10 text-cobalt border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        }`}>
                          {quote.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[11px] text-slate-text-secondary">
                        <div>Buyer: <span className="font-bold text-slate-text-primary">{quote.buyer_name}</span></div>
                        <div>Service: <span className="font-semibold">{quote.service_title}</span></div>
                      </div>

                      {quote.status === 'Pending' && (
                        <button
                          onClick={() => {
                            const service = services.find(s => s.id === quote.service_id);
                            setQuotingItem(quote);
                            setOfferQuantity(1);
                            setOfferMaterial(service?.material_capabilities[0] || 'Aluminium 6061');
                            setOfferFinish(service?.finish_options[0] || 'As-Machined');
                          }}
                          className="btn-cobalt text-xs font-bold py-2.5 w-full rounded-xl text-center cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" /> Send Price Quote
                        </button>
                      )}

                      {quote.status === 'Offered' && quote.offer_price && (
                        <div className="bg-slate-bg/50 border border-slate-border p-2.5 rounded-xl text-[10px] text-slate-text-secondary font-semibold">
                          Offer sent: <span className="text-xs font-bold text-coral">₹{Number(quote.offer_price).toLocaleString('en-IN')}</span>
                        </div>
                      )}

                      {quote.status === 'Accepted' && (
                        <div className="bg-emerald-500/8 border border-emerald-500/15 p-2.5 rounded-xl text-[10px] text-emerald-600 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Offer accepted by buyer
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-14 border border-dashed border-slate-border rounded-2xl bg-white">
                  <ShoppingBag className="w-10 h-10 text-slate-text-muted/20 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-text-primary">No incoming requests yet</p>
                  <p className="text-xs text-slate-text-muted mt-1">Buyers will appear here once they upload files to your services.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ==========================================
          MODAL 1: BUYER GET QUOTE (File Upload)
          ========================================== */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-border rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-slide-in">
            <div className="flex justify-between items-start">
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${PROCESS_COLORS[selectedService.process_type] || ''}`}>
                  {selectedService.process_type}
                </span>
                <h3 className="text-base font-black text-slate-text-primary tracking-tight mt-1">{selectedService.title}</h3>
                <p className="text-xs text-slate-text-muted font-semibold">by {selectedService.seller_name}</p>
              </div>
              <button
                onClick={() => { setSelectedService(null); setUploadedFile(null); }}
                className="text-slate-text-muted hover:text-slate-text-primary cursor-pointer p-1 rounded-lg hover:bg-slate-bg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuoteSubmit} className="space-y-4">
              {/* Drop Zone */}
              <div>
                <label className="block text-[10px] font-bold text-slate-text-secondary uppercase mb-2">
                  Upload Design File (STEP, STL, IGES, DXF)
                </label>
                {!uploadedFile ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      isDragging 
                        ? 'border-cobalt bg-cobalt/5' 
                        : 'border-slate-border bg-slate-bg/30 hover:border-cobalt/50 hover:bg-cobalt/3'
                    }`}
                  >
                    <Upload className={`w-8 h-8 mx-auto mb-2.5 transition-colors ${isDragging ? 'text-cobalt' : 'text-slate-text-muted/40'}`} />
                    <p className="text-xs font-bold text-slate-text-primary">
                      {isDragging ? 'Drop to upload' : 'Drag & drop your design file'}
                    </p>
                    <p className="text-[10px] text-slate-text-muted mt-1">or <span className="text-cobalt font-bold">browse from your computer</span></p>
                    <p className="text-[9px] text-slate-text-muted/70 mt-2 font-semibold">STEP · STL · IGES · DXF · OBJ · PDF</p>
                  </div>
                ) : (
                  <div className="border border-slate-border rounded-xl p-4 bg-white flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-cobalt/8 border border-cobalt/15 flex items-center justify-center shrink-0">
                        <File className="w-5 h-5 text-cobalt" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-text-primary truncate">{uploadedFile.name}</p>
                        <p className="text-[10px] text-slate-text-muted font-semibold">{formatFileSize(uploadedFile.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="text-slate-text-muted hover:text-red-500 cursor-pointer shrink-0 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".step,.stp,.stl,.iges,.igs,.dxf,.obj,.pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              <div className="bg-blue-500/4 border border-blue-500/12 p-3.5 rounded-xl text-[10px] text-slate-text-secondary font-semibold leading-relaxed">
                <div className="text-cobalt flex items-center gap-1.5 mb-1.5 font-black">
                  <Info className="w-3.5 h-3.5" /> How it works
                </div>
                Your file is shared with the seller. They review your design geometry, recommend optimal material & finish, and send a custom price quote. You then choose to accept or not.
              </div>

              <button
                type="submit"
                disabled={submittingQuote || !uploadedFile}
                className="w-full btn-cobalt py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submittingQuote ? (
                  <><RotateCcw className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : (
                  <><Send className="w-4 h-4" /> Send Design & Request Quote</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: LIST NEW SERVICE (Seller)
          ========================================== */}
      {showListingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-border rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-slide-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-slate-text-primary">List New Machining Service</h3>
                <p className="text-[10px] text-slate-text-muted font-semibold">Fill in your capability details</p>
              </div>
              <button
                onClick={() => setShowListingModal(false)}
                className="text-slate-text-muted hover:text-slate-text-primary cursor-pointer p-1 rounded-lg hover:bg-slate-bg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleListServiceSubmit} className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-text-secondary uppercase">Service Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5-Axis Precision Aluminum Milling"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-3 border border-slate-border rounded-xl bg-slate-bg/30 text-slate-text-primary focus:outline-none focus:border-cobalt/40 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-text-secondary uppercase">Process Type *</label>
                  <select
                    value={newProcess}
                    onChange={(e) => setNewProcess(e.target.value as any)}
                    className="w-full p-3 border border-slate-border rounded-xl bg-white text-slate-text-primary focus:outline-none focus:border-cobalt/40"
                  >
                    <option>CNC Machining</option>
                    <option>3D Printing</option>
                    <option>Sheet Metal</option>
                    <option>Laser Cutting</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-text-secondary uppercase">Base Setup Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newBasePrice}
                    onChange={(e) => setNewBasePrice(Number(e.target.value))}
                    className="w-full p-3 border border-slate-border rounded-xl bg-slate-bg/30 text-slate-text-primary focus:outline-none focus:border-cobalt/40"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-text-secondary uppercase">Lead Time *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4 business days"
                  value={newLeadTime}
                  onChange={(e) => setNewLeadTime(e.target.value)}
                  className="w-full p-3 border border-slate-border rounded-xl bg-slate-bg/30 text-slate-text-primary focus:outline-none focus:border-cobalt/40"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-text-secondary uppercase">Material Options <span className="normal-case text-slate-text-muted">(comma-separated)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Aluminium 6061, Stainless Steel 316, Brass"
                  value={newMaterials}
                  onChange={(e) => setNewMaterials(e.target.value)}
                  className="w-full p-3 border border-slate-border rounded-xl bg-slate-bg/30 text-slate-text-primary focus:outline-none focus:border-cobalt/40"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-text-secondary uppercase">Finish Options <span className="normal-case text-slate-text-muted">(comma-separated)</span></label>
                <input
                  type="text"
                  placeholder="e.g. As-Machined, Bead Blasted, Anodized"
                  value={newFinishes}
                  onChange={(e) => setNewFinishes(e.target.value)}
                  className="w-full p-3 border border-slate-border rounded-xl bg-slate-bg/30 text-slate-text-primary focus:outline-none focus:border-cobalt/40"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-text-secondary uppercase">Service Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain your capabilities, tolerances, equipment, and quality standards..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-3 border border-slate-border rounded-xl bg-slate-bg/30 text-slate-text-primary resize-none focus:outline-none focus:border-cobalt/40"
                />
              </div>

              <button
                type="submit"
                disabled={listingService}
                className="w-full btn-cobalt py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {listingService ? (
                  <><RotateCcw className="w-4 h-4 animate-spin" /> Publishing...</>
                ) : (
                  <><Zap className="w-4 h-4" /> Publish Service</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 3: SELLER SUBMIT OFFER
          ========================================== */}
      {quotingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5 animate-slide-in">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-cobalt">Submit Price Quote</span>
                <h3 className="text-base font-black text-slate-text-primary tracking-tight mt-0.5 flex items-center gap-2">
                  <File className="w-4 h-4 text-slate-text-muted" /> {quotingItem.cad_file_name}
                </h3>
              </div>
              <button
                onClick={() => setQuotingItem(null)}
                className="text-slate-text-muted hover:text-slate-text-primary cursor-pointer p-1 rounded-lg hover:bg-slate-bg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOfferSubmit} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-text-secondary uppercase">Recommended Material</label>
                  <select
                    value={offerMaterial}
                    onChange={(e) => setOfferMaterial(e.target.value)}
                    className="w-full p-3 border border-slate-border rounded-xl bg-white text-slate-text-primary focus:outline-none"
                  >
                    {(services.find(s => s.id === quotingItem.service_id)?.material_capabilities || ['Aluminium 6061']).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-text-secondary uppercase">Surface Finish</label>
                  <select
                    value={offerFinish}
                    onChange={(e) => setOfferFinish(e.target.value)}
                    className="w-full p-3 border border-slate-border rounded-xl bg-white text-slate-text-primary focus:outline-none"
                  >
                    {(services.find(s => s.id === quotingItem.service_id)?.finish_options || ['As-Machined']).map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-text-secondary uppercase">Quantity (Units)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={offerQuantity}
                    onChange={(e) => setOfferQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full p-3 border border-slate-border rounded-xl bg-slate-bg/30 text-slate-text-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-text-secondary uppercase">Total Price (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={offerPrice || ''}
                    placeholder="0"
                    onChange={(e) => setOfferPrice(Number(e.target.value))}
                    className="w-full p-3 border border-slate-border rounded-xl bg-slate-bg/30 text-slate-text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-text-secondary uppercase">Inspection Notes / Comments *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain tolerance checks, toolpath analysis, or recommend design changes..."
                  value={sellerNotes}
                  onChange={(e) => setSellerNotes(e.target.value)}
                  className="w-full p-3 border border-slate-border rounded-xl bg-slate-bg/30 text-slate-text-primary resize-none focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingOffer}
                className="w-full btn-cobalt py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submittingOffer ? (
                  <><RotateCcw className="w-4 h-4 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="w-4 h-4" /> Send Quote to Buyer</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
