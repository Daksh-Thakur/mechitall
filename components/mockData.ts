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
  sellerName?: string;
}

// Realistic products catalog
export const MOCK_PARTS: Part[] = [];
