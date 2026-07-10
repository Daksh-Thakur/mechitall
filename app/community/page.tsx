'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useCart } from '../../components/CartProvider';
import {
  submitReview, submitDiscussion, getAllReviews, getDiscussions,
  getPurchasedProducts, Review, Discussion
} from '../actions/community';
import {
  Star, Megaphone, Newspaper, MessageSquare, ThumbsUp, CheckCircle2,
  Zap, Pin, Clock, ArrowRight, Users, Cpu, Package, Plus, RotateCcw,
  Send, X, ShieldCheck, Eye, SlidersHorizontal, SlidersVertical, Search
} from 'lucide-react';

const ANNOUNCEMENTS: any[] = [];
const NEWS: any[] = [];
const STATIC_REVIEWS: any[] = [];

const TABS = ['Discussions', 'Reviews', 'Announcements', 'News'] as const;
type Tab = typeof TABS[number];
const DISCUSSION_CATEGORIES = ['General', 'Build Log', 'Question', 'Showcase'] as const;

function StarRating({ rating, interactive = false, onChange }: { rating: number; interactive?: boolean; onChange?: (r: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-0.5 animate-fade-in">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 transition-colors ${
            i <= (interactive ? (hovered || rating) : rating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-slate-border text-[#d1d5db]'
          } ${interactive ? 'cursor-pointer' : ''}`}
          onMouseEnter={() => interactive && setHovered(i)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onChange?.(i)}
        />
      ))}
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  General: 'bg-cobalt/8 text-cobalt border-cobalt/15',
  'Build Log': 'bg-emerald/8 text-emerald border-emerald/15',
  Question: 'bg-amber-500/8 text-amber-600 border-amber-500/15',
  Showcase: 'bg-violet-500/8 text-violet-600 border-violet-500/15',
};

export default function CommunityPage() {
  const { profile, showToast } = useCart();
  const [activeTab, setActiveTab] = useState<Tab>('Discussions');
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());

  // Live data
  const [liveReviews, setLiveReviews] = useState<Review[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);
  const [purchasedProducts, setPurchasedProducts] = useState<any[]>([]);
  const [loadingPurchasedProducts, setLoadingPurchasedProducts] = useState(false);

  // Compose panels
  const [showReviewCompose, setShowReviewCompose] = useState(false);
  const [showDiscussionCompose, setShowDiscussionCompose] = useState(false);

  // Review compose state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewProduct, setReviewProduct] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Discussion compose state
  const [discussionTitle, setDiscussionTitle] = useState('');
  const [discussionBody, setDiscussionBody] = useState('');
  const [discussionCategory, setDiscussionCategory] = useState<typeof DISCUSSION_CATEGORIES[number]>('General');
  const [submittingDiscussion, setSubmittingDiscussion] = useState(false);

  // Filters & Search State
  const [selectedDiscussionCategory, setSelectedDiscussionCategory] = useState<string>('All');
  const [selectedRating, setSelectedRating] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'Reviews') {
      setLoadingReviews(true);
      getAllReviews()
        .then(setLiveReviews)
        .finally(() => setLoadingReviews(false));
    }
    if (activeTab === 'Discussions') {
      setLoadingDiscussions(true);
      getDiscussions()
        .then(setDiscussions)
        .finally(() => setLoadingDiscussions(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (profile?.id) {
      setLoadingPurchasedProducts(true);
      getPurchasedProducts(profile.id)
        .then(products => {
          setPurchasedProducts(products || []);
          if (products && products.length > 0) {
            setReviewProduct(products[0].id);
          } else {
            setReviewProduct('');
          }
        })
        .catch(err => {
          console.error('Failed to load purchased products:', err);
          setPurchasedProducts([]);
          setReviewProduct('');
        })
        .finally(() => setLoadingPurchasedProducts(false));
    } else {
      setPurchasedProducts([]);
      setReviewProduct('');
    }
  }, [profile?.id]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (showFilterDrawer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showFilterDrawer]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLike = (id: string) => {
    setLikedReviews(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) { showToast('Please sign in to post a review.', 'error'); return; }
    if (!reviewProduct) { showToast('Please select a product you have bought.', 'error'); return; }
    if (!reviewTitle.trim() || !reviewBody.trim()) { showToast('Please fill in all fields.', 'error'); return; }
    setSubmittingReview(true);
    try {
      await submitReview({
        profileId: profile.id,
        productId: reviewProduct,
        rating: reviewRating,
        title: reviewTitle,
        body: reviewBody
      });
      showToast('Review posted to community!', 'success');
      setShowReviewCompose(false);
      setReviewTitle(''); setReviewBody('');
      setReviewProduct(purchasedProducts.length > 0 ? purchasedProducts[0].id : '');
      setReviewRating(5);
      const updated = await getAllReviews();
      setLiveReviews(updated);
    } catch (err: any) {
      showToast(err.message || 'Failed to post review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDiscussionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) { showToast('Please sign in to post a discussion.', 'error'); return; }
    if (!discussionTitle.trim() || !discussionBody.trim()) { showToast('Please fill in all fields.', 'error'); return; }
    setSubmittingDiscussion(true);
    try {
      const newPost = await submitDiscussion({
        profileId: profile.id,
        title: discussionTitle,
        body: discussionBody,
        category: discussionCategory,
      });
      showToast('Discussion posted!', 'success');
      setShowDiscussionCompose(false);
      setDiscussionTitle(''); setDiscussionBody(''); setDiscussionCategory('General');
      setDiscussions(prev => [{ ...newPost, author_name: profile.full_name || 'You', is_verified_buyer: profile.is_verified_buyer }, ...prev]);
    } catch (err: any) {
      showToast(err.message || 'Failed to post discussion.', 'error');
    } finally {
      setSubmittingDiscussion(false);
    }
  };

  // Merge static + live reviews, dedupe by title
  const allReviews: any[] = useMemo(() => {
    return [
      ...liveReviews.map(r => ({
        id: r.id,
        author: r.author_name || 'Anonymous',
        role: 'Verified Member',
        avatar: r.author_avatar || 'AN',
        avatarColor: 'bg-cobalt',
        rating: r.rating,
        product: (r as any).product_title || 'Catalog Product',
        title: r.title,
        date: new Date(r.created_at).toLocaleDateString('en-IN'),
        body: r.body,
        verified: !!r.product_id,
        likes: 0,
        isLive: true,
        is_verified_buyer: r.is_verified_buyer,
      })),
      ...STATIC_REVIEWS.map(r => ({ ...r, isLive: false, is_verified_buyer: true })),
    ];
  }, [liveReviews]);

  // Dynamically calculate average rating and stars distribution based on database data
  const reviewStats = useMemo(() => {
    const total = allReviews.length;
    const sum = allReviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    const avg = total > 0 ? (sum / total).toFixed(1) : '0.0';
    
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>;
    allReviews.forEach(r => {
      const rating = Math.round(r.rating);
      if (rating >= 1 && rating <= 5) {
        distribution[rating as keyof typeof distribution] += 1;
      }
    });

    const percentages = {} as Record<number, number>;
    [1, 2, 3, 4, 5].forEach(star => {
      percentages[star] = total > 0 ? Math.round((distribution[star] / total) * 100) : 0;
    });

    return {
      total,
      average: avg,
      percentages,
    };
  }, [allReviews]);

  // Suggestions search logic
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    if (activeTab === 'Discussions') {
      return discussions.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.body.toLowerCase().includes(q)
      ).slice(0, 5);
    } else if (activeTab === 'Reviews') {
      return allReviews.filter(r =>
        (r.product || '').toLowerCase().includes(q) ||
        (r.body || '').toLowerCase().includes(q)
      ).slice(0, 5);
    } else if (activeTab === 'Announcements') {
      return ANNOUNCEMENTS.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.body.toLowerCase().includes(q)
      ).slice(0, 5);
    } else {
      return NEWS.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.excerpt.toLowerCase().includes(q)
      ).slice(0, 5);
    }
  }, [activeTab, discussions, allReviews, searchQuery]);

  // Filtered views
  const filteredDiscussions = useMemo(() => {
    let result = [...discussions];
    if (selectedDiscussionCategory !== 'All') {
      result = result.filter(d => d.category === selectedDiscussionCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.body.toLowerCase().includes(q)
      );
    }
    return result;
  }, [discussions, selectedDiscussionCategory, searchQuery]);

  const filteredReviews = useMemo(() => {
    let result = [...allReviews];
    if (selectedRating !== 'All') {
      if (selectedRating === '5 Stars') result = result.filter(r => r.rating === 5);
      else if (selectedRating === '4 Stars') result = result.filter(r => r.rating === 4);
      else if (selectedRating === '3 Stars & below') result = result.filter(r => r.rating <= 3);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        (r.product || '').toLowerCase().includes(q) ||
        (r.body || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [allReviews, selectedRating, searchQuery]);

  const filteredAnnouncements = useMemo(() => {
    let result = [...ANNOUNCEMENTS];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.body.toLowerCase().includes(q)
      );
    }
    return result;
  }, [searchQuery]);

  const filteredNews = useMemo(() => {
    let result = [...NEWS];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.excerpt.toLowerCase().includes(q)
      );
    }
    return result;
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1b1b1d] font-sans flex flex-col overflow-x-clip">
      <Navbar />

      {/* ─── MOBILE TOP BAR ─── */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-[#E4E4E7] flex items-center justify-between px-4 h-14">
        <h1 className="font-['Space_Grotesk'] text-base font-bold text-[#0F172A]">Community Hub</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilterDrawer(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E4E4E7] text-[11px] font-mono font-bold uppercase tracking-wider hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          >
            <SlidersVertical className="w-3.5 h-3.5" />
            Filter
          </button>
        </div>
      </div>

      <div className="flex flex-1 w-full max-w-[1280px] mx-auto">
        {/* ─── DESKTOP LEFT SIDEBAR ─── */}
        <aside className="hidden lg:flex w-64 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] border-r border-[#E4E4E7] bg-[#F8FAFC] flex-col p-6 gap-4 overflow-y-auto">
          <div className="pb-2">
            <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#0F172A]">Community</h2>
            <p className="font-['Inter'] text-xs text-[#45464d] mt-0.5 opacity-70">Interactive Portal</p>
          </div>

          {/* Primary Navigation */}
          <nav className="flex flex-col gap-0.5">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedDiscussionCategory('All'); setSelectedRating('All'); }}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-['Inter'] text-left transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-[#0F172A] text-white font-bold'
                    : 'text-[#45464d] hover:bg-[#E4E4E7]'
                }`}
              >
                <span className="text-base">
                  {tab === 'Discussions' ? '💬' : tab === 'Reviews' ? '⭐' : tab === 'Announcements' ? '📢' : '📰'}
                </span>
                {tab}
              </button>
            ))}
          </nav>

          {/* Context-Specific Sub-Filters */}
          {activeTab === 'Discussions' && (
            <div className="pt-4 border-t border-[#E4E4E7] flex flex-col gap-3">
              <label className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-wider text-[#45464d]">Discussion Type</label>
              <div className="flex flex-col gap-1">
                {['All', ...DISCUSSION_CATEGORIES].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedDiscussionCategory(cat)}
                    className={`px-3 py-1.5 rounded text-xs font-bold text-left transition-colors cursor-pointer ${
                      selectedDiscussionCategory === cat ? 'bg-cobalt/8 text-cobalt border border-cobalt/15' : 'text-[#45464d] hover:bg-[#E4E4E7]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Reviews' && (
            <div className="pt-4 border-t border-[#E4E4E7] flex flex-col gap-3">
              <label className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-wider text-[#45464d]">Filter Rating</label>
              <div className="flex flex-col gap-1">
                {['All', '5 Stars', '4 Stars', '3 Stars & below'].map(ratingOpt => (
                  <button
                    key={ratingOpt}
                    onClick={() => setSelectedRating(ratingOpt)}
                    className={`px-3 py-1.5 rounded text-xs font-bold text-left transition-colors cursor-pointer ${
                      selectedRating === ratingOpt ? 'bg-amber-500/8 text-amber-600 border border-amber-500/15' : 'text-[#45464d] hover:bg-[#E4E4E7]'
                    }`}
                  >
                    {ratingOpt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reset Filters */}
          <button
            onClick={() => { setSelectedDiscussionCategory('All'); setSelectedRating('All'); setSearchQuery(''); }}
            className="mt-auto py-2 px-4 border border-[#0F172A] text-[#0F172A] font-bold text-xs font-['Inter'] hover:bg-[#0F172A] hover:text-white transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <main className="flex-1 min-w-0 px-3 md:px-6 lg:px-8 py-4 md:py-8">

          {/* Desktop Blueprint Header Banner */}
          <div
            className="hidden md:block mb-4 border-l-4 border-[#06B6D4] px-4 py-3 bg-white/60"
            style={{
              backgroundImage: 'linear-gradient(to right, rgba(6,182,212,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(6,182,212,0.05) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          >
            <div className="flex justify-between items-center">
              <div>
                <h1 className="font-['Space_Grotesk'] text-lg font-bold text-[#0F172A]">Community Hub</h1>
                <p className="font-['Inter'] text-xs text-[#45464d] mt-0.5">
                  {activeTab === 'Discussions' ? 'Discuss projects, firmware architectures, and mechatronics logs.'
                    : activeTab === 'Reviews' ? 'Verified reviews and feedback on motors, sensors, and fabricators.'
                    : activeTab === 'Announcements' ? 'Stay updated with platform announcements and maintenance news.'
                    : 'Tutorials, case studies, and mechatronic industry news.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {activeTab === 'Discussions' && (
                  <button
                    onClick={() => {
                      if (!profile) { showToast('Please sign in to start a discussion.', 'error'); return; }
                      setShowDiscussionCompose(true);
                    }}
                    className="bg-[#0f172a] text-white hover:bg-[#06b6d4] text-[8px] font-['JetBrains_Mono'] uppercase tracking-wider py-1.5 px-3 transition-colors font-bold flex items-center gap-1 cursor-pointer shadow-md shrink-0"
                  >
                    <Plus className="w-3 h-3" /> Start Discussion
                  </button>
                )}
                {activeTab === 'Reviews' && (
                  <button
                    onClick={() => {
                      if (!profile) { showToast('Please sign in to write a review.', 'error'); return; }
                      setShowReviewCompose(true);
                    }}
                    className="bg-[#0f172a] text-white hover:bg-[#06b6d4] text-[8px] font-['JetBrains_Mono'] uppercase tracking-wider py-1.5 px-3 transition-colors font-bold flex items-center gap-1 cursor-pointer shadow-md shrink-0"
                  >
                    <Star className="w-3 h-3" /> Write Review
                  </button>
                )}
                <span className="px-2 py-1 bg-[#0F172A] text-white text-[8px] font-['JetBrains_Mono'] uppercase tracking-wider flex items-center gap-1 select-none">
                  ✓ 2,400+ Makers
                </span>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div ref={searchRef} className={`mb-4 relative ${showSuggestions && suggestions.length > 0 ? 'z-30' : 'z-10'}`}>
            <input
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={e => { if (e.key === 'Enter') { e.currentTarget.blur(); setShowSuggestions(false); } }}
              className="w-full bg-white border border-[#E4E4E7] px-10 py-3 pr-28 text-sm font-['Inter'] focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4] outline-none transition-all placeholder:text-[#76777d]"
            />
            <Search className="w-4 h-4 text-[#45464d] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setShowSuggestions(false); }} className="cursor-pointer">
                  <X className="w-3.5 h-3.5 text-[#76777d] hover:text-red-500 transition-colors" />
                </button>
              )}
              <span className="text-[10px] font-mono bg-[#F8FAFC] px-1.5 py-0.5 border border-[#E4E4E7] text-[#45464d] select-none" title="Matching items">
                {
                  activeTab === 'Discussions' ? `${filteredDiscussions.length}/${discussions.length}`
                  : activeTab === 'Reviews' ? `${filteredReviews.length}/${allReviews.length}`
                  : activeTab === 'Announcements' ? `${filteredAnnouncements.length}/${ANNOUNCEMENTS.length}`
                  : `${filteredNews.length}/${NEWS.length}`
                }
              </span>
              <span className="hidden md:block text-[10px] font-mono bg-[#F8FAFC] px-1.5 py-0.5 border border-[#E4E4E7] text-[#45464d]">Search</span>
            </div>

            {/* Suggestions Autocomplete */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-[#E4E4E7] shadow-lg overflow-hidden py-1 max-h-72 overflow-y-auto divide-y divide-[#E4E4E7]/50">
                {suggestions.map((item: any) => {
                  const title = item.title || item.product || '';
                  const subText = item.body || item.excerpt || '';
                  return (
                    <div
                      key={item.id}
                      onClick={() => { setSearchQuery(title); setShowSuggestions(false); }}
                      className="p-3 hover:bg-[#F8FAFC] flex items-center justify-between gap-3 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-[#0F172A] truncate block">{title}</span>
                        <span className="text-[10px] text-[#76777d] line-clamp-1 block mt-0.5">{subText}</span>
                      </div>
                      <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 bg-[#F8FAFC] border border-[#E4E4E7] text-[#45464d] shrink-0 font-mono">
                        {activeTab}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mobile Category pills */}
          <div className="md:hidden flex gap-1.5 mb-4 overflow-x-auto no-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedDiscussionCategory('All'); setSelectedRating('All'); }}
                className={`shrink-0 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-[#0F172A] text-white border-[#0F172A]'
                    : 'bg-white text-[#45464d] border-[#E4E4E7] hover:border-[#0F172A]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>



          {/* ==================== DISCUSSIONS TAB ==================== */}
          {activeTab === 'Discussions' && (
            <div className="space-y-4">
              {loadingDiscussions ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3].map(n => <div key={n} className="h-32 bg-white border border-[#E4E4E7]" />)}
                </div>
              ) : filteredDiscussions.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-[#E4E4E7] bg-white space-y-4">
                  <MessageSquare className="w-12 h-12 text-[#76777d]/20 mx-auto" />
                  <p className="text-sm font-bold text-[#0F172A]">No discussions found</p>
                  <p className="text-xs text-[#45464d]">Be the first to start a discussion by clicking the compose button!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredDiscussions.map(disc => (
                    <div
                      key={disc.id}
                      className="bg-white border border-[#E4E4E7] p-6 hover:border-[#06B6D4] hover:-translate-y-0.5 transition-all duration-200"
                      style={{ boxShadow: '0 4px 6px -1px rgba(15,23,42,0.04), 0 2px 4px -2px rgba(15,23,42,0.04)' }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded bg-[#0F172A] text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {(disc.author_name || 'AN').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border font-mono ${CATEGORY_COLORS[disc.category] || 'bg-cobalt/8 text-cobalt border-cobalt/15'}`}>
                              {disc.category}
                            </span>
                            <span className="text-[10px] text-slate-text-muted font-bold flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3" /> {new Date(disc.created_at).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                          <h3 className="font-['Space_Grotesk'] text-base font-semibold text-[#0F172A] leading-tight">{disc.title}</h3>
                          <p className="text-[11px] text-slate-text-muted font-semibold mt-1 flex items-center gap-1.5">
                            <span>by {disc.author_name}</span>
                            {disc.is_verified_buyer && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider font-extrabold bg-emerald/10 text-emerald border border-emerald/20 px-1.5 py-0.5 rounded scale-90" title="Verified Buyer">
                                <ShieldCheck className="w-2.5 h-2.5" /> Verified Buyer
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-text-secondary leading-relaxed mt-3 line-clamp-3">{disc.body}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== REVIEWS TAB ==================== */}
          {activeTab === 'Reviews' && (
            <div className="space-y-6">
              {/* Aggregated ratings overview */}
              <div className="bg-white border border-[#E4E4E7] p-6 flex flex-col sm:flex-row items-center gap-8"
                style={{ boxShadow: '0 4px 6px -1px rgba(15,23,42,0.04), 0 2px 4px -2px rgba(15,23,42,0.04)' }}
              >
                <div className="text-center shrink-0">
                  <span className="block text-5xl font-extrabold text-[#0F172A]">{reviewStats.average}</span>
                  <div className="flex justify-center mt-1"><StarRating rating={Math.round(Number(reviewStats.average))} /></div>
                  <span className="block text-[10px] text-slate-text-muted mt-1.5 font-bold uppercase tracking-wider">
                    {reviewStats.total} {reviewStats.total === 1 ? 'Verified Review' : 'Verified Reviews'}
                  </span>
                </div>
                <div className="flex-1 space-y-2 w-full">
                  {[5, 4, 3, 2, 1].map(star => {
                    const pct = reviewStats.percentages[star];
                    return (
                      <div key={star} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-text-muted w-4 text-right">{star}</span>
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                        <div className="flex-1 bg-[#F8FAFC] border border-[#E4E4E7]/40 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-text-muted font-bold w-8">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {loadingReviews ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                  {[1, 2, 3, 4].map(n => <div key={n} className="h-44 bg-white border border-[#E4E4E7]" />)}
                </div>
              ) : filteredReviews.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-[#E4E4E7] bg-white space-y-4">
                  <Star className="w-12 h-12 text-[#76777d]/20 mx-auto" />
                  <p className="text-sm font-bold text-[#0F172A]">No reviews found</p>
                  <p className="text-xs text-[#45464d]">No customer feedback matches the selected specifications.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredReviews.map(review => (
                    <div
                      key={review.id}
                      className={`bg-white border p-6 flex flex-col justify-between hover:border-[#06B6D4] hover:-translate-y-1 transition-all duration-200 relative ${review.isLive ? 'border-cobalt/30 bg-[#F8FAFC]' : 'border-[#E4E4E7]'}`}
                      style={{ boxShadow: '0 4px 6px -1px rgba(15,23,42,0.04), 0 2px 4px -2px rgba(15,23,42,0.04)', transition: 'transform 0.2s ease, border-color 0.2s ease' }}
                    >
                      {review.isLive && (
                        <span className="absolute top-2 right-2 text-[8px] font-black uppercase tracking-wider text-cobalt bg-cobalt/8 border border-cobalt/15 px-2 py-0.5 rounded font-mono">New</span>
                      )}
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded ${review.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                              {review.avatar}
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="block text-xs font-bold text-[#0F172A]">{review.author}</span>
                                {review.is_verified_buyer && (
                                  <span className="text-emerald shrink-0" title="Verified Buyer">
                                    <ShieldCheck className="w-3.5 h-3.5 fill-emerald/10" />
                                  </span>
                                )}
                              </div>
                              <span className="block text-[10px] text-slate-text-muted font-semibold">{review.role}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <StarRating rating={review.rating} />
                            {review.verified && (
                              <span className="text-[8px] uppercase tracking-wider font-extrabold text-emerald flex items-center gap-0.5 font-mono">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Verified Purchase
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="inline-flex items-center text-[9px] uppercase tracking-wider font-bold text-cobalt bg-cobalt/5 border border-cobalt/15 px-2 py-0.5 rounded font-mono mb-2">
                            <Cpu className="w-3 h-3 mr-1" />{review.product}
                          </span>
                          <h4 className="font-['Space_Grotesk'] text-sm font-semibold text-[#0F172A] mb-1.5 leading-snug">{review.title || 'Design Integrity & Performance'}</h4>
                          <p className="text-xs text-slate-text-secondary leading-relaxed">{review.body}</p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-border/50 mt-4 flex items-center justify-between">
                        <span className="text-[10px] text-slate-text-muted flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" /> {review.date}
                        </span>
                        <button
                          onClick={() => toggleLike(review.id)}
                          className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded border transition-all cursor-pointer ${likedReviews.has(review.id)
                            ? 'text-cobalt bg-cobalt/5 border-cobalt/25'
                            : 'text-[#45464d] border-[#E4E4E7] hover:border-cobalt/30 hover:text-cobalt'}`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          {review.likes + (likedReviews.has(review.id) ? 1 : 0)} Helpful
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== ANNOUNCEMENTS TAB ==================== */}
          {activeTab === 'Announcements' && (
            <div className="space-y-4">
              {filteredAnnouncements.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-[#E4E4E7] bg-white space-y-4">
                  <Megaphone className="w-12 h-12 text-[#76777d]/20 mx-auto" />
                  <p className="text-sm font-bold text-[#0F172A]">No announcements found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredAnnouncements.map((ann) => (
                    <div
                      key={ann.id}
                      className={`bg-white border p-6 flex flex-col justify-between hover:border-[#0F172A] transition-all relative ${ann.pinned ? 'border-l-4 border-l-[#06B6D4] border-[#E4E4E7]' : 'border-[#E4E4E7]'}`}
                      style={{ boxShadow: '0 4px 6px -1px rgba(15,23,42,0.04), 0 2px 4px -2px rgba(15,23,42,0.04)' }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          {ann.pinned && <Pin className="w-4 h-4 text-cobalt shrink-0 mt-0.5" />}
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border font-mono ${ann.tagColor}`}>{ann.tag}</span>
                              {ann.pinned && <span className="text-[9px] uppercase tracking-wider font-extrabold text-cobalt font-mono">Pinned</span>}
                            </div>
                            <h3 className="font-['Space_Grotesk'] text-base font-semibold text-[#0F172A] leading-tight">{ann.title}</h3>
                            <p className="text-xs text-slate-text-secondary leading-relaxed">{ann.body}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-text-muted font-bold shrink-0 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" /> {ann.date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== NEWS TAB ==================== */}
          {activeTab === 'News' && (
            <div className="space-y-4">
              {filteredNews.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-[#E4E4E7] bg-white space-y-4">
                  <Newspaper className="w-12 h-12 text-[#76777d]/20 mx-auto" />
                  <p className="text-sm font-bold text-[#0F172A]">No news articles found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredNews.map((article) => (
                    <div
                      key={article.id}
                      className="bg-white border border-[#E4E4E7] p-6 flex flex-col sm:flex-row gap-5 hover:border-[#06B6D4] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                      style={{ boxShadow: '0 4px 6px -1px rgba(15,23,42,0.04), 0 2px 4px -2px rgba(15,23,42,0.04)' }}
                    >
                      <div className={`w-12 h-12 rounded ${article.avatarColor} text-white flex items-center justify-center font-bold text-sm shrink-0`}>
                        {article.avatar}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border bg-cobalt/5 text-cobalt border-cobalt/20 font-mono">{article.category}</span>
                          <span className="text-[10px] text-slate-text-muted font-bold flex items-center gap-1 font-mono"><Clock className="w-3 h-3" /> {article.date}</span>
                          <span className="text-[10px] text-slate-text-muted font-bold font-mono">· {article.readTime}</span>
                        </div>
                        <h3 className="font-['Space_Grotesk'] text-base font-semibold text-[#0F172A] group-hover:text-[#06B6D4] transition-colors leading-tight">{article.title}</h3>
                        <p className="text-xs text-slate-text-secondary leading-relaxed">{article.excerpt}</p>
                      </div>
                      <div className="shrink-0 flex items-center justify-end">
                        <ArrowRight className="w-4 h-4 text-slate-text-muted group-hover:text-[#06B6D4] group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Footer />

      {/* ─── MOBILE FAB ─── */}
      <button
        onClick={() => setShowFilterDrawer(true)}
        className="md:hidden fixed bottom-6 right-5 w-14 h-14 bg-[#0F172A] text-[#06B6D4] shadow-lg flex items-center justify-center z-40 active:scale-90 transition-transform cursor-pointer"
        aria-label="Open Filters"
      >
        <SlidersVertical className="w-5 h-5" />
      </button>

      {/* ─── MOBILE FILTER DRAWER ─── */}
      {/* Backdrop */}
      <div
        onClick={() => setShowFilterDrawer(false)}
        className={`md:hidden fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${showFilterDrawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      {/* Drawer panel */}
      <aside
        className={`md:hidden fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-2xl z-[60] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${showFilterDrawer ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Drawer header */}
        <div className="p-5 border-b border-[#E4E4E7] flex justify-between items-center bg-[#F8FAFC]">
          <h2 className="font-['Space_Grotesk'] text-base font-semibold text-[#0F172A] flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            Marketplace Filters
          </h2>
          <button onClick={() => setShowFilterDrawer(false)} className="p-1.5 hover:bg-[#E4E4E7] transition-colors cursor-pointer">
            <X className="w-4 h-4 text-[#45464d]" />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Category */}
          <section>
            <h3 className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-[#45464d] mb-4">Category</h3>
            <div className="grid grid-cols-2 gap-2">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setSelectedDiscussionCategory('All'); setSelectedRating('All'); setShowFilterDrawer(false); }}
                  className={`px-3 py-2.5 border text-xs font-['JetBrains_Mono'] text-left transition-colors cursor-pointer ${
                    activeTab === tab
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'border-[#E4E4E7] hover:bg-[#F8FAFC] text-[#45464d]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </section>

          {/* Sub-Filters */}
          {activeTab === 'Discussions' && (
            <section>
              <h3 className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-[#45464d] mb-4">Discussion Type</h3>
              <div className="grid grid-cols-2 gap-2">
                {['All', ...DISCUSSION_CATEGORIES].map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setSelectedDiscussionCategory(cat); setShowFilterDrawer(false); }}
                    className={`px-3 py-2 text-left border text-xs font-bold transition-all cursor-pointer ${
                      selectedDiscussionCategory === cat
                        ? 'bg-cobalt/8 text-cobalt border-cobalt'
                        : 'border-[#E4E4E7] hover:bg-[#F8FAFC] text-[#45464d]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'Reviews' && (
            <section>
              <h3 className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-[#45464d] mb-4">Star Rating</h3>
              <div className="flex flex-col gap-1.5">
                {['All', '5 Stars', '4 Stars', '3 Stars & below'].map(ratingOpt => (
                  <button
                    key={ratingOpt}
                    onClick={() => { setSelectedRating(ratingOpt); setShowFilterDrawer(false); }}
                    className={`px-3 py-2 text-left border text-xs font-bold transition-all cursor-pointer ${
                      selectedRating === ratingOpt
                        ? 'bg-amber-500/8 text-amber-600 border-amber-500'
                        : 'border-[#E4E4E7] hover:bg-[#F8FAFC] text-[#45464d]'
                    }`}
                  >
                    {ratingOpt}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </aside>

      {/* ==========================================
          MODAL 1: START DISCUSSION
          ========================================== */}
      {showDiscussionCompose && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E4E4E7] rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-slide-in">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#0F172A] tracking-tight">Start a New Discussion</h3>
              <button
                onClick={() => setShowDiscussionCompose(false)}
                className="text-slate-text-muted hover:text-slate-text-primary cursor-pointer p-1 rounded-lg hover:bg-slate-bg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleDiscussionSubmit} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-[10px] text-slate-text-secondary uppercase mb-2">Select Category *</label>
                <div className="flex gap-2 flex-wrap">
                  {DISCUSSION_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setDiscussionCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                        discussionCategory === cat ? CATEGORY_COLORS[cat] : 'bg-slate-bg border-slate-border text-slate-text-muted hover:text-slate-text-primary'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-text-secondary uppercase">Discussion Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Discussion title..."
                  value={discussionTitle}
                  onChange={e => setDiscussionTitle(e.target.value)}
                  className="w-full text-sm font-semibold p-3 border border-[#E4E4E7] rounded-xl bg-[#F8FAFC] text-slate-text-primary focus:outline-none focus:border-cobalt/40 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-text-secondary uppercase">Detailed description *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share your thoughts, build logs, questions, or showcase your work..."
                  value={discussionBody}
                  onChange={e => setDiscussionBody(e.target.value)}
                  className="w-full text-sm p-3 border border-[#E4E4E7] rounded-xl bg-[#F8FAFC] text-slate-text-primary resize-none focus:outline-none focus:border-cobalt/40 transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submittingDiscussion} className="flex-1 btn-cobalt text-xs font-bold py-3 rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                  {submittingDiscussion ? <><RotateCcw className="w-3.5 h-3.5 animate-spin" /> Posting...</> : <><Send className="w-3.5 h-3.5" /> Post Discussion</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: WRITE REVIEW
          ========================================== */}
      {showReviewCompose && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E4E4E7] rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-slide-in">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#0F172A] tracking-tight">Write a Community Review</h3>
              <button
                onClick={() => setShowReviewCompose(false)}
                className="text-slate-text-muted hover:text-slate-text-primary cursor-pointer p-1 rounded-lg hover:bg-slate-bg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs font-bold">
              <div className="flex items-center justify-between bg-[#F8FAFC] border border-[#E4E4E7] p-3.5 rounded-xl">
                <span className="text-[10px] font-bold text-slate-text-secondary uppercase">Product Rating *</span>
                <StarRating rating={reviewRating} interactive onChange={setReviewRating} />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-text-secondary uppercase">Select Purchased Product *</label>
                {loadingPurchasedProducts ? (
                  <div className="w-full text-xs font-mono p-3 border border-[#E4E4E7] rounded-xl bg-[#F8FAFC] text-slate-text-muted animate-pulse">
                    Loading your purchase history...
                  </div>
                ) : purchasedProducts.length === 0 ? (
                  <div className="space-y-2">
                    <div className="w-full text-xs p-3.5 border border-red-200 rounded-xl bg-red-50 text-red-700 font-semibold leading-relaxed">
                      ⚠️ You have not purchased any mechatronics products yet. Our anti-fake-review policy requires you to select a product from your order history.
                    </div>
                    <p className="text-[10px] text-slate-text-muted italic font-normal">
                      Please visit the Marketplace, make a purchase, and then come back to review it!
                    </p>
                  </div>
                ) : (
                  <select
                    required
                    value={reviewProduct}
                    onChange={e => setReviewProduct(e.target.value)}
                    className="w-full text-sm p-3 border border-[#E4E4E7] rounded-xl bg-[#F8FAFC] text-slate-text-primary focus:outline-none focus:border-cobalt/40 font-semibold cursor-pointer"
                  >
                    <option value="" disabled>-- Select a purchased product --</option>
                    {purchasedProducts.map((prod: any) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.title} ({prod.part_number})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-text-secondary uppercase">Review Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="Review title (e.g. 'Excellent build quality!')"
                  value={reviewTitle}
                  onChange={e => setReviewTitle(e.target.value)}
                  className="w-full text-sm font-semibold p-3 border border-[#E4E4E7] rounded-xl bg-[#F8FAFC] text-slate-text-primary focus:outline-none focus:border-cobalt/40"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-text-secondary uppercase">Detailed Experience *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share your detailed experience..."
                  value={reviewBody}
                  onChange={e => setReviewBody(e.target.value)}
                  className="w-full text-sm p-3 border border-[#E4E4E7] rounded-xl bg-[#F8FAFC] text-slate-text-primary resize-none focus:outline-none focus:border-cobalt/40"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submittingReview || purchasedProducts.length === 0}
                  className="flex-1 btn-cobalt text-xs font-bold py-3 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingReview ? <><RotateCcw className="w-3.5 h-3.5 animate-spin" /> Posting...</> : <><Send className="w-3.5 h-3.5" /> Post Review</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
