'use client';
import React from 'react';
import { User, ShoppingBag, Plus, Trash2, ShoppingCart, RefreshCw, AlertTriangle, CheckCircle2, Package, Play, Camera, Loader2, Upload, MessageSquare, Send, Paperclip, FileText, ExternalLink, CircleDollarSign, X, XCircle, ArrowRight, ArrowLeftRight, Gift, Cpu, IndianRupee, ShieldCheck, Settings, Heart } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function RewardsTab(props: any) {
    const { activeChatRfqId, activeShipmentsCount, activeTab, addToCart, base64String, boltsProgressPercent, cadFile, channel, checkUnreadChats, customSpecs, data, datasheetFile, dbProducts, deletingCatalogServiceId, deletingProductId, deletingServiceId, dragActiveCad, dragActiveDatasheet, dragActiveImage, editName, enableBulkPricing, fetchOrders, fetchProfile, fetchSellerData, file, handleDeleteCapability, handleDeleteProduct, handleDeleteService, handleDrag, handleDrop, handlePhotoUploadAndClaim, handleSimulateStatus, handleToggleSellerMode, handleUpdateNameSubmit, handleUpdateOrderStatus, hasNewMsg, hasNewStatus, hasTimedOut, imageFileNames, imagePreviews, isActive, isGuest, isMasterBuilder, isPending, isUpdatingName, listingType, loadingOrders, loadingSeller, loadingSellerOrders, loadingTx, localProducts, localServices, mapped, msg, nextState, openAddListingModal, orderId, orders, params, paymentStatus, processFile, profile, publishingListing, reader, reason, res, response, router, sOrders, seen, seenChats, seenChatsStr, selectedCategory, selectedOrder, selectedProcessType, sellerData, sellerOrders, setActiveChatRfqId, setActiveTab, setCadFile, setCustomSpecs, setDatasheetFile, setDbProducts, setDeletingCatalogServiceId, setDeletingProductId, setDeletingServiceId, setDragActiveCad, setDragActiveDatasheet, setDragActiveImage, setEditName, setEnableBulkPricing, setHasTimedOut, setImageFileNames, setImagePreviews, setIsGuest, setListingType, setLoadingOrders, setLoadingSeller, setLoadingSellerOrders, setLoadingTx, setLocalProducts, setLocalServices, setOrders, setPublishingListing, setSelectedCategory, setSelectedOrder, setSelectedProcessType, setSellerData, setSellerOrders, setShowAddListingModal, setShowKYCModal, setTogglingSeller, setTransactions, setUnreadChatsCount, setUpdatingOrderId, setUploadingOrderId, showAddListingModal, showKYCModal, showToast, sizeStr, startTransition, startTransitionStatus, storedProds, storedServs, supabase, tabParam, timer, toggleWishlist, togglingSeller, transactions, unreadChatsCount, updated, updatingOrderId, uploadingOrderId, wishlist } = props;
  return (
    <>
      {/* Replace props with actual destructured props below */}
      
      <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-black text-white tracking-tight uppercase">Loyalty Ledger</h2>
                <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                  Detailed ledger history logs of your earned and spent Nuts &amp; Bolts loyalty tokens.
                </p>
              </div>

              {loadingTx ? (
                <div className="py-12 text-center animate-pulse">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-400/30" />
                </div>
              ) : transactions.length > 0 ? (
                <div className="border border-zinc-700/60 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs font-bold border-collapse">
                    <thead>
                      <tr className="bg-zinc-900 border-b border-zinc-700/60 text-[10px] uppercase text-zinc-400 tracking-wider">
                        <th className="p-3">Transaction details</th>
                        <th className="p-3">Reference Order</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Expirations</th>
                        <th className="p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-border/50 text-zinc-500">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-zinc-900/30">
                          <td className="p-3 font-bold text-white">{tx.description}</td>
                          <td className="p-3 font-mono text-[10px]">{tx.order_id || '—'}</td>
                          <td className="p-3">
                            <span className={tx.amount > 0 ? "text-emerald" : "text-rose-500"}>
                              {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Bolts
                            </span>
                          </td>
                          <td className="p-3 font-medium text-zinc-400 text-[10px]">
                            {tx.expires_at ? new Date(tx.expires_at).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="p-3 font-medium text-[10px]">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-zinc-700/60 rounded-2xl bg-zinc-900/20">
                  <Gift className="w-8 h-8 text-zinc-400/30 mx-auto mb-2" />
                  <p className="text-xs font-bold text-white">No rewards logs listed.</p>
                </div>
              )}

              {/* Rewards Explanation */}
              <div className="bg-zinc-900/50 border border-zinc-700/60 rounded-xl p-5 mt-6">
                <h3 className="text-sm font-black text-white uppercase tracking-tight mb-3 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-amber-500" />
                  How Nuts &amp; Bolts Work
                </h3>
                <ul className="space-y-3 text-xs text-zinc-400 font-semibold leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald mt-0.5">•</span>
                    <span><strong>Earn Bolts:</strong> You earn 1 Bolt for every ₹10 spent on eligible purchases (max 100 Bolts per order). To claim your bolts, you must upload an unboxing photo after delivery.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span><strong>Redeem Bolts:</strong> 10 Bolts = ₹1.00 store credit value toward your next purchase.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-coral mt-0.5">•</span>
                    <span><strong>Expiration:</strong> Earned Bolts expire 45 days after the transaction date if not redeemed. Keep track of your expirations in the ledger above!</span>
                  </li>
                </ul>
              </div>
            </div>
    </>
  );
}
