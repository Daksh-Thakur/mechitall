'use client';
import React from 'react';
import { User, ShoppingBag, Plus, Trash2, ShoppingCart, RefreshCw, AlertTriangle, CheckCircle2, Package, Play, Camera, Loader2, Upload, MessageSquare, Send, Paperclip, FileText, ExternalLink, CircleDollarSign, X, XCircle, ArrowRight, ArrowLeftRight, Gift, Cpu, IndianRupee, ShieldCheck, Settings, Heart } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function SellerListingsTab(props: any) {
    const { activeChatRfqId, activeShipmentsCount, activeTab, addToCart, base64String, boltsProgressPercent, cadFile, channel, checkUnreadChats, customSpecs, data, datasheetFile, dbProducts, deletingCatalogServiceId, deletingProductId, deletingServiceId, dragActiveCad, dragActiveDatasheet, dragActiveImage, editName, enableBulkPricing, fetchOrders, fetchProfile, fetchSellerData, file, handleDeleteCapability, handleDeleteProduct, handleDeleteService, handleDrag, handleDrop, handlePhotoUploadAndClaim, handleSimulateStatus, handleToggleSellerMode, handleUpdateNameSubmit, handleUpdateOrderStatus, hasNewMsg, hasNewStatus, hasTimedOut, imageFileNames, imagePreviews, isActive, isGuest, isMasterBuilder, isPending, isUpdatingName, listingType, loadingOrders, loadingSeller, loadingSellerOrders, loadingTx, localProducts, localServices, mapped, msg, nextState, openAddListingModal, orderId, orders, params, paymentStatus, processFile, profile, publishingListing, reader, reason, res, response, router, sOrders, seen, seenChats, seenChatsStr, selectedCategory, selectedOrder, selectedProcessType, sellerData, sellerOrders, setActiveChatRfqId, setActiveTab, setCadFile, setCustomSpecs, setDatasheetFile, setDbProducts, setDeletingCatalogServiceId, setDeletingProductId, setDeletingServiceId, setDragActiveCad, setDragActiveDatasheet, setDragActiveImage, setEditName, setEnableBulkPricing, setHasTimedOut, setImageFileNames, setImagePreviews, setIsGuest, setListingType, setLoadingOrders, setLoadingSeller, setLoadingSellerOrders, setLoadingTx, setLocalProducts, setLocalServices, setOrders, setPublishingListing, setSelectedCategory, setSelectedOrder, setSelectedProcessType, setSellerData, setSellerOrders, setShowAddListingModal, setShowKYCModal, setTogglingSeller, setTransactions, setUnreadChatsCount, setUpdatingOrderId, setUploadingOrderId, showAddListingModal, showKYCModal, showToast, sizeStr, startTransition, startTransitionStatus, storedProds, storedServs, supabase, tabParam, timer, toggleWishlist, togglingSeller, transactions, unreadChatsCount, updated, updatingOrderId, uploadingOrderId, wishlist } = props;
  return (
    <>
      {/* Replace props with actual destructured props below */}
      
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
                        <Cpu className="w-4 h-4 text-[#06B6D4]" />
                        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                          Catalog Services ({sellerData ? sellerData.capabilities.length : 0})
                        </h3>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase">Online</span>
                    </div>

                    <div className="space-y-3">
                      {!sellerData || sellerData.capabilities.length === 0 ? (
                        <p className="text-center py-6 text-xs text-zinc-400 font-semibold">No catalog services listed yet.</p>
                      ) : (
                        sellerData.capabilities.map((item) => {
                          const isDeleting = deletingServiceId === item.id;
                          return (
                            <div key={item.id} className="flex justify-between items-center p-3 border border-zinc-700/60 bg-zinc-900/50 rounded text-xs font-medium gap-3">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                {item.image_data ? (
                                  <div className="w-8 h-8 rounded border border-zinc-700/60 overflow-hidden bg-zinc-800 shrink-0">
                                    <img src={item.image_data} alt={item.title} className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded border border-zinc-700/60 bg-zinc-800 text-zinc-500 flex items-center justify-center shrink-0">
                                    <Cpu className="w-4 h-4 text-zinc-400" />
                                  </div>
                                )}
                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-wider truncate">{item.process_type}</span>
                                  <span className="block font-semibold text-white truncate">{item.title}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0 flex items-center gap-4">
                                <div>
                                  <span className="block font-bold text-[#06B6D4]">₹{Number(item.base_price).toLocaleString('en-IN')}/hr</span>
                                  <span className="block text-[8px] font-mono font-bold text-zinc-500 uppercase">{item.lead_time || '3-5 Days'}</span>
                                </div>
                                <button
                                  onClick={() => handleDeleteCapability(item.id)}
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
    </>
  );
}
