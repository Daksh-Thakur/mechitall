'use client';

import React from 'react';
import { X, Wrench, Clock, Check, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

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
  };
  onClose: () => void;
}

export default function ServiceModal({ service, onClose }: ServiceModalProps) {
  const featuresList: string[] = Array.isArray(service.features)
    ? service.features
    : typeof service.features === 'string'
    ? JSON.parse(service.features || '[]')
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-text-primary/45 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal Container */}
      <div className="bg-white border border-slate-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row h-[480px]">
        
        {/* Left pane - Gradient visual */}
        <div className={`md:w-5/12 bg-gradient-to-br ${service.gradient_class || 'from-cobalt/20 to-cobalt/5'} p-6 flex flex-col justify-between relative`}>
          <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px] pointer-events-none"></div>
          <div className="z-10 flex justify-between items-start">
            <span className="px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest bg-white/90 text-slate-text-primary shadow-sm border border-slate-border/50">
              {service.category}
            </span>
          </div>
          
          <div className="z-10 flex flex-col items-center justify-center py-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-white/40 flex items-center justify-center backdrop-blur-md border border-white/40">
              <Wrench className="w-7 h-7 text-slate-text-primary/80 animate-pulse" />
            </div>
            <div>
              <span className="block font-mono text-[9px] text-slate-text-primary/60 tracking-wider font-extrabold">MANUFACTURING FLOW</span>
              <span className="block text-[10px] text-slate-text-primary/80 font-bold font-mono border-t border-slate-text-primary/20 pt-1">
                {service.lead_time}
              </span>
            </div>
          </div>
          
          <div className="z-10 bg-white/40 border border-white/20 p-3 rounded-lg backdrop-blur-md text-[10px] font-bold text-slate-text-primary flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>ISO 9001:2015 &amp; AS9100D manufacturing facilities verified.</span>
          </div>
        </div>

        {/* Right pane - Service Details */}
        <div className="md:w-7/12 flex flex-col justify-between bg-white p-6">
          <div className="space-y-5 overflow-y-auto max-h-[340px] pr-1">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-[9px] font-mono font-bold text-slate-text-muted tracking-wider uppercase">SERVICE DETAILS</span>
                <h3 className="text-lg font-extrabold text-slate-text-primary leading-tight mt-0.5">{service.title}</h3>
              </div>
              <button 
                onClick={onClose} 
                className="p-1 rounded hover:bg-slate-bg text-slate-text-muted hover:text-slate-text-primary transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-text-secondary leading-relaxed font-semibold">
              {service.description}
            </p>

            {/* Features check list */}
            {featuresList.length > 0 && (
              <div className="space-y-2">
                <span className="text-[9px] font-mono font-extrabold text-slate-text-muted uppercase tracking-wider block">CAPABILITIES INCLUDED</span>
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

          {/* Pricing and Action Button */}
          <div className="pt-4 border-t border-slate-border flex items-center justify-between gap-4 mt-auto">
            <div>
              <span className="block text-[9px] uppercase tracking-wider text-slate-text-muted font-bold">Estimated Cost</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-extrabold text-coral">₹{Number(service.base_price).toFixed(2)}</span>
                <span className="text-[10px] text-slate-text-muted font-bold">Base</span>
              </div>
            </div>
            
            <Link
              href="/machining#rfq"
              onClick={onClose}
              className="btn-emerald text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
            >
              Configure RFQ <Clock className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
