'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useCart } from '@/components/CartProvider';
import {
  getProfileOrders, getProfileTransactions, updateProfileName, toggleProfileSellerMode,
  submitSellerKYC, getSellerDashboardData, submitProductListing, getSellerOrders,
  updateSellerOrderStatus, deleteSellerCapability, submitServiceListing, deleteSellerProduct,
  deleteSellerService, Profile, BoltsTransaction, confirmDeliveryAndClaimBolts, simulateOrderStatus
} from '@/app/actions/rewards';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoginPage from '../login/page';
import {
  User, ShoppingBag, Gift, Heart, Settings, MapPin, MessageSquare,
  ArrowLeftRight, ShieldCheck, Cpu, ChevronRight, Download, Plus,
  Trash2, RefreshCw, ShoppingCart, Clock, CheckCircle2, AlertTriangle, Play, Upload,
  Send, Paperclip, FileText, ExternalLink, CircleDollarSign, IndianRupee, LayoutDashboard, ArrowRight,
  Package, X, Camera, Loader2, Eye, XCircle
} from 'lucide-react';
import {
  getOngoingChats,
  getChatMessages,
  sendChatMessage,
  getChatUploadSignedUrl,
  getUploadSignedUrl,
  rejectQuote,
  cancelQuoteNegotiation
} from '@/app/actions/machining-workflow';
import { listMachiningService, submitQuoteOffer, acceptQuoteOffer, submitBuyerCounterOffer, acceptQuoteOfferBySeller } from '@/app/actions/marketplace';
import { ChatThread, ChatMessage } from '@/types/machining';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile, fetchProfile, showToast, addToCart, wishlist, toggleWishlist } = useCart();

  const [activeTab, setActiveTab] = useState<'orders' | 'rewards' | 'wishlist' | 'settings' | 'address' | 'support' | 'chats' | 'seller_orders' | 'seller_rfqs' | 'seller_listings' | 'seller_capabilities' | 'seller_earnings'>('orders');
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [activeChatRfqId, setActiveChatRfqId] = useState<string | null>(null);

  const checkUnreadChats = async () => {
    try {
      const res = await getOngoingChats();
      if (res.success && res.data) {
        const seenChatsStr = localStorage.getItem('mechitall_seen_chats');
        const seenChats = seenChatsStr ? JSON.parse(seenChatsStr) : {};
        let unreadCount = 0;
        for (const t of res.data) {
          const seen = seenChats[t.quoteId];
          const hasNewMsg = t.lastMessageTime && (!seen || new Date(t.lastMessageTime) > new Date(seen.lastMessageTime));
          const hasNewStatus = !seen || t.status !== seen.status;
          if (hasNewMsg || hasNewStatus) {
            unreadCount++;
          }
        }
        setUnreadChatsCount(unreadCount);
      }
    } catch (err) {
      console.error('Failed to check unread chats:', err);
    }
  };

  useEffect(() => {
    if (profile) {
      checkUnreadChats();

      const channel = supabase
        .channel('global-chats-realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages' },
          () => {
            checkUnreadChats();
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'machining_quotes' },
          () => {
            checkUnreadChats();
          }
        )
        .subscribe((status, err) => {
          if (err) console.error('Global Realtime subscription error:', err);
          else console.log('Global Realtime subscription status:', status);
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);

  // Load tab from URL query params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['orders', 'rewards', 'wishlist', 'settings', 'address', 'support', 'chats', 'seller_orders', 'seller_rfqs', 'seller_listings', 'seller_capabilities', 'seller_earnings'].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  // Switch tabs dynamically when toggling Seller Mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab')) return;
    }
    if (profile?.is_seller) {
      setActiveTab('seller_rfqs');
    } else {
      setActiveTab('orders');
    }
  }, [profile?.is_seller]);

  const [isGuest, setIsGuest] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<BoltsTransaction[]>([]);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  // Tracking selected order for detailed progress timeline
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [uploadingOrderId, setUploadingOrderId] = useState<string | null>(null);
  const [isPending, startTransitionStatus] = useTransition();

  // Profile Edit fields
  const [editName, setEditName] = useState('');
  const [isUpdatingName, startTransition] = useTransition();
  const [togglingSeller, setTogglingSeller] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [showAddListingModal, setShowAddListingModal] = useState(false);
  const [listingType, setListingType] = useState<'Product' | 'Service'>('Product');
  const [selectedCategory, setSelectedCategory] = useState<string>('Actuators');
  const [selectedProcessType, setSelectedProcessType] = useState<string>('CNC Machining');
  const [customSpecs, setCustomSpecs] = useState<{ id: string; key: string; value: string }[]>([]);
  const [enableBulkPricing, setEnableBulkPricing] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFileNames, setImageFileNames] = useState<string[]>([]);
  const [datasheetFile, setDatasheetFile] = useState<{ name: string; size: string; dataUrl: string } | null>(null);
  const [cadFile, setCadFile] = useState<{ name: string; size: string; dataUrl: string } | null>(null);

  const [dragActiveImage, setDragActiveImage] = useState(false);
  const [dragActiveDatasheet, setDragActiveDatasheet] = useState(false);
  const [dragActiveCad, setDragActiveCad] = useState(false);

  const handleDrag = (e: React.DragEvent, type: 'image' | 'datasheet' | 'cad') => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      if (type === 'image') setDragActiveImage(true);
      if (type === 'datasheet') setDragActiveDatasheet(true);
      if (type === 'cad') setDragActiveCad(true);
    } else if (e.type === "dragleave") {
      if (type === 'image') setDragActiveImage(false);
      if (type === 'datasheet') setDragActiveDatasheet(false);
      if (type === 'cad') setDragActiveCad(false);
    }
  };

  const processFile = (file: File, type: 'image' | 'datasheet' | 'cad') => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      if (type === 'image') {
        setImagePreviews(prev => [...prev, reader.result as string]);
        setImageFileNames(prev => [...prev, file.name]);
      } else if (type === 'datasheet') {
        setDatasheetFile({ name: file.name, size: sizeStr, dataUrl: reader.result as string });
      } else if (type === 'cad') {
        setCadFile({ name: file.name, size: sizeStr, dataUrl: reader.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent, type: 'image' | 'datasheet' | 'cad') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'image') setDragActiveImage(false);
    if (type === 'datasheet') setDragActiveDatasheet(false);
    if (type === 'cad') setDragActiveCad(false);

    if (e.dataTransfer.files) {
      if (type === 'image') {
        Array.from(e.dataTransfer.files).forEach(file => {
          if (file.type.startsWith('image/')) {
            processFile(file, type);
          }
        });
      } else if (e.dataTransfer.files[0]) {
        processFile(e.dataTransfer.files[0], type);
      }
    }
  };

  const [localProducts, setLocalProducts] = useState<any[]>([]);
  const [localServices, setLocalServices] = useState<any[]>([]);

  const openAddListingModal = () => {
    setListingType('Product');
    setSelectedCategory('Actuators');
    setSelectedProcessType('CNC Machining');
    setEnableBulkPricing(false);
    setImagePreviews([]);
    setImageFileNames([]);
    setDatasheetFile(null);
    setCadFile(null);
    setCustomSpecs([]);
    setShowAddListingModal(true);
  };

  // Load custom listed products & services from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedProds = localStorage.getItem('local_listed_products');
      if (storedProds) {
        setLocalProducts(JSON.parse(storedProds));
      } else {
        const defaultProds: any[] = [];
        localStorage.setItem('local_listed_products', JSON.stringify(defaultProds));
        setLocalProducts(defaultProds);
      }

      const storedServs = localStorage.getItem('local_listed_services');
      if (storedServs) {
        setLocalServices(JSON.parse(storedServs));
      } else {
        const defaultServs: any[] = [];
        localStorage.setItem('local_listed_services', JSON.stringify(defaultServs));
        setLocalServices(defaultServs);
      }
    }
  }, []);


  const [sellerData, setSellerData] = useState<{
    openRfqs: any[];
    myQuotes: any[];
    activeJobs: any[];
    completedJobs: any[];
    monthlyEarnings: number;
    earningsVelocity: any[];
    capabilities: any[];
    products: any[];
    services: any[];
  } | null>(null);
  const [loadingSeller, setLoadingSeller] = useState(false);
  const [sellerOrders, setSellerOrders] = useState<any[]>([]);
  const [loadingSellerOrders, setLoadingSellerOrders] = useState(false);

  const fetchSellerData = async () => {
    if (!profile) return;
    setLoadingSeller(true);
    setLoadingSellerOrders(true);
    try {
      const [data, sOrders] = await Promise.all([
        getSellerDashboardData(profile.id),
        getSellerOrders(profile.id)
      ]);
      setSellerData(data);
      setSellerOrders(sOrders);
    } catch (err) {
      console.error('Failed to load seller data:', err);
    } finally {
      setLoadingSeller(false);
      setLoadingSellerOrders(false);
    }
  };

  useEffect(() => {
    if (profile?.is_seller && activeTab.startsWith('seller_')) {
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
        setIsGuest(true);
      } else {
        setIsGuest(false);
      }
    }
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsGuest(true);
      } else {
        setIsGuest(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Sync edit name state
  useEffect(() => {
    if (profile?.full_name) {
      setEditName(profile.full_name);
    }
  }, [profile?.full_name]);

  const fetchOrders = async () => {
    if (!profile) return;
    try {
      setLoadingOrders(true);
      const data = await getProfileOrders(profile.id);
      setOrders(data || []);
      // Keep selected order updated with fresh database state
      if (selectedOrder) {
        const updated = (data || []).find((o: any) => o.id === selectedOrder.id);
        if (updated) {
          setSelectedOrder(updated);
        } else if (data && data.length > 0) {
          setSelectedOrder(data[0]);
        }
      } else if (data && data.length > 0) {
        setSelectedOrder(data[0]);
      }
    } catch (err) {
      console.error('Failed to load profile orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Load orders
  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [profile?.id, activeTab]);

  // Handle mock photo upload and claiming rewards (escrow release)
  const handlePhotoUploadAndClaim = async (orderId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !profile) return;
    const file = event.target.files[0];

    setUploadingOrderId(orderId);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;

      startTransitionStatus(async () => {
        try {
          const response = await confirmDeliveryAndClaimBolts(orderId, base64String, profile.id);

          if (response.success) {
            showToast(`Successfully released PayU escrow funds & credited ${response.earnedBolts} Bolts!`, 'success');
            await fetchProfile();
            await fetchOrders();
          }
        } catch (err: any) {
          console.error(err);
          showToast(err.message || 'Verification failed', 'error');
        } finally {
          setUploadingOrderId(null);
        }
      });
    };
    reader.readAsDataURL(file);
  };

  // Simulate order statuses for sandbox testing
  const handleSimulateStatus = async (orderId: string, nextStatus: 'Shipped' | 'Delivered') => {
    if (!profile) return;
    startTransitionStatus(async () => {
      try {
        await simulateOrderStatus(orderId, nextStatus);
        await fetchOrders();
        showToast(`Order status updated to ${nextStatus}`, 'success');
      } catch (err: any) {
        showToast(err.message || 'Status transition failed', 'error');
      }
    });
  };

  // Load rewards transaction log
  useEffect(() => {
    async function loadRewards() {
      if (!profile || activeTab !== 'rewards') return;
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
  }, [profile?.id, activeTab]);

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

  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: 'Processing' | 'Shipped' | 'Delivered' | 'Completed') => {
    setUpdatingOrderId(orderId);
    try {
      await updateSellerOrderStatus(orderId, nextStatus);
      showToast(`Order status updated to "${nextStatus}" successfully!`, 'success');
      await fetchSellerData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update order status.', 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);
  const handleDeleteCapability = async (serviceId: string) => {
    if (!profile) return;
    setDeletingServiceId(serviceId);
    try {
      await deleteSellerCapability(serviceId, profile.id);
      showToast('Capability deleted successfully!', 'success');
      await fetchSellerData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete capability.', 'error');
    } finally {
      setDeletingServiceId(null);
    }
  };

  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const handleDeleteProduct = async (productId: string) => {
    if (!profile) return;
    setDeletingProductId(productId);
    try {
      await deleteSellerProduct(productId, profile.id);
      showToast('Product listing deleted successfully!', 'success');
      await fetchSellerData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product listing.', 'error');
    } finally {
      setDeletingProductId(null);
    }
  };

  const [deletingCatalogServiceId, setDeletingCatalogServiceId] = useState<string | null>(null);
  const handleDeleteService = async (serviceId: string) => {
    if (!profile) return;
    setDeletingCatalogServiceId(serviceId);
    try {
      await deleteSellerService(serviceId, profile.id);
      showToast('Service listing deleted successfully!', 'success');
      await fetchSellerData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete service listing.', 'error');
    } finally {
      setDeletingCatalogServiceId(null);
    }
  };

  const [publishingListing, setPublishingListing] = useState(false);

  const activeShipmentsCount = orders.filter(o => o.status === 'Processing' || o.status === 'Shipped').length;

  if (isGuest === true) {
    return <LoginPage />;
  }

  if (!profile) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-900 font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
          {hasTimedOut ? (
            <div className="space-y-4 max-w-md bg-zinc-800 p-8 rounded-2xl border border-zinc-700/60 shadow-xl">
              <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto animate-bounce" />
              <h3 className="text-base font-extrabold text-white tracking-tight">Database Sync Timeout</h3>
              <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
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
              <span className="text-xs font-bold text-zinc-400 animate-pulse">Syncing user profile...</span>
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
    <div className="flex flex-col min-h-screen bg-zinc-900 font-sans">
      <Navbar />

      {/* Buyer Mobile Top Navigation Menu */}
      {!profile.is_seller && (
        <div className="md:hidden sticky top-14 left-0 right-0 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 flex justify-around py-2.5 z-40 shadow-md px-2">
          {[
            { tab: 'orders', label: 'Orders', icon: ShoppingBag },
            { tab: 'rewards', label: 'Rewards', icon: Gift },
            { tab: 'wishlist', label: 'Wishlist', icon: Heart },
            { tab: 'chats', label: 'Chats', icon: MessageSquare },
            { tab: 'settings', label: 'Settings', icon: Settings },
          ].map(({ tab, label, icon: Icon }) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className="flex flex-col items-center gap-0.5 py-1 flex-1 cursor-pointer transition-colors relative"
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#00D0F5]' : 'text-slate-400'}`} />
                <span className={`text-[8px] font-black uppercase tracking-wider ${isActive ? 'text-[#00D0F5]' : 'text-slate-400'}`}>
                  {label}
                </span>
                {tab === 'chats' && unreadChatsCount > 0 && (
                  <span className="absolute top-1 right-5 w-1.5 h-1.5 rounded-full bg-[#00D0F5] animate-pulse"></span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Seller Mobile Top Navigation Menu */}
      {profile.is_seller && (
        <div className="md:hidden sticky top-14 left-0 right-0 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 flex justify-around py-2.5 z-40 shadow-md px-2">
          {[
            { tab: 'seller_rfqs', label: 'Dashboard', icon: LayoutDashboard },
            { tab: 'seller_orders', label: 'Orders', icon: ShoppingBag },
            { tab: 'seller_listings', label: 'My Products', icon: Package },
            { tab: 'seller_capabilities', label: 'My Services', icon: Cpu },
            { tab: 'seller_earnings', label: 'Earnings', icon: IndianRupee },
            { tab: 'chats', label: 'Chats', icon: MessageSquare },
          ].map(({ tab, label, icon: Icon }) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className="flex flex-col items-center gap-0.5 py-1 flex-1 cursor-pointer transition-colors relative"
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#00D0F5]' : 'text-slate-400'}`} />
                <span className={`text-[8px] font-black uppercase tracking-wider ${isActive ? 'text-[#00D0F5]' : 'text-slate-400'}`}>
                  {label}
                </span>
                {tab === 'chats' && unreadChatsCount > 0 && (
                  <span className="absolute top-1 right-5 w-1.5 h-1.5 rounded-full bg-[#00D0F5] animate-pulse"></span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto px-6 pt-3 pb-8 md:py-10 w-full flex flex-col md:flex-row gap-3 md:gap-8">
        {/* Sidebar Nav */}
        {profile.is_seller ? (
          /* Seller Sidebar Nav */
          <aside className="w-full md:w-3/12 flex flex-col justify-between bg-transparent md:bg-zinc-800 text-zinc-200 rounded-none md:rounded border-0 md:border border-transparent md:border-zinc-700/60 p-0 md:p-6 shadow-none md:shadow-sm h-fit md:h-[600px] shrink-0">
            <div className="space-y-6 hidden md:block">
              {/* Header Seller Hub Card */}
              <div className="pb-4 border-b border-zinc-700/60">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2 font-mono">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] animate-pulse"></span>
                    Seller Hub
                  </h3>
                  {profile.is_verified_seller && (
                    <span className="inline-flex items-center gap-1 text-[8px] font-mono uppercase tracking-wider font-bold bg-emerald/10 text-emerald border border-emerald-500/20 px-2 py-0.5 rounded" title="Verified Seller">
                      <ShieldCheck className="w-2.5 h-2.5" /> Verified
                    </span>
                  )}
                </div>
                <span className="block text-[8px] font-bold text-zinc-500 mt-2 uppercase tracking-widest font-mono">
                  Precision Partner
                </span>
              </div>

              {/* Nav Tabs */}
              <nav className="space-y-1">
                {[
                  { tab: 'seller_rfqs', label: 'Dashboard', icon: LayoutDashboard },
                  { tab: 'seller_orders', label: 'Orders', icon: ShoppingBag },
                  { tab: 'seller_listings', label: 'My Products', icon: Package },
                  { tab: 'seller_capabilities', label: 'My Services', icon: Cpu },
                  { tab: 'seller_earnings', label: 'Earnings', icon: IndianRupee },
                  { tab: 'chats', label: 'Quotation Chats', icon: MessageSquare },
                ].map(({ tab, label, icon: Icon }) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${activeTab === tab
                        ? 'bg-[#0f172a] text-white shadow-md'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                      }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${activeTab === tab ? 'text-[#06B6D4]' : 'text-zinc-500'}`} />
                    <span>{label}</span>
                    {tab === 'chats' && unreadChatsCount > 0 && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse"></span>
                    )}
                  </button>
                ))}
              </nav>

              {/* Quick Action Button: New Listing */}
              <button
                onClick={openAddListingModal}
                className="w-full bg-[#0f172a] hover:bg-[#06b6d4] text-white py-2.5 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow"
              >
                <Plus className="w-4 h-4 shrink-0 stroke-[3]" />
                <span>New Listing</span>
              </button>
            </div>

            {/* Exit/Deactivate Seller Mode */}
            <div className="pt-0 md:pt-4 md:border-t border-zinc-700/60">
              <button
                disabled={togglingSeller}
                onClick={handleToggleSellerMode}
                className="w-full py-2.5 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer border border-zinc-700/60 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all bg-zinc-900/50"
              >
                <ArrowLeftRight className="w-4 h-4 shrink-0" />
                <span>Switch to Customer Mode</span>
              </button>
            </div>
          </aside>
        ) : (
          /* Sidebar Nav */
          <aside className="w-full md:w-3/12 flex flex-col justify-between bg-transparent md:bg-zinc-800 rounded-none md:rounded border-0 md:border border-transparent md:border-zinc-700/60 p-0 md:p-6 shadow-none md:shadow-sm h-fit">
            <div className="space-y-6 hidden md:block">
              {/* Header User Card */}
              <div className="text-center space-y-3 pb-6 border-b border-zinc-700/60">
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded bg-cobalt/10 border-2 border-cobalt text-cobalt font-black text-xl shadow font-mono">
                  {profile.full_name[0] + (profile.full_name.split(' ').pop() || 'U')[0]}
                  {profile.is_verified_buyer && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded bg-emerald text-white flex items-center justify-center border border-white shadow-sm" title="Verified Buyer">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight truncate font-['Space_Grotesk']">Hello, {profile.full_name.split(' ')[0]}</h3>
                  <div className="flex flex-col items-center gap-1 mt-1.5">
                    <span className="inline-block text-[8px] font-mono uppercase tracking-wider font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded">
                      {profile.loyalty_tier}
                    </span>
                    {profile.is_verified_buyer && (
                      <span className="inline-flex items-center gap-1 text-[8px] font-mono uppercase tracking-wider font-bold bg-emerald/10 text-emerald border border-emerald-500/20 px-2 py-0.5 rounded">
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
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${activeTab === 'orders'
                      ? 'bg-[#0f172a] text-white shadow'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                    }`}
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>My Orders</span>
                </button>

                <button
                  onClick={() => setActiveTab('rewards')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${activeTab === 'rewards'
                      ? 'bg-[#0f172a] text-white shadow'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                    }`}
                >
                  <Gift className="w-4 h-4 shrink-0" />
                  <span>Rewards &amp; Offers</span>
                </button>

                <button
                  onClick={() => setActiveTab('wishlist')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${activeTab === 'wishlist'
                      ? 'bg-[#0f172a] text-white shadow'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                    }`}
                >
                  <Heart className="w-4 h-4 shrink-0" />
                  <span>Wishlist</span>
                  {wishlist.length > 0 && (
                    <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${activeTab === 'wishlist'
                        ? 'bg-zinc-800/20 text-white'
                        : 'bg-cobalt/10 text-cobalt border border-cobalt/20'
                      }`}>
                      {wishlist.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${activeTab === 'settings'
                      ? 'bg-[#0f172a] text-white shadow'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                    }`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>Account Settings</span>
                </button>

                <button
                  onClick={() => setActiveTab('address')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${activeTab === 'address'
                      ? 'bg-[#0f172a] text-white shadow'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                    }`}
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>Address Book</span>
                </button>

                <button
                  onClick={() => setActiveTab('support')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${activeTab === 'support'
                      ? 'bg-[#0f172a] text-white shadow'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                    }`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>Customer Support</span>
                </button>

                <button
                  onClick={() => setActiveTab('chats')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${activeTab === 'chats'
                      ? 'bg-[#0f172a] text-white shadow'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                    }`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>Quotation Chats</span>
                  {unreadChatsCount > 0 && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse"></span>
                  )}
                </button>
              </nav>
            </div>

            {/* Switch/Activate Seller Mode */}
            <div className="pt-0 md:pt-6 md:border-t border-zinc-700/60 md:mt-8 space-y-2">
              <div className="hidden md:flex justify-between items-center text-[10px] font-bold text-zinc-500 font-mono uppercase tracking-wider">
                <span>Seller Account</span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${profile.seller_kyc_completed
                    ? 'bg-emerald-500/10 text-emerald border border-emerald-500/20'
                    : 'bg-zinc-900 text-zinc-500 border border-zinc-700/60'
                  }`}>
                  {profile.seller_kyc_completed ? 'Active' : 'Inactive'}
                </span>
              </div>
              <button
                disabled={togglingSeller}
                onClick={handleToggleSellerMode}
                className={`w-full transition-all py-2.5 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer ${profile.is_seller
                    ? 'border border-rose-200 text-rose-500 hover:bg-rose-50'
                    : 'border border-zinc-700/60 text-zinc-400 hover:text-white hover:border-[#0f172a] bg-zinc-900'
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
        <section className="w-full md:w-9/12 space-y-6">
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
                      className={`border rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all ${stat.isDark
                          ? 'bg-[#0B1528] border-zinc-800 text-white'
                          : 'bg-zinc-800 border-zinc-700/60 text-white'
                        }`}
                    >
                      <div className="space-y-1">
                        <span className={`block text-[8px] font-black uppercase tracking-wider ${stat.isDark ? 'text-slate-400' : 'text-zinc-400'}`}>{stat.label}</span>
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
                  <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-zinc-700/60">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#007084]" />
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">Active RFQs for Review</h4>
                      </div>
                      <Link href="/machining" className="text-xs font-bold text-[#007084] hover:underline">
                        View All Requests
                      </Link>
                    </div>

                    <div className="flex gap-4 overflow-x-auto md:grid md:grid-cols-2 md:overflow-x-visible no-scrollbar pb-3 md:pb-0 snap-x snap-mandatory">
                      {loadingSeller ? (
                        <div className="w-full py-8 text-center animate-pulse">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-400/30" />
                        </div>
                      ) : !sellerData || sellerData.openRfqs.length === 0 ? (
                        <div className="w-full text-center py-8 text-xs font-bold text-zinc-400">
                          No active RFQs for review at the moment.
                        </div>
                      ) : (
                        sellerData.openRfqs.map((rfq, idx) => (
                          <div
                            key={rfq.id}
                            className="snap-center shrink-0 w-[270px] md:w-auto border border-zinc-700/60/70 rounded-2xl p-4 flex flex-col justify-between hover:border-zinc-700/60 transition-colors bg-zinc-800 shadow-sm space-y-4"
                          >
                            <div className="space-y-3">
                              {/* Header Badge & Code */}
                              <div className="flex justify-between items-center text-[9px] font-black tracking-wider uppercase">
                                <span className={`px-2 py-0.5 rounded ${idx === 0
                                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                    : 'bg-slate-100 text-slate-600 border'
                                  }`}>
                                  {idx === 0 ? 'HIGH PRIORITY' : 'STANDARD'}
                                </span>
                                <span className="text-slate-400 font-mono">#RFQ-{rfq.id.slice(0, 4).toUpperCase()}</span>
                              </div>

                              {/* Title */}
                              <h5 className="text-xs font-black text-white line-clamp-1 leading-snug">{rfq.title}</h5>

                              {/* Specs Grid */}
                              <div className="grid grid-cols-2 gap-4 border-t border-b border-zinc-700/60/30 py-3.5">
                                <div>
                                  <span className="block text-[8px] font-black uppercase text-slate-400">Material</span>
                                  <span className="text-[10px] font-black text-zinc-350 truncate block">{rfq.material_preference || 'Ti-6Al-4V'}</span>
                                </div>
                                <div>
                                  <span className="block text-[8px] font-black uppercase text-slate-400">Quantity</span>
                                  <span className="text-[10px] font-black text-zinc-350 truncate block">{rfq.quantity} Units</span>
                                </div>
                              </div>
                            </div>

                            {/* Navigate to Chats to discuss and submit quote */}
                            <button
                              onClick={() => setActiveTab('chats')}
                              className="w-full py-2.5 rounded-xl bg-[#0B1528] hover:bg-slate-900 text-white text-[10px] font-extrabold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                            >
                              <span>OPEN IN CHAT</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* PRODUCTION PIPELINE */}
                  <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-zinc-700/60">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-[#007084]" />
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">Production Pipeline</h4>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald rounded border border-emerald-500/20">
                        {sellerData ? sellerData.activeJobs.length : '0'} Active Jobs
                      </span>
                    </div>

                    <div className="space-y-3">
                      {loadingSeller ? (
                        <div className="py-8 text-center animate-pulse">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-400/30" />
                        </div>
                      ) : !sellerData || sellerData.activeJobs.length === 0 ? (
                        <div className="text-center py-8 text-xs font-bold text-zinc-400">
                          No active production jobs in the pipeline.
                        </div>
                      ) : (
                        sellerData.activeJobs.map((job) => {
                          const isShipped = job.status === 'Shipped';
                          const progress = isShipped ? 80 : 40;
                          return (
                            <div key={job.id} className="bg-zinc-800 border border-zinc-700/60/70 rounded-2xl p-4 space-y-4 hover:border-zinc-700/60 transition-colors shadow-sm">
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <span className="block text-[8px] font-black text-slate-400 font-mono">ORDER-{job.id.substring(0, 8).toUpperCase()}</span>
                                  <h5 className="text-xs font-black text-white mt-0.5">{job.rfq?.title || 'Custom Machining Job'}</h5>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${isShipped
                                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                    : 'bg-sky-500/10 text-sky-600 border-sky-500/20'
                                  }`}>
                                  {isShipped ? 'SHIPPED' : 'PROCESSING'}
                                </span>
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 tracking-wider">
                                  <span>Progress</span>
                                  <span className="font-mono font-black text-[9px] text-zinc-350">{progress}%</span>
                                </div>
                                <div className="w-full bg-zinc-900 border border-zinc-700/60/50 h-2 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${isShipped ? 'bg-amber-500' : 'bg-sky-500'}`}
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                              </div>

                              {job.rfq?.id && (
                                <button
                                  onClick={() => {
                                    setActiveChatRfqId(job.rfq.id);
                                    setActiveTab('chats');
                                  }}
                                  className="w-full py-2 bg-[#0B1528] hover:bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Open Quote Chat</span>
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* DISPATCHED ORDERS */}
                  <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-zinc-700/60">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-[#007084]" />
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">Dispatched Orders</h4>
                      </div>
                      <button onClick={() => showToast('Opening shipment manager...', 'success')} className="text-xs font-bold text-[#007084] hover:underline cursor-pointer">
                        Track All Shipments
                      </button>
                    </div>

                    <div className="overflow-x-auto no-scrollbar">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-zinc-700/60/50 text-[8px] uppercase tracking-wider font-black text-slate-400">
                            <th className="pb-2.5">Order ID</th>
                            <th className="pb-2.5 px-3">Carrier</th>
                            <th className="pb-2.5 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-border/30">
                          {loadingSeller ? (
                            <tr>
                              <td colSpan={3} className="py-8 text-center animate-pulse">
                                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-400/30" />
                              </td>
                            </tr>
                          ) : !sellerData || sellerData.completedJobs.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="py-8 text-center text-xs font-bold text-zinc-400">
                                No recently completed/delivered orders.
                              </td>
                            </tr>
                          ) : (
                            sellerData.completedJobs.map((job) => {
                              const isCompleted = job.status === 'Completed';
                              return (
                                <tr key={job.id} className="text-xs">
                                  <td className="py-3 font-mono font-black text-white">
                                    #{job.id.substring(0, 12).toUpperCase()}
                                  </td>
                                  <td className="py-3 px-3 font-bold text-zinc-350">
                                    Standard Delivery
                                  </td>
                                  <td className="py-3 text-right">
                                    <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase ${isCompleted ? 'text-emerald' : 'text-sky-600'
                                      }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald' : 'bg-sky-500 animate-pulse'}`}></span>
                                      {job.status}
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
                  <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-5 shadow-sm space-y-5">
                    <div className="pb-3 border-b border-zinc-700/60">
                      <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Earnings Velocity</h4>
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
                                  className={`w-7 rounded-t-lg transition-all duration-300 ${isActive
                                      ? 'bg-[#00D0F5] shadow-lg shadow-[#00D0F5]/20 hover:brightness-105'
                                      : 'bg-[#F1F5F9] border border-slate-200 hover:border-slate-400'
                                    }`}
                                  style={{ height: `${height}px` }}
                                ></div>
                                <span className={`text-[9px] font-black uppercase tracking-wider ${isActive ? 'text-[#007084]' : 'text-zinc-400'}`}>
                                  {bar.label}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>

                      <div className="border-t border-zinc-700/60 pt-3.5 flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-400">Projected Month End</span>
                        <span className="font-black text-white text-sm">
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
                  <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-5 shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-[#007084] flex items-center justify-center shrink-0 shadow-sm">
                      <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-white">ISO 9001:2015 Compliance</h4>
                      <p className="text-[10px] text-zinc-400 font-bold leading-normal">
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
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-zinc-800 border border-zinc-700/60 rounded p-6 shadow-sm">
                <h2 className="text-base font-bold text-white tracking-tight uppercase font-['Space_Grotesk']">Seller Orders Manager</h2>
                <p className="text-xs text-zinc-500 mt-1 font-semibold">
                  Track, ship, and complete purchase orders submitted by customers for custom machining contracts or catalog mechatronic parts.
                </p>
              </div>

              {loadingSellerOrders ? (
                <div className="bg-zinc-800 border border-zinc-700/60 p-12 text-center rounded space-y-3">
                  <RefreshCw className="w-8 h-8 text-cobalt animate-spin mx-auto" />
                  <p className="text-xs font-bold text-zinc-400 animate-pulse">Loading orders queue...</p>
                </div>
              ) : sellerOrders.length === 0 ? (
                <div className="bg-zinc-800 border border-zinc-700/60 rounded p-12 text-center py-20 space-y-3 shadow-sm">
                  <ShoppingBag className="w-12 h-12 text-zinc-400/20 mx-auto" />
                  <h4 className="text-sm font-bold text-white font-['Space_Grotesk']">No orders received yet</h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto font-medium">
                    When buyers checkout your mechatronics parts or accept your custom machining quotes, their purchase orders will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sellerOrders.map(order => {
                    const nextStatusMap = {
                      'Processing': 'Shipped',
                      'Shipped': 'Delivered',
                      'Delivered': 'Completed',
                      'Completed': null
                    };
                    const nextStatus = nextStatusMap[order.status as keyof typeof nextStatusMap];
                    const isUpdating = updatingOrderId === order.id;

                    return (
                      <div key={order.id} className="bg-zinc-800 border border-zinc-700/60 p-6 rounded shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-bold text-cobalt bg-cobalt/5 border border-cobalt/15 px-2.5 py-1 rounded">
                              {order.id}
                            </span>
                            <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${order.status === 'Completed'
                                ? 'bg-emerald/8 text-emerald border-emerald/20'
                                : order.status === 'Delivered'
                                  ? 'bg-sky-500/8 text-sky-600 border-sky-500/20'
                                  : order.status === 'Shipped'
                                    ? 'bg-amber-500/8 text-amber-600 border-amber-500/20'
                                    : 'bg-slate-500/8 text-slate-600 border-slate-500/20'
                              }`}>
                              {order.status}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-xs font-black text-white">
                              Buyer: <span className="text-zinc-350">{order.buyer_name}</span>
                              <span className="text-[10px] text-zinc-400 font-normal font-mono ml-2">({order.buyer_email})</span>
                            </h4>
                            <p className="text-[11px] text-zinc-400 font-semibold">
                              Total Amount: <span className="text-white font-extrabold">₹{Number(order.total_amount).toLocaleString('en-IN')}</span> | Items: <span className="font-bold">{order.items_count}</span>
                            </p>
                            <p className="text-[10px] text-zinc-400 font-mono">
                              Ordered on: {new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        {nextStatus && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, nextStatus as any)}
                            disabled={isUpdating}
                            className="bg-[#0f172a] hover:bg-[#06b6d4] text-white text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 rounded transition-colors shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {isUpdating ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>Mark as {nextStatus}</span>
                          </button>
                        )}

                        {order.status === 'Completed' && (
                          <div className="flex items-center gap-1.5 text-emerald font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Order Completed</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {profile.is_seller && activeTab === 'seller_listings' && (
            <div className="space-y-6 pb-20 md:pb-0">
              {/* Header */}
              <div className="bg-zinc-800 border border-zinc-700/60 rounded p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight uppercase font-['Space_Grotesk']">My Listed Products &amp; Services</h2>
                  <p className="text-xs text-zinc-500 mt-1 font-semibold">
                    Manage your active inventory listings, wholesale pricing tiers, and custom fabrication offerings.
                  </p>
                </div>
                <button
                  onClick={openAddListingModal}
                  className="bg-[#0f172a] hover:bg-[#06b6d4] text-white text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 rounded transition-colors shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Listing
                </button>
              </div>

              {loadingSeller && !sellerData ? (
                <div className="bg-zinc-800 border border-zinc-700/60 p-12 text-center rounded space-y-3">
                  <RefreshCw className="w-8 h-8 text-cobalt animate-spin mx-auto" />
                  <p className="text-xs font-bold text-zinc-400 animate-pulse">Loading active inventory...</p>
                </div>
              ) : (
                /* Listings Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Product Listings Card */}
                  <div className="bg-zinc-800 border border-zinc-700/60 rounded p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-zinc-700/60">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-cobalt" />
                        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                          Catalog Products ({sellerData ? sellerData.products.length : 0})
                        </h3>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase">Stock Active</span>
                    </div>

                    <div className="space-y-3">
                      {!sellerData || sellerData.products.length === 0 ? (
                        <p className="text-center py-6 text-xs text-zinc-400 font-semibold">No catalog products listed yet.</p>
                      ) : (
                        sellerData.products.map((item) => {
                          const isDeleting = deletingProductId === item.id;
                          return (
                            <div key={item.id} className="flex justify-between items-center p-3 border border-zinc-700/60 bg-zinc-900/50 rounded text-xs font-medium gap-3">
                              <div className="flex gap-3 items-center min-w-0 flex-1">
                                {item.image_data || item.imageData ? (
                                  <img src={item.image_data || item.imageData} alt={item.title} className="w-8 h-8 object-cover rounded border bg-zinc-800 shrink-0" />
                                ) : (
                                  <div className="w-8 h-8 bg-zinc-800 flex items-center justify-center rounded border shrink-0">
                                    <Package className="w-3.5 h-3.5 text-zinc-500" />
                                  </div>
                                )}
                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-wider truncate">{item.part_number || item.sku}</span>
                                  <span className="block font-semibold text-white truncate">{item.title}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0 flex items-center gap-4">
                                <div>
                                  <span className="block font-bold text-coral">₹{Number(item.price).toLocaleString('en-IN')}</span>
                                  <span className="block text-[8px] font-mono font-bold text-zinc-500 uppercase">{item.stock} units</span>
                                </div>
                                <button
                                  onClick={() => handleDeleteProduct(item.id)}
                                  disabled={isDeleting}
                                  className="text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors p-1 cursor-pointer"
                                  title="Delete product listing"
                                >
                                  {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Service Listings Card */}
                  <div className="bg-zinc-800 border border-zinc-700/60 rounded p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-zinc-700/60">
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-[#06B6D4]" />
                        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                          Catalog Services ({sellerData ? sellerData.services.length : 0})
                        </h3>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase">Online</span>
                    </div>

                    <div className="space-y-3">
                      {!sellerData || sellerData.services.length === 0 ? (
                        <p className="text-center py-6 text-xs text-zinc-400 font-semibold">No catalog services listed yet.</p>
                      ) : (
                        sellerData.services.map((item) => {
                          const isDeleting = deletingCatalogServiceId === item.id;
                          return (
                            <div key={item.id} className="flex justify-between items-center p-3 border border-zinc-700/60 bg-zinc-900/50 rounded text-xs font-medium gap-3">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                {item.image_data ? (
                                  <div className="w-8 h-8 rounded border border-zinc-700/60 overflow-hidden bg-zinc-800 shrink-0">
                                    <img src={item.image_data} alt={item.title} className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded border border-zinc-700/60 bg-zinc-800 text-zinc-500 flex items-center justify-center shrink-0">
                                    <Settings className="w-4 h-4 text-zinc-400" />
                                  </div>
                                )}
                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <span className="block font-semibold text-white truncate">{item.title}</span>
                                  <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-wider">{item.lead_time || '3-5 Days Lead'}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0 flex items-center gap-4">
                                <div>
                                  <span className="block font-bold text-[#06B6D4]">₹{Number(item.base_price).toLocaleString('en-IN')}/hr</span>
                                  <span className="block text-[8px] font-mono font-bold text-zinc-500 uppercase">Active</span>
                                </div>
                                <button
                                  onClick={() => handleDeleteService(item.id)}
                                  disabled={isDeleting}
                                  className="text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors p-1 cursor-pointer"
                                  title="Delete service listing"
                                >
                                  {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {profile.is_seller && activeTab === 'seller_capabilities' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-zinc-800 border border-zinc-700/60 rounded p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight uppercase font-['Space_Grotesk']">Machine Capabilities Registry</h2>
                  <p className="text-xs text-zinc-500 mt-1 font-semibold">
                    Manage your listed mechatronics fabrication systems, CNC machines, and 3D printing envelopes.
                  </p>
                </div>
                <button
                  onClick={openAddListingModal}
                  className="bg-[#0f172a] hover:bg-[#06b6d4] text-white text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 rounded transition-colors shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Capability
                </button>
              </div>

              {loadingSeller && !sellerData ? (
                <div className="bg-zinc-800 border border-zinc-700/60 p-12 text-center rounded space-y-3">
                  <RefreshCw className="w-8 h-8 text-cobalt animate-spin mx-auto" />
                  <p className="text-xs font-bold text-zinc-400 animate-pulse">Loading machine registry...</p>
                </div>
              ) : !sellerData || sellerData.capabilities.length === 0 ? (
                <div className="bg-zinc-800 border border-zinc-700/60 rounded p-12 text-center py-20 space-y-3 shadow-sm">
                  <Cpu className="w-12 h-12 text-zinc-400/20 mx-auto" />
                  <h4 className="text-sm font-bold text-white font-['Space_Grotesk'] font-black">No machine capabilities registered</h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto font-semibold">
                    Register your CNC mills, SLS printers, or laser cutters to start receiving high-value mechatronics quote contracts.
                  </p>
                  <button
                    onClick={openAddListingModal}
                    className="mt-2 py-2 px-5 border border-[#0F172A] text-white hover:bg-[#0F172A] hover:text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Add Your First Capability
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sellerData.capabilities.map(cap => {
                    const isDeleting = deletingServiceId === cap.id;
                    return (
                      <div key={cap.id} className="bg-zinc-800 border border-zinc-700/60 p-5 rounded shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <span className="inline-block text-[9px] font-mono font-bold uppercase tracking-wider bg-sky-500/8 text-sky-600 border border-sky-500/15 px-2 py-0.5 rounded mb-1">
                                {cap.process_type}
                              </span>
                              <h4 className="text-sm font-black text-white leading-tight font-['Space_Grotesk']">
                                {cap.title}
                              </h4>
                            </div>
                            <span className="text-xs font-mono font-black text-emerald shrink-0">
                              ₹{Number(cap.base_price).toLocaleString('en-IN')}/hr
                            </span>
                          </div>

                          <p className="text-[11px] text-zinc-400 leading-relaxed font-semibold">
                            {cap.description}
                          </p>

                          <div className="space-y-1.5 pt-2 border-t border-zinc-700/60/65 text-[10px]">
                            {cap.material_capabilities?.length > 0 && (
                              <p className="text-zinc-350 font-semibold">
                                <span className="text-zinc-400 font-bold">Materials:</span> {cap.material_capabilities.join(', ')}
                              </p>
                            )}
                            {cap.finish_options?.length > 0 && (
                              <p className="text-zinc-350 font-semibold">
                                <span className="text-zinc-400 font-bold">Finishes:</span> {cap.finish_options.join(', ')}
                              </p>
                            )}
                            <p className="text-zinc-350 font-semibold">
                              <span className="text-zinc-400 font-bold">Lead Time:</span> {cap.lead_time || '3-5 Days'}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => handleDeleteCapability(cap.id)}
                            disabled={isDeleting}
                            className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/50 hover:border-rose-300 px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {isDeleting ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            <span>Unregister Device</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {profile.is_seller && activeTab === 'seller_earnings' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-zinc-800 border border-zinc-700/60 rounded p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight uppercase font-['Space_Grotesk']">Seller Earnings Dashboard</h2>
                  <p className="text-xs text-zinc-500 mt-1 font-semibold">
                    Monitor your weekly sales velocity, track pending payouts, and view completed custom order ledger history.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-emerald bg-emerald/5 border border-emerald/15 px-3 py-1.5 rounded">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Account Verified</span>
                </div>
              </div>

              {loadingSeller && !sellerData ? (
                <div className="bg-zinc-800 border border-zinc-700/60 p-12 text-center rounded space-y-3">
                  <RefreshCw className="w-8 h-8 text-cobalt animate-spin mx-auto" />
                  <p className="text-xs font-bold text-zinc-400 animate-pulse">Loading financial summary...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Metrics */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-zinc-800 border border-zinc-700/60 p-6 rounded shadow-sm space-y-4">
                      <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-mono">
                        Active Job Escrow
                      </span>
                      <div className="space-y-1">
                        <span className="text-3xl font-black text-white block tracking-tight">
                          ₹{sellerData ? Number((sellerData as any).escrowBalance || 0).toLocaleString('en-IN') : '0'}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-bold block">
                          Escrow funds from active contracts
                        </span>
                      </div>
                    </div>

                    <div className="bg-zinc-800 border border-zinc-700/60 p-6 rounded shadow-sm space-y-4">
                      <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-mono text-emerald-600">
                        Cleared Earnings
                      </span>
                      <div className="space-y-1">
                        <span className="text-3xl font-black text-emerald-600 block tracking-tight">
                          ₹{sellerData ? Number((sellerData as any).clearedEarnings || 0).toLocaleString('en-IN') : '0'}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-bold block">
                          Released funds available for payout
                        </span>
                      </div>
                    </div>

                    <div className="bg-zinc-800 border border-zinc-700/60 p-6 rounded shadow-sm space-y-3">
                      <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-mono">
                        Payout Preferences
                      </span>
                      <div className="space-y-1 bg-zinc-900/70 border border-zinc-700/60/40 p-3 rounded text-[11px] font-semibold text-zinc-350">
                        <p className="flex justify-between">
                          <span>Bank Account:</span>
                          <span className="text-slate-900 font-bold">•••• 4820</span>
                        </p>
                        <p className="flex justify-between mt-1">
                          <span>IFS Code:</span>
                          <span className="text-slate-900 font-bold">HDFC0000104</span>
                        </p>
                        <p className="flex justify-between mt-1">
                          <span>Settlement Period:</span>
                          <span className="text-slate-900 font-bold">T+2 Days</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Chart and Ledger */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Velocity Chart */}
                    <div className="bg-zinc-800 border border-zinc-700/60 p-6 rounded shadow-sm space-y-4">
                      <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-mono">
                        Weekly Sales Velocity
                      </span>

                      <div className="flex items-end justify-between h-40 pt-4 px-2">
                        {sellerData?.earningsVelocity.map((item, idx) => {
                          const maxVal = Math.max(...sellerData.earningsVelocity.map(v => v.amount), 1);
                          const barHeight = Math.max(8, (item.amount / maxVal) * 100);
                          return (
                            <div key={idx} className="flex flex-col items-center gap-2 w-12 group">
                              <span className="text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                ₹{item.amount.toLocaleString('en-IN')}
                              </span>
                              <div className="w-8 bg-[#E2E8F0] hover:bg-cobalt rounded-t-sm transition-all duration-200" style={{ height: `${barHeight}%` }} />
                              <span className="text-[9px] font-mono font-bold text-zinc-400 block mt-1">
                                {item.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Job Ledger */}
                    <div className="bg-zinc-800 border border-zinc-700/60 rounded shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-zinc-700/60">
                        <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-mono">
                          Recent Contracts Ledger
                        </span>
                      </div>

                      {!sellerData || (sellerData.activeJobs.length === 0 && sellerData.completedJobs.length === 0) ? (
                        <div className="p-8 text-center text-xs font-semibold text-zinc-400">
                          No recent custom jobs completed or active.
                        </div>
                      ) : (
                        <div className="divide-y divide-[#E4E4E7] text-[11px]">
                          {[...(sellerData.activeJobs || []), ...(sellerData.completedJobs || [])]
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map(job => {
                              const isCleared = job.status === 'Completed' || job.status === 'Delivered';
                              return (
                                <div key={job.id} className="p-4 flex justify-between items-center hover:bg-zinc-900/50 transition-all font-semibold">
                                  <div>
                                    <span className="block text-white font-bold">{job.rfq?.title || 'Custom Machining Contract'}</span>
                                    <span className="block text-[10px] text-zinc-400 font-mono mt-0.5">RFQ ID: {job.rfq_id?.slice(0, 8).toUpperCase() || 'N/A'}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="block text-white font-black">₹{Number(job.total_cost).toLocaleString('en-IN')}</span>
                                    <span className={`block text-[9px] font-mono uppercase tracking-wider font-bold ${isCleared ? 'text-emerald-600' : 'text-slate-500'
                                      }`}>
                                      {isCleared ? 'Cleared' : 'Escrow Active'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-6">

              {/* Profile Overview Banner */}
              <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6 justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cobalt/20 to-cobalt/5 border border-cobalt/25 flex items-center justify-center font-extrabold text-cobalt">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-white leading-none">{profile.full_name}</h2>
                      <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald rounded border border-emerald-500/20">
                        Verified Customer
                      </span>
                    </div>
                    <span className="block text-[11px] text-zinc-400 font-bold font-mono mt-1.5">{profile.email || 'guest@mechitall.io'}</span>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="flex items-center gap-8 text-center">
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-zinc-400 font-bold">Total Orders</span>
                    <span className="text-xl font-mono font-black text-white">{orders.length}</span>
                  </div>
                  <div className="border-l border-zinc-700/60 h-8"></div>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-zinc-400 font-bold">Active Shipments</span>
                    <span className="text-xl font-mono font-black text-cobalt">{activeShipmentsCount}</span>
                  </div>
                  <div className="border-l border-zinc-700/60 h-8"></div>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-zinc-400 font-bold">Wishlist Items</span>
                    <span className="text-xl font-mono font-black text-white">{wishlist.length}</span>
                  </div>
                </div>
              </div>

              {/* Bolts Wallet Card */}
              <div className="bg-zinc-800 border border-zinc-700/60 rounded p-6 shadow-sm relative overflow-hidden text-white flex flex-col md:flex-row justify-between gap-6">
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none"></div>

                <div className="space-y-4 z-10 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-5 h-5 text-amber-500 animate-pulse"
                      >
                        <polygon points="8,3 16,3 18,7 16,11 8,11 6,7" fill="none" />
                        <line x1="10" y1="3" x2="10" y2="11" />
                        <line x1="14" y1="3" x2="14" y2="11" />
                        <path d="M9,11v9c0,0.6 0.4,1 1,1h4c0.6,0 1,-0.4 1,-1v-9" />
                        <line x1="9" y1="13.5" x2="15" y2="12" />
                        <line x1="9" y1="16" x2="15" y2="14.5" />
                        <line x1="9" y1="18.5" x2="15" y2="17" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xs font-mono font-extrabold tracking-wider text-white">BOLTS WALLET</h3>
                      <span className="block text-[8px] text-zinc-500 font-bold font-mono uppercase tracking-wider">Nuts &amp; Bolts Reward Program</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block font-mono">Current Balance</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-mono font-black text-amber-600">{profile.wallet_balance}</span>
                      <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider font-mono">BOLTS</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar + Action */}
                <div className="z-10 md:w-5/12 flex flex-col justify-between text-xs space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between font-bold text-[9px] uppercase text-zinc-500 font-mono tracking-wider">
                      <span>Redemption Limit</span>
                      <span>100 Bolts / Order</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-2 rounded border border-zinc-700/60 overflow-hidden">
                      <div className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded" style={{ width: `${boltsProgressPercent}%` }}></div>
                    </div>
                    <span className="block text-[8px] text-zinc-500 font-bold font-mono uppercase tracking-wide">
                      *10 Bolts = ₹1.00 store credit. 45-day window applies.
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      showToast('Bolt balance applied automatically in the Cart drawer!', 'success');
                    }}
                    className="w-full bg-[#0f172a] hover:bg-[#06b6d4] text-white py-2.5 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
                  >
                    Redeem Now
                  </button>
                </div>
              </div>

              {/* Recent Purchases List */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-white tracking-tight uppercase">Recent Purchases</h3>
                  <span className="text-xs font-bold text-zinc-400">Total orders: {orders.length}</span>
                </div>

                {loadingOrders ? (
                  <div className="py-16 text-center bg-zinc-800 border border-zinc-700/60 rounded-2xl animate-pulse">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-400/30" />
                  </div>
                ) : orders.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {orders.slice(0, 3).map((ord) => {
                      const isSelected = selectedOrder?.id === ord.id;
                      return (
                        <div
                          key={ord.id}
                          onClick={() => setSelectedOrder(ord)}
                          className={`bg-zinc-800 border rounded-xl p-4 shadow-sm space-y-3 cursor-pointer transition-all ${isSelected ? 'border-cobalt ring-2 ring-cobalt/25' : 'border-zinc-700/60 hover:border-slate-text-secondary/20'
                            }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-mono text-[10px] font-black text-white">{ord.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${ord.status === 'Delivered' || ord.status === 'Completed'
                                ? 'bg-emerald-500/10 text-emerald border-emerald-500/20'
                                : ord.status === 'Shipped'
                                  ? 'bg-blue-500/10 text-cobalt border-blue-500/20'
                                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                              }`}>
                              {ord.status}
                            </span>
                          </div>

                          <div className="space-y-1 text-zinc-350 text-xs">
                            {ord.rfq_title && (
                              <h4 className="text-[10px] font-black text-white mb-1.5 line-clamp-1">{ord.rfq_title}</h4>
                            )}
                            <div className="flex justify-between">
                              <span className="text-[10px] text-zinc-400">Items Count</span>
                              <span className="font-bold text-white">{ord.items_count} units</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[10px] text-zinc-400">Order Total</span>
                              <span className="font-extrabold text-coral">₹{Number(ord.total_amount).toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-700/60/50">
                            <div className={`h-full rounded-full ${ord.status === 'Delivered' || ord.status === 'Completed'
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
                  <div className="text-center py-12 border border-dashed border-zinc-700/60 bg-zinc-800 rounded-2xl">
                    <ShoppingBag className="w-10 h-10 text-zinc-400/30 mx-auto mb-2" />
                    <p className="text-xs font-bold text-white">No purchases placed yet.</p>
                    <p className="text-[10px] text-zinc-400 mt-1">Configure parts or checkout catalog items to list purchases here.</p>
                  </div>
                )}
              </div>

              {/* Saved For Later (Wishlist) Carousel */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-white tracking-tight uppercase">Saved for Later</h3>
                  <button onClick={() => setActiveTab('wishlist')} className="text-xs font-bold text-cobalt hover:opacity-80 transition-opacity">
                    Manage Wishlist
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {dbProducts.filter(p => wishlist.includes(p.id)).length > 0 ? (
                    dbProducts.filter(p => wishlist.includes(p.id)).map((item) => (
                      <div key={item.id} className="bg-zinc-800 border border-zinc-700/60 rounded-xl p-4 shadow-sm flex flex-col justify-between h-48 hover:shadow-md transition-shadow relative">
                        <button
                          onClick={() => toggleWishlist(item.id)}
                          className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="space-y-1">
                          <span className="block text-[8px] uppercase tracking-wider font-extrabold text-zinc-400">{item.category}</span>
                          <h4 className="text-xs font-black text-white line-clamp-1 leading-tight">{item.title}</h4>
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
                      <div key={item.id} className="bg-zinc-800 border border-zinc-700/60 rounded-xl p-4 shadow-sm flex flex-col justify-between h-48 hover:shadow-md transition-shadow">
                        <div className="space-y-1">
                          <span className="block text-[8px] uppercase tracking-wider font-extrabold text-zinc-400">{item.category}</span>
                          <h4 className="text-xs font-black text-white line-clamp-1 leading-tight">{item.title}</h4>
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

                  <Link href="/products" className="bg-zinc-900/30 border border-dashed border-zinc-700/60 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-zinc-900/50 transition-colors h-48 group">
                    <Plus className="w-6 h-6 text-zinc-400 group-hover:scale-110 transition-transform mb-2" />
                    <span className="text-xs font-extrabold text-white leading-tight">Continue Shopping</span>
                    <span className="text-[9px] text-zinc-400 leading-tight mt-0.5">Browse latest arrivals</span>
                  </Link>
                </div>
              </div>

              {/* Shipment Tracking details progress timeline */}
              {selectedOrder && (
                <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-6 shadow-sm space-y-5">
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-700/60/50">
                    <span className="text-xs font-black text-white uppercase tracking-tight flex items-center gap-1.5">
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
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-zinc-900 -translate-y-1/2 rounded-full overflow-hidden border border-zinc-700/60/50">
                      <div className={`h-full rounded-full bg-cobalt transition-all duration-500 ${selectedOrder.status === 'Completed'
                          ? 'w-full'
                          : selectedOrder.status === 'Delivered'
                            ? 'w-3/4'
                            : selectedOrder.status === 'Shipped'
                              ? 'w-1/2'
                              : 'w-1/4'
                        }`}></div>
                    </div>

                    <div className="relative flex justify-between text-center text-[10px] font-bold text-zinc-350 z-10">
                      <div className="space-y-1">
                        <div className="w-6 h-6 rounded-full bg-cobalt text-white flex items-center justify-center mx-auto border-2 border-white shadow-md">✓</div>
                        <span className="block font-bold">Order Placed</span>
                        <span className="block text-[8px] text-zinc-400">Oct 24, 09:00</span>
                      </div>

                      <div className="space-y-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto border-2 border-white shadow-md ${selectedOrder.status !== 'Processing' && selectedOrder.status !== 'idle'
                            ? 'bg-cobalt text-white'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700/60'
                          }`}>
                          {selectedOrder.status === 'Processing' ? '●' : '✓'}
                        </div>
                        <span className="block font-bold">Processing</span>
                        <span className="block text-[8px] text-zinc-400">Oct 24, 14:30</span>
                      </div>

                      <div className="space-y-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto border-2 border-white shadow-md ${selectedOrder.status === 'Shipped' || selectedOrder.status === 'Delivered' || selectedOrder.status === 'Completed'
                            ? 'bg-cobalt text-white'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700/60'
                          }`}>
                          {selectedOrder.status === 'Shipped' ? '●' : selectedOrder.status === 'Delivered' || selectedOrder.status === 'Completed' ? '✓' : '3'}
                        </div>
                        <span className="block font-bold">Shipped</span>
                        <span className="block text-[8px] text-zinc-400">Oct 25, 08:00</span>
                      </div>

                      <div className="space-y-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto border-2 border-white shadow-md ${selectedOrder.status === 'Delivered' || selectedOrder.status === 'Completed'
                            ? 'bg-cobalt text-white'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700/60'
                          }`}>
                          {selectedOrder.status === 'Delivered' ? '●' : selectedOrder.status === 'Completed' ? '✓' : '4'}
                        </div>
                        <span className="block font-bold">Out for Delivery</span>
                        <span className="block text-[8px] text-zinc-400">At 11:35 AM</span>
                      </div>

                      <div className="space-y-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto border-2 border-white shadow-md ${selectedOrder.status === 'Completed'
                            ? 'bg-emerald text-white'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700/60'
                          }`}>
                          {selectedOrder.status === 'Completed' ? '✓' : '5'}
                        </div>
                        <span className="block font-bold">Delivered</span>
                        <span className="block text-[8px] text-zinc-400">Pending</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Section for Delivery Simulation and Escrow / Bolts Release */}
                  <div className="pt-4 border-t border-zinc-700/60/50 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-mono">Sandbox Actions</span>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Manage order sandbox simulation and claim rewards proof.</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {selectedOrder.rfq_id && (
                        <button
                          onClick={() => {
                            setActiveChatRfqId(selectedOrder.rfq_id);
                            setActiveTab('chats');
                          }}
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-lg cursor-pointer transition-all shadow"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Open Quote Chat</span>
                        </button>
                      )}

                      {selectedOrder.status === 'Processing' && (
                        <button
                          onClick={() => handleSimulateStatus(selectedOrder.id, 'Shipped')}
                          disabled={isPending}
                          className="btn-cobalt py-1.5 px-3 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          {isPending ? 'Processing...' : 'Simulate Ship'}
                        </button>
                      )}
                      {selectedOrder.status === 'Shipped' && (
                        <button
                          onClick={() => handleSimulateStatus(selectedOrder.id, 'Delivered')}
                          disabled={isPending}
                          className="btn-cobalt py-1.5 px-3 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          {isPending ? 'Processing...' : 'Simulate Delivery'}
                        </button>
                      )}

                      {/* Delivered -> Prominent Unboxing Claim Button */}
                      {selectedOrder.status === 'Delivered' && (
                        <div className="relative">
                          <label
                            htmlFor={`file-upload-${selectedOrder.id}`}
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-zinc-950 px-3 py-2 rounded-lg cursor-pointer transition-all shadow"
                          >
                            {uploadingOrderId === selectedOrder.id || isPending ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Crediting...
                              </>
                            ) : (
                              <>
                                <Camera className="w-3.5 h-3.5" />
                                Claim Bolts &amp; Release Escrow
                              </>
                            )}
                          </label>
                          <input
                            id={`file-upload-${selectedOrder.id}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUploadAndClaim(selectedOrder.id, e)}
                            disabled={uploadingOrderId !== null || isPending}
                          />
                        </div>
                      )}

                      {/* Completed state */}
                      {(selectedOrder.status === 'Completed' || selectedOrder.status === 'completed') && (
                        <div className="flex items-center gap-4">
                          {selectedOrder.unboxing_photo_url && (
                            <div className="relative w-10 h-10 rounded border border-zinc-700/60 overflow-hidden bg-zinc-900 shadow-sm">
                              <img
                                src={selectedOrder.unboxing_photo_url}
                                alt="Unboxing proof"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="text-right">
                            <span className="text-[10px] font-black text-emerald flex items-center gap-1 justify-end uppercase tracking-wider">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Escrow Released (PayU)
                            </span>
                            <span className="text-[8px] font-mono text-zinc-400 block uppercase tracking-wider">
                              Nodal Payout Confirmed
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REWARDS & OFFERS */}
          {activeTab === 'rewards' && (
            <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-black text-white tracking-tight uppercase">Loyalty Ledger</h2>
                <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                  Detailed ledger history logs of your earned and spent Nuts &amp; Bolts loyalty tokens.
                </p>
              </div>

              {loadingTx ? (
                <div className="py-12 text-center animate-pulse">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-400/30" />
                </div>
              ) : transactions.length > 0 ? (
                <div className="border border-zinc-700/60 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs font-bold border-collapse">
                    <thead>
                      <tr className="bg-zinc-900 border-b border-zinc-700/60 text-[10px] uppercase text-zinc-400 tracking-wider">
                        <th className="p-3">Transaction details</th>
                        <th className="p-3">Reference Order</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Expirations</th>
                        <th className="p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-border/50 text-zinc-350">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-zinc-900/30">
                          <td className="p-3 font-bold text-white">{tx.description}</td>
                          <td className="p-3 font-mono text-[10px]">{tx.order_id || '—'}</td>
                          <td className="p-3">
                            <span className={tx.amount > 0 ? "text-emerald" : "text-rose-500"}>
                              {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Bolts
                            </span>
                          </td>
                          <td className="p-3 font-medium text-zinc-400 text-[10px]">
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
                <div className="text-center py-12 border border-dashed border-zinc-700/60 rounded-2xl bg-zinc-900/20">
                  <Gift className="w-8 h-8 text-zinc-400/30 mx-auto mb-2" />
                  <p className="text-xs font-bold text-white">No rewards logs listed.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-black text-white tracking-tight uppercase">My Wishlist</h2>
                <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                  Items you saved for later purchase or comparison checks.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dbProducts.filter(p => wishlist.includes(p.id)).length > 0 ? (
                  dbProducts.filter(p => wishlist.includes(p.id)).map((item) => (
                    <div key={item.id} className="bg-zinc-800 border border-zinc-700/60 rounded-xl p-5 shadow-sm flex flex-col justify-between relative group hover:shadow-md transition-shadow">
                      <div className="space-y-2">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border bg-zinc-900 text-zinc-400 w-fit block">{item.category}</span>
                        <h3 className="text-sm font-black text-white leading-tight line-clamp-1">{item.title}</h3>
                        <p className="text-xs text-zinc-400 line-clamp-2">{item.description}</p>
                      </div>

                      <div className="pt-4 border-t border-zinc-700/60/50 mt-4 flex items-center justify-between gap-2">
                        <span className="text-sm font-black text-coral">₹{item.price.toFixed(2)}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleWishlist(item.id)}
                            className="px-2.5 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            title="Remove from Wishlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
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
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-16 border border-dashed border-zinc-700/60 rounded-2xl bg-zinc-900/10">
                    <Heart className="w-10 h-10 text-zinc-400/30 mx-auto mb-2 animate-pulse" />
                    <p className="text-xs font-bold text-white">Your wishlist is empty.</p>
                    <p className="text-[10px] text-zinc-400 mt-1 leading-normal">
                      Tap the heart icon on any product in the Parts Catalog to save items here!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ACCOUNT SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-black text-white tracking-tight uppercase">Account Settings</h2>
                <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                  Update your contact details and edit your shopper account parameters.
                </p>
              </div>

              <form onSubmit={handleUpdateNameSubmit} className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-zinc-350 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profile.email || 'guest@mechitall.io'}
                    className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/50 text-zinc-400 focus:outline-none cursor-not-allowed"
                  />
                  <span className="block text-[9px] text-zinc-400 font-bold">Email address updates require secondary authorization.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-zinc-350 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={isUpdatingName}
                    placeholder="Elias Thorne"
                    className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-cobalt transition-colors"
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
            <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-black text-white tracking-tight uppercase">Address Book</h2>
                  <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
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
                <div className="border border-zinc-700/60 rounded-xl p-4 space-y-3 relative">
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[8px] font-black uppercase bg-zinc-900 text-zinc-400 border">Default</span>
                  <div className="space-y-1">
                    <span className="block text-xs font-black text-white">Elias Thorne</span>
                    <span className="block text-[11px] text-zinc-350 font-semibold">
                      12, Industrial Development Block C<br />
                      Peenya Phase 1, Bangalore<br />
                      Karnataka - 560058, India
                    </span>
                    <span className="block text-[10px] text-zinc-400 font-bold font-mono pt-1">Phone: +91 98450 12345</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CUSTOMER SUPPORT */}
          {activeTab === 'support' && (
            <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-black text-white tracking-tight uppercase">Customer Support</h2>
                <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                  Get support for customized orders, CAD checks, or rewards settlements.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex gap-3 p-4 bg-zinc-900 border border-zinc-700/60 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-cobalt/10 text-cobalt flex items-center justify-center shrink-0">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">Direct Ticket Desk</h4>
                      <p className="text-[10px] text-zinc-400 mt-0.5 font-semibold">Raise tickets for manual engineering inspection or billing audits.</p>
                      <button onClick={() => showToast('Chat channels will open in a separate drawer.', 'success')} className="mt-2 text-[10px] font-extrabold text-cobalt hover:opacity-80 transition-opacity">Start chat session →</button>
                    </div>
                  </div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); showToast('Support ticket raised successfully.', 'success'); }} className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-350 uppercase">Subject</label>
                    <input type="text" placeholder="e.g. NEMA 23 CAD model dimensions" className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-cobalt" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-350 uppercase">Message details</label>
                    <textarea rows={3} placeholder="Please specify your request details..." className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-cobalt resize-none"></textarea>
                  </div>
                  <button type="submit" className="w-full btn-cobalt py-3 rounded-lg text-xs font-bold cursor-pointer">Submit Ticket</button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'chats' && (
            <QuotationChatsTab
              profile={profile}
              showToast={showToast}
              onUnreadChange={checkUnreadChats}
              initialActiveRfqId={activeChatRfqId}
              onClearInitialActiveRfqId={() => setActiveChatRfqId(null)}
            />
          )}

        </section>

      </main>



      <Footer />

      {/* Add Listing Modal */}
      {showAddListingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={() => setShowAddListingModal(false)} />
          <div className="bg-zinc-800 border border-zinc-700/60 rounded-xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative z-10 animate-slide-in space-y-4 font-mono text-left">
            <div className="flex justify-between items-start pb-3 border-b border-zinc-700/60">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Seller Workspace</span>
                <h3 className="text-base font-bold text-white uppercase font-['Space_Grotesk']">Create Technical Listing</h3>
              </div>
              <button onClick={() => setShowAddListingModal(false)} className="p-1.5 rounded hover:bg-zinc-900 border border-zinc-700/60 text-zinc-500 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (publishingListing) return;
              setPublishingListing(true);

              try {
                const target = e.target as any;
                const title = target.title.value.trim();
                const type = target.type.value;
                const price = Number(target.price.value) || 0;
                const desc = target.description.value.trim();
                const gradient = imagePreviews.length > 0 ? 'custom-image' : 'from-cobalt/20 to-cobalt/5 border-cobalt/20';

                if (type === 'Product') {
                  const sku = target.sku.value.trim();
                  const category = selectedCategory === 'Other' ? target.customCategory.value.trim() : selectedCategory;
                  const stock = Number(target.stock.value) || 0;

                  const newProduct = {
                    id: crypto.randomUUID ? crypto.randomUUID() : 'prod-' + Math.random().toString(36).substr(2, 9),
                    part_number: sku,
                    title: title,
                    category: category,
                    price: price,
                    stock: stock,
                    description: desc,
                    gradient_class: gradient,
                    image_data: imagePreviews[0] || undefined,
                    images_data: imagePreviews || [],
                    specs: customSpecs.reduce((acc, curr) => {
                      if (curr.key.trim()) {
                        acc[curr.key.trim()] = curr.value.trim();
                      }
                      return acc;
                    }, {} as Record<string, string>),
                    bulk_pricing: enableBulkPricing ? [
                      { minQty: 10, pricePerUnit: Number(target.tierPrice1?.value) || price },
                      { minQty: 50, pricePerUnit: Number(target.tierPrice2?.value) || price }
                    ] : [],
                    datasheet_url: datasheetFile ? datasheetFile.dataUrl : '',
                    cad_file: cadFile ? cadFile.dataUrl : '',
                    extended_specs: {
                      ingressProtection: target.ipRating.value.trim(),
                      mtbf: target.mtbf.value.trim(),
                      dimensions: 'Standard Frame'
                    }
                  };

                  const updatedProds = [...localProducts, newProduct];
                  setLocalProducts(updatedProds);
                  localStorage.setItem('local_listed_products', JSON.stringify(updatedProds));

                  // Submit to database via server action (handles auth + seller_profile_id)
                  try {
                    await submitProductListing({
                      part_number: sku,
                      title: title,
                      category: category,
                      price: price,
                      stock: stock,
                      description: desc,
                      gradient_class: gradient,
                      image_data: imagePreviews[0] || undefined,
                      images_data: imagePreviews || [],
                      specs: newProduct.specs,
                      bulk_pricing: newProduct.bulk_pricing,
                      datasheet_url: newProduct.datasheet_url,
                      cad_file: newProduct.cad_file,
                      extended_specs: newProduct.extended_specs,
                    });
                    // Remove from localStorage once DB confirmed
                    const withoutNew = updatedProds.filter((p: any) => p.id !== newProduct.id);
                    setLocalProducts(withoutNew);
                    localStorage.setItem('local_listed_products', JSON.stringify(withoutNew));
                    showToast(`Technical Product "${title}" (${sku}) published and live in marketplace!`, 'success');
                  } catch (dbErr: any) {
                    console.warn('DB insert failed, product saved locally:', dbErr?.message);
                    showToast(`Product saved locally. DB error: ${dbErr?.message || 'Unknown'}`, 'error');
                  }
                } else {
                  const processType = selectedProcessType === 'Other'
                    ? target.customProcessType.value.trim()
                    : selectedProcessType;
                  const leadTime = target.leadTime.value.trim();
                  const materials = target.materials.value.trim();
                  const finishes = target.finishes.value.trim();

                  const newService = {
                    id: crypto.randomUUID ? crypto.randomUUID() : 'serv-' + Math.random().toString(36).substr(2, 9),
                    title: title,
                    category: processType,
                    base_price: price,
                    lead_time: `${leadTime} Lead`,
                    features: materials.split(',').map((s: string) => s.trim()).filter(Boolean),
                    gradient_class: gradient,
                    image_data: imagePreviews[0] || undefined,
                    images_data: imagePreviews || []
                  };

                  const updatedServs = [...localServices, newService];
                  setLocalServices(updatedServs);
                  localStorage.setItem('local_listed_services', JSON.stringify(updatedServs));

                  // 1. Submit general service listing via Server Action
                  try {
                    await submitServiceListing({
                      title: newService.title,
                      category: newService.category,
                      description: desc,
                      base_price: newService.base_price,
                      lead_time: newService.lead_time,
                      features: newService.features,
                      gradient_class: newService.gradient_class,
                      image_data: newService.image_data,
                      images_data: newService.images_data
                    });
                  } catch (err) {
                    console.warn('Failed to submit general service catalog listing:', err);
                  }

                  // 2. Submit custom machining capability via Server Action
                  try {
                    await listMachiningService(profile.id, {
                      title: title,
                      processType: processType as any,
                      description: desc,
                      basePrice: price,
                      leadTime: leadTime,
                      materials: materials.split(',').map((s: string) => s.trim()).filter(Boolean),
                      finishes: finishes.split(',').map((s: string) => s.trim()).filter(Boolean),
                    });
                    // Refresh seller registry
                    await fetchSellerData();
                  } catch (err) {
                    console.warn('Failed to submit custom machining capability:', err);
                  }

                  showToast(`Technical Service "${title}" (${processType}) published successfully!`, 'success');
                }

                setImagePreviews([]);
                setImageFileNames([]);
                setShowAddListingModal(false);
              } finally {
                setPublishingListing(false);
              }
            }} className="space-y-4">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">

                {/* LEFT COLUMN: Basic Info & Tech Specifications */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase">Listing Type</label>
                    <select
                      name="type"
                      value={listingType}
                      onChange={(e) => setListingType(e.target.value as any)}
                      className="w-full text-xs font-bold p-2 border border-zinc-700/60 bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]"
                    >
                      <option value="Product">Catalog Product</option>
                      <option value="Service">Custom Machining Service</option>
                    </select>
                  </div>

                  {listingType === 'Product' ? (
                    <>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase">Part Number / SKU *</label>
                        <input required type="text" name="sku" placeholder="e.g. ACT-NEMA34-CL" className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase">Title / Name *</label>
                        <input required type="text" name="title" placeholder="e.g. NEMA 34 Stepper Motor" className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase">Category *</label>
                          <select
                            name="category"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full text-xs font-bold p-2 border border-zinc-700/60 bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4] rounded"
                          >
                            <option value="Actuators">Actuators</option>
                            <option value="Sensors">Sensors</option>
                            <option value="Controllers">Controllers</option>
                            <option value="Mechanical">Mechanical</option>
                            <option value="Power Supplies">Power Supplies</option>
                            <option value="Optics">Optics</option>
                            <option value="Other">Other (Custom)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase">Stock Qty *</label>
                          <input required type="number" name="stock" placeholder="e.g. 10" min={0} className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                        </div>
                      </div>

                      {selectedCategory === 'Other' && (
                        <div className="space-y-1 animate-slide-in">
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase">Enter Custom Category *</label>
                          <input required type="text" name="customCategory" placeholder="e.g. Pneumatics" className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase">Unit Price (INR) *</label>
                        <input required type="number" name="price" placeholder="e.g. 24500" className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                      </div>

                      {/* Technical Specifications */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase">Tech Specifications (Key-Value)</label>
                          <button
                            type="button"
                            onClick={() => setCustomSpecs([...customSpecs, { id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(), key: '', value: '' }])}
                            className="text-[#06b6d4] hover:text-[#0b9cb5] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add Spec
                          </button>
                        </div>
                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 no-scrollbar">
                          {customSpecs.map((spec) => (
                            <div key={spec.id} className="flex gap-2 items-center">
                              <input
                                type="text"
                                placeholder="Key (e.g. Weight)"
                                value={spec.key}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCustomSpecs(prev => prev.map(s => s.id === spec.id ? { ...s, key: val } : s));
                                }}
                                className="w-[45%] text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Value (e.g. 2.4 kg)"
                                value={spec.value}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCustomSpecs(prev => prev.map(s => s.id === spec.id ? { ...s, value: val } : s));
                                }}
                                className="w-[45%] text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => setCustomSpecs(prev => prev.filter(s => s.id !== spec.id))}
                                className="p-1 rounded hover:bg-zinc-900 border border-zinc-700/60 text-red-500 cursor-pointer"
                                title="Remove Specification"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase">Service Title *</label>
                        <input required type="text" name="title" placeholder="e.g. 5-Axis CNC Machining" className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase">Process Type *</label>
                        <select
                          name="processType"
                          value={selectedProcessType}
                          onChange={(e) => setSelectedProcessType(e.target.value)}
                          className="w-full text-xs font-bold p-2 border border-zinc-700/60 bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4] rounded"
                        >
                          <option value="CNC Machining">CNC Machining</option>
                          <option value="3D Printing">3D Printing</option>
                          <option value="Sheet Metal">Sheet Metal</option>
                          <option value="Laser Cutting">Laser Cutting</option>
                          <option value="Other">Other (Custom)</option>
                        </select>
                      </div>

                      {selectedProcessType === 'Other' && (
                        <div className="space-y-1 animate-slide-in">
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase">Enter Custom Process Type *</label>
                          <input required type="text" name="customProcessType" placeholder="e.g. Waterjet Cutting" className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase">Base Cost / Setup Fee (INR) *</label>
                        <input required type="number" name="price" placeholder="e.g. 7500" className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase">Estimated Lead Time *</label>
                        <input required type="text" name="leadTime" placeholder="e.g. 3-5 Days" className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                      </div>
                    </>
                  )}
                </div>

                {/* RIGHT COLUMN: Assets, Documents & Tiers */}
                <div className="space-y-3">
                  {listingType === 'Product' ? (
                    <>
                      {/* Image Upload Area */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase">Product Images (.jpg, .png, .svg) *</label>
                        <div
                          onDragEnter={(e) => handleDrag(e, 'image')}
                          onDragOver={(e) => handleDrag(e, 'image')}
                          onDragLeave={(e) => handleDrag(e, 'image')}
                          onDrop={(e) => handleDrop(e, 'image')}
                          className={`relative border-2 border-dashed rounded p-3 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer ${dragActiveImage ? 'border-[#06b6d4] bg-[#06b6d4]/5' : 'border-zinc-700/60 hover:border-[#76777d]'
                            }`}
                        >
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.svg"
                            multiple
                            onChange={(e) => {
                              if (e.target.files) {
                                Array.from(e.target.files).forEach(file => processFile(file, 'image'));
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <Upload className="w-5 h-5 text-zinc-500" />
                          <span className="text-[10px] text-zinc-400 font-bold leading-tight">
                            {imagePreviews.length > 0 ? `Selected ${imagePreviews.length} Image(s)` : 'Drag & Drop or Click to Upload Images (Multiple)'}
                          </span>
                        </div>
                        {imagePreviews.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-2">
                            {imagePreviews.map((src, index) => (
                              <div key={index} className="relative w-10 h-10 border border-zinc-700/60 overflow-hidden rounded group">
                                <img src={src} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImagePreviews(prev => prev.filter((_, i) => i !== index));
                                    setImageFileNames(prev => prev.filter((_, i) => i !== index));
                                  }}
                                  className="absolute top-0.5 right-0.5 bg-red-500 hover:bg-red-700 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-black cursor-pointer shadow-sm"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Datasheet Upload Area */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase">Technical Datasheet (PDF)</label>
                        <div
                          onDragEnter={(e) => handleDrag(e, 'datasheet')}
                          onDragOver={(e) => handleDrag(e, 'datasheet')}
                          onDragLeave={(e) => handleDrag(e, 'datasheet')}
                          onDrop={(e) => handleDrop(e, 'datasheet')}
                          className={`relative border-2 border-dashed rounded p-3 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer ${dragActiveDatasheet ? 'border-[#06b6d4] bg-[#06b6d4]/5' : 'border-zinc-700/60 hover:border-[#76777d]'
                            }`}
                        >
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                processFile(e.target.files[0], 'datasheet');
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <FileText className="w-4 h-4 text-zinc-500" />
                          <span className="text-[10px] text-zinc-400 font-bold leading-tight">
                            {datasheetFile ? `Uploaded: ${datasheetFile.name}` : 'Drag & Drop or Click to Upload PDF'}
                          </span>
                        </div>
                        {datasheetFile && (
                          <div className="flex justify-between items-center text-[9px] font-bold uppercase mt-1">
                            <span className="text-emerald">{datasheetFile.size}</span>
                            <button
                              type="button"
                              onClick={() => setDatasheetFile(null)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove PDF
                            </button>
                          </div>
                        )}
                      </div>

                      {/* CAD Model Upload Area */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase">3D CAD Model (STEP, STP, IGES)</label>
                        <div
                          onDragEnter={(e) => handleDrag(e, 'cad')}
                          onDragOver={(e) => handleDrag(e, 'cad')}
                          onDragLeave={(e) => handleDrag(e, 'cad')}
                          onDrop={(e) => handleDrop(e, 'cad')}
                          className={`relative border-2 border-dashed rounded p-3 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer ${dragActiveCad ? 'border-[#06b6d4] bg-[#06b6d4]/5' : 'border-zinc-700/60 hover:border-[#76777d]'
                            }`}
                        >
                          <input
                            type="file"
                            accept=".step,.stp,.iges,.igs"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                processFile(e.target.files[0], 'cad');
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <Settings className="w-4 h-4 text-zinc-500" />
                          <span className="text-[10px] text-zinc-400 font-bold leading-tight">
                            {cadFile ? `Uploaded: ${cadFile.name}` : 'Drag & Drop or Click to Upload CAD'}
                          </span>
                        </div>
                        {cadFile && (
                          <div className="flex justify-between items-center text-[9px] font-bold uppercase mt-1">
                            <span className="text-emerald">{cadFile.size}</span>
                            <button
                              type="button"
                              onClick={() => setCadFile(null)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove CAD
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase">Ingress Rating</label>
                          <input type="text" name="ipRating" placeholder="e.g. IP65" className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase">MTBF Lifespan</label>
                          <input type="text" name="mtbf" placeholder="e.g. 50,000 Hours" className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                        </div>
                      </div>

                      {/* Volume Pricing Tiers */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase">Enable Bulk Pricing</label>
                          <label className="relative inline-flex items-center cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={enableBulkPricing}
                              onChange={(e) => setEnableBulkPricing(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-8 h-4 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-800 after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#06b6d4]"></div>
                          </label>
                        </div>
                        {enableBulkPricing && (
                          <div className="space-y-2 border border-zinc-700/60 p-2.5 rounded bg-zinc-900 animate-slide-in">
                            <div className="flex gap-2 items-center">
                              <span className="text-[10px] text-zinc-500 font-bold font-mono w-[60px]">10+ Qty:</span>
                              <input required type="number" name="tierPrice1" placeholder="Discount price (INR)" className="flex-1 text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none" />
                            </div>
                            <div className="flex gap-2 items-center">
                              <span className="text-[10px] text-zinc-500 font-bold font-mono w-[60px]">50+ Qty:</span>
                              <input required type="number" name="tierPrice2" placeholder="Discount price (INR)" className="flex-1 text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none" />
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase">Material Capabilities (Comma-separated) *</label>
                        <input required type="text" name="materials" placeholder="e.g. Aluminum 6061, Brass, Steel 1018, Delrin" className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase">Finishing Options (Comma-separated) *</label>
                        <input required type="text" name="finishes" placeholder="e.g. Anodized (Black/Clear), Bead Blasted, Raw" className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                      </div>

                      {/* Image Upload Area for Service */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase">Service Images (.jpg, .png, .svg)</label>
                        <div
                          onDragEnter={(e) => handleDrag(e, 'image')}
                          onDragOver={(e) => handleDrag(e, 'image')}
                          onDragLeave={(e) => handleDrag(e, 'image')}
                          onDrop={(e) => handleDrop(e, 'image')}
                          className={`relative border-2 border-dashed rounded p-3 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer ${dragActiveImage ? 'border-[#06b6d4] bg-[#06b6d4]/5' : 'border-zinc-700/60 hover:border-[#76777d]'
                            }`}
                        >
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.svg"
                            multiple
                            onChange={(e) => {
                              if (e.target.files) {
                                Array.from(e.target.files).forEach(file => processFile(file, 'image'));
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <Upload className="w-5 h-5 text-zinc-500" />
                          <span className="text-[10px] text-zinc-400 font-bold leading-tight">
                            {imagePreviews.length > 0 ? `Selected ${imagePreviews.length} Image(s)` : 'Drag & Drop or Click to Upload Images (Multiple)'}
                          </span>
                        </div>
                        {imagePreviews.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-2">
                            {imagePreviews.map((src, index) => (
                              <div key={index} className="relative w-10 h-10 border border-zinc-700/60 overflow-hidden rounded group">
                                <img src={src} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImagePreviews(prev => prev.filter((_, i) => i !== index));
                                    setImageFileNames(prev => prev.filter((_, i) => i !== index));
                                  }}
                                  className="absolute top-0.5 right-0.5 bg-red-500 hover:bg-red-700 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-black cursor-pointer shadow-sm"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase">Description / Scope of Service</label>
                    <textarea rows={listingType === 'Service' ? 5 : 2} name="description" placeholder="Specify technical details, machine tools, dimensional limits..." className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4] resize-none" />
                  </div>
                </div>

              </div>

              <div className="flex gap-3 pt-3 border-t border-zinc-700/60">
                <button
                  type="submit"
                  disabled={publishingListing}
                  className="flex-1 bg-[#0f172a] hover:bg-[#06b6d4] text-white py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer text-center disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {publishingListing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <span>Publish</span>
                  )}
                </button>
                <button type="button" onClick={() => setShowAddListingModal(false)} className="flex-1 border border-zinc-700/60 hover:bg-zinc-900 text-zinc-500 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Seller KYC Modal */}
      {showKYCModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
            onClick={() => setShowKYCModal(false)}
          ></div>

          {/* Modal Container */}
          <div className="bg-zinc-800/95 backdrop-blur-lg border border-slate-200/50 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative z-10 animate-fade-in-down max-h-[90vh] overflow-y-auto no-scrollbar space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#0B1528]/10 text-[#0B1528] flex items-center justify-center mx-auto shadow-sm">
                <Cpu className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-lg font-black text-white tracking-tight uppercase">Seller Registration &amp; KYC</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed font-semibold">
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
                <label className="block text-[10px] font-bold text-zinc-350 uppercase">Company / Shop Name *</label>
                <input
                  type="text"
                  name="companyName"
                  required
                  placeholder="e.g. Precision CNC Lab Ltd."
                  className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#007084]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-350 uppercase">Tax Identification ID (GSTIN/EIN) *</label>
                <input
                  type="text"
                  name="taxId"
                  required
                  placeholder="e.g. 27AAAAA1111A1Z1"
                  className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#007084]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-zinc-350 uppercase">Machine Count</label>
                  <input
                    type="number"
                    name="machineCount"
                    min={0}
                    defaultValue={1}
                    className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#007084]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-zinc-350 uppercase">Primary Capability *</label>
                  <select
                    name="primaryCapability"
                    required
                    className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#007084]"
                  >
                    <option value="CNC Machining">CNC Machining</option>
                    <option value="3D Printing">3D Printing</option>
                    <option value="Sheet Metal Fabrication">Sheet Metal Fabrication</option>
                    <option value="Laser Cutting">Laser Cutting</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-350 uppercase">Business Address *</label>
                <textarea
                  name="businessAddress"
                  required
                  rows={2}
                  placeholder="Street, City, Zip Code..."
                  className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#007084] resize-none"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKYCModal(false)}
                  className="flex-1 py-3 rounded-lg border border-zinc-700/60 hover:bg-zinc-900 text-xs font-bold text-zinc-350 cursor-pointer transition-colors"
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

function QuotationChatsTab({
  profile,
  showToast,
  onUnreadChange,
  initialActiveRfqId,
  onClearInitialActiveRfqId
}: {
  profile: any;
  showToast: any;
  onUnreadChange?: () => void;
  initialActiveRfqId: string | null;
  onClearInitialActiveRfqId: () => void;
}) {
  const supabase = createClient();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [offerPrice, setOfferPrice] = useState(0);
  const [offerQuantity, setOfferQuantity] = useState(1);
  const [offerMaterial, setOfferMaterial] = useState('');
  const [offerFinish, setOfferFinish] = useState('');
  const [sellerNotes, setSellerNotes] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [showCounterForm, setShowCounterForm] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll the chat messages log container to the bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // Focus and activate a specific RFQ chat thread when navigated from order details/dashboard cards
  useEffect(() => {
    if (initialActiveRfqId && threads.length > 0) {
      const thread = threads.find(t => t.rfqId === initialActiveRfqId);
      if (thread) {
        setActiveThread(thread);
      } else {
        showToast('Chat thread not found for this order.', 'error');
      }
      onClearInitialActiveRfqId();
    }
  }, [initialActiveRfqId, threads]);

  useEffect(() => {
    const channel = supabase
      .channel('active-chat-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        async (payload: any) => {
          const newMsg = payload.new;
          if (activeThread && newMsg.quote_id === activeThread.quoteId) {
            setMessages((prev) => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            markThreadAsSeen(activeThread.quoteId, newMsg.created_at, activeThread.status);
          }
          const res = await getOngoingChats();
          if (res.success && res.data) {
            setThreads(res.data);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'machining_quotes' },
        async (payload: any) => {
          const updatedQuote = payload.new;
          if (activeThread && updatedQuote.id === activeThread.machiningQuote?.id) {
            setActiveThread((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                status: updatedQuote.status === 'Accepted' ? 'ACCEPTED' : updatedQuote.status === 'Rejected' ? 'REJECTED' : prev.status,
                machiningQuote: {
                  ...prev.machiningQuote!,
                  ...updatedQuote,
                  offer_price: updatedQuote.offer_price ? Number(updatedQuote.offer_price) : null,
                }
              };
            });
          }
          const res = await getOngoingChats();
          if (res.success && res.data) {
            setThreads(res.data);
          }
        }
      )
      .subscribe((status, err) => {
        if (err) console.error('Active Chat Realtime subscription error:', err);
        else console.log('Active Chat Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeThread, supabase]);

  const markThreadAsSeen = (threadId: string, lastMessageTime: string | null, status: string) => {
    try {
      const seenChatsStr = localStorage.getItem('mechitall_seen_chats');
      const seenChats = seenChatsStr ? JSON.parse(seenChatsStr) : {};
      seenChats[threadId] = {
        lastMessageTime: lastMessageTime || new Date().toISOString(),
        status
      };
      localStorage.setItem('mechitall_seen_chats', JSON.stringify(seenChats));
      if (onUnreadChange) {
        onUnreadChange();
      }
    } catch (err) {
      console.error('Failed to update local storage seen chats:', err);
    }
  };

  // Load threads
  const loadThreads = async () => {
    setLoading(true);
    const res = await getOngoingChats();
    if (res.success && res.data) {
      setThreads(res.data);
      if (onUnreadChange) {
        onUnreadChange();
      }

      // Auto-select thread based on URL param or default to first
      const params = new URLSearchParams(window.location.search);
      const quoteIdParam = params.get('quoteId') || params.get('thread');
      if (quoteIdParam) {
        const found = res.data.find(t => t.quoteId === quoteIdParam);
        if (found) {
          selectThread(found);
        } else if (res.data.length > 0) {
          selectThread(res.data[0]);
        }
      } else if (res.data.length > 0) {
        selectThread(res.data[0]);
      }
    } else {
      showToast(res.error || 'Failed to load chat threads', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadThreads();
  }, []);

  // Update offer form states when active thread changes
  useEffect(() => {
    if (activeThread?.machiningQuote) {
      const mq = activeThread.machiningQuote;
      setOfferPrice(mq.offer_price || 0);
      setOfferQuantity(mq.quantity || 1);
      setOfferMaterial(mq.selected_material || mq.material_capabilities[0] || 'Aluminium 6061');
      setOfferFinish(mq.selected_finish || mq.finish_options[0] || 'As-Machined');
      setSellerNotes(mq.seller_notes || '');
    } else {
      setOfferPrice(0);
      setOfferQuantity(1);
      setOfferMaterial('');
      setOfferFinish('');
      setSellerNotes('');
    }
  }, [activeThread]);

  // Subscribe to real-time message inserts
  useEffect(() => {
    if (!activeThread) return;

    const loadMessages = async () => {
      const res = await getChatMessages(activeThread.quoteId);
      if (res.success && res.data) {
        setMessages(res.data);
      } else {
        showToast(res.error || 'Failed to load chat messages', 'error');
      }
    };

    loadMessages();

    // Subscribe to Postgres changes on this specific quote_id
    const channel = supabase
      .channel(`chat_messages:${activeThread.quoteId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `quote_id=eq.${activeThread.quoteId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;

          // Determine sender_name
          const senderName = newMsg.sender_id === profile.id
            ? (profile.full_name || 'You')
            : (activeThread.otherParticipantName || 'Other');

          const formattedMsg: ChatMessage = {
            id: newMsg.id,
            rfq_id: newMsg.rfq_id,
            quote_id: newMsg.quote_id,
            sender_id: newMsg.sender_id,
            message_text: newMsg.message_text,
            file_attachment_path: newMsg.file_attachment_path,
            created_at: newMsg.created_at,
            sender_name: senderName
          };

          // Append if not already present
          setMessages((prev) => {
            if (prev.some(m => m.id === formattedMsg.id)) return prev;
            return [...prev, formattedMsg];
          });

          // Mark as seen immediately if we are actively viewing this thread
          markThreadAsSeen(activeThread.quoteId, formattedMsg.created_at, activeThread.status);

          // Update thread in list
          setThreads((prev) =>
            prev.map((t) =>
              t.quoteId === activeThread.quoteId
                ? { ...t, lastMessageText: formattedMsg.message_text, lastMessageTime: formattedMsg.created_at }
                : t
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeThread, profile?.id, profile?.full_name]);

  const selectThread = async (thread: ChatThread) => {
    setActiveThread(thread);
    setShowCounterForm(false);

    if (thread.machiningQuote) {
      setOfferPrice(thread.machiningQuote.offer_price || 0);
      setOfferQuantity(thread.machiningQuote.quantity || 1);
      setOfferMaterial(thread.machiningQuote.selected_material || thread.machiningQuote.material_capabilities[0] || '');
      setOfferFinish(thread.machiningQuote.selected_finish || thread.machiningQuote.finish_options[0] || '');
      setSellerNotes(thread.machiningQuote.seller_notes || '');
    } else {
      setOfferPrice(0);
      setOfferQuantity(1);
      setOfferMaterial('');
      setOfferFinish('');
      setSellerNotes('');
    }

    setLoadingMessages(true);
    markThreadAsSeen(thread.quoteId, thread.lastMessageTime, thread.status);
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
      markThreadAsSeen(activeThread.quoteId, res.data!.created_at, activeThread.status);
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

  const handleRejectQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !rejectionReasonInput.trim()) return;

    setRejecting(true);
    const res = await rejectQuote(activeThread.quoteId, activeThread.rfqId, rejectionReasonInput.trim());
    if (res.success) {
      showToast('Quotation rejected and status updated.', 'success');
      setShowRejectForm(false);
      setRejectionReasonInput('');

      // Refresh current thread view and messages list
      const threadToSelect = { ...activeThread, status: 'REJECTED' as any };
      setActiveThread(threadToSelect);
      await selectThread(threadToSelect);
      await loadThreads();
    } else {
      showToast(res.error || 'Failed to reject quote.', 'error');
    }
    setRejecting(false);
  };

  const handleCancelQuote = async () => {
    if (!activeThread) return;
    if (!confirm('Are you sure you want to cancel this quotation negotiation? This will close the quote request.')) return;

    setCancelling(true);
    const res = await cancelQuoteNegotiation(activeThread.quoteId, activeThread.rfqId);
    if (res.success) {
      showToast('Quotation negotiation cancelled successfully.', 'success');

      const threadToSelect = { ...activeThread, status: 'REJECTED' as any };
      setActiveThread(threadToSelect);
      await selectThread(threadToSelect);
      await loadThreads();
    } else {
      showToast(res.error || 'Failed to cancel quote negotiation.', 'error');
    }
    setCancelling(false);
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

      const { token, path } = signedRes.data;
      const client = createClient();
      const { error: uploadError } = await client.storage
        .from('chat-attachments')
        .uploadToSignedUrl(path, token, file);

      if (uploadError) {
        throw new Error(`Failed to upload file to storage: ${uploadError.message}`);
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

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !activeThread.machiningQuote || offerPrice <= 0 || !offerMaterial || !offerFinish || offerQuantity < 1) {
      showToast('Please fill in all offer details.', 'error');
      return;
    }

    setSubmittingOffer(true);
    try {
      await submitQuoteOffer(activeThread.machiningQuote.id, {
        price: offerPrice,
        notes: sellerNotes,
        quantity: offerQuantity,
        material: offerMaterial,
        finish: offerFinish,
      });
      showToast('Pricing offer sent to buyer!', 'success');

      // Update local state for immediate feedback
      const updatedMachQuote = {
        ...activeThread.machiningQuote,
        status: 'Offered' as const,
        last_offered_by: 'SELLER' as const,
        offer_price: offerPrice,
        selected_material: offerMaterial,
        selected_finish: offerFinish,
        quantity: offerQuantity,
        seller_notes: sellerNotes,
      };

      const updatedThread = {
        ...activeThread,
        status: 'Offered' as any,
        machiningQuote: updatedMachQuote,
      };

      setActiveThread(updatedThread);
      setThreads(prev => prev.map(t => t.quoteId === activeThread.quoteId ? updatedThread : t));

      // Send a system message in the chat
      await sendChatMessage({
        rfqId: activeThread.rfqId,
        quoteId: activeThread.quoteId,
        messageText: `[SYSTEM] Price quote submitted: ₹${offerPrice.toLocaleString('en-IN')} for ${offerQuantity} units in ${offerMaterial} (${offerFinish}).`,
      });

      // Update local storage seen state
      markThreadAsSeen(activeThread.quoteId, new Date().toISOString(), 'Offered');

      await loadThreads();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit offer.', 'error');
    } finally {
      setSubmittingOffer(false);
    }
  };

  const handleAcceptOffer = async () => {
    if (!activeThread || !activeThread.machiningQuote) return;
    try {
      const res = await acceptQuoteOffer(activeThread.machiningQuote.id);
      showToast(`Offer accepted! Order ${res.orderId} placed.`, 'success');

      // Update local state
      const updatedMachQuote = {
        ...activeThread.machiningQuote,
        status: 'Accepted' as const,
      };

      const updatedThread = {
        ...activeThread,
        status: 'ACCEPTED' as any,
        machiningQuote: updatedMachQuote,
      };

      setActiveThread(updatedThread);
      setThreads(prev => prev.map(t => t.quoteId === activeThread.quoteId ? updatedThread : t));

      // Send a system message in the chat
      await sendChatMessage({
        rfqId: activeThread.rfqId,
        quoteId: activeThread.quoteId,
        messageText: `[SYSTEM] Quote offer accepted! Order ${res.orderId} has been placed.`,
      });

      // Update local storage seen state
      markThreadAsSeen(activeThread.quoteId, new Date().toISOString(), 'ACCEPTED');

      await loadThreads();
    } catch (err: any) {
      showToast(err.message || 'Failed to accept offer.', 'error');
    }
  };

  const handleAcceptOfferBySeller = async () => {
    if (!activeThread || !activeThread.machiningQuote) return;
    try {
      const res = await acceptQuoteOfferBySeller(activeThread.machiningQuote.id);
      showToast(`Counter-offer accepted! Order ${res.orderId} placed.`, 'success');

      // Update local state
      const updatedMachQuote = {
        ...activeThread.machiningQuote,
        status: 'Accepted' as const,
      };

      const updatedThread = {
        ...activeThread,
        status: 'ACCEPTED' as any,
        machiningQuote: updatedMachQuote,
      };

      setActiveThread(updatedThread);
      setThreads(prev => prev.map(t => t.quoteId === activeThread.quoteId ? updatedThread : t));

      // Send a system message in the chat
      await sendChatMessage({
        rfqId: activeThread.rfqId,
        quoteId: activeThread.quoteId,
        messageText: `[SYSTEM] Seller accepted the buyer's counter-offer! Order ${res.orderId} has been placed.`,
      });

      // Update local storage seen state
      markThreadAsSeen(activeThread.quoteId, new Date().toISOString(), 'ACCEPTED');

      await loadThreads();
    } catch (err: any) {
      showToast(err.message || 'Failed to accept offer.', 'error');
    }
  };

  const handleCounterOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !activeThread.machiningQuote || offerPrice <= 0 || !offerMaterial || !offerFinish || offerQuantity < 1) {
      showToast('Please fill in all counter-offer details.', 'error');
      return;
    }

    setSubmittingOffer(true);
    try {
      await submitBuyerCounterOffer(activeThread.machiningQuote.id, {
        price: offerPrice,
        notes: sellerNotes,
        quantity: offerQuantity,
        material: offerMaterial,
        finish: offerFinish,
      });
      showToast('Counter-offer sent to seller!', 'success');

      // Update local state for immediate feedback
      const updatedMachQuote = {
        ...activeThread.machiningQuote,
        status: 'Offered' as const,
        last_offered_by: 'BUYER' as const,
        offer_price: offerPrice,
        selected_material: offerMaterial,
        selected_finish: offerFinish,
        quantity: offerQuantity,
        seller_notes: sellerNotes,
      };

      const updatedThread = {
        ...activeThread,
        status: 'Offered' as any,
        machiningQuote: updatedMachQuote,
      };

      setActiveThread(updatedThread);
      setThreads(prev => prev.map(t => t.quoteId === activeThread.quoteId ? updatedThread : t));

      // Send a system message in the chat
      await sendChatMessage({
        rfqId: activeThread.rfqId,
        quoteId: activeThread.quoteId,
        messageText: `[SYSTEM] Counter-offer submitted: ₹${offerPrice.toLocaleString('en-IN')} for ${offerQuantity} units in ${offerMaterial} (${offerFinish}).`,
      });

      // Update local storage seen state
      markThreadAsSeen(activeThread.quoteId, new Date().toISOString(), 'Offered');

      setShowCounterForm(false);
      await loadThreads();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit counter-offer.', 'error');
    } finally {
      setSubmittingOffer(false);
    }
  };

  return (
    <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-6 shadow-sm min-h-[600px] flex flex-col md:flex-row gap-6">
      {/* Threads List Sidebar */}
      <div className={`md:w-5/12 flex flex-col gap-4 border-r border-zinc-700/60/50 pr-0 md:pr-6 ${activeThread ? 'hidden md:flex' : 'flex'}`}>
        <div className="space-y-1">
          <h2 className="text-base font-black text-white tracking-tight uppercase">Quotation Negotiations</h2>
          <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
            Secure chats for open machining quotes and dispute resolution records.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[500px] space-y-2 mt-2">
          {loading ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-400/30" />
            </div>
          ) : threads.length > 0 ? (
            threads.map((t) => {
              const seenChatsStr = localStorage.getItem('mechitall_seen_chats');
              const seenChats = seenChatsStr ? JSON.parse(seenChatsStr) : {};
              const seen = seenChats[t.quoteId];
              const hasNewMsg = t.lastMessageTime && (!seen || new Date(t.lastMessageTime) > new Date(seen.lastMessageTime));
              const hasNewStatus = !seen || t.status !== seen.status;
              const isUnread = hasNewMsg || hasNewStatus;
              const isAccepted = t.status === 'ACCEPTED' || t.machiningQuote?.status === 'Accepted';

              return (
                <div
                  key={t.quoteId}
                  onClick={() => selectThread(t)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 text-left ${isAccepted
                      ? activeThread?.quoteId === t.quoteId
                        ? 'border-emerald bg-emerald-500/10 ring-1 ring-emerald/20'
                        : 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10'
                      : activeThread?.quoteId === t.quoteId
                        ? 'border-cobalt bg-cobalt/5 ring-1 ring-cobalt/10'
                        : 'border-zinc-700/60 hover:bg-zinc-900/50'
                    }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-xs font-black text-white line-clamp-1 flex-1 flex items-center gap-1.5">
                      {isUnread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-pulse shrink-0"></span>
                      )}
                      {t.rfqTitle}
                    </h4>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${isAccepted
                          ? 'bg-emerald-500/10 text-emerald border border-emerald-500/20'
                          : t.status === 'REJECTED'
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}>
                        {isAccepted ? 'ACCEPTED' : t.status}
                      </span>
                      {isAccepted && t.machiningQuote?.offer_price && (
                        <span className="text-[10px] font-black text-coral">
                          ₹{Number(t.machiningQuote.offer_price).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-zinc-400">
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-[#007084] font-black">#CHAT-{t.quoteId.substring(0, 8).toUpperCase()}</span>
                      <span className="text-slate-400">|</span>
                      <span className="font-bold text-zinc-350">With: {t.otherParticipantName}</span>
                    </div>
                    {t.lastMessageTime && (
                      <span className="font-mono text-[9px]">{new Date(t.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                  {t.lastMessageText && (
                    <p className="text-[11px] text-zinc-400 font-medium line-clamp-1 italic bg-zinc-900/30 px-2 py-1 rounded">
                      "{t.lastMessageText}"
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center border border-dashed border-zinc-700/60 rounded-xl">
              <MessageSquare className="w-8 h-8 text-zinc-400/30 mx-auto mb-2" />
              <p className="text-xs font-bold text-white">No active chats found</p>
              <p className="text-[10px] text-zinc-400 mt-1 leading-normal px-6">Ongoing negotiations will appear here once quote requests are submitted.</p>
            </div>
          )}
        </div>
      </div>

      {/* Message Chat Panel */}
      <div id="chat-messages-panel" className={`flex-1 flex flex-col min-h-[500px] justify-between ${!activeThread ? 'hidden md:flex items-center justify-center text-center bg-zinc-900/10 rounded-2xl border border-dashed border-zinc-700/60/50 p-6' : 'flex'}`}>
        {activeThread ? (
          <>
            {/* Thread Header */}
            <div className="pb-4 border-b border-zinc-700/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveThread(null)} className="md:hidden p-1 rounded-lg border border-zinc-700/60 hover:bg-zinc-900 cursor-pointer">
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                <div>
                  <h3 className="text-sm font-black text-white leading-tight">{activeThread.rfqTitle}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 mt-0.5">
                    <span className="font-mono text-[#007084] font-black">#CHAT-{activeThread.quoteId.substring(0, 8).toUpperCase()}</span>
                    <span>•</span>
                    <span>Participant: {activeThread.otherParticipantName}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeThread.cadFilePath && (
                  <button
                    onClick={async () => {
                      const client = createClient();
                      const { data } = await client.storage
                        .from('rfq-cad-files')
                        .createSignedUrl(activeThread.cadFilePath!, 60);
                      if (data?.signedUrl) {
                        window.open(data.signedUrl, '_blank');
                      } else {
                        showToast('Failed to open design file.', 'error');
                      }
                    }}
                    className="flex items-center gap-1 bg-cobalt hover:bg-[#06b6d4] text-white text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded transition-all shadow cursor-pointer shrink-0"
                    title="See CAD Design"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>See Design</span>
                  </button>
                )}
                {activeThread.status !== 'REJECTED' && activeThread.status !== 'ACCEPTED' && (
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded transition-all shadow cursor-pointer shrink-0"
                    title="Reject Quotation"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                )}
                {activeThread.status !== 'REJECTED' && (
                  <button
                    onClick={handleCancelQuote}
                    disabled={cancelling}
                    className="flex items-center gap-1 bg-slate-600 hover:bg-slate-700 text-white text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded transition-all shadow cursor-pointer shrink-0"
                    title="Cancel Quote/Production"
                  >
                    {cancelling ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{activeThread.status === 'ACCEPTED' || activeThread.machiningQuote?.status === 'Accepted' ? 'Cancel Production' : 'Cancel'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Messages Log */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 my-4 space-y-3 max-h-[360px] bg-zinc-900/30 rounded-xl border border-zinc-700/60/30">
              {loadingMessages ? (
                <div className="py-20 text-center">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-zinc-400/30" />
                </div>
              ) : messages.length > 0 ? (
                messages.map((m) => {
                  const isOwnMessage = m.sender_id === profile.id;
                  return (
                    <div key={m.id} className={`flex flex-col max-w-[75%] ${isOwnMessage ? 'self-end ml-auto items-end' : 'self-start mr-auto items-start'}`}>
                      <span className="text-[9px] font-bold text-zinc-400 mb-0.5 px-1">{m.sender_name}</span>
                      <div className={`p-3 rounded-xl border text-xs font-semibold leading-relaxed ${isOwnMessage
                          ? 'bg-cobalt text-white border-cobalt shadow-sm'
                          : 'bg-zinc-800 text-white border-zinc-700/60 shadow-sm'
                        }`}>
                        <p>{m.message_text}</p>
                        {m.file_attachment_path && (
                          <div className={`mt-2 p-2 rounded-lg border flex items-center gap-2 ${isOwnMessage ? 'bg-zinc-800/10 border-white/20' : 'bg-zinc-900 border-zinc-700/60'}`}>
                            <FileText className="w-4 h-4 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="block text-[10px] font-black truncate">{m.file_attachment_path.split('/').pop()}</span>
                              <span className="block text-[8px] opacity-60">Attachment</span>
                            </div>
                            <button
                              onClick={async () => {
                                const client = createClient();
                                const bucketName = m.message_text.includes('Shared CAD Design:') ? 'rfq-cad-files' : 'chat-attachments';
                                const { data } = await client.storage.from(bucketName).createSignedUrl(m.file_attachment_path!, 60);
                                if (data?.signedUrl) {
                                  window.open(data.signedUrl, '_blank');
                                } else {
                                  showToast('Failed to open attachment link.', 'error');
                                }
                              }}
                              className={`p-1 rounded hover:bg-black/10 text-xs cursor-pointer ${isOwnMessage ? 'text-white' : 'text-zinc-350'}`}
                              title="Download Attachment"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <span className="text-[8px] text-zinc-400 mt-0.5 px-1 font-mono">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center">
                  <p className="text-xs text-zinc-400 font-bold italic">No messages sent yet. Send a message to start negotiation.</p>
                </div>
              )}
            </div>

            {/* Contextual Quoting Workflow Card */}
            {activeThread.machiningQuote &&
              activeThread.status !== 'ACCEPTED' &&
              (activeThread.machiningQuote.status as string) !== 'Accepted' && (
                <div className="mx-4 mb-4 p-4 rounded-xl border bg-zinc-900/40 border-zinc-700/60/60 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-700/60/50">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse"></span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-white">
                        Quote Request Status: {activeThread.machiningQuote.status}
                      </span>
                    </div>
                    {activeThread.machiningQuote.status === 'Pending' && !profile.is_seller && (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded animate-pulse">
                        Awaiting Fabricator Pricing
                      </span>
                    )}
                    {activeThread.machiningQuote.status === 'Offered' && profile.is_seller && (
                      <span className="text-[9px] font-bold text-[#06B6D4] bg-[#06B6D4]/10 border border-[#06B6D4]/20 px-2 py-0.5 rounded">
                        Awaiting Customer Approval
                      </span>
                    )}
                    {activeThread.machiningQuote.status === 'Accepted' && (
                      <span className="text-[9px] font-bold text-emerald bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Order Placed
                      </span>
                    )}
                  </div>

                  {activeThread.machiningQuote.status === 'Pending' && profile.is_seller && (
                    /* Seller: Submit Offer Form */
                    <form onSubmit={handleOfferSubmit} className="space-y-3 text-xs font-bold">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[8px] text-zinc-350 uppercase">Material</label>
                          <select
                            value={offerMaterial}
                            onChange={(e) => setOfferMaterial(e.target.value)}
                            className="w-full p-2 border border-zinc-700/60 rounded-lg bg-zinc-800 text-white focus:outline-none"
                          >
                            {(activeThread.machiningQuote.material_capabilities || ['Aluminium 6061']).map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[8px] text-zinc-350 uppercase">Finish</label>
                          <select
                            value={offerFinish}
                            onChange={(e) => setOfferFinish(e.target.value)}
                            className="w-full p-2 border border-zinc-700/60 rounded-lg bg-zinc-800 text-white focus:outline-none"
                          >
                            {(activeThread.machiningQuote.finish_options || ['As-Machined']).map((f) => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[8px] text-zinc-350 uppercase">Qty (Units)</label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={offerQuantity}
                            onChange={(e) => setOfferQuantity(Math.max(1, Number(e.target.value)))}
                            className="w-full p-2 border border-zinc-700/60 rounded-lg bg-zinc-800 text-white focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[8px] text-zinc-350 uppercase">Total Price (₹)</label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={offerPrice || ''}
                            placeholder="0"
                            onChange={(e) => setOfferPrice(Number(e.target.value))}
                            className="w-full p-2 border border-zinc-700/60 rounded-lg bg-zinc-800 text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[8px] text-zinc-350 uppercase">Notes / Inspection Feedback</label>
                        <input
                          type="text"
                          placeholder="Detail tolerancing check, recommended tooling modifications, etc..."
                          value={sellerNotes}
                          onChange={(e) => setSellerNotes(e.target.value)}
                          className="w-full p-2 border border-zinc-700/60 rounded-lg bg-zinc-800 text-white focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingOffer}
                        className="w-full py-2 bg-cobalt hover:bg-[#06b6d4] text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {submittingOffer ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <CircleDollarSign className="w-3.5 h-3.5" />
                            <span>Submit Price Offer to Buyer</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {activeThread.machiningQuote.status === 'Offered' && (
                    /* Offer / Counter-Offer Negotiation Details */
                    <div className="space-y-4">
                      {/* Offer Details Card */}
                      <div className="bg-zinc-800 border border-zinc-700/60/60 p-4 rounded-xl space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-zinc-700/60/40">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            <span className="text-[10px] font-black text-white uppercase tracking-wider">
                              Latest Proposal (By {activeThread.machiningQuote.last_offered_by === 'BUYER' ? 'Buyer' : 'Seller'})
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${activeThread.machiningQuote.last_offered_by === 'BUYER'
                              ? profile.is_seller ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-slate-100 text-slate-500 border-slate-200'
                              : !profile.is_seller ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                            {activeThread.machiningQuote.last_offered_by === 'BUYER'
                              ? profile.is_seller ? 'Awaiting Your Response' : 'Awaiting Seller Response'
                              : !profile.is_seller ? 'Awaiting Your Response' : 'Awaiting Buyer Response'}
                          </span>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                          <div className="grid grid-cols-2 md:flex md:items-center gap-x-4 gap-y-1 text-[10px] text-zinc-350 font-bold font-mono">
                            <div>Material: <span className="text-white font-black">{activeThread.machiningQuote.selected_material}</span></div>
                            <div>Finish: <span className="text-white font-black">{activeThread.machiningQuote.selected_finish}</span></div>
                            <div>Quantity: <span className="text-white font-black">{activeThread.machiningQuote.quantity} Units</span></div>
                          </div>
                          <div className="flex items-baseline gap-1 self-start md:self-auto">
                            <span className="text-[9px] text-zinc-400 uppercase">Proposed Price:</span>
                            <span className="text-sm font-black text-coral">₹{Number(activeThread.machiningQuote.offer_price).toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        {activeThread.machiningQuote.seller_notes && (
                          <p className="text-[10px] text-zinc-400 italic border-t border-zinc-700/60/40 pt-1.5 mt-1">
                            Notes: "{activeThread.machiningQuote.seller_notes}"
                          </p>
                        )}

                        {/* Action Buttons when form is hidden */}
                        {!showCounterForm && (
                          <div className="flex gap-3 pt-2">
                            {/* 1. If buyer receives seller's offer: can Accept or Counter */}
                            {!profile.is_seller && activeThread.machiningQuote.last_offered_by !== 'BUYER' && (
                              <>
                                <button
                                  onClick={handleAcceptOffer}
                                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Accept Offer & Place Order</span>
                                </button>
                                <button
                                  onClick={() => setShowCounterForm(true)}
                                  className="px-4 py-2 border border-zinc-700/60 hover:bg-zinc-900 text-xs font-bold text-zinc-350 rounded-lg transition-colors cursor-pointer"
                                >
                                  Counter-Offer
                                </button>
                              </>
                            )}

                            {/* 2. If seller receives buyer's counter: can Accept or Counter */}
                            {profile.is_seller && activeThread.machiningQuote.last_offered_by === 'BUYER' && (
                              <>
                                <button
                                  onClick={handleAcceptOfferBySeller}
                                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Accept Counter-Offer</span>
                                </button>
                                <button
                                  onClick={() => setShowCounterForm(true)}
                                  className="px-4 py-2 border border-zinc-700/60 hover:bg-zinc-900 text-xs font-bold text-zinc-350 rounded-lg transition-colors cursor-pointer"
                                >
                                  Counter-Offer
                                </button>
                              </>
                            )}

                            {/* 3. If buyer is waiting for seller: can modify their counter */}
                            {!profile.is_seller && activeThread.machiningQuote.last_offered_by === 'BUYER' && (
                              <button
                                onClick={() => setShowCounterForm(true)}
                                className="w-full py-2 border border-zinc-700/60 hover:bg-zinc-900 text-xs font-bold text-zinc-350 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <CircleDollarSign className="w-3.5 h-3.5" />
                                Modify My Counter-Offer
                              </button>
                            )}

                            {/* 4. If seller is waiting for buyer: can modify their offer */}
                            {profile.is_seller && activeThread.machiningQuote.last_offered_by !== 'BUYER' && (
                              <button
                                onClick={() => setShowCounterForm(true)}
                                className="w-full py-2 border border-zinc-700/60 hover:bg-zinc-900 text-xs font-bold text-zinc-350 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <CircleDollarSign className="w-3.5 h-3.5" />
                                Modify My Offer
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Counter / Modification Form */}
                      {showCounterForm && (
                        <form onSubmit={profile.is_seller ? handleOfferSubmit : handleCounterOfferSubmit} className="bg-zinc-900/30 border border-zinc-700/60/50 rounded-xl p-4 space-y-3 text-xs font-bold animate-slide-in">
                          <div className="flex justify-between items-center pb-1 border-b border-zinc-700/60/30">
                            <span className="text-[10px] text-white uppercase tracking-wider">
                              {profile.is_seller ? 'Modify Offer to Buyer' : 'Submit Counter-Offer to Fabricator'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
                            <div className="space-y-1 font-sans">
                              <label className="block text-[8px] text-zinc-350 uppercase font-sans">Material</label>
                              <select
                                value={offerMaterial}
                                onChange={(e) => setOfferMaterial(e.target.value)}
                                className="w-full p-2 border border-zinc-700/60 rounded-lg bg-zinc-800 text-white focus:outline-none"
                              >
                                {(activeThread.machiningQuote.material_capabilities || ['Aluminium 6061']).map((m) => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1 font-sans">
                              <label className="block text-[8px] text-zinc-350 uppercase font-sans">Finish</label>
                              <select
                                value={offerFinish}
                                onChange={(e) => setOfferFinish(e.target.value)}
                                className="w-full p-2 border border-zinc-700/60 rounded-lg bg-zinc-800 text-white focus:outline-none"
                              >
                                {(activeThread.machiningQuote.finish_options || ['As-Machined']).map((f) => (
                                  <option key={f} value={f}>{f}</option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[8px] text-zinc-350 uppercase font-sans">Qty (Units)</label>
                              <input
                                type="number"
                                required
                                min={1}
                                value={offerQuantity}
                                onChange={(e) => setOfferQuantity(Math.max(1, Number(e.target.value)))}
                                className="w-full p-2 border border-zinc-700/60 rounded-lg bg-zinc-800 text-white focus:outline-none font-bold"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[8px] text-zinc-350 uppercase font-sans">Price (₹)</label>
                              <input
                                type="number"
                                required
                                min={1}
                                value={offerPrice || ''}
                                placeholder="0"
                                onChange={(e) => setOfferPrice(Number(e.target.value))}
                                className="w-full p-2 border border-zinc-700/60 rounded-lg bg-zinc-800 text-white focus:outline-none font-bold"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[8px] text-zinc-350 uppercase font-sans">Proposal Notes</label>
                            <input
                              type="text"
                              placeholder="Add explanation for counter-offer..."
                              value={sellerNotes}
                              onChange={(e) => setSellerNotes(e.target.value)}
                              className="w-full p-2 border border-zinc-700/60 rounded-lg bg-zinc-800 text-white focus:outline-none font-semibold font-sans"
                            />
                          </div>

                          <div className="flex gap-3 pt-1">
                            <button
                              type="submit"
                              disabled={submittingOffer}
                              className="flex-1 py-2 bg-cobalt hover:bg-[#06b6d4] text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              {submittingOffer ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Send Proposal</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowCounterForm(false)}
                              className="px-4 py-2 border border-zinc-700/60 hover:bg-zinc-900 text-xs font-bold text-zinc-350 rounded-lg transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {activeThread.machiningQuote.status === 'Accepted' && (
                    /* Accepted Offer Summary */
                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg text-[10px] font-bold text-zinc-350 space-y-1">
                      <p className="text-emerald font-black">Contract Terms Finalized & Accepted</p>
                      <div className="grid grid-cols-2 md:flex md:items-center gap-x-4 gap-y-1 text-zinc-350">
                        <div>Material: <span className="text-white font-black">{activeThread.machiningQuote.selected_material}</span></div>
                        <div>Finish: <span className="text-white font-black">{activeThread.machiningQuote.selected_finish}</span></div>
                        <div>Quantity: <span className="text-white font-black">{activeThread.machiningQuote.quantity} Units</span></div>
                        <div className="ml-auto">Price: <span className="text-coral font-black">₹{Number(activeThread.machiningQuote.offer_price).toLocaleString('en-IN')}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* Input message bar */}
            <form onSubmit={handleSendMessage} className="border-t border-zinc-700/60/50 pt-4 flex gap-2">
              <label className="btn-secondary p-3 rounded-lg border border-zinc-700/60 cursor-pointer flex items-center justify-center shrink-0 hover:bg-zinc-900 transition-colors" title="Attach file">
                <Paperclip className={`w-4 h-4 ${uploading ? 'animate-pulse text-cobalt' : 'text-zinc-350'}`} />
                <input type="file" onChange={handleFileUpload} disabled={uploading || sending} className="hidden" />
              </label>
              <input
                type="text"
                placeholder="Type your message or negotiate terms..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending || uploading}
                className="flex-1 text-xs font-semibold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-cobalt transition-colors"
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
            <MessageSquare className="w-12 h-12 text-zinc-400/30 mx-auto" />
            <div>
              <p className="text-xs font-black text-white uppercase tracking-tight">Select a conversation</p>
              <p className="text-[10px] text-zinc-400 mt-1 max-w-xs leading-normal">
                Choose a negotiation thread from the left menu to view secure messages, share CAD revisions, or review contract terms.
              </p>
            </div>
          </div>
        )}
      </div>

      {showRejectForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowRejectForm(false)}
          ></div>

          {/* Panel */}
          <div className="bg-zinc-800 border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl relative z-10 animate-fade-in space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-white uppercase tracking-tight font-['Space_Grotesk']">
                Reject Quotation
              </h3>
              <button
                onClick={() => setShowRejectForm(false)}
                className="p-1 rounded hover:bg-slate-50 text-zinc-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
              Please provide a reason for rejecting this quotation. This feedback will be sent directly to <strong>{activeThread?.otherParticipantName}</strong> inside this chat channel.
            </p>

            <form onSubmit={handleRejectQuote} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-350 uppercase">
                  Rejection Reason / Feedback *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="e.g. Price is too high, lead times are too long, or specification mismatch..."
                  className="w-full text-xs font-semibold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="flex-1 py-2.5 rounded-lg border border-zinc-700/60 hover:bg-zinc-900 text-xs font-bold text-zinc-350 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejecting}
                  className="flex-1 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  {rejecting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Submit Rejection</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

