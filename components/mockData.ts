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

export const MOCK_PARTS: Part[] = [
  {
    id: '1',
    partNumber: 'MIA-ACT-NEMA23-CL',
    title: 'NEMA 23 Closed-Loop Stepper Motor',
    category: 'Actuators',
    price: 189.00,
    stock: 45,
    description: 'High-torque hybrid closed-loop stepper motor with integrated 1000-line optical encoder. Prevents lost steps and guarantees precise angular positioning.',
    gradientClass: 'from-blue-500/20 to-indigo-500/10',
    specs: {
      'Holding Torque': '2.2 N.m (311 oz-in)',
      'Step Angle': '1.8°',
      'Phase Current': '4.2A',
      'Shaft Diameter': '8mm',
      'Interface': 'RS485 Modbus / Pulse-Dir',
    },
    extendedSpecs: {
      dimensions: '57 x 57 x 80 mm',
      electricalRating: '24-50 VDC Supply Voltage',
      temperatureRange: '-20°C to +50°C',
      mtbf: '50,000 Hours',
      ingressProtection: 'IP54',
    },
    bulkPricing: [
      { minQty: 1, maxQty: 9, pricePerUnit: 189.00 },
      { minQty: 10, maxQty: 49, pricePerUnit: 165.00 },
      { minQty: 50, pricePerUnit: 142.00 },
    ],
    datasheetUrl: '#datasheet-nema23',
    cadFile: 'MIA-ACT-NEMA23.step',
  },
  {
    id: '2',
    partNumber: 'MIA-SEN-LIDAR-40M',
    title: 'LiDAR ToF Distance Sensor (40m)',
    category: 'Sensors',
    price: 349.50,
    stock: 28,
    description: 'Industrial-grade Time-of-Flight LiDAR sensor. High frequency distance measurement up to 40 meters. Unaffected by ambient lighting conditions.',
    gradientClass: 'from-emerald-500/20 to-teal-500/10',
    specs: {
      'Range': '0.1m - 40m',
      'Accuracy': '±1.5 cm',
      'Scan Frequency': '100 Hz',
      'Field of View': '1.5° (Laser Class 1)',
      'Interface': 'I2C / SPI / CAN-Bus',
    },
    extendedSpecs: {
      dimensions: '42 x 38 x 26 mm',
      electricalRating: '5.0V VDC ±10%, 150mA active',
      temperatureRange: '-10°C to +60°C',
      mtbf: '80,000 Hours',
      ingressProtection: 'IP67 Waterproof',
    },
    bulkPricing: [
      { minQty: 1, maxQty: 4, pricePerUnit: 349.50 },
      { minQty: 5, maxQty: 19, pricePerUnit: 310.00 },
      { minQty: 20, pricePerUnit: 275.00 },
    ],
    datasheetUrl: '#datasheet-lidar40',
    cadFile: 'MIA-SEN-LIDAR-40M.step',
  },
  {
    id: '3',
    partNumber: 'MIA-CON-STM32-H42',
    title: 'MechController V4.2 Cortex-M7 Core',
    category: 'Control Boards',
    price: 275.00,
    stock: 62,
    description: 'High-performance control board based on STM32H7. Fully integrated stepper drivers, encoder inputs, CAN-FD, and Ethernet for distributed control.',
    gradientClass: 'from-amber-500/20 to-orange-500/10',
    specs: {
      'MCU': 'STM32H743IIT6 (480 MHz)',
      'Motor Drivers': '4x TMC5160 Pro (Up to 8A)',
      'Encoder Inputs': '4x Differential Channels',
      'Connectivity': 'Ethernet (10/100), CAN-FD, USB-C',
      'Flash Memory': '16MB QSPI Flash',
    },
    extendedSpecs: {
      dimensions: '120 x 85 x 22 mm',
      electricalRating: '12-48 VDC Logic & Power Ground Isolation',
      temperatureRange: '-40°C to +85°C (Industrial)',
      mtbf: '100,000 Hours',
      ingressProtection: 'IP20 (Open frame)',
    },
    bulkPricing: [
      { minQty: 1, maxQty: 9, pricePerUnit: 275.00 },
      { minQty: 10, maxQty: 24, pricePerUnit: 249.00 },
      { minQty: 25, pricePerUnit: 220.00 },
    ],
    datasheetUrl: '#datasheet-ctrl42',
    cadFile: 'MIA-CON-STM32-H42.step',
  },
  {
    id: '4',
    partNumber: 'MIA-MCH-BALLSCREW-1605',
    title: 'SFU1605 Rolled Ball Screw (600mm)',
    category: 'Mechanical',
    price: 95.00,
    stock: 15,
    description: 'Precision grade C7 rolled steel ball screw with single ball nut. Perfect for CNC linear rails, offering low friction, high efficiency, and minimal backlash.',
    gradientClass: 'from-violet-500/20 to-purple-500/10',
    specs: {
      'Screw Diameter': '16 mm',
      'Lead / Pitch': '5 mm',
      'Overall Length': '600 mm',
      'Accuracy Grade': 'C7 (±50μm per 300mm)',
      'Material': 'High-Carbon Bearing Steel',
    },
    extendedSpecs: {
      dimensions: 'Ø16mm x 600mm length',
      electricalRating: 'N/A (Mechanical)',
      temperatureRange: '-20°C to +120°C',
      mtbf: '2,000,000 Linear Cycles',
      ingressProtection: 'N/A (Lube Sealed)',
    },
    bulkPricing: [
      { minQty: 1, maxQty: 19, pricePerUnit: 95.00 },
      { minQty: 20, maxQty: 99, pricePerUnit: 82.00 },
      { minQty: 100, pricePerUnit: 70.00 },
    ],
    datasheetUrl: '#datasheet-screw1605',
    cadFile: 'MIA-MCH-BS-1605-600.step',
  },
  {
    id: '5',
    partNumber: 'MIA-ACT-BLDC-800W',
    title: 'High-Torque Outrunner BLDC Motor',
    category: 'Actuators',
    price: 245.00,
    stock: 19,
    description: 'Compact 800W brushless DC motor with built-in hall sensors and temperature monitoring. Designed for robotic traction and heavy-duty linear drive applications.',
    gradientClass: 'from-blue-500/20 to-cyan-500/10',
    specs: {
      'Max Power': '800 W',
      'Kv Rating': '140 Kv',
      'Max Torque': '4.5 N.m',
      'Rated Speed': '3500 RPM',
      'Sensors': '3x Hall Sensors + NTC thermistor',
    },
    extendedSpecs: {
      dimensions: 'Ø63mm x 54mm length',
      electricalRating: '36-48 VDC, 25A nominal current',
      temperatureRange: '-20°C to +80°C',
      mtbf: '60,000 Hours',
      ingressProtection: 'IP65',
    },
    bulkPricing: [
      { minQty: 1, maxQty: 9, pricePerUnit: 245.00 },
      { minQty: 10, maxQty: 49, pricePerUnit: 215.00 },
      { minQty: 50, pricePerUnit: 190.00 },
    ],
    datasheetUrl: '#datasheet-bldc800',
    cadFile: 'MIA-ACT-BLDC-800W.step',
  },
  {
    id: '6',
    partNumber: 'MIA-SEN-ENCODER-ABS',
    title: '18-Bit Absolute Rotary Encoder',
    category: 'Sensors',
    price: 159.90,
    stock: 52,
    description: 'SSI/BiSS-C protocol magnetic absolute encoder. Features 18-bit resolution (262,144 positions per revolution) in a tiny footprint with hollow-shaft configuration.',
    gradientClass: 'from-emerald-500/20 to-lime-500/10',
    specs: {
      'Resolution': '18-Bit (SSI/BiSS)',
      'Shaft Type': '6mm Hollow Shaft',
      'Max RPM': '12,000 RPM',
      'Line Driver': 'Differential RS422',
      'Calibration': 'Auto-offset correction',
    },
    extendedSpecs: {
      dimensions: 'Ø36mm x 20mm depth',
      electricalRating: '5.0V VDC, 60mA maximum current',
      temperatureRange: '-40°C to +105°C',
      mtbf: '120,000 Hours',
      ingressProtection: 'IP64',
    },
    bulkPricing: [
      { minQty: 1, maxQty: 9, pricePerUnit: 159.90 },
      { minQty: 10, maxQty: 49, pricePerUnit: 139.00 },
      { minQty: 50, pricePerUnit: 122.00 },
    ],
    datasheetUrl: '#datasheet-encoder18',
    cadFile: 'MIA-SEN-ENCODER-ABS.step',
  },
  {
    id: '7',
    partNumber: 'MIA-CON-PLC-GATEWAY',
    title: 'Industrial B2B CAN-to-Modbus PLC Gateway',
    category: 'Control Boards',
    price: 410.00,
    stock: 14,
    description: 'DIN-rail mountable gateway bridging CANopen networks with Modbus TCP and RTU devices. Fully isolated interfaces with hardware watchdog.',
    gradientClass: 'from-amber-500/20 to-rose-500/10',
    specs: {
      'Protocols': 'CANopen, Modbus TCP, Modbus RTU',
      'Ethernet Ports': '2x RJ45 (Switch Integrated)',
      'Mounting': 'Standard DIN Rail 35mm',
      'Isolation': '3kV Galvanic Isolation',
      'Diagnostics': 'RGB Status LEDs + Web Dashboard',
    },
    extendedSpecs: {
      dimensions: '115 x 90 x 40 mm',
      electricalRating: '9-36 VDC Redundant Input power',
      temperatureRange: '-25°C to +75°C',
      mtbf: '150,000 Hours',
      ingressProtection: 'IP30 IP Rating',
    },
    bulkPricing: [
      { minQty: 1, maxQty: 5, pricePerUnit: 410.00 },
      { minQty: 6, maxQty: 19, pricePerUnit: 375.00 },
      { minQty: 20, pricePerUnit: 335.00 },
    ],
    datasheetUrl: '#datasheet-gateway',
    cadFile: 'MIA-CON-PLC-GATEWAY.step',
  },
  {
    id: '8',
    partNumber: 'MIA-MCH-PLANETARY-10',
    title: 'Planetary Gearbox 10:1 (NEMA 23 Frame)',
    category: 'Mechanical',
    price: 165.00,
    stock: 22,
    description: 'High-precision right-angle planetary gearbox with 10:1 reduction. Features low backlash (< 8 arc-min) and high radial load capacity.',
    gradientClass: 'from-violet-500/20 to-pink-500/10',
    specs: {
      'Reduction Ratio': '10:1',
      'Backlash': '< 8 Arc-Minutes',
      'Rated Output Torque': '32 N.m',
      'Input Adaptor': 'NEMA 23 (8mm input shaft)',
      'Efficiency': '96%',
    },
    extendedSpecs: {
      dimensions: '60 x 60 x 78 mm',
      electricalRating: 'N/A (Mechanical)',
      temperatureRange: '-20°C to +90°C',
      mtbf: '20,000 Hours Lifetime',
      ingressProtection: 'IP65',
    },
    bulkPricing: [
      { minQty: 1, maxQty: 9, pricePerUnit: 165.00 },
      { minQty: 10, maxQty: 29, pricePerUnit: 148.00 },
      { minQty: 30, pricePerUnit: 129.00 },
    ],
    datasheetUrl: '#datasheet-planetary10',
    cadFile: 'MIA-MCH-PLANETARY-10.step',
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
