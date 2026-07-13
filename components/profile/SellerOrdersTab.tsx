'use client';
import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, RefreshCw, CheckCircle2, Package, X, Cpu 
} from 'lucide-react';

export default function SellerOrdersTab(props: any) {
  const { 
    sellerOrders = [], 
    loadingSellerOrders, 
    updatingOrderId, 
    handleUpdateOrderStatus, 
    dbProducts = [], 
    sellerData 
  } = props;

  // Local State
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  // Mapped active order details
  const selectedOrderDetails = useMemo(() => {
    return sellerOrders.find((o: any) => o.id === activeOrderId) || null;
  }, [sellerOrders, activeOrderId]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return sellerOrders.filter((order: any) => {
      if (statusFilter === 'All') return true;
      return order.status.toLowerCase() === statusFilter.toLowerCase();
    });
  }, [sellerOrders, statusFilter]);

  // Sort orders
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a: any, b: any) => {
      if (sortBy === 'date-desc') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'amount-desc') {
        return Number(b.total_amount) - Number(a.total_amount);
      }
      if (sortBy === 'amount-asc') {
        return Number(a.total_amount) - Number(b.total_amount);
      }
      if (sortBy === 'status-asc') {
        return a.status.localeCompare(b.status);
      }
      if (sortBy === 'status-desc') {
        return b.status.localeCompare(a.status);
      }
      return 0;
    });
  }, [filteredOrders, sortBy]);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-zinc-800 border border-zinc-700/60 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-white tracking-tight uppercase font-['Space_Grotesk']">Seller Orders Manager</h2>
          <p className="text-xs text-zinc-500 mt-1 font-semibold">
            Track, ship, and complete purchase orders submitted by customers for custom machining contracts or catalog mechatronic parts.
          </p>
        </div>

        {/* Filter and Sort Toolbar */}
        {sellerOrders.length > 0 && (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-800 border border-zinc-700/60 p-4 rounded-xl shadow-sm">
            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {['All', 'Processing', 'Shipped', 'Delivered', 'Completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3.5 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                    statusFilter === status
                      ? 'bg-cobalt text-white shadow-sm border-cobalt'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border-zinc-700/60 hover:bg-zinc-900/80'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
              <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono tracking-wider">Sort By</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-bold font-mono p-2 border border-zinc-700/60 bg-zinc-900 text-white focus:outline-none focus:border-cobalt rounded cursor-pointer"
              >
                <option value="date-desc">Date (Newest)</option>
                <option value="date-asc">Date (Oldest)</option>
                <option value="amount-desc">Amount (High to Low)</option>
                <option value="amount-asc">Amount (Low to High)</option>
                <option value="status-asc">Status (A-Z)</option>
                <option value="status-desc">Status (Z-A)</option>
              </select>
            </div>
          </div>
        )}

        {loadingSellerOrders ? (
          <div className="bg-zinc-800 border border-zinc-700/60 p-12 text-center rounded-xl space-y-3">
            <RefreshCw className="w-8 h-8 text-cobalt animate-spin mx-auto" />
            <p className="text-xs font-bold text-zinc-400 animate-pulse">Loading orders queue...</p>
          </div>
        ) : sellerOrders.length === 0 ? (
          <div className="bg-zinc-800 border border-zinc-700/60 rounded-xl p-12 text-center py-20 space-y-3 shadow-sm">
            <ShoppingBag className="w-12 h-12 text-zinc-400/20 mx-auto" />
            <h4 className="text-sm font-bold text-white font-['Space_Grotesk']">No orders received yet</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto font-medium">
              When buyers checkout your mechatronics parts or accept your custom machining quotes, their purchase orders will appear here.
            </p>
          </div>
        ) : sortedOrders.length === 0 ? (
          <div className="bg-zinc-800 border border-zinc-700/60 rounded-xl p-12 text-center py-16 space-y-2 shadow-sm">
            <ShoppingBag className="w-10 h-10 text-zinc-400/20 mx-auto" />
            <p className="text-xs font-mono font-bold text-zinc-400">No orders with status "{statusFilter}" found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedOrders.map(order => {
              const nextStatusMap = {
                'Processing': 'Shipped',
                'Shipped': 'Delivered',
                'Delivered': null,
                'Completed': null
              };
              const nextStatus = nextStatusMap[order.status as keyof typeof nextStatusMap];
              const isUpdating = updatingOrderId === order.id;

              return (
                <div 
                  key={order.id} 
                  onClick={() => setActiveOrderId(order.id)}
                  className="bg-zinc-800 border border-zinc-700/60 p-6 rounded-xl shadow-sm hover:border-[#06b6d4] hover:shadow-lg transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 cursor-pointer group"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-cobalt bg-cobalt/5 border border-cobalt/15 px-2.5 py-1 rounded">
                        {order.id}
                      </span>
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        order.status === 'Completed'
                          ? 'bg-emerald/8 text-emerald border-emerald/20'
                          : order.status === 'Delivered'
                            ? 'bg-sky-500/8 text-sky-600 border-sky-500/20'
                            : order.status === 'Shipped'
                              ? 'bg-amber-500/8 text-amber-600 border-amber-500/20'
                              : 'bg-slate-500/8 text-slate-600 border-slate-500/20'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-white truncate">
                        Buyer: <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors">{order.buyer_name}</span>
                        <span className="text-[10px] text-zinc-400 font-normal font-mono ml-2">({order.buyer_email})</span>
                      </h4>
                      <p className="text-[11px] text-zinc-400 font-semibold">
                        Total Amount: <span className="text-white font-extrabold">₹{Number(order.total_amount).toLocaleString('en-IN')}</span> | Items: <span className="font-bold">{order.items_count}</span>
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        Ordered on: {new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {nextStatus && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent modal from opening
                          handleUpdateOrderStatus(order.id, nextStatus as any);
                        }}
                        disabled={isUpdating}
                        className="bg-[#0f172a] hover:bg-[#06b6d4] text-white text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 rounded transition-colors shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Mark as {nextStatus}</span>
                      </button>
                    )}

                    {order.status === 'Completed' && (
                      <div className="flex items-center gap-1.5 text-emerald font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Order Completed</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Order Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-sm transition-opacity" onClick={() => setActiveOrderId(null)} />
          
          {/* Content Card */}
          <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative z-10 animate-slide-in space-y-6 font-mono text-left max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-zinc-700/60">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-cobalt uppercase tracking-wider">Order Specifications</span>
                <h3 className="text-base font-black text-white">{selectedOrderDetails.id}</h3>
              </div>
              <button onClick={() => setActiveOrderId(null)} className="p-1.5 rounded hover:bg-zinc-900 border border-zinc-700/60 text-zinc-500 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-700/30">
                <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Status</span>
                <span className={`inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  selectedOrderDetails.status === 'Completed'
                    ? 'bg-emerald/8 text-emerald border-emerald/20'
                    : selectedOrderDetails.status === 'Delivered'
                      ? 'bg-sky-500/8 text-sky-600 border-sky-500/20'
                      : selectedOrderDetails.status === 'Shipped'
                        ? 'bg-amber-500/8 text-amber-600 border-amber-500/20'
                        : 'bg-slate-500/8 text-slate-600 border-slate-500/20'
                }`}>
                  {selectedOrderDetails.status}
                </span>
              </div>
              <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-700/30">
                <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Total amount</span>
                <span className="block text-xs font-extrabold text-white mt-1">₹{Number(selectedOrderDetails.total_amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-700/30">
                <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Items Qty</span>
                <span className="block text-xs font-bold text-white mt-1">{selectedOrderDetails.items_count} units</span>
              </div>
              <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-700/30">
                <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Order Date</span>
                <span className="block text-[10px] font-bold text-white mt-1">
                  {new Date(selectedOrderDetails.created_at).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>

            {/* Buyer Details */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-1.5 border-b border-zinc-700/60">Buyer Details</h4>
              <div className="bg-zinc-900/30 border border-zinc-700/30 rounded-lg p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Contact Name:</span>
                  <span className="text-white font-bold">{selectedOrderDetails.buyer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Email Address:</span>
                  <span className="text-white font-bold">{selectedOrderDetails.buyer_email}</span>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-1.5 border-b border-zinc-700/60">Delivery Address</h4>
              <div className="bg-zinc-900/30 border border-zinc-700/30 rounded-lg p-4 text-xs text-zinc-400 leading-relaxed font-semibold">
                {selectedOrderDetails.buyer_address}
              </div>
            </div>

            {/* Order Items Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-1.5 border-b border-zinc-700/60">Items List</h4>
              {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 ? (
                <div className="border border-zinc-700/60 rounded-lg overflow-hidden bg-zinc-900/30">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-700 bg-zinc-900/50 text-[9px] font-bold uppercase text-zinc-400">
                        <th className="p-3">Product / SKU</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-700/40">
                      {selectedOrderDetails.items.map((item: any, idx: number) => {
                        const matchedProduct = 
                          (dbProducts || []).find((p: any) => p.id === item.product_id) || 
                          (sellerData?.products || []).find((p: any) => p.id === item.product_id);
                        return (
                          <tr key={idx} className="hover:bg-zinc-800/20 text-zinc-300">
                            <td className="p-3">
                              <div className="space-y-0.5">
                                <span className="block text-white font-bold truncate max-w-[200px]" title={matchedProduct?.title || 'Catalog Product'}>
                                  {matchedProduct?.title || 'Catalog Product'}
                                </span>
                                <span className="block text-[8px] text-zinc-500 uppercase tracking-wider">
                                  {matchedProduct?.part_number || matchedProduct?.sku || item.product_id}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-center text-white font-bold">{item.quantity}</td>
                            <td className="p-3 text-right">₹{Number(item.unit_price).toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right text-coral font-bold">₹{(Number(item.unit_price) * item.quantity).toLocaleString('en-IN')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-zinc-900/30 border border-zinc-700/30 rounded-lg p-4 text-xs text-zinc-400 flex items-center justify-between font-semibold">
                  <span>Custom Fabrication Contract details</span>
                  <span className="text-[10px] bg-zinc-800 border px-2 py-0.5 rounded text-white font-bold">
                    {selectedOrderDetails.id.startsWith('RFQ-') ? 'RFQ Contract' : 'Quote Invoice'}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-zinc-700/60">
              <div>
                {selectedOrderDetails.status === 'Completed' && (
                  <div className="flex items-center gap-1.5 text-emerald font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Order Completed</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                {(() => {
                  const nextStatusMap = {
                    'Pending Payment': 'Processing',
                    'Processing': 'Shipped',
                    'Shipped': 'Delivered',
                    'Delivered': 'Completed',
                    'Completed': null
                  };
                  const nextStatus = nextStatusMap[selectedOrderDetails.status as keyof typeof nextStatusMap];
                  const isUpdating = updatingOrderId === selectedOrderDetails.id;
                  
                  if (!nextStatus) return null;
                  return (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateOrderStatus(selectedOrderDetails.id, nextStatus as any);
                      }}
                      disabled={isUpdating}
                      className="bg-cobalt hover:bg-[#06b6d4] text-white text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 rounded transition-all shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
                  onClick={() => setActiveOrderId(null)}
                  className="border border-zinc-700/60 hover:bg-zinc-900 text-zinc-400 hover:text-white px-4 py-2.5 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
