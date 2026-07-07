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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const categories = ['All', 'Actuators', 'Sensors', 'Control Boards', 'Mechanical'];

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const { data: productsData } = await supabase.from('products').select('*');
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
          imagesData: p.images_data || []
        }));
        // Append custom listed products from localStorage if any
        let localParts: Part[] = [];
        if (typeof window !== 'undefined') {
          const localProdsRaw = localStorage.getItem('local_listed_products');
          if (localProdsRaw) {
            const parsed = JSON.parse(localProdsRaw);
            const defaultSkus = ['ACT-NEMA23-CL', 'SEN-LIDAR-20M', 'BRD-STM32-M4'];
            const customListed = parsed.filter((p: any) => !defaultSkus.includes(p.part_number || p.sku));
            localParts = customListed.map((p: any) => ({
              id: p.id || p.part_number,
              partNumber: p.part_number || p.sku,
              title: p.title,
              category: p.category as any,
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
              imagesData: p.images_data || []
            }));
          }
        }
        setParts([...mappedParts, ...localParts]);
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
    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'stock') result.sort((a, b) => b.stock - a.stock);
    return result;
  }, [parts, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1b1b1d] font-sans flex flex-col overflow-x-clip">
      <Navbar />

      {/* ─── MOBILE TOP BAR ─── */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-[#E4E4E7] flex items-center justify-between px-4 h-14">
        <h1 className="font-['Space_Grotesk'] text-base font-bold text-[#0F172A]">Parts Catalog</h1>
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
            <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#0F172A]">Filter Specs</h2>
            <p className="font-['Inter'] text-xs text-[#45464d] mt-0.5 opacity-70">Technical Parameters</p>
          </div>

          {/* Category nav */}
          <nav className="flex flex-col gap-0.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-['Inter'] text-left transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0F172A] text-white font-bold'
                    : 'text-[#45464d] hover:bg-[#E4E4E7]'
                }`}
              >
                <span className="text-base">{cat === 'All' ? '⊞' : cat === 'Actuators' ? '⚡' : cat === 'Sensors' ? '📡' : cat === 'Control Boards' ? '🖥' : '⚙'}</span>
                {cat === 'All' ? 'All Categories' : cat}
              </button>
            ))}
          </nav>

          {/* Sort */}
          <div className="pt-4 border-t border-[#E4E4E7] flex flex-col gap-3">
            <label className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-wider text-[#45464d]">Sort By</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-white border border-[#E4E4E7] px-3 py-2 text-xs font-['Inter'] text-[#45464d] focus:outline-none focus:border-[#06B6D4] transition-colors cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="stock">Stock Availability</option>
            </select>
          </div>

          {/* Reset */}
          <button
            onClick={() => { setSelectedCategory('All'); setSearchQuery(''); setSortBy('featured'); }}
            className="mt-auto py-2 px-4 border border-[#0F172A] text-[#0F172A] font-bold text-xs font-['Inter'] hover:bg-[#0F172A] hover:text-white transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <main className="flex-1 min-w-0 px-3 md:px-6 lg:px-8 py-4 md:py-8">

          {/* Desktop: Blueprint header banner */}
          <div
            className="hidden md:block mb-4 border-l-4 border-[#06B6D4] px-4 py-3 bg-white/60"
            style={{
              backgroundImage: 'linear-gradient(to right, rgba(6,182,212,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(6,182,212,0.05) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          >
            <div className="flex justify-between items-center">
              <div>
                <h1 className="font-['Space_Grotesk'] text-lg font-bold text-[#0F172A]">Parts Catalog</h1>
                <p className="font-['Inter'] text-xs text-[#45464d] mt-0.5">
                  {isLoading ? 'Loading...' : `${filteredParts.length} Engineering Components Found`}
                </p>
              </div>
              <span className="px-2 py-1 bg-[#0F172A] text-white text-[8px] font-['JetBrains_Mono'] uppercase tracking-wider flex items-center gap-1">
                ✓ ISO 9001:2015
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
                {filteredParts.length}/{parts.length}
              </span>
              <span className="hidden md:block text-[10px] font-mono bg-[#F8FAFC] px-1.5 py-0.5 border border-[#E4E4E7] text-[#45464d]">⌘K</span>
            </div>

            {/* Autocomplete suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-[#E4E4E7] shadow-lg overflow-hidden py-1 max-h-72 overflow-y-auto divide-y divide-[#E4E4E7]/50">
                {suggestions.map(part => (
                  <div
                    key={part.id}
                    onClick={() => { setSearchQuery(part.title); setShowSuggestions(false); }}
                    className="p-3 hover:bg-[#F8FAFC] flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#0F172A] truncate">{part.title}</span>
                        <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 bg-[#F8FAFC] border border-[#E4E4E7] text-[#45464d] select-none shrink-0">
                          {part.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#76777d] font-mono block mt-0.5">{part.partNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="block text-xs font-bold text-[#0F172A]">₹{part.price.toLocaleString('en-IN')}</span>
                        <span className="block text-[8px] text-[#76777d]">
                          {part.stock > 0 ? `${part.stock} in stock` : 'Out of stock'}
                        </span>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedPart(part); setShowSuggestions(false); }}
                        className="p-1.5 border border-[#E4E4E7] bg-white hover:border-[#06B6D4] transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#45464d]" />
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
                className={`shrink-0 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0F172A] text-white border-[#0F172A]'
                    : 'bg-white text-[#45464d] border-[#E4E4E7] hover:border-[#0F172A]'
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
                <div key={n} className="bg-white border border-[#E4E4E7] h-64">
                  <div className="h-32 md:h-36 bg-[#F8FAFC]" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-[#E4E4E7] w-3/4" />
                    <div className="h-2 bg-[#E4E4E7] w-1/2" />
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
            <div className="text-center py-20 border border-dashed border-[#E4E4E7] bg-white space-y-4">
              <div className="text-4xl opacity-20">⚙</div>
              <p className="text-sm font-bold text-[#0F172A]">No parts found</p>
              <p className="text-xs text-[#45464d]">Try different search terms or clear the category filter.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setSortBy('featured'); }}
                className="mt-2 py-2 px-5 border border-[#0F172A] text-[#0F172A] font-bold text-xs hover:bg-[#0F172A] hover:text-white transition-colors cursor-pointer"
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
            Technical Filters
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
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-2.5 border text-xs font-['JetBrains_Mono'] text-left transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'border-[#E4E4E7] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {cat === 'All' ? 'All Categories' : cat}
                </button>
              ))}
            </div>
          </section>

          {/* Sort */}
          <section>
            <h3 className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-[#45464d] mb-4">Sort By</h3>
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
                    className="accent-[#0F172A] w-4 h-4"
                  />
                  <span className="font-['Inter'] text-sm text-[#1b1b1d]">{opt.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Stock filter */}
          <section>
            <h3 className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-[#45464d] mb-4">Availability</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 border-[#E4E4E7] accent-[#0F172A] focus:ring-[#06B6D4]" defaultChecked />
                <span className="font-['Inter'] text-sm text-[#1b1b1d]">In Stock</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 border-[#E4E4E7] accent-[#0F172A] focus:ring-[#06B6D4]" />
                <span className="font-['Inter'] text-sm text-[#1b1b1d]">Low Stock</span>
              </label>
            </div>
          </section>
        </div>

        {/* Drawer footer */}
        <div className="p-5 border-t border-[#E4E4E7] flex gap-3">
          <button
            onClick={() => { setSelectedCategory('All'); setSortBy('featured'); setSearchQuery(''); setShowFilterDrawer(false); }}
            className="flex-1 py-3 border border-[#E4E4E7] font-['JetBrains_Mono'] text-xs uppercase tracking-widest hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          >
            Reset
          </button>
          <button
            onClick={() => setShowFilterDrawer(false)}
            className="flex-1 py-3 bg-[#0F172A] text-white font-['JetBrains_Mono'] text-xs uppercase tracking-widest hover:bg-[#06B6D4] transition-colors cursor-pointer"
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
