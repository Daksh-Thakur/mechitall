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
  imageData?: string;
  imagesData?: string[];
}

// Realistic products catalog
export const MOCK_PARTS: Part[] = [
  {
    id: 'stepper-nema17-1',
    partNumber: 'MIA-ST-N17-48',
    title: 'NEMA 17 High-Torque Stepper Motor',
    category: 'Actuators',
    price: 850,
    stock: 145,
    description: 'High-precision 1.8 degree step angle NEMA 17 bipolar stepper motor. Ideal for 3D printers, CNC routers, and precise automation tasks. Features 48Ncm holding torque and robust internal bearings.',
    gradientClass: 'from-amber-500/20 to-amber-700/5',
    specs: {
      'Step Angle': '1.8°',
      'Holding Torque': '48 N·cm',
      'Rated Current': '1.5A/Phase',
      'Phase Resistance': '2.0 Ohms',
      'Shaft Diameter': '5mm'
    },
    bulkPricing: [
      { minQty: 1, maxQty: 9, pricePerUnit: 850 },
      { minQty: 10, maxQty: 49, pricePerUnit: 790 },
      { minQty: 50, pricePerUnit: 720 }
    ],
    datasheetUrl: '#',
    cadFile: '#',
    extendedSpecs: {
      dimensions: '42.3 x 42.3 x 48 mm',
      electricalRating: '1.5A / 3.0V DC',
      temperatureRange: '-20°C to 50°C',
      mtbf: '10,000 hrs',
      ingressProtection: 'IP40'
    }
  },
  {
    id: 'sensor-lidar-1',
    partNumber: 'MIA-SN-LD-01',
    title: 'TF-Luna Micro LiDAR Module',
    category: 'Sensors',
    price: 2450,
    stock: 32,
    description: 'Single-point ranging LiDAR based on ToF (Time of Flight) principle. Offers highly stable, accurate, and high-frame-rate range detection up to 8 meters. Supports I2C and UART interfaces.',
    gradientClass: 'from-emerald-500/20 to-emerald-700/5',
    specs: {
      'Range': '0.2m - 8m',
      'Accuracy': '±6cm',
      'FOV': '2°',
      'Interface': 'UART / I2C'
    },
    bulkPricing: [
      { minQty: 1, maxQty: 4, pricePerUnit: 2450 },
      { minQty: 5, maxQty: 19, pricePerUnit: 2200 },
      { minQty: 20, pricePerUnit: 1950 }
    ],
    datasheetUrl: '#',
    cadFile: '#',
    extendedSpecs: {
      dimensions: '35 x 21.25 x 13.5 mm',
      electricalRating: '5V DC / \u003c70mA',
      temperatureRange: '-10°C to 60°C',
      mtbf: '20,000 hrs',
      ingressProtection: 'IP65'
    }
  },
  {
    id: 'controller-esp32-1',
    partNumber: 'MIA-CB-E32-WROOM',
    title: 'ESP32-WROOM-32U Development Board',
    category: 'Control Boards',
    price: 495,
    stock: 210,
    description: 'Powerful, generic Wi-Fi+BT+BLE MCU module that targets a wide variety of applications, ranging from low-power sensor networks to the most demanding tasks, such as voice encoding and MP3 decoding.',
    gradientClass: 'from-cobalt/20 to-cobalt/5',
    specs: {
      'Processor': 'Xtensa 32-bit LX6',
      'Clock Speed': '240 MHz',
      'SRAM': '520 KB',
      'Flash': '4 MB',
      'Connectivity': 'WiFi 802.11 b/g/n, Bluetooth v4.2 BR/EDR'
    },
    bulkPricing: [
      { minQty: 1, maxQty: 24, pricePerUnit: 495 },
      { minQty: 25, pricePerUnit: 440 }
    ],
    datasheetUrl: '#',
    cadFile: '#',
    extendedSpecs: {
      dimensions: '55.3 x 28.0 x 5.0 mm',
      electricalRating: '5V via USB, 3.3V Logic',
      temperatureRange: '-40°C to 85°C',
      mtbf: '50,000 hrs',
      ingressProtection: 'N/A'
    }
  }
];

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
