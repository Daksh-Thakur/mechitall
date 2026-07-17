import { disputeOrder } from '@/app/actions/orders';
'use client';
import React from 'react';
import { User, ShoppingBag, Plus, Trash2, ShoppingCart, RefreshCw, AlertTriangle, CheckCircle2, Package, Play, Camera, Loader2, Upload, MessageSquare, Send, Paperclip, FileText, ExternalLink, CircleDollarSign, X, XCircle, ArrowRight, ArrowLeftRight, Gift, Cpu, IndianRupee, ShieldCheck, Settings, Heart } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function OrdersTab(props: any) {
    const { activeChatRfqId, activeShipmentsCount, activeTab, addToCart, base64String, boltsProgressPercent, cadFile, channel, checkUnreadChats, customSpecs, data, datasheetFile, dbProducts, deletingCatalogServiceId, deletingProductId, deletingServiceId, dragActiveCad, dragActiveDatasheet, dragActiveImage, editName, enableBulkPricing, fetchOrders, fetchProfile, fetchSellerData, file, handleDeleteCapability, handleDeleteProduct, handleDeleteService, handleDrag, handleDrop, handlePhotoUploadAndClaim, handleSimulateStatus, handleToggleSellerMode, handleUpdateNameSubmit, handleUpdateOrderStatus, hasNewMsg, hasNewStatus, hasTimedOut, imageFileNames, imagePreviews, isActive, isGuest, isMasterBuilder, isPending, isUpdatingName, listingType, loadingOrders, loadingSeller, loadingSellerOrders, loadingTx, localProducts, localServices, mapped, msg, nextState, openAddListingModal, orderId, orders, params, paymentStatus, processFile, profile, publishingListing, reader, reason, res, response, router, sOrders, seen, seenChats, seenChatsStr, selectedCategory, selectedOrder, selectedProcessType, sellerData, sellerOrders, setActiveChatRfqId, setActiveTab, setCadFile, setCustomSpecs, setDatasheetFile, setDbProducts, setDeletingCatalogServiceId, setDeletingProductId, setDeletingServiceId, setDragActiveCad, setDragActiveDatasheet, setDragActiveImage, setEditName, setEnableBulkPricing, setHasTimedOut, setImageFileNames, setImagePreviews, setIsGuest, setListingType, setLoadingOrders, setLoadingSeller, setLoadingSellerOrders, setLoadingTx, setLocalProducts, setLocalServices, setOrders, setPublishingListing, setSelectedCategory, setSelectedOrder, setSelectedProcessType, setSellerData, setSellerOrders, setShowAddListingModal, setShowKYCModal, setTogglingSeller, setTransactions, setUnreadChatsCount, setUpdatingOrderId, setUploadingOrderId, showAddListingModal, showKYCModal, showToast, sizeStr, startTransition, startTransitionStatus, storedProds, storedServs, supabase, tabParam, timer, toggleWishlist, togglingSeller, transactions, unreadChatsCount, updated, updatingOrderId, uploadingOrderId, wishlist, buyerData } = props;
  return (
    <>
      {/* Replace props with actual destructured props below */}
      
      <div className="space-y-6">

        {/* PREMIUM STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-700/60 rounded-xl p-4 shadow-sm hover:border-[#00D0F5]/50 hover:shadow-[#00D0F5]/10 transition-all flex flex-col justify-between group cursor-pointer" onClick={() => setActiveTab('orders')}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Total Orders</span>
              <div className="w-8 h-8 rounded bg-[#00D0F5]/10 text-[#00D0F5] flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-mono">{orders.length}</span>
            </div>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-700/60 rounded-xl p-4 shadow-sm hover:border-amber-500/50 hover:shadow-amber-500/10 transition-all flex flex-col justify-between group cursor-pointer" onClick={() => setActiveTab('rewards')}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Bolts Balance</span>
              <div className="w-8 h-8 rounded bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Gift className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-mono">{profile.wallet_balance}</span>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Bolts</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden border border-zinc-700/30">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${boltsProgressPercent}%` }}></div>
            </div>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-700/60 rounded-xl p-4 shadow-sm hover:border-emerald-500/50 hover:shadow-emerald-500/10 transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Active Shipments</span>
              <div className="w-8 h-8 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-mono">{activeShipmentsCount}</span>
            </div>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-700/60 rounded-xl p-4 shadow-sm hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all flex flex-col justify-between group cursor-pointer" onClick={() => setActiveTab('wishlist')}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Wishlist Items</span>
              <div className="w-8 h-8 rounded bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Heart className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-mono">{wishlist.length}</span>
            </div>
          </div>
        </div>

        {/* Buyer Level & Progress Banner */}
        {buyerData && typeof buyerData.totalUnitsBought === 'number' && (
          <div className="bg-gradient-to-r from-[#0F172A] to-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-zinc-950/60 border border-zinc-700/60 flex items-center justify-center text-xl shadow-inner shrink-0">
                {buyerData.buyerTier === 'Apprentice Builder' && '🌱'}
                {buyerData.buyerTier === 'Pro Builder' && '⚡'}
                {buyerData.buyerTier === 'Master Builder' && '⭐'}
                {buyerData.buyerTier === 'Apex Engineer' && '👑'}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${buyerData.buyerBadgeColor}`}>
                    {buyerData.buyerBadgeText}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-semibold font-sans">
                  Total Products Procured: <span className="text-white font-black font-mono">{buyerData.totalUnitsBought}</span> units
                </p>
              </div>
            </div>

            <div className="w-full md:w-5/12 space-y-1.5">
              <div className="flex justify-between text-[8px] font-black uppercase tracking-wider text-slate-500 font-mono">
                <span>Progress to {buyerData.nextBuyerTier}</span>
                <span>{buyerData.buyerTier === 'Apex Engineer' ? 'MAX LEVEL' : `${buyerData.totalUnitsBought} / ${buyerData.nextBuyerTierGoal} bought`}</span>
              </div>
              <div className="w-full bg-zinc-950 border border-zinc-800 h-2.5 rounded-full overflow-hidden shadow-inner relative">
                <div
                  className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
                  style={{
                    width: `${buyerData.buyerProgress}%`,
                    background:
                      buyerData.buyerTier === 'Apex Engineer'
                        ? 'linear-gradient(90deg, #f43f5e, #fb923c, #fbbf24)'
                        : buyerData.buyerTier === 'Master Builder'
                        ? 'linear-gradient(90deg, #f59e0b, #fde68a, #f59e0b)'
                        : buyerData.buyerTier === 'Pro Builder'
                        ? 'linear-gradient(90deg, #6366f1, #818cf8, #00D0F5)'
                        : 'linear-gradient(90deg, #00D0F5, #34d399)',
                  }}
                >
                  {/* shimmer sweep */}
                  <span
                    className="absolute inset-0 opacity-40 animate-shimmer"
                    style={{
                      backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                    }}
                  ></span>
                </div>
              </div>
            </div>
          </div>
        )}

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
                          onClick={() => {
                            if (ord.rfq_id) {
                              setActiveChatRfqId && setActiveChatRfqId(ord.rfq_id);
                              setActiveTab && setActiveTab('chats');
                            } else {
                              setSelectedOrder(ord);
                            }
                          }}
                          className={`bg-zinc-800 border rounded-xl p-4 shadow-sm space-y-3 cursor-pointer transition-all ${
                            ord.rfq_id 
                              ? 'border-zinc-700/60 hover:border-[#00D0F5]/50 hover:shadow-md' 
                              : isSelected 
                                ? 'border-cobalt ring-2 ring-cobalt/25' 
                                : 'border-zinc-700/60 hover:border-slate-text-secondary/20'
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

                          {/* Removed Inline Expanded Info */}
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
                    <div className="col-span-1 md:col-span-3 bg-zinc-900/10 border border-dashed border-zinc-700/60 rounded-xl p-4 flex flex-col items-center justify-center text-center h-48">
                      <p className="text-xs font-bold text-zinc-400">No items saved for later.</p>
                      <p className="text-[10px] text-zinc-500 mt-1">Items you wishlist will appear here.</p>
                    </div>
                  )}

                  <Link href="/products" className="bg-zinc-900/30 border border-dashed border-zinc-700/60 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-zinc-900/50 transition-colors h-48 group">
                    <Plus className="w-6 h-6 text-zinc-400 group-hover:scale-110 transition-transform mb-2" />
                    <span className="text-xs font-extrabold text-white leading-tight">Continue Shopping</span>
                    <span className="text-[9px] text-zinc-400 leading-tight mt-0.5">Browse latest arrivals</span>
                  </Link>
                </div>
              </div>

              {/* Complete Order Details Popup Modal Card */}
              {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedOrder(null)}>
                  <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-6 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6 relative animate-zoom-in" onClick={(e) => e.stopPropagation()}>
                    
                    {/* Close button */}
                    <button 
                      onClick={() => setSelectedOrder(null)} 
                      className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-700/50 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {/* Header */}
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Order Details</span>
                      <div className="flex flex-wrap items-center justify-between gap-3 mt-1 pr-8">
                        <h2 className="text-base font-black text-white tracking-tight uppercase font-mono">ID: {selectedOrder.id}</h2>
                        
                        {selectedOrder.disputed ? (
                          <span className="px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/20">
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
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/50 border border-zinc-700/40 rounded-xl p-4 text-xs font-semibold text-zinc-400">
                      <div className="space-y-2">
                        <div className="flex justify-between border-b border-zinc-800/50 pb-1.5">
                          <span>Product</span>
                          <span className="text-white font-bold max-w-[180px] truncate text-right" title={selectedOrder.rfq_title || 'Mechatronic Components'}>
                            {selectedOrder.rfq_title || 'Mechatronic Components'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-800/50 pb-1.5">
                          <span>Quantity</span>
                          <span className="text-white font-bold">{selectedOrder.items_count} units</span>
                        </div>
                        <div className="flex justify-between pb-1.5">
                          <span>Order Total</span>
                          <span className="text-coral font-extrabold">₹{Number(selectedOrder.total_amount).toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between border-b border-zinc-800/50 pb-1.5">
                          <span>Payment Mode</span>
                          <span className="text-white font-bold">Secure Escrow</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-800/50 pb-1.5">
                          <span>Date Placed</span>
                          <span className="text-white font-bold font-mono">{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between pb-1.5 items-start">
                           <span>Delivery Address</span>
                           <span className="text-white font-bold text-right max-w-[180px] break-words">
                             {selectedOrder.buyer_address || profile?.business_address || '—'}
                           </span>
                         </div>
                      </div>
                    </div>

                    {/* Shipment Tracking details progress timeline */}
                    <div className="space-y-3">
                      <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider font-mono">Tracking & Payout Progress</span>
                      
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
                    </div>

                    {/* Action Section for Delivery Simulation and Escrow / Bolts Release */}
                    <div className="pt-4 border-t border-zinc-700/60/50 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-mono">Sandbox Actions</span>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Manage order sandbox simulation and claim rewards proof.</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {selectedOrder.rfq_id && (
                          <button
                            onClick={() => {
                              setActiveChatRfqId(selectedOrder.rfq_id);
                              setActiveTab('chats');
                              setSelectedOrder(null);
                            }}
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-lg cursor-pointer transition-all shadow"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Open Quote Chat</span>
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
                                  setSelectedOrder({ ...selectedOrder, disputed: true });
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
                            onClick={async () => {
                              await handleSimulateStatus(selectedOrder.id, 'Shipped');
                              setSelectedOrder({ ...selectedOrder, status: 'Shipped' });
                            }}
                            disabled={isPending}
                            className="btn-cobalt py-1.5 px-3 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            {isPending ? 'Processing...' : 'Simulate Ship'}
                          </button>
                        )}
                        {!selectedOrder.disputed && selectedOrder.status === 'Shipped' && (
                          <button
                            onClick={async () => {
                              await handleSimulateStatus(selectedOrder.id, 'Delivered');
                              setSelectedOrder({ ...selectedOrder, status: 'Delivered' });
                            }}
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
                              htmlFor={`modal-file-upload-${selectedOrder.id}`}
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
                              id={`modal-file-upload-${selectedOrder.id}`}
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
                                Escrow Released
                              </span>
                              <span className="text-[8px] font-mono text-zinc-400 block uppercase tracking-wider">
                                Payout Confirmed
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
    </>
  );
}
