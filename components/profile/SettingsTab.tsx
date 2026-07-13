'use client';
import React from 'react';
import { User, ShoppingBag, Plus, Trash2, ShoppingCart, RefreshCw, AlertTriangle, CheckCircle2, Package, Play, Camera, Loader2, Upload, MessageSquare, Send, Paperclip, FileText, ExternalLink, CircleDollarSign, X, XCircle, ArrowRight, ArrowLeftRight, Gift, Cpu, IndianRupee, ShieldCheck, Settings, Heart } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function SettingsTab(props: any) {
    const { activeChatRfqId, activeShipmentsCount, activeTab, addToCart, base64String, boltsProgressPercent, cadFile, channel, checkUnreadChats, customSpecs, data, datasheetFile, dbProducts, deletingCatalogServiceId, deletingProductId, deletingServiceId, dragActiveCad, dragActiveDatasheet, dragActiveImage, editName, enableBulkPricing, fetchOrders, fetchProfile, fetchSellerData, file, handleDeleteCapability, handleDeleteProduct, handleDeleteService, handleDrag, handleDrop, handlePhotoUploadAndClaim, handleProfilePhotoUpload, handleSimulateStatus, handleToggleSellerMode, handleUpdateNameSubmit, handleUpdateOrderStatus, hasNewMsg, hasNewStatus, hasTimedOut, imageFileNames, imagePreviews, isActive, isGuest, isMasterBuilder, isPending, isUpdatingName, isUpdatingPhoto, listingType, loadingOrders, loadingSeller, loadingSellerOrders, loadingTx, localProducts, localServices, mapped, msg, nextState, openAddListingModal, orderId, orders, params, paymentStatus, processFile, profile, publishingListing, reader, reason, res, response, router, sOrders, seen, seenChats, seenChatsStr, selectedCategory, selectedOrder, selectedProcessType, sellerData, sellerOrders, setActiveChatRfqId, setActiveTab, setCadFile, setCustomSpecs, setDatasheetFile, setDbProducts, setDeletingCatalogServiceId, setDeletingProductId, setDeletingServiceId, setDragActiveCad, setDragActiveDatasheet, setDragActiveImage, setEditName, setEnableBulkPricing, setHasTimedOut, setImageFileNames, setImagePreviews, setIsGuest, setListingType, setLoadingOrders, setLoadingSeller, setLoadingSellerOrders, setLoadingTx, setLocalProducts, setLocalServices, setOrders, setPublishingListing, setSelectedCategory, setSelectedOrder, setSelectedProcessType, setSellerData, setSellerOrders, setShowAddListingModal, setShowKYCModal, setTogglingSeller, setTransactions, setUnreadChatsCount, setUpdatingOrderId, setUploadingOrderId, showAddListingModal, showKYCModal, showToast, sizeStr, startTransition, startTransitionStatus, storedProds, storedServs, supabase, tabParam, timer, toggleWishlist, togglingSeller, transactions, unreadChatsCount, updated, updatingOrderId, uploadingOrderId, wishlist } = props;
  return (
    <>
      {/* Replace props with actual destructured props below */}
      
      <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-black text-white tracking-tight uppercase">Account Settings</h2>
                <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                  Update your contact details and edit your shopper account parameters.
                </p>
              </div>

              <form onSubmit={handleUpdateNameSubmit} className="space-y-6 max-w-md">
                
                {/* Profile Photo Upload */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    Profile Photo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-700/60 overflow-hidden flex-shrink-0 relative group flex items-center justify-center">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-zinc-500" />
                      )}
                      {isUpdatingPhoto && (
                        <div className="absolute inset-0 bg-zinc-900/80 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-cobalt animate-spin" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="avatar-upload"
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-2 rounded-lg cursor-pointer transition-all shadow"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Upload Photo
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfilePhotoUpload}
                        disabled={isUpdatingPhoto}
                      />
                      <span className="block text-[9px] text-zinc-500 mt-1 font-bold">Square aspect ratio recommended (Max 2MB).</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profile.email || 'guest@mechitall.io'}
                    className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/50 text-zinc-400 focus:outline-none cursor-not-allowed"
                  />
                  <span className="block text-[9px] text-zinc-400 font-bold">Email address updates require secondary authorization.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={isUpdatingName}
                    placeholder="Elias Thorne"
                    className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-cobalt transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingName}
                  className="btn-cobalt py-3 px-6 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingName ? 'Saving Changes...' : 'Save Settings'}
                </button>
              </form>
            </div>
    </>
  );
}
