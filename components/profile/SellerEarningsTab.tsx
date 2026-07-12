'use client';
import React from 'react';
import { User, ShoppingBag, Plus, Trash2, ShoppingCart, RefreshCw, AlertTriangle, CheckCircle2, Package, Play, Camera, Loader2, Upload, MessageSquare, Send, Paperclip, FileText, ExternalLink, CircleDollarSign, X, XCircle, ArrowRight, ArrowLeftRight, Gift, Cpu, IndianRupee, ShieldCheck, Settings, Heart } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function SellerEarningsTab(props: any) {
    const { activeChatRfqId, activeShipmentsCount, activeTab, addToCart, base64String, boltsProgressPercent, cadFile, channel, checkUnreadChats, customSpecs, data, datasheetFile, dbProducts, deletingCatalogServiceId, deletingProductId, deletingServiceId, dragActiveCad, dragActiveDatasheet, dragActiveImage, editName, enableBulkPricing, fetchOrders, fetchProfile, fetchSellerData, file, handleDeleteCapability, handleDeleteProduct, handleDeleteService, handleDrag, handleDrop, handlePhotoUploadAndClaim, handleSimulateStatus, handleToggleSellerMode, handleUpdateNameSubmit, handleUpdateOrderStatus, hasNewMsg, hasNewStatus, hasTimedOut, imageFileNames, imagePreviews, isActive, isGuest, isMasterBuilder, isPending, isUpdatingName, listingType, loadingOrders, loadingSeller, loadingSellerOrders, loadingTx, localProducts, localServices, mapped, msg, nextState, openAddListingModal, orderId, orders, params, paymentStatus, processFile, profile, publishingListing, reader, reason, res, response, router, sOrders, seen, seenChats, seenChatsStr, selectedCategory, selectedOrder, selectedProcessType, sellerData, sellerOrders, setActiveChatRfqId, setActiveTab, setCadFile, setCustomSpecs, setDatasheetFile, setDbProducts, setDeletingCatalogServiceId, setDeletingProductId, setDeletingServiceId, setDragActiveCad, setDragActiveDatasheet, setDragActiveImage, setEditName, setEnableBulkPricing, setHasTimedOut, setImageFileNames, setImagePreviews, setIsGuest, setListingType, setLoadingOrders, setLoadingSeller, setLoadingSellerOrders, setLoadingTx, setLocalProducts, setLocalServices, setOrders, setPublishingListing, setSelectedCategory, setSelectedOrder, setSelectedProcessType, setSellerData, setSellerOrders, setShowAddListingModal, setShowKYCModal, setTogglingSeller, setTransactions, setUnreadChatsCount, setUpdatingOrderId, setUploadingOrderId, showAddListingModal, showKYCModal, showToast, sizeStr, startTransition, startTransitionStatus, storedProds, storedServs, supabase, tabParam, timer, toggleWishlist, togglingSeller, transactions, unreadChatsCount, updated, updatingOrderId, uploadingOrderId, wishlist } = props;
  return (
    <>
      {/* Replace props with actual destructured props below */}
      
      <div className="space-y-6">
              {/* Header */}
              <div className="bg-zinc-800 border border-zinc-700/60 rounded p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight uppercase font-['Space_Grotesk']">Seller Earnings Dashboard</h2>
                  <p className="text-xs text-zinc-500 mt-1 font-semibold">
                    Monitor your weekly sales velocity, track pending payouts, and view completed custom order ledger history.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-emerald bg-emerald/5 border border-emerald/15 px-3 py-1.5 rounded">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Account Verified</span>
                </div>
              </div>

              {loadingSeller && !sellerData ? (
                <div className="bg-zinc-800 border border-zinc-700/60 p-12 text-center rounded space-y-3">
                  <RefreshCw className="w-8 h-8 text-cobalt animate-spin mx-auto" />
                  <p className="text-xs font-bold text-zinc-400 animate-pulse">Loading financial summary...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Metrics */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-zinc-800 border border-zinc-700/60 p-6 rounded shadow-sm space-y-4">
                      <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-mono">
                        Active Job Escrow
                      </span>
                      <div className="space-y-1">
                        <span className="text-3xl font-black text-white block tracking-tight">
                          ₹{sellerData ? Number((sellerData as any).escrowBalance || 0).toLocaleString('en-IN') : '0'}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-bold block">
                          Escrow funds from active contracts
                        </span>
                      </div>
                    </div>

                    <div className="bg-zinc-800 border border-zinc-700/60 p-6 rounded shadow-sm space-y-4">
                      <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-mono text-emerald-600">
                        Cleared Earnings
                      </span>
                      <div className="space-y-1">
                        <span className="text-3xl font-black text-emerald-600 block tracking-tight">
                          ₹{sellerData ? Number((sellerData as any).clearedEarnings || 0).toLocaleString('en-IN') : '0'}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-bold block">
                          Released funds available for payout
                        </span>
                      </div>
                    </div>

                    <div className="bg-zinc-800 border border-zinc-700/60 p-6 rounded shadow-sm space-y-3">
                      <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-mono">
                        Payout Preferences
                      </span>
                      <div className="space-y-1 bg-zinc-900/70 border border-zinc-700/60/40 p-3 rounded text-[11px] font-semibold text-zinc-500">
                        <p className="flex justify-between">
                          <span>Bank Account:</span>
                          <span className="text-slate-900 font-bold">•••• 4820</span>
                        </p>
                        <p className="flex justify-between mt-1">
                          <span>IFS Code:</span>
                          <span className="text-slate-900 font-bold">HDFC0000104</span>
                        </p>
                        <p className="flex justify-between mt-1">
                          <span>Settlement Period:</span>
                          <span className="text-slate-900 font-bold">T+2 Days</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Chart and Ledger */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Velocity Chart */}
                    <div className="bg-zinc-800 border border-zinc-700/60 p-6 rounded shadow-sm space-y-4">
                      <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-mono">
                        Weekly Sales Velocity
                      </span>

                      <div className="flex items-end justify-between h-40 pt-4 px-2">
                        {sellerData?.earningsVelocity.map((item, idx) => {
                          const maxVal = Math.max(...sellerData.earningsVelocity.map(v => v.amount), 1);
                          const barHeight = Math.max(8, (item.amount / maxVal) * 100);
                          return (
                            <div key={idx} className="flex flex-col items-center gap-2 w-12 group">
                              <span className="text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                ₹{item.amount.toLocaleString('en-IN')}
                              </span>
                              <div className="w-8 bg-[#E2E8F0] hover:bg-cobalt rounded-t-sm transition-all duration-200" style={{ height: `${barHeight}%` }} />
                              <span className="text-[9px] font-mono font-bold text-zinc-400 block mt-1">
                                {item.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Job Ledger */}
                    <div className="bg-zinc-800 border border-zinc-700/60 rounded shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-zinc-700/60">
                        <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-mono">
                          Recent Contracts Ledger
                        </span>
                      </div>

                      {!sellerData || (sellerData.activeJobs.length === 0 && sellerData.completedJobs.length === 0) ? (
                        <div className="p-8 text-center text-xs font-semibold text-zinc-400">
                          No recent custom jobs completed or active.
                        </div>
                      ) : (
                        <div className="divide-y divide-[#E4E4E7] text-[11px]">
                          {[...(sellerData.activeJobs || []), ...(sellerData.completedJobs || [])]
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map(job => {
                              const isCleared = job.status === 'Completed' || job.status === 'Delivered';
                              return (
                                <div key={job.id} className="p-4 flex justify-between items-center hover:bg-zinc-900/50 transition-all font-semibold">
                                  <div>
                                    <span className="block text-white font-bold">{job.rfq?.title || 'Custom Machining Contract'}</span>
                                    <span className="block text-[10px] text-zinc-400 font-mono mt-0.5">RFQ ID: {job.rfq_id?.slice(0, 8).toUpperCase() || 'N/A'}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="block text-white font-black">₹{Number(job.total_cost).toLocaleString('en-IN')}</span>
                                    <span className={`block text-[9px] font-mono uppercase tracking-wider font-bold ${isCleared ? 'text-emerald-600' : 'text-slate-500'
                                      }`}>
                                      {isCleared ? 'Cleared' : 'Escrow Active'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
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
