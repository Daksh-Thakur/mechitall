'use client';

import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import {
  Star,
  Megaphone,
  Newspaper,
  MessageSquare,
  ThumbsUp,
  CheckCircle2,
  Zap,
  Pin,
  Clock,
  ArrowRight,
  Users,
  Cpu,
  Package,
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

const REVIEWS = [
  {
    id: 1,
    author: 'Arjun Sharma',
    role: 'Lead Mechanical Engineer · Bengaluru',
    avatar: 'AS',
    avatarColor: 'bg-cobalt',
    rating: 5,
    product: 'Linear Servo Actuator 12V',
    date: '2026-07-02',
    body: 'Exceptional quality. The servo actuator arrived in perfect packaging, all specs match the datasheet exactly. Repeatability is outstanding for the price point. Will be ordering in bulk for our next production run.',
    verified: true,
    likes: 24,
  },
  {
    id: 2,
    author: 'Priya Mehta',
    role: 'Robotics Researcher · IIT Bombay',
    avatar: 'PM',
    avatarColor: 'bg-emerald',
    rating: 5,
    product: 'CNC Milling (3-Axis) — Custom Bracket',
    date: '2026-06-30',
    body: 'Uploaded my STEP file at 11pm, had a quote in seconds. Part arrived in 3 days with surface finish exactly as specified. The CAD analysis tool is genuinely impressive — flagged a thin wall I\'d missed.',
    verified: true,
    likes: 18,
  },
  {
    id: 3,
    author: 'Kiran Patel',
    role: 'Maker & Hobbyist · Pune',
    avatar: 'KP',
    avatarColor: 'bg-amber-500',
    rating: 4,
    product: 'IMU 9-DOF Motion Sensor',
    date: '2026-06-26',
    body: 'Great sensor, responsive support team. Delivery was a day later than estimated but the team proactively emailed me. Only minor gripe is the datasheet could use better I²C wiring diagrams.',
    verified: true,
    likes: 11,
  },
  {
    id: 4,
    author: 'Sneha Reddy',
    role: 'Automation Engineer · Hyderabad',
    avatar: 'SR',
    avatarColor: 'bg-coral',
    rating: 5,
    product: 'STM32 Motion Control Board',
    date: '2026-06-22',
    body: 'Best control board I\'ve used for a servo drive project. Flashed custom firmware with zero issues. The bulk pricing at 50+ units is genuinely competitive vs any other supplier I\'ve tried.',
    verified: true,
    likes: 31,
  },
  {
    id: 5,
    author: 'Rahul Desai',
    role: 'Product Designer · Mumbai',
    avatar: 'RD',
    avatarColor: 'bg-slate-text-secondary',
    rating: 5,
    product: 'SLA 3D Printing — Resin Prototype',
    date: '2026-06-19',
    body: 'Ordered a small run of resin prototype housings. Surface quality is incredible — almost no post-processing needed. Will be coming back for the production SLS run.',
    verified: false,
    likes: 9,
  },
  {
    id: 6,
    author: 'Anjali Singh',
    role: 'Electrical Engineer · Delhi',
    avatar: 'AS',
    avatarColor: 'bg-violet-500',
    rating: 4,
    product: 'Pressure Sensor 0–100 Bar',
    date: '2026-06-15',
    body: 'Solid product, accurate readings from day one. Would love to see more pressure range options. Packaging was very secure and the CAD file was immediately usable in SolidWorks.',
    verified: true,
    likes: 7,
  },
];

const TABS = ['Announcements', 'Reviews', 'News'] as const;
type Tab = typeof TABS[number];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-border'}`} />
      ))}
    </div>
  );
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Announcements');
  const [likedReviews, setLikedReviews] = useState<Set<number>>(new Set());

  const toggleLike = (id: number) => {
    setLikedReviews(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
            News, Reviews &amp;<br />
            <span className="text-cobalt">Announcements</span>
          </h1>
          <p className="text-sm text-white/70 mt-3 max-w-xl leading-relaxed">
            Stay up to date with platform announcements, read honest product reviews from verified buyers, and discover community stories from engineers and makers.
          </p>

          {/* Community stats */}
          <div className="flex flex-wrap gap-8 mt-8 pt-8 border-t border-white/10">
            {[
              { icon: Users, value: '2,400+', label: 'Community Members' },
              { icon: Star, value: '1,800+', label: 'Verified Reviews' },
              { icon: Newspaper, value: '340+', label: 'Articles Published' },
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
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white border border-slate-border p-1.5 rounded-xl w-fit shadow-sm">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === tab
                ? 'bg-slate-text-primary text-white shadow-sm'
                : 'text-slate-text-secondary hover:text-slate-text-primary hover:bg-slate-bg'}`}
            >
              {tab === 'Announcements' && <Megaphone className="w-3.5 h-3.5" />}
              {tab === 'Reviews' && <Star className="w-3.5 h-3.5" />}
              {tab === 'News' && <Newspaper className="w-3.5 h-3.5" />}
              {tab}
            </button>
          ))}
        </div>

        {/* ANNOUNCEMENTS TAB */}
        {activeTab === 'Announcements' && (
          <div className="space-y-4">
            {ANNOUNCEMENTS.map((ann) => (
              <div key={ann.id} className={`bg-white border rounded-2xl p-6 shadow-sm ${ann.pinned ? 'border-cobalt/30 glow-cobalt' : 'border-slate-border'}`}>
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

        {/* REVIEWS TAB */}
        {activeTab === 'Reviews' && (
          <div className="space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {REVIEWS.map((review) => (
                <div key={review.id} className="bg-white border border-slate-border rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${review.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                          {review.avatar}
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-slate-text-primary">{review.author}</span>
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
          </div>
        )}

        {/* NEWS TAB */}
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
