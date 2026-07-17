'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';
import ProductModal from '../../components/ProductModal';
import { Part } from '../../components/mockData';
import { createClient } from '@/utils/supabase/client';
import { Search, X, SlidersHorizontal, Eye, SlidersVertical, ShoppingCart } from 'lucide-react';

export default function ProductsPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [maxPrice, setMaxPrice] = useState<number>(1000);

  // Dynamically calculate the maximum price among all loaded products
  const maxAllowedPrice = useMemo(() => {
    if (parts.length === 0) return 1000;
    return Math.ceil(Math.max(...parts.map(p => p.price)));
  }, [parts]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const categories = ['All', 'Actuators', 'Sensors', 'Control Boards', 'Mechanical'];

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const { data: productsData } = await supabase.from('products').select('*, profiles:seller_profile_id(full_name)');
        const mappedParts: Part[] = (productsData || []).map((p: any) => ({
          id: p.id,
          partNumber: p.part_number,
          title: p.title,
          category: p.category,
          price: Number(p.price),
          stock: p.stock,
          description: p.description || '',
          gradientClass: p.gradient_class || '',
          specs: p.specs || {},
          bulkPricing: p.bulk_pricing || [],
          datasheetUrl: p.datasheet_url || '',
          cadFile: p.cad_file || '',
          extendedSpecs: p.extended_specs || { dimensions: '', temperatureRange: '', mtbf: '', ingressProtection: '' },
          imageData: p.image_data || undefined,
          imagesData: p.images_data || [],
          sellerName: p.profiles?.full_name || undefined
        }));

        setParts(mappedParts);
        if (mappedParts.length > 0) {
          setMaxPrice(Math.ceil(Math.max(...mappedParts.map(p => p.price))));
        }
      } catch (err) {
        console.error('Error loading products:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);


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

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (showFilterDrawer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showFilterDrawer]);

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return parts.filter(part =>
      part.title.toLowerCase().includes(q) ||
      part.partNumber.toLowerCase().includes(q) ||
      part.category.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [parts, searchQuery]);

  const filteredParts = useMemo(() => {
    let result = [...parts];
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(part =>
        part.title.toLowerCase().includes(q) ||
        part.partNumber.toLowerCase().includes(q) ||
        part.description.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== 'All') {
      result = result.filter(part => part.category === selectedCategory);
    }
    result = result.filter(part => part.price <= maxPrice);
    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'stock') result.sort((a, b) => b.stock - a.stock);
    return result;
  }, [parts, searchQuery, selectedCategory, sortBy, maxPrice]);

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 font-sans flex flex-col overflow-x-clip">
      <Navbar />

      {/* ─── MOBILE TOP BAR ─── */}
      <div className="md:hidden sticky top-0 z-40 bg-zinc-900 border-b border-zinc-800 flex items-center justify-center px-4 h-14">
        <h1 className="font-['Space_Grotesk'] text-base font-bold text-white">Parts Catalog</h1>
      </div>

      <div className="flex flex-1 w-full max-w-[1280px] mx-auto">
        {/* ─── DESKTOP LEFT SIDEBAR ─── */}
        <aside className="hidden lg:flex w-64 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] border-r border-zinc-800 bg-zinc-900 flex-col p-6 gap-4 overflow-y-auto text-zinc-100">
          <div className="pb-2">
            <h2 className="font-['Space_Grotesk'] text-base font-bold text-white">Catalog</h2>
            <p className="font-['Inter'] text-xs text-zinc-500 mt-0.5 opacity-70">Interactive Portal</p>
          </div>

          {/* Primary Navigation */}
          <nav className="flex flex-col gap-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-3 px-3 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-left transition-all cursor-pointer rounded-md ${
                  selectedCategory === cat
                    ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/25 font-bold'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>

          {/* Sort */}
          <div className="pt-4 border-t border-zinc-800 flex flex-col gap-3">
            <label className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-wider text-zinc-500">Sort By</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-zinc-800 border border-zinc-700/60 px-3 py-2 text-xs font-['Inter'] text-zinc-200 focus:outline-none focus:border-emerald-400 transition-colors cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="stock">Stock Availability</option>
            </select>
          </div>

          {/* Price Range Slider */}
          <div className="pt-4 border-t border-zinc-800 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <label className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-wider text-zinc-500">Max Price</label>
              <span className="font-mono text-xs text-emerald-400 font-bold">₹{Math.min(maxPrice, maxAllowedPrice).toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min="0"
              max={maxAllowedPrice}
              step="1"
              value={Math.min(maxPrice, maxAllowedPrice)}
              onChange={e => setMaxPrice(Number(e.target.value))}
              className="accent-emerald-400 w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
              <span>₹0</span>
              <span>₹{maxAllowedPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>
 
          {/* Reset */}
          <button
            onClick={() => { setSelectedCategory('All'); setSearchQuery(''); setSortBy('featured'); setMaxPrice(maxAllowedPrice); }}
            className="mt-auto py-2 px-4 border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer font-mono text-xs uppercase font-bold"
          >
            Reset Filters
          </button>
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <main className="flex-1 min-w-0 px-3 md:px-6 lg:px-8 py-4 md:py-8">

          {/* Desktop: Blueprint header banner */}
          <div
            className="hidden md:block mb-4 border-l-4 border-emerald-400 px-4 py-3 bg-zinc-950/40 border border-zinc-800/80 rounded-r-xl"
            style={{
              backgroundImage: 'linear-gradient(to right, rgba(16,185,129,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(16,185,129,0.02) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          >
            <div className="flex justify-between items-center">
              <div>
                <h1 className="font-['Space_Grotesk'] text-lg font-bold text-white">Parts Catalog</h1>
                <p className="font-['Inter'] text-xs text-zinc-400 mt-0.5">
                  {isLoading ? 'Loading...' : `${filteredParts.length} Components Found`}
                </p>
              </div>
              <span className="px-2 py-1 bg-emerald-400 text-zinc-950 text-[8px] font-['JetBrains_Mono'] uppercase tracking-wider flex items-center gap-1 font-bold rounded">
                ✓ Quality Sourced
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div ref={searchRef} className={`mb-4 relative ${showSuggestions && suggestions.length > 0 ? 'z-30' : 'z-10'}`}>
            <input
              type="text"
              placeholder="Search by SKU, name or technical spec... (⌘K)"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={e => { if (e.key === 'Enter') { e.currentTarget.blur(); setShowSuggestions(false); } }}
              className="w-full bg-zinc-800 border border-zinc-700/60 px-10 py-3 pr-28 text-sm font-['Inter'] text-white focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 outline-none transition-all placeholder:text-zinc-500 rounded-xl"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setShowSuggestions(false); }} className="cursor-pointer">
                  <X className="w-3.5 h-3.5 text-zinc-400 hover:text-red-400 transition-colors" />
                </button>
              )}
              <span className="text-[10px] font-mono bg-zinc-900 px-1.5 py-0.5 border border-zinc-700/60 text-zinc-400 select-none" title="Matching items">
                {filteredParts.length}/{parts.length}
              </span>
              <span className="hidden md:block text-[10px] font-mono bg-zinc-900 px-1.5 py-0.5 border border-zinc-700/60 text-zinc-400">⌘K</span>
            </div>

            {/* Autocomplete suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-zinc-800 border border-zinc-700/65 shadow-2xl overflow-hidden py-1 max-h-72 overflow-y-auto divide-y divide-zinc-700/50 rounded-xl">
                {suggestions.map(part => (
                  <div
                    key={part.id}
                    onClick={() => { setSearchQuery(part.title); setShowSuggestions(false); }}
                    className="p-3 hover:bg-zinc-700/50 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white truncate">{part.title}</span>
                        <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 bg-zinc-900 border border-zinc-700/60 text-zinc-400 select-none shrink-0 font-mono">
                          {part.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">{part.partNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="block text-xs font-bold text-white font-mono">₹{part.price.toLocaleString('en-IN')}</span>
                        <span className="block text-[8px] text-zinc-400">
                          {part.stock > 0 ? `${part.stock} in stock` : 'Out of stock'}
                        </span>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedPart(part); setShowSuggestions(false); }}
                        className="p-1.5 border border-zinc-700 bg-zinc-900 hover:border-emerald-400 transition-all cursor-pointer rounded"
                      >
                        <Eye className="w-3.5 h-3.5 text-zinc-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mobile category pills */}
          <div className="md:hidden flex gap-1.5 mb-4 overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider border rounded-md transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-400 text-zinc-950 border-emerald-400'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700/60 hover:border-zinc-500'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* ─── GRID / LIST ─── */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <div key={n} className="bg-zinc-800 border border-zinc-700/60 h-64 rounded-xl">
                  <div className="h-32 md:h-36 bg-zinc-900/50" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-zinc-700 w-3/4" />
                    <div className="h-2 bg-zinc-700 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredParts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredParts.map(part => (
                <ProductCard key={part.id} part={part} onViewDetails={setSelectedPart} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-zinc-850 bg-zinc-900/40 rounded-2xl space-y-4">
              <div className="text-4xl opacity-20 text-emerald-400">⚙</div>
              <p className="text-sm font-bold text-white">No parts found</p>
              <p className="text-xs text-zinc-400">Try different search terms or clear the category filter.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setSortBy('featured'); }}
                className="mt-2 py-2 px-5 border border-zinc-750 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer font-mono text-xs uppercase font-bold"
              >
                Clear Filters
              </button>
            </div>
          )}
        </main>
      </div>

      <Footer />

      {/* ─── MOBILE FAB ─── */}
      <button
        onClick={() => setShowFilterDrawer(true)}
        className="md:hidden fixed bottom-6 right-5 w-14 h-14 bg-emerald-400 text-zinc-950 rounded-full shadow-lg flex items-center justify-center z-40 active:scale-90 transition-transform cursor-pointer"
        aria-label="Open Filters"
      >
        <SlidersVertical className="w-5 h-5" />
      </button>

      {/* ─── MOBILE FILTER DRAWER ─── */}
      {/* Backdrop */}
      <div
        onClick={() => setShowFilterDrawer(false)}
        className={`md:hidden fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 transition-opacity duration-300 ${showFilterDrawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      {/* Drawer panel */}
      <aside
        className={`md:hidden fixed top-0 right-0 h-full w-[85%] max-w-sm bg-zinc-900 shadow-2xl z-[60] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${showFilterDrawer ? 'translate-x-0' : 'translate-x-full'} text-zinc-100 border-l border-zinc-800`}
      >
        {/* Drawer header */}
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
          <h2 className="font-['Space_Grotesk'] text-base font-semibold text-white flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            Technical Filters
          </h2>
          <button onClick={() => setShowFilterDrawer(false)} className="p-1.5 hover:bg-zinc-800 transition-colors cursor-pointer text-zinc-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Category */}
          <section>
            <h3 className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-zinc-500 mb-4">Category</h3>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-2.5 border text-xs font-['JetBrains_Mono'] text-left transition-colors cursor-pointer rounded-md ${
                    selectedCategory === cat
                      ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/25'
                      : 'border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {cat === 'All' ? 'All Categories' : cat}
                </button>
              ))}
            </div>
          </section>

          {/* Sort */}
          <section>
            <h3 className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-zinc-500 mb-4">Sort By</h3>
            <div className="space-y-2">
              {[
                { val: 'featured', label: 'Featured' },
                { val: 'price-asc', label: 'Price: Low → High' },
                { val: 'price-desc', label: 'Price: High → Low' },
                { val: 'stock', label: 'Stock Availability' },
              ].map(opt => (
                <label key={opt.val} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="sortBy"
                    value={opt.val}
                    checked={sortBy === opt.val}
                    onChange={() => setSortBy(opt.val)}
                    className="accent-emerald-400 w-4 h-4"
                  />
                  <span className="font-['Inter'] text-sm text-zinc-500">{opt.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Price Range Slider */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-zinc-500">Max Price</h3>
              <span className="font-mono text-xs text-emerald-400 font-bold">₹{Math.min(maxPrice, maxAllowedPrice).toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min="0"
              max={maxAllowedPrice}
              step="1"
              value={Math.min(maxPrice, maxAllowedPrice)}
              onChange={e => setMaxPrice(Number(e.target.value))}
              className="accent-emerald-400 w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-zinc-500 font-mono mt-1">
              <span>₹0</span>
              <span>₹{maxAllowedPrice.toLocaleString('en-IN')}</span>
            </div>
          </section>

          {/* Stock filter */}
          <section>
            <h3 className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-zinc-500 mb-4">Availability</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 border-zinc-750 accent-emerald-400 focus:ring-emerald-400/20" defaultChecked />
                <span className="font-['Inter'] text-sm text-zinc-300">In Stock</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 border-zinc-750 accent-emerald-400 focus:ring-emerald-400/20" />
                <span className="font-['Inter'] text-sm text-zinc-300">Low Stock</span>
              </label>
            </div>
          </section>
        </div>

        {/* Drawer footer */}
        <div className="p-5 border-t border-zinc-800 flex gap-3">
          <button
            onClick={() => { setSelectedCategory('All'); setSortBy('featured'); setSearchQuery(''); setMaxPrice(maxAllowedPrice); setShowFilterDrawer(false); }}
            className="flex-1 py-3 border border-zinc-750 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer font-mono text-xs uppercase font-bold rounded-md"
          >
            Reset
          </button>
          <button
            onClick={() => setShowFilterDrawer(false)}
            className="flex-1 py-3 bg-emerald-400 text-zinc-950 font-mono text-xs uppercase font-bold hover:bg-emerald-350 transition-colors cursor-pointer rounded-md"
          >
            Apply
          </button>
        </div>
      </aside>

      {/* Product detail modal */}
      {selectedPart && (
        <ProductModal part={selectedPart} onClose={() => setSelectedPart(null)} />
      )}
    </div>
  );
}
