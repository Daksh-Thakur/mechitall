'use client';

import React, { useState } from 'react';
import { X, Cpu, Download, Info, Minus, Plus, ShoppingCart } from 'lucide-react';
import { Part } from './mockData';
import { useCart } from './CartProvider';

interface ProductModalProps {
  part: Part;
  onClose: () => void;
}

export default function ProductModal({ part, onClose }: ProductModalProps) {
  const [tab, setTab] = useState<'specs' | 'pricing' | 'cad'>('specs');
  const [quantity, setQuantity] = useState(1);
  const { addToCart, getPartPriceForQuantity, showToast } = useCart();

  const handleAdd = () => {
    addToCart(part, quantity);
    onClose();
  };

  const handleDocumentClick = (e: React.MouseEvent, url: string | undefined, type: string) => {
    e.preventDefault();
    // Check if the URL is valid, exists, and is not a placeholder/mock domain
    const isMock = !url || url === '#' || url === '' || url.includes('mechitall.io') || !url.startsWith('http');
    
    if (isMock) {
      showToast(`${type} is not available currently.`, 'error');
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-text-primary/45 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white border border-slate-border rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row h-[550px]">

        {/* Left — gradient image */}
        <div className={`md:w-5/12 bg-gradient-to-br ${part.gradientClass} p-6 flex flex-col justify-between relative`}>
          <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px] pointer-events-none"></div>
          <div className="z-10 flex justify-between items-start">
            <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider bg-white/90 text-slate-text-primary shadow-sm border border-slate-border/50">
              {part.category}
            </span>
            <span className="text-[10px] text-slate-text-primary/70 font-mono font-bold bg-white/40 px-1.5 py-0.5 rounded backdrop-blur-md">
              {part.extendedSpecs.ingressProtection}
            </span>
          </div>
          <div className="z-10 flex flex-col items-center justify-center py-6 text-center space-y-3">
            <Cpu className="w-16 h-16 text-slate-text-primary/20 animate-pulse" />
            <div>
              <span className="block font-mono text-[9px] text-slate-text-primary/60 tracking-wider font-extrabold">CAD SOLID LAYER</span>
              <span className="block text-[10px] text-slate-text-primary/80 font-bold font-mono border-t border-slate-text-primary/20 pt-1">{part.cadFile}</span>
            </div>
          </div>
          <div className="z-10 space-y-1.5">
            <div className="text-[9px] uppercase tracking-wider text-slate-text-primary/60 font-bold">Lifespan &amp; Thermal</div>
            <div className="grid grid-cols-2 gap-2 text-slate-text-primary text-[10px] font-bold font-mono">
              <div className="bg-white/45 p-1.5 rounded backdrop-blur-md">
                <span className="block text-[7px] text-slate-text-primary/60 uppercase font-bold">MTBF</span>
                {part.extendedSpecs.mtbf}
              </div>
              <div className="bg-white/45 p-1.5 rounded backdrop-blur-md">
                <span className="block text-[7px] text-slate-text-primary/60 uppercase font-bold">Oper Temp</span>
                {part.extendedSpecs.temperatureRange}
              </div>
            </div>
          </div>
        </div>

        {/* Right — tabs + actions */}
        <div className="md:w-7/12 flex flex-col justify-between bg-white">
          <div className="p-6 pb-2 space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono font-bold text-slate-text-muted tracking-wider uppercase">{part.partNumber}</span>
                <h3 className="text-base font-extrabold text-slate-text-primary leading-tight">{part.title}</h3>
              </div>
              <button onClick={onClose} className="p-1 rounded hover:bg-slate-bg text-slate-text-muted hover:text-slate-text-primary transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="border-b border-slate-border flex gap-4 text-xs font-bold">
              {(['specs', 'pricing', 'cad'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`pb-2 border-b-2 transition-all cursor-pointer ${tab === t ? 'border-cobalt text-cobalt font-extrabold' : 'border-transparent text-slate-text-muted hover:text-slate-text-secondary'}`}
                >
                  {t === 'specs' ? 'Technical Specs' : t === 'pricing' ? 'Volume Discounts' : 'CAD & Docs'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-2">
            {tab === 'specs' && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-text-secondary leading-relaxed">{part.description}</p>
                <div className="border border-slate-border rounded-lg overflow-hidden divide-y divide-slate-border/50">
                  {Object.entries(part.specs).map(([key, val]) => (
                    <div key={key} className="grid grid-cols-2 p-2 bg-slate-bg/30 font-medium">
                      <span className="text-slate-text-muted pl-1">{key}</span>
                      <span className="text-slate-text-primary font-bold">{val}</span>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 p-2 bg-slate-bg/30 font-medium">
                    <span className="text-slate-text-muted pl-1">Envelope Size</span>
                    <span className="text-slate-text-primary font-bold">{part.extendedSpecs.dimensions}</span>
                  </div>
                </div>
              </div>
            )}
            {tab === 'pricing' && (
              <div className="space-y-4">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-text-muted">Enterprise Tier Matrix</span>
                <div className="space-y-2">
                  {part.bulkPricing.map((tier, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border border-slate-border/50 rounded-lg bg-slate-bg/30">
                      <span className="text-xs font-bold text-slate-text-primary">Order {tier.minQty}{tier.maxQty ? ` to ${tier.maxQty}` : '+'} units</span>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-emerald">₹{tier.pricePerUnit.toFixed(2)}</span>
                        <span className="text-[9px] text-slate-text-muted block font-bold">INR/unit</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-cobalt/5 border border-cobalt/15 p-3 rounded-lg flex items-start gap-2 text-[10px] text-slate-text-secondary leading-relaxed">
                  <Info className="w-4 h-4 text-cobalt flex-shrink-0 mt-0.5" />
                  <span>Pricing matrix updates live in the cart. Net-30 payment term invoicing applies at checkout.</span>
                </div>
              </div>
            )}
            {tab === 'cad' && (
              <div className="space-y-4 text-xs font-medium text-slate-text-secondary">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-text-muted">Technical Documents</span>
                <div className="space-y-3">
                  <a
                    href={part.datasheetUrl}
                    onClick={(e) => handleDocumentClick(e, part.datasheetUrl, 'Technical Datasheet')}
                    className="flex items-center justify-between p-3 border border-slate-border rounded-lg hover:border-cobalt hover:bg-slate-bg/30 transition-all text-slate-text-primary font-bold cursor-pointer"
                  >
                    <span className="flex items-center gap-2"><span className="p-1 rounded bg-red-100 text-coral">PDF</span> Technical Datasheet</span>
                    <Download className="w-4 h-4 text-slate-text-muted" />
                  </a>
                  <a
                    href={`#cad-${part.cadFile}`}
                    onClick={(e) => handleDocumentClick(e, part.cadFile?.startsWith('http') ? part.cadFile : undefined, '3D Solid Model File')}
                    className="flex items-center justify-between p-3 border border-slate-border rounded-lg hover:border-cobalt hover:bg-slate-bg/30 transition-all text-slate-text-primary font-bold cursor-pointer"
                  >
                    <span className="flex items-center gap-2"><span className="p-1 rounded bg-blue-100 text-cobalt">STEP</span> 3D Solid Model File</span>
                    <Download className="w-4 h-4 text-slate-text-muted" />
                  </a>
                </div>
                <div className="p-3 bg-slate-bg/50 border border-slate-border/50 rounded-lg text-[10px] leading-relaxed">
                  <strong>Note:</strong> All CAD files comply with STEP AP203/AP214 standards.
                </div>
              </div>
            )}
          </div>

          {/* Add to cart footer */}
          <div className="p-6 border-t border-slate-border bg-slate-bg/50 flex items-center justify-between gap-4">
            <div>
              <span className="block text-[9px] uppercase tracking-wider text-slate-text-muted font-bold">Qty Price (INR)</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-extrabold text-coral">₹{(getPartPriceForQuantity(part, quantity) * quantity).toFixed(2)}</span>
                <span className="text-[9px] text-slate-text-muted font-bold">INR</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-slate-border bg-white rounded-md h-9">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-2.5 text-slate-text-muted hover:text-slate-text-primary">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 text-xs font-bold text-slate-text-primary min-w-[20px] text-center">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="px-2.5 text-slate-text-muted hover:text-slate-text-primary">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <button onClick={handleAdd} className="btn-cobalt text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer flex items-center gap-1.5 h-9">
                <ShoppingCart className="w-4 h-4" /> Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
