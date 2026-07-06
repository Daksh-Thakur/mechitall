'use client';

import React, { useState, useEffect } from 'react';
import { X, Cpu, Download, Info, Minus, Plus, ShoppingCart, Star, CheckCircle2, ThumbsUp, MessageSquare, RotateCcw } from 'lucide-react';
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
              : 'text-slate-border'
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
  const { addToCart, getPartPriceForQuantity, showToast, profile } = useCart();

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-text-primary/45 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white border border-slate-border rounded-2xl w-full max-w-3xl shadow-2xl relative z-10 flex flex-col md:flex-row h-[85vh] md:h-[580px] overflow-y-auto md:overflow-hidden no-scrollbar">

        {/* Left — gradient image */}
        <div className={`md:w-5/12 bg-gradient-to-br ${part.gradientClass} p-6 flex flex-col justify-between relative`}>
          <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px] pointer-events-none" />
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
            <div className="border-b border-slate-border flex gap-4 text-xs font-bold overflow-x-auto no-scrollbar">
              {(['specs', 'pricing', 'cad', 'reviews'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`pb-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${tab === t ? 'border-cobalt text-cobalt font-extrabold' : 'border-transparent text-slate-text-muted hover:text-slate-text-secondary'}`}
                >
                  {t === 'specs' ? 'Technical Specs' : t === 'pricing' ? 'Volume Discounts' : t === 'cad' ? 'CAD & Docs' : (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" /> Reviews {reviews.length > 0 && `(${reviews.length})`}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-2 no-scrollbar">
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
            {tab === 'reviews' && (
              <div className="space-y-4 py-1">
                {/* Aggregate */}
                {reviews.length > 0 && (
                  <div className="flex items-center gap-4 p-3 bg-amber-50 border border-amber-200/50 rounded-xl">
                    <div className="text-center">
                      <span className="block text-2xl font-extrabold text-slate-text-primary">{avgRating!.toFixed(1)}</span>
                      <StarRating rating={Math.round(avgRating!)} />
                    </div>
                    <span className="text-xs text-slate-text-secondary font-semibold">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                  </div>
                )}

                {/* Write review button */}
                {!showReviewForm && (
                  <button
                    onClick={() => {
                      if (!profile) { showToast('Please sign in to leave a review.', 'error'); return; }
                      setShowReviewForm(true);
                    }}
                    className="w-full border border-dashed border-cobalt/40 text-cobalt text-xs font-bold py-2.5 rounded-xl hover:bg-cobalt/3 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Write a Review
                  </button>
                )}

                {/* Review form */}
                {showReviewForm && (
                  <form onSubmit={handleReviewSubmit} className="space-y-3 bg-slate-bg/40 border border-slate-border rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-text-secondary uppercase">Your Rating</span>
                      <StarRating rating={reviewRating} interactive onChange={setReviewRating} />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Review title (e.g. 'Great quality!')"
                      value={reviewTitle}
                      onChange={e => setReviewTitle(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 border border-slate-border rounded-lg bg-white text-slate-text-primary focus:outline-none focus:border-cobalt/40"
                    />
                    <textarea
                      required
                      rows={3}
                      placeholder="Share your experience with this product..."
                      value={reviewBody}
                      onChange={e => setReviewBody(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-border rounded-lg bg-white text-slate-text-primary resize-none focus:outline-none focus:border-cobalt/40"
                    />
                    <div className="flex gap-2">
                      <button type="submit" disabled={submittingReview} className="btn-cobalt text-xs font-bold px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-1.5">
                        {submittingReview ? <><RotateCcw className="w-3 h-3 animate-spin" /> Posting...</> : 'Post Review'}
                      </button>
                      <button type="button" onClick={() => setShowReviewForm(false)} className="text-xs font-bold px-4 py-2 rounded-lg border border-slate-border text-slate-text-muted hover:text-slate-text-primary cursor-pointer transition-colors">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Reviews list */}
                {loadingReviews ? (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2].map(n => <div key={n} className="h-20 bg-slate-bg/60 rounded-xl" />)}
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-slate-border rounded-xl">
                    <Star className="w-7 h-7 text-slate-text-muted/30 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-text-primary">No reviews yet</p>
                    <p className="text-[10px] text-slate-text-muted">Be the first to review this product!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map(review => (
                      <div key={review.id} className="bg-white border border-slate-border rounded-xl p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-cobalt text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                              {review.author_avatar || 'AN'}
                            </div>
                            <div>
                              <span className="block text-[11px] font-bold text-slate-text-primary">{review.author_name}</span>
                              <StarRating rating={review.rating} />
                            </div>
                          </div>
                          <span className="text-[9px] text-slate-text-muted font-bold shrink-0">{new Date(review.created_at).toLocaleDateString('en-IN')}</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-text-primary">{review.title}</p>
                        <p className="text-[11px] text-slate-text-secondary leading-relaxed">{review.body}</p>
                      </div>
                    ))}
                  </div>
                )}
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
