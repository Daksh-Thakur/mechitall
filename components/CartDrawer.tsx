'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, X, Minus, Plus, Trash2, ShieldCheck, Activity, CheckCircle2, History, MapPin, User, Mail, Phone, Edit3 } from 'lucide-react';
import { useCart } from './CartProvider';

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    cartSummary,
    updateCartQuantity,
    removeFromCart,
    handleCheckout,
    handleDeliveryConfirm,
    showDeliveryModal,
    setShowDeliveryModal,
    checkoutStatus,
    setCheckoutStatus,
    lastPlacedOrder,
    profile,
    isBoltsDiscountApplied,
    setIsBoltsDiscountApplied,
  } = useCart();

  // Local delivery form state – pre-filled from profile
  const [deliveryName, setDeliveryName] = useState('');
  const [deliveryEmail, setDeliveryEmail] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliverySubmitting, setDeliverySubmitting] = useState(false);

  // Pre-fill form whenever the modal opens or profile changes
  useEffect(() => {
    if (showDeliveryModal) {
      setDeliveryName(profile?.full_name || '');
      setDeliveryEmail(profile?.email || '');
      setDeliveryPhone('');
      setDeliveryAddress(profile?.business_address || '');
    }
  }, [showDeliveryModal, profile]);

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeliverySubmitting(true);
    await handleDeliveryConfirm({
      name: deliveryName,
      email: deliveryEmail,
      phone: deliveryPhone,
      address: deliveryAddress,
    });
    setDeliverySubmitting(false);
  };

  if (!isCartOpen && checkoutStatus !== 'success' && !showDeliveryModal) return null;

  return (
    <>
      {/* SUCCESS DIALOG */}
      {checkoutStatus === 'success' && lastPlacedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
          <div className="bg-white border border-[#E4E4E7] rounded w-full max-w-md p-6 text-center shadow-xl relative z-10 space-y-5 animate-slide-in">
            <div className="w-12 h-12 rounded bg-emerald/10 border border-emerald/20 text-emerald flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-6 h-6 animate-bounce" />
            </div>
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald font-mono">Order Confirmed</span>
              <h3 className="text-lg font-bold text-[#0F172A] uppercase font-['Space_Grotesk'] tracking-tight">Order Placed Successfully!</h3>
              <p className="text-xs text-[#76777d] leading-relaxed max-w-xs mx-auto">
                Your mechatronics order is confirmed and will be dispatched via express courier within 24 hours.
              </p>
            </div>
            <div className="p-4 bg-[#F8FAFC] border border-[#E4E4E7] rounded space-y-2 text-left text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#76777d] uppercase text-[9px] font-bold">Order ID:</span>
                <span className="text-[#0f172a] font-bold">{lastPlacedOrder.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#76777d] uppercase text-[9px] font-bold">Order Total:</span>
                <span className="text-[#0f172a] font-bold">₹{lastPlacedOrder.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#76777d] uppercase text-[9px] font-bold">Est. Delivery:</span>
                <span className="text-emerald font-bold uppercase text-[10px]">1–2 Business Days</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCheckoutStatus('idle')}
                className="flex-1 bg-[#0F172A] hover:bg-[#06B6D4] text-white py-2.5 rounded text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer text-center"
              >
                Back to Store
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELIVERY DETAILS MODAL */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => setShowDeliveryModal(false)}></div>
          <div className="bg-white border border-[#E4E4E7] rounded-xl w-full max-w-lg p-6 shadow-2xl relative z-10 space-y-5 animate-slide-in">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cobalt" />
                  <h3 className="text-sm font-bold text-[#0F172A] uppercase font-['Space_Grotesk'] tracking-wider">Confirm Delivery Details</h3>
                </div>
                <p className="text-[10px] text-[#76777d] font-mono pl-6">Review and edit your shipping information before payment</p>
              </div>
              <button
                onClick={() => setShowDeliveryModal(false)}
                className="p-1.5 rounded hover:bg-[#F8FAFC] border border-[#E4E4E7] text-[#76777d] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Order summary strip */}
            <div className="p-3 bg-[#F8FAFC] border border-[#E4E4E7] rounded-lg flex items-center justify-between text-xs font-mono">
              <span className="text-[#76777d] font-bold uppercase tracking-wider text-[9px]">{cartSummary.itemCount} item{cartSummary.itemCount !== 1 ? 's' : ''}</span>
              <span className="text-[#0F172A] font-bold text-sm">₹{cartSummary.total.toFixed(2)}</span>
            </div>

            {/* Form */}
            <form onSubmit={handleDeliverySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[9px] font-bold text-[#45464d] uppercase tracking-wider font-mono">
                    <User className="w-3 h-3" /> Recipient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryName}
                    onChange={e => setDeliveryName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-3 py-2 text-xs border border-[#E4E4E7] rounded-lg bg-white text-[#0F172A] placeholder-[#76777d] focus:outline-none focus:border-cobalt/50 focus:ring-1 focus:ring-cobalt/20 font-mono"
                  />
                </div>
                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[9px] font-bold text-[#45464d] uppercase tracking-wider font-mono">
                    <Phone className="w-3 h-3" /> Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={deliveryPhone}
                    onChange={e => setDeliveryPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 text-xs border border-[#E4E4E7] rounded-lg bg-white text-[#0F172A] placeholder-[#76777d] focus:outline-none focus:border-cobalt/50 focus:ring-1 focus:ring-cobalt/20 font-mono"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[9px] font-bold text-[#45464d] uppercase tracking-wider font-mono">
                  <Mail className="w-3 h-3" /> Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={deliveryEmail}
                  onChange={e => setDeliveryEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 text-xs border border-[#E4E4E7] rounded-lg bg-white text-[#0F172A] placeholder-[#76777d] focus:outline-none focus:border-cobalt/50 focus:ring-1 focus:ring-cobalt/20 font-mono"
                />
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[9px] font-bold text-[#45464d] uppercase tracking-wider font-mono">
                  <MapPin className="w-3 h-3" /> Shipping Address *
                </label>
                <textarea
                  required
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  placeholder="House/Flat no., Street, Area, City, State, PIN"
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-[#E4E4E7] rounded-lg bg-white text-[#0F172A] placeholder-[#76777d] focus:outline-none focus:border-cobalt/50 focus:ring-1 focus:ring-cobalt/20 font-mono resize-none"
                />
              </div>

              <p className="text-[9px] text-[#76777d] font-mono leading-relaxed flex items-start gap-1.5">
                <Edit3 className="w-3 h-3 shrink-0 mt-0.5 text-cobalt" />
                These details will be saved to your profile and shared with the seller for delivery coordination.
              </p>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="px-4 py-2.5 border border-[#E4E4E7] text-[#45464d] rounded-lg text-xs font-mono font-bold hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deliverySubmitting}
                  className="flex-1 bg-[#0f172a] hover:bg-[#06b6d4] text-white py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deliverySubmitting ? (
                    <><Activity className="w-3.5 h-3.5 animate-spin" /> Saving & Proceeding...</>
                  ) : (
                    <><ShieldCheck className="w-3.5 h-3.5" /> Confirm &amp; Proceed to Payment</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {isCartOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity duration-300"
            onClick={() => setIsCartOpen(false)}
          ></div>
          <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[460px] bg-white border-l border-[#E4E4E7] shadow-2xl z-50 flex flex-col justify-between animate-slide-in">
            {/* Header */}
            <div className="p-4 border-b border-[#E4E4E7] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-cobalt" />
                <h3 className="text-sm font-bold text-[#0F172A] uppercase font-['Space_Grotesk'] tracking-wider">Shopping Cart</h3>
                <span className="text-[9px] font-bold uppercase bg-cobalt/5 text-cobalt border border-cobalt/10 px-2 py-0.5 rounded font-mono">
                  {cartSummary.itemCount} items
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded hover:bg-[#F8FAFC] border border-[#E4E4E7] text-[#76777d] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div key={item.id} className="p-3.5 bg-[#F8FAFC]/50 border border-[#E4E4E7] rounded space-y-3 flex flex-col">
                    <div className="flex items-start justify-between gap-4">
                      {item.isCustomQuote && item.customDetails ? (
                        <div>
                          <span className="block text-[8px] uppercase tracking-wider text-emerald font-bold font-mono">Custom Manufactured RFQ</span>
                          <h4 className="text-xs font-bold text-[#0F172A] truncate max-w-[220px] font-mono mt-0.5">{item.customDetails.fileName}</h4>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="text-[8px] bg-emerald/5 text-emerald border border-emerald/20 px-1 py-0.5 rounded font-mono font-bold uppercase tracking-wider">{item.customDetails.processName}</span>
                            <span className="text-[8px] bg-[#E4E4E7] text-[#45464d] px-1 py-0.5 rounded font-mono font-bold uppercase tracking-wider">{item.customDetails.materialName}</span>
                          </div>
                        </div>
                      ) : item.part ? (
                        <div>
                          <span className="block text-[8px] uppercase tracking-wider text-cobalt font-bold font-mono">{item.part.category}</span>
                          <h4 className="text-xs font-bold text-[#0F172A] mt-0.5">{item.part.title}</h4>
                          <span className="text-[8px] font-mono text-[#76777d]">SKU: {item.part.partNumber}</span>
                        </div>
                      ) : null}
                      <button 
                        onClick={() => removeFromCart(item.id)} 
                        className="text-[#76777d] hover:text-red-500 transition-colors p-1 border border-[#E4E4E7] rounded bg-white hover:bg-[#F8FAFC] cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between pt-2.5 border-t border-[#E4E4E7]">
                      <div className="flex items-center border border-[#E4E4E7] bg-white rounded">
                        <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)} className="px-2 py-1 text-[#76777d] hover:text-[#0F172A] cursor-pointer">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-[#0F172A] min-w-[20px] text-center font-mono">{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)} className="px-2 py-1 text-[#76777d] hover:text-[#0F172A] cursor-pointer">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-[#76777d] font-mono">₹{item.pricePerUnit.toFixed(2)}/unit</div>
                        <div className="text-xs font-bold text-[#0F172A] font-mono">₹{(item.pricePerUnit * item.quantity).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-20 text-[#76777d]">
                  <ShoppingCart className="w-10 h-10 text-[#76777d]/30" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#0F172A]">Your cart is empty</p>
                    <p className="text-[10px] text-[#76777d] max-w-[200px] leading-relaxed">Browse the mechatronics catalog or configure a custom part to build your order.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Summary + CTA */}
            <div className="p-4 border-t border-[#E4E4E7] bg-[#F8FAFC] space-y-3">
              {/* Bolts Discount Control */}
              {profile && profile.wallet_balance > 0 && cartSummary.subtotal > 0 && (
                <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-amber-800 flex items-center gap-1 font-mono uppercase text-[9px] tracking-wider">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-3.5 h-3.5 text-amber-500 animate-pulse"
                      >
                        <polygon points="8,3 16,3 18,7 16,11 8,11 6,7" fill="none" />
                        <line x1="10" y1="3" x2="10" y2="11" />
                        <line x1="14" y1="3" x2="14" y2="11" />
                        <path d="M9,11v9c0,0.6 0.4,1 1,1h4c0.6,0 1,-0.4 1,-1v-9" />
                        <line x1="9" y1="13.5" x2="15" y2="12" />
                        <line x1="9" y1="16" x2="15" y2="14.5" />
                        <line x1="9" y1="18.5" x2="15" y2="17" />
                      </svg>
                      Apply Bolts (₹{(profile.wallet_balance / 10).toFixed(2)})
                    </span>
                    <span className="block text-[9px] text-amber-700/80 leading-normal font-semibold">
                      Spend {Math.min(profile.wallet_balance, cartSummary.boltsToDeduct || 0)} Bolts to get ₹{cartSummary.boltsDiscount.toFixed(2)} off!
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                    <input
                      type="checkbox"
                      checked={isBoltsDiscountApplied}
                      onChange={(e) => setIsBoltsDiscountApplied(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              )}

              <div className="space-y-1.5 text-[10px] font-bold uppercase tracking-wider font-mono">
                <div className="flex justify-between text-[#45464d]">
                  <span>Cart Subtotal</span>
                  <span className="font-sans font-bold">₹{cartSummary.subtotal.toFixed(2)}</span>
                </div>
                {cartSummary.subtotal >= 1500 ? (
                  <div className="flex justify-between text-emerald">
                    <span>Bulk Discount ({cartSummary.discountRatePercent}%)</span>
                    <span className="font-sans font-bold">-₹{cartSummary.discount.toFixed(2)}</span>
                  </div>
                ) : cartSummary.subtotal > 0 ? (
                  <div className="p-2 bg-cobalt/5 border border-cobalt/10 rounded text-cobalt text-[9px] font-sans normal-case">
                    Add ₹{(1500 - cartSummary.subtotal).toFixed(2)} more for 8% bulk discount
                  </div>
                ) : null}
                <div className="flex justify-between text-[#45464d]">
                  <span>Shipping</span>
                  <span className="font-sans font-bold">{cartSummary.shipping === 0 ? 'FREE' : `₹${cartSummary.shipping.toFixed(2)}`}</span>
                </div>
                {isBoltsDiscountApplied && cartSummary.boltsDiscount > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Bolts Reward Discount</span>
                    <span className="font-sans font-bold">-₹{cartSummary.boltsDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-[#E4E4E7] my-1 pt-2 flex justify-between text-[#0F172A] text-xs font-bold uppercase tracking-wider font-mono">
                  <span>Order Total</span>
                  <span className="text-[#0F172A] font-sans font-bold text-sm">₹{cartSummary.total.toFixed(2)} INR</span>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || checkoutStatus === 'submitting'}
                className="w-full bg-[#0f172a] hover:bg-[#06b6d4] text-white py-2.5 rounded text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutStatus === 'submitting' ? (
                  <><Activity className="w-3.5 h-3.5 animate-spin" /> Processing order...</>
                ) : (
                  <><ShieldCheck className="w-3.5 h-3.5" /> Place Order Securely</>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
