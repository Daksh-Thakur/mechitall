'use client';

import React from 'react';
import { Cpu, Download, Plus, Heart, ShoppingCart } from 'lucide-react';
import { Part } from './mockData';
import { useCart } from './CartProvider';

interface ProductCardProps {
  part: Part;
  onViewDetails: (part: Part) => void;
}

export default function ProductCard({ part, onViewDetails }: ProductCardProps) {
  const { addToCart, toggleWishlist, isWishlisted } = useCart();
  const saved = isWishlisted(part.id);

  return (
    <div
      onClick={() => onViewDetails(part)}
      className="group bg-white rounded-xl border border-slate-border p-2 sm:p-5 flex flex-col justify-between card-hover glow-cobalt cursor-pointer min-w-0"
    >
      <div className="space-y-1.5 sm:space-y-4">
        {/* Image placeholder */}
        <div
          className={`h-20 sm:h-40 w-full rounded-lg bg-gradient-to-br ${part.gradientClass} relative overflow-hidden flex items-center justify-center`}
        >
          <Cpu className="w-6 h-6 sm:w-10 sm:h-10 text-slate-text-muted/30 group-hover:scale-110 transition-transform duration-300" />
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="hidden sm:block absolute top-2 left-2 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest bg-white/90 text-slate-text-primary shadow-sm">
            {part.category}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart(part, 1);
            }}
            className="sm:hidden absolute top-2 left-2 p-1.5 rounded-lg bg-white/95 backdrop-blur-sm text-slate-text-secondary hover:text-cobalt shadow-sm transition-colors cursor-pointer z-10 scale-90"
            aria-label="Quick Add to Cart"
          >
            <ShoppingCart className="w-3 h-3 text-cobalt" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(part.id);
            }}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/95 backdrop-blur-sm text-slate-text-secondary hover:text-rose-500 shadow-sm transition-colors cursor-pointer z-10 scale-90 sm:scale-100"
            aria-label={saved ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${saved ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
          <div className="hidden sm:flex absolute bottom-2 right-2 text-[9px] font-bold text-slate-text-muted items-center gap-1 bg-white/70 backdrop-blur-sm px-1.5 py-0.5 rounded">
            <Download className="w-2.5 h-2.5" /> CAD Available
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1">
          <span className="hidden sm:block font-mono text-[10px] text-slate-text-muted uppercase tracking-wider leading-tight">
            {part.partNumber}
          </span>
          <h3
            className="text-[10px] sm:text-sm font-extrabold text-slate-text-primary leading-tight group-hover:text-cobalt transition-colors duration-200 line-clamp-1"
          >
            {part.title}
          </h3>
          <p className="hidden sm:block text-xs text-slate-text-muted line-clamp-2 leading-relaxed">{part.description}</p>
        </div>


      </div>

      {/* Price + Add */}
      <div className="pt-1.5 sm:pt-4 flex items-center justify-between gap-1.5 mt-1.5 sm:mt-4">
        <div>
          <span className="hidden sm:block text-[9px] uppercase tracking-wider text-slate-text-muted font-bold">Unit Price</span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-xs sm:text-base font-extrabold text-coral">₹{part.price.toFixed(2)}</span>
            <span className="text-[8px] sm:text-[10px] text-slate-text-muted font-bold">INR</span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            addToCart(part, 1);
          }}
          className="hidden sm:flex btn-cobalt text-xs font-bold px-3 py-2 rounded-lg cursor-pointer items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
    </div>
  );
}
