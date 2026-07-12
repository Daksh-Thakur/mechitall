'use client';
import React from 'react';
import { User, ShoppingBag, Plus, Trash2, ShoppingCart, RefreshCw, AlertTriangle, CheckCircle2, Package, Play, Camera, Loader2, Upload, MessageSquare, Send, Paperclip, FileText, ExternalLink, CircleDollarSign, X, XCircle, ArrowRight, ArrowLeftRight, Gift, Cpu, IndianRupee, ShieldCheck, Settings, Heart } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function SellerRfqsTab(props: any) {
    const { activeChatRfqId, activeShipmentsCount, activeTab, addToCart, base64String, boltsProgressPercent, cadFile, channel, checkUnreadChats, customSpecs, data, datasheetFile, dbProducts, deletingCatalogServiceId, deletingProductId, deletingServiceId, dragActiveCad, dragActiveDatasheet, dragActiveImage, editName, enableBulkPricing, fetchOrders, fetchProfile, fetchSellerData, file, handleDeleteCapability, handleDeleteProduct, handleDeleteService, handleDrag, handleDrop, handlePhotoUploadAndClaim, handleSimulateStatus, handleToggleSellerMode, handleUpdateNameSubmit, handleUpdateOrderStatus, hasNewMsg, hasNewStatus, hasTimedOut, imageFileNames, imagePreviews, isActive, isGuest, isMasterBuilder, isPending, isUpdatingName, listingType, loadingOrders, loadingSeller, loadingSellerOrders, loadingTx, localProducts, localServices, mapped, msg, nextState, openAddListingModal, orderId, orders, params, paymentStatus, processFile, profile, publishingListing, reader, reason, res, response, router, sOrders, seen, seenChats, seenChatsStr, selectedCategory, selectedOrder, selectedProcessType, sellerData, sellerOrders, setActiveChatRfqId, setActiveTab, setCadFile, setCustomSpecs, setDatasheetFile, setDbProducts, setDeletingCatalogServiceId, setDeletingProductId, setDeletingServiceId, setDragActiveCad, setDragActiveDatasheet, setDragActiveImage, setEditName, setEnableBulkPricing, setHasTimedOut, setImageFileNames, setImagePreviews, setIsGuest, setListingType, setLoadingOrders, setLoadingSeller, setLoadingSellerOrders, setLoadingTx, setLocalProducts, setLocalServices, setOrders, setPublishingListing, setSelectedCategory, setSelectedOrder, setSelectedProcessType, setSellerData, setSellerOrders, setShowAddListingModal, setShowKYCModal, setTogglingSeller, setTransactions, setUnreadChatsCount, setUpdatingOrderId, setUploadingOrderId, showAddListingModal, showKYCModal, showToast, sizeStr, startTransition, startTransitionStatus, storedProds, storedServs, supabase, tabParam, timer, toggleWishlist, togglingSeller, transactions, unreadChatsCount, updated, updatingOrderId, uploadingOrderId, wishlist } = props;
  return (
    <>
      {/* Replace props with actual destructured props below */}
      
      <div className="space-y-6 pb-20 md:pb-0">

              {/* Stats Cards Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'ACTIVE RFQS', value: sellerData ? String(sellerData.openRfqs.length) : '0', icon: FileText, color: 'text-sky-500 bg-sky-50 border-sky-100', isDark: false },
                  { label: 'PENDING QUOTES', value: sellerData ? String(sellerData.myQuotes.filter(q => q.status === 'SUBMITTED').length) : '0', icon: FileText, color: 'text-teal-500 bg-teal-50 border-teal-100', isDark: false },
                  { label: 'PRODUCTION QUEUE', value: sellerData ? String(sellerData.activeJobs.length) : '0', icon: Cpu, color: 'text-indigo-500 bg-indigo-50 border-indigo-100', isDark: false },
                  { label: 'MONTHLY EARNINGS', value: sellerData ? `₹${(sellerData.monthlyEarnings / 100000).toFixed(1)}L` : '₹0.0L', icon: IndianRupee, color: 'text-[#00D0F5] bg-[#007084]/20 border-[#0092AB]/30', isDark: true },
                ].map((stat, idx) => {
                  const StatIcon = stat.icon;
                  return (
                    <div
                      key={idx}
                      className={`border rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all ${stat.isDark
                        ? 'bg-[#0B1528] border-zinc-800 text-white'
                        : 'bg-zinc-800 border-zinc-700/60 text-white'
                        }`}
                    >
                      <div className="space-y-1">
                        <span className={`block text-[8px] font-black uppercase tracking-wider ${stat.isDark ? 'text-slate-400' : 'text-zinc-400'}`}>{stat.label}</span>
                        <span className="block text-xl font-black leading-tight">{stat.value}</span>
                      </div>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${stat.color} shrink-0`}>
                        <StatIcon className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grid Layout for Main Content & Sidebar */}
              <div className="flex flex-col lg:flex-row gap-6">

                {/* Left Column (8/12) */}
                <div className="lg:w-8/12 space-y-6">

                  {/* ACTIVE RFQS FOR REVIEW */}
                  <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-zinc-700/60">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#007084]" />
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">Active RFQs for Review</h4>
                      </div>
                      <Link href="/machining" className="text-xs font-bold text-[#007084] hover:underline">
                        View All Requests
                      </Link>
                    </div>

                    <div className="flex gap-4 overflow-x-auto md:grid md:grid-cols-2 md:overflow-x-visible no-scrollbar pb-3 md:pb-0 snap-x snap-mandatory">
                      {loadingSeller ? (
                        <div className="w-full py-8 text-center animate-pulse">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-400/30" />
                        </div>
                      ) : !sellerData || sellerData.openRfqs.length === 0 ? (
                        <div className="w-full text-center py-8 text-xs font-bold text-zinc-400">
                          No active RFQs for review at the moment.
                        </div>
                      ) : (
                        sellerData.openRfqs.map((rfq, idx) => (
                          <div
                            key={rfq.id}
                            className="snap-center shrink-0 w-[270px] md:w-auto border border-zinc-700/60/70 rounded-2xl p-4 flex flex-col justify-between hover:border-zinc-700/60 transition-colors bg-zinc-800 shadow-sm space-y-4"
                          >
                            <div className="space-y-3">
                              {/* Header Badge & Code */}
                              <div className="flex justify-between items-center text-[9px] font-black tracking-wider uppercase">
                                <span className={`px-2 py-0.5 rounded ${idx === 0
                                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                  : 'bg-slate-100 text-slate-600 border'
                                  }`}>
                                  {idx === 0 ? 'HIGH PRIORITY' : 'STANDARD'}
                                </span>
                                <span className="text-slate-400 font-mono">#RFQ-{rfq.id.slice(0, 4).toUpperCase()}</span>
                              </div>

                              {/* Title */}
                              <h5 className="text-xs font-black text-white line-clamp-1 leading-snug">{rfq.title}</h5>

                              {/* Specs Grid */}
                              <div className="grid grid-cols-2 gap-4 border-t border-b border-zinc-700/60/30 py-3.5">
                                <div>
                                  <span className="block text-[8px] font-black uppercase text-slate-400">Material</span>
                                  <span className="text-[10px] font-black text-zinc-500 truncate block">{rfq.material_preference || 'Ti-6Al-4V'}</span>
                                </div>
                                <div>
                                  <span className="block text-[8px] font-black uppercase text-slate-400">Quantity</span>
                                  <span className="text-[10px] font-black text-zinc-500 truncate block">{rfq.quantity} Units</span>
                                </div>
                              </div>
                            </div>

                            {/* Navigate to Chats to discuss and submit quote */}
                            <button
                              onClick={() => setActiveTab('chats')}
                              className="w-full py-2.5 rounded-xl bg-[#0B1528] hover:bg-slate-900 text-white text-[10px] font-extrabold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                            >
                              <span>OPEN IN CHAT</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* PRODUCTION PIPELINE */}
                  <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-zinc-700/60">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-[#007084]" />
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">Production Pipeline</h4>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald rounded border border-emerald-500/20">
                        {sellerData ? sellerData.activeJobs.length : '0'} Active Jobs
                      </span>
                    </div>

                    <div className="space-y-3">
                      {loadingSeller ? (
                        <div className="py-8 text-center animate-pulse">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-400/30" />
                        </div>
                      ) : !sellerData || sellerData.activeJobs.length === 0 ? (
                        <div className="text-center py-8 text-xs font-bold text-zinc-400">
                          No active production jobs in the pipeline.
                        </div>
                      ) : (
                        sellerData.activeJobs.map((job) => {
                          const isShipped = job.status === 'Shipped';
                          const progress = isShipped ? 80 : 40;
                          return (
                            <div key={job.id} className="bg-zinc-800 border border-zinc-700/60/70 rounded-2xl p-4 space-y-4 hover:border-zinc-700/60 transition-colors shadow-sm">
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <span className="block text-[8px] font-black text-slate-400 font-mono">ORDER-{job.id.substring(0, 8).toUpperCase()}</span>
                                  <h5 className="text-xs font-black text-white mt-0.5">{job.rfq?.title || 'Custom Machining Job'}</h5>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${isShipped
                                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                  : 'bg-sky-500/10 text-sky-600 border-sky-500/20'
                                  }`}>
                                  {isShipped ? 'SHIPPED' : 'PROCESSING'}
                                </span>
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 tracking-wider">
                                  <span>Progress</span>
                                  <span className="font-mono font-black text-[9px] text-zinc-500">{progress}%</span>
                                </div>
                                <div className="w-full bg-zinc-900 border border-zinc-700/60/50 h-2 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${isShipped ? 'bg-amber-500' : 'bg-sky-500'}`}
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                              </div>

                              {job.rfq?.id && (
                                <button
                                  onClick={() => {
                                    setActiveChatRfqId(job.rfq.id);
                                    setActiveTab('chats');
                                  }}
                                  className="w-full py-2 bg-[#0B1528] hover:bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Open Quote Chat</span>
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* DISPATCHED ORDERS */}
                  <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-zinc-700/60">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-[#007084]" />
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">Dispatched Orders</h4>
                      </div>
                      <button onClick={() => showToast('Opening shipment manager...', 'success')} className="text-xs font-bold text-[#007084] hover:underline cursor-pointer">
                        Track All Shipments
                      </button>
                    </div>

                    <div className="overflow-x-auto no-scrollbar">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-zinc-700/60/50 text-[8px] uppercase tracking-wider font-black text-slate-400">
                            <th className="pb-2.5">Order ID</th>
                            <th className="pb-2.5 px-3">Carrier</th>
                            <th className="pb-2.5 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-border/30">
                          {loadingSeller ? (
                            <tr>
                              <td colSpan={3} className="py-8 text-center animate-pulse">
                                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-400/30" />
                              </td>
                            </tr>
                          ) : !sellerData || sellerData.completedJobs.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="py-8 text-center text-xs font-bold text-zinc-400">
                                No recently completed/delivered orders.
                              </td>
                            </tr>
                          ) : (
                            sellerData.completedJobs.map((job) => {
                              const isCompleted = job.status === 'Completed';
                              return (
                                <tr key={job.id} className="text-xs">
                                  <td className="py-3 font-mono font-black text-white">
                                    #{job.id.substring(0, 12).toUpperCase()}
                                  </td>
                                  <td className="py-3 px-3 font-bold text-zinc-500">
                                    Standard Delivery
                                  </td>
                                  <td className="py-3 text-right">
                                    <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase ${isCompleted ? 'text-emerald' : 'text-sky-600'
                                      }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald' : 'bg-sky-500 animate-pulse'}`}></span>
                                      {job.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                {/* Right Column (4/12) */}
                <div className="lg:w-4/12 space-y-6">

                  {/* EARNINGS VELOCITY */}
                  <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-5 shadow-sm space-y-5">
                    <div className="pb-3 border-b border-zinc-700/60">
                      <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Earnings Velocity</h4>
                    </div>

                    {/* Visual Bar Chart */}
                    <div className="space-y-4">
                      <div className="flex items-end justify-between h-36 px-2">
                        {(() => {
                          const velocity = sellerData?.earningsVelocity || [
                            { label: 'Wk 1', amount: 0 },
                            { label: 'Wk 2', amount: 0 },
                            { label: 'Wk 3', amount: 0 },
                            { label: 'Wk 4', amount: 0 },
                            { label: 'This Wk', amount: 0 },
                          ];
                          const maxAmount = Math.max(...velocity.map(v => v.amount), 10000);

                          return velocity.map((bar, idx) => {
                            // Scale height relative to maxAmount (max 100px)
                            const height = Math.max(Math.round((bar.amount / maxAmount) * 100), bar.amount > 0 ? 8 : 4);
                            const isActive = idx === 4;

                            return (
                              <div key={idx} className="flex flex-col items-center gap-2 group relative">
                                <span className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-zinc-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md transition-opacity whitespace-nowrap pointer-events-none z-10">
                                  ₹{Number(bar.amount).toLocaleString('en-IN')}
                                </span>
                                <div
                                  className={`w-7 rounded-t-lg transition-all duration-300 ${isActive
                                    ? 'bg-[#00D0F5] shadow-lg shadow-[#00D0F5]/20 hover:brightness-105'
                                    : 'bg-[#F1F5F9] border border-slate-200 hover:border-slate-400'
                                    }`}
                                  style={{ height: `${height}px` }}
                                ></div>
                                <span className={`text-[9px] font-black uppercase tracking-wider ${isActive ? 'text-[#007084]' : 'text-zinc-400'}`}>
                                  {bar.label}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>

                      <div className="border-t border-zinc-700/60 pt-3.5 flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-400">Projected Month End</span>
                        <span className="font-black text-white text-sm">
                          {sellerData ? `₹${((sellerData.monthlyEarnings * 1.2) / 100000).toFixed(1)}L` : '₹0.0L'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* EFFICIENCY INDEX */}
                  <div className="bg-[#0B1528] text-white border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                    <div className="space-y-1">
                      <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Efficiency Index</span>
                      <p className="text-[10px] text-slate-300 font-bold leading-relaxed">
                        Your workshop's precision rating is up 12% this week.
                      </p>
                    </div>
                    <div className="flex items-baseline gap-2 pt-2">
                      <span className="text-3xl font-mono font-black text-white">98.4</span>
                      <span className="flex items-center gap-0.5 text-[10px] font-black text-[#00D0F5]">
                        <span>▲</span>
                        <span>0.4%</span>
                      </span>
                    </div>
                  </div>

                  {/* ISO 9001:2015 Certification */}
                  <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-5 shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-[#007084] flex items-center justify-center shrink-0 shadow-sm">
                      <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-white">ISO 9001:2015 Compliance</h4>
                      <p className="text-[10px] text-zinc-400 font-bold leading-normal">
                        Certified Operations since 2021. Complies with global precision aerospace &amp; industrial machining guidelines.
                      </p>
                    </div>
                  </div>

                </div>

              </div>

            </div>
    </>
  );
}
