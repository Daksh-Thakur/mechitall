'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/components/CartProvider';
import {
  getProfileTransactions,
  getProfileOrders,
  confirmDeliveryAndClaimBolts,
  simulateOrderStatus,
} from '@/app/actions/rewards';
import {
  Award,
  Clock,
  History,
  Camera,
  CheckCircle,
  TrendingUp,
  Coins,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Loader2,
  FileImage,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';

export default function Dashboard() {
  const { profile, fetchProfile, showToast } = useCart();
  const [activeTab, setActiveTab] = useState<'rewards' | 'orders'>('rewards');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [uploadingOrderId, setUploadingOrderId] = useState<string | null>(null);

  const syncDashboardData = async () => {
    if (!profile) return;
    try {
      const data = await getProfileTransactions(profile.id);
      setTransactions(data.transactions);
      
      const dbOrders = await getProfileOrders(profile.id);
      setOrders(dbOrders);
    } catch (err) {
      console.error('Failed to sync dashboard details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkTab = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'rewards' || tab === 'orders') {
        setActiveTab(tab as any);
      }
    };
    checkTab();
    const interval = setInterval(checkTab, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (profile) {
      syncDashboardData();
    }
  }, [profile]);

  // Handle mock photo upload and claiming rewards
  const handlePhotoUploadAndClaim = async (orderId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !profile) return;
    const file = event.target.files[0];
    
    setUploadingOrderId(orderId);
    
    // Simulate reading file and small upload delay
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      
      startTransition(async () => {
        try {
          // Release escrow and claim bolts
          const response = await confirmDeliveryAndClaimBolts(orderId, base64String, profile.id);
          
          if (response.success) {
            showToast(`Successfully released PayU escrow funds & credited ${response.earnedBolts} Bolts!`, 'success');
            // Refresh states
            await fetchProfile();
            await syncDashboardData();
          }
        } catch (err: any) {
          console.error(err);
          showToast(err.message || 'Verification failed', 'error');
        } finally {
          setUploadingOrderId(null);
        }
      });
    };
    reader.readAsDataURL(file);
  };

  // Simulate order statuses for sandbox testing
  const handleSimulateStatus = async (orderId: string, nextStatus: 'Shipped' | 'Delivered') => {
    if (!profile) return;
    startTransition(async () => {
      try {
        await simulateOrderStatus(orderId, nextStatus);
        await syncDashboardData();
        showToast(`Order status updated to ${nextStatus}`, 'success');
      } catch (err: any) {
        showToast(err.message || 'Status transition failed', 'error');
      }
    });
  };

  // Seed demo order to try rewards immediately
  const handleSeedMockOrder = async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      const demoOrderId = `PO-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      await supabase.from('orders').insert([
        {
          id: demoOrderId,
          profile_id: profile.id,
          total_amount: 145.0,
          items_count: 1,
          status: 'Delivered',
          delivered_at: new Date().toISOString(),
        }
      ]);
      await syncDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper calculations for tier progression
  const walletBalance = profile?.wallet_balance || 0;
  const isMasterBuilder = profile?.loyalty_tier === 'Master Builder';
  const progressPercent = Math.min(100, (walletBalance / 500) * 100);
  const boltsToNextTier = Math.max(0, 500 - walletBalance);

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-10">
        
        {/* Header Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800 pb-8">
          <div>
            <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
              <Award className="w-4 h-4 text-amber-400" />
              <span>MechItAll Loyalty Rewards Program</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
              Builder Dashboard &amp; Vault
            </h1>
            <p className="text-sm text-zinc-400 mt-1.5">
              Confirm mechatronic parts deliveries, release escrow funds, and build your reputation.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="flex flex-wrap items-center gap-4 bg-zinc-800/80 border border-zinc-700/50 p-4 rounded-xl shadow-lg">
            <div className="px-4 py-2 border-r border-zinc-700">
              <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Loyalty Tier</span>
              <span className="text-base font-extrabold text-amber-400 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
                {profile?.loyalty_tier || 'Tinkerer'}
              </span>
            </div>
            <div className="px-4 py-2 border-r border-zinc-700">
              <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Wallet Balance</span>
              <span className="text-base font-mono font-extrabold text-white mt-0.5">
                {walletBalance} Bolts
              </span>
            </div>
            <div className="px-4 py-2">
              <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Exchange Value</span>
              <span className="text-base font-extrabold text-emerald-400 mt-0.5">
                ₹{(walletBalance / 10).toFixed(2)} INR
              </span>
            </div>
          </div>
        </div>

        {/* Tier Progress Section */}
        <div className="bg-zinc-800 border border-zinc-700/60 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs uppercase font-extrabold text-zinc-400 tracking-wider">Tier Progression</span>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                {isMasterBuilder ? 'Master Builder Achieved!' : 'Path to Master Builder Status'}
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </h3>
            </div>
            <span className="text-xs font-mono font-bold bg-zinc-900 border border-zinc-700 text-zinc-300 px-2.5 py-1 rounded-md">
              {walletBalance} / 500 XP
            </span>
          </div>

          {/* Animated Progress Bar */}
          <div className="relative w-full h-4 bg-zinc-900 rounded-full overflow-hidden border border-zinc-700">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Progress glow */}
            <div
              className="absolute top-0 h-full bg-white/20 blur-[2px] transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold text-zinc-300">Tinkerer</span>
            {!isMasterBuilder ? (
              <span>Earn <strong className="text-amber-400 font-mono">{boltsToNextTier}</strong> more Bolts to unlock Master Builder</span>
            ) : (
              <span className="text-amber-400 font-bold">★ Legendary Builder Status Active</span>
            )}
            <span className="font-semibold text-zinc-300">Master Builder (500)</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-800 gap-6">
          <button
            onClick={() => setActiveTab('rewards')}
            className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'rewards'
                ? 'border-amber-500 text-white font-extrabold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <History className="w-4 h-4" /> Nuts &amp; Bolts Vault
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'border-amber-500 text-white font-extrabold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Coins className="w-4 h-4" /> Order History &amp; Escrow
          </button>
        </div>

        {/* Tab Body */}
        {activeTab === 'rewards' ? (
          /* LOYALTY HUB VAULT TAB */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Ledger Transactions */}
            <div className="lg:col-span-2 bg-zinc-800 border border-zinc-700/60 rounded-2xl shadow-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-zinc-700/60 flex items-center justify-between">
                <h3 className="font-bold text-white tracking-tight flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-500" />
                  Transaction Ledger History
                </h3>
                <button 
                  onClick={syncDashboardData}
                  className="p-1.5 rounded-lg hover:bg-zinc-700/50 border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
                  title="Refresh balance"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4 text-zinc-400">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  <span className="text-sm font-semibold">Loading vault balances...</span>
                </div>
              ) : transactions.length > 0 ? (
                <div className="divide-y divide-zinc-700/50 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-zinc-900/40 border-b border-zinc-700 text-zinc-400 font-semibold text-xs uppercase tracking-wider">
                        <th className="px-6 py-3.5">Date</th>
                        <th className="px-6 py-3.5">Description</th>
                        <th className="px-6 py-3.5">Status &amp; Urgency</th>
                        <th className="px-6 py-3.5 text-right">Bolts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-700/40">
                      {transactions.map((tx) => {
                        const isCredit = tx.amount > 0;
                        const isExp = tx.type === 'expiration';
                        const daysLeft = tx.expires_at
                          ? Math.ceil((new Date(tx.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                          : null;
                        
                        return (
                          <tr key={tx.id} className="hover:bg-zinc-700/20 transition-all">
                            <td className="px-6 py-4 font-medium text-zinc-300">
                              {new Date(tx.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-zinc-200 block text-xs">{tx.description}</span>
                              {tx.order_id && (
                                <span className="text-[10px] font-mono text-zinc-500">Linked Order: {tx.order_id}</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {tx.type === 'credit' && !tx.is_expired && daysLeft !== null && (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                                    Active
                                  </span>
                                  <span className="block text-[10px] text-orange-400 font-bold flex items-center gap-1">
                                    <Clock className="w-3 h-3 animate-pulse" />
                                    {daysLeft > 0 ? `Expires in ${daysLeft} days` : 'Expires today!'}
                                  </span>
                                </div>
                              )}
                              {tx.is_expired && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-500 font-bold border border-zinc-800">
                                  Expired
                                </span>
                              )}
                              {tx.type === 'debit' && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                                  Redeemed
                                </span>
                              )}
                              {isExp && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-bold border border-red-500/20">
                                  Auto-Expired
                                </span>
                              )}
                            </td>
                            <td className={`px-6 py-4 text-right font-mono font-bold text-base ${
                              isCredit ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              {isCredit ? `+${tx.amount}` : tx.amount}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-20 text-center space-y-3">
                  <Coins className="w-12 h-12 text-zinc-600 mx-auto" />
                  <p className="text-sm text-zinc-300 font-bold">No loyalty transactions yet</p>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    Confirm order deliveries or upload unboxing proof to accumulate digital Bolts.
                  </p>
                </div>
              )}
            </div>

            {/* Program Details Card */}
            <div className="space-y-6">
              <div className="bg-zinc-800 border border-zinc-700/60 p-6 rounded-2xl shadow-xl space-y-4">
                <h4 className="font-bold text-white text-sm tracking-tight border-b border-zinc-700 pb-3">
                  Rules of the Vault
                </h4>
                <div className="space-y-4 text-xs leading-relaxed text-zinc-400 font-medium">
                  <div className="flex gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>Exchange Rate Margin Protection:</strong> Bolts are valued at a fixed rate of <span className="text-zinc-200">10 Bolts = ₹1.00 store value</span>.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>Earn Limit:</strong> To protect merchants, earning is strictly capped at <span className="text-zinc-200">100 Bolts (₹10.00 equivalent) per transaction</span>.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>Bolts Expiry Window:</strong> All earned digital Bolts are configured to automatically expire within a strict <span className="text-zinc-200">45-day window</span> to incentivize prompt hardware building.
                    </p>
                  </div>
                </div>
              </div>

              {/* Developer Sandbox Controls */}
              <div className="bg-zinc-800/40 border border-dashed border-zinc-700/80 p-5 rounded-xl space-y-3">
                <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Loyalty System Sandbox Testing
                </span>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  No active orders? Use the button below to instantly seed a mock order marked as "Delivered" so you can test the photo uploading and escrow release pipeline immediately.
                </p>
                <button
                  onClick={handleSeedMockOrder}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-zinc-200 cursor-pointer disabled:opacity-50 transition-all"
                >
                  <PlusCircle className="w-4 h-4" /> Seed "Delivered" Test Order
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ESCROW & ORDERS TAB */
          <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-700/60">
              <h3 className="font-bold text-white tracking-tight flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                Digital Escrow Payouts &amp; Purchases
              </h3>
            </div>

            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-4 text-zinc-400">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <span className="text-sm font-semibold">Fetching orders...</span>
              </div>
            ) : orders.length > 0 ? (
              <div className="divide-y divide-zinc-700/50">
                {orders.map((order) => {
                  const isClaimed = order.rewards_claimed;
                  const isDelivered = order.status === 'Delivered';
                  const isProcessing = order.status === 'Processing';
                  const isShipped = order.status === 'Shipped';
                  const isCompleted = order.status === 'Completed';

                  return (
                    <div key={order.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-zinc-700/10 transition-all">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-white">{order.id}</span>
                          <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full border ${
                            isCompleted
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : isDelivered
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 space-y-1">
                          <p>Placed: {new Date(order.created_at).toLocaleString()}</p>
                          <p>Items: {order.items_count} mechatronics component(s) | Total: <strong>₹{Number(order.total_amount).toFixed(2)}</strong></p>
                        </div>
                      </div>

                      {/* Action block */}
                      <div className="flex flex-wrap items-center gap-4">
                        {/* Simulation Controls for testing status flow */}
                        {isProcessing && (
                          <button
                            onClick={() => handleSimulateStatus(order.id, 'Shipped')}
                            disabled={isPending}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-700 text-zinc-300 transition-all cursor-pointer"
                          >
                            Simulate Ship
                          </button>
                        )}
                        {isShipped && (
                          <button
                            onClick={() => handleSimulateStatus(order.id, 'Delivered')}
                            disabled={isPending}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-700 text-zinc-300 transition-all cursor-pointer"
                          >
                            Simulate Delivery
                          </button>
                        )}

                        {/* Delivered -> Prominent Unboxing Claim Button */}
                        {isDelivered && (
                          <div className="relative">
                            <label
                              htmlFor={`file-upload-${order.id}`}
                              className="inline-flex items-center gap-2 text-xs font-extrabold bg-amber-500 hover:bg-amber-600 hover:scale-[1.02] text-zinc-950 px-4 py-2.5 rounded-xl cursor-pointer transition-all shadow-md active:scale-95 duration-150"
                            >
                              {uploadingOrderId === order.id || isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Releasing Escrow &amp; Crediting Bolts...
                                </>
                              ) : (
                                <>
                                  <Camera className="w-4 h-4" />
                                  Upload Unboxing Photo to Claim Bolts
                                </>
                              )}
                            </label>
                            <input
                              id={`file-upload-${order.id}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handlePhotoUploadAndClaim(order.id, e)}
                              disabled={uploadingOrderId !== null || isPending}
                            />
                          </div>
                        )}

                        {/* Completed state */}
                        {isCompleted && (
                          <div className="flex items-center gap-4">
                            {order.unboxing_photo_url && (
                              <div className="relative w-12 h-12 rounded-lg border border-zinc-700 overflow-hidden bg-zinc-900">
                                <img
                                  src={order.unboxing_photo_url}
                                  alt="Unboxing proof"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="text-right">
                              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Escrow Released (PayU)
                              </span>
                              <span className="text-[10px] font-mono text-zinc-500 block">
                                Nodal Payout Confirmed
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center space-y-3">
                <Coins className="w-12 h-12 text-zinc-600 mx-auto" />
                <p className="text-sm text-zinc-300 font-bold">No orders found</p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Add items to your cart, place an order, and simulate its delivery lifecycle here.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
