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
  ShieldCheck, ShoppingBag, Send, Layers, 
  ChevronRight, Info, X, Upload, File, Trash2, Eye, ArrowRight, 
  Zap, RotateCcw, Package, Search, SlidersHorizontal, SlidersVertical
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // New state variables to match products page layout
  const [sortBy, setSortBy] = useState<string>('featured');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [buyerTab, setBuyerTab] = useState<'browse' | 'quotes'>('browse');
  const [sellerTab, setSellerTab] = useState<'listings' | 'incoming'>('listings');
  const [hasSetInitialView, setHasSetInitialView] = useState(false);

  // Handle click outside for auto-complete dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return services.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.process_type.toLowerCase().includes(q) ||
      (s.seller_name || '').toLowerCase().includes(q) ||
      s.material_capabilities.some(m => m.toLowerCase().includes(q))
    ).slice(0, 5);
  }, [services, searchQuery]);

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

  // Filtered and sorted services (buyer search + process filter + sort by base price)
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
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.base_price - b.base_price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.base_price - a.base_price);
    }
    return result;
  }, [services, searchQuery, selectedProcess, sortBy]);

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

  // Automatically determine buyer/seller active view based on profile setting initially
  useEffect(() => {
    if (profile && !hasSetInitialView) {
      setActiveView(profile.is_seller ? 'seller' : 'buyer');
      setHasSetInitialView(true);
    }
  }, [profile, hasSetInitialView]);

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
      setBuyerTab('quotes'); // Switch to quotes view tab to track immediately

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
    <div className="min-h-screen bg-[#F8FAFC] text-[#1b1b1d] font-sans flex flex-col overflow-x-clip">
      <Navbar />

      {/* ─── MOBILE TOP BAR ─── */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-[#E4E4E7] flex items-center justify-between px-4 h-14">
        <h1 className="font-['Space_Grotesk'] text-base font-bold text-[#0F172A]">Machining Marketplace</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilterDrawer(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E4E4E7] text-[11px] font-mono font-bold uppercase tracking-wider hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          >
            <SlidersVertical className="w-3.5 h-3.5" />
            Filter
          </button>
        </div>
      </div>

      <div className="flex flex-1 w-full max-w-[1280px] mx-auto">
        {/* ─── DESKTOP LEFT SIDEBAR ─── */}
        <aside className="hidden lg:flex w-64 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] border-r border-[#E4E4E7] bg-[#F8FAFC] flex-col p-6 gap-4 overflow-y-auto">
          {/* Mode Switcher */}
          <div className="pb-4 border-b border-[#E4E4E7] flex flex-col gap-2">
            <label className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-wider text-[#45464d]">Marketplace Role</label>
            {profile ? (
              profile.is_seller ? (
                <div className="grid grid-cols-2 gap-1 bg-[#E4E4E7]/60 p-1 rounded">
                  <button
                    onClick={() => setActiveView('buyer')}
                    className={`py-1.5 text-xs font-bold text-center transition-all cursor-pointer ${
                      activeView === 'buyer'
                        ? 'bg-[#0F172A] text-white'
                        : 'text-[#45464d] hover:text-[#0F172A]'
                    }`}
                  >
                    Buyer Hub
                  </button>
                  <button
                    onClick={() => setActiveView('seller')}
                    className={`py-1.5 text-xs font-bold text-center transition-all cursor-pointer ${
                      activeView === 'seller'
                        ? 'bg-[#0F172A] text-white'
                        : 'text-[#45464d] hover:text-[#0F172A]'
                    }`}
                  >
                    Seller Hub
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded flex flex-col gap-1.5">
                  <p className="text-[10px] text-amber-800 leading-normal font-semibold">
                    Want to list your machining capabilities?
                  </p>
                  <button
                    onClick={() => router.push('/profile')}
                    className="text-[9px] font-bold text-left text-amber-700 hover:text-amber-900 underline flex items-center gap-0.5"
                  >
                    Activate Seller Mode <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              )
            ) : (
              <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded flex flex-col gap-1.5">
                <p className="text-[10px] text-slate-text-muted leading-normal font-semibold">
                  Sign in to view your quotes or list services.
                </p>
                <button
                  onClick={() => router.push('/login')}
                  className="text-[9px] font-bold text-left text-cobalt hover:text-blue-700 underline flex items-center gap-0.5"
                >
                  Sign In <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>

          {/* Process Navigation */}
          <div className="pb-2">
            <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#0F172A]">Filter Specs</h2>
            <p className="font-['Inter'] text-xs text-[#45464d] mt-0.5 opacity-70">Machining Processes</p>
          </div>

          <nav className="flex flex-col gap-0.5">
            {(['All', 'CNC Machining', '3D Printing', 'Sheet Metal', 'Laser Cutting'] as const).map(proc => (
              <button
                key={proc}
                onClick={() => setSelectedProcess(proc)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-['Inter'] text-left transition-all cursor-pointer ${
                  selectedProcess === proc
                    ? 'bg-[#0F172A] text-white font-bold'
                    : 'text-[#45464d] hover:bg-[#E4E4E7]'
                }`}
              >
                <span className="text-base">
                  {proc === 'All' ? '⊞' : proc === 'CNC Machining' ? '⚙️' : proc === '3D Printing' ? '🖨️' : proc === 'Sheet Metal' ? '📐' : '⚡'}
                </span>
                {proc === 'All' ? 'All Processes' : proc}
              </button>
            ))}
          </nav>

          {/* Sort By */}
          <div className="pt-4 border-t border-[#E4E4E7] flex flex-col gap-3">
            <label className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-wider text-[#45464d]">Sort By</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-white border border-[#E4E4E7] px-3 py-2 text-xs font-['Inter'] text-[#45464d] focus:outline-none focus:border-[#06B6D4] transition-colors cursor-pointer font-semibold"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
          </div>

          {/* Reset Filters */}
          <button
            onClick={() => { setSelectedProcess('All'); setSearchQuery(''); setSortBy('featured'); }}
            className="mt-auto py-2 px-4 border border-[#0F172A] text-[#0F172A] font-bold text-xs font-['Inter'] hover:bg-[#0F172A] hover:text-white transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <main className="flex-1 min-w-0 px-3 md:px-6 lg:px-8 py-4 md:py-8">

          {/* Desktop Blueprint Header Banner */}
          <div
            className="hidden md:block mb-4 border-l-4 border-[#06B6D4] px-4 py-3 bg-white/60"
            style={{
              backgroundImage: 'linear-gradient(to right, rgba(6,182,212,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(6,182,212,0.05) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          >
            <div className="flex justify-between items-center">
              <div>
                <h1 className="font-['Space_Grotesk'] text-lg font-bold text-[#0F172A]">On-Demand Manufacturing</h1>
                <p className="font-['Inter'] text-xs text-[#45464d] mt-0.5">
                  Connect with verified fabrication facilities, upload CAD files, and receive custom quotes.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {activeView === 'seller' && (
                  <button
                    onClick={() => setShowListingModal(true)}
                    className="bg-[#0f172a] text-white hover:bg-[#06b6d4] text-[8px] font-['JetBrains_Mono'] uppercase tracking-wider py-1.5 px-3 transition-colors font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> List Service
                  </button>
                )}
                <span className="px-2 py-1 bg-[#0F172A] text-white text-[8px] font-['JetBrains_Mono'] uppercase tracking-wider flex items-center gap-1 select-none">
                  ✓ Verified Fabricators
                </span>
              </div>
            </div>
          </div>

          {/* View Sub-Tabs switcher */}
          <div className="flex border-b border-[#E4E4E7] mb-6">
            {activeView === 'buyer' ? (
              <>
                <button
                  onClick={() => setBuyerTab('browse')}
                  className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                    buyerTab === 'browse'
                      ? 'border-[#06B6D4] text-[#06B6D4] font-bold'
                      : 'border-transparent text-[#76777d] hover:text-[#0F172A]'
                  }`}
                >
                  Browse services
                </button>
                <button
                  onClick={() => setBuyerTab('quotes')}
                  className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    buyerTab === 'quotes'
                      ? 'border-[#06B6D4] text-[#06B6D4] font-bold'
                      : 'border-transparent text-[#76777d] hover:text-[#0F172A]'
                  }`}
                >
                  My Quote Requests
                  {buyerQuotes.length > 0 && (
                    <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                      {buyerQuotes.length}
                    </span>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setSellerTab('listings')}
                  className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                    sellerTab === 'listings'
                      ? 'border-[#06B6D4] text-[#06B6D4] font-bold'
                      : 'border-transparent text-[#76777d] hover:text-[#0F172A]'
                  }`}
                >
                  My Listed Capabilities
                </button>
                <button
                  onClick={() => setSellerTab('incoming')}
                  className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    sellerTab === 'incoming'
                      ? 'border-[#06B6D4] text-[#06B6D4] font-bold'
                      : 'border-transparent text-[#76777d] hover:text-[#0F172A]'
                  }`}
                >
                  Incoming Quote Requests
                  {sellerQuotes.filter(q => q.status === 'Pending').length > 0 && (
                    <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                      {sellerQuotes.filter(q => q.status === 'Pending').length}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>

          {/* ==========================================
              BUYER SUB-VIEWS
              ========================================== */}
          {activeView === 'buyer' && buyerTab === 'browse' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div ref={searchRef} className={`mb-4 relative ${showSuggestions && suggestions.length > 0 ? 'z-30' : 'z-10'}`}>
                <input
                  type="text"
                  placeholder="Search custom machining services, material, capability..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.currentTarget.blur(); setShowSuggestions(false); } }}
                  className="w-full bg-white border border-[#E4E4E7] px-10 py-3 pr-28 text-sm font-['Inter'] focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4] outline-none transition-all placeholder:text-[#76777d]"
                />
                <Search className="w-4 h-4 text-[#45464d] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {searchQuery && (
                    <button onClick={() => { setSearchQuery(''); setShowSuggestions(false); }} className="cursor-pointer">
                      <X className="w-3.5 h-3.5 text-[#76777d] hover:text-red-500 transition-colors" />
                    </button>
                  )}
                  <span className="text-[10px] font-mono bg-[#F8FAFC] px-1.5 py-0.5 border border-[#E4E4E7] text-[#45464d] select-none" title="Matching items">
                    {filteredServices.length}/{services.length}
                  </span>
                  <span className="hidden md:block text-[10px] font-mono bg-[#F8FAFC] px-1.5 py-0.5 border border-[#E4E4E7] text-[#45464d]">Search</span>
                </div>

                {/* Autocomplete Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-[#E4E4E7] shadow-lg overflow-hidden py-1 max-h-72 overflow-y-auto divide-y divide-[#E4E4E7]/50">
                    {suggestions.map(s => (
                      <div
                        key={s.id}
                        onClick={() => { setSearchQuery(s.title); setShowSuggestions(false); }}
                        className="p-3 hover:bg-[#F8FAFC] flex items-center justify-between gap-3 cursor-pointer transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-[#0F172A] truncate">{s.title}</span>
                            <span className={`text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 bg-[#F8FAFC] border border-[#E4E4E7] text-[#45464d] select-none shrink-0`}>
                              {s.process_type}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#76777d] block mt-0.5">by {s.seller_name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <span className="block text-xs font-bold text-[#0F172A]">₹{Number(s.base_price).toLocaleString('en-IN')}</span>
                            <span className="block text-[8px] text-[#76777d]">setup fee</span>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); setSelectedService(s); setShowSuggestions(false); }}
                            className="p-1.5 border border-[#E4E4E7] bg-white hover:border-[#06B6D4] transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#45464d]" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile process pills */}
              <div className="md:hidden flex gap-1.5 overflow-x-auto no-scrollbar">
                {(['All', 'CNC Machining', '3D Printing', 'Sheet Metal', 'Laser Cutting'] as const).map(proc => (
                  <button
                    key={proc}
                    onClick={() => setSelectedProcess(proc)}
                    className={`shrink-0 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                      selectedProcess === proc
                        ? 'bg-[#0F172A] text-white border-[#0F172A]'
                        : 'bg-white text-[#45464d] border-[#E4E4E7] hover:border-[#0F172A]'
                    }`}
                  >
                    {proc}
                  </button>
                ))}
              </div>



              {/* Grid layout */}
              {loadingServices ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <div key={n} className="bg-white border border-[#E4E4E7] h-80">
                      <div className="h-40 bg-[#F8FAFC]" />
                      <div className="p-5 space-y-3">
                        <div className="h-3 bg-[#E4E4E7] w-3/4" />
                        <div className="h-2 bg-[#E4E4E7] w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredServices.map(service => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onGetQuote={setSelectedService}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border border-dashed border-[#E4E4E7] bg-white space-y-4">
                  <div className="text-4xl opacity-20">⚙️</div>
                  <p className="text-sm font-bold text-[#0F172A]">No machining services found</p>
                  <p className="text-xs text-[#45464d]">Try different search terms or clear the process filter.</p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedProcess('All'); setSortBy('featured'); }}
                    className="mt-2 py-2 px-5 border border-[#0F172A] text-[#0F172A] font-bold text-xs hover:bg-[#0F172A] hover:text-white transition-colors cursor-pointer"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {activeView === 'buyer' && buyerTab === 'quotes' && (
            <div className="space-y-4">
              {!profile ? (
                <div className="bg-white border border-[#E4E4E7] rounded-2xl p-8 text-center space-y-4 max-w-md mx-auto">
                  <ShieldCheck className="w-12 h-12 text-slate-text-muted/30 mx-auto" />
                  <h3 className="text-sm font-bold text-[#0F172A]">Sign in to track quotes</h3>
                  <p className="text-xs text-[#76777d]">Track requests, communicate with fabrication facilities, and approve pricing offers.</p>
                  <button onClick={() => router.push('/login')} className="bg-[#0f172a] text-white hover:bg-[#06b6d4] text-xs font-bold px-6 py-2.5 rounded-lg cursor-pointer">
                    Sign In
                  </button>
                </div>
              ) : loadingQuotes ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
                  {[1, 2, 3].map(n => <div key={n} className="h-44 bg-white border border-[#E4E4E7]" />)}
                </div>
              ) : buyerQuotes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {buyerQuotes.map((quote) => (
                    <div key={quote.id} className="bg-white border border-[#E4E4E7] p-5 flex flex-col justify-between space-y-4 hover:border-[#0f172a] transition-all relative">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 uppercase border font-semibold ${
                            quote.process_type === 'CNC Machining' ? 'bg-blue-500/10 text-blue-750 border-blue-500/20'
                            : quote.process_type === '3D Printing' ? 'bg-violet-500/10 text-violet-750 border-violet-500/20'
                            : quote.process_type === 'Sheet Metal' ? 'bg-amber-500/10 text-amber-750 border-amber-500/20'
                            : 'bg-red-500/10 text-red-750 border-red-500/20'
                          }`}>
                            {quote.process_type}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase border font-bold ${
                            quote.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : quote.status === 'Offered' ? 'bg-blue-500/10 text-cobalt border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}>
                            {quote.status}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-['Space_Grotesk'] text-sm font-semibold text-[#0F172A] leading-tight">
                            {quote.service_title}
                          </h4>
                          <p className="font-mono text-[10px] text-slate-text-muted mt-1.5 flex items-center gap-1 truncate font-semibold">
                            <File className="w-3.5 h-3.5 text-[#76777d] shrink-0" /> {quote.cad_file_name}
                          </p>
                        </div>

                        {quote.status === 'Offered' && quote.offer_price && (
                          <div className="bg-[#F8FAFC] border border-[#E4E4E7] p-3 rounded space-y-2 mt-2">
                            <div className="flex justify-between items-baseline">
                              <span className="text-[10px] text-[#45464d] font-mono">Total Price Offered</span>
                              <span className="text-base font-bold text-coral">₹{Number(quote.offer_price).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-[10px] text-[#76777d] font-semibold">
                              <div>Material: <span className="text-[#1b1b1d] font-bold">{quote.selected_material}</span></div>
                              <div>Finish: <span className="text-[#1b1b1d] font-bold">{quote.selected_finish}</span></div>
                              <div>Quantity: <span className="text-[#1b1b1d] font-bold">{quote.quantity} Units</span></div>
                            </div>
                            {quote.seller_notes && (
                              <p className="text-[10px] text-[#76777d] italic border-t border-[#E4E4E7]/60 pt-1.5 mt-1.5">
                                "{quote.seller_notes}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {quote.status === 'Offered' && (
                        <button
                          onClick={() => handleAcceptOffer(quote.id)}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded font-bold text-xs transition-colors cursor-pointer"
                        >
                          Accept & Order
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border border-dashed border-[#E4E4E7] bg-white space-y-4">
                  <FileUp className="w-12 h-12 text-[#76777d]/20 mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#0F172A]">No requests found</p>
                  <p className="text-xs text-[#45464d]">Click "Get Quote" on any machining capability to submit your first CAD request.</p>
                  <button
                    onClick={() => setBuyerTab('browse')}
                    className="mt-2 py-2 px-5 border border-[#0F172A] text-[#0F172A] font-bold text-xs hover:bg-[#0F172A] hover:text-white transition-colors cursor-pointer"
                  >
                    Browse Services
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ==========================================
              SELLER SUB-VIEWS
              ========================================== */}
          {activeView === 'seller' && sellerTab === 'listings' && (
            <div className="space-y-4">
              {loadingQuotes ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
                  {[1, 2, 3].map(n => <div key={n} className="h-44 bg-white border border-[#E4E4E7]" />)}
                </div>
              ) : myServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {myServices.map((service) => (
                    <div key={service.id} className="bg-white border border-[#E4E4E7] overflow-hidden flex flex-col justify-between hover:border-[#0F172A] transition-all relative">
                      <div className="h-28 bg-[#F8FAFC] border-b border-[#E4E4E7]/60 flex items-center justify-center relative">
                        <div className={`w-full h-full bg-gradient-to-br ${
                          service.process_type === 'CNC Machining' ? 'from-blue-600/10 to-indigo-600/5'
                          : service.process_type === '3D Printing' ? 'from-violet-500/10 to-purple-500/5'
                          : service.process_type === 'Sheet Metal' ? 'from-amber-500/10 to-orange-500/5'
                          : 'from-red-500/10 to-pink-500/5'
                        } flex items-center justify-center`}>
                          <Settings className="w-8 h-8 text-[#0F172A] opacity-25" />
                        </div>
                        <div className="absolute top-2 right-2">
                          <span className="bg-[#0F172A] text-white text-[8px] font-mono px-1.5 py-0.5 uppercase tracking-wider font-semibold">
                            {service.lead_time}
                          </span>
                        </div>
                        <div className="absolute top-2 left-2">
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 uppercase tracking-wider border font-semibold ${
                            service.process_type === 'CNC Machining' ? 'bg-blue-500/10 text-blue-750 border-blue-500/20'
                            : service.process_type === '3D Printing' ? 'bg-violet-500/10 text-violet-750 border-violet-500/20'
                            : service.process_type === 'Sheet Metal' ? 'bg-amber-500/10 text-amber-750 border-amber-500/20'
                            : 'bg-red-500/10 text-red-750 border-red-500/20'
                          }`}>
                            {service.process_type}
                          </span>
                        </div>
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <h4 className="font-['Space_Grotesk'] text-sm font-semibold text-[#0F172A] leading-tight mb-2">
                          {service.title}
                        </h4>
                        <p className="text-xs text-[#45464d] line-clamp-2 mb-4 leading-relaxed">{service.description}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-[#E4E4E7] mt-auto">
                          <span className="font-['Space_Grotesk'] text-sm font-bold text-coral">
                            ₹{Number(service.base_price).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/8 border border-emerald-500/15 px-2 py-0.5 rounded uppercase tracking-wide">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border border-dashed border-[#E4E4E7] bg-white space-y-4">
                  <Package className="w-12 h-12 text-[#76777d]/20 mx-auto" />
                  <h3 className="text-sm font-bold text-[#0F172A]">No capabilities listed yet</h3>
                  <p className="text-xs text-[#45464d]">List your manufacturing services so buyers can submit CAD files for quoting.</p>
                  <button onClick={() => setShowListingModal(true)} className="mt-2 py-2.5 px-5 border border-[#0F172A] text-[#0F172A] font-bold text-xs hover:bg-[#0F172A] hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5 bg-[#0f172a] text-white">
                    <Plus className="w-3.5 h-3.5" /> List Service Capability
                  </button>
                </div>
              )}
            </div>
          )}

          {activeView === 'seller' && sellerTab === 'incoming' && (
            <div className="space-y-4">
              {loadingQuotes ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
                  {[1, 2, 3].map(n => <div key={n} className="h-44 bg-white border border-[#E4E4E7]" />)}
                </div>
              ) : sellerQuotes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {sellerQuotes.map((quote) => (
                    <div key={quote.id} className="bg-white border border-[#E4E4E7] p-5 flex flex-col justify-between space-y-4 hover:border-[#0F172A] transition-all relative">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 uppercase border font-semibold ${
                            quote.process_type === 'CNC Machining' ? 'bg-blue-500/10 text-blue-750 border-blue-500/20'
                            : quote.process_type === '3D Printing' ? 'bg-violet-500/10 text-violet-750 border-violet-500/20'
                            : quote.process_type === 'Sheet Metal' ? 'bg-amber-500/10 text-amber-750 border-amber-500/20'
                            : 'bg-red-500/10 text-red-750 border-red-500/20'
                          }`}>
                            {quote.process_type}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase border font-bold ${
                            quote.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : quote.status === 'Offered' ? 'bg-blue-500/10 text-cobalt border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}>
                            {quote.status}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-['Space_Grotesk'] text-sm font-semibold text-[#0F172A] leading-tight">
                            {quote.service_title}
                          </h4>
                          <p className="font-mono text-[10px] text-slate-text-muted mt-1.5 flex items-center gap-1 truncate font-semibold">
                            <File className="w-3.5 h-3.5 text-[#76777d] shrink-0" /> {quote.cad_file_name}
                          </p>
                        </div>

                        <div className="space-y-1 text-[11px] text-[#45464d] font-semibold border-t border-[#E4E4E7]/60 pt-2">
                          <div>Buyer: <span className="font-bold text-[#0F172A]">{quote.buyer_name}</span></div>
                        </div>

                        {quote.status === 'Offered' && quote.offer_price && (
                          <div className="bg-[#F8FAFC] border border-[#E4E4E7] p-2.5 rounded text-[10px] font-semibold text-[#45464d]">
                            Offer sent: <span className="font-bold text-coral">₹{Number(quote.offer_price).toLocaleString('en-IN')}</span>
                          </div>
                        )}

                        {quote.status === 'Accepted' && (
                          <div className="bg-emerald-500/8 border border-emerald-500/15 p-2.5 rounded text-[10px] text-emerald-600 font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Accepted by Buyer
                          </div>
                        )}
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
                          className="w-full bg-[#0F172A] hover:bg-[#06B6D4] text-white py-2.5 rounded font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" /> Send Price Quote
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border border-dashed border-[#E4E4E7] bg-white space-y-4">
                  <ShoppingBag className="w-12 h-12 text-[#76777d]/20 mx-auto" />
                  <p className="text-sm font-bold text-[#0F172A]">No incoming requests yet</p>
                  <p className="text-xs text-[#45464d]">Buyers will appear here once they upload design files to your capabilities.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Footer />

      {/* ─── MOBILE FILTER DRAWER ─── */}
      {/* Backdrop */}
      <div
        onClick={() => setShowFilterDrawer(false)}
        className={`md:hidden fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${showFilterDrawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      {/* Drawer panel */}
      <aside
        className={`md:hidden fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-2xl z-[60] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${showFilterDrawer ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Drawer header */}
        <div className="p-5 border-b border-[#E4E4E7] flex justify-between items-center bg-[#F8FAFC]">
          <h2 className="font-['Space_Grotesk'] text-base font-semibold text-[#0F172A] flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            Marketplace Filters
          </h2>
          <button onClick={() => setShowFilterDrawer(false)} className="p-1.5 hover:bg-[#E4E4E7] transition-colors cursor-pointer">
            <X className="w-4 h-4 text-[#45464d]" />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Mode Selector for sellers */}
          {profile?.is_seller && (
            <section>
              <h3 className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-[#45464d] mb-4">View Mode</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setActiveView('buyer'); setShowFilterDrawer(false); }}
                  className={`px-3 py-2.5 border text-xs font-bold transition-all cursor-pointer text-center ${
                    activeView === 'buyer'
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'border-[#E4E4E7] hover:bg-[#F8FAFC] text-[#45464d]'
                  }`}
                >
                  Buyer Hub
                </button>
                <button
                  onClick={() => { setActiveView('seller'); setShowFilterDrawer(false); }}
                  className={`px-3 py-2.5 border text-xs font-bold transition-all cursor-pointer text-center ${
                    activeView === 'seller'
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'border-[#E4E4E7] hover:bg-[#F8FAFC] text-[#45464d]'
                  }`}
                >
                  Seller Hub
                </button>
              </div>
            </section>
          )}

          {/* Process Category */}
          <section>
            <h3 className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-[#45464d] mb-4">Process</h3>
            <div className="grid grid-cols-2 gap-2">
              {(['All', 'CNC Machining', '3D Printing', 'Sheet Metal', 'Laser Cutting'] as const).map(proc => (
                <button
                  key={proc}
                  onClick={() => { setSelectedProcess(proc); setShowFilterDrawer(false); }}
                  className={`px-3 py-2.5 border text-xs font-['JetBrains_Mono'] text-left transition-colors cursor-pointer ${
                    selectedProcess === proc
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'border-[#E4E4E7] hover:bg-[#F8FAFC] text-[#45464d]'
                  }`}
                >
                  {proc}
                </button>
              ))}
            </div>
          </section>

          {/* Sort By */}
          <section>
            <h3 className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-[#45464d] mb-4">Sort By</h3>
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value); setShowFilterDrawer(false); }}
              className="w-full bg-white border border-[#E4E4E7] px-3 py-2.5 text-xs font-['Inter'] text-[#45464d] focus:outline-none focus:border-[#06B6D4] transition-colors cursor-pointer font-semibold"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
          </section>
        </div>
      </aside>

      {/* ==========================================
          MODAL 1: BUYER GET QUOTE (File Upload)
          ========================================== */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E4E4E7] rounded w-full max-w-lg shadow-xl p-5 space-y-4 animate-slide-in">
            <div className="flex justify-between items-start border-b border-[#E4E4E7] pb-3">
              <div>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${PROCESS_COLORS[selectedService.process_type] || ''}`}>
                  {selectedService.process_type}
                </span>
                <h3 className="text-base font-bold text-[#0F172A] uppercase font-['Space_Grotesk'] tracking-tight mt-1">{selectedService.title}</h3>
                <p className="text-[10px] text-[#76777d] uppercase font-bold font-mono">by {selectedService.seller_name}</p>
              </div>
              <button
                onClick={() => { setSelectedService(null); setUploadedFile(null); }}
                className="text-[#76777d] hover:text-[#0F172A] cursor-pointer p-1.5 rounded border border-[#E4E4E7] hover:bg-[#F8FAFC] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
 
            <form onSubmit={handleQuoteSubmit} className="space-y-4">
              {/* Drop Zone */}
              <div>
                <label className="block text-[10px] font-bold text-[#76777d] uppercase mb-1.5 font-mono">
                  Upload Design File (STEP, STL, IGES, DXF)
                </label>
                {!uploadedFile ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border border-dashed rounded p-6 text-center cursor-pointer transition-all ${
                      isDragging 
                        ? 'border-[#06b6d4] bg-[#06b6d4]/5' 
                        : 'border-[#E4E4E7] bg-[#F8FAFC]/50 hover:border-[#06b6d4] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <Upload className={`w-6 h-6 mx-auto mb-2 transition-colors ${isDragging ? 'text-[#06b6d4]' : 'text-[#76777d]/60'}`} />
                    <p className="text-xs font-bold text-[#0F172A]">
                      {isDragging ? 'Drop to upload' : 'Drag & drop your design file'}
                    </p>
                    <p className="text-[10px] text-[#76777d] mt-0.5">or <span className="text-[#06b6d4] font-bold">browse files</span></p>
                    <p className="text-[8px] text-[#76777d]/75 mt-1.5 font-mono uppercase tracking-wider">STEP · STL · IGES · DXF · OBJ · PDF</p>
                  </div>
                ) : (
                  <div className="border border-[#E4E4E7] rounded p-3 bg-white flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded bg-[#06b6d4]/8 border border-[#06b6d4]/20 flex items-center justify-center shrink-0">
                        <File className="w-4 h-4 text-[#06b6d4]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0F172A] truncate">{uploadedFile.name}</p>
                        <p className="text-[10px] text-[#76777d] font-mono">{formatFileSize(uploadedFile.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="text-[#76777d] hover:text-red-500 cursor-pointer shrink-0 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
 
              <div className="bg-[#F8FAFC] border border-[#E4E4E7] p-3.5 rounded text-[10px] text-[#45464d] leading-relaxed">
                <div className="text-[#06b6d4] flex items-center gap-1.5 mb-1 font-bold font-mono uppercase tracking-wider">
                  <Info className="w-3.5 h-3.5" /> Request Process
                </div>
                Your design model will be shared securely with this manufacturer. They will analyze geometric tolerances, recommend optimal materials, and send you a mechatronic RFQ quote.
              </div>
 
              <button
                type="submit"
                disabled={submittingQuote || !uploadedFile}
                className="w-full bg-[#0f172a] hover:bg-[#06b6d4] text-white py-2.5 rounded text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {submittingQuote ? (
                  <><RotateCcw className="w-3.5 h-3.5 animate-spin" /> Submitting Request...</>
                ) : (
                  <><Send className="w-3.5 h-3.5" /> Send Design & Request Quote</>
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
          <div className="bg-white border border-[#E4E4E7] rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-slide-in max-h-[90vh] overflow-y-auto">
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
                  className="w-full p-3 border border-slate-border rounded-xl bg-[#F8FAFC] text-slate-text-primary focus:outline-none focus:border-cobalt/40 transition-colors"
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
                    className="w-full p-3 border border-slate-border rounded-xl bg-[#F8FAFC] text-slate-text-primary focus:outline-none focus:border-cobalt/40"
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
                  className="w-full p-3 border border-slate-border rounded-xl bg-[#F8FAFC] text-slate-text-primary focus:outline-none focus:border-cobalt/40"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-text-secondary uppercase">Material Options <span className="normal-case text-slate-text-muted">(comma-separated)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Aluminium 6061, Stainless Steel 316, Brass"
                  value={newMaterials}
                  onChange={(e) => setNewMaterials(e.target.value)}
                  className="w-full p-3 border border-slate-border rounded-xl bg-[#F8FAFC] text-slate-text-primary focus:outline-none focus:border-cobalt/40"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-text-secondary uppercase">Finish Options <span className="normal-case text-slate-text-muted">(comma-separated)</span></label>
                <input
                  type="text"
                  placeholder="e.g. As-Machined, Bead Blasted, Anodized"
                  value={newFinishes}
                  onChange={(e) => setNewFinishes(e.target.value)}
                  className="w-full p-3 border border-slate-border rounded-xl bg-[#F8FAFC] text-slate-text-primary focus:outline-none focus:border-cobalt/40"
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
                  className="w-full p-3 border border-slate-border rounded-xl bg-[#F8FAFC] text-slate-text-primary resize-none focus:outline-none focus:border-cobalt/40"
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
          <div className="bg-white border border-[#E4E4E7] rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5 animate-slide-in">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-[#06B6D4]">Submit Price Quote</span>
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
                    className="w-full p-3 border border-slate-border rounded-xl bg-[#F8FAFC] text-slate-text-primary focus:outline-none"
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
                    className="w-full p-3 border border-slate-border rounded-xl bg-[#F8FAFC] text-slate-text-primary focus:outline-none"
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
                  className="w-full p-3 border border-[#E4E4E7] rounded-xl bg-[#F8FAFC] text-slate-text-primary resize-none focus:outline-none focus:border-cobalt/40"
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
    </div>
  );
}

interface ServiceCardProps {
  service: MachiningService;
  onGetQuote: (service: MachiningService) => void;
}

function ServiceCard({ service, onGetQuote }: ServiceCardProps) {
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
      ? SlidersHorizontal
      : Zap;

  return (
    <>
      {/* ─── DESKTOP CARD (portrait) ─── */}
      <div
        onClick={() => onGetQuote(service)}
        className="hidden md:flex flex-col bg-white border border-[#E4E4E7] overflow-hidden cursor-pointer group
          transition-all duration-205 hover:border-[#06B6D4] relative"
        style={{ boxShadow: '0 4px 6px -1px rgba(15,23,42,0.04), 0 2px 4px -2px rgba(15,23,42,0.04)', transition: 'transform 0.2s ease, border-color 0.2s ease' }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
      >
        {/* Visual representation / icon header */}
        <div className="h-40 bg-[#F8FAFC] overflow-hidden relative border-b border-[#E4E4E7]/60">
          <div className={`w-full h-full bg-gradient-to-br ${gradientClass} group-hover:scale-105 transition-transform duration-500 flex items-center justify-center`}>
            <ProcessIcon className="w-12 h-12 text-[#0F172A] opacity-25 group-hover:rotate-12 transition-transform duration-500" />
          </div>
          {/* Lead time badge */}
          <div className="absolute top-2 right-2">
            <span className="bg-[#0F172A] text-white text-[9px] font-mono px-1.5 py-0.5 uppercase tracking-wider flex items-center gap-1 font-bold">
              <Clock className="w-2.5 h-2.5" /> {service.lead_time}
            </span>
          </div>
          {/* Process type badge */}
          <div className="absolute top-2 left-2">
            <span className={`text-[9px] font-mono px-1.5 py-0.5 uppercase tracking-wider border font-bold ${
              service.process_type === 'CNC Machining' ? 'bg-blue-500/10 text-blue-700 border-blue-500/20'
              : service.process_type === '3D Printing' ? 'bg-violet-500/10 text-violet-700 border-violet-500/20'
              : service.process_type === 'Sheet Metal' ? 'bg-amber-500/10 text-amber-700 border-amber-500/20'
              : 'bg-red-500/10 text-red-700 border-red-500/20'
            }`}>
              {service.process_type}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col flex-1">
          <div className="mb-3">
            <h3 className="font-['Space_Grotesk'] text-sm font-semibold text-[#0F172A] leading-tight group-hover:text-[#06B6D4] transition-colors line-clamp-1">
              {service.title}
            </h3>
            <p className="text-[10px] text-slate-text-muted mt-0.5 font-semibold">by {service.seller_name}</p>
          </div>

          <p className="text-xs text-[#45464d] line-clamp-2 leading-relaxed mb-4">{service.description}</p>

          {/* Specs / Capability grid */}
          <div className="grid grid-cols-2 gap-y-2.5 mb-4 border-t border-[#E4E4E7]/60 pt-3">
            <div>
              <p className="font-['JetBrains_Mono'] text-[9px] text-[#76777d] uppercase tracking-wider mb-0.5">Materials</p>
              <p className="font-['Inter'] text-xs text-[#1b1b1d] truncate pr-2 font-semibold" title={service.material_capabilities.join(', ')}>
                {service.material_capabilities.slice(0, 2).join(', ')}
                {service.material_capabilities.length > 2 && '...'}
              </p>
            </div>
            <div>
              <p className="font-['JetBrains_Mono'] text-[9px] text-[#76777d] uppercase tracking-wider mb-0.5">Finishes</p>
              <p className="font-['Inter'] text-xs text-[#1b1b1d] truncate pr-2 font-semibold" title={service.finish_options.join(', ')}>
                {service.finish_options.slice(0, 2).join(', ')}
                {service.finish_options.length > 2 && '...'}
              </p>
            </div>
          </div>

          {/* Setup Fee + CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E4E4E7] mt-auto">
            <div>
              <p className="text-[9px] font-['Inter'] text-[#45464d] uppercase tracking-wider mb-0.5">Setup Fee</p>
              <p className="font-['Space_Grotesk'] text-sm font-bold text-[#0F172A]">
                ₹{Number(service.base_price).toLocaleString('en-IN')}
              </p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onGetQuote(service); }}
              className="px-3.5 py-2 bg-[#0F172A] text-white hover:bg-[#06B6D4] transition-colors flex items-center justify-center gap-1.5 font-bold text-xs font-['Inter'] cursor-pointer"
            >
              <span>Get Quote</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── MOBILE CARD (horizontal) ─── */}
      <div
        onClick={() => onGetQuote(service)}
        className="md:hidden flex bg-white border border-[#E4E4E7] overflow-hidden cursor-pointer product-card-mobile active:scale-[0.98] transition-transform w-full"
      >
        {/* Left: visual 1/3 */}
        <div className="w-1/3 relative bg-[#F8FAFC] border-r border-[#E4E4E7] shrink-0">
          <div className={`w-full h-full min-h-[120px] bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
            <ProcessIcon className="w-8 h-8 text-[#0F172A] opacity-20" />
          </div>
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <span className="bg-[#0F172A] text-white text-[8px] font-mono px-1.5 py-0.5 uppercase tracking-wider">
              {service.process_type.slice(0, 4).toUpperCase()}
            </span>
            <span className="bg-[#10B981] text-white text-[8px] font-mono px-1.5 py-0.5 uppercase tracking-wider">
              {service.lead_time.split(' ')[0]} DAYS
            </span>
          </div>
        </div>

        {/* Right: details 2/3 */}
        <div className="w-2/3 p-3 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-0.5">
              <span className="font-['JetBrains_Mono'] text-[9px] text-[#45464d] uppercase tracking-widest truncate max-w-[100px] font-bold">
                by {service.seller_name}
              </span>
              <span className="font-['JetBrains_Mono'] text-[10px] font-semibold text-[#0F172A]">
                ₹{Number(service.base_price).toLocaleString('en-IN')}
              </span>
            </div>
            <h3 className="font-['Space_Grotesk'] text-xs font-semibold text-[#0F172A] leading-tight mb-2">
              {service.title}
            </h3>

            {/* Spec grid */}
            <div className="grid grid-cols-2 gap-y-1.5 mb-3">
              <div>
                <p className="font-['JetBrains_Mono'] text-[8px] text-[#45464d] uppercase">Materials</p>
                <p className="font-['JetBrains_Mono'] text-[9px] font-semibold text-[#1b1b1d] truncate">
                  {service.material_capabilities.slice(0, 2).join(', ')}
                </p>
              </div>
              <div>
                <p className="font-['JetBrains_Mono'] text-[8px] text-[#45464d] uppercase">Finishes</p>
                <p className="font-['JetBrains_Mono'] text-[9px] font-semibold text-[#1b1b1d] truncate">
                  {service.finish_options.slice(0, 2).join(', ')}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom: actions */}
          <div className="flex items-center justify-end pt-2 border-t border-[#E4E4E7]/50">
            <button
              onClick={e => { e.stopPropagation(); onGetQuote(service); }}
              className="bg-[#0F172A] text-white px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-transform cursor-pointer"
            >
              <span>Get Quote</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
