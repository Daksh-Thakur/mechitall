'use client';

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { Part } from './mockData';

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
  status: 'Processing' | 'Analyzing CAD' | 'Approved' | 'Shipped';
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
  };
  addToCart: (part: Part, quantity: number) => void;
  addCustomQuoteToCart: (item: Omit<CartItem, 'id'>) => void;
  updateCartQuantity: (id: string, newQty: number) => void;
  removeFromCart: (id: string) => void;
  handleCheckout: () => void;
  getPartPriceForQuantity: (part: Part, qty: number) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [submittedOrders, setSubmittedOrders] = useState<SubmittedOrder[]>([]);
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [lastPlacedOrder, setLastPlacedOrder] = useState<SubmittedOrder | null>(null);

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
    setIsCartOpen(true);
  }, [getPartPriceForQuantity]);

  const addCustomQuoteToCart = useCallback((item: Omit<CartItem, 'id'>) => {
    setCart(prev => [...prev, { ...item, id: `custom-${Date.now()}` }]);
    setIsCartOpen(true);
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
    const tax = (subtotal - discount) * 0.18;
    const total = subtotal - discount + shipping + tax;
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      discountRatePercent: discountRate * 100,
      shipping,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    };
  }, [cart]);

  const handleCheckout = useCallback(() => {
    if (cart.length === 0) return;
    setCheckoutStatus('submitting');
    setTimeout(() => {
      const orderId = `PO-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const newOrder: SubmittedOrder = {
        orderId,
        date: new Date().toISOString().split('T')[0],
        type: 'Shop Purchase',
        itemsCount: cart.length,
        total: cartSummary.total,
        status: 'Processing',
      };
      setSubmittedOrders(prev => [newOrder, ...prev]);
      setLastPlacedOrder(newOrder);
      setCart([]);
      setCheckoutStatus('success');
    }, 1800);
  }, [cart, cartSummary.total]);

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
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
