'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Upload, FileText, Settings, RefreshCw } from 'lucide-react';
import {
  submitProductListing,
  updateProductListing,
  submitServiceListing,
  updateSellerCapability,
} from '@/app/actions/rewards';
import { listMachiningService } from '@/app/actions/marketplace';

interface AddListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: any;
  editingService: any;
  profile: any;
  fetchSellerData: () => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error') => void;
  localProducts: any[];
  setLocalProducts: (prods: any[]) => void;
  localServices: any[];
  setLocalServices: (servs: any[]) => void;
}

export default function AddListingModal({
  isOpen,
  onClose,
  editingProduct,
  editingService,
  profile,
  fetchSellerData,
  showToast,
  localProducts,
  setLocalProducts,
  localServices,
  setLocalServices,
}: AddListingModalProps) {
  const [publishingListing, setPublishingListing] = useState(false);
  const [listingType, setListingType] = useState<'Product' | 'Service'>('Product');
  const [selectedCategory, setSelectedCategory] = useState<string>('Actuators');
  const [selectedProcessType, setSelectedProcessType] = useState<string>('CNC Machining');
  const [customSpecs, setCustomSpecs] = useState<{ id: string; key: string; value: string }[]>([]);
  const [enableBulkPricing, setEnableBulkPricing] = useState(false);
  
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFileNames, setImageFileNames] = useState<string[]>([]);
  const [datasheetFile, setDatasheetFile] = useState<{ name: string; size: string; dataUrl: string } | null>(null);
  const [cadFile, setCadFile] = useState<{ name: string; size: string; dataUrl: string } | null>(null);

  const [dragActiveImage, setDragActiveImage] = useState(false);
  const [dragActiveDatasheet, setDragActiveDatasheet] = useState(false);
  const [dragActiveCad, setDragActiveCad] = useState(false);

  // Initialize state when editing changes
  useEffect(() => {
    if (editingProduct) {
      setListingType('Product');
      const standardCategories = ['Actuators', 'Sensors', 'Controllers', 'Mechanical', 'Power Supplies', 'Optics'];
      if (editingProduct.category && !standardCategories.includes(editingProduct.category)) {
        setSelectedCategory('Other');
      } else {
        setSelectedCategory(editingProduct.category || 'Actuators');
      }
      setEnableBulkPricing(Array.isArray(editingProduct.bulk_pricing) && editingProduct.bulk_pricing.length > 0);
      setImagePreviews(editingProduct.images_data || (editingProduct.image_data ? [editingProduct.image_data] : []));
      setImageFileNames(new Array(editingProduct.images_data?.length || (editingProduct.image_data ? 1 : 0)).fill('Product Image'));
      if (editingProduct.datasheet_url) {
        const isImg = editingProduct.datasheet_url.startsWith('data:image/') || /\.(png|jpe?g|gif|webp)$/i.test(editingProduct.datasheet_url);
        setDatasheetFile({
          name: isImg ? 'Technical Datasheet Image' : 'Technical Datasheet.pdf',
          size: 'Unknown Size',
          dataUrl: editingProduct.datasheet_url
        });
      } else {
        setDatasheetFile(null);
      }
      setCadFile(editingProduct.cad_file ? { name: '3D CAD Model.step', size: 'Unknown Size', dataUrl: editingProduct.cad_file } : null);
      
      if (editingProduct.specs) {
        const specsList = Object.entries(editingProduct.specs).map(([key, value]) => ({
          id: Math.random().toString(),
          key,
          value: String(value)
        }));
        setCustomSpecs(specsList);
      } else {
        setCustomSpecs([]);
      }
    } else if (editingService) {
      setListingType('Service');
      const standardProcesses = ['CNC Machining', '3D Printing', 'Sheet Metal', 'Laser Cutting'];
      if (editingService.process_type && !standardProcesses.includes(editingService.process_type)) {
        setSelectedProcessType('Other');
      } else {
        setSelectedProcessType(editingService.process_type || 'CNC Machining');
      }
      setImagePreviews(editingService.images_data || (editingService.image_data ? [editingService.image_data] : []));
      setImageFileNames(new Array(editingService.images_data?.length || (editingService.image_data ? 1 : 0)).fill('Service Image'));
      setDatasheetFile(null);
      setCadFile(null);
      setCustomSpecs([]);
      setEnableBulkPricing(false);
    } else {
      setListingType('Product');
      setSelectedCategory('Actuators');
      setSelectedProcessType('CNC Machining');
      setEnableBulkPricing(false);
      setImagePreviews([]);
      setImageFileNames([]);
      setDatasheetFile(null);
      setCadFile(null);
      setCustomSpecs([]);
    }
  }, [editingProduct, editingService, isOpen]);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent, type: 'image' | 'datasheet' | 'cad') => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      if (type === 'image') setDragActiveImage(true);
      if (type === 'datasheet') setDragActiveDatasheet(true);
      if (type === 'cad') setDragActiveCad(true);
    } else if (e.type === "dragleave") {
      if (type === 'image') setDragActiveImage(false);
      if (type === 'datasheet') setDragActiveDatasheet(false);
      if (type === 'cad') setDragActiveCad(false);
    }
  };

  const processFile = (file: File, type: 'image' | 'datasheet' | 'cad') => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      if (type === 'image') {
        setImagePreviews(prev => [...prev, reader.result as string]);
        setImageFileNames(prev => [...prev, file.name]);
      } else if (type === 'datasheet') {
        setDatasheetFile({ name: file.name, size: sizeStr, dataUrl: reader.result as string });
      } else if (type === 'cad') {
        setCadFile({ name: file.name, size: sizeStr, dataUrl: reader.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent, type: 'image' | 'datasheet' | 'cad') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'image') setDragActiveImage(false);
    if (type === 'datasheet') setDragActiveDatasheet(false);
    if (type === 'cad') setDragActiveCad(false);

    if (e.dataTransfer.files) {
      if (type === 'image') {
        Array.from(e.dataTransfer.files).forEach(file => {
          if (file.type.startsWith('image/')) {
            processFile(file, type);
          }
        });
      } else if (e.dataTransfer.files[0]) {
        processFile(e.dataTransfer.files[0], type);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-zinc-800 border border-zinc-700/60 rounded-xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative z-10 animate-slide-in space-y-4 font-mono text-left">
        <div className="flex justify-between items-start pb-3 border-b border-zinc-700/60">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Seller Workspace</span>
            <h3 className="text-base font-bold text-white uppercase font-['Space_Grotesk']">
              {editingProduct ? 'Edit Technical Product' : editingService ? 'Edit Technical Service' : 'Create Technical Listing'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-zinc-900 border border-zinc-700/60 text-zinc-500 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form
          key={editingProduct ? editingProduct.id : editingService ? editingService.id : 'new'}
          onSubmit={async (e) => {
            e.preventDefault();
            if (publishingListing) return;
            setPublishingListing(true);

            try {
              const target = e.target as any;
              const title = target.title.value.trim();
              const type = target.type.value;
              const price = Number(target.price.value) || 0;
              const desc = target.description.value.trim();
              const gradient = imagePreviews.length > 0 ? 'custom-image' : 'from-cobalt/20 to-cobalt/5 border-cobalt/20';

              if (type === 'Product') {
                const sku = target.sku.value.trim();
                const category = selectedCategory === 'Other' ? target.customCategory.value.trim() : selectedCategory;
                const stock = Number(target.stock.value) || 0;

                const productData = {
                  part_number: sku,
                  title: title,
                  category: category,
                  price: price,
                  stock: stock,
                  description: desc,
                  gradient_class: gradient,
                  image_data: imagePreviews[0] || undefined,
                  images_data: imagePreviews || [],
                  specs: customSpecs.reduce((acc, curr) => {
                    if (curr.key.trim()) {
                      acc[curr.key.trim()] = curr.value.trim();
                    }
                    return acc;
                  }, {} as Record<string, string>),
                  bulk_pricing: enableBulkPricing ? [
                    { minQty: 10, pricePerUnit: Number(target.tierPrice1?.value) || price },
                    { minQty: 50, pricePerUnit: Number(target.tierPrice2?.value) || price }
                  ] : [],
                  datasheet_url: datasheetFile ? datasheetFile.dataUrl : '',
                  cad_file: cadFile ? cadFile.dataUrl : '',
                  extended_specs: {
                    ingressProtection: target.ipRating.value.trim(),
                    mtbf: target.mtbf.value.trim(),
                    dimensions: 'Standard Frame'
                  }
                };

                if (editingProduct) {
                  try {
                    await updateProductListing(editingProduct.id, productData);
                    showToast(`Technical Product "${title}" (${sku}) updated successfully!`, 'success');
                    await fetchSellerData();
                  } catch (dbErr: any) {
                    console.error('DB update failed:', dbErr?.message);
                    showToast(`Product update failed: ${dbErr?.message || 'Unknown'}`, 'error');
                  }
                } else {
                  const newProduct = {
                    id: crypto.randomUUID ? crypto.randomUUID() : 'prod-' + Math.random().toString(36).substr(2, 9),
                    ...productData
                  };

                  const updatedProds = [...localProducts, newProduct];
                  setLocalProducts(updatedProds);
                  localStorage.setItem('local_listed_products', JSON.stringify(updatedProds));

                  try {
                    await submitProductListing(productData);
                    const withoutNew = updatedProds.filter((p: any) => p.id !== newProduct.id);
                    setLocalProducts(withoutNew);
                    localStorage.setItem('local_listed_products', JSON.stringify(withoutNew));
                    showToast(`Technical Product "${title}" (${sku}) published and live in marketplace!`, 'success');
                    await fetchSellerData();
                  } catch (dbErr: any) {
                    console.warn('DB insert failed, product saved locally:', dbErr?.message);
                    showToast(`Product saved locally. DB error: ${dbErr?.message || 'Unknown'}`, 'error');
                  }
                }
              } else {
                const processType = selectedProcessType === 'Other'
                  ? target.customProcessType.value.trim()
                  : selectedProcessType;
                const leadTime = target.leadTime.value.trim();
                const materials = target.materials.value.trim();
                const finishes = target.finishes.value.trim();

                if (editingService) {
                  try {
                    await updateSellerCapability(editingService.id, {
                      title: title,
                      processType: processType as any,
                      description: desc,
                      basePrice: price,
                      leadTime: leadTime,
                      materials: materials.split(',').map((s: string) => s.trim()).filter(Boolean),
                      finishes: finishes.split(',').map((s: string) => s.trim()).filter(Boolean),
                      imageData: imagePreviews[0] || undefined,
                      imagesData: imagePreviews || [],
                    });
                    showToast(`Technical Service "${title}" (${processType}) updated successfully!`, 'success');
                    await fetchSellerData();
                  } catch (dbErr: any) {
                    console.error('DB update failed:', dbErr?.message);
                    showToast(`Service update failed: ${dbErr?.message || 'Unknown'}`, 'error');
                  }
                } else {
                  const newService = {
                    id: crypto.randomUUID ? crypto.randomUUID() : 'serv-' + Math.random().toString(36).substr(2, 9),
                    title: title,
                    category: processType,
                    base_price: price,
                    lead_time: `${leadTime} Lead`,
                    features: materials.split(',').map((s: string) => s.trim()).filter(Boolean),
                    gradient_class: gradient,
                    image_data: imagePreviews[0] || undefined,
                    images_data: imagePreviews || []
                  };

                  const updatedServs = [...localServices, newService];
                  setLocalServices(updatedServs);
                  localStorage.setItem('local_listed_services', JSON.stringify(updatedServs));

                  try {
                    await submitServiceListing({
                      title: newService.title,
                      category: newService.category,
                      description: desc,
                      base_price: newService.base_price,
                      lead_time: newService.lead_time,
                      features: newService.features,
                      gradient_class: newService.gradient_class,
                      image_data: newService.image_data,
                      images_data: newService.images_data
                    });
                  } catch (err) {
                    console.warn('Failed to submit general service catalog listing:', err);
                  }

                  try {
                    await listMachiningService(profile.id, {
                      title: title,
                      processType: processType as any,
                      description: desc,
                      basePrice: price,
                      leadTime: leadTime,
                      materials: materials.split(',').map((s: string) => s.trim()).filter(Boolean),
                      finishes: finishes.split(',').map((s: string) => s.trim()).filter(Boolean),
                      imageData: imagePreviews[0] || undefined,
                      imagesData: imagePreviews || [],
                    });
                    await fetchSellerData();
                  } catch (err) {
                    console.warn('Failed to submit custom machining capability:', err);
                  }

                  showToast(`Technical Service "${title}" (${processType}) published successfully!`, 'success');
                }
              }

              setImagePreviews([]);
              setImageFileNames([]);
              onClose();
            } finally {
              setPublishingListing(false);
            }
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
            {/* LEFT COLUMN: Basic Info & Tech Specifications */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase">Listing Type</label>
                <select
                  name="type"
                  value={listingType}
                  onChange={(e) => setListingType(e.target.value as any)}
                  className="w-full text-xs font-bold p-2 border border-zinc-700/60 bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]"
                >
                  <option value="Product">Catalog Product</option>
                  <option value="Service">Custom Machining Service</option>
                </select>
              </div>

              {listingType === 'Product' ? (
                <>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase">Part Number / SKU *</label>
                    <input required type="text" name="sku" defaultValue={editingProduct?.part_number || editingProduct?.sku || ''} placeholder="e.g. ACT-NEMA34-CL" className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase">Title / Name *</label>
                    <input required type="text" name="title" defaultValue={editingProduct?.title || ''} placeholder="e.g. NEMA 34 Stepper Motor" className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase">Category *</label>
                      <select
                        name="category"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full text-xs font-bold p-2 border border-zinc-700/60 bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4] rounded"
                      >
                        <option value="Actuators">Actuators</option>
                        <option value="Sensors">Sensors</option>
                        <option value="Controllers">Controllers</option>
                        <option value="Mechanical">Mechanical</option>
                        <option value="Power Supplies">Power Supplies</option>
                        <option value="Optics">Optics</option>
                        <option value="Other">Other (Custom)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase">Stock Qty *</label>
                      <input required type="number" name="stock" defaultValue={editingProduct?.stock !== undefined ? editingProduct.stock : ''} placeholder="e.g. 10" min={0} className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                    </div>
                  </div>

                  {selectedCategory === 'Other' && (
                    <div className="space-y-1 animate-slide-in">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase">Enter Custom Category *</label>
                      <input required type="text" name="customCategory" defaultValue={editingProduct?.category || ''} placeholder="e.g. Pneumatics" className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase">Unit Price (INR) *</label>
                    <input required type="number" name="price" defaultValue={editingProduct?.price !== undefined ? editingProduct.price : ''} placeholder="e.g. 24500" className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                  </div>

                  {/* Technical Specifications */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase">Tech Specifications (Key-Value)</label>
                      <button
                        type="button"
                        onClick={() => setCustomSpecs([...customSpecs, { id: Math.random().toString(), key: '', value: '' }])}
                        className="text-[#06b6d4] hover:text-[#0b9cb5] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Spec
                      </button>
                    </div>
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 no-scrollbar">
                      {customSpecs.map((spec) => (
                        <div key={spec.id} className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Key"
                            value={spec.key}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomSpecs(prev => prev.map(s => s.id === spec.id ? { ...s, key: val } : s));
                            }}
                            className="w-[45%] text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Value"
                            value={spec.value}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomSpecs(prev => prev.map(s => s.id === spec.id ? { ...s, value: val } : s));
                            }}
                            className="w-[45%] text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setCustomSpecs(prev => prev.filter(s => s.id !== spec.id))}
                            className="p-1 rounded hover:bg-zinc-900 border border-zinc-700/60 text-red-500 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase">Service Title *</label>
                    <input required type="text" name="title" defaultValue={editingService?.title || ''} placeholder="e.g. 5-Axis CNC Machining" className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase">Process Type *</label>
                    <select
                      name="processType"
                      value={selectedProcessType}
                      onChange={(e) => setSelectedProcessType(e.target.value)}
                      className="w-full text-xs font-bold p-2 border border-zinc-700/60 bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4] rounded"
                    >
                      <option value="CNC Machining">CNC Machining</option>
                      <option value="3D Printing">3D Printing</option>
                      <option value="Sheet Metal">Sheet Metal</option>
                      <option value="Laser Cutting">Laser Cutting</option>
                      <option value="Other">Other (Custom)</option>
                    </select>
                  </div>

                  {selectedProcessType === 'Other' && (
                    <div className="space-y-1 animate-slide-in">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase">Enter Custom Process Type *</label>
                      <input required type="text" name="customProcessType" defaultValue={editingService?.process_type || ''} placeholder="e.g. Waterjet Cutting" className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase">Base Cost / Setup Fee (INR) *</label>
                    <input required type="number" name="price" defaultValue={editingService?.base_price !== undefined ? editingService.base_price : ''} placeholder="e.g. 7500" className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase">Estimated Lead Time *</label>
                    <input required type="text" name="leadTime" defaultValue={editingService?.lead_time || ''} placeholder="e.g. 3-5 Days" className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                  </div>
                </>
              )}
            </div>

            {/* RIGHT COLUMN: Assets, Documents & Tiers */}
            <div className="space-y-3">
              {listingType === 'Product' ? (
                <>
                  {/* Image Upload Area */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase">Product Images *</label>
                    <div
                      onDragEnter={(e) => handleDrag(e, 'image')}
                      onDragOver={(e) => handleDrag(e, 'image')}
                      onDragLeave={(e) => handleDrag(e, 'image')}
                      onDrop={(e) => handleDrop(e, 'image')}
                      className={`relative border-2 border-dashed rounded p-3 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer ${dragActiveImage ? 'border-[#06b6d4] bg-[#06b6d4]/5' : 'border-zinc-700/60 hover:border-[#76777d]'}`}
                    >
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.svg"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            Array.from(e.target.files).forEach(file => processFile(file, 'image'));
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Upload className="w-5 h-5 text-zinc-500" />
                      <span className="text-[10px] text-zinc-400 font-bold leading-tight">
                        {imagePreviews.length > 0 ? `Selected ${imagePreviews.length} Image(s)` : 'Drag & Drop or Click to Upload Images'}
                      </span>
                    </div>
                    {imagePreviews.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {imagePreviews.map((src, index) => (
                          <div key={index} className="relative w-10 h-10 border border-zinc-700/60 overflow-hidden rounded group">
                            <img src={src} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                setImagePreviews(prev => prev.filter((_, i) => i !== index));
                                setImageFileNames(prev => prev.filter((_, i) => i !== index));
                              }}
                              className="absolute top-0.5 right-0.5 bg-red-500 hover:bg-red-700 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-black cursor-pointer shadow-sm"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                   {/* Datasheet Upload Area */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase">Technical Datasheet (PDF or Image)</label>
                    <div
                      onDragEnter={(e) => handleDrag(e, 'datasheet')}
                      onDragOver={(e) => handleDrag(e, 'datasheet')}
                      onDragLeave={(e) => handleDrag(e, 'datasheet')}
                      onDrop={(e) => handleDrop(e, 'datasheet')}
                      className={`relative border-2 border-dashed rounded p-3 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer ${dragActiveDatasheet ? 'border-[#06b6d4] bg-[#06b6d4]/5' : 'border-zinc-700/60 hover:border-[#76777d]'}`}
                    >
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            processFile(e.target.files[0], 'datasheet');
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <FileText className="w-4 h-4 text-zinc-500" />
                      <span className="text-[10px] text-zinc-400 font-bold leading-tight">
                        {datasheetFile ? `Uploaded: ${datasheetFile.name}` : 'Drag & Drop or Click to Upload PDF / Image'}
                      </span>
                    </div>
                    {datasheetFile && (
                      <div className="flex justify-between items-center text-[9px] font-bold uppercase mt-1">
                        <span className="text-emerald">{datasheetFile.size}</span>
                        <button type="button" onClick={() => setDatasheetFile(null)} className="text-red-500 hover:text-red-700">Remove File</button>
                      </div>
                    )}
                  </div>

                  {/* CAD Model Upload Area */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase">3D CAD Model (STEP, STP, IGES)</label>
                    <div
                      onDragEnter={(e) => handleDrag(e, 'cad')}
                      onDragOver={(e) => handleDrag(e, 'cad')}
                      onDragLeave={(e) => handleDrag(e, 'cad')}
                      onDrop={(e) => handleDrop(e, 'cad')}
                      className={`relative border-2 border-dashed rounded p-3 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer ${dragActiveCad ? 'border-[#06b6d4] bg-[#06b6d4]/5' : 'border-zinc-700/60 hover:border-[#76777d]'}`}
                    >
                      <input
                        type="file"
                        accept=".step,.stp,.iges,.igs"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            processFile(e.target.files[0], 'cad');
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Settings className="w-4 h-4 text-zinc-500" />
                      <span className="text-[10px] text-zinc-400 font-bold leading-tight">
                        {cadFile ? `Uploaded: ${cadFile.name}` : 'Drag & Drop or Click to Upload CAD'}
                      </span>
                    </div>
                    {cadFile && (
                      <div className="flex justify-between items-center text-[9px] font-bold uppercase mt-1">
                        <span className="text-emerald">{cadFile.size}</span>
                        <button type="button" onClick={() => setCadFile(null)} className="text-red-500 hover:text-red-700">Remove CAD</button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase">Ingress Rating</label>
                      <input type="text" name="ipRating" defaultValue={editingProduct?.extended_specs?.ingressProtection || ''} placeholder="e.g. IP65" className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase">MTBF Lifespan</label>
                      <input type="text" name="mtbf" defaultValue={editingProduct?.extended_specs?.mtbf || ''} placeholder="e.g. 50,000 Hours" className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                    </div>
                  </div>

                  {/* Volume Pricing Tiers */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase">Enable Bulk Pricing</label>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={enableBulkPricing}
                          onChange={(e) => setEnableBulkPricing(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-800 after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#06b6d4]"></div>
                      </label>
                    </div>
                    {enableBulkPricing && (
                      <div className="space-y-2 border border-zinc-700/60 p-2.5 rounded bg-zinc-900 animate-slide-in">
                        <div className="flex gap-2 items-center">
                          <span className="text-[10px] text-zinc-500 font-bold font-mono w-[60px]">10+ Qty:</span>
                          <input required type="number" name="tierPrice1" defaultValue={editingProduct?.bulk_pricing?.[0]?.pricePerUnit || ''} placeholder="Discount price" className="flex-1 text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none" />
                        </div>
                        <div className="flex gap-2 items-center">
                          <span className="text-[10px] text-zinc-500 font-bold font-mono w-[60px]">50+ Qty:</span>
                          <input required type="number" name="tierPrice2" defaultValue={editingProduct?.bulk_pricing?.[1]?.pricePerUnit || ''} placeholder="Discount price" className="flex-1 text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none" />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase">Material Capabilities *</label>
                    <input required type="text" name="materials" defaultValue={editingService?.material_capabilities ? editingService.material_capabilities.join(', ') : ''} placeholder="e.g. Aluminum 6061, Brass, Steel 1018, Delrin" className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase">Finishing Options *</label>
                    <input required type="text" name="finishes" defaultValue={editingService?.finish_options ? editingService.finish_options.join(', ') : ''} placeholder="e.g. Anodized, Bead Blasted, Raw" className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4]" />
                  </div>

                  {/* Image Upload Area for Service */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase">Service Images</label>
                    <div
                      onDragEnter={(e) => handleDrag(e, 'image')}
                      onDragOver={(e) => handleDrag(e, 'image')}
                      onDragLeave={(e) => handleDrag(e, 'image')}
                      onDrop={(e) => handleDrop(e, 'image')}
                      className={`relative border-2 border-dashed rounded p-3 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer ${dragActiveImage ? 'border-[#06b6d4] bg-[#06b6d4]/5' : 'border-zinc-700/60 hover:border-[#76777d]'}`}
                    >
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.svg"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            Array.from(e.target.files).forEach(file => processFile(file, 'image'));
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Upload className="w-5 h-5 text-zinc-500" />
                      <span className="text-[10px] text-zinc-400 font-bold leading-tight">
                        {imagePreviews.length > 0 ? `Selected ${imagePreviews.length} Image(s)` : 'Drag & Drop or Click to Upload Images'}
                      </span>
                    </div>
                    {imagePreviews.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {imagePreviews.map((src, index) => (
                          <div key={index} className="relative w-10 h-10 border border-zinc-700/60 overflow-hidden rounded group">
                            <img src={src} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                setImagePreviews(prev => prev.filter((_, i) => i !== index));
                                setImageFileNames(prev => prev.filter((_, i) => i !== index));
                              }}
                              className="absolute top-0.5 right-0.5 bg-red-500 hover:bg-red-700 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-black cursor-pointer shadow-sm"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase">Description / Scope of Service</label>
                <textarea rows={listingType === 'Service' ? 5 : 2} name="description" defaultValue={editingProduct?.description || editingService?.description || ''} placeholder="Specify technical details, machine tools, dimensional limits..." className="w-full text-xs p-2 border border-zinc-700/60 rounded bg-zinc-800 text-white focus:outline-none focus:border-[#06b6d4] resize-none" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-zinc-700/60">
            <button
              type="submit"
              disabled={publishingListing}
              className="flex-1 bg-[#0f172a] hover:bg-[#06b6d4] text-white py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer text-center disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {publishingListing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{editingProduct || editingService ? 'Saving...' : 'Publishing...'}</span>
                </>
              ) : (
                <span>{editingProduct || editingService ? 'Save Changes' : 'Publish'}</span>
              )}
            </button>
            <button type="button" onClick={onClose} className="flex-1 border border-zinc-700/60 hover:bg-zinc-900 text-zinc-500 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
