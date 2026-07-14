'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
const OrdersTab = dynamic(() => import('@/components/profile/OrdersTab'), { ssr: false });
const RewardsTab = dynamic(() => import('@/components/profile/RewardsTab'), { ssr: false });
const WishlistTab = dynamic(() => import('@/components/profile/WishlistTab'), { ssr: false });
const SettingsTab = dynamic(() => import('@/components/profile/SettingsTab'), { ssr: false });
const AddressTab = dynamic(() => import('@/components/profile/AddressTab'), { ssr: false });
const SupportTab = dynamic(() => import('@/components/profile/SupportTab'), { ssr: false });
const SellerRfqsTab = dynamic(() => import('@/components/profile/SellerRfqsTab'), { ssr: false });
const SellerOrdersTab = dynamic(() => import('@/components/profile/SellerOrdersTab'), { ssr: false });
const SellerListingsTab = dynamic(() => import('@/components/profile/SellerListingsTab'), { ssr: false });
const SellerEarningsTab = dynamic(() => import('@/components/profile/SellerEarningsTab'), { ssr: false });
const QuotationChatsTab = dynamic(() => import('@/components/profile/QuotationChatsTab'), { ssr: false });
const AddListingModal = dynamic(() => import('@/components/profile/AddListingModal'), { ssr: false });
const SellerKYCModal = dynamic(() => import('@/components/profile/SellerKYCModal'), { ssr: false });

