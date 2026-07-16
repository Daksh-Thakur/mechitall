'use client';
 
import React from 'react';
import { Heart, ShoppingCart, Eye, Cpu, Zap, Settings, Package } from 'lucide-react';
import { Part } from './mockData';
import { useCart } from './CartProvider';
 
interface ProductCardProps {
  part: Part;
  onViewDetails: (part: Part) => void;
}
 
function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) return (
    <span className="bg-red-500 text-white text-[8px] font-mono px-1 py-0.5 uppercase tracking-wider font-bold">
      OUT
    </span>
  );
  if (stock < 10) return (
    <span className="bg-amber-400 text-amber-900 text-[8px] font-mono px-1 py-0.5 uppercase tracking-wider font-bold">
      LOW
    </span>
  );
  return (
    <span className="bg-[#10B981] text-white text-[8px] font-mono px-1 py-0.5 uppercase tracking-wider font-bold">
      STOCK
    </span>
  );
}
 
export default function ProductCard({ part, onViewDetails }: ProductCardProps) {
  const { addToCart, toggleWishlist, isWishlisted } = useCart();
  const saved = isWishlisted(part.id);
 
  // Determine category-specific icon
  const getCategoryIcon = () => {
    const cat = part.category.toLowerCase();
    if (cat.includes('actuator') || cat.includes('motor') || cat.includes('drive')) {
      return Settings;
    }
    if (cat.includes('sensor') || cat.includes('imu')) {
      return Zap;
    }
    if (cat.includes('controller') || cat.includes('board') || cat.includes('esp')) {
      return Cpu;
    }
    return Package;
  };
 
  const CategoryIcon = getCategoryIcon();
 
  return (
    <div
      onClick={() => onViewDetails(part)}
      className="flex flex-col bg-zinc-800 border border-zinc-700/60 overflow-hidden cursor-pointer group transition-all duration-200 hover:border-emerald-400/40"
      style={{
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -2px rgba(0,0,0,0.2)',
        transition: 'transform 0.2s ease, border-color 0.2s ease'
      }}
      onMouseEnter={e => {
        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
          e.currentTarget.style.transform = 'translateY(-4px)';
        }
      }}
      onMouseLeave={e => {
        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {/* Image / Icon container */}
      <div className="h-32 md:h-36 bg-zinc-900/50 overflow-hidden relative border-b border-zinc-700/60 flex items-center justify-center shrink-0">
        {part.imageData ? (
          <img src={part.imageData} alt={part.title} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${part.gradientClass} flex items-center justify-center`}>
            <CategoryIcon className="w-8 h-8 text-white opacity-20 group-hover:rotate-12 group-hover:scale-105 transition-all duration-500" />
          </div>
        )}
        {/* Category Badge */}
        <div className="absolute top-1.5 left-1.5">
          <span className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-[7px] md:text-[8px] font-mono px-1 py-0.5 uppercase tracking-wider font-bold">
            {part.category.slice(0, 12)}
          </span>
        </div>
        {/* Stock badge */}
        <div className="absolute top-1.5 right-1.5">
          <StockBadge stock={part.stock} />
        </div>
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-zinc-950/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="bg-zinc-900 text-white text-[8px] font-mono font-bold uppercase tracking-wider py-1 px-2 shadow border border-zinc-700 flex items-center gap-1">
            <Eye className="w-3 h-3 text-emerald-400" /> View Details
          </span>
        </div>
      </div>
 
      {/* Body */}
      <div className="p-3 flex flex-col flex-1">
        <div className="flex flex-col mb-1.5">
          <h3 className="font-['Space_Grotesk'] text-[11px] md:text-xs font-semibold text-zinc-100 leading-tight group-hover:text-emerald-400 transition-colors line-clamp-2 flex-1">
            {part.title}
          </h3>
          <p className="text-[9px] text-zinc-400 mt-0.5 font-semibold">by {part.sellerName || 'MechItAll Official'}</p>
        </div>
        <div className="flex items-center gap-1 mb-2.5">
          <span className="font-['JetBrains_Mono'] text-[7px] text-zinc-500 uppercase tracking-wider font-bold">SKU:</span>
          <span className="font-['JetBrains_Mono'] text-[8px] font-bold text-emerald-400 truncate max-w-[120px]">
            {part.partNumber}
          </span>
        </div>
 
        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-700/60 mt-auto">
          <div>
            <p className="text-[7px] font-['Inter'] text-zinc-500 uppercase tracking-wider mb-0.5">Price</p>
            <p className="font-mono text-xs md:text-sm font-bold text-white">
              ₹{part.price.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={e => { e.stopPropagation(); toggleWishlist(part.id); }}
              className="p-1.5 border border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer"
              title={saved ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart className={`w-3 h-3 ${saved ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'}`} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); addToCart(part, 1); }}
              className="p-1.5 bg-emerald-400 text-zinc-950 hover:bg-emerald-350 transition-colors flex items-center justify-center cursor-pointer"
              title="Add to Cart"
            >
              <ShoppingCart className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
