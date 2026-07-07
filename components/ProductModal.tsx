'use client';

import React, { useState, useEffect } from 'react';
import { X, Cpu, Download, Info, Minus, Plus, ShoppingCart, Star, CheckCircle2, ThumbsUp, MessageSquare, RotateCcw, Zap, Settings, Package, ShieldCheck } from 'lucide-react';
import { Part } from './mockData';
import { useCart } from './CartProvider';
import { getReviews, submitReview, Review } from '@/app/actions/community';

interface ProductModalProps {
  part: Part;
  onClose: () => void;
}

function StarRating({ rating, interactive = false, onChange }: { rating: number; interactive?: boolean; onChange?: (r: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 transition-colors ${
            i <= (interactive ? (hovered || rating) : rating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-[#E4E4E7]'
          } ${interactive ? 'cursor-pointer' : ''}`}
          onMouseEnter={() => interactive && setHovered(i)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onChange?.(i)}
        />
      ))}
    </div>
  );
}

export default function ProductModal({ part, onClose }: ProductModalProps) {
  const [tab, setTab] = useState<'specs' | 'pricing' | 'cad' | 'reviews'>('specs');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { addToCart, getPartPriceForQuantity, showToast, profile } = useCart();

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (tab === 'reviews') {
      setLoadingReviews(true);
      getReviews({ productId: part.id })
        .then(setReviews)
        .catch(() => setReviews([]))
        .finally(() => setLoadingReviews(false));
    }
  }, [tab, part.id]);

  // Lock body scroll when modal is active to let scrolling work on the card itself
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleAdd = () => {
    addToCart(part, quantity);
    onClose();
  };

  const handleDocumentClick = (e: React.MouseEvent, url: string | undefined, type: string) => {
    e.preventDefault();
    const isMock = !url || url === '#' || url === '' || url.includes('mechitall.io') || !url.startsWith('http');
    if (isMock) {
      showToast(`${type} is not available currently.`, 'error');
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      showToast('Please sign in to leave a review.', 'error');
      return;
    }
    if (!reviewTitle.trim() || !reviewBody.trim()) {
      showToast('Please fill in a title and review body.', 'error');
      return;
    }
    setSubmittingReview(true);
    try {
      await submitReview({
        profileId: profile.id,
        productId: part.id,
        rating: reviewRating,
        title: reviewTitle,
        body: reviewBody,
      });
      showToast('Review submitted! Thank you.', 'success');
      setShowReviewForm(false);
      setReviewTitle('');
      setReviewBody('');
      setReviewRating(5);
      // Refresh reviews
      const updated = await getReviews({ productId: part.id });
      setReviews(updated);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white border border-[#E4E4E7] rounded-2xl w-full max-w-3xl shadow-2xl relative z-10 flex flex-col md:flex-row h-[85vh] md:h-[580px] overflow-y-auto md:overflow-hidden no-scrollbar animate-slide-in">

        {/* Left — image carousel or gradient fallback */}
        {(() => {
          const images = part.imagesData && part.imagesData.length > 0 
            ? part.imagesData 
            : (part.imageData ? [part.imageData] : []);

          return images.length > 0 ? (
            <div className="md:w-5/12 bg-slate-900 relative flex flex-col justify-between overflow-hidden group p-6 shrink-0">
              {/* Background Image Carousel */}
              <div className="absolute inset-0 w-full h-full">
                <img 
                  src={images[currentImageIndex]} 
                  alt={part.title} 
                  className="w-full h-full object-cover transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
              </div>

              {/* Carousel navigation arrows */}
              {images.length > 1 && (
                <>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-[#06B6D4] transition-all text-xs font-bold z-20 cursor-pointer border-none outline-none"
                  >
                    &larr;
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-[#06B6D4] transition-all text-xs font-bold z-20 cursor-pointer border-none outline-none"
                  >
                    &rarr;
                  </button>
                </>
              )}

              {/* Category overlay */}
              <div className="z-10 flex justify-between items-start">
                <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider bg-white text-[#0F172A] shadow-sm border border-[#E4E4E7]">
                  {part.category}
                </span>
                <span className="text-[9px] text-white font-mono font-bold bg-black/40 px-2 py-0.5 rounded backdrop-blur-md border border-white/10">
                  {part.extendedSpecs?.ingressProtection || 'IP65'}
                </span>
              </div>

              {/* Bottom info Overlay & Dots */}
              <div className="z-10 space-y-3">
                {images.length > 1 && (
                  <div className="flex justify-center gap-1.5">
                    {images.map((_, idx) => (
                      <button 
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                        className={`w-1.5 h-1.5 rounded-full transition-all border-none outline-none cursor-pointer ${idx === currentImageIndex ? 'bg-[#06B6D4] w-3' : 'bg-white/40 hover:bg-white/70'}`}
                      />
                    ))}
                  </div>
                )}

                <div className="space-y-1.5 text-left">
                  <div className="text-[9px] uppercase tracking-wider text-slate-300/80 font-bold font-mono">Lifespan &amp; Thermal</div>
                  <div className="grid grid-cols-2 gap-2 text-white text-[10px] font-bold font-mono">
                    <div className="bg-black/60 p-2 rounded backdrop-blur-md border border-white/5">
                      <span className="block text-[7px] text-slate-300/60 uppercase font-bold">MTBF</span>
                      {part.extendedSpecs?.mtbf || '50,000 Hours'}
                    </div>
                    <div className="bg-black/60 p-2 rounded backdrop-blur-md border border-white/5">
                      <span className="block text-[7px] text-slate-300/60 uppercase font-bold">Oper Temp</span>
                      {part.extendedSpecs?.temperatureRange || '-20°C to 80°C'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={`md:w-5/12 bg-gradient-to-br ${part.gradientClass} p-6 flex flex-col justify-between relative overflow-hidden shrink-0`}>
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none" 
                style={{
                  backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
              <div className="z-10 flex justify-between items-start">
                <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider bg-white text-[#0F172A] shadow-sm border border-[#E4E4E7]">
                  {part.category}
                </span>
                <span className="text-[9px] text-slate-text-primary/70 font-mono font-bold bg-white/40 px-2 py-0.5 rounded backdrop-blur-md border border-white/20">
                  {part.extendedSpecs.ingressProtection}
                </span>
              </div>
              <div className="z-10 flex flex-col items-center justify-center py-6 text-center space-y-3">
                <CategoryIcon className="w-16 h-16 text-slate-text-primary/20 animate-pulse" />
                <div>
                  <span className="block font-mono text-[9px] text-slate-text-primary/60 tracking-wider font-bold">CAD SOLID LAYER</span>
                  <span className="block text-[10px] text-slate-text-primary/80 font-bold font-mono border-t border-slate-text-primary/20 pt-1 mt-0.5">{part.cadFile}</span>
                </div>
              </div>
              <div className="z-10 space-y-1.5">
                <div className="text-[9px] uppercase tracking-wider text-slate-text-primary/60 font-bold font-mono">Lifespan &amp; Thermal</div>
                <div className="grid grid-cols-2 gap-2 text-slate-text-primary text-[10px] font-bold font-mono">
                  <div className="bg-white/45 p-2 rounded backdrop-blur-md border border-white/10">
                    <span className="block text-[7px] text-slate-text-primary/60 uppercase font-bold">MTBF</span>
                    {part.extendedSpecs.mtbf}
                  </div>
                  <div className="bg-white/45 p-2 rounded backdrop-blur-md border border-white/10">
                    <span className="block text-[7px] text-slate-text-primary/60 uppercase font-bold">Oper Temp</span>
                    {part.extendedSpecs.temperatureRange}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Right — tabs + actions */}
        <div className="md:w-7/12 flex flex-col justify-between bg-white">
          <div className="p-6 pb-2 space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono font-bold text-[#76777d] tracking-wider uppercase">{part.partNumber}</span>
                <h3 className="text-base font-bold text-[#0F172A] leading-tight font-['Space_Grotesk']">{part.title}</h3>
              </div>
              <button onClick={onClose} className="p-1.5 rounded hover:bg-[#F8FAFC] border border-transparent hover:border-[#E4E4E7] text-[#76777d] hover:text-[#0F172A] transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="border-b border-[#E4E4E7] flex gap-4 text-xs font-bold overflow-x-auto no-scrollbar">
              {(['specs', 'pricing', 'cad', 'reviews'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`pb-2 border-b-2 transition-all cursor-pointer whitespace-nowrap text-xs font-mono font-bold uppercase tracking-wider ${
                    tab === t 
                      ? 'border-[#0F172A] text-[#0F172A] font-extrabold' 
                      : 'border-transparent text-[#76777d] hover:text-[#0F172A]'
                  }`}
                >
                  {t === 'specs' ? 'Specs Sheet' : t === 'pricing' ? 'Volume Pricing' : t === 'cad' ? 'CAD & Docs' : (
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" /> Reviews {reviews.length > 0 && `(${reviews.length})`}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-2 no-scrollbar">
            {tab === 'specs' && (
              <div className="space-y-4 text-xs">
                <p className="text-[#45464d] leading-relaxed font-semibold opacity-90">{part.description}</p>
                <div className="border border-[#E4E4E7] rounded overflow-hidden divide-y divide-[#E4E4E7]/60">
                  {Object.entries(part.specs).map(([key, val]) => (
                    <div key={key} className="grid grid-cols-2 p-2 bg-[#F8FAFC]/50 text-xs font-medium">
                      <span className="text-[#76777d] font-mono uppercase tracking-wider text-[10px]">{key}</span>
                      <span className="text-[#0F172A] font-semibold">{val}</span>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 p-2 bg-[#F8FAFC]/50 text-xs font-medium">
                    <span className="text-[#76777d] font-mono uppercase tracking-wider text-[10px]">Envelope Size</span>
                    <span className="text-[#0F172A] font-semibold">{part.extendedSpecs.dimensions}</span>
                  </div>
                </div>
              </div>
            )}
            {tab === 'pricing' && (
              <div className="space-y-4">
                <span className="block text-[9px] font-mono font-bold uppercase tracking-wider text-[#76777d]">Enterprise Tier Matrix</span>
                <div className="space-y-2">
                  {part.bulkPricing.map((tier, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border border-[#E4E4E7] bg-[#F8FAFC]/50 rounded">
                      <span className="text-xs font-mono font-bold text-[#0F172A]">Order {tier.minQty}{tier.maxQty ? ` to ${tier.maxQty}` : '+'} units</span>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-emerald">₹{tier.pricePerUnit.toFixed(2)}</span>
                        <span className="text-[9px] text-[#76777d] block font-mono font-bold mt-0.5">INR/unit</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-[#2563EB]/5 border border-[#2563EB]/15 p-3 rounded flex items-start gap-2 text-[10px] text-[#45464d] leading-relaxed font-semibold">
                  <Info className="w-4 h-4 text-[#2563EB] flex-shrink-0 mt-0.5" />
                  <span>Volume discounts apply automatically at checkout. Corporate Net-30 payment term invoicing option is available.</span>
                </div>
              </div>
            )}
            {tab === 'cad' && (
              <div className="space-y-4 text-xs font-medium text-[#45464d]">
                <span className="block text-[9px] font-mono font-bold uppercase tracking-wider text-[#76777d]">Technical Documents</span>
                <div className="space-y-3">
                  <a
                    href={part.datasheetUrl}
                    onClick={(e) => handleDocumentClick(e, part.datasheetUrl, 'Technical Datasheet')}
                    className="flex items-center justify-between p-3 border border-[#E4E4E7] rounded hover:border-[#06B6D4] hover:bg-[#F8FAFC] transition-all text-[#0F172A] font-mono font-bold text-xs cursor-pointer group"
                  >
                    <span className="flex items-center gap-2"><span className="px-1.5 py-0.5 rounded bg-red-100 text-coral text-[9px]">PDF</span> Technical Datasheet</span>
                    <Download className="w-3.5 h-3.5 text-[#76777d] group-hover:translate-y-0.5 transition-transform" />
                  </a>
                  <a
                    href={`#cad-${part.cadFile}`}
                    onClick={(e) => handleDocumentClick(e, part.cadFile?.startsWith('http') ? part.cadFile : undefined, '3D Solid Model File')}
                    className="flex items-center justify-between p-3 border border-[#E4E4E7] rounded hover:border-[#06B6D4] hover:bg-[#F8FAFC] transition-all text-[#0F172A] font-mono font-bold text-xs cursor-pointer group"
                  >
                    <span className="flex items-center gap-2"><span className="px-1.5 py-0.5 rounded bg-blue-100 text-cobalt text-[9px]">STEP</span> 3D Solid Model File</span>
                    <Download className="w-3.5 h-3.5 text-[#76777d] group-hover:translate-y-0.5 transition-transform" />
                  </a>
                </div>
                <div className="p-3 bg-[#F8FAFC] border border-[#E4E4E7] rounded text-[10px] leading-relaxed font-semibold">
                  <strong>Note:</strong> All CAD files comply with STEP AP203/AP214 industry standards.
                </div>
              </div>
            )}
            {tab === 'reviews' && (
              <div className="space-y-4 py-1">
                {/* Aggregate */}
                {reviews.length > 0 && (
                  <div className="flex items-center gap-4 p-3 bg-amber-50 border border-amber-200/50 rounded flex-wrap">
                    <div className="text-center">
                      <span className="block text-2xl font-extrabold text-[#0F172A]">{avgRating!.toFixed(1)}</span>
                      <div className="flex justify-center mt-0.5"><StarRating rating={Math.round(avgRating!)} /></div>
                    </div>
                    <span className="text-[10px] text-[#45464d] font-mono font-bold uppercase tracking-wider">{reviews.length} customer review{reviews.length !== 1 ? 's' : ''}</span>
                  </div>
                )}

                {/* Write review button */}
                {!showReviewForm && (
                  <button
                    onClick={() => {
                      if (!profile) { showToast('Please sign in to leave a review.', 'error'); return; }
                      setShowReviewForm(true);
                    }}
                    className="w-full border border-dashed border-cobalt/40 text-cobalt text-xs font-mono font-bold uppercase tracking-wider py-2.5 rounded hover:bg-cobalt/3 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Write a Review
                  </button>
                )}

                {/* Review form */}
                {showReviewForm && (
                  <form onSubmit={handleReviewSubmit} className="space-y-3 bg-[#F8FAFC]/50 border border-[#E4E4E7] rounded p-4 font-mono">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-bold text-[#76777d] uppercase tracking-wider">Your Rating *</span>
                      <StarRating rating={reviewRating} interactive onChange={setReviewRating} />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Review title (e.g. 'Great quality!')"
                      value={reviewTitle}
                      onChange={e => setReviewTitle(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 border border-[#E4E4E7] rounded bg-white text-[#0F172A] focus:outline-none focus:border-cobalt/40"
                    />
                    <textarea
                      required
                      rows={3}
                      placeholder="Share your experience with this product..."
                      value={reviewBody}
                      onChange={e => setReviewBody(e.target.value)}
                      className="w-full text-xs p-2.5 border border-[#E4E4E7] rounded bg-white text-[#0F172A] resize-none focus:outline-none focus:border-cobalt/40"
                    />
                    <div className="flex gap-2">
                      <button type="submit" disabled={submittingReview} className="bg-[#0f172a] hover:bg-[#06b6d4] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded cursor-pointer disabled:opacity-50 flex items-center gap-1.5 transition-colors">
                        {submittingReview ? <><RotateCcw className="w-3 h-3 animate-spin" /> Posting...</> : 'Post Review'}
                      </button>
                      <button type="button" onClick={() => setShowReviewForm(false)} className="text-xs font-bold uppercase tracking-wider px-4 py-2 rounded border border-[#E4E4E7] text-[#76777d] hover:text-[#0f172a] cursor-pointer transition-colors">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Reviews list */}
                {loadingReviews ? (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2].map(n => <div key={n} className="h-20 bg-[#F8FAFC] rounded" />)}
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-[#E4E4E7] rounded">
                    <Star className="w-7 h-7 text-[#76777d]/35 mx-auto mb-2" />
                    <p className="text-xs font-bold text-[#0F172A]">No reviews yet</p>
                    <p className="text-[10px] text-[#76777d]">Be the first to review this product!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map(review => (
                      <div key={review.id} className="bg-white border border-[#E4E4E7] rounded p-4 space-y-2" style={{ boxShadow: '0 2px 4px -1px rgba(15,23,42,0.02)' }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded bg-[#0F172A] text-white flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
                              {review.author_avatar || (review.author_name ? review.author_name.substring(0, 2).toUpperCase() : 'AN')}
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="block text-xs font-bold text-[#0F172A]">{review.author_name}</span>
                                {review.is_verified_buyer && (
                                  <span className="text-emerald shrink-0" title="Verified Buyer">
                                    <ShieldCheck className="w-3.5 h-3.5 fill-emerald/5" />
                                  </span>
                                )}
                              </div>
                              <StarRating rating={review.rating} />
                            </div>
                          </div>
                          <span className="text-[9px] text-[#76777d] font-mono font-bold shrink-0">{new Date(review.created_at).toLocaleDateString('en-IN')}</span>
                        </div>
                        <p className="text-xs font-bold text-[#0F172A]">{review.title}</p>
                        <p className="text-xs text-[#45464d] leading-relaxed font-semibold opacity-90">{review.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Add to cart footer */}
          <div className="p-6 border-t border-[#E4E4E7] bg-[#F8FAFC] flex items-center justify-between gap-4">
            <div>
              <span className="block text-[9px] font-mono uppercase tracking-wider text-[#76777d] font-bold">Total Price (INR)</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-bold font-['Space_Grotesk'] text-coral">₹{(getPartPriceForQuantity(part, quantity) * quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-[9px] font-mono text-[#76777d] font-bold">INR</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-[#E4E4E7] bg-white rounded h-9">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-2.5 text-[#76777d] hover:text-[#0f172a] cursor-pointer">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 text-xs font-mono font-bold text-[#0f172a] min-w-[20px] text-center select-none">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="px-2.5 text-[#76777d] hover:text-[#0f172a] cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <button onClick={handleAdd} className="bg-[#0F172A] hover:bg-[#06B6D4] text-white text-xs font-mono font-bold uppercase tracking-wider px-5 py-2.5 rounded cursor-pointer flex items-center gap-1.5 h-9 transition-colors shadow">
                <ShoppingCart className="w-4 h-4" /> Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
