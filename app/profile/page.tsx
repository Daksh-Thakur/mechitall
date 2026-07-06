'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useCart } from '@/components/CartProvider';
import { getProfileOrders, getProfileTransactions, updateProfileName, toggleProfileSellerMode, submitSellerKYC, getSellerDashboardData, Profile, BoltsTransaction } from '@/app/actions/rewards';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  User, ShoppingBag, Gift, Heart, Settings, MapPin, MessageSquare, 
  ArrowLeftRight, ShieldCheck, Cpu, ChevronRight, Download, Plus, 
  Trash2, RefreshCw, ShoppingCart, Clock, CheckCircle2, AlertTriangle, Play,
  Send, Paperclip, FileText, ExternalLink, CircleDollarSign, IndianRupee, LayoutDashboard, ArrowRight
} from 'lucide-react';
import { 
  getOngoingChats, 
  getChatMessages, 
  sendChatMessage, 
  getChatUploadSignedUrl 
} from '@/app/actions/machining-workflow';
import { ChatThread, ChatMessage } from '@/types/machining';
export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile, fetchProfile, showToast, addToCart, wishlist, toggleWishlist } = useCart();

  const [activeTab, setActiveTab] = useState<'orders' | 'rewards' | 'wishlist' | 'settings' | 'address' | 'support' | 'chats' | 'seller_orders' | 'seller_rfqs' | 'seller_capabilities' | 'seller_earnings'>('orders');

  // Switch tabs dynamically when toggling Seller Mode
  useEffect(() => {
    if (profile?.is_seller) {
      setActiveTab('seller_rfqs');
    } else {
      setActiveTab('orders');
    }
  }, [profile?.is_seller]);

  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<BoltsTransaction[]>([]);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  
  // Tracking selected order for detailed progress timeline
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Profile Edit fields
  const [editName, setEditName] = useState('');
  const [isUpdatingName, startTransition] = useTransition();
  const [togglingSeller, setTogglingSeller] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [sellerData, setSellerData] = useState<{
    openRfqs: any[];
    myQuotes: any[];
    activeJobs: any[];
    monthlyEarnings: number;
    earningsVelocity: any[];
    capabilities: any[];
  } | null>(null);
  const [loadingSeller, setLoadingSeller] = useState(false);

  const fetchSellerData = async () => {
    if (!profile) return;
    setLoadingSeller(true);
    try {
      const data = await getSellerDashboardData(profile.id);
      setSellerData(data);
    } catch (err) {
      console.error('Failed to load seller data:', err);
    } finally {
      setLoadingSeller(false);
    }
  };

  useEffect(() => {
    if (profile?.is_seller) {
      fetchSellerData();
    }
  }, [profile?.is_seller, activeTab]);

  const handleToggleSellerMode = async () => {
    if (!profile) return;
    
    const nextState = !profile.is_seller;

    // If turning ON seller mode and KYC is not completed, show the KYC wizard modal
    if (nextState && !profile.seller_kyc_completed) {
      setShowKYCModal(true);
      return;
    }

    setTogglingSeller(true);
    try {
      await toggleProfileSellerMode(profile.id, nextState);
      showToast(nextState ? 'Seller Mode Activated!' : 'Seller Mode Deactivated.', 'success');
      await fetchProfile();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle Seller Mode.', 'error');
    } finally {
      setTogglingSeller(false);
    }
  };

  // Connection timeout checker
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasTimedOut(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Load products from Supabase
  useEffect(() => {
    async function loadProducts() {
      try {
        const { data } = await supabase.from('products').select('*');
        const mapped = (data || []).map((p: any) => ({
          id: p.id,
          partNumber: p.part_number,
          title: p.title,
          category: p.category,
          price: Number(p.price),
          description: p.description,
          gradientClass: p.gradient_class,
          specs: p.specs,
          bulkPricing: p.bulk_pricing || [],
          datasheetUrl: p.datasheet_url,
          cadFile: p.cad_file,
          extendedSpecs: p.extended_specs || {},
        }));
        setDbProducts(mapped);
      } catch (err) {
        console.error('Failed to load products for profile:', err);
      }
    }
    loadProducts();
  }, [supabase]);

  // Authentication check
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast('Please sign in to access your profile.', 'error');
        router.push('/login');
      }
    }
    checkAuth();
  }, [router, showToast, supabase.auth]);

  // Sync edit name state
  useEffect(() => {
    if (profile) {
      setEditName(profile.full_name);
    }
  }, [profile]);

  // Load orders
  useEffect(() => {
    async function loadOrders() {
      if (!profile) return;
      try {
        setLoadingOrders(true);
        const data = await getProfileOrders(profile.id);
        setOrders(data || []);
        if (data && data.length > 0) {
          setSelectedOrder(data[0]); // Select first order for detail tracker
        }
      } catch (err) {
        console.error('Failed to load profile orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    }
    loadOrders();
  }, [profile]);

  // Load rewards transaction log
  useEffect(() => {
    async function loadRewards() {
      if (!profile) return;
      try {
        setLoadingTx(true);
        const data = await getProfileTransactions(profile.id);
        setTransactions(data.transactions || []);
      } catch (err) {
        console.error('Failed to load rewards details:', err);
      } finally {
        setLoadingTx(false);
      }
    }
    loadRewards();
  }, [profile]);

  // Handle edit details submit
  const handleUpdateNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !editName.trim()) return;

    startTransition(async () => {
      try {
        await updateProfileName(profile.id, editName);
        showToast('Account details updated successfully!', 'success');
        await fetchProfile();
      } catch (err: any) {
        showToast(err.message || 'Failed to update settings', 'error');
      }
    });
  };

  const activeShipmentsCount = orders.filter(o => o.status === 'Processing' || o.status === 'Shipped').length;

  if (!profile) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-bg font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
          {hasTimedOut ? (
            <div className="space-y-4 max-w-md bg-white p-8 rounded-2xl border border-slate-border shadow-xl">
              <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto animate-bounce" />
              <h3 className="text-base font-extrabold text-slate-text-primary tracking-tight">Database Sync Timeout</h3>
              <p className="text-xs text-slate-text-muted font-semibold leading-relaxed">
                We are having trouble connecting to your Supabase profiles table. If you have not executed the database migrations yet, please copy the SQL code block from your implementation plan and run it in the Supabase SQL Editor.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="btn-cobalt text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer w-full mt-2"
              >
                Retry Connection
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-cobalt animate-spin" />
              <span className="text-xs font-bold text-slate-text-muted animate-pulse">Syncing user profile...</span>
            </div>
          )}
        </div>
        <Footer />
      </div>
    );
  }

  // Determine loyalty level details
  const isMasterBuilder = profile.loyalty_tier === 'Master Builder';
  const boltsProgressPercent = Math.min(100, (profile.wallet_balance / 500) * 100);

  return (
    <div className="flex flex-col min-h-screen bg-slate-bg font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Nav */}
        {profile.is_seller ? (
          /* Seller Sidebar Nav */
          <aside className="hidden md:flex md:w-3/12 flex-col justify-between bg-[#0B1528] text-white rounded-2xl p-6 shadow-xl h-[600px] shrink-0 border border-slate-700/30">
            <div className="space-y-6">
              {/* Header Seller Hub Card */}
              <div className="pb-4 border-b border-slate-700/50">
                <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00D0F5] animate-pulse"></span>
                  Seller Hub
                </h3>
                <span className="block text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                  Precision Engineering
                </span>
              </div>

              {/* Nav Tabs */}
              <nav className="space-y-1">
                {[
                  { tab: 'seller_orders', label: 'Orders', icon: ShoppingBag },
                  { tab: 'seller_rfqs', label: 'Active RFQs', icon: FileText },
                  { tab: 'seller_capabilities', label: 'Machine Capabilities', icon: Cpu },
                  { tab: 'seller_earnings', label: 'Earnings', icon: IndianRupee },
                ].map(({ tab, label, icon: Icon }) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      activeTab === tab
                        ? 'bg-[#007084] text-white shadow-lg shadow-[#007084]/20 border border-[#0092AB]/30'
                        : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${activeTab === tab ? 'text-[#00D0F5]' : 'text-slate-400'}`} />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>

              {/* Quick Action Button: New Listing */}
              <button 
                onClick={() => showToast('Create Listing service is in demonstration mode.', 'success')}
                className="w-full bg-[#00D0F5] hover:bg-[#00B9DB] text-slate-900 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-[#00D0F5]/10 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
              >
                <Plus className="w-4 h-4 shrink-0 stroke-[3]" />
                <span>New Listing</span>
              </button>
            </div>

            {/* Exit/Deactivate Seller Mode */}
            <div className="pt-4 border-t border-slate-700/50">
              <button
                disabled={togglingSeller}
                onClick={handleToggleSellerMode}
                className="w-full py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition-all"
              >
                <ArrowLeftRight className="w-4 h-4 shrink-0" />
                <span>Switch to Customer Mode</span>
              </button>
            </div>
          </aside>
        ) : (
          /* Sidebar Nav */
          <aside className="md:w-3/12 flex flex-col justify-between bg-white border border-slate-border rounded-2xl p-6 shadow-sm h-fit">
            <div className="space-y-6">
              {/* Header User Card */}
              <div className="text-center space-y-3 pb-6 border-b border-slate-border">
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-cobalt/10 border-2 border-cobalt text-cobalt font-black text-xl shadow-md">
                  {profile.full_name[0] + (profile.full_name.split(' ').pop() || 'U')[0]}
                  {profile.is_verified_buyer && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald text-white flex items-center justify-center border border-white shadow-sm" title="Verified Buyer">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-text-primary tracking-tight truncate">Hello, {profile.full_name.split(' ')[0]}</h3>
                  <div className="flex flex-col items-center gap-1 mt-1.5">
                    <span className="inline-block text-[9px] uppercase tracking-wider font-extrabold bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      {profile.loyalty_tier}
                    </span>
                    {profile.is_verified_buyer && (
                      <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold bg-emerald/10 text-emerald border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                        <ShieldCheck className="w-2.5 h-2.5" /> Verified Buyer
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Nav Tabs */}
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'orders'
                      ? 'bg-slate-text-primary text-white shadow-md'
                      : 'text-slate-text-secondary hover:bg-slate-bg hover:text-slate-text-primary'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>My Orders</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('rewards')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'rewards'
                      ? 'bg-slate-text-primary text-white shadow-md'
                      : 'text-slate-text-secondary hover:bg-slate-bg hover:text-slate-text-primary'
                  }`}
                >
                  <Gift className="w-4 h-4 shrink-0" />
                  <span>Rewards & Offers</span>
                </button>

                <button
                  onClick={() => setActiveTab('wishlist')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'wishlist'
                      ? 'bg-slate-text-primary text-white shadow-md'
                      : 'text-slate-text-secondary hover:bg-slate-bg hover:text-slate-text-primary'
                  }`}
                >
                  <Heart className="w-4 h-4 shrink-0" />
                  <span>Wishlist</span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-slate-text-primary text-white shadow-md'
                      : 'text-slate-text-secondary hover:bg-slate-bg hover:text-slate-text-primary'
                  }`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>Account Settings</span>
                </button>

                <button
                  onClick={() => setActiveTab('address')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'address'
                      ? 'bg-slate-text-primary text-white shadow-md'
                      : 'text-slate-text-secondary hover:bg-slate-bg hover:text-slate-text-primary'
                  }`}
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>Address Book</span>
                </button>

                <button
                  onClick={() => setActiveTab('support')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'support'
                      ? 'bg-slate-text-primary text-white shadow-md'
                      : 'text-slate-text-secondary hover:bg-slate-bg hover:text-slate-text-primary'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>Customer Support</span>
                </button>

                <button
                  onClick={() => setActiveTab('chats')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'chats'
                      ? 'bg-slate-text-primary text-white shadow-md'
                      : 'text-slate-text-secondary hover:bg-slate-bg hover:text-slate-text-primary'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>Quotation Chats</span>
                </button>
              </nav>
            </div>

            {/* Switch/Activate Seller Mode */}
            <div className="pt-6 border-t border-slate-border mt-8 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-text-secondary">
                <span>Seller Account</span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                  profile.seller_kyc_completed 
                    ? 'bg-emerald-500/10 text-emerald border border-emerald-500/20' 
                    : 'bg-slate-bg text-slate-text-muted border'
                }`}>
                  {profile.seller_kyc_completed ? 'Active' : 'Inactive'}
                </span>
              </div>
              <button
                disabled={togglingSeller}
                onClick={handleToggleSellerMode}
                className={`w-full transition-all py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer ${
                  profile.is_seller
                    ? 'border border-rose-200 text-rose-500 hover:bg-rose-50'
                    : 'border border-slate-border text-slate-text-secondary hover:text-slate-text-primary hover:border-slate-text-primary bg-slate-bg/30'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4 shrink-0" />
                <span>
                  {profile.is_seller 
                    ? 'Deactivate Seller Mode' 
                    : profile.seller_kyc_completed 
                    ? 'Switch to Seller Mode' 
                    : 'Activate Seller Mode'}
                </span>
              </button>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <section className="md:w-9/12 space-y-6">
          {/* ======================================================== */}
          {/* SELLER HUB TAB: ACTIVE RFQS FOR REVIEW */}
          {profile.is_seller && activeTab === 'seller_rfqs' && (
            <div className="space-y-6 pb-20 md:pb-0">
              
              {/* Stats Cards Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'ACTIVE RFQS', value: sellerData ? String(sellerData.openRfqs.length) : '0', icon: FileText, color: 'text-sky-500 bg-sky-50 border-sky-100', isDark: false },
                  { label: 'PENDING QUOTES', value: sellerData ? String(sellerData.myQuotes.filter(q => q.status === 'SUBMITTED').length) : '0', icon: FileText, color: 'text-teal-500 bg-teal-50 border-teal-100', isDark: false },
                  { label: 'PRODUCTION QUEUE', value: sellerData ? String(sellerData.activeJobs.length) : '0', icon: Cpu, color: 'text-indigo-500 bg-indigo-50 border-indigo-100', isDark: false },
                  { label: 'MONTHLY EARNINGS', value: sellerData ? `₹${(sellerData.monthlyEarnings / 100000).toFixed(1)}L` : '₹0.0L', icon: IndianRupee, color: 'text-[#00D0F5] bg-[#007084]/20 border-[#0092AB]/30', isDark: true },
                ].map((stat, idx) => {
                  const StatIcon = stat.icon;
                  return (
                    <div 
                      key={idx} 
                      className={`border rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all ${
                        stat.isDark 
                          ? 'bg-[#0B1528] border-slate-850 text-white' 
                          : 'bg-white border-slate-border text-slate-text-primary'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className={`block text-[8px] font-black uppercase tracking-wider ${stat.isDark ? 'text-slate-400' : 'text-slate-text-muted'}`}>{stat.label}</span>
                        <span className="block text-xl font-black leading-tight">{stat.value}</span>
                      </div>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${stat.color} shrink-0`}>
                        <StatIcon className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grid Layout for Main Content & Sidebar */}
              <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Left Column (8/12) */}
                <div className="lg:w-8/12 space-y-6">
                  
                  {/* ACTIVE RFQS FOR REVIEW */}
                  <div className="bg-white border border-slate-border rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-border">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#007084]" />
                        <h4 className="text-sm font-black text-slate-text-primary uppercase tracking-tight">Active RFQs for Review</h4>
                      </div>
                      <Link href="/machining" className="text-xs font-bold text-[#007084] hover:underline">
                        View All Requests
                      </Link>
                    </div>

                    <div className="flex gap-4 overflow-x-auto md:grid md:grid-cols-2 md:overflow-x-visible no-scrollbar pb-3 md:pb-0 snap-x snap-mandatory">
                      {loadingSeller ? (
                        <div className="w-full py-8 text-center animate-pulse">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-text-muted/30" />
                        </div>
                      ) : !sellerData || sellerData.openRfqs.length === 0 ? (
                        <div className="w-full text-center py-8 text-xs font-bold text-slate-text-muted">
                          No active RFQs for review at the moment.
                        </div>
                      ) : (
                        sellerData.openRfqs.map((rfq, idx) => (
                          <div 
                            key={rfq.id} 
                            className="snap-center shrink-0 w-[270px] md:w-auto border border-slate-border/70 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-border transition-colors bg-white shadow-sm space-y-4"
                          >
                            <div className="space-y-3">
                              {/* Header Badge & Code */}
                              <div className="flex justify-between items-center text-[9px] font-black tracking-wider uppercase">
                                <span className={`px-2 py-0.5 rounded ${
                                  idx === 0 
                                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                                    : 'bg-slate-100 text-slate-600 border'
                                }`}>
                                  {idx === 0 ? 'HIGH PRIORITY' : 'STANDARD'}
                                </span>
                                <span className="text-slate-400 font-mono">#RFQ-{rfq.id.slice(0, 4).toUpperCase()}</span>
                              </div>

                              {/* Title */}
                              <h5 className="text-xs font-black text-slate-text-primary line-clamp-1 leading-snug">{rfq.title}</h5>

                              {/* Specs Grid */}
                              <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-border/30 py-3.5">
                                <div>
                                  <span className="block text-[8px] font-black uppercase text-slate-400">Material</span>
                                  <span className="text-[10px] font-black text-slate-text-secondary truncate block">{rfq.material_preference || 'Ti-6Al-4V'}</span>
                                </div>
                                <div>
                                  <span className="block text-[8px] font-black uppercase text-slate-400">Quantity</span>
                                  <span className="text-[10px] font-black text-slate-text-secondary truncate block">{rfq.quantity} Units</span>
                                </div>
                              </div>
                            </div>

                            {/* Submit Button */}
                            <button 
                              onClick={() => router.push('/machining')}
                              className="w-full py-2.5 rounded-xl bg-[#0B1528] hover:bg-slate-900 text-white text-[10px] font-extrabold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                            >
                              <span>SUBMIT QUOTE</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* PRODUCTION PIPELINE */}
                  <div className="bg-white border border-slate-border rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-border">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-[#007084]" />
                        <h4 className="text-sm font-black text-slate-text-primary uppercase tracking-tight">Production Pipeline</h4>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald rounded border border-emerald-500/20">
                        {sellerData ? sellerData.activeJobs.length : '0'} Active Jobs
                      </span>
                    </div>

                    <div className="space-y-3">
                      {loadingSeller ? (
                        <div className="py-8 text-center animate-pulse">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-text-muted/30" />
                        </div>
                      ) : !sellerData || sellerData.activeJobs.length === 0 ? (
                        <div className="text-center py-8 text-xs font-bold text-slate-text-muted">
                          No active production jobs in the pipeline.
                        </div>
                      ) : (
                        sellerData.activeJobs.map((job, idx) => {
                          const isQC = idx === 1 || job.rfq?.title.toLowerCase().includes('assembly');
                          const progress = isQC ? 80 : 50;
                          return (
                            <div key={job.id} className="bg-white border border-slate-border/70 rounded-2xl p-4 space-y-4 hover:border-slate-border transition-colors shadow-sm">
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <span className="block text-[8px] font-black text-slate-400 font-mono">PROJ-{job.id.slice(0, 4).toUpperCase()}</span>
                                  <h5 className="text-xs font-black text-slate-text-primary mt-0.5">{job.rfq?.title || 'Custom Machining Job'}</h5>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                                  isQC 
                                    ? 'bg-emerald-500/10 text-emerald border-emerald-500/20' 
                                    : 'bg-sky-500/10 text-sky-600 border-sky-500/20'
                                }`}>
                                  {isQC ? 'QUALITY CHECK' : 'IN MACHINING'}
                                </span>
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 tracking-wider">
                                  <span>Progress</span>
                                  <span className="font-mono font-black text-[9px] text-slate-text-secondary">{progress}%</span>
                                </div>
                                <div className="w-full bg-slate-bg border border-slate-border/50 h-2 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all ${isQC ? 'bg-[#00D0F5]' : 'bg-sky-500'}`}
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* DISPATCHED ORDERS */}
                  <div className="bg-white border border-slate-border rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-border">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-[#007084]" />
                        <h4 className="text-sm font-black text-slate-text-primary uppercase tracking-tight">Dispatched Orders</h4>
                      </div>
                      <button onClick={() => showToast('Opening shipment manager...', 'success')} className="text-xs font-bold text-[#007084] hover:underline cursor-pointer">
                        Track All Shipments
                      </button>
                    </div>

                    <div className="overflow-x-auto no-scrollbar">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-slate-border/50 text-[8px] uppercase tracking-wider font-black text-slate-400">
                            <th className="pb-2.5">Order ID</th>
                            <th className="pb-2.5 px-3">Carrier</th>
                            <th className="pb-2.5 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-border/30">
                          {loadingSeller ? (
                            <tr>
                              <td colSpan={3} className="py-8 text-center animate-pulse">
                                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-text-muted/30" />
                              </td>
                            </tr>
                          ) : !sellerData || sellerData.activeJobs.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="py-8 text-center text-xs font-bold text-slate-text-muted">
                                No recently dispatched shipments.
                              </td>
                            </tr>
                          ) : (
                            sellerData.activeJobs.map((job, idx) => {
                              const isDelivered = idx === 1;
                              return (
                                <tr key={job.id} className="text-xs">
                                  <td className="py-3 font-mono font-black text-slate-text-primary">
                                    #ORD-{job.id.slice(0, 3).toUpperCase()}
                                  </td>
                                  <td className="py-3 px-3 font-bold text-slate-text-secondary">
                                    {idx === 0 ? 'BlueDart' : 'FedEx'}
                                  </td>
                                  <td className="py-3 text-right">
                                    <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase ${
                                      isDelivered ? 'text-emerald' : 'text-sky-600'
                                    }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${isDelivered ? 'bg-emerald' : 'bg-sky-500 animate-pulse'}`}></span>
                                      {isDelivered ? 'Delivered' : 'In Transit'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                {/* Right Column (4/12) */}
                <div className="lg:w-4/12 space-y-6">
                  
                  {/* EARNINGS VELOCITY */}
                  <div className="bg-white border border-slate-border rounded-2xl p-5 shadow-sm space-y-5">
                    <div className="pb-3 border-b border-slate-border">
                      <h4 className="text-xs font-black text-slate-text-muted uppercase tracking-wider">Earnings Velocity</h4>
                    </div>

                    {/* Visual Bar Chart */}
                    <div className="space-y-4">
                      <div className="flex items-end justify-between h-36 px-2">
                        {(() => {
                          const velocity = sellerData?.earningsVelocity || [
                            { label: 'Wk 1', amount: 0 },
                            { label: 'Wk 2', amount: 0 },
                            { label: 'Wk 3', amount: 0 },
                            { label: 'Wk 4', amount: 0 },
                            { label: 'This Wk', amount: 0 },
                          ];
                          const maxAmount = Math.max(...velocity.map(v => v.amount), 10000);
                          
                          return velocity.map((bar, idx) => {
                            // Scale height relative to maxAmount (max 100px)
                            const height = Math.max(Math.round((bar.amount / maxAmount) * 100), bar.amount > 0 ? 8 : 4);
                            const isActive = idx === 4;

                            return (
                              <div key={idx} className="flex flex-col items-center gap-2 group relative">
                                <span className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-zinc-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md transition-opacity whitespace-nowrap pointer-events-none z-10">
                                  ₹{Number(bar.amount).toLocaleString('en-IN')}
                                </span>
                                <div 
                                  className={`w-7 rounded-t-lg transition-all duration-300 ${
                                    isActive 
                                      ? 'bg-[#00D0F5] shadow-lg shadow-[#00D0F5]/20 hover:brightness-105' 
                                      : 'bg-[#F1F5F9] border border-slate-200 hover:border-slate-400'
                                  }`}
                                  style={{ height: `${height}px` }}
                                ></div>
                                <span className={`text-[9px] font-black uppercase tracking-wider ${isActive ? 'text-[#007084]' : 'text-slate-text-muted'}`}>
                                  {bar.label}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>

                      <div className="border-t border-slate-border pt-3.5 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-text-muted">Projected Month End</span>
                        <span className="font-black text-slate-text-primary text-sm">
                          {sellerData ? `₹${((sellerData.monthlyEarnings * 1.2) / 100000).toFixed(1)}L` : '₹0.0L'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* EFFICIENCY INDEX */}
                  <div className="bg-[#0B1528] text-white border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                    <div className="space-y-1">
                      <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Efficiency Index</span>
                      <p className="text-[10px] text-slate-300 font-bold leading-relaxed">
                        Your workshop's precision rating is up 12% this week.
                      </p>
                    </div>
                    <div className="flex items-baseline gap-2 pt-2">
                      <span className="text-3xl font-mono font-black text-white">98.4</span>
                      <span className="flex items-center gap-0.5 text-[10px] font-black text-[#00D0F5]">
                        <span>▲</span>
                        <span>0.4%</span>
                      </span>
                    </div>
                  </div>

                  {/* ISO 9001:2015 Certification */}
                  <div className="bg-white border border-slate-border rounded-2xl p-5 shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-[#007084] flex items-center justify-center shrink-0 shadow-sm">
                      <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-slate-text-primary">ISO 9001:2015 Compliance</h4>
                      <p className="text-[10px] text-slate-text-muted font-bold leading-normal">
                        Certified Operations since 2021. Complies with global precision aerospace &amp; industrial machining guidelines.
                      </p>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* OTHER SELLER HUB TABS */}
          {profile.is_seller && activeTab === 'seller_orders' && (
            <div className="bg-white border border-slate-border rounded-2xl p-6 shadow-sm text-center py-20 space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-text-muted/30 mx-auto" />
              <h4 className="text-sm font-black text-slate-text-primary">Seller Orders Manager</h4>
              <p className="text-xs text-slate-text-muted max-w-sm mx-auto font-medium">
                View, track, and complete purchase orders submitted for custom fabrication jobs or catalog parts.
              </p>
            </div>
          )}

          {profile.is_seller && activeTab === 'seller_capabilities' && (
            <div className="bg-white border border-slate-border rounded-2xl p-6 shadow-sm text-center py-20 space-y-3">
              <Cpu className="w-12 h-12 text-slate-text-muted/30 mx-auto" />
              <h4 className="text-sm font-black text-slate-text-primary">Machine Capabilities Registry</h4>
              <p className="text-xs text-slate-text-muted max-w-sm mx-auto font-medium">
                Edit machine tolerances, list raw materials, and update CNC envelope dimensions.
              </p>
            </div>
          )}

          {profile.is_seller && activeTab === 'seller_earnings' && (
            <div className="bg-white border border-slate-border rounded-2xl p-6 shadow-sm text-center py-20 space-y-3">
              <IndianRupee className="w-12 h-12 text-slate-text-muted/30 mx-auto" />
              <h4 className="text-sm font-black text-slate-text-primary">Seller Earnings Dashboard</h4>
              <p className="text-xs text-slate-text-muted max-w-sm mx-auto font-medium">
                Track payments, view billing statements, and check linked corporate bank account statuses.
              </p>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              
              {/* Profile Overview Banner */}
              <div className="bg-white border border-slate-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6 justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cobalt/20 to-cobalt/5 border border-cobalt/25 flex items-center justify-center font-extrabold text-cobalt">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-slate-text-primary leading-none">{profile.full_name}</h2>
                      <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald rounded border border-emerald-500/20">
                        Verified Customer
                      </span>
                    </div>
                    <span className="block text-[11px] text-slate-text-muted font-bold font-mono mt-1.5">{profile.email || 'guest@mechitall.io'}</span>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="flex items-center gap-8 text-center">
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-slate-text-muted font-bold">Total Orders</span>
                    <span className="text-xl font-mono font-black text-slate-text-primary">{orders.length}</span>
                  </div>
                  <div className="border-l border-slate-border h-8"></div>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-slate-text-muted font-bold">Active Shipments</span>
                    <span className="text-xl font-mono font-black text-cobalt">{activeShipmentsCount}</span>
                  </div>
                  <div className="border-l border-slate-border h-8"></div>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-slate-text-muted font-bold">Wishlist Items</span>
                    <span className="text-xl font-mono font-black text-slate-text-primary">3</span>
                  </div>
                </div>
              </div>

              {/* Loyalty Vault Card */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 shadow-xl relative overflow-hidden text-zinc-100 flex flex-col md:flex-row justify-between gap-6">
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1.4px)] [background-size:16px_16px] opacity-15 pointer-events-none"></div>
                
                <div className="space-y-4 z-10 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/35 flex items-center justify-center text-amber-500">
                      <Gift className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black tracking-tight text-zinc-100">LOYALTY VAULT</h3>
                      <span className="block text-[10px] text-zinc-400 font-bold">Nuts &amp; Bolts Reward Program</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Current Balance</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-mono font-black text-amber-500">{profile.wallet_balance}</span>
                      <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">BOLTS</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar + Action */}
                <div className="z-10 md:w-5/12 flex flex-col justify-between text-xs space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold text-[10px] uppercase text-zinc-400">
                      <span>Redemption Limit</span>
                      <span>100 Bolts / Order</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden border border-zinc-700/50">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${boltsProgressPercent}%` }}></div>
                    </div>
                    <span className="block text-[9px] text-zinc-500 font-bold">
                      *10 Bolts = ₹1.00 store credit. 45-day window applies.
                    </span>
                  </div>

                  <button 
                    onClick={() => {
                      showToast('Bolt balance applied automatically in the Cart drawer!', 'success');
                    }}
                    className="btn-cobalt text-xs font-bold py-2.5 rounded-lg text-center cursor-pointer shadow-lg w-full"
                  >
                    Redeem Now
                  </button>
                </div>
              </div>

              {/* Recent Purchases List */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-text-primary tracking-tight uppercase">Recent Purchases</h3>
                  <span className="text-xs font-bold text-slate-text-muted">Total orders: {orders.length}</span>
                </div>

                {loadingOrders ? (
                  <div className="py-16 text-center bg-white border border-slate-border rounded-2xl animate-pulse">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-text-muted/30" />
                  </div>
                ) : orders.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {orders.slice(0, 3).map((ord) => {
                      const isSelected = selectedOrder?.id === ord.id;
                      return (
                        <div 
                          key={ord.id} 
                          onClick={() => setSelectedOrder(ord)}
                          className={`bg-white border rounded-xl p-4 shadow-sm space-y-3 cursor-pointer transition-all ${
                            isSelected ? 'border-cobalt ring-2 ring-cobalt/25' : 'border-slate-border hover:border-slate-text-secondary/20'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-mono text-[10px] font-black text-slate-text-primary">{ord.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                              ord.status === 'Delivered' || ord.status === 'Completed'
                                ? 'bg-emerald-500/10 text-emerald border-emerald-500/20'
                                : ord.status === 'Shipped'
                                ? 'bg-blue-500/10 text-cobalt border-blue-500/20'
                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            }`}>
                              {ord.status}
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-slate-text-secondary text-xs">
                            <div className="flex justify-between">
                              <span className="text-[10px] text-slate-text-muted">Items Count</span>
                              <span className="font-bold text-slate-text-primary">{ord.items_count} units</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[10px] text-slate-text-muted">Order Total</span>
                              <span className="font-extrabold text-coral">₹{Number(ord.total_amount).toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="w-full bg-slate-bg h-1.5 rounded-full overflow-hidden border border-slate-border/50">
                            <div className={`h-full rounded-full ${
                              ord.status === 'Delivered' || ord.status === 'Completed'
                                ? 'bg-emerald w-full'
                                : ord.status === 'Shipped'
                                ? 'bg-cobalt w-2/3'
                                : 'bg-amber-500 w-1/3'
                            }`}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-slate-border bg-white rounded-2xl">
                    <ShoppingBag className="w-10 h-10 text-slate-text-muted/30 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-text-primary">No purchases placed yet.</p>
                    <p className="text-[10px] text-slate-text-muted mt-1">Configure parts or checkout catalog items to list purchases here.</p>
                  </div>
                )}
              </div>

              {/* Saved For Later (Wishlist) Carousel */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-text-primary tracking-tight uppercase">Saved for Later</h3>
                  <button onClick={() => setActiveTab('wishlist')} className="text-xs font-bold text-cobalt hover:opacity-80 transition-opacity">
                    Manage Wishlist
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {dbProducts.filter(p => wishlist.includes(p.id)).length > 0 ? (
                    dbProducts.filter(p => wishlist.includes(p.id)).map((item) => (
                      <div key={item.id} className="bg-white border border-slate-border rounded-xl p-4 shadow-sm flex flex-col justify-between h-48 hover:shadow-md transition-shadow relative">
                        <button
                          onClick={() => toggleWishlist(item.id)}
                          className="absolute top-2 right-2 p-1 text-slate-text-muted hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="space-y-1">
                          <span className="block text-[8px] uppercase tracking-wider font-extrabold text-slate-text-muted">{item.category}</span>
                          <h4 className="text-xs font-black text-slate-text-primary line-clamp-1 leading-tight">{item.title}</h4>
                          <span className="block text-xs font-extrabold text-coral pt-1">₹{item.price.toFixed(2)}</span>
                        </div>

                        <button
                          onClick={() => {
                            addToCart(item, 1);
                            showToast(`${item.title} added to cart!`, 'success');
                          }}
                          className="btn-cobalt py-2 rounded-lg text-[10px] font-bold w-full text-center cursor-pointer flex items-center justify-center gap-1"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                        </button>
                      </div>
                    ))
                  ) : (
                    dbProducts.slice(0, 3).map((item) => (
                      <div key={item.id} className="bg-white border border-slate-border rounded-xl p-4 shadow-sm flex flex-col justify-between h-48 hover:shadow-md transition-shadow">
                        <div className="space-y-1">
                          <span className="block text-[8px] uppercase tracking-wider font-extrabold text-slate-text-muted">{item.category}</span>
                          <h4 className="text-xs font-black text-slate-text-primary line-clamp-1 leading-tight">{item.title}</h4>
                          <span className="block text-xs font-extrabold text-coral pt-1">₹{item.price.toFixed(2)}</span>
                        </div>

                        <button
                          onClick={() => {
                            addToCart(item, 1);
                            showToast(`${item.title} added to cart!`, 'success');
                          }}
                          className="btn-cobalt py-2 rounded-lg text-[10px] font-bold w-full text-center cursor-pointer flex items-center justify-center gap-1"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                        </button>
                      </div>
                    ))
                  )}

                  <Link href="/products" className="bg-slate-bg/30 border border-dashed border-slate-border rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-slate-bg/50 transition-colors h-48 group">
                    <Plus className="w-6 h-6 text-slate-text-muted group-hover:scale-110 transition-transform mb-2" />
                    <span className="text-xs font-extrabold text-slate-text-primary leading-tight">Continue Shopping</span>
                    <span className="text-[9px] text-slate-text-muted leading-tight mt-0.5">Browse latest arrivals</span>
                  </Link>
                </div>
              </div>

              {/* Shipment Tracking details progress timeline */}
              {selectedOrder && (
                <div className="bg-white border border-slate-border rounded-2xl p-6 shadow-sm space-y-5">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-border/50">
                    <span className="text-xs font-black text-slate-text-primary uppercase tracking-tight flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-cobalt">
                        <rect x="1" y="3" width="15" height="13" />
                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                        <circle cx="5.5" cy="18.5" r="2.5" />
                        <circle cx="18.5" cy="18.5" r="2.5" />
                      </svg>
                      Shipment Tracking: <span className="font-mono">{selectedOrder.id}</span>
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest bg-blue-500/10 text-cobalt border border-blue-500/20`}>
                      {selectedOrder.status === 'Completed' ? 'DELIVERED' : selectedOrder.status === 'Delivered' ? 'OUT FOR DELIVERY' : 'IN PROCESSING'}
                    </span>
                  </div>

                  {/* Horizontal visual progress meter */}
                  <div className="relative pt-6 pb-2">
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-bg -translate-y-1/2 rounded-full overflow-hidden border border-slate-border/50">
                      <div className={`h-full rounded-full bg-cobalt transition-all duration-500 ${
                        selectedOrder.status === 'Completed'
                          ? 'w-full'
                          : selectedOrder.status === 'Delivered'
                          ? 'w-3/4'
                          : selectedOrder.status === 'Shipped'
                          ? 'w-1/2'
                          : 'w-1/4'
                      }`}></div>
                    </div>

                    <div className="relative flex justify-between text-center text-[10px] font-bold text-slate-text-secondary z-10">
                      <div className="space-y-1">
                        <div className="w-6 h-6 rounded-full bg-cobalt text-white flex items-center justify-center mx-auto border-2 border-white shadow-md">✓</div>
                        <span className="block font-bold">Order Placed</span>
                        <span className="block text-[8px] text-slate-text-muted">Oct 24, 09:00</span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto border-2 border-white shadow-md ${
                          selectedOrder.status !== 'Processing' && selectedOrder.status !== 'idle'
                            ? 'bg-cobalt text-white'
                            : 'bg-white text-slate-text-muted border-slate-border'
                        }`}>
                          {selectedOrder.status === 'Processing' ? '●' : '✓'}
                        </div>
                        <span className="block font-bold">Processing</span>
                        <span className="block text-[8px] text-slate-text-muted">Oct 24, 14:30</span>
                      </div>

                      <div className="space-y-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto border-2 border-white shadow-md ${
                          selectedOrder.status === 'Shipped' || selectedOrder.status === 'Delivered' || selectedOrder.status === 'Completed'
                            ? 'bg-cobalt text-white'
                            : 'bg-white text-slate-text-muted border-slate-border'
                        }`}>
                          {selectedOrder.status === 'Shipped' ? '●' : selectedOrder.status === 'Delivered' || selectedOrder.status === 'Completed' ? '✓' : '3'}
                        </div>
                        <span className="block font-bold">Shipped</span>
                        <span className="block text-[8px] text-slate-text-muted">Oct 25, 08:00</span>
                      </div>

                      <div className="space-y-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto border-2 border-white shadow-md ${
                          selectedOrder.status === 'Delivered' || selectedOrder.status === 'Completed'
                            ? 'bg-cobalt text-white'
                            : 'bg-white text-slate-text-muted border-slate-border'
                        }`}>
                          {selectedOrder.status === 'Delivered' ? '●' : selectedOrder.status === 'Completed' ? '✓' : '4'}
                        </div>
                        <span className="block font-bold">Out for Delivery</span>
                        <span className="block text-[8px] text-slate-text-muted">At 11:35 AM</span>
                      </div>

                      <div className="space-y-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto border-2 border-white shadow-md ${
                          selectedOrder.status === 'Completed'
                            ? 'bg-emerald text-white'
                            : 'bg-white text-slate-text-muted border-slate-border'
                        }`}>
                          {selectedOrder.status === 'Completed' ? '✓' : '5'}
                        </div>
                        <span className="block font-bold">Delivered</span>
                        <span className="block text-[8px] text-slate-text-muted">Pending</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REWARDS & OFFERS */}
          {activeTab === 'rewards' && (
            <div className="bg-white border border-slate-border rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-black text-slate-text-primary tracking-tight uppercase">Loyalty Ledger</h2>
                <p className="text-xs text-slate-text-muted leading-relaxed font-semibold">
                  Detailed ledger history logs of your earned and spent Nuts &amp; Bolts loyalty tokens.
                </p>
              </div>

              {loadingTx ? (
                <div className="py-12 text-center animate-pulse">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-text-muted/30" />
                </div>
              ) : transactions.length > 0 ? (
                <div className="border border-slate-border rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs font-bold border-collapse">
                    <thead>
                      <tr className="bg-slate-bg border-b border-slate-border text-[10px] uppercase text-slate-text-muted tracking-wider">
                        <th className="p-3">Transaction details</th>
                        <th className="p-3">Reference Order</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Expirations</th>
                        <th className="p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-border/50 text-slate-text-secondary">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-bg/30">
                          <td className="p-3 font-bold text-slate-text-primary">{tx.description}</td>
                          <td className="p-3 font-mono text-[10px]">{tx.order_id || '—'}</td>
                          <td className="p-3">
                            <span className={tx.amount > 0 ? "text-emerald" : "text-rose-500"}>
                              {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Bolts
                            </span>
                          </td>
                          <td className="p-3 font-medium text-slate-text-muted text-[10px]">
                            {tx.expires_at ? new Date(tx.expires_at).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="p-3 font-medium text-[10px]">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-slate-border rounded-2xl bg-slate-bg/20">
                  <Gift className="w-8 h-8 text-slate-text-muted/30 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-text-primary">No rewards logs listed.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="bg-white border border-slate-border rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-black text-slate-text-primary tracking-tight uppercase">My Wishlist</h2>
                <p className="text-xs text-slate-text-muted leading-relaxed font-semibold">
                  Items you saved for later purchase or comparison checks.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dbProducts.filter(p => wishlist.includes(p.id)).length > 0 ? (
                  dbProducts.filter(p => wishlist.includes(p.id)).map((item) => (
                    <div key={item.id} className="bg-white border border-slate-border rounded-xl p-5 shadow-sm flex flex-col justify-between relative group hover:shadow-md transition-shadow">
                      <button 
                        onClick={() => toggleWishlist(item.id)}
                        className="absolute top-3 right-3 p-1 rounded hover:bg-rose-50 text-slate-text-muted hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="space-y-2">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border bg-slate-bg text-slate-text-muted w-fit block">{item.category}</span>
                        <h3 className="text-sm font-black text-slate-text-primary leading-tight line-clamp-1">{item.title}</h3>
                        <p className="text-xs text-slate-text-muted line-clamp-2">{item.description}</p>
                      </div>

                      <div className="pt-4 border-t border-slate-border/50 mt-4 flex items-center justify-between">
                        <span className="text-sm font-black text-coral">₹{item.price.toFixed(2)}</span>
                        <button
                          onClick={() => {
                            addToCart(item, 1);
                            showToast(`${item.title} added to cart!`, 'success');
                          }}
                          className="btn-cobalt py-2 px-3 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" /> Add
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-16 border border-dashed border-slate-border rounded-2xl bg-slate-bg/10">
                    <Heart className="w-10 h-10 text-slate-text-muted/30 mx-auto mb-2 animate-pulse" />
                    <p className="text-xs font-bold text-slate-text-primary">Your wishlist is empty.</p>
                    <p className="text-[10px] text-slate-text-muted mt-1 leading-normal">
                      Tap the heart icon on any product in the Parts Catalog to save items here!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ACCOUNT SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white border border-slate-border rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-black text-slate-text-primary tracking-tight uppercase">Account Settings</h2>
                <p className="text-xs text-slate-text-muted leading-relaxed font-semibold">
                  Update your contact details and edit your shopper account parameters.
                </p>
              </div>

              <form onSubmit={handleUpdateNameSubmit} className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-text-secondary uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profile.email || 'guest@mechitall.io'}
                    className="w-full text-xs font-bold p-3 border border-slate-border rounded-lg bg-slate-bg/50 text-slate-text-muted focus:outline-none cursor-not-allowed"
                  />
                  <span className="block text-[9px] text-slate-text-muted font-bold">Email address updates require secondary authorization.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-text-secondary uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={isUpdatingName}
                    placeholder="Elias Thorne"
                    className="w-full text-xs font-bold p-3 border border-slate-border rounded-lg bg-slate-bg/30 text-slate-text-primary focus:outline-none focus:border-cobalt transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingName}
                  className="btn-cobalt py-3 px-6 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingName ? 'Saving Changes...' : 'Save Settings'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: ADDRESS BOOK */}
          {activeTab === 'address' && (
            <div className="bg-white border border-slate-border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-black text-slate-text-primary tracking-tight uppercase">Address Book</h2>
                  <p className="text-xs text-slate-text-muted leading-relaxed font-semibold">
                    Manage your delivery locations and billing addresses.
                  </p>
                </div>
                <button 
                  onClick={() => showToast('New addresses can be saved at checkout.', 'success')}
                  className="btn-cobalt text-xs font-bold px-3 py-2 rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Address
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-border rounded-xl p-4 space-y-3 relative">
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[8px] font-black uppercase bg-slate-bg text-slate-text-muted border">Default</span>
                  <div className="space-y-1">
                    <span className="block text-xs font-black text-slate-text-primary">Elias Thorne</span>
                    <span className="block text-[11px] text-slate-text-secondary font-semibold">
                      12, Industrial Development Block C<br />
                      Peenya Phase 1, Bangalore<br />
                      Karnataka - 560058, India
                    </span>
                    <span className="block text-[10px] text-slate-text-muted font-bold font-mono pt-1">Phone: +91 98450 12345</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CUSTOMER SUPPORT */}
          {activeTab === 'support' && (
            <div className="bg-white border border-slate-border rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-black text-slate-text-primary tracking-tight uppercase">Customer Support</h2>
                <p className="text-xs text-slate-text-muted leading-relaxed font-semibold">
                  Get support for customized orders, CAD checks, or rewards settlements.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex gap-3 p-4 bg-slate-bg border border-slate-border rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-cobalt/10 text-cobalt flex items-center justify-center shrink-0">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-text-primary">Direct Ticket Desk</h4>
                      <p className="text-[10px] text-slate-text-muted mt-0.5 font-semibold">Raise tickets for manual engineering inspection or billing audits.</p>
                      <button onClick={() => showToast('Chat channels will open in a separate drawer.', 'success')} className="mt-2 text-[10px] font-extrabold text-cobalt hover:opacity-80 transition-opacity">Start chat session →</button>
                    </div>
                  </div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); showToast('Support ticket raised successfully.', 'success'); }} className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-text-secondary uppercase">Subject</label>
                    <input type="text" placeholder="e.g. NEMA 23 CAD model dimensions" className="w-full text-xs font-bold p-3 border border-slate-border rounded-lg bg-slate-bg/30 text-slate-text-primary focus:outline-none focus:border-cobalt" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-text-secondary uppercase">Message details</label>
                    <textarea rows={3} placeholder="Please specify your request details..." className="w-full text-xs font-bold p-3 border border-slate-border rounded-lg bg-slate-bg/30 text-slate-text-primary focus:outline-none focus:border-cobalt resize-none"></textarea>
                  </div>
                  <button type="submit" className="w-full btn-cobalt py-3 rounded-lg text-xs font-bold cursor-pointer">Submit Ticket</button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 7: QUOTATION CHATS */}
          {activeTab === 'chats' && (
            <QuotationChatsTab profile={profile} showToast={showToast} />
          )}

        </section>

      </main>

      {/* Seller Mobile Bottom Navigation Menu */}
      {profile.is_seller && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0B1528]/95 backdrop-blur-md border-t border-slate-850 flex justify-around py-2.5 z-40 shadow-xl px-2">
          {[
            { tab: 'seller_rfqs', label: 'Dashboard', icon: LayoutDashboard },
            { tab: 'seller_orders', label: 'Orders', icon: ShoppingBag },
            { tab: 'seller_capabilities', label: 'RFQs', icon: FileText },
            { tab: 'seller_earnings', label: 'Earnings', icon: IndianRupee },
          ].map(({ tab, label, icon: Icon }) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className="flex flex-col items-center gap-0.5 py-1 flex-1 cursor-pointer transition-colors"
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#00D0F5]' : 'text-slate-400'}`} />
                <span className={`text-[8px] font-black uppercase tracking-wider ${isActive ? 'text-[#00D0F5]' : 'text-slate-400'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <Footer />

      {/* Seller KYC Modal */}
      {showKYCModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
            onClick={() => setShowKYCModal(false)}
          ></div>

          {/* Modal Container */}
          <div className="bg-white/95 backdrop-blur-lg border border-slate-200/50 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative z-10 animate-fade-in-down max-h-[90vh] overflow-y-auto no-scrollbar space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#0B1528]/10 text-[#0B1528] flex items-center justify-center mx-auto shadow-sm">
                <Cpu className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-lg font-black text-slate-text-primary tracking-tight uppercase">Seller Registration &amp; KYC</h3>
              <p className="text-xs text-slate-text-muted max-w-sm mx-auto leading-relaxed font-semibold">
                Please complete your shop verification details to register as a custom fabrication seller on MechItAll.
              </p>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const target = e.target as any;
              const companyName = target.companyName.value.trim();
              const taxId = target.taxId.value.trim();
              const machineCount = parseInt(target.machineCount.value) || 0;
              const businessAddress = target.businessAddress.value.trim();
              const primaryCapability = target.primaryCapability.value;

              if (!companyName || !taxId || !businessAddress || !primaryCapability) {
                showToast('Please fill in all required fields.', 'error');
                return;
              }

              setTogglingSeller(true);
              try {
                await submitSellerKYC(profile.id, {
                  companyName,
                  taxId,
                  machineCount,
                  businessAddress,
                  primaryCapability
                });
                showToast('KYC Verified & Seller Mode Activated!', 'success');
                setShowKYCModal(false);
                await fetchProfile();
              } catch (err: any) {
                showToast(err.message || 'Failed to submit KYC.', 'error');
              } finally {
                setTogglingSeller(false);
              }
            }} className="space-y-4 text-left">
              
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-text-secondary uppercase">Company / Shop Name *</label>
                <input 
                  type="text" 
                  name="companyName" 
                  required 
                  placeholder="e.g. Precision CNC Lab Ltd."
                  className="w-full text-xs font-bold p-3 border border-slate-border rounded-lg bg-slate-bg/30 text-slate-text-primary focus:outline-none focus:border-[#007084]" 
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-text-secondary uppercase">Tax Identification ID (GSTIN/EIN) *</label>
                <input 
                  type="text" 
                  name="taxId" 
                  required 
                  placeholder="e.g. 27AAAAA1111A1Z1"
                  className="w-full text-xs font-bold p-3 border border-slate-border rounded-lg bg-slate-bg/30 text-slate-text-primary focus:outline-none focus:border-[#007084]" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-text-secondary uppercase">Machine Count</label>
                  <input 
                    type="number" 
                    name="machineCount" 
                    min={0}
                    defaultValue={1}
                    className="w-full text-xs font-bold p-3 border border-slate-border rounded-lg bg-slate-bg/30 text-slate-text-primary focus:outline-none focus:border-[#007084]" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-text-secondary uppercase">Primary Capability *</label>
                  <select 
                    name="primaryCapability"
                    required
                    className="w-full text-xs font-bold p-3 border border-slate-border rounded-lg bg-slate-bg/30 text-slate-text-primary focus:outline-none focus:border-[#007084]"
                  >
                    <option value="CNC Machining">CNC Machining</option>
                    <option value="3D Printing">3D Printing</option>
                    <option value="Sheet Metal Fabrication">Sheet Metal Fabrication</option>
                    <option value="Laser Cutting">Laser Cutting</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-text-secondary uppercase">Business Address *</label>
                <textarea 
                  name="businessAddress" 
                  required 
                  rows={2} 
                  placeholder="Street, City, Zip Code..."
                  className="w-full text-xs font-bold p-3 border border-slate-border rounded-lg bg-slate-bg/30 text-slate-text-primary focus:outline-none focus:border-[#007084] resize-none"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowKYCModal(false)}
                  className="flex-1 py-3 rounded-lg border border-slate-border hover:bg-slate-bg text-xs font-bold text-slate-text-secondary cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={togglingSeller}
                  className="flex-1 bg-[#0B1528] hover:bg-slate-900 text-white py-3 rounded-lg text-xs font-extrabold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  Verify &amp; Activate
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function QuotationChatsTab({ profile, showToast }: { profile: any; showToast: any }) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Load threads
  const loadThreads = async () => {
    setLoading(true);
    const res = await getOngoingChats();
    if (res.success && res.data) {
      setThreads(res.data);
    } else {
      showToast(res.error || 'Failed to load chat threads', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadThreads();
  }, []);

  // Poll for new messages when a thread is active
  useEffect(() => {
    if (!activeThread) return;
    
    const loadMessages = async () => {
      const res = await getChatMessages(activeThread.quoteId);
      if (res.success && res.data) {
        setMessages(res.data);
      }
    };
    
    loadMessages();
    const interval = setInterval(loadMessages, 5000); // Poll every 5 seconds
    
    return () => clearInterval(interval);
  }, [activeThread]);

  const selectThread = async (thread: ChatThread) => {
    setActiveThread(thread);
    setLoadingMessages(true);
    const res = await getChatMessages(thread.quoteId);
    if (res.success && res.data) {
      setMessages(res.data);
    } else {
      showToast(res.error || 'Failed to load message history', 'error');
    }
    setLoadingMessages(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeThread) return;

    setSending(true);
    const res = await sendChatMessage({
      rfqId: activeThread.rfqId,
      quoteId: activeThread.quoteId,
      messageText: newMessage.trim(),
    });

    if (res.success && res.data) {
      setMessages((prev) => [...prev, res.data!]);
      setNewMessage('');
      // Update thread last message in list
      setThreads((prev) => 
        prev.map((t) => 
          t.quoteId === activeThread.quoteId 
            ? { ...t, lastMessageText: res.data!.message_text, lastMessageTime: res.data!.created_at }
            : t
        )
      );
    } else {
      showToast(res.error || 'Failed to send message', 'error');
    }
    setSending(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeThread) return;

    setUploading(true);
    try {
      const signedRes = await getChatUploadSignedUrl(activeThread.quoteId, file.name);
      if (!signedRes.success || !signedRes.data) {
        showToast(signedRes.error || 'Failed to generate signed upload URL', 'error');
        return;
      }

      const { signedUrl, path } = signedRes.data;

      // Upload file directly to Supabase storage via PUT
      const response = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to upload file to storage bucket');
      }

      // Send chat message with the attachment path
      const res = await sendChatMessage({
        rfqId: activeThread.rfqId,
        quoteId: activeThread.quoteId,
        messageText: `Shared an attachment: ${file.name}`,
        fileAttachmentPath: path,
      });

      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data!]);
        setThreads((prev) => 
          prev.map((t) => 
            t.quoteId === activeThread.quoteId 
              ? { ...t, lastMessageText: res.data!.message_text, lastMessageTime: res.data!.created_at }
              : t
          )
        );
        showToast('Attachment uploaded successfully!', 'success');
      } else {
        showToast(res.error || 'Failed to link attachment in chat', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Attachment upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-border rounded-2xl p-6 shadow-sm min-h-[600px] flex flex-col md:flex-row gap-6">
      {/* Threads List Sidebar */}
      <div className={`md:w-5/12 flex flex-col gap-4 border-r border-slate-border/50 pr-0 md:pr-6 ${activeThread ? 'hidden md:flex' : 'flex'}`}>
        <div className="space-y-1">
          <h2 className="text-base font-black text-slate-text-primary tracking-tight uppercase">Quotation Negotiations</h2>
          <p className="text-xs text-slate-text-muted leading-relaxed font-semibold">
            Secure chats for open machining quotes and dispute resolution records.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[500px] space-y-2 mt-2">
          {loading ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-text-muted/30" />
            </div>
          ) : threads.length > 0 ? (
            threads.map((t) => (
              <div
                key={t.quoteId}
                onClick={() => selectThread(t)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 text-left ${
                  activeThread?.quoteId === t.quoteId 
                    ? 'border-cobalt bg-cobalt/5 ring-1 ring-cobalt/10'
                    : 'border-slate-border hover:bg-slate-bg/50'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-xs font-black text-slate-text-primary line-clamp-1 flex-1">{t.rfqTitle}</h4>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                    t.status === 'ACCEPTED' 
                      ? 'bg-emerald-500/10 text-emerald border border-emerald-500/20'
                      : t.status === 'REJECTED'
                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  }`}>
                    {t.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-text-muted">
                  <span className="font-bold text-slate-text-secondary">With: {t.otherParticipantName}</span>
                  {t.lastMessageTime && (
                    <span className="font-mono">{new Date(t.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                </div>
                {t.lastMessageText && (
                  <p className="text-[11px] text-slate-text-muted font-medium line-clamp-1 italic bg-slate-bg/30 px-2 py-1 rounded">
                    "{t.lastMessageText}"
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="py-20 text-center border border-dashed border-slate-border rounded-xl">
              <MessageSquare className="w-8 h-8 text-slate-text-muted/30 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-text-primary">No active chats found</p>
              <p className="text-[10px] text-slate-text-muted mt-1 leading-normal px-6">Ongoing negotiations will appear here once quote requests are submitted.</p>
            </div>
          )}
        </div>
      </div>

      {/* Message Chat Panel */}
      <div className={`flex-1 flex flex-col min-h-[500px] justify-between ${!activeThread ? 'hidden md:flex items-center justify-center text-center bg-slate-bg/10 rounded-2xl border border-dashed border-slate-border/50 p-6' : 'flex'}`}>
        {activeThread ? (
          <>
            {/* Thread Header */}
            <div className="pb-4 border-b border-slate-border flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveThread(null)} className="md:hidden p-1 rounded-lg border border-slate-border hover:bg-slate-bg cursor-pointer">
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                <div>
                  <h3 className="text-sm font-black text-slate-text-primary leading-tight">{activeThread.rfqTitle}</h3>
                  <span className="text-[10px] font-bold text-slate-text-muted block mt-0.5">Participant: {activeThread.otherParticipantName}</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                activeThread.status === 'ACCEPTED' 
                  ? 'bg-emerald-500/10 text-emerald border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
              }`}>
                {activeThread.status}
              </span>
            </div>

            {/* Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 my-4 space-y-3 max-h-[360px] bg-slate-bg/30 rounded-xl border border-slate-border/30">
              {loadingMessages ? (
                <div className="py-20 text-center">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-slate-text-muted/30" />
                </div>
              ) : messages.length > 0 ? (
                messages.map((m) => {
                  const isOwnMessage = m.sender_id === profile.id;
                  return (
                    <div key={m.id} className={`flex flex-col max-w-[75%] ${isOwnMessage ? 'self-end ml-auto items-end' : 'self-start mr-auto items-start'}`}>
                      <span className="text-[9px] font-bold text-slate-text-muted mb-0.5 px-1">{m.sender_name}</span>
                      <div className={`p-3 rounded-xl border text-xs font-semibold leading-relaxed ${
                        isOwnMessage 
                          ? 'bg-cobalt text-white border-cobalt shadow-sm' 
                          : 'bg-white text-slate-text-primary border-slate-border shadow-sm'
                      }`}>
                        <p>{m.message_text}</p>
                        {m.file_attachment_path && (
                          <div className={`mt-2 p-2 rounded-lg border flex items-center gap-2 ${isOwnMessage ? 'bg-white/10 border-white/20' : 'bg-slate-bg border-slate-border'}`}>
                            <FileText className="w-4 h-4 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="block text-[10px] font-black truncate">{m.file_attachment_path.split('/').pop()}</span>
                              <span className="block text-[8px] opacity-60">Attachment</span>
                            </div>
                            <button
                              onClick={async () => {
                                const client = createClient();
                                const { data } = await client.storage.from('chat-attachments').createSignedUrl(m.file_attachment_path!, 60);
                                if (data?.signedUrl) {
                                  window.open(data.signedUrl, '_blank');
                                } else {
                                  showToast('Failed to open attachment link.', 'error');
                                }
                              }}
                              className={`p-1 rounded hover:bg-black/10 text-xs cursor-pointer ${isOwnMessage ? 'text-white' : 'text-slate-text-secondary'}`}
                              title="Download Attachment"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <span className="text-[8px] text-slate-text-muted mt-0.5 px-1 font-mono">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center">
                  <p className="text-xs text-slate-text-muted font-bold italic">No messages sent yet. Send a message to start negotiation.</p>
                </div>
              )}
            </div>

            {/* Input message bar */}
            <form onSubmit={handleSendMessage} className="border-t border-slate-border/50 pt-4 flex gap-2">
              <label className="btn-secondary p-3 rounded-lg border border-slate-border cursor-pointer flex items-center justify-center shrink-0 hover:bg-slate-bg transition-colors" title="Attach file">
                <Paperclip className={`w-4 h-4 ${uploading ? 'animate-pulse text-cobalt' : 'text-slate-text-secondary'}`} />
                <input type="file" onChange={handleFileUpload} disabled={uploading || sending} className="hidden" />
              </label>
              <input
                type="text"
                placeholder="Type your message or negotiate terms..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending || uploading}
                className="flex-1 text-xs font-semibold p-3 border border-slate-border rounded-lg bg-slate-bg/30 text-slate-text-primary focus:outline-none focus:border-cobalt transition-colors"
              />
              <button
                type="submit"
                disabled={sending || uploading || !newMessage.trim()}
                className="btn-cobalt p-3 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="space-y-3">
            <MessageSquare className="w-12 h-12 text-slate-text-muted/30 mx-auto" />
            <div>
              <p className="text-xs font-black text-slate-text-primary uppercase tracking-tight">Select a conversation</p>
              <p className="text-[10px] text-slate-text-muted mt-1 max-w-xs leading-normal">
                Choose a negotiation thread from the left menu to view secure messages, share CAD revisions, or review contract terms.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

