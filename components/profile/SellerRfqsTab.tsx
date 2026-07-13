'use client';
import React from 'react';
import { User, ShoppingBag, Plus, Trash2, ShoppingCart, RefreshCw, AlertTriangle, CheckCircle2, Package, Play, Camera, Loader2, Upload, MessageSquare, Send, Paperclip, FileText, ExternalLink, CircleDollarSign, X, XCircle, ArrowRight, ArrowLeftRight, Gift, Cpu, IndianRupee, ShieldCheck, Settings, Heart } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function SellerRfqsTab(props: any) {
    const { activeChatRfqId, activeShipmentsCount, activeTab, addToCart, base64String, boltsProgressPercent, cadFile, channel, checkUnreadChats, customSpecs, data, datasheetFile, dbProducts, deletingCatalogServiceId, deletingProductId, deletingServiceId, dragActiveCad, dragActiveDatasheet, dragActiveImage, editName, enableBulkPricing, fetchOrders, fetchProfile, fetchSellerData, file, handleDeleteCapability, handleDeleteProduct, handleDeleteService, handleDrag, handleDrop, handlePhotoUploadAndClaim, handleSimulateStatus, handleToggleSellerMode, handleUpdateNameSubmit, handleUpdateOrderStatus, hasNewMsg, hasNewStatus, hasTimedOut, imageFileNames, imagePreviews, isActive, isGuest, isMasterBuilder, isPending, isUpdatingName, listingType, loadingOrders, loadingSeller, loadingSellerOrders, loadingTx, localProducts, localServices, mapped, msg, nextState, openAddListingModal, orderId, orders, params, paymentStatus, processFile, profile, publishingListing, reader, reason, res, response, router, sOrders, seen, seenChats, seenChatsStr, selectedCategory, selectedOrder, selectedProcessType, sellerData, sellerOrders, setActiveChatRfqId, setActiveTab, setCadFile, setCustomSpecs, setDatasheetFile, setDbProducts, setDeletingCatalogServiceId, setDeletingProductId, setDeletingServiceId, setDragActiveCad, setDragActiveDatasheet, setDragActiveImage, setEditName, setEnableBulkPricing, setHasTimedOut, setImageFileNames, setImagePreviews, setIsGuest, setListingType, setLoadingOrders, setLoadingSeller, setLoadingSellerOrders, setLoadingTx, setLocalProducts, setLocalServices, setOrders, setPublishingListing, setSelectedCategory, setSelectedOrder, setSelectedProcessType, setSellerData, setSellerOrders, setShowAddListingModal, setShowKYCModal, setTogglingSeller, setTransactions, setUnreadChatsCount, setUpdatingOrderId, setUploadingOrderId, showAddListingModal, showKYCModal, showToast, sizeStr, startTransition, startTransitionStatus, storedProds, storedServs, supabase, tabParam, timer, toggleWishlist, togglingSeller, transactions, unreadChatsCount, updated, updatingOrderId, uploadingOrderId, wishlist } = props;

    const [activePendingOrder, setActivePendingOrder] = React.useState<any | null>(null);

    const pendingOrders = React.useMemo(() => {
      return (sellerOrders || []).filter(
        (o: any) => o.status !== 'Completed' && o.status !== 'Delivered' && o.status !== 'Cancelled' && o.status !== 'Rejected'
      );
    }, [sellerOrders]);

  return (
    <>
      {/* Replace props with actual destructured props below */}
      
      <div className="space-y-6 pb-20 md:pb-0">

        {/* Top Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'ACTIVE RFQS', value: sellerData ? String(sellerData.openRfqs.length) : '0', icon: FileText, color: 'text-[#00D0F5] bg-[#00D0F5]/10 border-[#00D0F5]/20' },
            { label: 'ACTIVE JOBS', value: sellerData ? String(sellerData.activeJobs.length) : '0', icon: Cpu, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
            { label: 'ESCROW BALANCE', value: sellerData ? `₹${Number(sellerData.escrowBalance).toLocaleString('en-IN')}` : '₹0', icon: ShieldCheck, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
            { label: 'CLEARED EARNINGS', value: sellerData ? `₹${Number(sellerData.clearedEarnings).toLocaleString('en-IN')}` : '₹0', icon: IndianRupee, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          ].map((stat, idx) => {
            const StatIcon = stat.icon;
            const isClickable = stat.label === 'ESCROW BALANCE' || stat.label === 'CLEARED EARNINGS';
            return (
              <div
                key={idx}
                onClick={() => {
                  if (isClickable && setActiveTab) {
                    setActiveTab('seller_earnings');
                  }
                }}
                className={`bg-[#0B1528] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md hover:border-zinc-700/80 transition-all text-white ${
                  isClickable ? 'cursor-pointer hover:border-[#00D0F5]/50 hover:shadow-[#00D0F5]/5' : ''
                }`}
              >
                <div className="space-y-1">
                  <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400">{stat.label}</span>
                  <span className="block text-xl font-black leading-tight tracking-tight">{stat.value}</span>
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

            {/* INVENTORY ALERTS */}
            {(() => {
              const lowStockProducts = (sellerData?.products || []).filter((p: any) => p.stock < 5);
              if (lowStockProducts.length === 0) return null;

              return (
                <div className="bg-zinc-800/80 border border-amber-500/30 rounded-2xl p-5 shadow-sm space-y-3 ring-1 ring-amber-500/10">
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-700/60">
                    <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      Inventory Warning: Low Stock ({lowStockProducts.length})
                    </h4>
                  </div>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                    {lowStockProducts.map((prod: any) => (
                      <div key={prod.id} className="flex justify-between items-center bg-zinc-900/40 border border-zinc-700/40 rounded-xl p-3 text-xs">
                        <div className="space-y-0.5 min-w-0 flex-1 pr-3">
                          <span className="block font-bold text-white truncate max-w-[280px]" title={prod.title}>
                            {prod.title}
                          </span>
                          <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-wider">
                            SKU: {prod.part_number || prod.sku || prod.id.substring(0, 8)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-right shrink-0">
                          <div>
                            <span className="block font-black text-amber-500 font-mono">{prod.stock} left</span>
                            <span className="block text-[8px] font-mono text-zinc-500 uppercase">Restock Required</span>
                          </div>
                          <button
                            onClick={() => setActiveTab && setActiveTab('seller_listings')}
                            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-1.5 rounded transition-all cursor-pointer shadow flex items-center gap-1"
                          >
                            Restock
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* ACTIVE RFQS FOR REVIEW */}
            <div className="bg-zinc-800/80 border border-zinc-700/60 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-700/60">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#00D0F5]" />
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">Active RFQs for Review</h4>
                </div>
                <Link href="/machining" className="text-[10px] font-black uppercase tracking-wider text-[#00D0F5] hover:text-[#00e5ff] transition-colors">
                  View All Requests
                </Link>
              </div>

              <div className="flex gap-4 overflow-x-auto md:grid md:grid-cols-2 md:overflow-x-visible no-scrollbar pb-3 md:pb-0 snap-x snap-mandatory">
                {loadingSeller ? (
                  <div className="w-full col-span-2 py-8 text-center animate-pulse">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-500" />
                  </div>
                ) : !sellerData || sellerData.openRfqs.length === 0 ? (
                  <div className="w-full col-span-2 text-center py-8 text-xs font-bold text-zinc-500 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-700/60">
                    No active RFQs for review at the moment.
                  </div>
                ) : (
                  sellerData.openRfqs.map((rfq, idx) => (
                    <div
                      key={rfq.id}
                      onClick={() => {
                        setActiveChatRfqId && setActiveChatRfqId(rfq.id);
                        setActiveTab && setActiveTab('chats');
                      }}
                      className="snap-center shrink-0 w-[270px] md:w-auto border border-zinc-700/60 rounded-2xl p-4 flex flex-col justify-between hover:border-[#00D0F5]/50 hover:shadow-lg transition-all bg-zinc-900/50 shadow-sm space-y-4 cursor-pointer"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[9px] font-black tracking-wider uppercase">
                          <span className={`px-2 py-0.5 rounded ${idx === 0
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            }`}>
                            {idx === 0 ? 'HIGH PRIORITY' : 'STANDARD'}
                          </span>
                          <span className="text-slate-400 font-mono">#RFQ-{rfq.id.slice(0, 4).toUpperCase()}</span>
                        </div>
                        <h5 className="text-xs font-black text-white line-clamp-1 leading-snug">{rfq.title}</h5>
                        <div className="grid grid-cols-2 gap-4 border-t border-b border-zinc-800 py-3.5">
                          <div>
                            <span className="block text-[8px] font-black uppercase text-slate-500">Material</span>
                            <span className="text-[10px] font-black text-zinc-300 truncate block">{rfq.material_preference || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] font-black uppercase text-slate-500">Quantity</span>
                            <span className="text-[10px] font-black text-zinc-300 truncate block">{rfq.quantity} Units</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveChatRfqId && setActiveChatRfqId(rfq.id);
                          setActiveTab && setActiveTab('chats');
                        }}
                        className="w-full py-2.5 rounded-xl bg-[#00D0F5] hover:bg-[#00e5ff] text-zinc-950 text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>QUOTE NOW</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* PRODUCTION PIPELINE */}
            <div className="bg-zinc-800/80 border border-zinc-700/60 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-700/60">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">Production Pipeline</h4>
                </div>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20">
                  {sellerData ? sellerData.activeJobs.length : '0'} Active Jobs
                </span>
              </div>

              <div className="space-y-3">
                {loadingSeller ? (
                  <div className="py-8 text-center animate-pulse">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-500" />
                  </div>
                ) : !sellerData || sellerData.activeJobs.length === 0 ? (
                  <div className="text-center py-8 text-xs font-bold text-zinc-500 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-700/60">
                    No active production jobs in the pipeline.
                  </div>
                ) : (
                  sellerData.activeJobs.map((job) => {
                    const isShipped = job.status === 'Shipped';
                    const progress = isShipped ? 80 : 40;
                    return (
                      <div 
                        key={job.id} 
                        onClick={() => {
                          const rfqId = job.rfq_id || job.rfq?.id;
                          if (rfqId) {
                            setActiveChatRfqId && setActiveChatRfqId(rfqId);
                            setActiveTab && setActiveTab('chats');
                          }
                        }}
                        className="bg-zinc-900/50 border border-zinc-700/60 rounded-2xl p-4 space-y-4 hover:border-indigo-500/50 hover:shadow-lg transition-all cursor-pointer shadow-sm"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="block text-[8px] font-black text-slate-500 font-mono">ORDER-{job.id.substring(0, 8).toUpperCase()}</span>
                            <h5 className="text-xs font-black text-white mt-0.5">{job.rfq?.title || 'Custom Machining Job'}</h5>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${isShipped
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            }`}>
                            {isShipped ? 'SHIPPED' : 'PROCESSING'}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[8px] font-black uppercase text-slate-500 tracking-wider">
                            <span>Progress</span>
                            <span className="font-mono font-black text-[9px] text-zinc-300">{progress}%</span>
                          </div>
                          <div className="w-full bg-zinc-800 border border-zinc-700/50 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isShipped ? 'bg-amber-400' : 'bg-indigo-400'}`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>

                        {(job.rfq_id || job.rfq?.id) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const rfqId = job.rfq_id || job.rfq?.id;
                              if (rfqId) {
                                setActiveChatRfqId && setActiveChatRfqId(rfqId);
                                setActiveTab && setActiveTab('chats');
                              }
                            }}
                            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-700/50"
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

            {/* PENDING ORDERS */}
            <div className="bg-zinc-800/80 border border-zinc-700/60 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-700/60">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#00D0F5]" />
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">Pending Orders</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[#00D0F5]/10 text-[#00D0F5] rounded border border-[#00D0F5]/20">
                    {pendingOrders.length} Orders
                  </span>
                  <button onClick={() => setActiveTab('seller_orders')} className="text-[10px] font-black uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer">
                    Manage
                  </button>
                </div>
              </div>

              <div className="max-h-[220px] overflow-y-auto no-scrollbar pr-1 bg-zinc-900/10 rounded-xl border border-zinc-700/30">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-zinc-700/60 text-[8px] uppercase tracking-wider font-black text-slate-500 bg-zinc-900/40 sticky top-0 z-10">
                      <th className="pb-2.5 pt-2 px-3">Order ID</th>
                      <th className="pb-2.5 pt-2 px-3">Amount</th>
                      <th className="pb-2.5 pt-2 text-right pr-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {loadingSellerOrders ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center animate-pulse">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-500" />
                        </td>
                      </tr>
                    ) : pendingOrders.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-xs font-bold text-zinc-500 bg-zinc-900/30 rounded border border-dashed border-zinc-700/40 block mt-2 mx-2">
                          No pending orders.
                        </td>
                      </tr>
                    ) : (
                      pendingOrders.map((job: any) => {
                        return (
                          <tr
                            key={job.id}
                            onClick={() => {
                              setActivePendingOrder(job);
                            }}
                            className="text-xs group hover:bg-[#00D0F5]/5 transition-colors cursor-pointer"
                          >
                            <td className="py-3 px-3 font-mono font-black text-white group-hover:text-[#00D0F5]">
                              #{job.id.substring(0, 8).toUpperCase()}
                            </td>
                            <td className="py-3 px-3 font-bold text-zinc-300 font-mono">
                              ₹{Number(job.total_amount).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 text-right pr-3">
                              <span className="inline-flex items-center gap-1.5 text-[8px] font-black uppercase px-2 py-0.5 rounded border bg-amber-500/10 text-amber-500 border-amber-500/20">
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
            <div
              onClick={() => {
                if (setActiveTab) {
                  setActiveTab('seller_earnings');
                }
              }}
              className="bg-[#0B1528] border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-5 cursor-pointer hover:border-[#00D0F5]/50 hover:shadow-[#00D0F5]/5 transition-all"
            >
              <div className="pb-3 border-b border-zinc-800 flex justify-between items-center">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">Earnings Velocity</h4>
                <IndianRupee className="w-4 h-4 text-[#00D0F5]" />
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
                    const maxAmount = Math.max(...velocity.map(v => v.amount), 1000); // 1000 base minimum so chart doesn't look empty

                    return velocity.map((bar, idx) => {
                      const height = Math.max(Math.round((bar.amount / maxAmount) * 100), bar.amount > 0 ? 8 : 4);
                      const isActive = idx === 4;

                      return (
                        <div key={idx} className="flex flex-col items-center gap-2 group relative">
                          {/* Premium tooltip showing actual value above the bar on hover */}
                          <span className="opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 absolute -top-8 bg-zinc-950 text-[#00D0F5] text-[9px] font-mono font-black px-1.5 py-0.5 rounded border border-[#00D0F5]/30 shadow-xl transition-all duration-200 whitespace-nowrap pointer-events-none z-20">
                            ₹{Number(bar.amount).toLocaleString('en-IN')}
                          </span>
                          <div
                            className={`w-7 rounded-t transition-all duration-300 origin-bottom hover:scale-x-105 hover:shadow-md ${isActive
                              ? 'bg-gradient-to-t from-[#00D0F5]/50 to-[#00D0F5] shadow-lg shadow-[#00D0F5]/20 hover:brightness-110'
                              : 'bg-zinc-800 border border-zinc-700 hover:bg-[#00D0F5]/20 hover:border-[#00D0F5]/30'
                              }`}
                            style={{ height: `${height}px` }}
                          ></div>
                          <span className={`text-[8px] font-black uppercase tracking-wider transition-colors ${isActive ? 'text-[#00D0F5]' : 'text-slate-500 group-hover:text-slate-300'}`}>
                            {bar.label}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>

                <div className="border-t border-zinc-800 pt-3.5 flex items-center justify-between text-xs bg-zinc-900/50 -mx-5 -mb-5 p-5 rounded-b-2xl">
                  <span className="font-black text-slate-400 text-[10px] uppercase tracking-wider">Est. Month End</span>
                  <span className="font-black text-white text-sm font-mono">
                    {sellerData ? `₹${Number(Math.round(sellerData.monthlyEarnings * 1.2)).toLocaleString('en-IN')}` : '₹0'}
                  </span>
                </div>
              </div>
            </div>

            {/* MY ACTIVE QUOTES */}
            {(() => {
              const activeQuotes = (sellerData?.myQuotes || []).filter(
                (q: any) => q.status !== 'REJECTED' && q.status !== 'ACCEPTED' && q.status !== 'Accepted'
              );

              return (
                <div className="bg-zinc-800/80 border border-zinc-700/60 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="pb-3 border-b border-zinc-700/60 flex justify-between items-center">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">My Active Quotes</h4>
                    <span className="bg-zinc-700/50 text-zinc-300 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {activeQuotes.length} Total
                    </span>
                  </div>
                  
                  <div className="space-y-3 max-h-[350px] overflow-y-auto no-scrollbar pr-1">
                    {loadingSeller ? (
                      <div className="py-8 text-center animate-pulse">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-zinc-500" />
                      </div>
                    ) : activeQuotes.length === 0 ? (
                      <div className="text-center py-6 text-xs font-bold text-zinc-500 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-700/60">
                        You haven't submitted any active quotes yet.
                      </div>
                    ) : (
                      activeQuotes.map((quote: any) => {
                        const isAccepted = quote.status === 'ACCEPTED';
                        const isRejected = quote.status === 'REJECTED';
                        const isPending = quote.status === 'SUBMITTED' || quote.status === 'NEGOTIATING';
                        
                        return (
                          <div 
                            key={quote.id} 
                            className="bg-zinc-900/50 border border-zinc-700/60 rounded-xl p-3 flex flex-col gap-2 hover:border-zinc-600 transition-colors cursor-pointer" 
                            onClick={() => {
                              if(quote.rfq_id) {
                                setActiveChatRfqId && setActiveChatRfqId(quote.rfq_id);
                                setActiveTab && setActiveTab('chats');
                              }
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-black text-white line-clamp-1 flex-1 pr-2">Quote #{quote.id.substring(0, 6).toUpperCase()}</span>
                              <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 border ${
                                isAccepted ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                isRejected ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                                'bg-sky-500/10 text-sky-400 border-sky-500/20'
                              }`}>
                                {quote.status}
                              </span>
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">
                                {new Date(quote.created_at).toLocaleDateString()}
                              </span>
                              <span className="text-xs font-black text-white font-mono">
                                ₹{Number(quote.total_amount).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()}

          </div>

        </div>

      </div>

      {/* Pending Order Status Editor Modal */}
      {activePendingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-sm transition-opacity" onClick={() => setActivePendingOrder(null)} />
          <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative z-10 animate-zoom-in space-y-6 font-mono text-left">
            <div className="flex justify-between items-start pb-3 border-b border-zinc-700/60">
              <div>
                <span className="text-[10px] font-bold text-[#00D0F5] uppercase tracking-wider">Update Order Status</span>
                <h3 className="text-sm font-black text-white mt-1">#{activePendingOrder.id.substring(0, 8).toUpperCase()}</h3>
              </div>
              <button onClick={() => setActivePendingOrder(null)} className="p-1 rounded hover:bg-zinc-950 border border-zinc-700/60 text-zinc-400 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between border-b border-zinc-850 pb-2">
                <span className="text-zinc-500">Current Status:</span>
                <span className="text-amber-500 font-bold uppercase">{activePendingOrder.status}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-850 pb-2">
                <span className="text-zinc-500">Order Amount:</span>
                <span className="text-white font-bold font-mono">₹{Number(activePendingOrder.total_amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-850 pb-2">
                <span className="text-zinc-500">Total Units:</span>
                <span className="text-white font-bold">{activePendingOrder.quantity || 1} units</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              {(() => {
                const nextStatusMap = {
                  'Pending Payment': 'Processing',
                  'Processing': 'Shipped',
                  'Shipped': 'Delivered',
                  'Delivered': 'Completed',
                  'Completed': null
                };
                const nextStatus = nextStatusMap[activePendingOrder.status as keyof typeof nextStatusMap];
                const isUpdating = updatingOrderId === activePendingOrder.id;

                if (!nextStatus) return null;
                return (
                  <button
                    onClick={async () => {
                      try {
                        await handleUpdateOrderStatus(activePendingOrder.id, nextStatus as any);
                        // Update local status representation so modal reflects immediately
                        setActivePendingOrder((prev: any) => prev ? { ...prev, status: nextStatus } : null);
                      } catch (err) {}
                    }}
                    disabled={isUpdating}
                    className="bg-[#00D0F5] hover:bg-[#00e5ff] text-zinc-950 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Mark as {nextStatus}</span>
                  </button>
                );
              })()}
              <button
                onClick={() => setActivePendingOrder(null)}
                className="border border-zinc-700/60 hover:bg-zinc-900 text-zinc-400 hover:text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
