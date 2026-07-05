export interface PartSpec {
  [key: string]: string;
}

export interface BulkPriceTier {
  minQty: number;
  maxQty?: number; // undefined means "or more"
  pricePerUnit: number;
}

export interface Part {
  id: string;
  partNumber: string;
  title: string;
  category: 'Actuators' | 'Sensors' | 'Control Boards' | 'Mechanical';
  price: number;
  stock: number;
  description: string;
  gradientClass: string;
  specs: PartSpec;
  bulkPricing: BulkPriceTier[];
  datasheetUrl: string;
  cadFile: string;
  extendedSpecs: {
    dimensions: string;
    electricalRating?: string;
    temperatureRange: string;
    mtbf: string; // Mean Time Between Failures
    ingressProtection: string; // IP Rating
  };
}

// Cleared products catalog as requested
export const MOCK_PARTS: Part[] = [];

// RFQ Custom Manufacturing Constants
export const MFG_PROCESSES = [
  { id: 'cnc-mill-3', name: 'CNC Milling (3-Axis)', baseCost: 150, complexityMultiplier: 1.0 },
  { id: 'cnc-mill-5', name: 'CNC Milling (5-Axis High Precision)', baseCost: 320, complexityMultiplier: 1.5 },
  { id: 'sls-3d', name: 'SLS 3D Printing (Nylon)', baseCost: 45, complexityMultiplier: 0.6 },
  { id: 'sla-3d', name: 'SLA 3D Printing (Resin, High Detail)', baseCost: 65, complexityMultiplier: 0.75 },
  { id: 'sheet-metal', name: 'Sheet Metal Bending & Laser', baseCost: 95, complexityMultiplier: 0.8 },
];

export const MATERIALS = [
  { id: 'al-6061', name: 'Aluminum 6061-T6', densityGcm3: 2.7, pricePerKg: 15, machClass: 'easy' },
  { id: 'ss-316', name: 'Stainless Steel 316L', densityGcm3: 8.0, pricePerKg: 35, machClass: 'hard' },
  { id: 'delrin', name: 'Delrin POM (White/Black)', densityGcm3: 1.4, pricePerKg: 18, machClass: 'easy' },
  { id: 'ti-gr5', name: 'Titanium Grade 5 (Ti-6Al-4V)', densityGcm3: 4.4, pricePerKg: 95, machClass: 'extreme' },
  { id: 'peek', name: 'PEEK (Polyetheretherketone)', densityGcm3: 1.3, pricePerKg: 180, machClass: 'moderate' },
];

export const FINISHES = [
  { id: 'as-machined', name: 'As-Machined (Ra 3.2μm)', costMultiplier: 1.0 },
  { id: 'bead-blast', name: 'Bead Blasted (Satin Matte)', costMultiplier: 1.15 },
  { id: 'anodize-ii', name: 'Anodized Type II (Colored)', costMultiplier: 1.25 },
  { id: 'anodize-iii', name: 'Hard Anodized Type III (Wear Resistant)', costMultiplier: 1.45 },
  { id: 'electropolish', name: 'Electropolished', costMultiplier: 1.35 },
];

export const LEAD_TIMES = [
  { id: 'standard', name: 'Standard (10 business days)', priceMultiplier: 1.0 },
  { id: 'expedited', name: 'Expedited (4 business days)', priceMultiplier: 1.4 },
  { id: 'rush', name: 'Rush Prototype (48 hours)', priceMultiplier: 2.0 },
];
