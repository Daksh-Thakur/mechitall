'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';
import ProductModal from '../../components/ProductModal';
import { Part } from '../../components/mockData';
import { createClient } from '@/utils/supabase/client';
import { Search, Database, X, SlidersHorizontal } from 'lucide-react';

export default function ProductsPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('featured');

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
        }));
        setParts(mappedParts);
      } catch (err) {
        console.error('Error loading products:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

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
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col">
      <Navbar />

      {/* Page Header 
      <div className="bg-white border-b border-slate-border">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-cobalt">In-Stock Products</span>
          <h1 className="text-4xl font-extrabold text-slate-text-primary tracking-tight mt-1">Parts Catalog</h1>
          <p className="text-sm text-slate-text-muted font-medium mt-2 max-w-xl">
            Premium mechatronics components — order from 1 unit and receive in 1–2 days.
          </p>
        </div>
      </div>
*/}
      <main className="max-w-7xl mx-auto px-6 py-4 flex-1 space-y-6">
        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-border shadow-sm">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search parts, products, datasheets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-slate-bg border border-slate-border text-slate-text-primary px-3 py-2 pl-9 rounded-lg focus:outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt/20 transition-all placeholder-slate-text-muted font-medium"
            />
            <Search className="w-3.5 h-3.5 text-slate-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-text-muted hover:text-coral"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category tabs */}
            <div className="bg-slate-bg border border-slate-border p-1 rounded-lg flex items-center gap-1">
              {['All', 'Actuators', 'Sensors', 'Control Boards', 'Mechanical'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${selectedCategory === cat
                    ? 'bg-white text-cobalt shadow-sm border border-slate-border/50'
                    : 'text-slate-text-secondary hover:text-slate-text-primary'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-border px-3 py-2 rounded-lg text-xs font-bold text-slate-text-secondary focus:outline-none focus:border-cobalt transition-colors"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="stock">Stock Availability</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-text-muted bg-white px-4 py-1 rounded-lg border border-slate-border/50">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Showing {filteredParts.length} of {parts.length} parts</span>
          </div>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-cobalt hover:underline cursor-pointer flex items-center gap-1">
              Clear Search <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div key={n} className="bg-slate-bg/30 border border-slate-border/50 rounded-xl p-5 h-72"></div>
            ))}
          </div>
        ) : filteredParts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredParts.map(part => (
              <ProductCard key={part.id} part={part} onViewDetails={setSelectedPart} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-slate-border rounded-2xl bg-white space-y-4">
            <Database className="w-12 h-12 text-slate-text-muted/30 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-text-primary">No parts found</p>
              <p className="text-xs text-slate-text-muted">Try different search terms or clear the category filter.</p>
            </div>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="btn-secondary text-xs font-bold px-4 py-2 rounded-lg cursor-pointer mx-auto"
            >
              Clear Filters
            </button>
          </div>
        )}
      </main>

      <Footer />

      {selectedPart && (
        <ProductModal part={selectedPart} onClose={() => setSelectedPart(null)} />
      )}
    </div>
  );
}
