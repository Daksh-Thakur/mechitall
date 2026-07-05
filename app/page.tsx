'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import {
  MFG_PROCESSES,
  MATERIALS,
  FINISHES,
  LEAD_TIMES,
  Part
} from '../components/mockData';
import { createClient } from '@/utils/supabase/client';
import {
  Cpu,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Download,
  ChevronRight,
  Info,
  Sliders,
  Database,
  Package,
  History,
  Sparkles,
  Clock,
  Coins,
  TrendingDown,
  Compass,
  HelpCircle,
  CheckCircle2,
  Printer,
  FileUp,
  ShieldCheck,
  Activity,
  X,
  ChevronDown,
  ExternalLink,
  ChevronRightSquare
} from 'lucide-react';

interface CartItem {
  id: string; // unique cart item id (might be partId or random for custom)
  partId?: string;
  part?: Part;
  isCustomQuote: boolean;
  customDetails?: {
    fileName: string;
    processName: string;
    materialName: string;
    finishName: string;
    leadTimeName: string;
    volume: number;
    weight: number;
  };
  quantity: number;
  pricePerUnit: number;
}

interface SubmittedOrder {
  orderId: string;
  date: string;
  type: 'Shop Purchase' | 'Custom Part';
  itemsCount: number;
  total: number;
  status: 'Processing' | 'Analyzing CAD' | 'Approved' | 'Shipped';
  fileAttached?: string;
}

