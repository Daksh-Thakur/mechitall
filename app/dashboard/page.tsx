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
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col overflow-x-clip">
      <Navbar />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 md:px-6 py-8 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E4E4E7] pb-6">
          <div>
            <div className="flex items-center gap-2 text-amber-600 font-mono font-bold text-[10px] uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>MechItAll Loyalty Rewards Program</span>
            </div>
            <h1 className="font-['Space_Grotesk'] text-2xl font-bold text-[#0F172A] uppercase tracking-tight mt-1">
              Builder Dashboard &amp; Vault
            </h1>
            <p className="font-['Inter'] text-xs text-[#45464d] mt-1.5 opacity-80">
              Confirm mechatronic parts deliveries, release escrow funds, and build your reputation.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="flex flex-wrap items-center gap-4 bg-white border border-[#E4E4E7] p-3.5 rounded shadow-sm">
            <div className="px-4 py-1.5 border-r border-[#E4E4E7]">
              <span className="block text-[9px] uppercase font-bold text-[#76777d] tracking-wider font-mono">Loyalty Tier</span>
              <span className="text-xs font-bold text-amber-600 flex items-center gap-1.5 mt-0.5 uppercase font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                {profile?.loyalty_tier || 'Tinkerer'}
              </span>
            </div>
            <div className="px-4 py-1.5 border-r border-[#E4E4E7]">
              <span className="block text-[9px] uppercase font-bold text-[#76777d] tracking-wider font-mono">Wallet Balance</span>
              <span className="text-xs font-mono font-bold text-[#0f172a] mt-0.5 block">
                {walletBalance} Bolts
              </span>
            </div>
            <div className="px-4 py-1.5">
              <span className="block text-[9px] uppercase font-bold text-[#76777d] tracking-wider font-mono">Exchange Value</span>
              <span className="text-xs font-mono font-bold text-emerald mt-0.5 block">
                ₹{(walletBalance / 10).toFixed(2)} INR
              </span>
            </div>
          </div>
        </div>

        {/* Tier Progress Section */}
        <div className="bg-white border border-[#E4E4E7] p-5 rounded shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase font-bold text-[#76777d] tracking-wider font-mono">Tier Progression</span>
              <h3 className="font-['Space_Grotesk'] text-sm font-bold text-[#0f172a] uppercase tracking-tight flex items-center gap-1.5">
                {isMasterBuilder ? 'Master Builder Achieved!' : 'Path to Master Builder Status'}
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold bg-[#F8FAFC] border border-[#E4E4E7] text-[#0f172a] px-2 py-0.5 rounded">
              {walletBalance} / 500 XP
            </span>
          </div>

          {/* Compact Progress Bar */}
          <div className="relative w-full h-3 bg-[#F8FAFC] rounded border border-[#E4E4E7] overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 rounded transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#45464d] font-mono">
            <span className="font-bold uppercase text-[#0f172a]">Tinkerer</span>
            {!isMasterBuilder ? (
              <span>Earn <strong className="text-amber-600 font-mono">{boltsToNextTier}</strong> more Bolts to unlock Master Builder</span>
            ) : (
              <span className="text-amber-600 font-bold uppercase">★ Legendary Builder Status Active</span>
            )}
            <span className="font-bold uppercase text-[#0f172a]">Master Builder (500)</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#E4E4E7] gap-6">
          <button
            onClick={() => setActiveTab('rewards')}
            className={`pb-3 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'rewards'
                ? 'border-amber-500 text-[#0F172A] font-bold'
                : 'border-transparent text-[#76777d] hover:text-[#0f172a]'
            }`}
          >
            <History className="w-4 h-4" /> Nuts &amp; Bolts Vault
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'border-amber-500 text-[#0F172A] font-bold'
                : 'border-transparent text-[#76777d] hover:text-[#0f172a]'
            }`}
          >
            <Coins className="w-4 h-4" /> Order History &amp; Escrow
          </button>
        </div>

        {/* Tab Body */}
        {activeTab === 'rewards' ? (
          /* LOYALTY HUB VAULT TAB */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ledger Transactions */}
            <div className="lg:col-span-2 bg-white border border-[#E4E4E7] rounded shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E4E4E7] flex items-center justify-between">
                <h3 className="font-['Space_Grotesk'] text-sm font-bold text-[#0F172A] uppercase tracking-tight flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-500" />
                  Transaction Ledger History
                </h3>
                <button 
                  onClick={syncDashboardData}
                  className="p-1.5 rounded hover:bg-[#F8FAFC] border border-[#E4E4E7] hover:border-[#0F172A] text-[#76777d] hover:text-[#0f172a] transition-all cursor-pointer"
                  title="Refresh balance"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3 text-[#76777d]">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider font-mono">Loading vault balances...</span>
                </div>
              ) : transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-['Inter']">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-[#E4E4E7] text-[#76777d] font-mono text-[9px] uppercase tracking-wider font-bold">
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Description</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Bolts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E4E7]">
                      {transactions.map((tx) => {
                        const isCredit = tx.amount > 0;
                        const isExp = tx.type === 'expiration';
                        const daysLeft = tx.expires_at
                          ? Math.ceil((new Date(tx.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                          : null;
                        
                        return (
                          <tr key={tx.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                            <td className="px-5 py-3.5 font-mono text-[11px] text-[#45464d]">
                              {new Date(tx.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="font-bold text-[#0f172a] block">{tx.description}</span>
                              {tx.order_id && (
                                <span className="text-[9px] font-mono text-[#76777d]">Linked Order: {tx.order_id}</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              {tx.type === 'credit' && !tx.is_expired && daysLeft !== null && (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded bg-emerald/5 text-emerald font-bold border border-emerald/20 font-mono uppercase tracking-wider">
                                    Active
                                  </span>
                                  <span className="block text-[9px] text-amber-600 font-bold font-mono flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5 animate-pulse" />
                                    {daysLeft > 0 ? `Expires in ${daysLeft}d` : 'Expires today!'}
                                  </span>
                                </div>
                              )}
                              {tx.is_expired && (
                                <span className="inline-flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded bg-[#F8FAFC] text-[#76777d] font-bold border border-[#E4E4E7] font-mono uppercase tracking-wider">
                                  Expired
                                </span>
                              )}
                              {tx.type === 'debit' && (
                                <span className="inline-flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded bg-blue-500/5 text-blue-600 font-bold border border-blue-500/20 font-mono uppercase tracking-wider">
                                  Redeemed
                                </span>
                              )}
                              {isExp && (
                                <span className="inline-flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded bg-red-500/5 text-red-600 font-bold border border-red-500/20 font-mono uppercase tracking-wider">
                                  Auto-Expired
                                </span>
                              )}
                            </td>
                            <td className={`px-5 py-3.5 text-right font-mono font-bold text-sm ${
                              isCredit ? 'text-emerald' : 'text-red-600'
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
                <div className="py-16 text-center space-y-3">
                  <Coins className="w-10 h-10 text-[#76777d]/30 mx-auto" />
                  <p className="text-xs font-bold text-[#0F172A] uppercase font-mono">No loyalty transactions yet</p>
                  <p className="text-[10px] text-[#76777d] max-w-xs mx-auto leading-relaxed">
                    Confirm order deliveries or upload unboxing proof to accumulate digital Bolts.
                  </p>
                </div>
              )}
            </div>

            {/* Program Details Card */}
            <div className="space-y-6">
              <div className="bg-white border border-[#E4E4E7] p-5 rounded shadow-sm space-y-4">
                <h4 className="font-['Space_Grotesk'] text-xs font-bold text-[#0f172a] uppercase tracking-tight border-b border-[#E4E4E7] pb-2.5">
                  Rules of the Vault
                </h4>
                <div className="space-y-3.5 text-[11px] leading-relaxed text-[#45464d]">
                  <div className="flex gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>Exchange Rate:</strong> Bolts are valued at a fixed rate of <span className="text-[#0f172a] font-bold">10 Bolts = ₹1.00 store value</span>.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>Earn Limit:</strong> To protect merchants, earning is strictly capped at <span className="text-[#0f172a] font-bold">100 Bolts (₹10.00 equivalent) per transaction</span>.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>Bolts Expiry Window:</strong> All earned digital Bolts are configured to automatically expire within a strict <span className="text-[#0f172a] font-bold">45-day window</span> to incentivize prompt hardware building.
                    </p>
                  </div>
                </div>
              </div>

              {/* Developer Sandbox Controls */}
              <div className="bg-white border border-dashed border-[#E4E4E7] p-5 rounded space-y-3">
                <span className="block text-[9px] uppercase font-bold text-[#76777d] tracking-wider font-mono">
                  Loyalty System Sandbox Testing
                </span>
                <p className="text-[10px] text-[#76777d] leading-normal">
                  No active orders? Use the button below to instantly seed a mock order marked as "Delivered" so you can test the photo uploading and escrow release pipeline immediately.
                </p>
                <button
                  onClick={handleSeedMockOrder}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded border border-[#E4E4E7] hover:border-[#0F172A] bg-[#F8FAFC] text-xs font-mono font-bold text-[#0f172a] uppercase tracking-wider cursor-pointer disabled:opacity-50 transition-all"
                >
                  <PlusCircle className="w-4 h-4" /> Seed "Delivered" Test Order
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ESCROW & ORDERS TAB */
          <div className="bg-white border border-[#E4E4E7] rounded shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E4E4E7]">
              <h3 className="font-['Space_Grotesk'] text-sm font-bold text-[#0F172A] uppercase tracking-tight flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                Digital Escrow Payouts &amp; Purchases
              </h3>
            </div>

            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3 text-[#76777d]">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider font-mono">Fetching orders...</span>
              </div>
            ) : orders.length > 0 ? (
              <div className="divide-y divide-[#E4E4E7]">
                {orders.map((order) => {
                  const isClaimed = order.rewards_claimed;
                  const isDelivered = order.status === 'Delivered';
                  const isProcessing = order.status === 'Processing';
                  const isShipped = order.status === 'Shipped';
                  const isCompleted = order.status === 'Completed';

                  return (
                    <div key={order.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#F8FAFC]/50 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-[#0f172a]">{order.id}</span>
                          <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border font-mono ${
                            isCompleted
                              ? 'bg-emerald/5 text-emerald border-emerald/20'
                              : isDelivered
                              ? 'bg-amber-500/5 text-amber-600 border-amber-500/20'
                              : 'bg-blue-500/5 text-blue-600 border-blue-500/20'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-xs text-[#45464d] space-y-0.5">
                          <p>Placed: {new Date(order.created_at).toLocaleString()}</p>
                          <p>Items: {order.items_count} mechatronics component(s) | Total: <strong className="text-[#0f172a] font-mono">₹{Number(order.total_amount).toFixed(2)}</strong></p>
                        </div>
                      </div>

                      {/* Action block */}
                      <div className="flex flex-wrap items-center gap-4">
                        {/* Simulation Controls for testing status flow */}
                        {isProcessing && (
                          <button
                            onClick={() => handleSimulateStatus(order.id, 'Shipped')}
                            disabled={isPending}
                            className="text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded border border-[#E4E4E7] hover:bg-[#F8FAFC] hover:border-[#0F172A] text-[#76777d] hover:text-[#0f172a] transition-all cursor-pointer"
                          >
                            Simulate Ship
                          </button>
                        )}
                        {isShipped && (
                          <button
                            onClick={() => handleSimulateStatus(order.id, 'Delivered')}
                            disabled={isPending}
                            className="text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded border border-[#E4E4E7] hover:bg-[#F8FAFC] hover:border-[#0F172A] text-[#76777d] hover:text-[#0f172a] transition-all cursor-pointer"
                          >
                            Simulate Delivery
                          </button>
                        )}

                        {/* Delivered -> Prominent Unboxing Claim Button */}
                        {isDelivered && (
                          <div className="relative">
                            <label
                              htmlFor={`file-upload-${order.id}`}
                              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-zinc-950 px-4 py-2 rounded cursor-pointer transition-all shadow"
                            >
                              {uploadingOrderId === order.id || isPending ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Crediting...
                                </>
                              ) : (
                                <>
                                  <Camera className="w-3.5 h-3.5" />
                                  Claim Bolts &amp; Release Escrow
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
                              <div className="relative w-10 h-10 rounded border border-[#E4E4E7] overflow-hidden bg-[#F8FAFC] shadow-sm">
                                <img
                                  src={order.unboxing_photo_url}
                                  alt="Unboxing proof"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-emerald flex items-center gap-1 justify-end font-mono uppercase tracking-wider">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Escrow Released (PayU)
                              </span>
                              <span className="text-[8px] font-mono text-[#76777d] block uppercase tracking-wider">
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
              <div className="py-16 text-center space-y-3">
                <Coins className="w-10 h-10 text-[#76777d]/30 mx-auto" />
                <p className="text-xs font-bold text-[#0F172A] uppercase font-mono">No orders found</p>
                <p className="text-[10px] text-[#76777d] max-w-xs mx-auto leading-relaxed">
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