import { createClient } from '@/utils/supabase/client';
import { useCart } from '@/components/CartProvider';
import {
  getProfileOrders, getProfileTransactions, updateProfileName, toggleProfileSellerMode,
  getSellerDashboardData, getSellerOrders,
  updateSellerOrderStatus, deleteSellerCapability, deleteSellerProduct,
  deleteSellerService, Profile, BoltsTransaction, confirmDeliveryAndClaimBolts, simulateOrderStatus, updateProfilePhoto
} from '@/app/actions/rewards';
import { initiatePayUExistingOrderPayment, disputeOrder } from '@/app/actions/orders';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoginPage from '../login/page';
import {
  User, ShoppingBag, Gift, Heart, Settings, MapPin, MessageSquare,
  ArrowLeftRight, ShieldCheck, Cpu, ChevronRight, Download, Plus,
  Trash2, RefreshCw, ShoppingCart, Clock, CheckCircle2, AlertTriangle, Play, Upload,
  Send, Paperclip, FileText, ExternalLink, CircleDollarSign, IndianRupee, LayoutDashboard, ArrowRight,
  Package, X, Camera, Loader2, Eye, XCircle, LifeBuoy
} from 'lucide-react';
import { getOngoingChats } from '@/app/actions/machining-workflow';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile, fetchProfile, showToast, addToCart, wishlist, toggleWishlist } = useCart();

  const [activeTab, setActiveTab] = useState<'orders' | 'rewards' | 'wishlist' | 'settings' | 'address' | 'support' | 'chats' | 'seller_orders' | 'seller_rfqs' | 'seller_listings' | 'seller_earnings'>('orders');
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [activeChatRfqId, setActiveChatRfqId] = useState<string | null>(null);
  const [hasNewBuyerOrder, setHasNewBuyerOrder] = useState(false);
  const [hasNewSellerOrder, setHasNewSellerOrder] = useState(false);

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
        .subscribe((status: any, err: any) => {
          if (err) console.error('Global Realtime subscription error:', err);
          else console.log('Global Realtime subscription status:', status);
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);



  // Load tab from URL query params and check PayU payment redirects
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['orders', 'rewards', 'wishlist', 'settings', 'address', 'support', 'chats', 'seller_orders', 'seller_rfqs', 'seller_listings', 'seller_earnings'].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }

      const paymentStatus = params.get('payment');
      if (paymentStatus === 'success') {
        const orderId = params.get('orderId') || '';
        showToast(`Payment Verified Successfully! Order ${orderId} is now in Processing.`, 'success');
        window.history.replaceState({}, '', window.location.pathname + '?tab=orders');
      } else if (paymentStatus === 'failed') {
        const reason = params.get('reason') || '';
        const msg = reason === 'hash_invalid' 
          ? 'Security hash verification failed.' 
          : 'Transaction was cancelled or failed.';
        showToast(`Payment Failed: ${msg}`, 'error');
        window.history.replaceState({}, '', window.location.pathname + '?tab=orders');
      }
    }
  }, [showToast]);

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
  const [isUpdatingPhoto, startTransitionPhoto] = useTransition();
  const [togglingSeller, setTogglingSeller] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [showAddListingModal, setShowAddListingModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editingService, setEditingService] = useState<any | null>(null);

  const [localProducts, setLocalProducts] = useState<any[]>([]);
  const [localServices, setLocalServices] = useState<any[]>([]);

  const openAddListingModal = () => {
    setEditingProduct(null);
    setEditingService(null);
    setShowAddListingModal(true);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setEditingService(null);
    setShowAddListingModal(true);
  };

  const handleEditService = (service: any) => {
    setEditingService(service);
    setEditingProduct(null);
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

  // Re-fetch seller data only when user switches between seller sub-tabs.
  // The initial fetch is handled by the consolidated profile.id effect below.
  const hasFetchedSellerTabRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (!profile?.is_seller || !activeTab.startsWith('seller_')) return;
    // Avoid re-fetching the same tab twice in a row
    if (hasFetchedSellerTabRef.current === activeTab) return;
    hasFetchedSellerTabRef.current = activeTab;
    fetchSellerData();
  }, [activeTab]);


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

  // Lazy-load products only when the seller listings tab is opened
  useEffect(() => {
    if (activeTab !== 'seller_listings') return;
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
  }, [supabase, activeTab]);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
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

  // Single consolidated effect — fetch orders once on profile load.
  // A ref guard prevents the double-invocation from React Strict Mode / concurrent renders.
  const hasFetchedRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (!profile?.id) return;
    // Only re-fetch when profile ID changes (not on every render)
    if (hasFetchedRef.current === profile.id) return;
    hasFetchedRef.current = profile.id;
    fetchOrders();
    if (profile.is_seller) {
      fetchSellerData();
    }
  }, [profile?.id]);

  // Reload orders when user navigates back to orders tab
  useEffect(() => {
    if (activeTab === 'orders' && profile?.id) {
      fetchOrders();
    }
  }, [activeTab]);

  // Sync seen buyer orders to display notification badge if there are unseen ones
  useEffect(() => {
    if (orders.length > 0 && typeof window !== 'undefined') {
      const seenStr = localStorage.getItem('mechitall_seen_buyer_orders');
      const seenIds = seenStr ? JSON.parse(seenStr) : [];
      
      if (activeTab === 'orders') {
        const currentIds = orders.map(o => o.id);
        localStorage.setItem('mechitall_seen_buyer_orders', JSON.stringify(currentIds));
        setHasNewBuyerOrder(false);
      } else {
        const hasUnseen = orders.some(o => !seenIds.includes(o.id));
        setHasNewBuyerOrder(hasUnseen);
      }
    }
  }, [orders, activeTab]);

  // Sync seen seller orders to display notification badge if there are unseen ones
  useEffect(() => {
    if (sellerOrders.length > 0 && typeof window !== 'undefined') {
      const seenStr = localStorage.getItem('mechitall_seen_seller_orders');
      const seenIds = seenStr ? JSON.parse(seenStr) : [];
      
      if (activeTab === 'seller_orders') {
        const currentIds = sellerOrders.map(o => o.id);
        localStorage.setItem('mechitall_seen_seller_orders', JSON.stringify(currentIds));
        setHasNewSellerOrder(false);
      } else {
        const hasUnseen = sellerOrders.some(o => !seenIds.includes(o.id));
        setHasNewSellerOrder(hasUnseen);
      }
    }
  }, [sellerOrders, activeTab]);

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

  const handleProfilePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !profile) return;
    const file = event.target.files[0];

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;

      startTransitionPhoto(async () => {
        try {
          await updateProfilePhoto(profile.id, base64String);
          showToast('Profile photo updated successfully!', 'success');
          await fetchProfile();
        } catch (err: any) {
          console.error(err);
          showToast(err.message || 'Failed to update profile photo', 'error');
        }
      });
    };
    reader.readAsDataURL(file);
  };

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
    // Optimistic update — reflect the new status immediately in local state
    // without waiting for a full server re-fetch
    setSellerData((prev: any) => {
      if (!prev) return prev;
      const updateJob = (jobs: any[]) =>
        jobs.map((j: any) => j.id === orderId ? { ...j, status: nextStatus } : j);
      return {
        ...prev,
        activeJobs: updateJob(prev.activeJobs || []),
        completedJobs: updateJob(prev.completedJobs || []),
      };
    });
    try {
      await updateSellerOrderStatus(orderId, nextStatus);
      showToast(`Order status updated to "${nextStatus}" successfully!`, 'success');
      // Refresh in background so data stays consistent with server
      fetchSellerData();
    } catch (err: any) {
      // Roll back optimistic update on failure
      await fetchSellerData();
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
  const cadFile = null;
  const customSpecs: any[] = [];
  const datasheetFile = null;
  const dragActiveCad = false;
  const dragActiveDatasheet = false;
  const dragActiveImage = false;
  const enableBulkPricing = false;
  const handleDrag = () => {};
  const handleDrop = () => {};
  const imageFileNames: string[] = [];
  const imagePreviews: string[] = [];
  const listingType = 'Product';
  const processFile = () => {};
  const selectedCategory = 'Actuators';
  const selectedProcessType = 'CNC Machining';
  const setCadFile = () => {};
  const setCustomSpecs = () => {};
  const setDatasheetFile = () => {};
  const setDragActiveCad = () => {};
  const setDragActiveDatasheet = () => {};
  const setDragActiveImage = () => {};
  const setEnableBulkPricing = () => {};
  const setImageFileNames = () => {};
  const setImagePreviews = () => {};
  const setListingType = () => {};
  const setSelectedCategory = () => {};
  const setSelectedProcessType = () => {};

  // Determine loyalty level details
  const isMasterBuilder = profile.loyalty_tier === 'Master Builder';
  const boltsProgressPercent = Math.min(100, (profile.wallet_balance / 500) * 100);

  const tabProps = { activeChatRfqId, activeShipmentsCount, activeTab, addToCart, cadFile, checkUnreadChats, customSpecs, datasheetFile, dbProducts, deletingCatalogServiceId, deletingProductId, deletingServiceId, dragActiveCad, dragActiveDatasheet, dragActiveImage, editName, enableBulkPricing, fetchOrders, fetchProfile, fetchSellerData, handleDeleteCapability, handleDeleteProduct, handleDeleteService, handleDrag, handleDrop, handlePhotoUploadAndClaim, handleProfilePhotoUpload, handleSimulateStatus, handleToggleSellerMode, handleUpdateNameSubmit, handleUpdateOrderStatus, hasTimedOut, imageFileNames, imagePreviews, isGuest, isPending, isUpdatingName, isUpdatingPhoto, listingType, loadingOrders, loadingSeller, loadingSellerOrders, loadingTx, localProducts, localServices, openAddListingModal, handleEditProduct, handleEditService, orders, processFile, profile, publishingListing, router, selectedCategory, selectedOrder, selectedProcessType, sellerData, sellerOrders, setActiveChatRfqId, setActiveTab, setCadFile, setCustomSpecs, setDatasheetFile, setDbProducts, setDeletingCatalogServiceId, setDeletingProductId, setDeletingServiceId, setDragActiveCad, setDragActiveDatasheet, setDragActiveImage, setEditName, setEnableBulkPricing, setHasTimedOut, setImageFileNames, setImagePreviews, setIsGuest, setListingType, setLoadingOrders, setLoadingSeller, setLoadingSellerOrders, setLoadingTx, setLocalProducts, setLocalServices, setOrders, setPublishingListing, setSelectedCategory, setSelectedOrder, setSelectedProcessType, setSellerData, setSellerOrders, setShowAddListingModal, setShowKYCModal, setTogglingSeller, setTransactions, setUnreadChatsCount, setUpdatingOrderId, setUploadingOrderId, showAddListingModal, showKYCModal, showToast, startTransition, startTransitionStatus, supabase, toggleWishlist, togglingSeller, transactions, unreadChatsCount, updatingOrderId, uploadingOrderId, wishlist, boltsProgressPercent, isMasterBuilder };
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
            { tab: 'support', label: 'Support', icon: LifeBuoy },
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
                {tab === 'orders' && hasNewBuyerOrder && (
                  <span className="absolute top-1 right-5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
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
            { tab: 'seller_earnings', label: 'Earnings', icon: IndianRupee },
            { tab: 'chats', label: 'Chats', icon: MessageSquare },
            { tab: 'support', label: 'Support', icon: LifeBuoy },
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
                {tab === 'seller_orders' && hasNewSellerOrder && (
                  <span className="absolute top-1 right-5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
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
                    {tab === 'seller_orders' && hasNewSellerOrder && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0"></span>
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
            <div className="pt-0 md:pt-4 md:border-t border-zinc-700/60 space-y-2">
              <button
                onClick={() => setActiveTab('support')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${activeTab === 'support'
                  ? 'bg-[#0f172a] text-white shadow-md'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }`}
              >
                <LifeBuoy className="w-4 h-4 shrink-0" />
                <span>Customer Support</span>
              </button>

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
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded bg-cobalt/10 border-2 border-cobalt text-cobalt font-black text-xl shadow font-mono overflow-hidden">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    profile.full_name[0] + (profile.full_name.split(' ').pop() || 'U')[0]
                  )}
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
                  <Package className="w-4 h-4 shrink-0" />
                  <span>Dashboard</span>
                  {hasNewBuyerOrder && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0"></span>
                  )}
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
              <button
                onClick={() => setActiveTab('support')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${activeTab === 'support'
                  ? 'bg-[#0f172a] text-white shadow'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }`}
              >
                <LifeBuoy className="w-4 h-4 shrink-0" />
                <span>Customer Support</span>
              </button>
              
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

          {profile.is_seller && activeTab === 'seller_rfqs' && <SellerRfqsTab {...tabProps} />}
          {profile.is_seller && activeTab === 'seller_orders' && <SellerOrdersTab {...tabProps} />}
          {profile.is_seller && activeTab === 'seller_listings' && <SellerListingsTab {...tabProps} />}
          {profile.is_seller && activeTab === 'seller_earnings' && <SellerEarningsTab {...tabProps} />}
          {activeTab === 'orders' && <OrdersTab {...tabProps} />}
          {activeTab === 'rewards' && <RewardsTab {...tabProps} />}
          {activeTab === 'wishlist' && <WishlistTab {...tabProps} />}
          {activeTab === 'settings' && <SettingsTab {...tabProps} />}
          {activeTab === 'address' && <AddressTab {...tabProps} />}
          {activeTab === 'support' && <SupportTab {...tabProps} />}
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
      <AddListingModal
        isOpen={showAddListingModal}
        onClose={() => setShowAddListingModal(false)}
        editingProduct={editingProduct}
        editingService={editingService}
        profile={profile}
        fetchSellerData={fetchSellerData}
        showToast={showToast}
        localProducts={localProducts}
        setLocalProducts={setLocalProducts}
        localServices={localServices}
        setLocalServices={setLocalServices}
      />

      {/* Seller KYC Modal */}
      <SellerKYCModal
        isOpen={showKYCModal}
        onClose={() => setShowKYCModal(false)}
        profileId={profile?.id}
        fetchProfile={fetchProfile}
        showToast={showToast}
      />
    </div>
  );
}
