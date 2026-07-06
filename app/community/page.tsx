'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useCart } from '../../components/CartProvider';
import {
  submitReview, submitDiscussion, getAllReviews, getDiscussions,
  Review, Discussion
} from '../actions/community';
import {
  Star, Megaphone, Newspaper, MessageSquare, ThumbsUp, CheckCircle2,
  Zap, Pin, Clock, ArrowRight, Users, Cpu, Package, Plus, RotateCcw,
  Send, X, ShieldCheck
} from 'lucide-react';

const ANNOUNCEMENTS = [
  {
    id: 1,
    title: '🎉 New: 5-Axis CNC Milling Now Available',
    body: 'We\'ve just commissioned two new 5-axis CNC mills, enabling high-precision complex parts with ±0.005mm tolerances. Request a quote today.',
    date: '2026-07-04',
    tag: 'New Service',
    tagColor: 'text-cobalt bg-cobalt/10 border-cobalt/20',
    pinned: true,
  },
  {
    id: 2,
    title: 'Price Drop: Aluminum 6061 Parts — Up to 18% Off',
    body: 'We\'ve locked in new raw material contracts, passing savings directly to customers. All Al6061 machined parts are now 18% cheaper.',
    date: '2026-07-01',
    tag: 'Pricing Update',
    tagColor: 'text-emerald bg-emerald/10 border-emerald/20',
    pinned: false,
  },
  {
    id: 3,
    title: 'Scheduled Maintenance — July 10, 2026 (2:00–4:00 AM IST)',
    body: 'The platform will undergo database maintenance. Orders placed before 11:00 PM IST on July 9 will be unaffected.',
    date: '2026-06-28',
    tag: 'Maintenance',
    tagColor: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
    pinned: false,
  },
];

const NEWS = [
  {
    id: 1,
    title: 'MechItAll Partners with ISRO Supplier Network',
    excerpt: 'We\'re excited to announce a strategic partnership with ISRO\'s supplier network to provide certified space-grade mechatronics components.',
    date: '2026-07-03',
    category: 'Partnership',
    readTime: '3 min read',
    avatar: 'IS',
    avatarColor: 'bg-cobalt',
  },
  {
    id: 2,
    title: 'Tutorial: Designing Enclosures for High-IP-Rated Sensors',
    excerpt: 'A deep dive into IP67 and IP68 enclosure design considerations — materials, seals, gasket specs, and tooling considerations for small batches.',
    date: '2026-07-01',
    category: 'Tutorial',
    readTime: '8 min read',
    avatar: 'DK',
    avatarColor: 'bg-emerald',
  },
  {
    id: 3,
    title: 'Case Study: 3D-Printed Titanium Bracket for EV Drivetrain',
    excerpt: 'How a startup reduced their drivetrain bracket weight by 42% and lead time by 60% using SLS printing on Ti-6Al-4V powder.',
    date: '2026-06-28',
    category: 'Case Study',
    readTime: '5 min read',
    avatar: 'AM',
    avatarColor: 'bg-coral',
  },
  {
    id: 4,
    title: 'RoHS Compliance Update: New Batch Certifications',
    excerpt: 'All actuator and sensor product lines now ship with updated RoHS 3.0 compliance documentation. Download from product pages.',
    date: '2026-06-25',
    category: 'Compliance',
    readTime: '2 min read',
    avatar: 'RC',
    avatarColor: 'bg-amber-500',
  },
];

const STATIC_REVIEWS = [
  {
    id: 's1',
    author: 'Arjun Sharma',
    role: 'Lead Mechanical Engineer · Bengaluru',
    avatar: 'AS',
    avatarColor: 'bg-cobalt',
    rating: 5,
    product: 'Linear Servo Actuator 12V',
    date: '2026-07-02',
    body: 'Exceptional quality. The servo actuator arrived in perfect packaging, all specs match the datasheet exactly. Repeatability is outstanding for the price point.',
    verified: true,
    likes: 24,
  },
  {
    id: 's2',
    author: 'Priya Mehta',
    role: 'Robotics Researcher · IIT Bombay',
    avatar: 'PM',
    avatarColor: 'bg-emerald',
    rating: 5,
    product: 'CNC Milling (3-Axis) — Custom Bracket',
    date: '2026-06-30',
    body: 'Uploaded my STEP file at 11pm, had a quote in seconds. Part arrived in 3 days with surface finish exactly as specified. Impressive workflow!',
    verified: true,
    likes: 18,
  },
  {
    id: 's3',
    author: 'Kiran Patel',
    role: 'Maker & Hobbyist · Pune',
    avatar: 'KP',
    avatarColor: 'bg-amber-500',
    rating: 4,
    product: 'IMU 9-DOF Motion Sensor',
    date: '2026-06-26',
    body: 'Great sensor, responsive support team. Delivery was a day later than estimated but the team proactively emailed me.',
    verified: true,
    likes: 11,
  },
];

