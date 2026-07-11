'use client';

import React from 'react';
import { Clock, SlidersHorizontal, Settings, Layers, Zap, ArrowRight } from 'lucide-react';
import { MachiningService } from '@/app/actions/marketplace';

interface ServiceCardProps {
  service: MachiningService;
  onGetQuote: (service: MachiningService) => void;
}

export default function ServiceCard({ service, onGetQuote }: ServiceCardProps) {
  const gradientClass =
    service.process_type === 'CNC Machining'
      ? 'from-blue-600/20 to-indigo-600/5'
      : service.process_type === '3D Printing'
      ? 'from-violet-500/20 to-purple-500/5'
      : service.process_type === 'Sheet Metal'
      ? 'from-amber-500/20 to-orange-500/5'
      : 'from-red-500/20 to-pink-500/5';

  const ProcessIcon =
    service.process_type === 'CNC Machining'
      ? Settings
      : service.process_type === '3D Printing'
      ? Layers
      : service.process_type === 'Sheet Metal'
      ? SlidersHorizontal
      : Zap;

  return (
    <>
      {/* ─── DESKTOP CARD (portrait) ─── */}
      <div
        onClick={() => onGetQuote(service)}
        className="hidden md:flex flex-col bg-zinc-800 border border-zinc-700/60 overflow-hidden cursor-pointer group
          transition-all duration-205 hover:border-blue-500 relative rounded-xl"
        style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -2px rgba(0,0,0,0.2)', transition: 'transform 0.2s ease, border-color 0.2s ease' }}
        onMouseEnter={e => {
          if (typeof window !== 'undefined' && window.innerWidth >= 768) {
            e.currentTarget.style.transform = 'translateY(-4px)';
          }
        }}
        onMouseLeave={e => {
          if (typeof window !== 'undefined' && window.innerWidth >= 768) {
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        {/* Visual representation / icon header */}
        <div className="h-40 bg-zinc-900/50 overflow-hidden relative border-b border-zinc-850">
          <div className={`w-full h-full bg-gradient-to-br ${gradientClass} group-hover:scale-105 transition-transform duration-500 flex items-center justify-center`}>
            <ProcessIcon className="w-12 h-12 text-white opacity-25 group-hover:rotate-12 transition-transform duration-500" />
          </div>
          {/* Lead time badge */}
          <div className="absolute top-2 right-2">
            <span className="bg-zinc-900 text-zinc-400 text-[9px] font-mono px-1.5 py-0.5 uppercase tracking-wider flex items-center gap-1 font-bold border border-zinc-750 rounded">
              <Clock className="w-2.5 h-2.5" /> {service.lead_time}
            </span>
          </div>
          {/* Process type badge */}
          <div className="absolute top-2 left-2">
            <span className={`text-[9px] font-mono px-1.5 py-0.5 uppercase tracking-wider border font-bold ${
              service.process_type === 'CNC Machining' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              : service.process_type === '3D Printing' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
              : service.process_type === 'Sheet Metal' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {service.process_type}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col flex-1 text-zinc-100">
          <div className="mb-3">
            <h3 className="font-['Space_Grotesk'] text-sm font-semibold text-white leading-tight group-hover:text-blue-400 transition-colors line-clamp-1">
              {service.title}
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5 font-semibold">by {service.seller_name}</p>
          </div>

          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4">{service.description}</p>

          {/* Specs / Capability grid */}
          <div className="grid grid-cols-2 gap-y-2.5 mb-4 border-t border-zinc-750/60 pt-3">
            <div>
              <p className="font-['JetBrains_Mono'] text-[9px] text-zinc-500 uppercase tracking-wider mb-0.5">Materials</p>
              <p className="font-['Inter'] text-xs text-zinc-300 truncate pr-2 font-semibold" title={service.material_capabilities?.join(', ')}>
                {service.material_capabilities?.slice(0, 2).join(', ')}
                {service.material_capabilities?.length > 2 && '...'}
              </p>
            </div>
            <div>
              <p className="font-['JetBrains_Mono'] text-[9px] text-zinc-500 uppercase tracking-wider mb-0.5">Finishes</p>
              <p className="font-['Inter'] text-xs text-zinc-300 truncate pr-2 font-semibold" title={service.finish_options?.join(', ')}>
                {service.finish_options?.slice(0, 2).join(', ')}
                {service.finish_options?.length > 2 && '...'}
              </p>
            </div>
          </div>

          {/* Setup Fee + CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-750/60 mt-auto">
            <div>
              <p className="text-[9px] font-['Inter'] text-zinc-400 uppercase tracking-wider mb-0.5">Setup Fee</p>
              <p className="font-['Space_Grotesk'] text-sm font-bold text-white font-mono">
                ₹{Number(service.base_price).toLocaleString('en-IN')}
              </p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onGetQuote(service); }}
              className="px-3.5 py-2 bg-blue-500 text-zinc-950 hover:bg-blue-600 transition-colors flex items-center justify-center gap-1.5 font-bold text-xs font-['Inter'] cursor-pointer rounded-lg border-none"
            >
              <span>Get Quote</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── MOBILE CARD (horizontal) ─── */}
      <div
        onClick={() => onGetQuote(service)}
        className="md:hidden flex bg-zinc-800 border border-zinc-700/60 overflow-hidden cursor-pointer product-card-mobile active:scale-[0.98] transition-transform w-full rounded-xl"
      >
        {/* Left: visual 1/3 */}
        <div className="w-1/3 relative bg-zinc-900/50 border-r border-zinc-800 shrink-0">
          <div className={`w-full h-full min-h-[120px] bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
            <ProcessIcon className="w-8 h-8 text-white opacity-20" />
          </div>
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <span className="bg-zinc-900 text-zinc-400 border border-zinc-750 text-[8px] font-mono px-1.5 py-0.5 uppercase tracking-wider rounded">
              {service.process_type.slice(0, 4).toUpperCase()}
            </span>
            <span className="bg-emerald-400 text-zinc-950 text-[8px] font-mono px-1.5 py-0.5 uppercase tracking-wider font-bold rounded">
              {service.lead_time.split(' ')[0]} DAYS
            </span>
          </div>
        </div>

        {/* Right: details 2/3 */}
        <div className="w-2/3 p-3 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-0.5">
              <span className="font-['JetBrains_Mono'] text-[9px] text-zinc-400 uppercase tracking-widest truncate max-w-[100px] font-bold">
                by {service.seller_name}
              </span>
              <span className="font-['JetBrains_Mono'] text-[10px] font-semibold text-white">
                ₹{Number(service.base_price).toLocaleString('en-IN')}
              </span>
            </div>
            <h3 className="font-['Space_Grotesk'] text-xs font-semibold text-white leading-tight mb-2">
              {service.title}
            </h3>

            {/* Spec grid */}
            <div className="grid grid-cols-2 gap-y-1.5 mb-3">
              <div>
                <p className="font-['JetBrains_Mono'] text-[8px] text-zinc-400 uppercase">Materials</p>
                <p className="font-['JetBrains_Mono'] text-[9px] font-semibold text-zinc-300 truncate">
                  {service.material_capabilities?.slice(0, 2).join(', ')}
                </p>
              </div>
              <div>
                <p className="font-['JetBrains_Mono'] text-[8px] text-zinc-400 uppercase">Finishes</p>
                <p className="font-['JetBrains_Mono'] text-[9px] font-semibold text-zinc-300 truncate">
                  {service.finish_options?.slice(0, 2).join(', ')}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom: actions */}
          <div className="flex items-center justify-end pt-2 border-t border-zinc-700/50">
            <button
              onClick={e => { e.stopPropagation(); onGetQuote(service); }}
              className="bg-blue-500 text-zinc-950 px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-transform cursor-pointer rounded border-none"
            >
              <span>Get Quote</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
