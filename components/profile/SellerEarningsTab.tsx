'use client';
import React, { useState } from 'react';
import { User, ShoppingBag, Plus, Trash2, ShoppingCart, RefreshCw, AlertTriangle, CheckCircle2, Package, Play, Camera, Loader2, Upload, MessageSquare, Send, Paperclip, FileText, ExternalLink, CircleDollarSign, X, XCircle, ArrowRight, ArrowLeftRight, Gift, Cpu, IndianRupee, ShieldCheck, Settings, Heart } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { updatePayoutPreferences } from '@/app/actions/rewards';
import { createRazorpayAccountAction, createRazorpayStakeholderAction, requestRazorpayProductAction, updateRazorpayProductAction } from '@/app/actions/razorpay';
import { SUPPORTED_INDIAN_STATES } from '@/utils/razorpay';

export default function SellerEarningsTab(props: any) {
    const { activeChatRfqId, activeShipmentsCount, activeTab, addToCart, base64String, boltsProgressPercent, cadFile, channel, checkUnreadChats, customSpecs, data, datasheetFile, dbProducts, deletingCatalogServiceId, deletingProductId, deletingServiceId, dragActiveCad, dragActiveDatasheet, dragActiveImage, editName, enableBulkPricing, fetchOrders, fetchProfile, fetchSellerData, file, handleDeleteCapability, handleDeleteProduct, handleDeleteService, handleDrag, handleDrop, handlePhotoUploadAndClaim, handleSimulateStatus, handleToggleSellerMode, handleUpdateNameSubmit, handleUpdateOrderStatus, hasNewMsg, hasNewStatus, hasTimedOut, imageFileNames, imagePreviews, isActive, isGuest, isMasterBuilder, isPending, isUpdatingName, listingType, loadingOrders, loadingSeller, loadingSellerOrders, loadingTx, localProducts, localServices, mapped, msg, nextState, openAddListingModal, orderId, orders, params, paymentStatus, processFile, profile, publishingListing, reader, reason, res, response, router, sOrders, seen, seenChats, seenChatsStr, selectedCategory, selectedOrder, selectedProcessType, sellerData, sellerOrders, setActiveChatRfqId, setActiveTab, setCadFile, setCustomSpecs, setDatasheetFile, setDbProducts, setDeletingCatalogServiceId, setDeletingProductId, setDeletingServiceId, setDragActiveCad, setDragActiveDatasheet, setDragActiveImage, setEditName, setEnableBulkPricing, setHasTimedOut, setImageFileNames, setImagePreviews, setIsGuest, setListingType, setLoadingOrders, setLoadingSeller, setLoadingSellerOrders, setLoadingTx, setLocalProducts, setLocalServices, setOrders, setPublishingListing, setSelectedCategory, setSelectedOrder, setSelectedProcessType, setSellerData, setSellerOrders, setShowAddListingModal, setShowKYCModal, setTogglingSeller, setTransactions, setUnreadChatsCount, setUpdatingOrderId, setUploadingOrderId, showAddListingModal, showKYCModal, showToast, sizeStr, startTransition, startTransitionStatus, storedProds, storedServs, supabase, tabParam, timer, toggleWishlist, togglingSeller, transactions, unreadChatsCount, updated, updatingOrderId, uploadingOrderId, wishlist } = props;
    
    const [isEditingPayout, setIsEditingPayout] = useState(false);
    const [bankAccount, setBankAccount] = useState(profile?.bank_account_number || '');
    const [ifsc, setIfsc] = useState(profile?.ifsc_code || '');
    const [saving, setSaving] = useState(false);
    const [chartView, setChartView] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

    const chartData = React.useMemo(() => {
      if (!sellerData) return [];

      const allJobs = [...(sellerData.completedJobs || []), ...(sellerData.activeJobs || [])];

      if (chartView === 'weekly') {
        return sellerData.earningsVelocity || [];
      }

      if (chartView === 'monthly') {
        const months: Array<{ label: string; monthNum: number; year: number; amount: number }> = [];
        const now = new Date();
        for (let i = 4; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const label = d.toLocaleString('en-IN', { month: 'short' });
          const year = d.getFullYear();
          months.push({
            label: i === 0 ? 'This Mo' : `${label}`,
            monthNum: d.getMonth(),
            year: year,
            amount: 0
          });
        }

        allJobs.forEach((job: any) => {
          if (!job.created_at) return;
          const jobDate = new Date(job.created_at);
          const jobMonth = jobDate.getMonth();
          const jobYear = jobDate.getFullYear();
          const matchedMonth = months.find(m => m.monthNum === jobMonth && m.year === jobYear);
          if (matchedMonth) {
            matchedMonth.amount += Number(job.total_cost || 0);
          }
        });

        return months.map(m => ({ label: m.label, amount: m.amount }));
      }

      if (chartView === 'yearly') {
        const currentYear = new Date().getFullYear();
        const years: Array<{ label: string; year: number; amount: number }> = [];
        for (let i = 3; i >= 0; i--) {
          years.push({
            label: String(currentYear - i),
            year: currentYear - i,
            amount: 0
          });
        }

        allJobs.forEach((job: any) => {
          if (!job.created_at) return;
          const jobYear = new Date(job.created_at).getFullYear();
          const matchedYear = years.find(y => y.year === jobYear);
          if (matchedYear) {
            matchedYear.amount += Number(job.total_cost || 0);
          }
        });

        return years.map(y => ({ label: y.label, amount: y.amount }));
      }

      return [];
    }, [sellerData, chartView]);

    // Sync input values when profile loads/changes
    React.useEffect(() => {
      if (profile) {
        setBankAccount(profile.bank_account_number || '');
        setIfsc(profile.ifsc_code || '');
      }
    }, [profile]);

  return (
    <>
      {/* Replace props with actual destructured props below */}
      
      <div className="space-y-6">
              {/* Header */}
              <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight uppercase font-['Space_Grotesk']">Seller Earnings Dashboard</h2>
                  <p className="text-xs text-zinc-500 mt-1 font-semibold">
                    Monitor your weekly sales velocity, track pending payouts, and view completed custom order ledger history.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-emerald bg-emerald/5 border border-emerald/15 px-3 py-1.5 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-emerald" />
                  <span>Account Verified</span>
                </div>
              </div>

              {loadingSeller && !sellerData ? (
                <div className="bg-zinc-800 border border-zinc-700/60 p-12 text-center rounded space-y-3">
                  <RefreshCw className="w-8 h-8 text-cobalt animate-spin mx-auto" />
                  <p className="text-xs font-bold text-zinc-400 animate-pulse">Loading financial summary...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Metrics */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-zinc-800 border border-zinc-700/60 p-6 rounded-2xl shadow-sm space-y-4">
                      <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-mono">
                        Active Job Escrow
                      </span>
                      <div className="space-y-1">
                        <span className="text-3xl font-black text-white block tracking-tight">
                          ₹{sellerData ? Number((sellerData as any).escrowBalance || 0).toLocaleString('en-IN') : '0'}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-bold block">
                          Escrow funds from active contracts
                        </span>
                      </div>
                    </div>

                    <div className="bg-zinc-800 border border-zinc-700/60 p-6 rounded-2xl shadow-sm space-y-4">
                      <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-mono text-emerald">
                        Cleared Earnings
                      </span>
                      <div className="space-y-1">
                        <span className="text-3xl font-black text-emerald block tracking-tight">
                          ₹{sellerData ? Number((sellerData as any).clearedEarnings || 0).toLocaleString('en-IN') : '0'}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-bold block">
                          Released funds available for payout
                        </span>
                      </div>
                    </div>

                    {/* Razorpay Linked Account / Settlements Onboarding */}
                    <RazorpaySettlementsCard
                      profile={profile}
                      fetchProfile={fetchProfile}
                      showToast={showToast}
                    />

                  </div>

                  {/* Right Column - Chart and Ledger */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Velocity Chart */}
                    <div className="bg-zinc-800 border border-zinc-700/60 p-6 rounded-2xl shadow-sm space-y-4">
                      <div className="flex justify-between items-center pb-1">
                        <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-mono">
                          {chartView === 'weekly' ? 'Weekly' : chartView === 'monthly' ? 'Monthly' : 'Yearly'} Sales Velocity
                        </span>
                        {/* Selector Tabs */}
                        <div className="flex bg-zinc-900/80 border border-zinc-750 p-1 rounded-xl gap-0.5">
                          {(['weekly', 'monthly', 'yearly'] as const).map(view => (
                            <button
                              key={view}
                              onClick={() => setChartView(view)}
                              className={`px-3 py-1 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                                chartView === view
                                  ? 'bg-[#00D0F5] text-zinc-950 shadow-md shadow-[#00D0F5]/10'
                                  : 'text-zinc-500 hover:text-zinc-300'
                              }`}
                            >
                              {view}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-end justify-around h-44 px-2">
                        {chartData.map((item: any, idx: number) => {
                          const maxVal = Math.max(...chartData.map((v: any) => v.amount), 1000);
                          const barHeight = Math.max(Math.round((item.amount / maxVal) * 100), item.amount > 0 ? 8 : 4);
                          const isActive = idx === chartData.length - 1;

                          return (
                            <div key={idx} className="flex flex-col items-center gap-1 group relative">
                              {/* Always-visible value above bar */}
                              <span className={`text-[8px] font-mono font-black whitespace-nowrap ${item.amount > 0 ? (isActive ? 'text-[#00D0F5]' : 'text-zinc-400') : 'text-zinc-700'}`}>
                                {item.amount > 0 ? `₹${Number(item.amount).toLocaleString('en-IN')}` : '—'}
                              </span>
                              <div
                                className={`w-8 rounded-t transition-all duration-300 origin-bottom hover:scale-x-105 hover:shadow-md ${
                                  isActive
                                    ? 'bg-gradient-to-t from-[#00D0F5]/50 to-[#00D0F5] shadow-lg shadow-[#00D0F5]/20 hover:brightness-110'
                                    : 'bg-zinc-850 border border-zinc-750 hover:bg-[#00D0F5]/20 hover:border-[#00D0F5]/30'
                                }`}
                                style={{ height: `${barHeight}px` }}
                              ></div>
                              <span className={`text-[9px] font-mono font-bold block mt-1 transition-colors ${isActive ? 'text-[#00D0F5]' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                                {item.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Job Ledger */}
                    <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-zinc-700/60">
                        <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-mono">
                          Recent Contracts Ledger
                        </span>
                      </div>

                      {!sellerData || (sellerData.activeJobs.length === 0 && sellerData.completedJobs.length === 0) ? (
                        <div className="p-8 text-center text-xs font-semibold text-zinc-400">
                          No recent custom jobs completed or active.
                        </div>
                      ) : (
                        <div className="divide-y divide-zinc-700/50 text-[11px] max-h-[220px] overflow-y-auto no-scrollbar pr-1 bg-zinc-900/10">
                          {[...(sellerData.activeJobs || []), ...(sellerData.completedJobs || [])]
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map(job => {
                              const isCleared = job.status === 'Completed' || job.status === 'Delivered';
                              return (
                                <div key={job.id} className="p-4 flex justify-between items-center hover:bg-zinc-900/30 transition-all font-semibold">
                                  <div>
                                    <span className="block text-white font-bold">{job.rfq?.title || 'Custom Machining Contract'}</span>
                                    <span className="block text-[10px] text-zinc-400 font-mono mt-0.5">RFQ ID: {job.rfq_id?.slice(0, 8).toUpperCase() || 'N/A'}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="block text-white font-black">₹{Number(job.total_cost).toLocaleString('en-IN')}</span>
                                    <span className={`block text-[9px] font-mono uppercase tracking-wider font-bold ${isCleared ? 'text-emerald' : 'text-slate-500'
                                      }`}>
                                      {isCleared ? 'Cleared' : 'Escrow Active'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
    </>
  );
}

function RazorpaySettlementsCard({ profile, fetchProfile, showToast }: { profile: any; fetchProfile: () => Promise<void>; showToast: (msg: string, type: 'success' | 'error') => void }) {
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);

  // Stakeholder state variables
  const [showStakeholderModal, setShowStakeholderModal] = useState(false);
  const [submittingStakeholder, setSubmittingStakeholder] = useState(false);
  const [sthErrorMsg, setSthErrorMsg] = useState<string | null>(null);
  const [sthErrorField, setSthErrorField] = useState<string | null>(null);

  const [sthForm, setSthForm] = useState({
    name: profile?.legal_name || '',
    email: profile?.email || '',
    percentage_ownership: '100.00',
    director: true,
    executive: true,
    phone_primary: '',
    phone_secondary: '',
    street: '',
    city: '',
    state: 'MH',
    postal_code: '',
    country: 'IN',
    pan: ''
  });

  const isSthLinked = profile?.stakeholder_id && profile.stakeholder_id.startsWith('sth_');

  // Product request state variables
  const [tncChecked, setTncChecked] = useState(false);
  const [requestingProduct, setRequestingProduct] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

  const handleProductRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductError(null);

    if (!tncChecked) {
      setProductError("You must accept the terms and conditions to proceed.");
      return;
    }

    setRequestingProduct(true);
    try {
      const res = await requestRazorpayProductAction({
        accountId: profile.child_merchant_key,
        productName: 'route',
        tncAccepted: true
      });

      if (!res.success) {
        let errMsg = res.error?.description || "An unexpected error occurred.";
        if (res.error?.code === "BAD_REQUEST_ERROR") {
          if (res.error.description.includes("tnc")) {
            errMsg += " (Solution: Please check the checkbox to accept Terms and Conditions.)";
          } else if (res.error.description.includes("invalid")) {
            errMsg += " (Solution: Ensure the correct product is requested.)";
          }
        }
        setProductError(errMsg);
      } else {
        showToast("Route settlements product requested successfully!", "success");
        await fetchProfile();
      }
    } catch (err: any) {
      setProductError(err.message || "Something went wrong.");
    } finally {
      setRequestingProduct(false);
    }
  };
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updatingProduct, setUpdatingProduct] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateErrorField, setUpdateErrorField] = useState<string | null>(null);

  const [updateForm, setUpdateForm] = useState({
    account_number: profile?.bank_account_number || '',
    ifsc_code: profile?.ifsc_code || '',
    beneficiary_name: profile?.legal_name || '',
    tnc_accepted: true
  });

  const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUpdateForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError(null);
    setUpdateErrorField(null);

    if (!updateForm.account_number.trim() || updateForm.account_number.length < 5 || updateForm.account_number.length > 20) {
      setUpdateError("The account number must be between 5 and 20 characters.");
      setUpdateErrorField("account_number");
      return;
    }

    if (!updateForm.ifsc_code.trim()) {
      setUpdateError("IFSC Code is required.");
      setUpdateErrorField("ifsc_code");
      return;
    }
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(updateForm.ifsc_code.toUpperCase().trim())) {
      setUpdateError("Invalid IFSC Code format.");
      setUpdateErrorField("ifsc_code");
      return;
    }

    if (!updateForm.beneficiary_name.trim()) {
      setUpdateError("Beneficiary name is required.");
      setUpdateErrorField("beneficiary_name");
      return;
    }

    setUpdatingProduct(true);
    try {
      const res = await updateRazorpayProductAction({
        accountId: profile.child_merchant_key,
        productId: profile.razorpay_product_id,
        settlements: {
          account_number: updateForm.account_number.trim(),
          ifsc_code: updateForm.ifsc_code.toUpperCase().trim(),
          beneficiary_name: updateForm.beneficiary_name.trim()
        },
        tncAccepted: true
      });

      if (!res.success) {
        if (res.error?.field) {
          setUpdateErrorField(res.error.field);
        }
        let errMsg = res.error?.description || "An unexpected error occurred.";
        if (res.error?.code === "BAD_REQUEST_ERROR") {
          if (res.error.description.includes("locked")) {
            errMsg += " (Solution: The configuration is under review. Please wait for the admin to complete the check.)";
          } else if (res.error.description.includes("IFSC")) {
            errMsg += " (Solution: Double check your branch IFSC code.)";
          } else if (res.error.description.includes("account number")) {
            errMsg += " (Solution: Account number must be between 5 and 20 characters.)";
          }
        }
        setUpdateError(errMsg);
      } else {
        showToast("Settlements configuration updated successfully!", "success");
        setShowUpdateModal(false);
        await fetchProfile();
      }
    } catch (err: any) {
      setUpdateError(err.message || "Something went wrong.");
    } finally {
      setUpdatingProduct(false);
    }
  };

  const handleSthChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setSthForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setSthForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSthErrorMsg(null);
    setSthErrorField(null);

    // Validate parameters
    if (!sthForm.name.trim()) {
      setSthErrorMsg("Name is required.");
      setSthErrorField("name");
      return;
    }
    if (!sthForm.email.trim()) {
      setSthErrorMsg("Email is required.");
      setSthErrorField("email");
      return;
    }
    if (!sthForm.pan.trim()) {
      setSthErrorMsg("PAN is required.");
      setSthErrorField("pan");
      return;
    }
    const pan = sthForm.pan.toUpperCase().trim();
    if (!/^[A-Z]{5}\d{4}[A-Z]{1}$/.test(pan)) {
      setSthErrorMsg("Invalid PAN format. Must be a 10-digit alphanumeric code matching company PAN structure.");
      setSthErrorField("pan");
      return;
    }
    if (pan[3] !== 'P') {
      setSthErrorMsg("Invalid PAN details. The 4th digit of a stakeholder PAN must be 'P' (Individual PAN).");
      setSthErrorField("pan");
      return;
    }

    if (sthForm.percentage_ownership) {
      const val = Number(sthForm.percentage_ownership);
      if (isNaN(val) || val < 0 || val > 100) {
        setSthErrorMsg("The percentage ownership must be between 0 and 100.");
        setSthErrorField("percentage_ownership");
        return;
      }
      const valStr = String(sthForm.percentage_ownership);
      if (valStr.includes('.') && valStr.split('.')[1].length > 2) {
        setSthErrorMsg("Only two decimal places are allowed for percentage ownership.");
        setSthErrorField("percentage_ownership");
        return;
      }
    }

    if (sthForm.phone_primary) {
      const ph = sthForm.phone_primary.trim();
      if (!/^\d+$/.test(ph) || ph.length < 8 || ph.length > 11) {
        setSthErrorMsg("Primary phone number must be digits between 8 and 11 characters.");
        setSthErrorField("phone_primary");
        return;
      }
    }
    if (sthForm.phone_secondary) {
      const ph = sthForm.phone_secondary.trim();
      if (!/^\d+$/.test(ph) || ph.length < 8 || ph.length > 11) {
        setSthErrorMsg("Secondary phone number must be digits between 8 and 11 characters.");
        setSthErrorField("phone_secondary");
        return;
      }
    }

    if (sthForm.street && (sthForm.street.length < 10 || sthForm.street.length > 255)) {
      setSthErrorMsg("Street address must be between 10 and 255 characters.");
      setSthErrorField("street");
      return;
    }

    setSubmittingStakeholder(true);
    try {
      const res = await createRazorpayStakeholderAction({
        accountId: profile.child_merchant_key,
        name: sthForm.name.trim(),
        email: sthForm.email.trim(),
        percentage_ownership: Number(sthForm.percentage_ownership) || undefined,
        relationship: {
          director: sthForm.director,
          executive: sthForm.executive
        },
        phone: sthForm.phone_primary || sthForm.phone_secondary ? {
          primary: sthForm.phone_primary.trim() || undefined,
          secondary: sthForm.phone_secondary.trim() || undefined
        } : undefined,
        residential_address: sthForm.street ? {
          street: sthForm.street.trim(),
          city: sthForm.city.trim(),
          state: sthForm.state.trim(),
          postal_code: sthForm.postal_code.trim(),
          country: 'IN'
        } : undefined,
        pan: pan
      });

      if (!res.success) {
        if (res.error?.field) {
          setSthErrorField(res.error.field);
        }
        let errMsg = res.error?.description || "An unexpected error occurred.";
        if (res.error?.code === "BAD_REQUEST_ERROR") {
          if (res.error.reason === "stakeholder_limit_exceeded") {
            errMsg += " (Solution: Route accounts can have a maximum of 1 stakeholder.)";
          } else if (res.error.reason === "linked_account_id_does_not_exist") {
            errMsg += " (Solution: Double check your account ID.)";
          }
        }
        setSthErrorMsg(errMsg);
      } else {
        showToast("Stakeholder onboarded successfully!", "success");
        setShowStakeholderModal(false);
        await fetchProfile();
      }
    } catch (err: any) {
      setSthErrorMsg(err.message || "Something went wrong.");
    } finally {
      setSubmittingStakeholder(false);
    }
  };

  // Parse existing address if any
  const parseAddress = (addrStr: string | null) => {
    if (!addrStr) return { street1: '', street2: '', city: '', state: 'MH', postal_code: '' };
    const parts = addrStr.split(',').map(s => s.trim());
    return {
      street1: parts[0] || '',
      street2: parts.length > 5 ? parts[1] || '' : '',
      city: parts.length > 3 ? parts[parts.length - 4] || '' : '',
      state: parts.length > 2 ? parts[parts.length - 3] || 'MH' : 'MH',
      postal_code: parts.length > 1 ? parts[parts.length - 2] || '' : '',
    };
  };

  const initialAddress = parseAddress(profile?.business_address);

  const [form, setForm] = useState({
    email: profile?.email || '',
    phone: '',
    legal_business_name: profile?.legal_name || profile?.company_name || '',
    customer_facing_business_name: profile?.company_name || '',
    business_type: 'individual',
    reference_id: `ref_${Math.floor(100000 + Math.random() * 900000)}`,
    bank_account_number: profile?.bank_account_number || '',
    ifsc_code: profile?.ifsc_code || '',
    pan: profile?.pan || '',
    gst: profile?.gstin || '',
    category: 'financial_services',
    subcategory: 'accounting',
    business_model: 'Online marketplace for custom fabrication services',
    street1: initialAddress.street1,
    street2: initialAddress.street2,
    city: initialAddress.city,
    state: initialAddress.state,
    postal_code: initialAddress.postal_code,
    country: 'IN',
  });

  const isLinked = profile?.child_merchant_key && profile.child_merchant_key.startsWith('acc_');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    setErrorMsg(null);
    setErrorField(null);

    // Validation for Step 1
    if (step === 1) {
      if (!form.email.trim()) {
        setErrorMsg("Email address is required.");
        setErrorField("email");
        return;
      }
      if (!form.phone.trim() || form.phone.length < 8 || form.phone.length > 15 || !/^\d+$/.test(form.phone)) {
        setErrorMsg("Phone number must be digits with length between 8 and 15 characters.");
        setErrorField("phone");
        return;
      }
      if (!form.legal_business_name.trim() || form.legal_business_name.length < 4) {
        setErrorMsg("Legal business name must be at least 4 characters.");
        setErrorField("legal_business_name");
        return;
      }
      if (/<[^>]*>/g.test(form.legal_business_name) || form.legal_business_name.includes('@') || form.legal_business_name.includes('http')) {
        setErrorMsg("Please enter a valid name. Links, emails and HTML tags are not allowed.");
        setErrorField("legal_business_name");
        return;
      }
      if (form.reference_id && (form.reference_id.length < 3 || form.reference_id.length > 20 || !/^[a-zA-Z0-9_-]+$/.test(form.reference_id))) {
        setErrorMsg("Reference ID must be alphanumeric (3-20 chars) and contain only letters, numbers, dashes, or underscores.");
        setErrorField("reference_id");
        return;
      }
    }

    // Validation for Step 2
    if (step === 2) {
      if (!form.bank_account_number.trim() || form.bank_account_number.length < 5 || form.bank_account_number.length > 35) {
        setErrorMsg("The bank account number must be between 5 and 35 characters.");
        setErrorField("bank_account_number");
        return;
      }
      if (!form.ifsc_code.trim()) {
        setErrorMsg("IFS Code is required.");
        setErrorField("ifsc_code");
        return;
      }
      if (!form.pan.trim()) {
        setErrorMsg("Business PAN number is required.");
        setErrorField("pan");
        return;
      }
      const pan = form.pan.toUpperCase().trim();
      if (!/^[A-Z]{5}\d{4}[A-Z]{1}$/.test(pan)) {
        setErrorMsg("Invalid PAN format. Must be a 10-digit alphanumeric code matching company PAN structure.");
        setErrorField("pan");
        return;
      }
      const validFourthDigits = ['C', 'H', 'F', 'A', 'T', 'B', 'J', 'G', 'L'];
      if (!validFourthDigits.includes(pan[3])) {
        setErrorMsg("Invalid PAN details. The 4th digit of business PAN must be one of C, H, F, A, T, B, J, G, L.");
        setErrorField("pan");
        return;
      }
      if (form.gst.trim()) {
        const gst = form.gst.toUpperCase().trim();
        if (!/^[0123][0-9][A-Z]{5}[0-9]{4}[A-Z][0-9][A-Z0-9][A-Z0-9]$/.test(gst)) {
          setErrorMsg("Invalid GSTIN format. Must be a valid 15-digit PAN-based unique identification number.");
          setErrorField("gst");
          return;
        }
      }
    }

    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setErrorMsg(null);
    setErrorField(null);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setErrorField(null);

    // Final validations
    if (!form.street1.trim()) {
      setErrorMsg("Street address line 1 is required.");
      setErrorField("street1");
      return;
    }
    if (!form.city.trim()) {
      setErrorMsg("City is required.");
      setErrorField("city");
      return;
    }
    if (!form.postal_code.trim() || form.postal_code.length !== 6 || !/^\d{6}$/.test(form.postal_code)) {
      setErrorMsg("Postal code must be exactly 6 digits.");
      setErrorField("postal_code");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createRazorpayAccountAction({
        email: form.email.trim(),
        phone: form.phone.trim(),
        legal_business_name: form.legal_business_name.trim(),
        customer_facing_business_name: form.customer_facing_business_name.trim() || undefined,
        business_type: form.business_type,
        reference_id: form.reference_id.trim() || undefined,
        category: form.category,
        subcategory: form.subcategory,
        business_model: form.business_model.trim() || undefined,
        registered_address: {
          street1: form.street1.trim(),
          street2: form.street2.trim() || undefined,
          city: form.city.trim(),
          state: form.state.trim(),
          postal_code: form.postal_code.trim(),
          country: 'IN'
        },
        pan: form.pan.toUpperCase().trim(),
        gst: form.gst.trim() || undefined,
        bank_account_number: form.bank_account_number.trim(),
        ifsc_code: form.ifsc_code.toUpperCase().trim()
      });

      if (!res.success) {
        // Match specific error fields if any
        if (res.error?.field) {
          setErrorField(res.error.field);
        }
        // Custom solutions based on descriptions
        let errMsg = res.error?.description || "An unexpected error occurred.";
        if (res.error?.code === "BAD_REQUEST_ERROR") {
          if (res.error.field === "business_type") {
            errMsg += " (Solution: Please choose a valid business type like Individual, Partnership, or LLP.)";
          } else if (res.error.field === "email") {
            errMsg += " (Solution: Try using a unique business email not associated with other Razorpay accounts.)";
          } else if (res.error.field === "ifsc") {
            errMsg += " (Solution: Double check your bank branch IFS Code.)";
          } else if (res.error.field === "account_number") {
            errMsg += " (Solution: Verify that your bank account number is correct.)";
          } else if (res.error.field === "reference_id") {
            errMsg += " (Solution: Reference ID must be between 3 and 20 characters.)";
          }
        }
        setErrorMsg(errMsg);
      } else {
        showToast("Razorpay Linked Account created successfully!", "success");
        setShowOnboardModal(false);
        await fetchProfile();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-zinc-800 border border-zinc-700/60 p-6 rounded-2xl shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-mono">
          Settlement Gateway
        </span>
        <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${
          isLinked 
            ? 'bg-emerald-500/10 text-emerald border-emerald-500/20' 
            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
        }`}>
          {isLinked ? 'Razorpay Linked' : 'Setup Pending'}
        </span>
      </div>

      {isLinked ? (
        <div className="space-y-4">
          <div className="space-y-2 bg-zinc-900/70 border border-zinc-700/60 p-4 rounded-xl text-[11px] font-semibold text-zinc-455 font-mono">
            <p className="flex justify-between border-b border-zinc-850 pb-2">
              <span>Account ID:</span>
              <span className="text-[#00D0F5] font-black">{profile.child_merchant_key}</span>
            </p>
            <p className="flex justify-between border-b border-zinc-850 pb-2">
              <span>Business Entity:</span>
              <span className="text-zinc-200 font-bold">{profile.legal_name || 'Standard Vendor'}</span>
            </p>
            <p className="flex justify-between border-b border-zinc-850 pb-2">
              <span>PAN Number:</span>
              <span className="text-zinc-350 font-bold">{profile.pan ? `••••••${profile.pan.slice(-4)}` : 'N/A'}</span>
            </p>
            {profile.gstin && (
              <p className="flex justify-between border-b border-zinc-850 pb-2">
                <span>GSTIN:</span>
                <span className="text-zinc-350 font-bold">{`••••••••••${profile.gstin.slice(-5)}`}</span>
              </p>
            )}
            <p className="flex justify-between border-b border-zinc-850 pb-2">
              <span>Settlement Account:</span>
              <span className="text-zinc-350 font-bold">
                {profile.bank_account_number ? `•••• ${profile.bank_account_number.slice(-4)}` : 'Not Set'}
              </span>
            </p>
            <p className="flex justify-between pb-1">
              <span>IFS Code:</span>
              <span className="text-zinc-200 font-bold">{profile.ifsc_code || 'N/A'}</span>
            </p>
          </div>

          {/* Stakeholder block */}
          <div className="bg-zinc-900/70 border border-zinc-700/60 p-4 rounded-xl text-[11px] font-semibold text-zinc-450 font-mono space-y-3">
            <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
              <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Business Stakeholder</span>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${
                isSthLinked 
                  ? 'bg-emerald-500/10 text-emerald border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
              }`}>
                {isSthLinked ? 'Verified' : 'Verification Required'}
              </span>
            </div>

            {isSthLinked ? (
              <div className="space-y-1.5 text-zinc-400">
                <p className="flex justify-between">
                  <span>Name:</span>
                  <span className="text-zinc-200 font-bold">{profile.stakeholder_name || 'Gaurav Kumar'}</span>
                </p>
                <p className="flex justify-between">
                  <span>Email:</span>
                  <span className="text-zinc-350">{profile.stakeholder_email || 'gaurav@example.com'}</span>
                </p>
                <p className="flex justify-between">
                  <span>PAN Card:</span>
                  <span className="text-zinc-350">{profile.stakeholder_pan ? `••••••${profile.stakeholder_pan.slice(-4)}` : 'N/A'}</span>
                </p>
                <p className="flex justify-between">
                  <span>Ownership:</span>
                  <span className="text-zinc-200 font-bold">100.00%</span>
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] text-zinc-500 leading-normal font-sans">
                  Razorpay Route product rules require adding exactly one individual stakeholder to complete the account verification.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSthErrorMsg(null);
                    setSthErrorField(null);
                    setShowStakeholderModal(true);
                  }}
                  className="w-full bg-[#00D0F5] hover:bg-[#00e5ff] text-zinc-950 py-2 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Onboard Stakeholder</span>
                </button>
              </div>
            )}
          </div>

          {/* Product Configuration block */}
          {isSthLinked ? (
            <div className="bg-zinc-900/70 border border-zinc-700/60 p-4 rounded-xl text-[11px] font-semibold text-zinc-400 font-mono space-y-3">
              <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
                <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Product Configuration</span>
                {profile.razorpay_product_status ? (
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${
                    profile.razorpay_product_status === 'activated'
                      ? 'bg-emerald-500/10 text-emerald border-emerald-500/20'
                      : profile.razorpay_product_status === 'suspended'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : profile.razorpay_product_status === 'needs_clarification'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      : 'bg-[#00D0F5]/10 text-[#00D0F5] border-[#00D0F5]/20'
                  }`}>
                    {profile.razorpay_product_status}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border bg-zinc-850 text-zinc-500 border-zinc-750">
                    Not Configured
                  </span>
                )}
              </div>

              {profile.razorpay_product_id ? (
                <div className="space-y-3">
                  <div className="space-y-1.5 text-zinc-400">
                    <p className="flex justify-between">
                      <span>Product:</span>
                      <span className="text-zinc-200 font-bold">Route Settlements</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Product ID:</span>
                      <span className="text-zinc-355">{profile.razorpay_product_id}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>T&C Accepted:</span>
                      <span className="text-emerald font-bold">Yes</span>
                    </p>
                  </div>
                  {profile.razorpay_product_status === 'needs_clarification' && (
                    <button
                      type="button"
                      onClick={() => {
                        setUpdateError(null);
                        setUpdateErrorField(null);
                        setShowUpdateModal(true);
                      }}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-955 py-2 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Update Settlement Details</span>
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleProductRequest} className="space-y-3">
                  <p className="text-[10px] text-zinc-500 leading-normal font-sans text-left">
                    Request Route settlements product configuration to activate automated route payout split-settlements.
                  </p>

                  {productError && (
                    <div className="bg-red-500/5 border border-red-500/15 p-2 rounded-lg text-[9px] font-semibold text-red-400 leading-normal text-left">
                      <strong>Error:</strong> {productError}
                    </div>
                  )}

                  <label className="flex items-start gap-2 text-[10px] font-sans text-zinc-400 cursor-pointer text-left">
                    <input
                      type="checkbox"
                      checked={tncChecked}
                      onChange={(e) => setTncChecked(e.target.checked)}
                      className="rounded border-zinc-800 bg-zinc-950 text-[#00D0F5] focus:ring-[#00D0F5] mt-0.5"
                    />
                    <span>I accept the Terms and Conditions for Route product activation.</span>
                  </label>

                  <button
                    type="submit"
                    disabled={requestingProduct}
                    className="w-full bg-[#00D0F5] hover:bg-[#00e5ff] text-zinc-950 py-2 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {requestingProduct ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Cpu className="w-3.5 h-3.5" />
                    )}
                    <span>{requestingProduct ? 'Requesting...' : 'Request Route Product'}</span>
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="bg-zinc-900/30 border border-dashed border-zinc-800 p-4 rounded-xl text-[10px] text-zinc-500 leading-normal font-sans text-center">
              Please verify your business stakeholder details to unlock the Route settlements configuration.
            </div>
          )}


          <div className="flex gap-2">
            <Link
              href="/razorpay-playground"
              className="flex-1 bg-zinc-900 border border-zinc-750 hover:bg-zinc-850 text-white text-center py-2 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all"
            >
              API Playground
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[11px] text-zinc-400 leading-relaxed font-semibold">
            Onboard to the Razorpay Settlement Gateway to enable seamless multi-merchant route settlements and receive cleared payouts.
          </p>

          <button
            onClick={() => {
              setStep(1);
              setErrorMsg(null);
              setErrorField(null);
              setShowOnboardModal(true);
            }}
            className="w-full bg-[#00D0F5] hover:bg-[#00e5ff] text-zinc-950 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-md shadow-[#00D0F5]/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Cpu className="w-4 h-4 shrink-0" />
            <span>Link Razorpay Account</span>
          </button>
        </div>
      )}

      {/* Onboarding Modal Overlay */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
            onClick={() => !submitting && setShowOnboardModal(false)}
          ></div>

          {/* Modal Content */}
          <div className="bg-zinc-900 border border-zinc-750 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto no-scrollbar space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">Razorpay Merchant Onboarding</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Step {step} of 3</p>
              </div>
              <button
                disabled={submitting}
                onClick={() => setShowOnboardModal(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Alert Box */}
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl space-y-2 text-xs font-semibold text-red-400">
                <div className="flex gap-2 items-center">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>Validation Error {errorField ? `on field [${errorField}]` : ''}:</span>
                </div>
                <p className="font-mono text-[10px] bg-zinc-950/40 p-2 rounded border border-red-500/10">{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* STEP 1: BUSINESS DETAILS */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Contact Email *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="e.g. merchant@example.com"
                      className={`w-full text-xs font-bold p-3 border rounded-lg bg-zinc-950/40 text-white focus:outline-none focus:border-[#00D0F5] ${
                        errorField === 'email' ? 'border-red-500 focus:border-red-500' : 'border-zinc-800'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Contact Phone *</label>
                    <input
                      type="text"
                      name="phone"
                      required
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="e.g. 9876543210"
                      className={`w-full text-xs font-bold p-3 border rounded-lg bg-zinc-950/40 text-white focus:outline-none focus:border-[#00D0F5] ${
                        errorField === 'phone' ? 'border-red-500 focus:border-red-500' : 'border-zinc-800'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Legal Business Name *</label>
                    <input
                      type="text"
                      name="legal_business_name"
                      required
                      value={form.legal_business_name}
                      onChange={handleChange}
                      placeholder="e.g. Acme Corporation"
                      className={`w-full text-xs font-bold p-3 border rounded-lg bg-zinc-950/40 text-white focus:outline-none focus:border-[#00D0F5] ${
                        errorField === 'legal_business_name' ? 'border-red-500 focus:border-red-500' : 'border-zinc-800'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Business Type *</label>
                      <select
                        name="business_type"
                        value={form.business_type}
                        onChange={handleChange}
                        className="w-full text-xs font-bold p-3 border border-zinc-800 rounded-lg bg-zinc-950 text-white focus:outline-none focus:border-[#00D0F5]"
                      >
                        <option value="partnership">Partnership</option>
                        <option value="individual">Individual / Proprietor</option>
                        <option value="private_limited">Private Limited</option>
                        <option value="public_limited">Public Limited</option>
                        <option value="llp">LLP</option>
                        <option value="trust">Trust</option>
                        <option value="society">Society</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Reference ID</label>
                      <input
                        type="text"
                        name="reference_id"
                        value={form.reference_id}
                        onChange={handleChange}
                        placeholder="Internal identifier"
                        className={`w-full text-xs font-bold p-3 border rounded-lg bg-zinc-950/40 text-white focus:outline-none focus:border-[#00D0F5] ${
                          errorField === 'reference_id' ? 'border-red-500 focus:border-red-500' : 'border-zinc-800'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: KYC & SETTLEMENT */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Bank Account Number *</label>
                      <input
                        type="text"
                        name="bank_account_number"
                        required
                        value={form.bank_account_number}
                        onChange={handleChange}
                        placeholder="e.g. 1029384756"
                        className={`w-full text-xs font-bold p-3 border rounded-lg bg-zinc-950/40 text-white focus:outline-none focus:border-[#00D0F5] ${
                          errorField === 'bank_account_number' ? 'border-red-500 focus:border-red-500' : 'border-zinc-800'
                        }`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">IFS Code *</label>
                      <input
                        type="text"
                        name="ifsc_code"
                        required
                        value={form.ifsc_code}
                        onChange={handleChange}
                        placeholder="e.g. HDFC0000001"
                        className={`w-full text-xs font-bold p-3 border rounded-lg bg-zinc-950/40 text-white focus:outline-none focus:border-[#00D0F5] ${
                          errorField === 'ifsc_code' ? 'border-red-500 focus:border-red-500' : 'border-zinc-800'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">PAN Card *</label>
                      <input
                        type="text"
                        name="pan"
                        required
                        value={form.pan}
                        onChange={handleChange}
                        placeholder="e.g. AAACL1234C"
                        className={`w-full text-xs font-bold p-3 border rounded-lg bg-zinc-950/40 text-white focus:outline-none focus:border-[#00D0F5] ${
                          errorField === 'pan' ? 'border-red-500 focus:border-red-500' : 'border-zinc-800'
                        }`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">GSTIN (Optional)</label>
                      <input
                        type="text"
                        name="gst"
                        value={form.gst}
                        onChange={handleChange}
                        placeholder="e.g. 18AABCU9603R1ZM"
                        className={`w-full text-xs font-bold p-3 border rounded-lg bg-zinc-950/40 text-white focus:outline-none focus:border-[#00D0F5] ${
                          errorField === 'gst' ? 'border-red-500 focus:border-red-500' : 'border-zinc-800'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Category *</label>
                      <select
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        className="w-full text-xs font-bold p-3 border border-zinc-800 rounded-lg bg-zinc-950 text-white focus:outline-none focus:border-[#00D0F5]"
                      >
                        <option value="financial_services">Financial Services</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="education">Education</option>
                        <option value="ecommerce">Ecommerce</option>
                        <option value="manufacturing">Manufacturing</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Subcategory *</label>
                      <input
                        type="text"
                        name="subcategory"
                        required
                        value={form.subcategory}
                        onChange={handleChange}
                        placeholder="e.g. clinic, accounting"
                        className="w-full text-xs font-bold p-3 border border-zinc-800 rounded-lg bg-zinc-950/40 text-white focus:outline-none focus:border-[#00D0F5]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: REGISTERED ADDRESS */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Street Address Line 1 *</label>
                    <input
                      type="text"
                      name="street1"
                      required
                      value={form.street1}
                      onChange={handleChange}
                      placeholder="Registered street address"
                      className={`w-full text-xs font-bold p-3 border rounded-lg bg-zinc-950/40 text-white focus:outline-none focus:border-[#00D0F5] ${
                        errorField === 'street1' ? 'border-red-500 focus:border-red-500' : 'border-zinc-800'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Street Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      name="street2"
                      value={form.street2}
                      onChange={handleChange}
                      placeholder="Apartment, suite, unit, etc."
                      className="w-full text-xs font-bold p-3 border border-zinc-800 rounded-lg bg-zinc-950/40 text-white focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">City *</label>
                      <input
                        type="text"
                        name="city"
                        required
                        value={form.city}
                        onChange={handleChange}
                        placeholder="e.g. Bengaluru"
                        className={`w-full text-xs font-bold p-3 border rounded-lg bg-zinc-950/40 text-white focus:outline-none focus:border-[#00D0F5] ${
                          errorField === 'city' ? 'border-red-500 focus:border-red-500' : 'border-zinc-800'
                        }`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">State *</label>
                      <select
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        className="w-full text-xs font-bold p-3 border border-zinc-800 rounded-lg bg-zinc-950 text-white focus:outline-none focus:border-[#00D0F5]"
                      >
                        {Object.entries(SUPPORTED_INDIAN_STATES).map(([code, name]) => (
                          <option key={code} value={code}>
                            {name} ({code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Postal Code *</label>
                      <input
                        type="text"
                        name="postal_code"
                        required
                        value={form.postal_code}
                        onChange={handleChange}
                        placeholder="6-digit PIN code"
                        className={`w-full text-xs font-bold p-3 border rounded-lg bg-zinc-950/40 text-white focus:outline-none focus:border-[#00D0F5] ${
                          errorField === 'postal_code' ? 'border-red-500 focus:border-red-500' : 'border-zinc-800'
                        }`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Country</label>
                      <input
                        type="text"
                        name="country"
                        disabled
                        value="India (IN)"
                        className="w-full text-xs font-bold p-3 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between gap-4 pt-4 border-t border-zinc-800 mt-4">
                {step > 1 ? (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleBack}
                    className="px-5 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border border-zinc-700 text-zinc-400 hover:text-white cursor-pointer transition-all disabled:opacity-50"
                  >
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-5 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-[#00D0F5] text-zinc-950 hover:bg-[#00e5ff] cursor-pointer transition-all shadow-md shadow-[#00D0F5]/10 flex items-center gap-1.5 font-bold"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-emerald-500 text-white hover:bg-emerald-450 cursor-pointer transition-all shadow-md shadow-emerald-500/10 flex items-center gap-2 font-bold disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{submitting ? 'Creating Account...' : 'Submit Boarding'}</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stakeholder Onboarding Modal Overlay */}
      {showStakeholderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-955/80 backdrop-blur-md transition-opacity"
            onClick={() => !submittingStakeholder && setShowStakeholderModal(false)}
          ></div>

          {/* Modal Content */}
          <div className="bg-zinc-900 border border-zinc-750 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto no-scrollbar space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">Stakeholder Onboarding</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Associate business owner details</p>
              </div>
              <button
                disabled={submittingStakeholder}
                onClick={() => setShowStakeholderModal(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Alert Box */}
            {sthErrorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl space-y-2 text-xs font-semibold text-red-400">
                <div className="flex gap-2 items-center">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>Validation Error {sthErrorField ? `on field [${sthErrorField}]` : ''}:</span>
                </div>
                <p className="font-mono text-[10px] bg-zinc-950/40 p-2 rounded border border-red-500/10">{sthErrorMsg}</p>
              </div>
            )}

            <form onSubmit={handleSthSubmit} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Stakeholder Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={sthForm.name}
                  onChange={handleSthChange}
                  placeholder="As printed on PAN Card"
                  className={`w-full text-xs font-bold p-3 border rounded-lg bg-zinc-950/40 text-white focus:outline-none focus:border-[#00D0F5] ${
                    sthErrorField === 'name' ? 'border-red-500 focus:border-red-500' : 'border-zinc-800'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Personal Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={sthForm.email}
                  onChange={handleSthChange}
                  placeholder="e.g. gaurav.kumar@example.com"
                  className={`w-full text-xs font-bold p-3 border rounded-lg bg-zinc-950/40 text-white focus:outline-none focus:border-[#00D0F5] ${
                    sthErrorField === 'email' ? 'border-red-500 focus:border-red-500' : 'border-zinc-800'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Individual PAN *</label>
                  <input
                    type="text"
                    name="pan"
                    required
                    value={sthForm.pan}
                    onChange={handleSthChange}
                    placeholder="e.g. AVOPB1234K (4th digit must be P)"
                    className={`w-full text-xs font-bold p-3 border rounded-lg bg-zinc-950/40 text-white focus:outline-none focus:border-[#00D0F5] ${
                      sthErrorField === 'pan' ? 'border-red-500 focus:border-red-500' : 'border-zinc-800'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Ownership Percentage (%) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="percentage_ownership"
                    required
                    value={sthForm.percentage_ownership}
                    onChange={handleSthChange}
                    placeholder="e.g. 100.00"
                    className={`w-full text-xs font-bold p-3 border rounded-lg bg-zinc-950/40 text-white focus:outline-none focus:border-[#00D0F5] ${
                      sthErrorField === 'percentage_ownership' ? 'border-red-500 focus:border-red-500' : 'border-zinc-800'
                    }`}
                  />
                </div>
              </div>

              <div className="flex gap-6 py-2 bg-zinc-955/20 border border-zinc-800 p-4 rounded-xl">
                <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    name="director"
                    checked={sthForm.director}
                    onChange={handleSthChange}
                    className="rounded border-zinc-800 bg-zinc-950 text-[#00D0F5] focus:ring-[#00D0F5]"
                  />
                  <span>Is Company Director</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    name="executive"
                    checked={sthForm.executive}
                    onChange={handleSthChange}
                    className="rounded border-zinc-800 bg-zinc-950 text-[#00D0F5] focus:ring-[#00D0F5]"
                  />
                  <span>Is Company Executive</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Primary Phone (Optional)</label>
                  <input
                    type="text"
                    name="phone_primary"
                    value={sthForm.phone_primary}
                    onChange={handleSthChange}
                    placeholder="8-11 digit primary phone"
                    className={`w-full text-xs font-bold p-3 border rounded-lg bg-zinc-950/40 text-white focus:outline-none focus:border-[#00D0F5] ${
                      sthErrorField === 'phone_primary' ? 'border-red-500 focus:border-red-500' : 'border-zinc-800'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Secondary Phone (Optional)</label>
                  <input
                    type="text"
                    name="phone_secondary"
                    value={sthForm.phone_secondary}
                    onChange={handleSthChange}
                    placeholder="8-11 digit secondary phone"
                    className={`w-full text-xs font-bold p-3 border rounded-lg bg-zinc-950/40 text-white focus:outline-none focus:border-[#00D0F5] ${
                      sthErrorField === 'phone_secondary' ? 'border-red-500 focus:border-red-500' : 'border-zinc-800'
                    }`}
                  />
                </div>
              </div>

              <h4 className="text-[10px] font-bold text-[#00D0F5] uppercase tracking-wider font-mono border-b border-zinc-850 pb-1">Residential Address (Optional)</h4>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Street Address</label>
                <input
                  type="text"
                  name="street"
                  value={sthForm.street}
                  onChange={handleSthChange}
                  placeholder="Street name, building, floor"
                  className={`w-full text-xs font-bold p-3 border rounded-lg bg-zinc-950/40 text-white focus:outline-none focus:border-[#00D0F5] ${
                    sthErrorField === 'street' ? 'border-red-500 focus:border-red-500' : 'border-zinc-800'
                  }`}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">City</label>
                  <input
                    type="text"
                    name="city"
                    value={sthForm.city}
                    onChange={handleSthChange}
                    placeholder="e.g. Bengaluru"
                    className="w-full text-xs font-bold p-3 border border-zinc-800 rounded-lg bg-zinc-950/40 text-white focus:outline-none focus:border-[#00D0F5]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">State</label>
                  <input
                    type="text"
                    name="state"
                    value={sthForm.state}
                    onChange={handleSthChange}
                    placeholder="e.g. Karnataka"
                    className="w-full text-xs font-bold p-3 border border-zinc-800 rounded-lg bg-zinc-950/40 text-white focus:outline-none focus:border-[#00D0F5]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Postal Code</label>
                  <input
                    type="text"
                    name="postal_code"
                    value={sthForm.postal_code}
                    onChange={handleSthChange}
                    placeholder="e.g. 560034"
                    className="w-full text-xs font-bold p-3 border border-zinc-800 rounded-lg bg-zinc-950/40 text-white focus:outline-none focus:border-[#00D0F5]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800 mt-4 font-mono">
                <button
                  type="button"
                  disabled={submittingStakeholder}
                  onClick={() => setShowStakeholderModal(false)}
                  className="px-5 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border border-zinc-700 text-zinc-400 hover:text-white cursor-pointer transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStakeholder}
                  className="px-6 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-[#00D0F5] hover:bg-[#00e5ff] text-zinc-950 cursor-pointer transition-all shadow-md shadow-[#00D0F5]/10 flex items-center gap-2 font-bold disabled:opacity-50"
                >
                  {submittingStakeholder && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{submittingStakeholder ? 'Submitting...' : 'Verify Stakeholder'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Product Update Modal Overlay */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-955/80 backdrop-blur-md transition-opacity"
            onClick={() => !updatingProduct && setShowUpdateModal(false)}
          ></div>

          {/* Modal Content */}
          <div className="bg-zinc-900 border border-zinc-750 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto no-scrollbar space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">Update Settlements Settings</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Provide corrected settlement criteria</p>
              </div>
              <button
                disabled={updatingProduct}
                onClick={() => setShowUpdateModal(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Alert Box */}
            {updateError && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl space-y-2 text-xs font-semibold text-red-400">
                <div className="flex gap-2 items-center">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>Validation Error {updateErrorField ? `on field [${updateErrorField}]` : ''}:</span>
                </div>
                <p className="font-mono text-[10px] bg-zinc-950/40 p-2 rounded border border-red-500/10">{updateError}</p>
              </div>
            )}

            <form onSubmit={handleUpdateSubmit} className="space-y-4 text-left font-sans">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Beneficiary Name *</label>
                <input
                  type="text"
                  name="beneficiary_name"
                  required
                  value={updateForm.beneficiary_name}
                  onChange={handleUpdateChange}
                  placeholder="As in bank details"
                  className={`w-full text-xs font-bold p-3 border rounded-lg bg-zinc-950/40 text-white focus:outline-none focus:border-[#00D0F5] ${
                    updateErrorField === 'beneficiary_name' ? 'border-red-500 focus:border-red-500' : 'border-zinc-800'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Settlements Bank Account Number *</label>
                <input
                  type="text"
                  name="account_number"
                  required
                  value={updateForm.account_number}
                  onChange={handleUpdateChange}
                  placeholder="5 to 20 digit bank account"
                  className={`w-full text-xs font-bold p-3 border rounded-lg bg-zinc-950/40 text-white focus:outline-none focus:border-[#00D0F5] ${
                    updateErrorField === 'account_number' ? 'border-red-500 focus:border-red-500' : 'border-zinc-800'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-zinc-550 uppercase tracking-wider">Branch IFS Code *</label>
                <input
                  type="text"
                  name="ifsc_code"
                  required
                  value={updateForm.ifsc_code}
                  onChange={handleUpdateChange}
                  placeholder="e.g. HDFC0000317"
                  className={`w-full text-xs font-bold p-3 border rounded-lg bg-zinc-955/40 text-white focus:outline-none focus:border-[#00D0F5] ${
                    updateErrorField === 'ifsc_code' ? 'border-red-500 focus:border-red-500' : 'border-zinc-800'
                  }`}
                />
              </div>

              <div className="flex gap-4 py-3 bg-zinc-955/20 border border-zinc-800 p-4 rounded-xl items-start">
                <input
                  type="checkbox"
                  id="updateTnc"
                  required
                  defaultChecked
                  disabled
                  className="rounded border-zinc-800 bg-zinc-955 text-[#00D0F5] mt-0.5"
                />
                <label htmlFor="updateTnc" className="text-[10px] text-zinc-400 font-semibold">
                  I confirm terms and conditions acceptance for Route settlements gateway configuration update.
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800 mt-4 font-mono">
                <button
                  type="button"
                  disabled={updatingProduct}
                  onClick={() => setShowUpdateModal(false)}
                  className="px-5 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border border-zinc-750 text-zinc-400 hover:text-white cursor-pointer transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingProduct}
                  className="px-6 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-[#00D0F5] hover:bg-[#00e5ff] text-zinc-950 cursor-pointer transition-all shadow-md shadow-[#00D0F5]/10 flex items-center gap-2 font-bold disabled:opacity-50"
                >
                  {updatingProduct && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{updatingProduct ? 'Updating...' : 'Update Settings'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


