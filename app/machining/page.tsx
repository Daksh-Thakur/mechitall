'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ServiceModal from '../../components/ServiceModal';
import { createClient } from '@/utils/supabase/client';
import {
  MFG_PROCESSES,
  MATERIALS,
  FINISHES,
  LEAD_TIMES,
} from '../../components/mockData';
import { useCart } from '../../components/CartProvider';
import {
  CheckCircle2,
  ChevronRight,
  FileUp,
  Activity,
  Sliders,
  TrendingDown,
  Trash2,
  ShoppingCart,
} from 'lucide-react';

export default function MachiningPage() {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<any | null>(null);

  // RFQ State
  const [rfqFile, setRfqFile] = useState<{ name: string; size: number } | null>(null);
  const [rfqStatus, setRfqStatus] = useState<'idle' | 'analyzing' | 'quoted' | 'submitted'>('idle');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [selectedProcess, setSelectedProcess] = useState(MFG_PROCESSES[0].id);
  const [selectedMaterial, setSelectedMaterial] = useState(MATERIALS[0].id);
  const [selectedFinish, setSelectedFinish] = useState(FINISHES[0].id);
  const [selectedLeadTime, setSelectedLeadTime] = useState(LEAD_TIMES[0].id);
  const [rfqQuantity, setRfqQuantity] = useState(10);

  const { addCustomQuoteToCart } = useCart();

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const { data: servicesData } = await supabase.from('services').select('*');
        setServices(servicesData || []);
      } catch (err) {
        console.error('Error loading services:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // RFQ Simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (rfqStatus === 'analyzing') {
      const messages = [
        { progress: 10, text: 'Opening file and reading boundary envelope...' },
        { progress: 30, text: 'Executing mesh structural analysis and volume integrals...' },
        { progress: 60, text: 'Running dynamic toolpath & machining feasibility simulation...' },
        { progress: 85, text: 'Validating CNC setup orientation & estimating setup costs...' },
        { progress: 100, text: 'Live quote generated!' },
      ];
      timer = setInterval(() => {
        setAnalysisProgress(prev => {
          const next = prev + 5;
          const msg = messages.find(m => next >= m.progress) || messages[0];
          setAnalysisMessage(msg.text);
          if (next >= 100) { clearInterval(timer); setRfqStatus('quoted'); return 100; }
          return next;
        });
      }, 150);
    }
    return () => clearInterval(timer);
  }, [rfqStatus]);

  const rfqCalculations = useMemo(() => {
    if (!rfqFile) return { unitPrice: 0, totalPrice: 0, setupCost: 0, materialCost: 0, weight: 0 };
    const proc = MFG_PROCESSES.find(p => p.id === selectedProcess) || MFG_PROCESSES[0];
    const mat = MATERIALS.find(m => m.id === selectedMaterial) || MATERIALS[0];
    const fin = FINISHES.find(f => f.id === selectedFinish) || FINISHES[0];
    const lead = LEAD_TIMES.find(l => l.id === selectedLeadTime) || LEAD_TIMES[0];
    const volumeCm3 = 145.2;
    const weightG = volumeCm3 * mat.densityGcm3;
    const weightKg = weightG / 1000;
    const setupCost = proc.baseCost;
    const rawMaterialCost = weightKg * mat.pricePerKg;
    let baseRate = 80;
    if (proc.id.includes('5')) baseRate = 160;
    if (proc.id.includes('sls')) baseRate = 40;
    if (proc.id.includes('sla')) baseRate = 50;
    let materialMachiningMod = 1.0;
    if (mat.machClass === 'hard') materialMachiningMod = 1.45;
    if (mat.machClass === 'extreme') materialMachiningMod = 2.8;
    if (mat.machClass === 'easy') materialMachiningMod = 0.85;
    const machiningHours = 1.2 * proc.complexityMultiplier;
    const machiningCost = machiningHours * baseRate * materialMachiningMod;
    let unitCost = (machiningCost + rawMaterialCost) * fin.costMultiplier;
    let qtyDiscount = 1.0;
    if (rfqQuantity >= 10 && rfqQuantity < 50) qtyDiscount = 0.85;
    if (rfqQuantity >= 50 && rfqQuantity < 200) qtyDiscount = 0.70;
    if (rfqQuantity >= 200) qtyDiscount = 0.55;
    unitCost = unitCost * lead.priceMultiplier * qtyDiscount;
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setRfqFile({ name: file.name, size: file.size });
      setAnalysisProgress(0);
      setRfqStatus('analyzing');
    }
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

  const handleAddToCart = () => {
    if (!rfqFile) return;
    const proc = MFG_PROCESSES.find(p => p.id === selectedProcess) || MFG_PROCESSES[0];
    const mat = MATERIALS.find(m => m.id === selectedMaterial) || MATERIALS[0];
    const fin = FINISHES.find(f => f.id === selectedFinish) || FINISHES[0];
    const lead = LEAD_TIMES.find(l => l.id === selectedLeadTime) || LEAD_TIMES[0];
    addCustomQuoteToCart({
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
        weight: rfqCalculations.weight,
      },
    });
    setRfqFile(null);
    setRfqStatus('idle');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col">
      <Navbar />

      {/* Page Header*/}
      <div className="bg-white border-b border-slate-border">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <h1 className="text-4xl font-extrabold text-slate-text-primary tracking-tight mt-1">Custom Machining &amp; Services</h1>
          <p className="text-sm text-slate-text-muted font-medium mt-2 max-w-xl">
            Transform your designs into high-precision parts. Partner with our certified engineering team for high-precision mechatronics assembly, CNC milling, SLA/SLS 3D printing, and design consultation.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 space-y-16">
        {/* SERVICES GRID */}
        <section className="space-y-6">
          {/*<div className="border-b border-slate-border pb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald">Capabilities</span>
            <h2 className="text-3xl font-extrabold text-slate-text-primary tracking-tight">All Manufacturing Services</h2>
            <p className="text-xs text-slate-text-muted font-medium">Partner with our certified engineering team for high-precision mechatronics assembly, CNC milling, SLA/SLS 3D printing, and design consultation.</p>
          </div>*/}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="h-64 bg-slate-bg/30 border border-slate-border/50 rounded-2xl p-6 space-y-4">
                  <div className="h-4 bg-slate-border w-20 rounded"></div>
                  <div className="h-6 bg-slate-border w-3/4 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className={`relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer ${service.gradient_class || 'border-slate-border/80'}`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border bg-emerald/5 text-emerald border-emerald/20">{service.category}</span>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-text-muted">{service.lead_time}</span>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-slate-text-primary tracking-tight">{service.title}</h3>
                      <p className="text-xs text-slate-text-secondary leading-relaxed font-medium">{service.description}</p>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById('rfq')?.scrollIntoView({ behavior: 'smooth' });
                      }}
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
        {/* RFQ CONFIGURATOR */}
        <section id="rfq" className="space-y-6">
          <div className="border-b border-slate-border pb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald">Instant Quote</span>
            <h2 className="text-3xl font-extrabold text-slate-text-primary tracking-tight">On-Demand Manufacturing Quote</h2>
            <p className="text-xs text-slate-text-muted font-medium">Upload industrial design files (STEP, STL, PDF) for automated thickness, volume, and material cost modelling.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Upload + status */}
            <div className="lg:col-span-5 space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={`bg-white border-2 border-dashed rounded-2xl p-8 text-center transition-all ${rfqStatus === 'analyzing'
                  ? 'border-cobalt bg-cobalt/5'
                  : rfqFile
                    ? 'border-emerald/40 bg-emerald/5'
                    : 'border-slate-border hover:border-cobalt/50 hover:bg-slate-bg/30'}`}
              >
                <input type="file" id="cad-upload-input" className="hidden" accept=".step,.stp,.stl,.igs,.iges,.pdf,.dwg" onChange={handleFileUpload} disabled={rfqStatus === 'analyzing'} />
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-slate-bg border border-slate-border text-slate-text-secondary rounded-xl flex items-center justify-center mx-auto shadow-sm">
                    <FileUp className="w-6 h-6 text-slate-text-muted" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="cad-upload-input" className="text-xs font-bold text-cobalt hover:underline cursor-pointer">Click to upload 3D CAD/PDF</label>
                    <span className="block text-xs text-slate-text-secondary font-medium">or drag and drop file here</span>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-text-muted font-bold">STEP, STL, IGES, DXF, PDF (Max 50MB)</span>
                  </div>
                </div>
              </div>

              {rfqStatus === 'analyzing' && (
                <div className="bg-white border border-slate-border p-4 rounded-xl space-y-3 glow-cobalt animate-pulse-ring-cobalt">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-text-primary">
                    <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-cobalt animate-spin" /> CAD Geometry Parsing...</span>
                    <span>{analysisProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-bg h-2 rounded-full overflow-hidden border border-slate-border/50">
                    <div className="bg-gradient-to-r from-cobalt to-emerald h-full transition-all duration-150" style={{ width: `${analysisProgress}%` }}></div>
                  </div>
                  <p className="text-[10px] text-slate-text-muted font-mono leading-tight">{analysisMessage}</p>
                </div>
              )}

              {rfqStatus === 'idle' && (
                <div className="bg-slate-bg/50 border border-slate-border p-4 rounded-xl space-y-2">
                  <span className="block text-[9px] uppercase tracking-widest text-slate-text-muted font-bold">Automated RFQ Process</span>
                  <div className="space-y-1.5 text-xs text-slate-text-secondary">
                    {['Drop boundary solid file (.step / .stl)', 'Configure machining processes & custom alloys', 'Order 1 or more — prototypes and bulk runs welcome', 'Add to cart and pay online — fast, secure delivery'].map((step, i) => (
                      <p key={i} className="font-semibold flex items-center gap-1.5">
                        <span className="inline-flex w-4 h-4 rounded-full bg-slate-border text-slate-text-primary items-center justify-center text-[9px] shrink-0">{i + 1}</span>
                        {step}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {rfqStatus === 'quoted' && rfqFile && (
                <div className="bg-white border border-slate-border p-4 rounded-xl space-y-3 glow-emerald">
                  <div className="flex items-center justify-between border-b border-slate-border/50 pb-2">
                    <div>
                      <span className="block text-[8px] uppercase tracking-wider text-emerald font-extrabold">CAD Analyzed</span>
                      <span className="block text-xs font-bold text-slate-text-primary truncate max-w-[200px]">{rfqFile.name}</span>
                    </div>
                    <button onClick={() => { setRfqFile(null); setRfqStatus('idle'); }} className="text-slate-text-muted hover:text-coral transition-colors" title="Remove file">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[11px] font-bold">
                    {[
                      { label: 'Envelope Volume', value: '145.20 cm³' },
                      { label: 'Est. Part Weight', value: `${rfqCalculations.weight} grams`, cls: 'text-emerald' },
                      { label: 'Bounding Box', value: '10.4 x 6.8 x 2.2 cm' },
                      { label: 'DFM Violations', value: '0 Detected', cls: 'text-emerald' },
                    ].map(({ label, value, cls }) => (
                      <div key={label} className="p-2 bg-slate-bg rounded border border-slate-border/50">
                        <span className="block text-slate-text-muted text-[8px] uppercase">{label}</span>
                        <span className={`text-xs ${cls || 'text-slate-text-primary'}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Config form */}
            <div className="lg:col-span-7">
              <div className="bg-white border border-slate-border rounded-2xl p-6 glow-cobalt space-y-6">
                <div className="flex items-center justify-between border-b border-slate-border pb-4">
                  <h3 className="text-base font-bold text-slate-text-primary flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-cobalt" /> Quote Configurator
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-text-muted">RFQ v4.8</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Process', value: selectedProcess, onChange: setSelectedProcess, options: MFG_PROCESSES.map(p => ({ id: p.id, name: p.name })) },
                    { label: 'Material / Alloy', value: selectedMaterial, onChange: setSelectedMaterial, options: MATERIALS.map(m => ({ id: m.id, name: m.name })) },
                    { label: 'Surface Treatment', value: selectedFinish, onChange: setSelectedFinish, options: FINISHES.map(f => ({ id: f.id, name: f.name })) },
                    { label: 'Production Speed', value: selectedLeadTime, onChange: setSelectedLeadTime, options: LEAD_TIMES.map(l => ({ id: l.id, name: l.name })) },
                  ].map(({ label, value, onChange, options }) => (
                    <div key={label} className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-text-secondary">{label}</label>
                      <select
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={!rfqFile || rfqStatus === 'analyzing'}
                        className="w-full bg-slate-bg border border-slate-border text-xs text-slate-text-primary px-3 py-2 rounded-lg font-semibold focus:outline-none focus:border-cobalt disabled:opacity-60"
                      >
                        {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                {/* Quantity */}
                <div className="space-y-2 border-t border-slate-border/50 pt-4">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <label className="text-slate-text-secondary">Production Quantity</label>
                    <span className="text-cobalt px-2.5 py-0.5 rounded bg-cobalt/5 border border-cobalt/15">{rfqQuantity} pieces</span>
                  </div>
                  <input type="range" min="1" max="500" value={rfqQuantity} onChange={(e) => setRfqQuantity(parseInt(e.target.value))} disabled={!rfqFile || rfqStatus === 'analyzing'} className="w-full accent-cobalt disabled:opacity-60 cursor-pointer" />
                  <div className="flex justify-between text-[9px] font-extrabold text-slate-text-muted uppercase tracking-wider">
                    <span>1 (Proto)</span><span>10 (Batch)</span><span>50 (Short Run -15%)</span><span>200+ (-45%)</span>
                  </div>
                </div>

                {/* Price breakdown */}
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
                      <span className="text-sm font-extrabold text-slate-text-primary">{rfqFile ? `₹${rfqCalculations.setupCost.toFixed(2)}` : '—'}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase tracking-wider text-slate-text-muted font-bold">Unit Price (INR)</span>
                      <span className="text-sm font-extrabold text-cobalt">{rfqFile ? `₹${rfqCalculations.unitPrice.toFixed(2)}` : '—'}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase tracking-wider text-slate-text-muted font-bold">Estimated Total</span>
                      <span className="text-sm font-extrabold text-coral">{rfqFile ? `₹${rfqCalculations.totalPrice.toLocaleString()}` : '—'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={rfqStatus !== 'quoted'}
                  className="w-full btn-emerald text-xs font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-4 h-4" /> Add Custom RFQ to Cart
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {selectedService && (
        <ServiceModal service={selectedService} onClose={() => setSelectedService(null)} />
      )}
    </div>
  );
}
