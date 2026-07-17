'use client';

import React, { useState, useEffect } from 'react';
import { X, Wrench, Clock, Check, ShieldCheck, Star, MessageSquare, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useCart } from './CartProvider';
import { getReviews, submitReview, Review } from '@/app/actions/community';

interface ServiceModalProps {
  service: {
    id: string;
    title: string;
    category: string;
    description: string;
    base_price: number;
    lead_time: string;
    features: any;
    gradient_class?: string;
    image_data?: string;
    images_data?: string[];
  };
  onClose: () => void;
}

import StarRating from './StarRating';
import ImageCarousel from './ImageCarousel';



export default function ServiceModal({ service, onClose }: ServiceModalProps) {
  const { profile, showToast } = useCart();
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const featuresList: string[] = Array.isArray(service.features)
    ? service.features
    : typeof service.features === 'string'
    ? JSON.parse(service.features || '[]')
    : [];

  useEffect(() => {
    if (activeTab === 'reviews') {
      setLoadingReviews(true);
      getReviews({ serviceId: service.id })
        .then(setReviews)
        .catch(() => setReviews([]))
        .finally(() => setLoadingReviews(false));
    }
  }, [activeTab, service.id]);

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
        serviceId: service.id,
        rating: reviewRating,
        title: reviewTitle,
        body: reviewBody,
      });
      showToast('Review submitted! Thank you.', 'success');
      setShowReviewForm(false);
      setReviewTitle('');
      setReviewBody('');
      setReviewRating(5);
      const updated = await getReviews({ serviceId: service.id });
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
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-text-primary/45 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="bg-white border border-zinc-700/60 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row h-[520px]">
        
        {/* Left pane - Gradient visual */}
        {/* Left pane - Carousel or Gradient visual */}
        {(() => {
          const images = service.images_data && service.images_data.length > 0 
            ? service.images_data 
            : (service.image_data ? [service.image_data] : []);

          return images.length > 0 ? (
            <div className="md:w-5/12 bg-slate-900 relative flex flex-col justify-between overflow-hidden group p-6 shrink-0 text-left">
              {/* Background Image Carousel */}
              <ImageCarousel 
                images={images} 
                title={service.title} 
                currentImageIndex={currentImageIndex} 
                setCurrentImageIndex={setCurrentImageIndex} 
              />

              {/* Category overlay */}
              <div className="z-10 flex justify-between items-start">
                <span className="px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest bg-white/95 text-white shadow-sm border border-zinc-700/60/50">
                  {service.category}
                </span>
              </div>

              {/* Bottom info Overlay & Dots */}
              <div className="z-10 space-y-3 text-left">
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

                {avgRating !== null && (
                  <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 backdrop-blur-md w-fit">
                    <span className="text-sm font-extrabold text-white">{avgRating.toFixed(1)}</span>
                    <StarRating rating={Math.round(avgRating)} />
                    <span className="text-[8px] text-slate-300 font-bold">({reviews.length})</span>
                  </div>
                )}

                <div className="bg-black/60 border border-white/10 p-3 rounded-lg backdrop-blur-md text-[10px] font-bold text-white flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>Verified quality and manufacturing capabilities.</span>
                </div>
              </div>
            </div>
          ) : (
            <div className={`md:w-5/12 bg-gradient-to-br ${service.gradient_class || 'from-cobalt/20 to-cobalt/5'} p-6 flex flex-col justify-between relative shrink-0`}>
              <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px] pointer-events-none" />
              <div className="z-10 flex justify-between items-start">
                <span className="px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest bg-white/90 text-white shadow-sm border border-zinc-700/60/50">
                  {service.category}
                </span>
              </div>
              
              <div className="z-10 flex flex-col items-center justify-center py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-white/40 flex items-center justify-center backdrop-blur-md border border-white/40">
                  <Wrench className="w-7 h-7 text-white/80 animate-pulse" />
                </div>
                <div>
                  <span className="block font-mono text-[9px] text-white/60 tracking-wider font-extrabold">MANUFACTURING FLOW</span>
                  <span className="block text-[10px] text-white/80 font-bold font-mono border-t border-slate-text-primary/20 pt-1">
                    {service.lead_time}
                  </span>
                </div>
                {avgRating !== null && (
                  <div className="flex flex-col items-center gap-1 bg-white/40 rounded-xl px-4 py-2 backdrop-blur-md">
                    <span className="text-lg font-extrabold text-white">{avgRating.toFixed(1)}</span>
                    <StarRating rating={Math.round(avgRating)} />
                    <span className="text-[9px] text-white/60 font-bold">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              
              <div className="z-10 bg-white/40 border border-white/20 p-3 rounded-lg backdrop-blur-md text-[10px] font-bold text-white flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Verified quality and manufacturing capabilities.</span>
              </div>
            </div>
          );
        })()}

        {/* Right pane */}
        <div className="md:w-7/12 flex flex-col justify-between bg-white">
          <div className="p-6 pb-0 space-y-3">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-[9px] font-mono font-bold text-zinc-400 tracking-wider uppercase">SERVICE DETAILS</span>
                <h3 className="text-lg font-extrabold text-white leading-tight mt-0.5">{service.title}</h3>
              </div>
              <button 
                onClick={onClose} 
                className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-zinc-700/60 text-xs font-bold">
              {(['details', 'reviews'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`pb-2 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === t ? 'border-cobalt text-cobalt' : 'border-transparent text-zinc-400 hover:text-slate-text-secondary'}`}
                >
                  {t === 'reviews' ? <><Star className="w-3 h-3" /> Reviews {reviews.length > 0 && `(${reviews.length})`}</> : 'Details'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-3">
            {activeTab === 'details' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-text-secondary leading-relaxed font-semibold">
                  {service.description}
                </p>
                {featuresList.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-extrabold text-zinc-400 uppercase tracking-wider block">CAPABILITIES INCLUDED</span>
                    <ul className="space-y-2">
                      {featuresList.map((feat, idx) => (
                        <li key={idx} className="flex gap-2 text-[11px] font-bold text-slate-text-secondary">
                          <Check className="w-3.5 h-3.5 text-emerald shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-3">
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

                {showReviewForm && (
                  <form onSubmit={handleReviewSubmit} className="space-y-3 bg-zinc-900/40 border border-zinc-700/60 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-text-secondary uppercase">Your Rating</span>
                      <StarRating rating={reviewRating} interactive onChange={setReviewRating} />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Review title..."
                      value={reviewTitle}
                      onChange={e => setReviewTitle(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 border border-zinc-700/60 rounded-lg bg-white text-white focus:outline-none focus:border-cobalt/40"
                    />
                    <textarea
                      required
                      rows={3}
                      placeholder="Share your experience with this service..."
                      value={reviewBody}
                      onChange={e => setReviewBody(e.target.value)}
                      className="w-full text-xs p-2.5 border border-zinc-700/60 rounded-lg bg-white text-white resize-none focus:outline-none focus:border-cobalt/40"
                    />
                    <div className="flex gap-2">
                      <button type="submit" disabled={submittingReview} className="btn-cobalt text-xs font-bold px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-1.5">
                        {submittingReview ? <><RotateCcw className="w-3 h-3 animate-spin" /> Posting...</> : 'Post Review'}
                      </button>
                      <button type="button" onClick={() => setShowReviewForm(false)} className="text-xs font-bold px-4 py-2 rounded-lg border border-zinc-700/60 text-zinc-400 cursor-pointer">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {loadingReviews ? (
                  <div className="space-y-2 animate-pulse">
                    {[1, 2].map(n => <div key={n} className="h-16 bg-zinc-900/60 rounded-xl" />)}
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-zinc-700/60 rounded-xl">
                    <Star className="w-6 h-6 text-zinc-400/30 mx-auto mb-2" />
                    <p className="text-xs font-bold text-white">No reviews yet</p>
                    <p className="text-[10px] text-zinc-400">Be the first to review this service!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map(review => (
                      <div key={review.id} className="bg-white border border-zinc-700/60 rounded-xl p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-cobalt text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                              {review.author_avatar || 'AN'}
                            </div>
                            <div>
                              <span className="block text-[11px] font-bold text-white">{review.author_name}</span>
                              <StarRating rating={review.rating} />
                            </div>
                          </div>
                          <span className="text-[9px] text-zinc-400 font-bold shrink-0">{new Date(review.created_at).toLocaleDateString('en-IN')}</span>
                        </div>
                        <p className="text-[11px] font-bold text-white">{review.title}</p>
                        <p className="text-[11px] text-slate-text-secondary leading-relaxed">{review.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-zinc-700/60 p-6 flex items-center justify-between gap-4">
            <div>
              <span className="block text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Estimated Cost</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-extrabold text-coral">₹{Number(service.base_price).toFixed(2)}</span>
                <span className="text-[10px] text-zinc-400 font-bold">Base</span>
              </div>
            </div>
            
            <Link
              href="/machining"
              onClick={onClose}
              className="btn-emerald text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
            >
              Get Quote <Clock className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
