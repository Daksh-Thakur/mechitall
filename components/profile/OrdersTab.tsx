import { initiatePayUExistingOrderPayment, disputeOrder } from '@/app/actions/orders';
'use client';
import React from 'react';
import { User, ShoppingBag, Plus, Trash2, ShoppingCart, RefreshCw, AlertTriangle, CheckCircle2, Package, Play, Camera, Loader2, Upload, MessageSquare, Send, Paperclip, FileText, ExternalLink, CircleDollarSign, X, XCircle, ArrowRight, ArrowLeftRight, Gift, Cpu, IndianRupee, ShieldCheck, Settings, Heart } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function OrdersTab(props: any) {
    const { activeChatRfqId, activeShipmentsCount, activeTab, addToCart, base64String, boltsProgressPercent, cadFile, channel, checkUnreadChats, customSpecs, data, datasheetFile, dbProducts, deletingCatalogServiceId, deletingProductId, deletingServiceId, dragActiveCad, dragActiveDatasheet, dragActiveImage, editName, enableBulkPricing, fetchOrders, fetchProfile, fetchSellerData, file, handleDeleteCapability, handleDeleteProduct, handleDeleteService, handleDrag, handleDrop, handlePhotoUploadAndClaim, handleSimulateStatus, handleToggleSellerMode, handleUpdateNameSubmit, handleUpdateOrderStatus, hasNewMsg, hasNewStatus, hasTimedOut, imageFileNames, imagePreviews, isActive, isGuest, isMasterBuilder, isPending, isUpdatingName, listingType, loadingOrders, loadingSeller, loadingSellerOrders, loadingTx, localProducts, localServices, mapped, msg, nextState, openAddListingModal, orderId, orders, params, paymentStatus, processFile, profile, publishingListing, reader, reason, res, response, router, sOrders, seen, seenChats, seenChatsStr, selectedCategory, selectedOrder, selectedProcessType, sellerData, sellerOrders, setActiveChatRfqId, setActiveTab, setCadFile, setCustomSpecs, setDatasheetFile, setDbProducts, setDeletingCatalogServiceId, setDeletingProductId, setDeletingServiceId, setDragActiveCad, setDragActiveDatasheet, setDragActiveImage, setEditName, setEnableBulkPricing, setHasTimedOut, setImageFileNames, setImagePreviews, setIsGuest, setListingType, setLoadingOrders, setLoadingSeller, setLoadingSellerOrders, setLoadingTx, setLocalProducts, setLocalServices, setOrders, setPublishingListing, setSelectedCategory, setSelectedOrder, setSelectedProcessType, setSellerData, setSellerOrders, setShowAddListingModal, setShowKYCModal, setTogglingSeller, setTransactions, setUnreadChatsCount, setUpdatingOrderId, setUploadingOrderId, showAddListingModal, showKYCModal, showToast, sizeStr, startTransition, startTransitionStatus, storedProds, storedServs, supabase, tabParam, timer, toggleWishlist, togglingSeller, transactions, unreadChatsCount, updated, updatingOrderId, uploadingOrderId, wishlist } = props;
  return (
    <>
      {/* Replace props with actual destructured props below */}
      
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

                          <div className="space-y-1 text-zinc-500 text-xs">
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
                    {selectedOrder.disputed ? (
                      <span className={`px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/20`}>
                        DISPUTED (FROZEN)
                      </span>
                    ) : (
                      <span className={`px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest ${
                        selectedOrder.status === 'Pending Payment'
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : 'bg-blue-500/10 text-cobalt border border-blue-500/20'
                      }`}>
                        {selectedOrder.status === 'Completed' ? 'DELIVERED' : selectedOrder.status === 'Delivered' ? 'OUT FOR DELIVERY' : selectedOrder.status === 'Pending Payment' ? 'PENDING PAYMENT' : 'IN PROCESSING'}
                      </span>
                    )}
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

                    <div className="relative flex justify-between text-center text-[10px] font-bold text-zinc-500 z-10">
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

                      {/* Pay Now Button for Pending Payment orders */}
                      {selectedOrder.status === 'Pending Payment' && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await initiatePayUExistingOrderPayment(selectedOrder.id);
                              if (res.success && res.payuParams) {
                                const { payuParams, payuUrl } = res;
                                if (payuUrl.startsWith('/')) {
                                  const searchParams = new URLSearchParams(payuParams as any);
                                  window.location.href = `${payuUrl}?${searchParams.toString()}`;
                                } else {
                                  const form = document.createElement('form');
                                  form.method = 'POST';
                                  form.action = payuUrl;
                                  Object.entries(payuParams).forEach(([k, v]) => {
                                    const input = document.createElement('input');
                                    input.type = 'hidden';
                                    input.name = k;
                                    input.value = String(v);
                                    form.appendChild(input);
                                  });
                                  document.body.appendChild(form);
                                  form.submit();
                                }
                              } else {
                                showToast(res.error || 'Failed to initiate payment', 'error');
                              }
                            } catch (e: any) {
                              showToast(e.message || 'Payment initiation error', 'error');
                            }
                          }}
                          className="bg-[#A3E635] hover:bg-[#bef264] text-zinc-950 font-bold py-1.5 px-3 rounded-lg text-[10px] uppercase tracking-wider cursor-pointer transition-all shadow"
                        >
                          Pay Now (PayU)
                        </button>
                      )}

                      {/* Dispute / Report Issue Button */}
                      {!selectedOrder.disputed && selectedOrder.status !== 'Completed' && selectedOrder.status !== 'Pending Payment' && (
                        <button
                          onClick={async () => {
                            const reason = window.prompt('Please enter the reason for reporting an issue / disputing this order:');
                            if (!reason) return;
                            try {
                              const res = await disputeOrder(selectedOrder.id, reason);
                              if (res.success) {
                                showToast('Issue reported successfully. Escrow funds have been frozen.', 'success');
                                await fetchOrders();
                              } else {
                                showToast(res.error || 'Failed to file dispute', 'error');
                              }
                            } catch (e: any) {
                              showToast(e.message || 'Dispute submission failed', 'error');
                            }
                          }}
                          className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-bold py-1.5 px-3 rounded-lg text-[10px] uppercase tracking-wider border border-rose-500/20 cursor-pointer transition-all"
                        >
                          Report an Issue
                        </button>
                      )}

                      {selectedOrder.disputed && (
                        <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider bg-rose-500/5 px-3 py-1.5 rounded border border-rose-500/10">
                          Mediation Active: Funds Locked (72h)
                        </span>
                      )}

                      {!selectedOrder.disputed && selectedOrder.status === 'Processing' && (
                        <button
                          onClick={() => handleSimulateStatus(selectedOrder.id, 'Shipped')}
                          disabled={isPending}
                          className="btn-cobalt py-1.5 px-3 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          {isPending ? 'Processing...' : 'Simulate Ship'}
                        </button>
                      )}
                      {!selectedOrder.disputed && selectedOrder.status === 'Shipped' && (
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
    </>
  );
}
