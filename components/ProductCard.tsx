'use client';

import React from 'react';
import { Cpu, Download, Plus } from 'lucide-react';
import { Part } from './mockData';
import { useCart } from './CartProvider';

interface ProductCardProps {
  part: Part;
  onViewDetails: (part: Part) => void;
}

export default function ProductCard({ part, onViewDetails }: ProductCardProps) {
  const { addToCart } = useCart();

  return (
    <div className="group bg-white rounded-xl border border-slate-border p-5 flex flex-col justify-between card-hover glow-cobalt">
      <div className="space-y-4">
        {/* Image placeholder */}
        <div
          onClick={() => onViewDetails(part)}
          className={`h-40 w-full rounded-lg bg-gradient-to-br ${part.gradientClass} relative overflow-hidden flex items-center justify-center cursor-pointer`}
        >
          <Cpu className="w-10 h-10 text-slate-text-muted/30 group-hover:scale-110 transition-transform duration-300" />
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest bg-white/90 text-slate-text-primary shadow-sm">
            {part.category}
          </div>
          <div className="absolute bottom-2 right-2 text-[9px] font-bold text-slate-text-muted flex items-center gap-1 bg-white/70 backdrop-blur-sm px-1.5 py-0.5 rounded">
            <Download className="w-2.5 h-2.5" /> CAD Available
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1">
          <span className="block font-mono text-[10px] text-slate-text-muted uppercase tracking-wider leading-tight">
            {part.partNumber}
          </span>
          <h3
            onClick={() => onViewDetails(part)}
            className="text-sm font-bold text-slate-text-primary leading-tight group-hover:text-cobalt transition-colors duration-200 cursor-pointer line-clamp-1"
          >
            {part.title}
          </h3>
          <p className="text-xs text-slate-text-muted line-clamp-2 leading-relaxed">{part.description}</p>
        </div>

        {/* Specs mini grid */}
        <div className="border-t border-b border-slate-border/50 py-2.5 space-y-1.5 text-[11px]">
          {Object.entries(part.specs).slice(0, 3).map(([key, val]) => (
            <div key={key} className="flex justify-between font-medium">
              <span className="text-slate-text-muted">{key}</span>
              <span className="text-slate-text-secondary truncate max-w-[140px] font-bold">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Price + Add */}
      <div className="pt-4 flex items-center justify-between gap-2 mt-4">
        <div>
          <span className="block text-[9px] uppercase tracking-wider text-slate-text-muted font-bold">Unit Price</span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-extrabold text-coral">₹{part.price.toFixed(2)}</span>
            <span className="text-[10px] text-slate-text-muted font-bold">INR</span>
          </div>
        </div>
        <button
          onClick={() => addToCart(part, 1)}
          className="btn-cobalt text-xs font-bold px-3 py-2 rounded-lg cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
    </div>
  );
}
