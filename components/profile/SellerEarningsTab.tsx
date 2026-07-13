'use client';
import React, { useState } from 'react';
import { User, ShoppingBag, Plus, Trash2, ShoppingCart, RefreshCw, AlertTriangle, CheckCircle2, Package, Play, Camera, Loader2, Upload, MessageSquare, Send, Paperclip, FileText, ExternalLink, CircleDollarSign, X, XCircle, ArrowRight, ArrowLeftRight, Gift, Cpu, IndianRupee, ShieldCheck, Settings, Heart } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { updatePayoutPreferences } from '@/app/actions/rewards';

export default function SellerEarningsTab(props: any) {
    const { activeChatRfqId, activeShipmentsCount, activeTab, addToCart, base64String, boltsProgressPercent, cadFile, channel, checkUnreadChats, customSpecs, data, datasheetFile, dbProducts, deletingCatalogServiceId, deletingProductId, deletingServiceId, dragActiveCad, dragActiveDatasheet, dragActiveImage, editName, enableBulkPricing, fetchOrders, fetchProfile, fetchSellerData, file, handleDeleteCapability, handleDeleteProduct, handleDeleteService, handleDrag, handleDrop, handlePhotoUploadAndClaim, handleSimulateStatus, handleToggleSellerMode, handleUpdateNameSubmit, handleUpdateOrderStatus, hasNewMsg, hasNewStatus, hasTimedOut, imageFileNames, imagePreviews, isActive, isGuest, isMasterBuilder, isPending, isUpdatingName, listingType, loadingOrders, loadingSeller, loadingSellerOrders, loadingTx, localProducts, localServices, mapped, msg, nextState, openAddListingModal, orderId, orders, params, paymentStatus, processFile, profile, publishingListing, reader, reason, res, response, router, sOrders, seen, seenChats, seenChatsStr, selectedCategory, selectedOrder, selectedProcessType, sellerData, sellerOrders, setActiveChatRfqId, setActiveTab, setCadFile, setCustomSpecs, setDatasheetFile, setDbProducts, setDeletingCatalogServiceId, setDeletingProductId, setDeletingServiceId, setDragActiveCad, setDragActiveDatasheet, setDragActiveImage, setEditName, setEnableBulkPricing, setHasTimedOut, setImageFileNames, setImagePreviews, setIsGuest, setListingType, setLoadingOrders, setLoadingSeller, setLoadingSellerOrders, setLoadingTx, setLocalProducts, setLocalServices, setOrders, setPublishingListing, setSelectedCategory, setSelectedOrder, setSelectedProcessType, setSellerData, setSellerOrders, setShowAddListingModal, setShowKYCModal, setTogglingSeller, setTransactions, setUnreadChatsCount, setUpdatingOrderId, setUploadingOrderId, showAddListingModal, showKYCModal, showToast, sizeStr, startTransition, startTransitionStatus, storedProds, storedServs, supabase, tabParam, timer, toggleWishlist, togglingSeller, transactions, unreadChatsCount, updated, updatingOrderId, uploadingOrderId, wishlist } = props;
    
    const [isEditingPayout, setIsEditingPayout] = useState(false);
    const [bankAccount, setBankAccount] = useState(profile?.bank_account_number || '');
    const [ifsc, setIfsc] = useState(profile?.ifsc_code || '');
    const [saving, setSaving] = useState(false);

    // Sync input values when profile loads/changes
    React.useEffect(() => {
      if (profile) {
        setBankAccount(profile.bank_account_number || '');
        setIfsc(profile.ifsc_code || '');
      }
    }, [profile]);

  return (
    <>
      {/* Replace props with actual destructured props below */}
      
      <div className="space-y-6">
              {/* Header */}
              <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight uppercase font-['Space_Grotesk']">Seller Earnings Dashboard</h2>
                  <p className="text-xs text-zinc-500 mt-1 font-semibold">
                    Monitor your weekly sales velocity, track pending payouts, and view completed custom order ledger history.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-emerald bg-emerald/5 border border-emerald/15 px-3 py-1.5 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-emerald" />
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
                    <div className="bg-zinc-800 border border-zinc-700/60 p-6 rounded-2xl shadow-sm space-y-4">
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

                    <div className="bg-zinc-800 border border-zinc-700/60 p-6 rounded-2xl shadow-sm space-y-4">
                      <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-mono text-emerald">
                        Cleared Earnings
                      </span>
                      <div className="space-y-1">
                        <span className="text-3xl font-black text-emerald block tracking-tight">
                          ₹{sellerData ? Number((sellerData as any).clearedEarnings || 0).toLocaleString('en-IN') : '0'}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-bold block">
                          Released funds available for payout
                        </span>
                      </div>
                    </div>

                    <div className="bg-zinc-800 border border-zinc-700/60 p-6 rounded-2xl shadow-sm space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-mono">
                          Payout Preferences
                        </span>
                        {!isEditingPayout && (
                          <button
                            onClick={() => setIsEditingPayout(true)}
                            className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#00D0F5] hover:opacity-80 transition-opacity cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                      </div>

                      {isEditingPayout ? (
                        <div className="space-y-3 p-3 bg-zinc-900/40 border border-zinc-700/30 rounded-xl text-xs font-mono text-left">
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider block">Bank Account Number</label>
                            <input
                              type="text"
                              value={bankAccount}
                              onChange={(e) => setBankAccount(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                              placeholder="Enter account number"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider block">IFS Code</label>
                            <input
                              type="text"
                              value={ifsc}
                              onChange={(e) => setIfsc(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                              placeholder="Enter IFSC code"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-1.5">
                            <button
                              onClick={() => {
                                setIsEditingPayout(false);
                                setBankAccount(profile?.bank_account_number || '');
                                setIfsc(profile?.ifsc_code || '');
                              }}
                              className="px-2.5 py-1.5 text-[9px] font-bold text-zinc-400 border border-zinc-700 rounded hover:bg-zinc-900 transition-colors uppercase tracking-wider cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={async () => {
                                if (!bankAccount.trim() || !ifsc.trim()) {
                                  showToast('Both fields are required', 'error');
                                  return;
                                }
                                setSaving(true);
                                try {
                                  await updatePayoutPreferences(bankAccount.trim(), ifsc.trim());
                                  showToast('Payout preferences updated successfully', 'success');
                                  await fetchProfile();
                                  setIsEditingPayout(false);
                                } catch (err: any) {
                                  showToast(err.message || 'Failed to update preferences', 'error');
                                } finally {
                                  setSaving(false);
                                }
                              }}
                              disabled={saving}
                              className="px-2.5 py-1.5 text-[9px] font-bold text-zinc-950 bg-[#00D0F5] hover:bg-[#00e5ff] rounded transition-colors uppercase tracking-wider cursor-pointer flex items-center gap-1 disabled:opacity-50"
                            >
                              {saving && <RefreshCw className="w-3 h-3 animate-spin" />}
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 bg-zinc-900/70 border border-zinc-700/60 p-3 rounded-xl text-[11px] font-semibold text-zinc-500 font-mono">
                          <p className="flex justify-between">
                            <span>Bank Account:</span>
                            <span className="text-zinc-300 font-bold">
                              {profile?.bank_account_number 
                                ? `•••• ${profile.bank_account_number.slice(-4)}` 
                                : 'Not Configured'}
                            </span>
                          </p>
                          <p className="flex justify-between">
                            <span>IFS Code:</span>
                            <span className="text-zinc-300 font-bold">
                              {profile?.ifsc_code || 'Not Configured'}
                            </span>
                          </p>
                          <p className="flex justify-between">
                            <span>Settlement Period:</span>
                            <span className="text-zinc-300 font-bold">T+2 Days</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Chart and Ledger */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Velocity Chart */}
                    <div className="bg-zinc-800 border border-zinc-700/60 p-6 rounded-2xl shadow-sm space-y-4">
                      <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-mono">
                        Weekly Sales Velocity
                      </span>

                      <div className="flex items-end justify-between h-44 px-2">
                        {sellerData?.earningsVelocity.map((item: any, idx: number) => {
                          const maxVal = Math.max(...sellerData.earningsVelocity.map((v: any) => v.amount), 1000);
                          const barHeight = Math.max(Math.round((item.amount / maxVal) * 100), item.amount > 0 ? 8 : 4);
                          const isActive = idx === 4;

                          return (
                            <div key={idx} className="flex flex-col items-center gap-1 group relative">
                              {/* Always-visible value above bar */}
                              <span className={`text-[8px] font-mono font-black whitespace-nowrap ${item.amount > 0 ? (isActive ? 'text-[#00D0F5]' : 'text-zinc-400') : 'text-zinc-700'}`}>
                                {item.amount > 0 ? `₹${Number(item.amount).toLocaleString('en-IN')}` : '—'}
                              </span>
                              <div
                                className={`w-8 rounded-t transition-all duration-300 origin-bottom hover:scale-x-105 hover:shadow-md ${
                                  isActive
                                    ? 'bg-gradient-to-t from-[#00D0F5]/50 to-[#00D0F5] shadow-lg shadow-[#00D0F5]/20 hover:brightness-110'
                                    : 'bg-zinc-800 border border-zinc-700 hover:bg-[#00D0F5]/20 hover:border-[#00D0F5]/30'
                                }`}
                                style={{ height: `${barHeight}px` }}
                              ></div>
                              <span className={`text-[9px] font-mono font-bold block mt-1 transition-colors ${isActive ? 'text-[#00D0F5]' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                                {item.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Job Ledger */}
                    <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl shadow-sm overflow-hidden">
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
                        <div className="divide-y divide-zinc-700/50 text-[11px] max-h-[220px] overflow-y-auto no-scrollbar pr-1 bg-zinc-900/10">
                          {[...(sellerData.activeJobs || []), ...(sellerData.completedJobs || [])]
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map(job => {
                              const isCleared = job.status === 'Completed' || job.status === 'Delivered';
                              return (
                                <div key={job.id} className="p-4 flex justify-between items-center hover:bg-zinc-900/30 transition-all font-semibold">
                                  <div>
                                    <span className="block text-white font-bold">{job.rfq?.title || 'Custom Machining Contract'}</span>
                                    <span className="block text-[10px] text-zinc-400 font-mono mt-0.5">RFQ ID: {job.rfq_id?.slice(0, 8).toUpperCase() || 'N/A'}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="block text-white font-black">₹{Number(job.total_cost).toLocaleString('en-IN')}</span>
                                    <span className={`block text-[9px] font-mono uppercase tracking-wider font-bold ${isCleared ? 'text-emerald' : 'text-slate-500'
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