const TABS = ['Discussions', 'Reviews', 'Announcements', 'News'] as const;
type Tab = typeof TABS[number];
const DISCUSSION_CATEGORIES = ['General', 'Build Log', 'Question', 'Showcase'] as const;

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
    if (!reviewTitle.trim() || !reviewBody.trim()) { showToast('Please fill in all fields.', 'error'); return; }
    setSubmittingReview(true);
    try {
      await submitReview({ profileId: profile.id, rating: reviewRating, title: reviewTitle, body: reviewBody });
      showToast('Review posted to community!', 'success');
      setShowReviewCompose(false);
      setReviewTitle(''); setReviewBody(''); setReviewProduct(''); setReviewRating(5);
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
  const allReviews: any[] = [
    ...liveReviews.map(r => ({
      id: r.id,
      author: r.author_name || 'Anonymous',
      role: 'Verified Member',
      avatar: r.author_avatar || 'AN',
      avatarColor: 'bg-cobalt',
      rating: r.rating,
      product: r.title,
      date: new Date(r.created_at).toLocaleDateString('en-IN'),
      body: r.body,
      verified: true,
      likes: 0,
      isLive: true,
      is_verified_buyer: r.is_verified_buyer,
    })),
    ...STATIC_REVIEWS.map(r => ({ ...r, isLive: false })),
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-text-primary to-slate-text-secondary text-white border-b border-slate-text-muted/20">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold mb-4">
            <Users className="w-3.5 h-3.5" /> MechItAll Community
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Discuss, Review &<br />
            <span className="text-cobalt">Connect with Makers</span>
          </h1>
          <p className="text-sm text-white/70 mt-3 max-w-xl leading-relaxed">
            Start discussions, share your builds, post product reviews, and stay up to date with platform announcements.
          </p>

          {/* Community stats */}
          <div className="flex flex-wrap gap-8 mt-8 pt-8 border-t border-white/10">
            {[
              { icon: Users, value: '2,400+', label: 'Community Members' },
              { icon: Star, value: '1,800+', label: 'Verified Reviews' },
              { icon: MessageSquare, value: '340+', label: 'Discussions' },
              { icon: Package, value: '50+', label: 'Case Studies' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white/80" />
                </div>
                <div>
                  <span className="block text-lg font-extrabold">{value}</span>
                  <span className="block text-[10px] text-white/60 font-bold uppercase tracking-wider">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10 flex-1 space-y-8">
        {/* Tabs + Compose Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-white border border-slate-border p-1.5 rounded-xl shadow-sm flex-wrap">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === tab
                  ? 'bg-slate-text-primary text-white shadow-sm'
                  : 'text-slate-text-secondary hover:text-slate-text-primary hover:bg-slate-bg'}`}
              >
                {tab === 'Discussions' && <MessageSquare className="w-3.5 h-3.5" />}
                {tab === 'Reviews' && <Star className="w-3.5 h-3.5" />}
                {tab === 'Announcements' && <Megaphone className="w-3.5 h-3.5" />}
                {tab === 'News' && <Newspaper className="w-3.5 h-3.5" />}
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Discussions' && (
            <button
              onClick={() => {
                if (!profile) { showToast('Please sign in to start a discussion.', 'error'); return; }
                setShowDiscussionCompose(true);
              }}
              className="btn-cobalt px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Start Discussion
            </button>
          )}
          {activeTab === 'Reviews' && (
            <button
              onClick={() => {
                if (!profile) { showToast('Please sign in to post a review.', 'error'); return; }
                setShowReviewCompose(true);
              }}
              className="btn-cobalt px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shrink-0"
            >
              <Star className="w-3.5 h-3.5" /> Write a Review
            </button>
          )}
        </div>

        {/* ==================== DISCUSSIONS TAB ==================== */}
        {activeTab === 'Discussions' && (
          <div className="space-y-5">
            {/* Compose Panel */}
            {showDiscussionCompose && (
              <div className="bg-white border border-cobalt/20 rounded-2xl p-6 shadow-md space-y-4 animate-slide-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-text-primary">Start a New Discussion</h3>
                  <button onClick={() => setShowDiscussionCompose(false)} className="text-slate-text-muted hover:text-slate-text-primary cursor-pointer transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleDiscussionSubmit} className="space-y-4">
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
                  <input
                    type="text"
                    required
                    placeholder="Discussion title..."
                    value={discussionTitle}
                    onChange={e => setDiscussionTitle(e.target.value)}
                    className="w-full text-sm font-bold p-3 border border-slate-border rounded-xl bg-slate-bg/30 text-slate-text-primary focus:outline-none focus:border-cobalt/40 transition-colors"
                  />
                  <textarea
                    required
                    rows={4}
                    placeholder="Share your thoughts, build logs, questions, or showcase your work..."
                    value={discussionBody}
                    onChange={e => setDiscussionBody(e.target.value)}
                    className="w-full text-sm p-3 border border-slate-border rounded-xl bg-slate-bg/30 text-slate-text-primary resize-none focus:outline-none focus:border-cobalt/40 transition-colors"
                  />
                  <div className="flex gap-3">
                    <button type="submit" disabled={submittingDiscussion} className="btn-cobalt text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-2">
                      {submittingDiscussion ? <><RotateCcw className="w-3.5 h-3.5 animate-spin" /> Posting...</> : <><Send className="w-3.5 h-3.5" /> Post Discussion</>}
                    </button>
                    <button type="button" onClick={() => setShowDiscussionCompose(false)} className="text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-border text-slate-text-muted hover:text-slate-text-primary cursor-pointer transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loadingDiscussions ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map(n => <div key={n} className="h-28 bg-white border border-slate-border rounded-2xl" />)}
              </div>
            ) : discussions.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-border bg-white rounded-2xl space-y-3">
                <MessageSquare className="w-10 h-10 text-slate-text-muted/20 mx-auto" />
                <p className="text-sm font-bold text-slate-text-primary">No discussions yet</p>
                <p className="text-xs text-slate-text-muted">Be the first to start a conversation!</p>
                <button
                  onClick={() => { if (!profile) { showToast('Please sign in.', 'error'); return; } setShowDiscussionCompose(true); }}
                  className="btn-cobalt text-xs font-bold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Start Discussion
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {discussions.map(disc => (
                  <div key={disc.id} className="bg-white border border-slate-border rounded-2xl p-5 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-cobalt text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {(disc.author_name || 'AN').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${CATEGORY_COLORS[disc.category] || 'bg-cobalt/8 text-cobalt border-cobalt/15'}`}>
                            {disc.category}
                          </span>
                          <span className="text-[10px] text-slate-text-muted font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(disc.created_at).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-slate-text-primary leading-tight">{disc.title}</h3>
                        <p className="text-[11px] text-slate-text-muted font-semibold mt-0.5 flex items-center gap-1.5">
                          <span>by {disc.author_name}</span>
                          {disc.is_verified_buyer && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider font-extrabold bg-emerald/10 text-emerald border border-emerald/20 px-1 py-0.5 rounded scale-90" title="Verified Buyer">
                              <ShieldCheck className="w-2.5 h-2.5" /> Verified
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-text-secondary leading-relaxed mt-2 line-clamp-3">{disc.body}</p>
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
            {/* Compose Panel */}
            {showReviewCompose && (
              <div className="bg-white border border-cobalt/20 rounded-2xl p-6 shadow-md space-y-4 animate-slide-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-text-primary">Write a Community Review</h3>
                  <button onClick={() => setShowReviewCompose(false)} className="text-slate-text-muted hover:text-slate-text-primary cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-slate-text-secondary uppercase">Rating</span>
                    <StarRating rating={reviewRating} interactive onChange={setReviewRating} />
                  </div>
                  <input
                    type="text"
                    placeholder="Product or service name (optional)"
                    value={reviewProduct}
                    onChange={e => setReviewProduct(e.target.value)}
                    className="w-full text-sm p-3 border border-slate-border rounded-xl bg-slate-bg/30 text-slate-text-primary focus:outline-none focus:border-cobalt/40"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Review title (e.g. 'Excellent build quality!')"
                    value={reviewTitle}
                    onChange={e => setReviewTitle(e.target.value)}
                    className="w-full text-sm font-bold p-3 border border-slate-border rounded-xl bg-slate-bg/30 text-slate-text-primary focus:outline-none focus:border-cobalt/40"
                  />
                  <textarea
                    required
                    rows={4}
                    placeholder="Share your detailed experience..."
                    value={reviewBody}
                    onChange={e => setReviewBody(e.target.value)}
                    className="w-full text-sm p-3 border border-slate-border rounded-xl bg-slate-bg/30 text-slate-text-primary resize-none focus:outline-none focus:border-cobalt/40"
                  />
                  <div className="flex gap-3">
                    <button type="submit" disabled={submittingReview} className="btn-cobalt text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-2">
                      {submittingReview ? <><RotateCcw className="w-3.5 h-3.5 animate-spin" /> Posting...</> : <><Send className="w-3.5 h-3.5" /> Post Review</>}
                    </button>
                    <button type="button" onClick={() => setShowReviewCompose(false)} className="text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-border text-slate-text-muted cursor-pointer">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Aggregate rating */}
            <div className="bg-white border border-slate-border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6">
              <div className="text-center shrink-0">
                <span className="block text-5xl font-extrabold text-slate-text-primary">4.8</span>
                <StarRating rating={5} />
                <span className="block text-[10px] text-slate-text-muted mt-1 font-bold">Based on 1,800+ reviews</span>
              </div>
              <div className="flex-1 space-y-2 w-full">
                {[5, 4, 3, 2, 1].map(star => {
                  const pct = star === 5 ? 78 : star === 4 ? 16 : star === 3 ? 4 : star === 2 ? 1 : 1;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-text-muted w-4 text-right">{star}</span>
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                      <div className="flex-1 bg-slate-bg rounded-full h-2 overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-text-muted font-bold w-8">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {loadingReviews ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                {[1, 2, 3, 4].map(n => <div key={n} className="h-44 bg-white border border-slate-border rounded-2xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {allReviews.map(review => (
                  <div key={review.id} className={`bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${review.isLive ? 'border-cobalt/20' : 'border-slate-border'}`}>
                    {review.isLive && (
                      <span className="inline-block text-[8px] font-black uppercase tracking-wider text-cobalt bg-cobalt/8 border border-cobalt/15 px-2 py-0.5 rounded-full mb-3 w-fit">New</span>
                    )}
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${review.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                            {review.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="block text-xs font-bold text-slate-text-primary">{review.author}</span>
                              {review.is_verified_buyer && (
                                <span className="text-emerald shrink-0" title="Verified Buyer">
                                  <ShieldCheck className="w-3.5 h-3.5 fill-emerald/5" />
                                </span>
                              )}
                            </div>
                            <span className="block text-[10px] text-slate-text-muted">{review.role}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StarRating rating={review.rating} />
                          {review.verified && (
                            <span className="text-[8px] uppercase tracking-wider font-extrabold text-emerald flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="block text-[9px] uppercase tracking-wider font-bold text-cobalt mb-1">
                          <Cpu className="inline w-3 h-3 mr-1" />{review.product}
                        </span>
                        <p className="text-xs text-slate-text-secondary leading-relaxed">{review.body}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-border/50 mt-4 flex items-center justify-between">
                      <span className="text-[10px] text-slate-text-muted flex items-center gap-1 font-bold">
                        <Clock className="w-3 h-3" /> {review.date}
                      </span>
                      <button
                        onClick={() => toggleLike(review.id)}
                        className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${likedReviews.has(review.id)
                          ? 'text-cobalt bg-cobalt/5 border-cobalt/20'
                          : 'text-slate-text-muted border-slate-border hover:border-cobalt/30 hover:text-cobalt'}`}
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
            {ANNOUNCEMENTS.map((ann) => (
              <div key={ann.id} className={`bg-white border rounded-2xl p-6 shadow-sm ${ann.pinned ? 'border-cobalt/30' : 'border-slate-border'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {ann.pinned && <Pin className="w-4 h-4 text-cobalt shrink-0 mt-0.5" />}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border ${ann.tagColor}`}>{ann.tag}</span>
                        {ann.pinned && <span className="text-[9px] uppercase tracking-wider font-extrabold text-cobalt">Pinned</span>}
                      </div>
                      <h3 className="text-base font-bold text-slate-text-primary">{ann.title}</h3>
                      <p className="text-xs text-slate-text-secondary leading-relaxed">{ann.body}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-text-muted font-bold shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {ann.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==================== NEWS TAB ==================== */}
        {activeTab === 'News' && (
          <div className="space-y-5">
            {NEWS.map((article) => (
              <div key={article.id} className="bg-white border border-slate-border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row gap-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
                <div className={`w-12 h-12 rounded-xl ${article.avatarColor} text-white flex items-center justify-center font-bold text-sm shrink-0`}>
                  {article.avatar}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border bg-cobalt/5 text-cobalt border-cobalt/20">{article.category}</span>
                    <span className="text-[10px] text-slate-text-muted font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> {article.date}</span>
                    <span className="text-[10px] text-slate-text-muted font-bold">· {article.readTime}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-text-primary group-hover:text-cobalt transition-colors leading-tight">{article.title}</h3>
                  <p className="text-xs text-slate-text-secondary leading-relaxed">{article.excerpt}</p>
                </div>
                <div className="shrink-0 flex items-center">
                  <ArrowRight className="w-4 h-4 text-slate-text-muted group-hover:text-cobalt group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
