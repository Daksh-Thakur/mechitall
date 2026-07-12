'use client';
import React from 'react';
import { User, ShoppingBag, Plus, Trash2, ShoppingCart, RefreshCw, AlertTriangle, CheckCircle2, Package, Play, Camera, Loader2, Upload, MessageSquare, Send, Paperclip, FileText, ExternalLink, CircleDollarSign, X, XCircle, ArrowRight, ArrowLeftRight, Gift, Cpu, IndianRupee, ShieldCheck, Settings, Heart } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function WishlistTab(props: any) {
    const { activeChatRfqId, activeShipmentsCount, activeTab, addToCart, base64String, boltsProgressPercent, cadFile, channel, checkUnreadChats, customSpecs, data, datasheetFile, dbProducts, deletingCatalogServiceId, deletingProductId, deletingServiceId, dragActiveCad, dragActiveDatasheet, dragActiveImage, editName, enableBulkPricing, fetchOrders, fetchProfile, fetchSellerData, file, handleDeleteCapability, handleDeleteProduct, handleDeleteService, handleDrag, handleDrop, handlePhotoUploadAndClaim, handleSimulateStatus, handleToggleSellerMode, handleUpdateNameSubmit, handleUpdateOrderStatus, hasNewMsg, hasNewStatus, hasTimedOut, imageFileNames, imagePreviews, isActive, isGuest, isMasterBuilder, isPending, isUpdatingName, listingType, loadingOrders, loadingSeller, loadingSellerOrders, loadingTx, localProducts, localServices, mapped, msg, nextState, openAddListingModal, orderId, orders, params, paymentStatus, processFile, profile, publishingListing, reader, reason, res, response, router, sOrders, seen, seenChats, seenChatsStr, selectedCategory, selectedOrder, selectedProcessType, sellerData, sellerOrders, setActiveChatRfqId, setActiveTab, setCadFile, setCustomSpecs, setDatasheetFile, setDbProducts, setDeletingCatalogServiceId, setDeletingProductId, setDeletingServiceId, setDragActiveCad, setDragActiveDatasheet, setDragActiveImage, setEditName, setEnableBulkPricing, setHasTimedOut, setImageFileNames, setImagePreviews, setIsGuest, setListingType, setLoadingOrders, setLoadingSeller, setLoadingSellerOrders, setLoadingTx, setLocalProducts, setLocalServices, setOrders, setPublishingListing, setSelectedCategory, setSelectedOrder, setSelectedProcessType, setSellerData, setSellerOrders, setShowAddListingModal, setShowKYCModal, setTogglingSeller, setTransactions, setUnreadChatsCount, setUpdatingOrderId, setUploadingOrderId, showAddListingModal, showKYCModal, showToast, sizeStr, startTransition, startTransitionStatus, storedProds, storedServs, supabase, tabParam, timer, toggleWishlist, togglingSeller, transactions, unreadChatsCount, updated, updatingOrderId, uploadingOrderId, wishlist } = props;
  return (
    <>
      {/* Replace props with actual destructured props below */}
      
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
    </>
  );
}
