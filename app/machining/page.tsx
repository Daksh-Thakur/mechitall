'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useCart } from '@/components/CartProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ServiceCard from '@/components/ServiceCard';
import {
  getMachiningServices, listMachiningService, requestMachiningQuote,
  MachiningService
} from '@/app/actions/marketplace';
import {
  Cpu, FileUp, Settings, Plus, Sparkles, CheckCircle2, Clock,
  ShieldCheck, ShoppingBag, Send, Layers,
  ChevronRight, Info, X, Upload, File, Trash2, Eye, ArrowRight,
  Zap, RotateCcw, Package, Search, SlidersHorizontal, SlidersVertical
} from 'lucide-react';
import { getChatUploadSignedUrl, getUploadSignedUrl, sendChatMessage } from '@/app/actions/machining-workflow';

const MOCK_DEMO_SERVICES: MachiningService[] = [];

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
  const [loadingServices, setLoadingServices] = useState(true);

  // Search & filter state (buyer view)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProcess, setSelectedProcess] = useState('All');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // New state variables to match products page layout
  const [sortBy, setSortBy] = useState<string>('featured');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [hasSetInitialView, setHasSetInitialView] = useState(false);

  // Auto-open Get Quote modal if a service ID is passed in url query parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const quoteId = params.get('quote');
      if (quoteId && services.length > 0) {
        const found = services.find(s => s.id === quoteId);
        if (found) {
          setSelectedService(found);
          const url = new URL(window.location.href);
          url.searchParams.delete('quote');
          window.history.replaceState(null, '', url.pathname + url.search);
        }
      }
    }
  }, [services]);

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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

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
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);



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

  // Load my seller services
  useEffect(() => {
    async function loadSellerServices() {
      if (!profile) return;
      try {
        if (activeView === 'seller') {
          const allServices = await getMachiningServices();
          setMyServices(allServices.filter(s => s.seller_profile_id === profile.id));
        }
      } catch (err) {
        console.error('Failed to load seller services:', err);
      }
    }
    loadSellerServices();
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
    setUploadProgress(0);
    try {
      const resObj = await requestMachiningQuote(profile.id, selectedService.id, {
        cadFileName: uploadedFile.name,
      });

      const quoteId = resObj.quoteId;
      const rfqId = resObj.rfqId;

      if (quoteId && rfqId) {
        // Generate signed upload URL for the CAD file in rfq-cad-files
        const signedRes = await getUploadSignedUrl(quoteId, uploadedFile.name);
        if (signedRes.success && signedRes.data) {
          const { token, path, signedUrl } = signedRes.data;

          // Upload with progress using XMLHttpRequest
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', signedUrl);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.setRequestHeader('Content-Type', uploadedFile.type || 'application/octet-stream');

            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                setUploadProgress(percent);
              }
            });

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
              } else {
                reject(new Error(`Upload failed with status: ${xhr.status}`));
              }
            };

            xhr.onerror = () => reject(new Error('Network error during file upload'));
            xhr.send(uploadedFile);
          });

          // Automatically send this design file as the first chat message in the thread
          const msgRes = await sendChatMessage({
            rfqId,
            quoteId,
            messageText: `Shared CAD Design: ${uploadedFile.name}`,
            fileAttachmentPath: path,
          });

          if (!msgRes.success) {
            throw new Error(`Failed to link design file in chat: ${msgRes.error || 'Unknown error'}`);
          }
        }
      }

      showToast(`"${uploadedFile.name}" shared with seller! Awaiting custom quote.`, 'success');
      setSelectedService(null);
      setUploadedFile(null);
      router.push('/profile?tab=chats');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit request.', 'error');
    } finally {
      setSubmittingQuote(false);
      setUploadProgress(null);
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
        imageData: imagePreviews[0] || undefined,
        imagesData: imagePreviews || [],
      });

      showToast('Service listed successfully!', 'success');
      setShowListingModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewMaterials('');
      setNewFinishes('');
      setNewBasePrice(100);
      setImagePreviews([]);

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



  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 font-sans flex flex-col overflow-x-clip">
      <Navbar />

      {/* ─── MOBILE TOP BAR ─── */}
      <div className="md:hidden sticky top-0 z-40 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 h-14">
        <h1 className="font-['Space_Grotesk'] text-base font-bold text-white">Machining</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilterDrawer(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-700/60 bg-zinc-800 text-[11px] font-mono font-bold uppercase tracking-wider hover:bg-zinc-700 text-zinc-100 transition-colors cursor-pointer"
          >
            <SlidersVertical className="w-3.5 h-3.5" />
            Filter
          </button>
        </div>
      </div>

      <div className="flex flex-1 w-full max-w-[1280px] mx-auto">
        {/* ─── DESKTOP LEFT SIDEBAR ─── */}
        <aside className="hidden lg:flex w-64 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] border-r border-zinc-800 bg-zinc-900 flex-col p-6 gap-4 overflow-y-auto">
          {/* Mode Switcher */}
          <div className="pb-4 border-b border-zinc-800 flex flex-col gap-2">
            <label className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-wider text-zinc-500">Marketplace Role</label>
            {profile ? (
              profile.is_seller ? (
                <div className="grid grid-cols-2 gap-1 bg-zinc-800 p-1 rounded">
                  <button
                    onClick={() => setActiveView('buyer')}
                    className={`py-1.5 text-xs font-bold text-center transition-all cursor-pointer rounded ${activeView === 'buyer'
                        ? 'bg-blue-500 text-zinc-950 font-bold'
                        : 'text-zinc-400 hover:text-white'
                      }`}
                  >
                    Buyer Hub
                  </button>
                  <button
                    onClick={() => setActiveView('seller')}
                    className={`py-1.5 text-xs font-bold text-center transition-all cursor-pointer rounded ${activeView === 'seller'
                        ? 'bg-blue-500 text-zinc-950 font-bold'
                        : 'text-zinc-400 hover:text-white'
                      }`}
                  >
                    Seller Hub
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded flex flex-col gap-1.5">
                  <p className="text-[10px] text-amber-300 leading-normal font-semibold">
                    Want to list your machining capabilities?
                  </p>
                  <button
                    onClick={() => router.push('/profile')}
                    className="text-[9px] font-bold text-left text-amber-400 hover:text-amber-300 underline flex items-center gap-0.5"
                  >
                    Activate Seller Mode <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              )
            ) : (
              <div className="p-3 bg-zinc-800 border border-zinc-700/60 rounded flex flex-col gap-1.5">
                <p className="text-[10px] text-zinc-400 leading-normal font-semibold">
                  Sign in to view your quotes or list services.
                </p>
                <button
                  onClick={() => router.push('/login')}
                  className="text-[9px] font-bold text-left text-blue-400 hover:text-blue-300 underline flex items-center gap-0.5"
                >
                  Sign In <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>

          {/* Process Navigation */}
          <div className="pb-2">
            <h2 className="font-['Space_Grotesk'] text-base font-bold text-white">Filter Specs</h2>
            <p className="font-['Inter'] text-xs text-zinc-500 mt-0.5 opacity-70">Machining Processes</p>
          </div>

          <nav className="flex flex-col gap-1">
            {(['All', 'CNC Machining', '3D Printing', 'Sheet Metal', 'Laser Cutting'] as const).map(proc => (
              <button
                key={proc}
                onClick={() => setSelectedProcess(proc)}
                className={`flex items-center gap-3 px-3 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-left transition-all cursor-pointer rounded-md ${selectedProcess === proc
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/25 font-bold'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
              >
                {proc === 'All' ? 'All Processes' : proc}
              </button>
            ))}
          </nav>

          {/* Sort By */}
          <div className="pt-4 border-t border-zinc-800 flex flex-col gap-3">
            <label className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-wider text-zinc-500">Sort By</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-zinc-800 border border-zinc-700/60 px-3 py-2 text-xs font-['Inter'] text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer font-semibold"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
          </div>

          {/* Reset Filters */}
          <button
            onClick={() => { setSelectedProcess('All'); setSearchQuery(''); setSortBy('featured'); }}
            className="mt-auto py-2 px-4 border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer font-mono text-xs uppercase font-bold"
          >
            Reset Filters
          </button>
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <main className="flex-1 min-w-0 px-3 md:px-6 lg:px-8 py-4 md:py-8">

          {/* Desktop Blueprint Header Banner */}
          <div
            className="hidden md:block mb-4 border-l-4 border-blue-500 px-4 py-3 bg-zinc-950/40 border border-zinc-800/80 rounded-r-xl"
            style={{
              backgroundImage: 'linear-gradient(to right, rgba(59,130,246,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(59,130,246,0.02) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          >
            <div className="flex justify-between items-center">
              <div>
                <h1 className="font-['Space_Grotesk'] text-lg font-bold text-white">On-Demand Manufacturing</h1>
                <p className="font-['Inter'] text-xs text-zinc-400 mt-0.5">
                  Connect with verified fabrication facilities, upload design files, and receive custom quotes.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {activeView === 'seller' && (
                  <button
                    onClick={() => setShowListingModal(true)}
                    className="bg-blue-500 text-zinc-950 hover:bg-blue-400 text-[8px] font-['JetBrains_Mono'] uppercase tracking-wider py-1.5 px-3 transition-colors font-bold flex items-center gap-1 cursor-pointer rounded"
                  >
                    <Plus className="w-3 h-3" /> List Service
                  </button>
                )}
                <span className="px-2 py-1 bg-blue-500 text-zinc-950 text-[8px] font-['JetBrains_Mono'] uppercase tracking-wider flex items-center gap-1 select-none font-bold rounded">
                  ✓ Digital Escrow Secured
                </span>
              </div>
            </div>
          </div>

          {/* ==========================================
              BUYER SUB-VIEWS
              ========================================== */}
          {activeView === 'buyer' && (
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
                  className="w-full bg-zinc-800 border border-zinc-700/60 px-10 py-3 pr-28 text-sm font-['Inter'] text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-zinc-500 rounded-xl"
                />
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {searchQuery && (
                    <button onClick={() => { setSearchQuery(''); setShowSuggestions(false); }} className="cursor-pointer">
                      <X className="w-3.5 h-3.5 text-zinc-400 hover:text-red-500 transition-colors" />
                    </button>
                  )}
                  <span className="text-[10px] font-mono bg-zinc-900 px-1.5 py-0.5 border border-zinc-700/60 text-zinc-400 select-none" title="Matching items">
                    {filteredServices.length}/{services.length}
                  </span>
                  <span className="hidden md:block text-[10px] font-mono bg-zinc-900 px-1.5 py-0.5 border border-zinc-700/60 text-zinc-400">Search</span>
                </div>

                {/* Autocomplete Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-zinc-800 border border-zinc-700/65 shadow-2xl overflow-hidden py-1 max-h-72 overflow-y-auto divide-y divide-zinc-700/50 rounded-xl">
                    {suggestions.map(s => (
                      <div
                        key={s.id}
                        onClick={() => { setSearchQuery(s.title); setShowSuggestions(false); }}
                        className="p-3 hover:bg-zinc-700/50 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-white truncate">{s.title}</span>
                            <span className={`text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 bg-zinc-900 border border-zinc-700/60 text-zinc-450 select-none shrink-0 font-mono`}>
                              {s.process_type}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-400 block mt-0.5">by {s.seller_name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <span className="block text-xs font-bold text-white font-mono">₹{Number(s.base_price).toLocaleString('en-IN')}</span>
                            <span className="block text-[8px] text-zinc-450 font-mono uppercase">setup fee</span>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); setSelectedService(s); setShowSuggestions(false); }}
                            className="p-1.5 border border-zinc-700 bg-zinc-900 hover:border-blue-500 transition-all cursor-pointer rounded text-zinc-450 hover:text-white"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile process pills */}
              <div className="md:hidden flex gap-1.5 overflow-x-auto no-scrollbar mb-4">
                {(['All', 'CNC Machining', '3D Printing', 'Sheet Metal', 'Laser Cutting'] as const).map(proc => (
                  <button
                    key={proc}
                    onClick={() => setSelectedProcess(proc)}
                    className={`shrink-0 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider border rounded-md transition-all cursor-pointer ${selectedProcess === proc
                        ? 'bg-blue-500 text-zinc-950 border-blue-500 font-bold'
                        : 'bg-zinc-800 text-zinc-450 border-zinc-700/60 hover:border-zinc-500'
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
                    <div key={n} className="bg-zinc-800 border border-zinc-700/60 h-80 rounded-xl">
                      <div className="h-40 bg-zinc-900/50" />
                      <div className="p-5 space-y-3">
                        <div className="h-3 bg-zinc-700 w-3/4" />
                        <div className="h-2 bg-zinc-700 w-1/2" />
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
                <div className="text-center py-20 border border-dashed border-zinc-850 bg-zinc-900/40 rounded-2xl space-y-4">
                  <div className="text-4xl opacity-20 text-blue-500">⚙️</div>
                  <p className="text-sm font-bold text-white">No machining services found</p>
                  <p className="text-xs text-zinc-400">Try different search terms or clear the process filter.</p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedProcess('All'); setSortBy('featured'); }}
                    className="mt-2 py-2 px-5 border border-zinc-750 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer font-mono text-xs uppercase font-bold"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ==========================================
              SELLER SUB-VIEWS
              ========================================== */}
          {activeView === 'seller' && (
            <div className="space-y-4">
              {loadingServices ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
                  {[1, 2, 3].map(n => <div key={n} className="h-44 bg-zinc-800 border border-zinc-700/60 rounded-xl" />)}
                </div>
              ) : myServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {myServices.map((service) => (
                    <div key={service.id} className="bg-zinc-800 border border-zinc-700/60 overflow-hidden flex flex-col justify-between hover:border-blue-500 transition-all relative rounded-xl">
                      <div className="h-28 bg-zinc-900/50 border-b border-zinc-850 flex items-center justify-center relative">
                        <div className={`w-full h-full bg-gradient-to-br ${service.process_type === 'CNC Machining' ? 'from-blue-600/10 to-indigo-600/5'
                            : service.process_type === '3D Printing' ? 'from-violet-500/10 to-purple-500/5'
                              : service.process_type === 'Sheet Metal' ? 'from-amber-500/10 to-orange-500/5'
                                : 'from-red-500/10 to-pink-500/5'
                          } flex items-center justify-center`}>
                          <Settings className="w-8 h-8 text-white opacity-25" />
                        </div>
                        <div className="absolute top-2 right-2">
                          <span className="bg-zinc-900 text-zinc-400 text-[8px] font-mono px-1.5 py-0.5 uppercase tracking-wider font-semibold border border-zinc-750 rounded">
                            {service.lead_time}
                          </span>
                        </div>
                        <div className="absolute top-2 left-2">
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 uppercase tracking-wider border font-semibold ${service.process_type === 'CNC Machining' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : service.process_type === '3D Printing' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                                : service.process_type === 'Sheet Metal' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                            {service.process_type}
                          </span>
                        </div>
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <h4 className="font-['Space_Grotesk'] text-sm font-semibold text-white leading-tight mb-2">
                          {service.title}
                        </h4>
                        <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed">{service.description}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-zinc-700/50 mt-auto">
                          <span className="font-['Space_Grotesk'] text-sm font-bold text-coral">
                            ₹{Number(service.base_price).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-400/20 px-2 py-0.5 rounded uppercase tracking-wide">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border border-dashed border-zinc-850 bg-zinc-900/40 rounded-2xl space-y-4">
                  <Package className="w-12 h-12 text-zinc-500/20 mx-auto" />
                  <h3 className="text-sm font-bold text-white">No capabilities listed yet</h3>
                  <p className="text-xs text-zinc-400">List your manufacturing services so buyers can submit CAD files for quoting.</p>
                  <button onClick={() => setShowListingModal(true)} className="mt-2 py-2.5 px-5 bg-blue-500 text-zinc-950 font-bold text-xs hover:bg-blue-400 transition-colors cursor-pointer inline-flex items-center gap-1.5 rounded-lg">
                    <Plus className="w-3.5 h-3.5" /> List Service Capability
                  </button>
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
        className={`md:hidden fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 transition-opacity duration-300 ${showFilterDrawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      {/* Drawer panel */}
      <aside
        className={`md:hidden fixed top-0 right-0 h-full w-[85%] max-w-sm bg-zinc-900 shadow-2xl z-[60] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${showFilterDrawer ? 'translate-x-0' : 'translate-x-full'} text-zinc-100 border-l border-zinc-800`}
      >
        {/* Drawer header */}
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
          <h2 className="font-['Space_Grotesk'] text-base font-semibold text-white flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-500" />
            Marketplace Filters
          </h2>
          <button onClick={() => setShowFilterDrawer(false)} className="p-1.5 hover:bg-zinc-800 transition-colors cursor-pointer text-zinc-450 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Mode Selector for sellers */}
          {profile?.is_seller && (
            <section>
              <h3 className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-zinc-500 mb-4">View Mode</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setActiveView('buyer'); setShowFilterDrawer(false); }}
                  className={`px-3 py-2.5 border text-xs font-bold transition-all cursor-pointer text-center rounded-md ${activeView === 'buyer'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800'
                    }`}
                >
                  Buyer Hub
                </button>
                <button
                  onClick={() => { setActiveView('seller'); setShowFilterDrawer(false); }}
                  className={`px-3 py-2.5 border text-xs font-bold transition-all cursor-pointer text-center rounded-md ${activeView === 'seller'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800'
                    }`}
                >
                  Seller Hub
                </button>
              </div>
            </section>
          )}

          {/* Process Category */}
          <section>
            <h3 className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-zinc-500 mb-4">Process</h3>
            <div className="grid grid-cols-2 gap-2">
              {(['All', 'CNC Machining', '3D Printing', 'Sheet Metal', 'Laser Cutting'] as const).map(proc => (
                <button
                  key={proc}
                  onClick={() => { setSelectedProcess(proc); setShowFilterDrawer(false); }}
                  className={`px-3 py-2.5 border text-xs font-['JetBrains_Mono'] text-left transition-colors cursor-pointer rounded-md ${selectedProcess === proc
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                >
                  {proc}
                </button>
              ))}
            </div>
          </section>

          {/* Sort By */}
          <section>
            <h3 className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-zinc-500 mb-4">Sort By</h3>
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value); setShowFilterDrawer(false); }}
              className="w-full bg-zinc-800 border border-zinc-700/60 px-3 py-2.5 text-xs font-['Inter'] text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer font-semibold rounded-md"
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
          <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl w-full max-w-lg shadow-xl p-5 space-y-4 animate-slide-in text-zinc-100">
            <div className="flex justify-between items-start border-b border-zinc-700/50 pb-3">
              <div>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${PROCESS_COLORS[selectedService.process_type] || ''}`}>
                  {selectedService.process_type}
                </span>
                <h3 className="text-base font-bold text-white uppercase font-['Space_Grotesk'] tracking-tight mt-1">{selectedService.title}</h3>
                <p className="text-[10px] text-zinc-400 uppercase font-bold font-mono">by {selectedService.seller_name}</p>
              </div>
              <button
                onClick={() => { setSelectedService(null); setUploadedFile(null); }}
                className="text-zinc-400 hover:text-white cursor-pointer p-1.5 rounded border border-zinc-700 bg-zinc-900 hover:bg-zinc-750 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleQuoteSubmit} className="space-y-4">
              {/* Drop Zone */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5 font-mono">
                  Upload Design File (STEP, STL, IGES, DXF)
                </label>
                {!uploadedFile ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border border-dashed rounded p-6 text-center cursor-pointer transition-all ${isDragging
                        ? 'border-blue-500 bg-blue-500/5'
                        : 'border-zinc-700 bg-zinc-900/50 hover:border-blue-500 hover:bg-zinc-900'
                      }`}
                  >
                    <Upload className={`w-6 h-6 mx-auto mb-2 transition-colors ${isDragging ? 'text-blue-500' : 'text-zinc-500'}`} />
                    <p className="text-xs font-bold text-white">
                      {isDragging ? 'Drop to upload' : 'Drag & drop your design file'}
                    </p>
                    <p className="text-[10px] text-zinc-450 mt-0.5">or <span className="text-blue-400 font-bold">browse files</span></p>
                    <p className="text-[8px] text-zinc-500 mt-1.5 font-mono uppercase tracking-wider">STEP · STL · IGES · DXF · OBJ · PDF</p>
                  </div>
                ) : (
                  <div className="border border-zinc-700 rounded p-3 bg-zinc-900 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <File className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{uploadedFile.name}</p>
                        <p className="text-[10px] text-zinc-400 font-mono">{formatFileSize(uploadedFile.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="text-zinc-400 hover:text-red-400 cursor-pointer shrink-0 transition-colors p-1"
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

              <div className="bg-zinc-950/40 border border-zinc-750/50 p-3.5 rounded text-[10px] text-zinc-400 leading-relaxed">
                <div className="text-blue-400 flex items-center gap-1.5 mb-1 font-bold font-mono uppercase tracking-wider">
                  <Info className="w-3.5 h-3.5" /> Request Process
                </div>
                Your design model will be shared securely with this manufacturer. They will analyze geometric tolerances, recommend optimal materials, and send you a mechatronic RFQ quote.
              </div>

              {uploadProgress !== null && (
                <div className="space-y-1.5 bg-zinc-900 border border-zinc-700/60 p-3 rounded-lg">
                  <div className="flex justify-between text-[10px] font-bold text-blue-400 uppercase tracking-wider font-mono">
                    <span>Uploading Design Model</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submittingQuote || !uploadedFile}
                className="w-full bg-blue-500 hover:bg-blue-600 text-zinc-950 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {submittingQuote ? (
                  <><RotateCcw className="w-3.5 h-3.5 animate-spin" /> {uploadProgress !== null ? `Uploading Design (${uploadProgress}%)...` : 'Submitting Request...'}</>
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
          <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-slide-in max-h-[90vh] overflow-y-auto text-zinc-100">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-white font-['Space_Grotesk']">List New Machining Service</h3>
                <p className="text-[10px] text-zinc-400 font-semibold font-sans">Fill in your capability details</p>
              </div>
              <button
                onClick={() => setShowListingModal(false)}
                className="text-zinc-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleListServiceSubmit} className="space-y-4 text-xs font-bold font-mono">
              <div className="space-y-1">
                <label className="block text-[10px] text-zinc-400 uppercase font-bold">Service Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5-Axis Precision Aluminum Milling"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-3 border border-zinc-700 rounded-xl bg-zinc-900 text-white focus:outline-none focus:border-blue-500/50 transition-colors font-sans font-semibold text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-zinc-400 uppercase font-bold">Process Type *</label>
                  <select
                    value={newProcess}
                    onChange={(e) => setNewProcess(e.target.value as any)}
                    className="w-full p-3 border border-zinc-700 rounded-xl bg-zinc-900 text-white focus:outline-none focus:border-blue-500/50 font-sans text-xs font-medium cursor-pointer"
                  >
                    <option>CNC Machining</option>
                    <option>3D Printing</option>
                    <option>Sheet Metal</option>
                    <option>Laser Cutting</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-zinc-400 uppercase font-bold">Base Setup Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newBasePrice}
                    onChange={(e) => setNewBasePrice(Number(e.target.value))}
                    className="w-full p-3 border border-zinc-700 rounded-xl bg-zinc-900 text-white focus:outline-none focus:border-blue-500/50 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-zinc-400 uppercase font-bold">Lead Time *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4 business days"
                  value={newLeadTime}
                  onChange={(e) => setNewLeadTime(e.target.value)}
                  className="w-full p-3 border border-zinc-700 rounded-xl bg-zinc-900 text-white focus:outline-none focus:border-blue-500/50 font-sans font-semibold text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-zinc-400 uppercase font-bold">Material Options <span className="normal-case text-zinc-500">(comma-separated)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Aluminium 6061, Stainless Steel 316, Brass"
                  value={newMaterials}
                  onChange={(e) => setNewMaterials(e.target.value)}
                  className="w-full p-3 border border-zinc-700 rounded-xl bg-zinc-900 text-white focus:outline-none focus:border-blue-500/50 font-sans font-semibold text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-zinc-400 uppercase font-bold">Finish Options <span className="normal-case text-zinc-500">(comma-separated)</span></label>
                <input
                  type="text"
                  placeholder="e.g. As-Machined, Bead Blasted, Anodized"
                  value={newFinishes}
                  onChange={(e) => setNewFinishes(e.target.value)}
                  className="w-full p-3 border border-zinc-700 rounded-xl bg-zinc-900 text-white focus:outline-none focus:border-blue-500/50 font-sans font-semibold text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-zinc-400 uppercase font-bold">Service Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain your capabilities, tolerances, equipment, and quality standards..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-3 border border-zinc-700 rounded-xl bg-zinc-900 text-white resize-none focus:outline-none focus:border-blue-500/50 font-sans font-medium text-xs"
                />
              </div>

              {/* Service Images Uploader */}
              <div className="space-y-1">
                <label className="block text-[10px] text-zinc-400 uppercase font-bold">Service Images</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.svg"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      Array.from(e.target.files).forEach((file) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImagePreviews((prev) => [...prev, reader.result as string]);
                        };
                        reader.readAsDataURL(file);
                      });
                    }
                  }}
                  className="w-full p-2.5 border border-zinc-700 rounded-xl bg-zinc-900 text-xs font-mono text-zinc-450 focus:outline-none focus:border-blue-500/50"
                />
                {imagePreviews.length > 0 && (
                  <div className="flex gap-2 flex-wrap pt-2">
                    {imagePreviews.map((src, index) => (
                      <div key={index} className="relative w-12 h-12 border border-zinc-700 rounded-lg overflow-hidden bg-zinc-900">
                        <img src={src} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImagePreviews((prev) => prev.filter((_, i) => i !== index))}
                          className="absolute top-0.5 right-0.5 bg-red-500 hover:bg-red-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-black cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={listingService}
                className="w-full bg-blue-500 hover:bg-blue-600 text-zinc-950 py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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


    </div>
  );
}


