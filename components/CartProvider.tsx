'use client';

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { Part } from './mockData';
import { Profile, getAuthenticatedProfile, createDbOrder } from '@/app/actions/rewards';

export interface CartItem {
  id: string;
  partId?: string;
  part?: Part;
  isCustomQuote: boolean;
  customDetails?: {
    fileName: string;
    processName: string;
    materialName: string;
    finishName: string;
    leadTimeName: string;
    volume: number;
    weight: number;
  };
  quantity: number;
  pricePerUnit: number;
}

export interface SubmittedOrder {
  orderId: string;
  date: string;
  type: 'Shop Purchase' | 'Custom Part';
  itemsCount: number;
  total: number;
  status: 'Processing' | 'Analyzing CAD' | 'Approved' | 'Shipped' | 'Delivered' | 'Completed';
  fileAttached?: string;
}

interface CartContextValue {
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  submittedOrders: SubmittedOrder[];
  checkoutStatus: 'idle' | 'submitting' | 'success';
  lastPlacedOrder: SubmittedOrder | null;
  setCheckoutStatus: (s: 'idle' | 'submitting' | 'success') => void;
  cartSummary: {
    subtotal: number;
    discount: number;
    discountRatePercent: number;
    shipping: number;
    tax: number;
    total: number;
    itemCount: number;
    boltsDiscount: number;
    boltsToDeduct: number;
  };
  addToCart: (part: Part, quantity: number) => void;
  addCustomQuoteToCart: (item: Omit<CartItem, 'id'>) => void;
  updateCartQuantity: (id: string, newQty: number) => void;
  removeFromCart: (id: string) => void;
  handleCheckout: () => void;
  getPartPriceForQuantity: (part: Part, qty: number) => number;
  profile: Profile | null;
  fetchProfile: () => Promise<void>;
  isBoltsDiscountApplied: boolean;
  setIsBoltsDiscountApplied: (applied: boolean) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
  wishlist: string[];
  toggleWishlist: (partId: string) => void;
  isWishlisted: (partId: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

// Cookie helper functions for client-side persistence
function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
}

function setCookie(name: string, val: string, days = 365) {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${val};path=/;expires=${date.toUTCString()}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [submittedOrders, setSubmittedOrders] = useState<SubmittedOrder[]>([]);
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [lastPlacedOrder, setLastPlacedOrder] = useState<SubmittedOrder | null>(null);
  
  // Rewards profile state
  const [profile, setProfile] = useState<Profile | null>(null);
  // Bolts discount state
  const [isBoltsDiscountApplied, setIsBoltsDiscountApplied] = useState(false);

  // Wishlist state
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  // Load wishlist from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mechitall_wishlist');
      if (stored) {
        try {
          setWishlist(JSON.parse(stored));
        } catch (err) {
          console.error('Failed to parse wishlist:', err);
        }
      }
    }
  }, []);

  const toggleWishlist = useCallback((partId: string) => {
    setWishlist(prev => {
      const isSaved = prev.includes(partId);
      let next;
      if (isSaved) {
        next = prev.filter(id => id !== partId);
        showToast('Removed from wishlist.', 'success');
      } else {
        next = [...prev, partId];
        showToast('Added to wishlist!', 'success');
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('mechitall_wishlist', JSON.stringify(next));
      }
      return next;
    });
  }, [showToast]);

  const isWishlisted = useCallback((partId: string) => {
    return wishlist.includes(partId);
  }, [wishlist]);

  // Auto-hide toast logic
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchProfile = useCallback(async () => {
    try {
      const storedId = getCookie('mechitall_profile_id');
      const activeProfile = await getAuthenticatedProfile(storedId);
      setProfile(activeProfile);  // null for guests → 0 Bolts shown
      if (activeProfile) {
        setCookie('mechitall_profile_id', activeProfile.id);
      }
    } catch (err) {
      console.error('Failed to sync profile status:', err);
      setProfile(null);
    }
  }, []);

  // Initialize and load user profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const getPartPriceForQuantity = useCallback((part: Part, qty: number): number => {
    const tier = [...part.bulkPricing].reverse().find(t => qty >= t.minQty);
    return tier ? tier.pricePerUnit : part.price;
  }, []);

  const addToCart = useCallback((part: Part, quantity: number) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.partId === part.id && !item.isCustomQuote);
      const unitPrice = getPartPriceForQuantity(part, quantity);
      if (existingIndex > -1) {
        const newCart = [...prev];
        const newQty = newCart[existingIndex].quantity + quantity;
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newQty,
          pricePerUnit: getPartPriceForQuantity(part, newQty),
        };
        return newCart;
      }
      return [...prev, {
        id: `cart-${part.id}-${Date.now()}`,
        partId: part.id,
        part,
        isCustomQuote: false,
        quantity,
        pricePerUnit: unitPrice,
      }];
    });
  }, [getPartPriceForQuantity]);

  const addCustomQuoteToCart = useCallback((item: Omit<CartItem, 'id'>) => {
    setCart(prev => [...prev, { ...item, id: `custom-${Date.now()}` }]);
  }, []);

  const updateCartQuantity = useCallback((id: string, newQty: number) => {
    if (newQty <= 0) {
      setCart(prev => prev.filter(item => item.id !== id));
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.id !== id) return item;
      let price = item.pricePerUnit;
      if (!item.isCustomQuote && item.part) {
        price = getPartPriceForQuantity(item.part, newQty);
      }
      return { ...item, quantity: newQty, pricePerUnit: price };
    }));
  }, [getPartPriceForQuantity]);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  const cartSummary = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0);
    const bulkDiscountThreshold = 1500;
    const discountRate = 0.08;
    const discount = subtotal >= bulkDiscountThreshold ? subtotal * discountRate : 0;
    const shipping = subtotal === 0 ? 0 : subtotal >= 500 ? 0 : 45.0;

    // Calculate Bolts value: 10 Bolts = ₹1.00 store value
    const walletBalance = profile?.wallet_balance || 0;
    const boltsCashValue = walletBalance / 10;
    const boltsDiscount = isBoltsDiscountApplied ? Math.min(subtotal - discount, boltsCashValue) : 0;

    // If discount is applied, remove GST tax (set to 0), otherwise 18% of subtotal-discount
    const tax = isBoltsDiscountApplied ? 0 : (subtotal - discount) * 0.18;
    const total = subtotal - discount - boltsDiscount + shipping + tax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      discountRatePercent: discountRate * 100,
      shipping,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      boltsDiscount: Math.round(boltsDiscount * 100) / 100,
      boltsToDeduct: Math.round(boltsDiscount * 10),
    };
  }, [cart, isBoltsDiscountApplied, profile]);

  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) return;
    setCheckoutStatus('submitting');
    try {
      // 1. Get active profile (must be authenticated to checkout)
      let activeProfile = profile;
      if (!activeProfile) {
        const storedId = getCookie('mechitall_profile_id');
        activeProfile = await getAuthenticatedProfile(storedId);
        if (activeProfile) {
          setProfile(activeProfile);
          setCookie('mechitall_profile_id', activeProfile.id);
        } else {
          showToast('Please sign in to complete your purchase.', 'error');
          setCheckoutStatus('idle');
          return;
        }
      }

      // 2. Create the order in the database linked to this profile
      const dbOrder = await createDbOrder(
        activeProfile.id,
        cartSummary.total,
        cart.length,
        cartSummary.boltsToDeduct
      );

      const newOrder: SubmittedOrder = {
        orderId: dbOrder.id,
        date: new Date(dbOrder.created_at).toISOString().split('T')[0],
        type: 'Shop Purchase',
        itemsCount: dbOrder.items_count,
        total: Number(dbOrder.total_amount),
        status: dbOrder.status as any,
      };

      setSubmittedOrders(prev => [newOrder, ...prev]);
      setLastPlacedOrder(newOrder);
      setCart([]);
      setCheckoutStatus('success');
      setIsBoltsDiscountApplied(false);
      showToast('Order created successfully!', 'success');

      // Refresh profile rewards information
      await fetchProfile();
    } catch (err) {
      console.error('Checkout process failed:', err);
      setCheckoutStatus('idle');
      showToast('Checkout failed. Please try again.', 'error');
    }
  }, [cart, cartSummary.total, cartSummary.boltsToDeduct, profile, fetchProfile, showToast]);

  return (
    <CartContext.Provider value={{
      cart,
      isCartOpen,
      setIsCartOpen,
      submittedOrders,
      checkoutStatus,
      lastPlacedOrder,
      setCheckoutStatus,
      cartSummary,
      addToCart,
      addCustomQuoteToCart,
      updateCartQuantity,
      removeFromCart,
      handleCheckout,
      getPartPriceForQuantity,
      profile,
      fetchProfile,
      isBoltsDiscountApplied,
      setIsBoltsDiscountApplied,
      showToast,
      wishlist,
      toggleWishlist,
      isWishlisted,
    }}>
      {children}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-slide-in max-w-sm w-full font-sans">
          <div className={`p-4 rounded-xl border backdrop-blur-md shadow-2xl flex items-start gap-3 transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-950/75 border-emerald-500/40 text-emerald-400 shadow-emerald-950/30'
              : 'bg-rose-950/75 border-rose-500/40 text-rose-400 shadow-rose-950/30'
          }`}>
            {toast.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 shrink-0 mt-0.5 text-rose-500">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            <div className="space-y-1 flex-1">
              <span className={`block text-[10px] font-black uppercase tracking-wider ${
                toast.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {toast.type === 'success' ? 'Success' : 'Error'}
              </span>
              <p className="text-xs font-bold leading-normal text-zinc-100">
                {toast.message}
              </p>
            </div>
            <button 
              onClick={() => setToast(null)}
              className="text-slate-text-muted hover:text-slate-text-primary p-0.5 rounded cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