export default function Home() {
  const [parts, setParts] = useState<Part[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();

        // Fetch products
        const { data: productsData, error: productsError } = await supabase.from('products').select('*');
        if (productsError) throw productsError;

        const mappedParts: Part[] = (productsData || []).map(p => ({
          id: p.id,
          partNumber: p.part_number,
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
          extendedSpecs: p.extended_specs || {
            dimensions: '',
            temperatureRange: '',
            mtbf: '',
            ingressProtection: ''
          }
        }));
        setParts(mappedParts);

        // Fetch services
        const { data: servicesData, error: servicesError } = await supabase.from('services').select('*');
        if (servicesError) throw servicesError;
        setServices(servicesData || []);

      } catch (err: any) {
        console.error('Error loading data from Supabase:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Navigation active tab / anchor helper
  const [activeTab, setActiveTab] = useState<'catalog' | 'rfq' | 'orders'>('catalog');

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('featured');

  // Product Spec Modal State
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [specModalTab, setSpecModalTab] = useState<'specs' | 'pricing' | 'cad'>('specs');
  const [modalQuantity, setModalQuantity] = useState<number>(1);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // RFQ State
  const [rfqFile, setRfqFile] = useState<{ name: string; size: number } | null>(null);
  const [rfqStatus, setRfqStatus] = useState<'idle' | 'analyzing' | 'quoted' | 'submitted'>('idle');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState('');

  // RFQ Config Options
  const [selectedProcess, setSelectedProcess] = useState(MFG_PROCESSES[0].id);
  const [selectedMaterial, setSelectedMaterial] = useState(MATERIALS[0].id);
  const [selectedFinish, setSelectedFinish] = useState(FINISHES[0].id);
  const [selectedLeadTime, setSelectedLeadTime] = useState(LEAD_TIMES[0].id);
  const [rfqQuantity, setRfqQuantity] = useState(10);

  // Submitted Orders Tracker
  const [submittedOrders, setSubmittedOrders] = useState<SubmittedOrder[]>([]);

  // Checkout Status
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [lastPlacedOrder, setLastPlacedOrder] = useState<SubmittedOrder | null>(null);

  // Auto-scroll to section function
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // RFQ Simulation timer hook
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (rfqStatus === 'analyzing') {
      const messages = [
        { progress: 10, text: 'Opening file and reading boundary envelope...' },
        { progress: 30, text: 'Executing mesh structural analysis and volume integrals...' },
        { progress: 60, text: 'Running dynamic toolpath & machining feasibility simulation...' },
        { progress: 85, text: 'Validating CNC setup orientation & estimating setup costs...' },
        { progress: 100, text: 'Live B2B contract quote generated!' }
      ];

      timer = setInterval(() => {
        setAnalysisProgress((prev) => {
          const next = prev + 5;
          const currentMsg = messages.find(m => next >= m.progress) || messages[0];
          setAnalysisMessage(currentMsg.text);

          if (next >= 100) {
            clearInterval(timer);
            setRfqStatus('quoted');
            return 100;
          }
          return next;
        });
      }, 150);
    }
    return () => clearInterval(timer);
  }, [rfqStatus]);

  // Calculate live RFQ Quote pricing
  const rfqCalculations = useMemo(() => {
    if (!rfqFile) return { unitPrice: 0, totalPrice: 0, setupCost: 0, materialCost: 0, weight: 0 };

    const proc = MFG_PROCESSES.find(p => p.id === selectedProcess) || MFG_PROCESSES[0];
    const mat = MATERIALS.find(m => m.id === selectedMaterial) || MATERIALS[0];
    const fin = FINISHES.find(f => f.id === selectedFinish) || FINISHES[0];
    const lead = LEAD_TIMES.find(l => l.id === selectedLeadTime) || LEAD_TIMES[0];

    // Standard volume model (~145 cm³ for testing file)
    const volumeCm3 = 145.2;
    const weightG = volumeCm3 * mat.densityGcm3;
    const weightKg = weightG / 1000;

    // Pricing formulas
    const setupCost = proc.baseCost;
    const rawMaterialCost = weightKg * mat.pricePerKg;

    // Complexity base rate
    let baseRate = 80; // $80/hr machining base
    if (proc.id.includes('5')) baseRate = 160;
    if (proc.id.includes('sls')) baseRate = 40;
    if (proc.id.includes('sla')) baseRate = 50;

    // Difficulty modifier based on materials
    let materialMachiningMod = 1.0;
    if (mat.machClass === 'hard') materialMachiningMod = 1.45;
    if (mat.machClass === 'extreme') materialMachiningMod = 2.8;
    if (mat.machClass === 'easy') materialMachiningMod = 0.85;

    const machiningHours = 1.2 * proc.complexityMultiplier;
    const machiningCost = machiningHours * baseRate * materialMachiningMod;

    // Raw unit cost calculation
    let unitCostBeforeFinish = machiningCost + rawMaterialCost;

    // Finish multiplier
    let unitCost = unitCostBeforeFinish * fin.costMultiplier;

    // Quantity discounting curve
    let qtyDiscountMultiplier = 1.0;
    if (rfqQuantity >= 10 && rfqQuantity < 50) qtyDiscountMultiplier = 0.85; // 15% discount
    if (rfqQuantity >= 50 && rfqQuantity < 200) qtyDiscountMultiplier = 0.70; // 30% discount
    if (rfqQuantity >= 200) qtyDiscountMultiplier = 0.55; // 45% discount

    // Apply lead time modifier
    unitCost = unitCost * lead.priceMultiplier * qtyDiscountMultiplier;

    // Add amortized setup cost
    const unitPrice = (setupCost / rfqQuantity) + unitCost;
    const totalPrice = unitPrice * rfqQuantity;

    return {
      unitPrice: Math.round(unitPrice * 100) / 100,
      totalPrice: Math.round(totalPrice * 100) / 100,
      setupCost,
      materialCost: Math.round(rawMaterialCost * 100) / 100,
      weight: Math.round(weightG * 10) / 10,
    };
  }, [rfqFile, selectedProcess, selectedMaterial, selectedFinish, selectedLeadTime, rfqQuantity]);

  // Handle CAD Mock Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setRfqFile({ name: file.name, size: file.size });
      setAnalysisProgress(0);
      setRfqStatus('analyzing');
    }
  };

  // Drag and Drop simulation
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setRfqFile({ name: file.name, size: file.size });
      setAnalysisProgress(0);
      setRfqStatus('analyzing');
    }
  };

  // Add Item to B2B Cart
  const handleAddToCart = (part: Part, quantity: number) => {
    const existingIndex = cart.findIndex(item => item.partId === part.id && !item.isCustomQuote);
    const unitPrice = getPartPriceForQuantity(part, quantity);

    if (existingIndex > -1) {
      const newCart = [...cart];
      const newQty = newCart[existingIndex].quantity + quantity;
      newCart[existingIndex].quantity = newQty;
      // Re-evaluate bulk unit price for new quantity
      newCart[existingIndex].pricePerUnit = getPartPriceForQuantity(part, newQty);
      setCart(newCart);
    } else {
      setCart([...cart, {
        id: `cart-${part.id}-${Date.now()}`,
        partId: part.id,
        part: part,
        isCustomQuote: false,
        quantity: quantity,
        pricePerUnit: unitPrice
      }]);
    }

    // Pulse animation confirmation
    setIsCartOpen(true);
  };

  // Add Custom Quote to Cart
  const handleAddCustomQuoteToCart = () => {
    if (!rfqFile) return;
    const proc = MFG_PROCESSES.find(p => p.id === selectedProcess) || MFG_PROCESSES[0];
    const mat = MATERIALS.find(m => m.id === selectedMaterial) || MATERIALS[0];
    const fin = FINISHES.find(f => f.id === selectedFinish) || FINISHES[0];
    const lead = LEAD_TIMES.find(l => l.id === selectedLeadTime) || LEAD_TIMES[0];

    const newCartItem: CartItem = {
      id: `custom-${Date.now()}`,
      isCustomQuote: true,
      quantity: rfqQuantity,
      pricePerUnit: rfqCalculations.unitPrice,
      customDetails: {
        fileName: rfqFile.name,
        processName: proc.name,
        materialName: mat.name,
        finishName: fin.name,
        leadTimeName: lead.name,
        volume: 145.2,
        weight: rfqCalculations.weight
      }
    };

    setCart([...cart, newCartItem]);
    setIsCartOpen(true);

    // Reset RFQ panel
    setRfqFile(null);
    setRfqStatus('idle');
  };

  // Get active unit price for catalog items based on quantity tiers
  const getPartPriceForQuantity = (part: Part, qty: number): number => {
    const tier = [...part.bulkPricing]
      .reverse()
      .find(t => qty >= t.minQty);
    return tier ? tier.pricePerUnit : part.price;
  };

  // Update item quantity in cart
  const updateCartQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) {
      setCart(cart.filter(item => item.id !== id));
      return;
    }
    const updated = cart.map(item => {
      if (item.id === id) {
        let price = item.pricePerUnit;
        if (!item.isCustomQuote && item.part) {
          price = getPartPriceForQuantity(item.part, newQty);
        }
        return { ...item, quantity: newQty, pricePerUnit: price };
      }
      return item;
    });
    setCart(updated);
  };

  // Remove item from cart
  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Cart financial summary
  const cartSummary = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0);

    // B2B incentives
    const bulkDiscountThreshold = 1500;
    const discountRate = 0.08; // 8% enterprise discount
    const discount = subtotal >= bulkDiscountThreshold ? subtotal * discountRate : 0;

    const shipping = subtotal === 0 ? 0 : (subtotal >= 500 ? 0 : 45.00);
    const tax = (subtotal - discount) * 0.0825; // 8.25% standard B2B tax
    const total = subtotal - discount + shipping + tax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      discountRatePercent: discountRate * 100,
      shipping,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
    };
  }, [cart]);

  // Catalog filtering logic
  const filteredParts = useMemo(() => {
    let result = [...parts];

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(part =>
        part.title.toLowerCase().includes(q) ||
        part.partNumber.toLowerCase().includes(q) ||
        part.description.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(part => part.category === selectedCategory);
    }

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'stock') {
      result.sort((a, b) => b.stock - a.stock);
    }

    return result;
  }, [parts, searchQuery, selectedCategory, sortBy]);

  // Place order checkout trigger
  const handleCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutStatus('submitting');

    // Simulate order confirmation
    setTimeout(() => {
      const orderId = `PO-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const newOrder: SubmittedOrder = {
        orderId,
        date: new Date().toISOString().split('T')[0],
        type: 'Shop Purchase',
        itemsCount: cart.length,
        total: cartSummary.total,
        status: 'Processing'
      };

      setSubmittedOrders([newOrder, ...submittedOrders]);
      setLastPlacedOrder(newOrder);
      setCart([]);
      setCheckoutStatus('success');
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col">
      {/* Navbar Integration */}
      <Navbar
        cartCount={cartSummary.itemCount}
        onCartClick={() => setIsCartOpen(true)}
        onNavigateToRFQ={() => scrollToSection('rfq-section')}
        onNavigateToInventory={() => scrollToSection('inventory-section')}
        onNavigateToServices={() => scrollToSection('services-section')}
      />

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-16 flex-1">

        {/* SECTION 1: BRAND HERO HEADER */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-border/80 bg-white p-8 md:p-12 glow-cobalt flex flex-col md:flex-row items-center gap-10">
          {/* Subtle neon abstract shapes in bg */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-cobalt/5 to-emerald/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-emerald/5 to-cobalt/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

          <div className="flex-1 space-y-6 z-10">
            {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cobalt/5 border border-cobalt/15 text-cobalt">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cobalt opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cobalt"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider">ISO 9001:2015 Certified · Free Shipping on Orders over ₹5000</span>
            </div>
            */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-text-primary leading-[1.05]">
              Shop Premium <br />
              <span className="bg-gradient-to-r from-cobalt to-emerald bg-clip-text text-transparent">
                Parts & Custom Builds
              </span>
            </h1>

            <p className="text-sm md:text-base text-slate-text-secondary max-w-xl font-medium leading-relaxed">
              Buy actuators, sensors, controllers and more — or upload your CAD file and get an instant price for custom-machined parts.
            </p>

            {/* Micro CTAs & Metrics */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => scrollToSection('rfq-section')}
                className="btn-emerald animate-pulse-ring-emerald px-6 py-3 rounded-lg font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <FileUp className="w-4 h-4" />
                Get Instant Custom Quote
              </button>
              <button
                onClick={() => scrollToSection('inventory-section')}
                className="btn-secondary px-6 py-3 rounded-lg font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <span>Shop Parts</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-border/60 pt-6 grid grid-cols-3 gap-6">
              <div>
                <span className="block text-xl md:text-2xl font-extrabold text-cobalt">24–48 hrs</span>
                <span className="block text-[9px] uppercase tracking-wider text-slate-text-muted font-bold">Avg. Delivery Time</span>
              </div>
              <div>
                <span className="block text-xl md:text-2xl font-extrabold text-emerald">No Minimums</span>
                <span className="block text-[9px] uppercase tracking-wider text-slate-text-muted font-bold">Order 1 or 10,000 units</span>
              </div>
              <div>
                <span className="block text-xl md:text-2xl font-extrabold text-slate-text-primary">10,000+</span>
                <span className="block text-[9px] uppercase tracking-wider text-slate-text-muted font-bold">Products In Stock</span>
              </div>
            </div>
          </div>

          {/* Interactive B2B Feature Showcase */}
          <div className="w-full md:w-[400px] z-10">
            <div className="glassmorphism p-6 rounded-2xl border border-slate-border shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-text-muted">Your Shopping Summary</span>
                <div className="flex items-center gap-1 bg-emerald/10 text-emerald text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald/20">
                  <ShieldCheck className="w-3.5 h-3.5 animate-pulse" /> Secure Checkout
                </div>
              </div>

              {/* Status parameters */}
              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-slate-bg/50 border border-slate-border/50 rounded-lg flex items-center justify-between">
                  <span className="text-slate-text-muted font-medium">Free Shipping Above</span>
                  <span className="font-bold text-slate-text-primary font-mono">₹5,000</span>
                </div>

                <div className="p-3 bg-slate-bg/50 border border-slate-border/50 rounded-lg flex items-center justify-between">
                  <span className="text-slate-text-muted font-medium">Returns</span>
                  <span className="font-bold text-cobalt">7-Day Easy Returns</span>
                </div>

                <div className="p-3 bg-slate-bg/50 border border-slate-border/50 rounded-lg flex items-center justify-between">
                  <span className="text-slate-text-muted font-medium">Bulk Discount</span>
                  <span className="font-bold text-emerald">Up to 45% off</span>
                </div>
              </div>

              {/* Info notice */}
              <div className="bg-cobalt/5 border border-cobalt/15 p-3 rounded-lg flex items-start gap-2 text-[10px] text-slate-text-secondary leading-relaxed">
                <Info className="w-4 h-4 text-cobalt flex-shrink-0 mt-0.5" />
                <span>
                  All orders ship within 24 hours. Custom machined parts are quoted instantly — no account needed to buy.
                </span>
              </div>
            </div>
          </div>
        </section>


        {/* SECTION 2: READY TO SHIP (INVENTORY GRID) */}
        <section id="inventory-section" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-border pb-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-cobalt">In-Stock Products</span>
              <h2 className="text-3xl font-extrabold text-slate-text-primary tracking-tight">Shop Ready-to-Ship Parts</h2>
              <p className="text-xs text-slate-text-muted font-medium">Premium mechatronics components — add to cart and receive them at your door in 1–2 days.</p>
            </div>

            {/* Filters layout */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category tabs */}
              <div className="bg-slate-bg border border-slate-border p-1 rounded-lg flex items-center gap-1">
                {['All', 'Actuators', 'Sensors', 'Control Boards', 'Mechanical'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${selectedCategory === cat
                      ? 'bg-white text-cobalt shadow-sm border border-slate-border/50'
                      : 'text-slate-text-secondary hover:text-slate-text-primary'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Sort controls */}
              <div className="relative inline-block text-left">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white border border-slate-border px-3 py-2 rounded-lg text-xs font-bold text-slate-text-secondary focus:outline-none focus:border-cobalt transition-colors"
                >
                  <option value="featured">Sort by: Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="stock">Stock Availability</option>
                </select>
              </div>
            </div>
          </div>

          {/* Search feedback & count */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-text-muted bg-slate-bg px-4 py-2.5 rounded-lg border border-slate-border/50">
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              <span>Showing {filteredParts.length} mechatronics parts</span>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-cobalt hover:underline cursor-pointer flex items-center gap-1"
              >
                Clear Search <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Dense CSS Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-slate-bg/30 border border-slate-border/50 rounded-xl p-5 h-72 flex flex-col justify-between space-y-4">
                  <div className="h-40 bg-slate-border rounded-lg w-full"></div>
                  <div className="h-4 bg-slate-border rounded w-3/4"></div>
                  <div className="h-4 bg-slate-border rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredParts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredParts.map((part) => (
                <div
                  key={part.id}
                  className="group bg-white rounded-xl border border-slate-border p-5 flex flex-col justify-between card-hover glow-cobalt"
                >
                  <div className="space-y-4">
                    {/* Colored glass placeholder */}
                    <div
                      onClick={() => { setSelectedPart(part); setSpecModalTab('specs'); setModalQuantity(1); }}
                      className={`h-40 w-full rounded-lg bg-gradient-to-br ${part.gradientClass} relative overflow-hidden flex items-center justify-center cursor-pointer`}
                    >
                      <Cpu className="w-10 h-10 text-slate-text-muted/30 group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest bg-white/90 text-slate-text-primary shadow-sm">
                        {part.category}
                      </div>

                      <div className="absolute bottom-2 right-2 text-[9px] font-bold text-slate-text-muted flex items-center gap-1 bg-white/70 backdrop-blur-sm px-1.5 py-0.5 rounded">
                        <Download className="w-2.5 h-2.5" /> CAD Available
                      </div>
                    </div>

                    {/* Part Details */}
                    <div className="space-y-1">
                      <span className="block font-mono text-[10px] text-slate-text-muted uppercase tracking-wider leading-tight">
                        {part.partNumber}
                      </span>
                      <h3
                        onClick={() => { setSelectedPart(part); setSpecModalTab('specs'); setModalQuantity(1); }}
                        className="text-sm font-bold text-slate-text-primary leading-tight group-hover:text-cobalt transition-colors duration-200 cursor-pointer line-clamp-1"
                      >
                        {part.title}
                      </h3>
                      <p className="text-xs text-slate-text-muted line-clamp-2 leading-relaxed">
                        {part.description}
                      </p>
                    </div>

                    {/* Specifications mini grid */}
                    <div className="border-t border-b border-slate-border/50 py-2.5 space-y-1.5 text-[11px]">
                      {Object.entries(part.specs).slice(0, 3).map(([key, val]) => (
                        <div key={key} className="flex justify-between font-medium">
                          <span className="text-slate-text-muted">{key}</span>
                          <span className="text-slate-text-secondary truncate max-w-[140px] font-bold">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="pt-4 flex items-center justify-between gap-2 mt-4">
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider text-slate-text-muted font-bold">UnitPrice</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-extrabold text-coral">₹{part.price.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-text-muted font-bold">INR</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddToCart(part, 1)}
                      className="btn-cobalt text-xs font-bold px-3 py-2 rounded-lg cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-slate-border rounded-2xl bg-white space-y-4">
              <Database className="w-12 h-12 text-slate-text-muted/30 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-text-primary">No parts found matching query</p>
                <p className="text-xs text-slate-text-muted">Try looking for different parameters, categories or clear filters.</p>
              </div>
            </div>
          )}
        </section>

        {/* SECTION: B2B SERVICES */}
        <section id="services-section" className="space-y-6">
          <div className="border-b border-slate-border pb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald">Capabilities</span>
            <h2 className="text-3xl font-extrabold text-slate-text-primary tracking-tight">On-Demand B2B Services</h2>
            <p className="text-xs text-slate-text-muted font-medium">Partner with our certified engineering team and state-of-the-art facilities for high-precision mechatronics assembly, CNC milling, SLA/SLS 3D printing, and design consultation.</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-64 bg-slate-bg/30 border border-slate-border/50 rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between">
                    <div className="h-4 bg-slate-border w-20 rounded"></div>
                    <div className="h-4 bg-slate-border w-16 rounded"></div>
                  </div>
                  <div className="h-6 bg-slate-border w-3/4 rounded"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-border w-full rounded"></div>
                    <div className="h-4 bg-slate-border w-5/6 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 ${service.gradient_class || 'border-slate-border/80'}`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border bg-emerald/5 text-emerald border-emerald/20">
                        {service.category}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-text-muted">
                        {service.lead_time}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-slate-text-primary tracking-tight">{service.title}</h3>
                      <p className="text-xs text-slate-text-secondary leading-relaxed font-medium">
                        {service.description}
                      </p>
                    </div>

                    {service.features && Array.isArray(service.features) && service.features.length > 0 && (
                      <ul className="space-y-1.5 text-[11px] text-slate-text-secondary font-medium">
                        {service.features.map((feature: any, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-border/50 mt-6 flex items-center justify-between">
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider text-slate-text-muted font-bold">Base Price</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-extrabold text-slate-text-primary">₹{Number(service.base_price).toFixed(2)}</span>
                        <span className="text-[10px] text-slate-text-muted font-bold">INR</span>
                      </div>
                    </div>

                    <button
                      onClick={() => scrollToSection('rfq-section')}
                      className="btn-emerald text-xs font-bold px-3.5 py-2 rounded-lg cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                    >
                      Configure RFQ <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>


        {/* SECTION 3: CUSTOM MANUFACTURING (RFQs) */}
        <section id="rfq-section" className="space-y-6">
          <div className="border-b border-slate-border pb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald">B2B Manufacturing</span>
            <h2 className="text-3xl font-extrabold text-slate-text-primary tracking-tight">On-Demand Manufacturing Quote</h2>
            <p className="text-xs text-slate-text-muted font-medium">Upload industrial design files (STEP, STL, PDF) for automated thickness, volume, and material cost modeling.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Drag & Drop Upload Section (Col 5) */}
            <div className="lg:col-span-5 space-y-4">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`bg-white border-2 border-dashed rounded-2xl p-8 text-center transition-all ${rfqStatus === 'analyzing'
                  ? 'border-cobalt bg-cobalt/5'
                  : rfqFile
                    ? 'border-emerald/40 bg-emerald/5'
                    : 'border-slate-border hover:border-cobalt/50 hover:bg-slate-bg/30'
                  }`}
              >
                <input
                  type="file"
                  id="cad-upload-input"
                  className="hidden"
                  accept=".step,.stp,.stl,.igs,.iges,.pdf,.dwg"
                  onChange={handleFileUpload}
                  disabled={rfqStatus === 'analyzing'}
                />

                <div className="space-y-4">
                  <div className="w-14 h-14 bg-slate-bg border border-slate-border text-slate-text-secondary rounded-xl flex items-center justify-center mx-auto shadow-sm">
                    <FileUp className="w-6 h-6 text-slate-text-muted" />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="cad-upload-input"
                      className="text-xs font-bold text-cobalt hover:underline cursor-pointer"
                    >
                      Click to upload 3D CAD/PDF
                    </label>
                    <span className="block text-xs text-slate-text-secondary font-medium">
                      or drag and drop file here
                    </span>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-text-muted font-bold">
                      STEP, STL, IGES, DXF, PDF (Max 50MB)
                    </span>
                  </div>
                </div>
              </div>

              {/* Uploading/Simulation Progress Bar */}
              {rfqStatus === 'analyzing' && (
                <div className="bg-white border border-slate-border p-4 rounded-xl space-y-3 glow-cobalt animate-pulse-ring-cobalt">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-text-primary">
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-cobalt animate-spin" />
                      CAD Geometry Parsing...
                    </span>
                    <span>{analysisProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-bg h-2 rounded-full overflow-hidden border border-slate-border/50">
                    <div
                      className="bg-gradient-to-r from-cobalt to-emerald h-full transition-all duration-150"
                      style={{ width: `${analysisProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-slate-text-muted font-mono leading-tight">
                    {analysisMessage}
                  </p>
                </div>
              )}

              {/* Idle State guide */}
              {rfqStatus === 'idle' && (
                <div className="bg-slate-bg/50 border border-slate-border p-4 rounded-xl space-y-2">
                  <span className="block text-[9px] uppercase tracking-widest text-slate-text-muted font-bold">Automated RFQ Process</span>
                  <div className="space-y-1.5 text-xs text-slate-text-secondary">
                    <p className="font-semibold flex items-center gap-1">
                      <span className="inline-flex w-4 h-4 rounded-full bg-slate-border text-slate-text-primary items-center justify-center text-[9px]">1</span>
                      Drop boundary solid file (.step / .stl)
                    </p>
                    <p className="font-semibold flex items-center gap-1">
                      <span className="inline-flex w-4 h-4 rounded-full bg-slate-border text-slate-text-primary items-center justify-center text-[9px]">2</span>
                      Configure machining processes & custom alloys
                    </p>
                    <p className="font-semibold flex items-center gap-1">
                      <span className="inline-flex w-4 h-4 rounded-full bg-slate-border text-slate-text-primary items-center justify-center text-[9px]">3</span>
                      Order 1 or more — single prototypes and bulk runs welcome
                    </p>
                    <p className="font-semibold flex items-center gap-1">
                      <span className="inline-flex w-4 h-4 rounded-full bg-slate-border text-slate-text-primary items-center justify-center text-[9px]">3</span>
                      Add to cart and pay online — fast, secure delivery
                    </p>
                  </div>
                </div>
              )}

              {/* Quoted State metadata */}
              {rfqStatus === 'quoted' && rfqFile && (
                <div className="bg-white border border-slate-border p-4 rounded-xl space-y-3 glow-emerald">
                  <div className="flex items-center justify-between border-b border-slate-border/50 pb-2">
                    <div>
                      <span className="block text-[8px] uppercase tracking-wider text-emerald font-extrabold">CAD Analyzed</span>
                      <span className="block text-xs font-bold text-slate-text-primary truncate max-w-[200px]">{rfqFile.name}</span>
                    </div>
                    <button
                      onClick={() => { setRfqFile(null); setRfqStatus('idle'); }}
                      className="text-slate-text-muted hover:text-coral transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Solid properties */}
                  <div className="grid grid-cols-2 gap-3 text-[11px] font-bold">
                    <div className="p-2 bg-slate-bg rounded border border-slate-border/50">
                      <span className="block text-slate-text-muted text-[8px] uppercase">Envelope Volume</span>
                      <span className="text-slate-text-primary text-xs">145.20 cm³</span>
                    </div>
                    <div className="p-2 bg-slate-bg rounded border border-slate-border/50">
                      <span className="block text-slate-text-muted text-[8px] uppercase">Est. Part Weight</span>
                      <span className="text-slate-text-primary text-xs text-emerald">{rfqCalculations.weight} grams</span>
                    </div>
                    <div className="p-2 bg-slate-bg rounded border border-slate-border/50">
                      <span className="block text-slate-text-muted text-[8px] uppercase">Bounding Box</span>
                      <span className="text-slate-text-primary text-xs">10.4 x 6.8 x 2.2 cm</span>
                    </div>
                    <div className="p-2 bg-slate-bg rounded border border-slate-border/50">
                      <span className="block text-slate-text-muted text-[8px] uppercase">DFM Violations</span>
                      <span className="text-emerald text-xs">0 Detected</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Config & Calculation Form (Col 7) */}
            <div className="lg:col-span-7">
              <div className="bg-white border border-slate-border rounded-2xl p-6 glow-cobalt space-y-6">
                <div className="flex items-center justify-between border-b border-slate-border pb-4">
                  <h3 className="text-base font-bold text-slate-text-primary flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-cobalt" /> Quote Configurator
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-text-muted">RFQ v4.8</span>
                </div>

                {/* Configurations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Process */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-text-secondary">Process</label>
                    <select
                      value={selectedProcess}
                      onChange={(e) => setSelectedProcess(e.target.value)}
                      disabled={!rfqFile || rfqStatus === 'analyzing'}
                      className="w-full bg-slate-bg border border-slate-border text-xs text-slate-text-primary px-3 py-2 rounded-lg font-semibold focus:outline-none focus:border-cobalt disabled:opacity-60"
                    >
                      {MFG_PROCESSES.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Material */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-text-secondary">Material / Alloy</label>
                    <select
                      value={selectedMaterial}
                      onChange={(e) => setSelectedMaterial(e.target.value)}
                      disabled={!rfqFile || rfqStatus === 'analyzing'}
                      className="w-full bg-slate-bg border border-slate-border text-xs text-slate-text-primary px-3 py-2 rounded-lg font-semibold focus:outline-none focus:border-cobalt disabled:opacity-60"
                    >
                      {MATERIALS.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Surface Finish */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-text-secondary">Surface Treatment</label>
                    <select
                      value={selectedFinish}
                      onChange={(e) => setSelectedFinish(e.target.value)}
                      disabled={!rfqFile || rfqStatus === 'analyzing'}
                      className="w-full bg-slate-bg border border-slate-border text-xs text-slate-text-primary px-3 py-2 rounded-lg font-semibold focus:outline-none focus:border-cobalt disabled:opacity-60"
                    >
                      {FINISHES.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Lead Time */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-text-secondary">Production Speed</label>
                    <select
                      value={selectedLeadTime}
                      onChange={(e) => setSelectedLeadTime(e.target.value)}
                      disabled={!rfqFile || rfqStatus === 'analyzing'}
                      className="w-full bg-slate-bg border border-slate-border text-xs text-slate-text-primary px-3 py-2 rounded-lg font-semibold focus:outline-none focus:border-cobalt disabled:opacity-60"
                    >
                      {LEAD_TIMES.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quantity selection */}
                <div className="space-y-2 border-t border-slate-border/50 pt-4">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <label className="text-slate-text-secondary">Production Quantity</label>
                    <span className="text-cobalt px-2.5 py-0.5 rounded bg-cobalt/5 border border-cobalt/15">{rfqQuantity} pieces</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="500"
                    value={rfqQuantity}
                    onChange={(e) => setRfqQuantity(parseInt(e.target.value))}
                    disabled={!rfqFile || rfqStatus === 'analyzing'}
                    className="w-full accent-cobalt disabled:opacity-60 cursor-pointer"
                  />
                  {/* Quantity guidelines */}
                  <div className="flex justify-between text-[9px] font-extrabold text-slate-text-muted uppercase tracking-wider">
                    <span>1 (Proto)</span>
                    <span>10 (Batch)</span>
                    <span>50 (Short Run -15%)</span>
                    <span>200+ (Production -45%)</span>
                  </div>
                </div>

                {/* LIVE PRICE MODEL */}
                <div className="p-4 bg-slate-bg border border-slate-border rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-border/50 pb-3">
                    <span className="text-xs font-bold text-slate-text-muted uppercase">Live Estimate Breakdown</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald font-bold">
                      <TrendingDown className="w-3.5 h-3.5" /> Amortized Setup Included
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <span className="block text-[8px] uppercase tracking-wider text-slate-text-muted font-bold">Setup Cost</span>
                      <span className="text-sm font-extrabold text-slate-text-primary">
                        {rfqFile ? `$${rfqCalculations.setupCost.toFixed(2)}` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase tracking-wider text-slate-text-muted font-bold">Unit Price (INR)</span>
                      <span className="text-sm font-extrabold text-slate-text-primary text-cobalt">
                        {rfqFile ? `₹${rfqCalculations.unitPrice.toFixed(2)}` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase tracking-wider text-slate-text-muted font-bold">Estimated Total</span>
                      <span className="text-sm font-extrabold text-coral">
                        {rfqFile ? `₹${rfqCalculations.totalPrice.toLocaleString()}` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={handleAddCustomQuoteToCart}
                  disabled={rfqStatus !== 'quoted'}
                  className="w-full btn-emerald text-xs font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-4 h-4" /> Add Custom RFQ to Cart
                </button>
              </div>
            </div>

          </div>
        </section>


        {/* SECTION 4: B2B RECENT ORDERS & SUBMISSIONS */}
        <section id="orders-section" className="space-y-6">
          <div className="border-b border-slate-border pb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-text-muted">Order History</span>
            <h2 className="text-3xl font-extrabold text-slate-text-primary tracking-tight">Your Orders</h2>
            <p className="text-xs text-slate-text-muted font-medium">Track your shop purchases and custom part orders in real time.</p>
          </div>

          <div className="bg-white border border-slate-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-bg border-b border-slate-border text-[10px] font-extrabold uppercase tracking-wider text-slate-text-muted">
                    <th className="p-4 pl-6">Order ID</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Items</th>
                    <th className="p-4">Total (INR)</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-border/50 text-xs font-semibold text-slate-text-secondary">
                  {submittedOrders.length > 0 ? (
                    submittedOrders.map((order) => (
                      <tr key={order.orderId} className="hover:bg-slate-bg/30 transition-colors">
                        <td className="p-4 pl-6 font-mono font-bold text-slate-text-primary flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${order.status === 'Shipped' ? 'bg-emerald' :
                            order.status === 'Approved' ? 'bg-cobalt' : 'bg-amber-500'
                            }`}></span>
                          {order.orderId}
                        </td>
                        <td className="p-4">{order.date}</td>
                        <td className="p-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${order.type === 'Custom Part'
                            ? 'bg-emerald/5 text-emerald border-emerald/20'
                            : 'bg-cobalt/5 text-cobalt border-cobalt/20'
                            }`}>
                            {order.type}
                          </span>
                          {order.fileAttached && (
                            <span className="block text-[9px] font-mono text-slate-text-muted mt-0.5 truncate max-w-[140px]">
                              {order.fileAttached}
                            </span>
                          )}
                        </td>
                        <td className="p-4">{order.itemsCount} Items</td>
                        <td className="p-4 text-slate-text-primary font-bold">
                          ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${order.status === 'Shipped' ? 'text-emerald' :
                            order.status === 'Approved' ? 'text-cobalt' : 'text-amber-500'
                            }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <button className="text-cobalt hover:underline cursor-pointer inline-flex items-center gap-1">
                            <Printer className="w-3 h-3" /> Print PO
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-text-muted font-medium bg-slate-bg/10">
                        No orders yet. Shop from the catalog or configure a custom part above — your orders will appear here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-text-primary text-white mt-20 border-t border-slate-text-muted/20">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded bg-cobalt text-white">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">MechItAll</span>
            </div>
            <p className="text-xs text-slate-text-muted leading-relaxed">
              Premium mechatronics parts for makers, engineers, and businesses. Instant CAD quotes for custom parts.
            </p>
            <span className="block text-[10px] text-slate-text-muted">
              © 2026 MechItAll. All rights reserved. ISO 9001:2015 compliant.
            </span>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-white border-l-2 border-cobalt pl-2">Platform</h4>
            <ul className="space-y-2 text-xs text-slate-text-muted">
              <li><button onClick={() => scrollToSection('inventory-section')} className="hover:text-white cursor-pointer">Shop Parts</button></li>
              <li><button onClick={() => scrollToSection('rfq-section')} className="hover:text-white cursor-pointer">Custom Parts Quote</button></li>
              <li><button onClick={() => scrollToSection('services-section')} className="hover:text-white cursor-pointer">Manufacturing Services</button></li>
              <li><a href="#datasheet" className="hover:text-white">Datasheets & Specs</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-white border-l-2 border-emerald pl-2">Manufacturing Services</h4>
            <ul className="space-y-2 text-xs text-slate-text-muted">
              <li><a href="#cnc" className="hover:text-white">CNC Milling & Turning</a></li>
              <li><a href="#3d" className="hover:text-white">Industrial SLS 3D Printing</a></li>
              <li><a href="#sheet" className="hover:text-white">Sheet Metal Fabrication</a></li>
              <li><a href="#alloys" className="hover:text-white">Advanced Custom Alloys</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-white border-l-2 border-amber-500 pl-2">Support & Info</h4>
            <ul className="space-y-2 text-xs text-slate-text-muted text-left">
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-cobalt" /> Secure Payments</li>
              <li className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald" /> 7-Day Easy Returns</li>
              <li className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-coral" /> Pan-India Shipping</li>
            </ul>
          </div>
        </div>
      </footer>


      {/* CART SLIDE-OVER SIDEBAR DRAWER */}
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-text-primary/20 backdrop-blur-sm z-50 transition-opacity duration-300"
            onClick={() => setIsCartOpen(false)}
          ></div>

          {/* Drawer Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white border-l border-slate-border shadow-2xl z-50 flex flex-col justify-between animate-slide-in">
            {/* Header */}
            <div className="p-5 border-b border-slate-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4.5 h-4.5 text-cobalt" />
                <h3 className="text-base font-bold text-slate-text-primary leading-tight">Shopping Cart</h3>
                <span className="text-[10px] font-bold uppercase bg-cobalt/5 text-cobalt border border-cobalt/15 px-2 py-0.5 rounded">
                  {cartSummary.itemCount} items
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded hover:bg-slate-bg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-bg/50 border border-slate-border rounded-xl space-y-3 flex flex-col"
                  >
                    {/* Item header */}
                    <div className="flex items-start justify-between gap-4">
                      {item.isCustomQuote && item.customDetails ? (
                        <div>
                          <span className="block text-[8px] uppercase tracking-wider text-emerald font-extrabold">Custom Manufactured RFQ</span>
                          <h4 className="text-xs font-bold text-slate-text-primary truncate max-w-[240px] flex items-center gap-1 font-mono">
                            {item.customDetails.fileName}
                          </h4>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="text-[8px] bg-emerald/5 text-emerald border border-emerald/25 px-1 py-0.5 rounded font-medium">
                              {item.customDetails.processName}
                            </span>
                            <span className="text-[8px] bg-slate-border/30 text-slate-text-secondary px-1 py-0.5 rounded font-medium">
                              {item.customDetails.materialName}
                            </span>
                          </div>
                        </div>
                      ) : item.part ? (
                        <div>
                          <span className="block text-[8px] uppercase tracking-wider text-cobalt font-extrabold">{item.part.category}</span>
                          <h4 className="text-xs font-bold text-slate-text-primary hover:text-cobalt cursor-pointer transition-colors" onClick={() => { setSelectedPart(item.part!); setIsCartOpen(false); }}>
                            {item.part.title}
                          </h4>
                          <span className="text-[8px] font-mono text-slate-text-muted">{item.part.partNumber}</span>
                        </div>
                      ) : null}

                      {/* Remove */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-text-muted hover:text-coral transition-colors p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quantity Adjustment and Subtotal */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-border/30 mt-1">
                      {/* Interactive adjust */}
                      <div className="flex items-center border border-slate-border bg-white rounded-md">
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 text-slate-text-muted hover:text-slate-text-primary"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-xs font-bold text-slate-text-primary min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 text-slate-text-muted hover:text-slate-text-primary"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Financial info */}
                      <div className="text-right">
                        <div className="text-[10px] text-slate-text-muted">
                          ₹{item.pricePerUnit.toFixed(2)}/unit
                        </div>
                        <div className="text-xs font-bold text-slate-text-primary">
                          ₹{(item.pricePerUnit * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20 text-slate-text-muted">
                  <ShoppingCart className="w-12 h-12 text-slate-text-muted/30" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-text-primary">Your cart is empty</p>
                    <p className="text-[10px] text-slate-text-muted max-w-[220px]">Browse the parts catalog or configure a custom part to get started.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Calculations and CTA */}
            <div className="p-5 border-t border-slate-border bg-slate-bg/50 space-y-4">
              <div className="space-y-2 text-[11px] font-bold">
                <div className="flex justify-between text-slate-text-secondary">
                  <span>Cart Subtotal</span>
                  <span>₹{cartSummary.subtotal.toFixed(2)}</span>
                </div>

                {/* Volume Discount indicator */}
                {cartSummary.subtotal >= 1500 ? (
                  <div className="flex justify-between text-emerald">
                    <span>Bulk Discount ({cartSummary.discountRatePercent}%)</span>
                    <span>-₹{cartSummary.discount.toFixed(2)}</span>
                  </div>
                ) : cartSummary.subtotal > 0 ? (
                  <div className="p-2 bg-cobalt/5 border border-cobalt/15 rounded flex items-center justify-between text-cobalt">
                    <span>Add ₹{(1500 - cartSummary.subtotal).toFixed(2)} more for 8% bulk discount</span>
                  </div>
                ) : null}

                <div className="flex justify-between text-slate-text-secondary">
                  <span>Shipping</span>
                  <span>{cartSummary.shipping === 0 ? 'FREE' : `₹${cartSummary.shipping.toFixed(2)}`}</span>
                </div>

                <div className="flex justify-between text-slate-text-secondary">
                  <span>GST (18%)</span>
                  <span>₹{cartSummary.tax.toFixed(2)}</span>
                </div>

                <div className="border-t border-slate-border/50 my-1 pt-2 flex justify-between text-slate-text-primary text-sm font-extrabold">
                  <span>Order Total</span>
                  <span className="text-coral">₹{cartSummary.total.toFixed(2)} INR</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || checkoutStatus === 'submitting'}
                className="w-full btn-cobalt text-xs font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutStatus === 'submitting' ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    Processing your order...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Place Order Securely
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}


      {/* SPEC SHEET DETAILED MODAL */}
      {selectedPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-text-primary/45 backdrop-blur-sm"
            onClick={() => setSelectedPart(null)}
          ></div>

          {/* Modal Container */}
          <div className="bg-white border border-slate-border rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row h-[550px]">

            {/* Left Col: stylized gradient image placeholder + basic stats */}
            <div className={`md:w-5/12 bg-gradient-to-br ${selectedPart.gradientClass} p-6 flex flex-col justify-between relative`}>
              <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px] pointer-events-none"></div>

              {/* Logo block */}
              <div className="z-10 flex justify-between items-start">
                <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider bg-white/90 text-slate-text-primary shadow-sm border border-slate-border/50">
                  {selectedPart.category}
                </span>

                <span className="text-[10px] text-slate-text-primary/70 font-mono font-bold bg-white/40 px-1.5 py-0.5 rounded backdrop-blur-md">
                  {selectedPart.extendedSpecs.ingressProtection}
                </span>
              </div>

              {/* Central stylized graphics representation */}
              <div className="z-10 flex flex-col items-center justify-center py-6 text-center space-y-3">
                <Cpu className="w-16 h-16 text-slate-text-primary/20 animate-pulse" />
                <div>
                  <span className="block font-mono text-[9px] text-slate-text-primary/60 tracking-wider font-extrabold">CAD SOLID LAYER</span>
                  <span className="block text-[10px] text-slate-text-primary/80 font-bold font-mono border-t border-slate-text-primary/20 pt-1">
                    {selectedPart.cadFile}
                  </span>
                </div>
              </div>

              {/* Key ratings info footer */}
              <div className="z-10 space-y-1.5">
                <div className="text-[9px] uppercase tracking-wider text-slate-text-primary/60 font-bold">Lifespan & Thermal</div>
                <div className="grid grid-cols-2 gap-2 text-slate-text-primary text-[10px] font-bold font-mono">
                  <div className="bg-white/45 p-1.5 rounded backdrop-blur-md">
                    <span className="block text-[7px] text-slate-text-primary/60 uppercase font-bold">MTBF</span>
                    {selectedPart.extendedSpecs.mtbf}
                  </div>
                  <div className="bg-white/45 p-1.5 rounded backdrop-blur-md">
                    <span className="block text-[7px] text-slate-text-primary/60 uppercase font-bold">Oper Temp</span>
                    {selectedPart.extendedSpecs.temperatureRange}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: details and configuration tabs */}
            <div className="md:w-7/12 flex flex-col justify-between bg-white">

              {/* Top Details & Tab Selector */}
              <div className="p-6 pb-2 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono font-bold text-slate-text-muted tracking-wider uppercase">
                      {selectedPart.partNumber}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-text-primary leading-tight">
                      {selectedPart.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedPart(null)}
                    className="p-1 rounded hover:bg-slate-bg text-slate-text-muted hover:text-slate-text-primary transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-slate-border flex gap-4 text-xs font-bold">
                  {([
                    { id: 'specs', label: 'Technical Specs' },
                    { id: 'pricing', label: 'Volume Discounts' },
                    { id: 'cad', label: 'CAD & Docs' }
                  ] as const).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSpecModalTab(tab.id)}
                      className={`pb-2 border-b-2 transition-all cursor-pointer ${specModalTab === tab.id
                        ? 'border-cobalt text-cobalt font-extrabold'
                        : 'border-transparent text-slate-text-muted hover:text-slate-text-secondary'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Center Content */}
              <div className="flex-1 overflow-y-auto px-6 py-2">

                {/* Specs Tab */}
                {specModalTab === 'specs' && (
                  <div className="space-y-4 text-xs">
                    <p className="text-slate-text-secondary leading-relaxed">
                      {selectedPart.description}
                    </p>

                    <div className="border border-slate-border rounded-lg overflow-hidden divide-y divide-slate-border/50">
                      {Object.entries(selectedPart.specs).map(([key, val]) => (
                        <div key={key} className="grid grid-cols-2 p-2 bg-slate-bg/30 font-medium">
                          <span className="text-slate-text-muted pl-1">{key}</span>
                          <span className="text-slate-text-primary font-bold">{val}</span>
                        </div>
                      ))}
                      <div className="grid grid-cols-2 p-2 bg-slate-bg/30 font-medium">
                        <span className="text-slate-text-muted pl-1">Envelope Size</span>
                        <span className="text-slate-text-primary font-bold">{selectedPart.extendedSpecs.dimensions}</span>
                      </div>
                      {selectedPart.extendedSpecs.electricalRating && (
                        <div className="grid grid-cols-2 p-2 bg-slate-bg/30 font-medium">
                          <span className="text-slate-text-muted pl-1">Electrical Rating</span>
                          <span className="text-slate-text-primary font-bold">{selectedPart.extendedSpecs.electricalRating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Volume Discounts Tab */}
                {specModalTab === 'pricing' && (
                  <div className="space-y-4">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-text-muted">
                      Enterprise Tier Matrix
                    </span>

                    <div className="space-y-2">
                      {selectedPart.bulkPricing.map((tier, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 border border-slate-border/50 rounded-lg bg-slate-bg/30"
                        >
                          <span className="text-xs font-bold text-slate-text-primary">
                            Order {tier.minQty}{tier.maxQty ? ` to ${tier.maxQty}` : '+'} units
                          </span>
                          <div className="text-right">
                            <span className="text-xs font-extrabold text-emerald">₹{tier.pricePerUnit.toFixed(2)}</span>
                            <span className="text-[9px] text-slate-text-muted block font-bold">INR/unit</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-cobalt/5 border border-cobalt/15 p-3 rounded-lg flex items-start gap-2 text-[10px] text-slate-text-secondary leading-relaxed">
                      <Info className="w-4 h-4 text-cobalt flex-shrink-0 mt-0.5" />
                      <span>
                        Pricing matrix updates live in the cart according to aggregated component quantities. Net-30 payment term invoicing applies globally at checkout.
                      </span>
                    </div>
                  </div>
                )}

                {/* CAD & Docs Tab */}
                {specModalTab === 'cad' && (
                  <div className="space-y-4 text-xs font-medium text-slate-text-secondary">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-text-muted">
                      Technical Documents
                    </span>

                    <div className="space-y-3">
                      <a
                        href={selectedPart.datasheetUrl}
                        className="flex items-center justify-between p-3 border border-slate-border rounded-lg hover:border-cobalt hover:bg-slate-bg/30 transition-all text-slate-text-primary font-bold cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span className="p-1 rounded bg-red-100 text-coral">PDF</span>
                          Technical Datasheet (Full Specs)
                        </span>
                        <Download className="w-4 h-4 text-slate-text-muted" />
                      </a>

                      <a
                        href={`#cad-file-${selectedPart.cadFile}`}
                        className="flex items-center justify-between p-3 border border-slate-border rounded-lg hover:border-cobalt hover:bg-slate-bg/30 transition-all text-slate-text-primary font-bold cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span className="p-1 rounded bg-blue-100 text-cobalt">STEP</span>
                          3D Solid Model File (.step)
                        </span>
                        <Download className="w-4 h-4 text-slate-text-muted" />
                      </a>
                    </div>

                    <div className="p-3 bg-slate-bg/50 border border-slate-border/50 rounded-lg text-[10px] leading-relaxed">
                      <strong>Note:</strong> All CAD files comply with STEP AP203/AP214 standards. Double-check absolute envelopes in your native solid modeler (SolidWorks, Inventor, Fusion360) prior to production tooling assemblies.
                    </div>
                  </div>
                )}

              </div>

              {/* Bottom Quantity Select & Add to Cart */}
              <div className="p-6 border-t border-slate-border bg-slate-bg/50 flex items-center justify-between gap-4">
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-text-muted font-bold">Qty Price (INR)</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-extrabold text-coral">
                      ₹{(getPartPriceForQuantity(selectedPart, modalQuantity) * modalQuantity).toFixed(2)}
                    </span>
                    <span className="text-[9px] text-slate-text-muted font-bold">INR</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Selector */}
                  <div className="flex items-center border border-slate-border bg-white rounded-md h-9">
                    <button
                      onClick={() => setModalQuantity(q => Math.max(1, q - 1))}
                      className="px-2.5 text-slate-text-muted hover:text-slate-text-primary"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-slate-text-primary min-w-[20px] text-center">
                      {modalQuantity}
                    </span>
                    <button
                      onClick={() => setModalQuantity(q => q + 1)}
                      className="px-2.5 text-slate-text-muted hover:text-slate-text-primary"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add */}
                  <button
                    onClick={() => { handleAddToCart(selectedPart, modalQuantity); setSelectedPart(null); }}
                    className="btn-cobalt text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer flex items-center gap-1.5 h-9"
                  >
                    <ShoppingCart className="w-4 h-4" /> Add to PO
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}


      {/* ORDER/RFQ CHECKOUT SUCCESS DIALOG */}
      {checkoutStatus === 'success' && lastPlacedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-text-primary/45 backdrop-blur-sm"></div>

          <div className="bg-white border border-slate-border rounded-2xl w-full max-w-md p-6 text-center shadow-2xl relative z-10 space-y-6 animate-slide-in">
            <div className="w-16 h-16 rounded-full bg-emerald/10 border border-emerald/20 text-emerald flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald">Order Confirmed</span>
              <h3 className="text-xl font-extrabold text-slate-text-primary tracking-tight">Order Placed Successfully!</h3>
              <p className="text-xs text-slate-text-muted leading-relaxed max-w-sm mx-auto">
                Your order is being packed and will be dispatched within 24 hours. A confirmation has been sent to your account.
              </p>
            </div>

            {/* PO details */}
            <div className="p-4 bg-slate-bg border border-slate-border rounded-xl space-y-2 text-left text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-slate-text-muted">Order ID:</span>
                <span className="text-slate-text-primary font-mono font-bold">{lastPlacedOrder.orderId}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-text-muted">Order Total (INR):</span>
                <span className="text-slate-text-primary font-bold">₹{lastPlacedOrder.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-text-muted">Est. Delivery:</span>
                <span className="text-emerald font-bold">1–2 Business Days</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-text-muted">Est. Dispatch Date:</span>
                <span className="text-slate-text-primary font-bold">2026-07-06 (24 hours)</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setCheckoutStatus('idle')}
                className="flex-1 btn-secondary text-xs font-bold py-2.5 rounded-lg cursor-pointer"
              >
                Back to Catalog
              </button>
              <button
                onClick={() => { setCheckoutStatus('idle'); scrollToSection('orders-section'); }}
                className="flex-1 btn-cobalt text-xs font-bold py-2.5 rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                <History className="w-4 h-4" /> Track My Orders
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
