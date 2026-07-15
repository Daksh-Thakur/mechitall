'use client';

import React, { useState } from 'react';
import { Cpu } from 'lucide-react';
import { submitSellerKYC } from '@/app/actions/rewards';

interface SellerKYCModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  fetchProfile: () => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function SellerKYCModal({
  isOpen,
  onClose,
  profileId,
  fetchProfile,
  showToast,
}: SellerKYCModalProps) {
  const [togglingSeller, setTogglingSeller] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="bg-zinc-800/95 backdrop-blur-lg border border-slate-200/50 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative z-10 animate-fade-in-down max-h-[90vh] overflow-y-auto no-scrollbar space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#0B1528]/10 text-[#0B1528] flex items-center justify-center mx-auto shadow-sm">
            <Cpu className="w-6 h-6 stroke-[2]" />
          </div>
          <h3 className="text-lg font-black text-white tracking-tight uppercase">Seller Registration &amp; KYC</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed font-semibold">
            Please complete your shop verification details to register as a custom fabrication seller on MechItAll.
          </p>
        </div>

        <form onSubmit={async (e) => {
          e.preventDefault();
          const target = e.target as any;
          const companyName = target.companyName.value.trim();
          const taxId = target.taxId.value.trim();
          const machineCount = parseInt(target.machineCount.value) || 0;
          const businessAddress = target.businessAddress.value.trim();
          const primaryCapability = target.primaryCapability.value;
          const legalName = target.legalName.value.trim();
          const bankAccountNumber = target.bankAccountNumber.value.trim();
          const ifscCode = target.ifscCode.value.trim();
          const pan = target.pan.value.trim();
          const gstin = target.gstin.value.trim();

          if (!companyName || !taxId || !businessAddress || !primaryCapability || !legalName || !bankAccountNumber || !ifscCode || !pan) {
            showToast('Please fill in all required fields.', 'error');
            return;
          }

          setTogglingSeller(true);
          try {
            await submitSellerKYC(profileId, {
              companyName,
              taxId,
              machineCount,
              businessAddress,
              primaryCapability,
              legalName,
              bankAccountNumber,
              ifscCode,
              pan,
              gstin
            });
            showToast('KYC Verified & Seller Mode Activated!', 'success');
            onClose();
            await fetchProfile();
          } catch (err: any) {
            showToast(err.message || 'Failed to submit KYC.', 'error');
          } finally {
            setTogglingSeller(false);
          }
        }} className="space-y-4 text-left">

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase">Legal Name (as in Bank Account) *</label>
            <input
              type="text"
              name="legalName"
              required
              placeholder="e.g. John Doe"
              className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#007084]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase">Bank Account Number *</label>
              <input
                type="text"
                name="bankAccountNumber"
                required
                placeholder="e.g. 918273645019"
                className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#007084]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase">IFSC Code *</label>
              <input
                type="text"
                name="ifscCode"
                required
                placeholder="e.g. IFSC Code"
                className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#007084]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase">PAN Number *</label>
              <input
                type="text"
                name="pan"
                required
                placeholder="e.g. PAN Number"
                className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#007084]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase">GSTIN (Optional)</label>
              <input
                type="text"
                name="gstin"
                placeholder="e.g. GSTIN"
                className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#007084]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase">Company / Shop Name *</label>
            <input
              type="text"
              name="companyName"
              required
              placeholder="e.g. Precision CNC Lab Ltd."
              className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#007084]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase">Tax Identification ID *</label>
            <input
              type="text"
              name="taxId"
              required
              placeholder="e.g. Tax ID"
              className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#007084]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase">Machine Count</label>
              <input
                type="number"
                name="machineCount"
                min={0}
                defaultValue={1}
                className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#007084]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase">Primary Capability *</label>
              <select
                name="primaryCapability"
                required
                className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#007084]"
              >
                <option value="CNC Machining">CNC Machining</option>
                <option value="3D Printing">3D Printing</option>
                <option value="Sheet Metal Fabrication">Sheet Metal Fabrication</option>
                <option value="Laser Cutting">Laser Cutting</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase">Business Address *</label>
            <textarea
              name="businessAddress"
              required
              rows={2}
              placeholder="Street, City, Zip Code..."
              className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#007084] resize-none"
            ></textarea>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg border border-zinc-700/60 hover:bg-zinc-900 text-xs font-bold text-zinc-500 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={togglingSeller}
              className="flex-1 bg-[#0B1528] hover:bg-slate-900 text-white py-3 rounded-lg text-xs font-extrabold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              Verify &amp; Activate
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
