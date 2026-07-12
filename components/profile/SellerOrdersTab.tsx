'use client';
import React from 'react';
import { User, ShoppingBag, Plus, Trash2, ShoppingCart, RefreshCw, AlertTriangle, CheckCircle2, Package, Play, Camera, Loader2, Upload, MessageSquare, Send, Paperclip, FileText, ExternalLink, CircleDollarSign, X, XCircle, ArrowRight, ArrowLeftRight, Gift, Cpu, IndianRupee, ShieldCheck, Settings, Heart } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function SellerOrdersTab(props: any) {
    const { activeChatRfqId, activeShipmentsCount, activeTab, addToCart, base64String, boltsProgressPercent, cadFile, channel, checkUnreadChats, customSpecs, data, datasheetFile, dbProducts, deletingCatalogServiceId, deletingProductId, deletingServiceId, dragActiveCad, dragActiveDatasheet, dragActiveImage, editName, enableBulkPricing, fetchOrders, fetchProfile, fetchSellerData, file, handleDeleteCapability, handleDeleteProduct, handleDeleteService, handleDrag, handleDrop, handlePhotoUploadAndClaim, handleSimulateStatus, handleToggleSellerMode, handleUpdateNameSubmit, handleUpdateOrderStatus, hasNewMsg, hasNewStatus, hasTimedOut, imageFileNames, imagePreviews, isActive, isGuest, isMasterBuilder, isPending, isUpdatingName, listingType, loadingOrders, loadingSeller, loadingSellerOrders, loadingTx, localProducts, localServices, mapped, msg, nextState, openAddListingModal, orderId, orders, params, paymentStatus, processFile, profile, publishingListing, reader, reason, res, response, router, sOrders, seen, seenChats, seenChatsStr, selectedCategory, selectedOrder, selectedProcessType, sellerData, sellerOrders, setActiveChatRfqId, setActiveTab, setCadFile, setCustomSpecs, setDatasheetFile, setDbProducts, setDeletingCatalogServiceId, setDeletingProductId, setDeletingServiceId, setDragActiveCad, setDragActiveDatasheet, setDragActiveImage, setEditName, setEnableBulkPricing, setHasTimedOut, setImageFileNames, setImagePreviews, setIsGuest, setListingType, setLoadingOrders, setLoadingSeller, setLoadingSellerOrders, setLoadingTx, setLocalProducts, setLocalServices, setOrders, setPublishingListing, setSelectedCategory, setSelectedOrder, setSelectedProcessType, setSellerData, setSellerOrders, setShowAddListingModal, setShowKYCModal, setTogglingSeller, setTransactions, setUnreadChatsCount, setUpdatingOrderId, setUploadingOrderId, showAddListingModal, showKYCModal, showToast, sizeStr, startTransition, startTransitionStatus, storedProds, storedServs, supabase, tabParam, timer, toggleWishlist, togglingSeller, transactions, unreadChatsCount, updated, updatingOrderId, uploadingOrderId, wishlist } = props;
  return (
    <>
      {/* Replace props with actual destructured props below */}
      
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
                      'Delivered': null, // Buyer must upload photo to trigger Completed status
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
                              Buyer: <span className="text-zinc-500">{order.buyer_name}</span>
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
    </>
  );
}
