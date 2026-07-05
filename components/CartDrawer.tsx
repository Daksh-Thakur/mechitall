'use client';

import React from 'react';
import { ShoppingCart, X, Minus, Plus, Trash2, ShieldCheck, Activity, CheckCircle2, History } from 'lucide-react';
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
    checkoutStatus,
    setCheckoutStatus,
    lastPlacedOrder,
    profile,
    isBoltsDiscountApplied,
    setIsBoltsDiscountApplied,
  } = useCart();

  if (!isCartOpen && checkoutStatus !== 'success') return null;

  return (
    <>
      {/* SUCCESS DIALOG */}
      {checkoutStatus === 'success' && lastPlacedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-text-primary/45 backdrop-blur-sm"></div>
          <div className="bg-white border border-slate-border rounded-2xl w-full max-w-md p-6 text-center shadow-2xl relative z-10 space-y-6 animate-slide-in">
            <div className="w-16 h-16 rounded-full bg-emerald/10 border border-emerald/20 text-emerald flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8 animate-bounce" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald">Order Confirmed</span>
              <h3 className="text-xl font-extrabold text-slate-text-primary tracking-tight">Order Placed Successfully!</h3>
              <p className="text-xs text-slate-text-muted leading-relaxed max-w-sm mx-auto">
                Your order is being packed and will be dispatched within 24 hours.
              </p>
            </div>
            <div className="p-4 bg-slate-bg border border-slate-border rounded-xl space-y-2 text-left text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-slate-text-muted">Order ID:</span>
                <span className="text-slate-text-primary font-mono font-bold">{lastPlacedOrder.orderId}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-text-muted">Order Total:</span>
                <span className="text-slate-text-primary font-bold">₹{lastPlacedOrder.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-text-muted">Est. Delivery:</span>
                <span className="text-emerald font-bold">1–2 Business Days</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCheckoutStatus('idle')}
                className="flex-1 btn-secondary text-xs font-bold py-2.5 rounded-lg cursor-pointer"
              >
                Back to Store
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {isCartOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-text-primary/20 backdrop-blur-sm z-50 transition-opacity duration-300"
            onClick={() => setIsCartOpen(false)}
          ></div>
          <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white border-l border-slate-border shadow-2xl z-50 flex flex-col justify-between animate-slide-in">
            {/* Header */}
            <div className="p-5 border-b border-slate-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-cobalt" />
                <h3 className="text-base font-bold text-slate-text-primary leading-tight">Shopping Cart</h3>
                <span className="text-[10px] font-bold uppercase bg-cobalt/5 text-cobalt border border-cobalt/15 px-2 py-0.5 rounded">
                  {cartSummary.itemCount} items
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded hover:bg-slate-bg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div key={item.id} className="p-4 bg-slate-bg/50 border border-slate-border rounded-xl space-y-3 flex flex-col">
                    <div className="flex items-start justify-between gap-4">
                      {item.isCustomQuote && item.customDetails ? (
                        <div>
                          <span className="block text-[8px] uppercase tracking-wider text-emerald font-extrabold">Custom Manufactured RFQ</span>
                          <h4 className="text-xs font-bold text-slate-text-primary truncate max-w-[240px] font-mono">{item.customDetails.fileName}</h4>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="text-[8px] bg-emerald/5 text-emerald border border-emerald/25 px-1 py-0.5 rounded font-medium">{item.customDetails.processName}</span>
                            <span className="text-[8px] bg-slate-border/30 text-slate-text-secondary px-1 py-0.5 rounded font-medium">{item.customDetails.materialName}</span>
                          </div>
                        </div>
                      ) : item.part ? (
                        <div>
                          <span className="block text-[8px] uppercase tracking-wider text-cobalt font-extrabold">{item.part.category}</span>
                          <h4 className="text-xs font-bold text-slate-text-primary">{item.part.title}</h4>
                          <span className="text-[8px] font-mono text-slate-text-muted">{item.part.partNumber}</span>
                        </div>
                      ) : null}
                      <button onClick={() => removeFromCart(item.id)} className="text-slate-text-muted hover:text-coral transition-colors p-1" title="Remove item">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-border/30">
                      <div className="flex items-center border border-slate-border bg-white rounded-md">
                        <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)} className="px-2 py-1 text-slate-text-muted hover:text-slate-text-primary">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-xs font-bold text-slate-text-primary min-w-[20px] text-center">{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)} className="px-2 py-1 text-slate-text-muted hover:text-slate-text-primary">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-text-muted">₹{item.pricePerUnit.toFixed(2)}/unit</div>
                        <div className="text-xs font-bold text-slate-text-primary">₹{(item.pricePerUnit * item.quantity).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20 text-slate-text-muted">
                  <ShoppingCart className="w-12 h-12 text-slate-text-muted/30" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-text-primary">Your cart is empty</p>
                    <p className="text-[10px] text-slate-text-muted max-w-[220px]">Browse the parts catalog or configure a custom part to get started.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Summary + CTA */}
            <div className="p-5 border-t border-slate-border bg-slate-bg/50 space-y-4">
              {/* Bolts Discount Control */}
              {profile && profile.wallet_balance > 0 && cartSummary.subtotal > 0 && (
                <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-amber-800 flex items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="w-3.5 h-3.5 text-amber-500 animate-pulse"
                      >
                        <circle cx="12" cy="6" r="4" />
                        <rect x="10" y="10" width="4" height="10" rx="1" />
                      </svg>
                      Apply Bolts (₹{(profile.wallet_balance / 10).toFixed(2)})
                    </span>
                    <span className="block text-[10px] text-amber-700/80 leading-normal font-semibold">
                      Spend {Math.min(profile.wallet_balance, cartSummary.boltsToDeduct || 0)} Bolts to get ₹{cartSummary.boltsDiscount.toFixed(2)} off &amp; <strong>remove 18% GST</strong>!
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

              <div className="space-y-2 text-[11px] font-bold">
                <div className="flex justify-between text-slate-text-secondary">
                  <span>Cart Subtotal</span>
                  <span>₹{cartSummary.subtotal.toFixed(2)}</span>
                </div>
                {cartSummary.subtotal >= 1500 ? (
                  <div className="flex justify-between text-emerald">
                    <span>Bulk Discount ({cartSummary.discountRatePercent}%)</span>
                    <span>-₹{cartSummary.discount.toFixed(2)}</span>
                  </div>
                ) : cartSummary.subtotal > 0 ? (
                  <div className="p-2 bg-cobalt/5 border border-cobalt/15 rounded text-cobalt text-[10px]">
                    Add ₹{(1500 - cartSummary.subtotal).toFixed(2)} more for 8% bulk discount
                  </div>
                ) : null}
                <div className="flex justify-between text-slate-text-secondary">
                  <span>Shipping</span>
                  <span>{cartSummary.shipping === 0 ? 'FREE' : `₹${cartSummary.shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-slate-text-secondary">
                  <span>GST (18%)</span>
                  <span className={isBoltsDiscountApplied ? "line-through text-slate-text-muted animate-pulse font-extrabold" : ""}>
                    ₹{isBoltsDiscountApplied ? ((cartSummary.subtotal - cartSummary.discount) * 0.18).toFixed(2) : cartSummary.tax.toFixed(2)}
                  </span>
                </div>
                {isBoltsDiscountApplied && (
                  <div className="flex justify-between text-emerald">
                    <span>GST Waived (18%)</span>
                    <span>-₹{((cartSummary.subtotal - cartSummary.discount) * 0.18).toFixed(2)}</span>
                  </div>
                )}
                {isBoltsDiscountApplied && cartSummary.boltsDiscount > 0 && (
                  <div className="flex justify-between text-amber-600 font-extrabold">
                    <span>Bolts Reward Discount</span>
                    <span>-₹{cartSummary.boltsDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-slate-border/50 my-1 pt-2 flex justify-between text-slate-text-primary text-sm font-extrabold">
                  <span>Order Total</span>
                  <span className="text-coral">₹{cartSummary.total.toFixed(2)} INR</span>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || checkoutStatus === 'submitting'}
                className="w-full btn-cobalt text-xs font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutStatus === 'submitting' ? (
                  <><Activity className="w-4 h-4 animate-spin" /> Processing your order...</>
                ) : (
                  <><ShieldCheck className="w-4 h-4" /> Place Order Securely</>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
