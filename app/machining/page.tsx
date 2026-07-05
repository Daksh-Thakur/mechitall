'use client';

import React, { useState, useEffect, useTransition } from 'react';
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
  HelpCircle, ShieldCheck, ShoppingBag, Send, AlertTriangle, Layers, ChevronRight, Info
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

export default function MachiningMarketplacePage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile, showToast } = useCart();

  const [activeView, setActiveView] = useState<'buyer' | 'seller'>('buyer');
  const [services, setServices] = useState<MachiningService[]>([]);
  const [buyerQuotes, setBuyerQuotes] = useState<MachiningQuote[]>([]);
  const [sellerQuotes, setSellerQuotes] = useState<MachiningQuote[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingQuotes, setLoadingQuotes] = useState(true);

  // Quote Configurator Modal state
  const [selectedService, setSelectedService] = useState<MachiningService | null>(null);
  const [cadFileName, setCadFileName] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedFinish, setSelectedFinish] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // Seller: Add Service Listing state
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

  // Load services and user-specific quotes
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

  // Load quotes based on user profile and active role view
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
        }
      } catch (err) {
        console.error('Failed to load quotes details:', err);
      } finally {
        setLoadingQuotes(false);
      }
    }
    loadQuotes();
  }, [profile, activeView]);

  // Handle buyer sharing design file directly
  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      showToast('Please sign in to share designs.', 'error');
      router.push('/login');
      return;
    }
    if (!selectedService || !cadFileName) {
      showToast('Please specify a CAD design file name.', 'error');
      return;
    }

    setSubmittingQuote(true);
    try {
      await requestMachiningQuote(profile.id, selectedService.id, {
        cadFileName,
      });

      showToast('Design file shared with seller! Awaiting custom pricing quote.', 'success');
      setSelectedService(null);
      setCadFileName('');
      
      // Refresh buyer quotes
      const quotes = await getSubmittedQuotes(profile.id);
      setBuyerQuotes(quotes);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit request.', 'error');
    } finally {
      setSubmittingQuote(false);
    }
  };

  // Handle seller creating new service listing
  const handleListServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      showToast('Please sign in to list services.', 'error');
      router.push('/login');
      return;
    }
    if (!newTitle || !newDescription || newBasePrice < 0 || !newLeadTime) {
      showToast('Please fill in listing requirements.', 'error');
      return;
    }

    setListingService(true);
    try {
      const materialList = newMaterials.split(',').map((m) => m.trim()).filter(Boolean);
      const finishList = newFinishes.split(',').map((f) => f.trim()).filter(Boolean);

      await listMachiningService(profile.id, {
        title: newTitle,
        processType: newProcess,
        description: newDescription,
        basePrice: newBasePrice,
        leadTime: newLeadTime,
        materials: materialList.length > 0 ? materialList : ['Aluminium 6061', 'Stainless Steel 304'],
        finishes: finishList.length > 0 ? finishList : ['As-Machined', 'Anodized'],
      });

      showToast('Machining capability listed successfully!', 'success');
      setNewTitle('');
      setNewDescription('');
      setNewMaterials('');
      setNewFinishes('');
      
      // Refresh services listing
      const activeServices = await getMachiningServices();
      setServices(activeServices);
    } catch (err: any) {
      showToast(err.message || 'Failed to list machining capability.', 'error');
    } finally {
      setListingService(false);
    }
  };

  // Handle seller making custom pricing quote offer
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

      // Refresh incoming quotes
      if (profile) {
        const quotes = await getIncomingQuotes(profile.id);
        setSellerQuotes(quotes);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to submit quote offer.', 'error');
    } finally {
      setSubmittingOffer(false);
    }
  };

  // Handle buyer accepting seller quote offer
  const handleAcceptOffer = async (quoteId: string) => {
    try {
      const res = await acceptQuoteOffer(quoteId);
      showToast(`Offer accepted! Order ${res.orderId} logged.`, 'success');
      
      // Refresh buyer quotes
      if (profile) {
        const quotes = await getSubmittedQuotes(profile.id);
        setBuyerQuotes(quotes);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to accept quote offer.', 'error');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-bg font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full space-y-8">
        {/* Marketplace Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-border">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-cobalt bg-cobalt/5 border border-cobalt/20 px-2.5 py-0.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5" /> Machining Marketplace
            </span>
            <h1 className="text-3xl font-black text-slate-text-primary tracking-tight">On-Demand Manufacturing Hub</h1>
            <p className="text-xs text-slate-text-muted font-semibold max-w-2xl leading-relaxed">
              Connect directly with verified local fabrication facilities. List your machining capacities as a seller or upload custom 3D design files as a buyer to receive instant quoting audits.
            </p>
          </div>

        </div>

        {/* ==========================================
            BUYER VIEW: SERVICES & QUOTE SUBMISSIONS
            ========================================== */}
        {activeView === 'buyer' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Listed Machining Capabilities (Left) */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-sm font-black text-slate-text-primary tracking-tight uppercase">Available Seller Capabilities</h2>

              {loadingServices ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                  {[1, 2].map((n) => (
                    <div key={n} className="h-44 bg-white border border-slate-border rounded-xl"></div>
                  ))}
                </div>
              ) : services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {services.map((service) => (
                    <div 
                      key={service.id}
                      onClick={() => {
                        setSelectedService(service);
                        setSelectedMaterial(service.material_capabilities[0] || '');
                        setSelectedFinish(service.finish_options[0] || '');
                      }}
                      className="bg-white border border-slate-border rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between h-52 group"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-wider bg-cobalt/5 text-cobalt border-cobalt/10">
                            {service.process_type}
                          </span>
                          <span className="text-[9px] font-bold text-slate-text-muted flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {service.lead_time}
                          </span>
                        </div>

                        <h3 className="text-sm font-black text-slate-text-primary leading-tight group-hover:text-cobalt transition-colors">
                          {service.title}
                        </h3>
                        <p className="text-xs text-slate-text-muted leading-relaxed line-clamp-2">{service.description}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-border/50 flex items-center justify-between mt-3">
                        <div className="text-left">
                          <span className="block text-[8px] uppercase tracking-wider text-slate-text-muted font-bold">Base setup fee</span>
                          <span className="text-sm font-black text-coral">₹{Number(service.base_price).toFixed(2)}</span>
                        </div>
                        <span className="text-xs font-bold text-cobalt hover:opacity-80 transition-opacity flex items-center gap-0.5">
                          Configure RFQ <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-slate-border rounded-xl bg-white">
                  <Cpu className="w-10 h-10 text-slate-text-muted/30 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-text-primary">No machining services listed yet.</p>
                  <p className="text-[10px] text-slate-text-muted mt-1">Switch to the Seller dashboard to list the first capability!</p>
                </div>
              )}
            </div>

            {/* Buyer Quote Tracker (Right Sidebar) */}
            <div className="space-y-6">
              <h2 className="text-sm font-black text-slate-text-primary tracking-tight uppercase">My Quotes Dashboard</h2>

              {loadingQuotes ? (
                <div className="h-44 bg-white border border-slate-border rounded-xl animate-pulse"></div>
              ) : buyerQuotes.length > 0 ? (
                <div className="space-y-4">
                  {buyerQuotes.map((quote) => (
                    <div key={quote.id} className="bg-white border border-slate-border rounded-xl p-4 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-[9px] font-black text-slate-text-primary">{quote.cad_file_name}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                          quote.status === 'Accepted'
                            ? 'bg-emerald-500/10 text-emerald border-emerald-500/20'
                            : quote.status === 'Offered'
                            ? 'bg-blue-500/10 text-cobalt border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        }`}>
                          {quote.status}
                        </span>
                      </div>

                      <div className="space-y-1 text-slate-text-secondary text-[11px] leading-relaxed">
                        <div>Service: <span className="font-bold text-slate-text-primary">{quote.service_title}</span></div>
                        <div>Material: <span className="font-semibold">{quote.selected_material} ({quote.selected_finish})</span></div>
                        <div>Qty: <span className="font-semibold">{quote.quantity} units</span></div>
                      </div>

                      {quote.status === 'Offered' && quote.offer_price && (
                        <div className="bg-slate-bg/50 border border-slate-border p-3 rounded-lg space-y-2 mt-2">
                          <div className="flex justify-between items-baseline">
                            <span className="text-[10px] text-slate-text-muted font-bold">Seller Pricing Offer</span>
                            <span className="text-sm font-black text-coral">₹{Number(quote.offer_price).toFixed(2)}</span>
                          </div>
                          {quote.seller_notes && (
                            <p className="text-[10px] text-slate-text-secondary italic font-semibold">"{quote.seller_notes}"</p>
                          )}
                          <button
                            onClick={() => handleAcceptOffer(quote.id)}
                            className="btn-emerald py-2 w-full rounded-lg text-xs font-bold text-center cursor-pointer"
                          >
                            Accept Offer &amp; Order
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-slate-border bg-white rounded-xl">
                  <FileUp className="w-8 h-8 text-slate-text-muted/30 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-text-primary">No requests submitted.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            SELLER VIEW: ADD SERVICE & REVIEW RFQS
            ========================================== */}
        {activeView === 'seller' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Add Service Listing Form (Left) */}
            <div className="space-y-6">
              <h2 className="text-sm font-black text-slate-text-primary tracking-tight uppercase">List New Capability</h2>

              <form onSubmit={handleListServiceSubmit} className="bg-white border border-slate-border rounded-xl p-5 shadow-sm space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-text-secondary uppercase">Service Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5-Axis Precision Aluminum Milling"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs font-bold p-3 border border-slate-border rounded-lg bg-slate-bg/30 text-slate-text-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-text-secondary uppercase">Process Type</label>
                  <select
                    value={newProcess}
                    onChange={(e) => setNewProcess(e.target.value as any)}
                    className="w-full text-xs font-bold p-3 border border-slate-border rounded-lg bg-white text-slate-text-primary focus:outline-none"
                  >
                    <option value="CNC Machining">CNC Machining</option>
                    <option value="3D Printing">3D Printing</option>
                    <option value="Sheet Metal">Sheet Metal</option>
                    <option value="Laser Cutting">Laser Cutting</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-text-secondary uppercase">Base Setup Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newBasePrice}
                    onChange={(e) => setNewBasePrice(Number(e.target.value))}
                    className="w-full text-xs font-bold p-3 border border-slate-border rounded-lg bg-slate-bg/30 text-slate-text-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-text-secondary uppercase">Lead Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 4 business days"
                    value={newLeadTime}
                    onChange={(e) => setNewLeadTime(e.target.value)}
                    className="w-full text-xs font-bold p-3 border border-slate-border rounded-lg bg-slate-bg/30 text-slate-text-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-text-secondary uppercase">Material Options (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Aluminium 6061, Delrin POM"
                    value={newMaterials}
                    onChange={(e) => setNewMaterials(e.target.value)}
                    className="w-full text-xs font-bold p-3 border border-slate-border rounded-lg bg-slate-bg/30 text-slate-text-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-text-secondary uppercase">Finish Options (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. As-Machined, Bead Blasted, Anodized"
                    value={newFinishes}
                    onChange={(e) => setNewFinishes(e.target.value)}
                    className="w-full text-xs font-bold p-3 border border-slate-border rounded-lg bg-slate-bg/30 text-slate-text-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-text-secondary uppercase">Service Description</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Explain tolerance limits and surface qualities..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full text-xs font-bold p-3 border border-slate-border rounded-lg bg-slate-bg/30 text-slate-text-primary resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={listingService}
                  className="w-full btn-cobalt py-3.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" /> List Capability
                </button>
              </form>
            </div>

            {/* Seller Incoming RFQs Dashboard (Right) */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-sm font-black text-slate-text-primary tracking-tight uppercase">Incoming Buyer Requests</h2>

              {loadingQuotes ? (
                <div className="h-44 bg-white border border-slate-border rounded-xl animate-pulse"></div>
              ) : sellerQuotes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sellerQuotes.map((quote) => (
                    <div key={quote.id} className="bg-white border border-slate-border rounded-xl p-5 shadow-sm space-y-4">
                      <div className="flex justify-between items-start pb-2.5 border-b border-slate-border/50">
                        <div>
                          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-cobalt/5 text-cobalt border border-cobalt/10">
                            {quote.process_type}
                          </span>
                          <span className="block text-[10px] font-black text-slate-text-primary font-mono mt-1.5 truncate max-w-[160px]">{quote.cad_file_name}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase border ${
                          quote.status === 'Accepted'
                            ? 'bg-emerald-500/10 text-emerald border-emerald-500/20'
                            : quote.status === 'Offered'
                            ? 'bg-blue-500/10 text-cobalt border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        }`}>
                          {quote.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-slate-text-secondary text-xs leading-relaxed">
                        <div>Buyer: <span className="font-bold text-slate-text-primary">{quote.buyer_name}</span></div>
                        <div>Capability: <span className="font-semibold">{quote.service_title}</span></div>
                        <div>Material: <span className="font-semibold">{quote.selected_material}</span></div>
                        <div>Finish: <span className="font-semibold">{quote.selected_finish}</span></div>
                        <div>Units requested: <span className="font-semibold text-slate-text-primary">{quote.quantity} units</span></div>
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
                          className="btn-cobalt text-xs font-bold py-2.5 w-full rounded-lg text-center cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Send className="w-3.5 h-3.5" /> Submit Pricing Offer
                        </button>
                      )}

                      {quote.status === 'Offered' && quote.offer_price && (
                        <div className="bg-slate-bg/50 border border-slate-border p-2.5 rounded-lg text-[10px] text-slate-text-secondary font-semibold">
                          Active Pricing Offer: <span className="text-xs font-bold text-coral">₹{Number(quote.offer_price).toFixed(2)}</span>
                          {quote.seller_notes && <div className="italic mt-1">"{quote.seller_notes}"</div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 border border-dashed border-slate-border rounded-xl bg-white">
                  <ShoppingBag className="w-12 h-12 text-slate-text-muted/30 mx-auto mb-3 animate-pulse" />
                  <p className="text-sm font-bold text-slate-text-primary">No incoming RFQs for your services.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {selectedService && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5 animate-slide-in">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[8px] font-black uppercase tracking-wider text-cobalt">{selectedService.process_type}</span>
                <h3 className="text-base font-black text-slate-text-primary tracking-tight">Share Design File</h3>
              </div>
              <button 
                onClick={() => setSelectedService(null)} 
                className="text-slate-text-muted hover:text-slate-text-primary cursor-pointer p-0.5 rounded"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleQuoteSubmit} className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-text-secondary uppercase">CAD Design File Name (STEP, STL, IGES)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. bracket_mount_rev2.step"
                  value={cadFileName}
                  onChange={(e) => setCadFileName(e.target.value)}
                  className="w-full p-3 border border-slate-border rounded-lg bg-slate-bg/30 text-slate-text-primary"
                />
              </div>

              <div className="bg-slate-bg/50 border border-slate-border p-3 rounded-lg text-[10px] text-slate-text-secondary font-semibold leading-relaxed">
                <div className="text-cobalt flex items-center gap-1 mb-1">
                  <Info className="w-3.5 h-3.5" /> Note to Buyer
                </div>
                Your file will be shared directly with the service provider. They will evaluate geometry, recommended materials, and generate a customized price quote offer.
              </div>

              <button
                type="submit"
                disabled={submittingQuote}
                className="w-full btn-cobalt py-3.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {submittingQuote ? 'Sharing CAD file...' : 'Share Design File'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: SELLER SUBMIT OFFER DIALOG
          ========================================== */}
      {quotingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5 animate-slide-in">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[8px] font-black uppercase tracking-wider text-cobalt">Generate Customized Quote</span>
                <h3 className="text-base font-black text-slate-text-primary tracking-tight">RFQ: {quotingItem.cad_file_name}</h3>
              </div>
              <button 
                onClick={() => setQuotingItem(null)} 
                className="text-slate-text-muted hover:text-slate-text-primary cursor-pointer p-0.5 rounded"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleOfferSubmit} className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-text-secondary uppercase">Recommended Material</label>
                <select
                  value={offerMaterial}
                  onChange={(e) => setOfferMaterial(e.target.value)}
                  className="w-full p-3 border border-slate-border rounded-lg bg-white text-slate-text-primary focus:outline-none"
                >
                  {(services.find(s => s.id === quotingItem.service_id)?.material_capabilities || ['Aluminium 6061']).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-text-secondary uppercase">Recommended Surface Finish</label>
                <select
                  value={offerFinish}
                  onChange={(e) => setOfferFinish(e.target.value)}
                  className="w-full p-3 border border-slate-border rounded-lg bg-white text-slate-text-primary focus:outline-none"
                >
                  {(services.find(s => s.id === quotingItem.service_id)?.finish_options || ['As-Machined']).map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-text-secondary uppercase">Quantity (Units)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={offerQuantity}
                  onChange={(e) => setOfferQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full p-3 border border-slate-border rounded-lg bg-slate-bg/30 text-slate-text-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-text-secondary uppercase">Offer Price (Total Amount in ₹)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(Number(e.target.value))}
                  className="w-full p-3 border border-slate-border rounded-lg bg-slate-bg/30 text-slate-text-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-text-secondary uppercase">Seller Audit / Inspection Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain tolerances, toolpath checks, or recommended design revisions..."
                  value={sellerNotes}
                  onChange={(e) => setSellerNotes(e.target.value)}
                  className="w-full p-3 border border-slate-border rounded-lg bg-slate-bg/30 text-slate-text-primary resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submittingOffer}
                className="w-full btn-cobalt py-3.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {submittingOffer ? 'Submitting offer...' : 'Send Custom Quote to Buyer'}
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
