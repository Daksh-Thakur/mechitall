'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useCart } from '@/components/CartProvider';
import { getProfileOrders, getProfileTransactions, updateProfileName, Profile, BoltsTransaction } from '@/app/actions/rewards';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  User, ShoppingBag, Gift, Heart, Settings, MapPin, MessageSquare, 
  ArrowLeftRight, ShieldCheck, Cpu, ChevronRight, Download, Plus, 
  Trash2, RefreshCw, ShoppingCart, Clock, CheckCircle2, AlertTriangle, Play
} from 'lucide-react';
export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile, fetchProfile, showToast, addToCart, wishlist, toggleWishlist } = useCart();

  const [activeTab, setActiveTab] = useState<'orders' | 'rewards' | 'wishlist' | 'settings' | 'address' | 'support'>('orders');
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
        <aside className="md:w-3/12 flex flex-col justify-between bg-white border border-slate-border rounded-2xl p-6 shadow-sm h-fit">
          <div className="space-y-6">
            {/* Header User Card */}
            <div className="text-center space-y-3 pb-6 border-b border-slate-border">
              <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-cobalt/10 border-2 border-cobalt text-cobalt font-black text-xl shadow-md">
                {profile.full_name[0] + (profile.full_name.split(' ').pop() || 'U')[0]}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald text-white flex items-center justify-center border border-white shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-text-primary tracking-tight truncate">Hello, {profile.full_name.split(' ')[0]}</h3>
                <span className="inline-block mt-0.5 text-[9px] uppercase tracking-wider font-extrabold bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  {profile.loyalty_tier}
                </span>
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
            </nav>
          </div>

          {/* Switch to Seller Button */}
          <div className="pt-6 border-t border-slate-border mt-8">
            <button
              onClick={() => showToast('Seller panel integration active in release builds.', 'success')}
              className="w-full border border-slate-border text-slate-text-secondary hover:text-slate-text-primary hover:border-slate-text-primary transition-all py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer bg-slate-bg/30"
            >
              <ArrowLeftRight className="w-4 h-4 shrink-0" />
              <span>Switch to Seller</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="md:w-9/12 space-y-6">
          
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

        </section>

      </main>

      <Footer />
    </div>
  );
}
