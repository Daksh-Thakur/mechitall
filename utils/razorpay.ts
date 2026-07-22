/**
 * Razorpay Linked Accounts API Utility
 * Provides validation, error handling, and API integration for POST /v2/accounts.
 */

export interface RazorpayAddress {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postal_code: string | number;
  country: string;
}

export interface RazorpayStakeholderRelationship {
  director?: boolean;
  executive?: boolean;
}

export interface RazorpayStakeholderAddress {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface RazorpayStakeholderKYC {
  pan?: string;
}

export interface RazorpayStakeholderData {
  name?: string;
  email: string;
  percentage_ownership?: number;
  relationship?: RazorpayStakeholderRelationship;
  phone?: {
    primary?: string | number;
    secondary?: string | number;
  };
  addresses?: {
    residential?: RazorpayStakeholderAddress;
  };
  kyc?: RazorpayStakeholderKYC;
  notes?: Record<string, string>;
}

export interface RazorpayProductRequest {
  product_name: string;
  tnc_accepted: boolean;
}

export interface RazorpayProductUpdateRequest {
  settlements?: {
    account_number?: string;
    ifsc_code?: string;
    beneficiary_name?: string;
  };
  tnc_accepted: boolean;
}

export interface RazorpayOrderTransferRequest {
  account: string;
  amount: number;
  currency: string;
  notes?: Record<string, string>;
  linked_account_notes?: string[];
  on_hold?: boolean;
  on_hold_until?: number;
}

export interface RazorpayOrderRequest {
  amount: number;
  currency: string;
  receipt?: string;
  transfers?: RazorpayOrderTransferRequest[];
}



export interface RazorpayProfile {
  category: string;
  subcategory: string;
  business_model?: string;
  addresses: {
    registered: RazorpayAddress;
    operation?: RazorpayAddress;
  };
}

export interface RazorpayLegalInfo {
  pan?: string;
  gst?: string;
}

export interface RazorpayContactDetails {
  email?: string;
  phone?: string | number;
  policy_url?: string;
}

export interface RazorpayContactInfo {
  chargeback?: RazorpayContactDetails;
  refund?: RazorpayContactDetails;
  support?: RazorpayContactDetails[];
}

export interface RazorpayAppItem {
  url: string;
  name?: string;
}

export interface RazorpayApps {
  websites?: string[];
  android?: RazorpayAppItem[];
  ios?: RazorpayAppItem[];
}

export interface RazorpayAccountData {
  email: string;
  phone: string | number;
  legal_business_name: string;
  customer_facing_business_name?: string;
  business_type: string;
  reference_id?: string;
  profile: RazorpayProfile;
  legal_info?: RazorpayLegalInfo;
  contact_info?: RazorpayContactInfo;
  apps?: RazorpayApps;
  type?: string;
}

// Supported Indian States list
export const SUPPORTED_INDIAN_STATES: Record<string, string> = {
  'AN': 'ANDAMAN & NICOBAR ISLANDS',
  'AP': 'ANDHRA PRADESH',
  'AR': 'ARUNACHAL PRADESH',
  'AS': 'ASSAM',
  'BI': 'BIHAR',
  'CH': 'CHANDIGARH',
  'CT': 'CHHATTISGARH',
  'DN': 'DADRA & NAGAR HAVELI',
  'DD': 'DAMAN & DIU',
  'DL': 'DELHI',
  'GO': 'GOA',
  'GJ': 'GUJARAT',
  'HA': 'HARYANA',
  'HP': 'HIMACHAL PRADESH',
  'JK': 'JAMMU & KASHMIR',
  'JH': 'JHARKHAND',
  'KA': 'KARNATAKA',
  'KE': 'KERALA',
  'LD': 'LAKSHADWEEP',
  'MP': 'MADHYA PRADESH',
  'MH': 'MAHARASHTRA',
  'MA': 'MANIPUR',
  'ME': 'MEGHALAYA',
  'MI': 'MIZORAM',
  'NA': 'NAGALAND',
  'OR': 'ODISHA',
  'PO': 'PONDICHERRY',
  'PB': 'PUNJAB',
  'RJ': 'RAJASTHAN',
  'SK': 'SIKKIM',
  'TN': 'TAMIL NADU',
  'TR': 'TRIPURA',
  'TG': 'TELANGANA',
  'UP': 'UTTAR PRADESH',
  'UT': 'UTTARAKHAND',
  'WB': 'WEST BENGAL'
};

export class RazorpayError extends Error {
  statusCode: number;
  errorPayload: any;

  constructor(statusCode: number, errorPayload: any) {
    super(errorPayload.error?.description || 'Razorpay API Error');
    this.statusCode = statusCode;
    this.errorPayload = errorPayload;
    Object.setPrototypeOf(this, RazorpayError.prototype);
  }
}

/**
 * Creates a standard Razorpay validation error structure
 */
function createValidationError(description: string, field: string, step = 'payment_initiation'): RazorpayError {
  return new RazorpayError(400, {
    error: {
      code: "BAD_REQUEST_ERROR",
      description,
      source: "business",
      step,
      reason: "input_validation_failed",
      metadata: {},
      field
    }
  });
}

/**
 * Validates the email address structure
 */
function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  return local.length <= 64 && domain.length <= 68 && email.length <= 132 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validates a URL using standard Razorpay URL constraints
 */
function validateUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const regex = /^https?:\/\/[a-zA-Z0-9.-]+(:\d+)?(\/[a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*)?$/;
  return regex.test(url);
}

/**
 * Validates input parameters according to Razorpay specifications
 */
export function validateRazorpayAccountData(data: RazorpayAccountData): void {
  // Required root fields
  if (!data.email) {
    throw createValidationError("The email field is required.", "email");
  }
  if (!validateEmail(data.email)) {
    throw createValidationError("Please enter a valid email.", "email");
  }

  if (!data.phone) {
    throw createValidationError("The phone field is required.", "phone");
  }
  const phoneStr = String(data.phone).trim();
  if (!/^\d+$/.test(phoneStr) || phoneStr.length < 8 || phoneStr.length > 15) {
    throw createValidationError("Phone number must be digits with length between 8 and 15 characters.", "phone");
  }

  if (!data.legal_business_name) {
    throw createValidationError("The legal_business_name field is required.", "legal_business_name");
  }
  if (data.legal_business_name.length < 4 || data.legal_business_name.length > 200) {
    throw createValidationError("The legal business name must be between 4 and 200 characters.", "legal_business_name");
  }
  // Check for HTML tags/links in business name
  if (/<[^>]*>/g.test(data.legal_business_name) || data.legal_business_name.includes('@') || data.legal_business_name.includes('http')) {
    throw createValidationError("Please enter a valid name. Links, emails and HTML tags are not allowed.", "legal_business_name");
  }

  if (data.customer_facing_business_name) {
    if (data.customer_facing_business_name.length < 1 || data.customer_facing_business_name.length > 255) {
      throw createValidationError("The customer facing business name must be between 1 and 255 characters.", "customer_facing_business_name");
    }
  }

  // Type must be route
  if (data.type && data.type !== 'route') {
    throw createValidationError("Invalid type: route", "type");
  }

  // Business Type
  const allowedBusinessTypes = ['route', 'partnership', 'individual', 'proprietorship', 'public_limited', 'private_limited', 'llp', 'trust', 'society'];
  if (!data.business_type) {
    throw createValidationError("The business_type field is required.", "business_type");
  }
  if (!allowedBusinessTypes.includes(data.business_type.toLowerCase())) {
    throw createValidationError(`Invalid business type: ${data.business_type}`, "business_type");
  }

  // Reference ID
  if (data.reference_id !== undefined) {
    const refId = String(data.reference_id);
    if (refId.length < 3) {
      throw createValidationError("The code must be at least 3 characters.", "reference_id");
    }
    if (refId.length > 20) {
      throw createValidationError("The reference_id value should be between 3 to 20 characters.", "reference_id");
    }
    // Check format: alphanumeric, dashes, underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(refId)) {
      throw createValidationError("The code format is invalid.", "reference_id");
    }
  }

  // Profile
  if (!data.profile) {
    throw createValidationError("The profile field is required.", "profile");
  }
  if (!data.profile.category) {
    throw createValidationError("The profile category is required.", "profile.category");
  }
  if (!data.profile.subcategory) {
    throw createValidationError("The profile subcategory is required.", "profile.subcategory");
  }
  if (data.profile.business_model) {
    if (data.profile.business_model.length < 1 || data.profile.business_model.length > 255) {
      throw createValidationError("The business model must be between 1 and 255 characters.", "profile.business_model");
    }
  }

  // Addresses
  if (!data.profile.addresses || !data.profile.addresses.registered) {
    throw createValidationError("The profile.addresses.registered field is required.", "profile.addresses.registered");
  }

  const validateAddress = (addr: RazorpayAddress, fieldPath: string) => {
    if (!addr.street1) {
      throw createValidationError("Address street1 is required.", `${fieldPath}.street1`);
    }
    if (addr.street1.length > 100) {
      throw createValidationError("Address street1 cannot exceed 100 characters.", `${fieldPath}.street1`);
    }
    if (addr.street2 && addr.street2.length > 100) {
      throw createValidationError("Address street2 cannot exceed 100 characters.", `${fieldPath}.street2`);
    }
    if (!addr.city) {
      throw createValidationError("Address city is required.", `${fieldPath}.city`);
    }
    if (addr.city.length > 100) {
      throw createValidationError("Address city cannot exceed 100 characters.", `${fieldPath}.city`);
    }

    // State check
    if (!addr.state) {
      throw createValidationError("Address state is required.", `${fieldPath}.state`);
    }
    const stateInput = addr.state.toUpperCase().trim();
    const isSupportedState = Object.keys(SUPPORTED_INDIAN_STATES).includes(stateInput) || 
      Object.values(SUPPORTED_INDIAN_STATES).some(name => name === stateInput);

    if (!isSupportedState) {
      throw createValidationError(`Unsupported Indian state: ${addr.state}`, `${fieldPath}.state`);
    }

    // Postal code
    if (!addr.postal_code) {
      throw createValidationError("Address postal_code is required.", `${fieldPath}.postal_code`);
    }
    const pcStr = String(addr.postal_code).trim();
    if (pcStr.length !== 6 || !/^\d{6}$/.test(pcStr)) {
      throw createValidationError("The postal code should be exactly 6 characters.", `${fieldPath}.postal_code`);
    }

    // Country
    if (!addr.country) {
      throw createValidationError("Address country is required.", `${fieldPath}.country`);
    }
    const countryStr = addr.country.toLowerCase().trim();
    if (countryStr !== 'in' && countryStr !== 'india') {
      throw createValidationError("Only India (IN / india) is supported currently.", `${fieldPath}.country`);
    }
  };

  validateAddress(data.profile.addresses.registered, "profile.addresses.registered");
  if (data.profile.addresses.operation) {
    validateAddress(data.profile.addresses.operation, "profile.addresses.operation");
  }

  // Legal Info
  if (data.legal_info) {
    if (data.legal_info.pan) {
      const pan = data.legal_info.pan.toUpperCase().trim();
      const panRegex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
      if (!panRegex.test(pan)) {
        throw createValidationError("Invalid PAN format. Must be a 10-digit alphanumeric code matching company PAN structure.", "legal_info.pan");
      }
      // Check 4th digit
      const fourthDigit = pan[3];
      const validFourthDigits = ['C', 'H', 'F', 'A', 'T', 'B', 'J', 'G', 'L'];
      if (!validFourthDigits.includes(fourthDigit)) {
        throw createValidationError("Invalid PAN details. The 4th digit of business PAN must be one of C, H, F, A, T, B, J, G, L.", "legal_info.pan");
      }
    }

    if (data.legal_info.gst) {
      const gst = data.legal_info.gst.toUpperCase().trim();
      const gstRegex = /^[0123][0-9][A-Z]{5}[0-9]{4}[A-Z][0-9][A-Z0-9][A-Z0-9]$/;
      if (!gstRegex.test(gst)) {
        throw createValidationError("Invalid GSTIN format. Must be a valid 15-digit PAN-based unique identification number.", "legal_info.gst");
      }
    }
  }

  // Contact Info
  if (data.contact_info) {
    const validateContact = (c: RazorpayContactDetails, prefix: string) => {
      if (c.email && !validateEmail(c.email)) {
        throw createValidationError(`Invalid contact email for ${prefix}`, `contact_info.${prefix}.email`);
      }
      if (c.phone) {
        const ph = String(c.phone).trim();
        if (ph.length > 10 || !/^\d+$/.test(ph)) {
          throw createValidationError(`Invalid contact phone for ${prefix}. Maximum length is 10 digits.`, `contact_info.${prefix}.phone`);
        }
      }
      if (c.policy_url && !validateUrl(c.policy_url)) {
        throw createValidationError(`Invalid policy URL for ${prefix}. Must be http/https with valid domain.`, `contact_info.${prefix}.policy_url`);
      }
    };

    if (data.contact_info.chargeback) validateContact(data.contact_info.chargeback, "chargeback");
    if (data.contact_info.refund) validateContact(data.contact_info.refund, "refund");
    if (data.contact_info.support) {
      if (Array.isArray(data.contact_info.support)) {
        data.contact_info.support.forEach((s, idx) => validateContact(s, `support[${idx}]`));
      }
    }
  }

  // Apps
  if (data.apps) {
    if (data.apps.websites) {
      if (!Array.isArray(data.apps.websites) || data.apps.websites.length < 1) {
        throw createValidationError("A minimum of 1 website is required inside websites array.", "apps.websites");
      }
      data.apps.websites.forEach((w, idx) => {
        if (!validateUrl(w)) {
          throw createValidationError(`Invalid website URL at index ${idx}.`, `apps.websites[${idx}]`);
        }
      });
    }

    const validateAppItem = (item: RazorpayAppItem, prefix: string) => {
      if (!item.url || !validateUrl(item.url)) {
        throw createValidationError(`Invalid app URL for ${prefix}.`, `apps.${prefix}.url`);
      }
    };

    if (data.apps.android) {
      if (Array.isArray(data.apps.android)) {
        data.apps.android.forEach((app, idx) => validateAppItem(app, `android[${idx}]`));
      }
    }
    if (data.apps.ios) {
      if (Array.isArray(data.apps.ios)) {
        data.apps.ios.forEach((app, idx) => validateAppItem(app, `ios[${idx}]`));
      }
    }
  }
}

/**
 * Invokes Razorpay Create Account Endpoint (POST /v2/accounts)
 */
export async function createRazorpayLinkedAccount(data: RazorpayAccountData): Promise<any> {
  // 1. Perform client/server-side validations first
  validateRazorpayAccountData(data);

  // 2. Read API Credentials
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;

  const isLiveMode = !!(keyId && keySecret);

  if (isLiveMode) {
    try {
      const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v2/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`
        },
        body: JSON.stringify({
          email: data.email,
          phone: String(data.phone),
          type: data.type || 'route',
          reference_id: data.reference_id,
          legal_business_name: data.legal_business_name,
          business_type: data.business_type,
          contact_name: data.legal_business_name, // fallback
          profile: data.profile,
          legal_info: data.legal_info,
          contact_info: data.contact_info,
          apps: data.apps
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new RazorpayError(response.status, result);
      }
      return result;
    } catch (err: any) {
      if (err instanceof RazorpayError) {
        throw err;
      }
      throw new RazorpayError(500, {
        error: {
          code: "SERVER_ERROR",
          description: err.message || "Failed to make request to Razorpay servers.",
          source: "server",
          step: "network_request",
          reason: "connection_error",
          metadata: {}
        }
      });
    }
  } else {
    // Simulated Mode / Mock Mode
    // Check simulation triggers from special reference IDs or emails
    const refIdStr = String(data.reference_id || '');
    const emailStr = String(data.email || '');

    if (refIdStr === 'err_ifsc') {
      throw new RazorpayError(400, {
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Invalid IFSC Code",
          source: "settlement",
          step: "bank_verification",
          reason: "input_validation_failed",
          metadata: {},
          field: "ifsc"
        }
      });
    }

    if (refIdStr === 'err_bank_len') {
      throw new RazorpayError(400, {
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "The bank account number must be between 5 and 35 characters",
          source: "settlement",
          step: "bank_verification",
          reason: "input_validation_failed",
          metadata: {},
          field: "account_number"
        }
      });
    }

    if (emailStr.startsWith('error_exists') || emailStr === 'merchant@example.com') {
      throw new RazorpayError(400, {
        error: {
          code: "BAD_REQUEST_ERROR",
          description: `Merchant email already exists for account - BbHKlnuyZkf0xa.`,
          source: "business",
          step: "email_verification",
          reason: "duplicate_record",
          metadata: {},
          field: "email"
        }
      });
    }

    if (refIdStr === 'err_route_code') {
      throw new RazorpayError(400, {
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Route code Support feature not enabled to add account code.",
          source: "business",
          step: "feature_authorization",
          reason: "feature_disabled",
          metadata: {},
          field: "reference_id"
        }
      });
    }

    if (refIdStr === 'err_acc_code') {
      throw new RazorpayError(400, {
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Account_code -account_code is not allowed for this merchant",
          source: "business",
          step: "feature_authorization",
          reason: "feature_disabled",
          metadata: {},
          field: "account_code"
        }
      });
    }

    // Success response mockup matching Razorpay specification
    const randomAccId = `acc_${Math.random().toString(36).substring(2, 16)}`;
    return {
      id: randomAccId,
      type: data.type || "route",
      status: "created",
      email: data.email,
      phone: String(data.phone),
      contact_name: data.legal_business_name,
      reference_id: data.reference_id || "124124",
      business_type: data.business_type,
      legal_business_name: data.legal_business_name,
      customer_facing_business_name: data.customer_facing_business_name || data.legal_business_name,
      profile: {
        category: data.profile.category,
        subcategory: data.profile.subcategory,
        addresses: {
          registered: data.profile.addresses.registered
        }
      },
      notes: [],
      created_at: Math.floor(Date.now() / 1000),
      legal_info: data.legal_info || {
        pan: "AAACL1234C"
      }
    };
  }
}

/**
 * Validates stakeholder parameters according to Razorpay constraints
 */
export function validateRazorpayStakeholderData(data: RazorpayStakeholderData): void {
  if (!data.email) {
    throw createValidationError("The email field is required.", "email");
  }
  if (!validateEmail(data.email)) {
    throw createValidationError("Please enter a valid email.", "email");
  }

  if (data.name) {
    if (data.name.length > 255) {
      throw createValidationError("The stakeholder's name cannot exceed 255 characters.", "name");
    }
  }

  if (data.percentage_ownership !== undefined) {
    const val = Number(data.percentage_ownership);
    if (isNaN(val) || val < 0 || val > 100) {
      throw createValidationError("The percentage ownership must be between 0 and 100.", "percentage_ownership");
    }
    const valStr = String(data.percentage_ownership);
    if (valStr.includes('.') && valStr.split('.')[1].length > 2) {
      throw createValidationError("Only two decimal places are allowed for percentage ownership.", "percentage_ownership");
    }
    if (valStr.length > 100) {
      throw createValidationError("The percentage ownership text length cannot exceed 100 characters.", "percentage_ownership");
    }
  }

  if (data.phone) {
    const validatePhoneNum = (ph: string | number | undefined, fieldName: string) => {
      if (ph === undefined) return;
      const phStr = String(ph).trim();
      if (!/^\d+$/.test(phStr) || phStr.length < 8 || phStr.length > 11) {
        throw createValidationError(`${fieldName} contact number must be digits between 8 and 11 characters.`, `phone.${fieldName}`);
      }
    };
    validatePhoneNum(data.phone.primary, "primary");
    validatePhoneNum(data.phone.secondary, "secondary");
  }

  if (data.addresses && data.addresses.residential) {
    const resAddr = data.addresses.residential;
    if (resAddr.street) {
      if (resAddr.street.length < 10 || resAddr.street.length > 255) {
        throw createValidationError("The stakeholder's street address must be between 10 and 255 characters.", "addresses.residential.street");
      }
    }
    if (resAddr.city) {
      if (resAddr.city.length < 2 || resAddr.city.length > 32) {
        throw createValidationError("The city must be between 2 and 32 characters.", "addresses.residential.city");
      }
    }
    if (resAddr.state) {
      if (resAddr.state.length < 2 || resAddr.state.length > 32) {
        throw createValidationError("The state must be between 2 and 32 characters.", "addresses.residential.state");
      }
    }
    if (resAddr.postal_code) {
      if (resAddr.postal_code.length < 2 || resAddr.postal_code.length > 10) {
        throw createValidationError("The postal code must be between 2 and 10 characters.", "addresses.residential.postal_code");
      }
    }
    if (resAddr.country) {
      const countryStr = resAddr.country.toLowerCase().trim();
      if (countryStr !== 'in' && countryStr !== 'india') {
        throw createValidationError("Only India (IN / india) is supported.", "addresses.residential.country");
      }
    }
  }

  if (data.kyc && data.kyc.pan) {
    const pan = data.kyc.pan.toUpperCase().trim();
    const panRegex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
    if (!panRegex.test(pan)) {
      throw createValidationError("Invalid PAN format. Must be a 10-digit alphanumeric code matching company PAN structure.", "kyc.pan");
    }
    // Stakeholder PAN verification: 4th digit MUST be 'P'
    if (pan[3] !== 'P') {
      throw createValidationError("Invalid PAN details. The 4th digit of a stakeholder PAN must be 'P' (Individual PAN).", "kyc.pan");
    }
  }

  if (data.notes) {
    const keys = Object.keys(data.notes);
    if (keys.length > 15) {
      throw createValidationError("Notes can hold a maximum of 15 key-value pairs.", "notes");
    }
    for (const key of keys) {
      if (data.notes[key].length > 512) {
        throw createValidationError("Notes values cannot exceed 512 characters.", `notes.${key}`);
      }
    }
  }
}

/**
 * Invokes Razorpay Create Stakeholder Endpoint (POST /v2/accounts/:account_id/stakeholders)
 */
export async function createRazorpayStakeholder(accountId: string, data: RazorpayStakeholderData): Promise<any> {
  if (!accountId || typeof accountId !== 'string') {
    throw createValidationError("The account_id parameter is required.", "account_id");
  }

  // 1. Perform validations
  validateRazorpayStakeholderData(data);

  // 2. Read API Credentials
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;
  const isLiveMode = !!(keyId && keySecret);

  if (isLiveMode) {
    try {
      const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const response = await fetch(`https://api.razorpay.com/v2/accounts/${accountId}/stakeholders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new RazorpayError(response.status, result);
      }
      return result;
    } catch (err: any) {
      if (err instanceof RazorpayError) {
        throw err;
      }
      throw new RazorpayError(500, {
        error: {
          code: "SERVER_ERROR",
          description: err.message || "Failed to make request to Razorpay servers.",
          source: "server",
          step: "network_request",
          reason: "connection_error",
          metadata: {}
        }
      });
    }
  } else {
    // Simulated Mode / Mock Mode
    // Check specific simulation triggers
    if (accountId === 'err_missing_acc') {
      throw new RazorpayError(400, {
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Linked account does not exist",
          source: "",
          step: "",
          reason: "linked_account_id_does_not_exist",
          metadata: {}
        }
      });
    }

    if (data.email === 'error_duplicate@example.com' || data.name === 'err_multiple') {
      throw new RazorpayError(400, {
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Stakeholders cannot be more than one for Route product.",
          source: "",
          step: "",
          reason: "stakeholder_limit_exceeded",
          metadata: {}
        }
      });
    }

    // Success response mockup matching Razorpay specification
    const randomSthId = `sth_${Math.random().toString(36).substring(2, 16)}`;
    return {
      entity: "stakeholder",
      relationship: {
        director: data.relationship?.director || false,
        executive: data.relationship?.executive || false
      },
      phone: {
        primary: data.phone?.primary ? Number(data.phone.primary) : 9000090000,
        secondary: data.phone?.secondary ? Number(data.phone.secondary) : 999999991
      },
      notes: data.notes || {},
      kyc: {
        pan: data.kyc?.pan || "CZCPG5228F"
      },
      id: randomSthId,
      name: data.name || "Gaurav Kumar",
      email: data.email,
      percentage_ownership: data.percentage_ownership || 10,
      addresses: {
        residential: data.addresses?.residential || {
          street: "506, Koramangala 1st block",
          city: "Bengaluru",
          state: "Karnataka",
          postal_code: "560034",
          country: "IN"
        }
      }
    };
  }
}

/**
 * Validates product configuration requests
 */
export function validateRazorpayProductData(data: RazorpayProductRequest): void {
  if (!data.product_name) {
    throw createValidationError("Product name is required.", "product_name");
  }
  if (data.product_name.toLowerCase() !== 'route') {
    throw new RazorpayError(400, {
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "The product requested is invalid.",
        source: "business",
        step: "",
        reason: "invalid_product_name",
        metadata: {}
      }
    });
  }
  if (data.tnc_accepted !== true) {
    throw new RazorpayError(400, {
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "The selected tnc accepted is invalid.",
        source: "business",
        step: "",
        reason: "tnc_not_accepted",
        metadata: {}
      }
    });
  }
}

/**
 * Invokes Razorpay Product Configuration Endpoint (POST /v2/accounts/:account_id/products)
 */
export async function requestRazorpayProduct(accountId: string, data: RazorpayProductRequest): Promise<any> {
  if (!accountId || typeof accountId !== 'string') {
    throw createValidationError("The account_id parameter is required.", "account_id");
  }

  // 1. Perform validations
  validateRazorpayProductData(data);

  // 2. Read API Credentials
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;
  const isLiveMode = !!(keyId && keySecret);

  if (isLiveMode) {
    try {
      const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const response = await fetch(`https://api.razorpay.com/v2/accounts/${accountId}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new RazorpayError(response.status, result);
      }
      return result;
    } catch (err: any) {
      if (err instanceof RazorpayError) {
        throw err;
      }
      throw new RazorpayError(500, {
        error: {
          code: "SERVER_ERROR",
          description: err.message || "Failed to make request to Razorpay servers.",
          source: "server",
          step: "network_request",
          reason: "connection_error",
          metadata: {}
        }
      });
    }
  } else {
    // Simulated Mode / Mock Mode
    if (accountId === 'err_missing_acc') {
      throw new RazorpayError(400, {
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Linked account does not exist",
          source: "",
          step: "",
          reason: "linked_account_id_does_not_exist",
          metadata: {}
        }
      });
    }

    // Success response mockup matching Razorpay specs
    const randomPrdId = `acc_prd_${Math.random().toString(36).substring(2, 16)}`;
    return {
      requested_configuration: [],
      active_configuration: {
        settlements: {
          account_number: "7878780080310012",
          ifsc_code: "RATN0VAAPIS",
          beneficiary_name: "Gaurav Kumar"
        }
      },
      requirements: [
        {
          field_reference: "settlements.beneficiary_name",
          resolution_url: `/accounts/${accountId}/products/${randomPrdId}`,
          reason_code: "field_missing",
          status: "required"
        }
      ],
      tnc: {
        id: `tnc_${Math.random().toString(36).substring(2, 16)}`,
        accepted: true,
        accepted_at: Math.floor(Date.now() / 1000)
      },
      id: randomPrdId,
      product_name: "route",
      activation_status: "needs_clarification",
      account_id: accountId,
      requested_at: Math.floor(Date.now() / 1000)
    };
  }
}

/**
 * Validates product update configuration parameters
 */
export function validateRazorpayProductUpdateData(data: RazorpayProductUpdateRequest): void {
  if (data.tnc_accepted !== true) {
    throw new RazorpayError(400, {
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "Ensure to accept the tnc by passing the accepted value as true.",
        source: "business",
        step: "",
        reason: "tnc_not_accepted",
        metadata: {}
      }
    });
  }

  if (data.settlements) {
    const s = data.settlements;
    if (s.account_number) {
      if (s.account_number.length < 5 || s.account_number.length > 20) {
        throw new RazorpayError(400, {
          error: {
            code: "BAD_REQUEST_ERROR",
            description: "The account number must be between 5 and 20 characters.",
            source: "business",
            step: "",
            reason: "invalid_account_number",
            metadata: {}
          }
        });
      }
    }
    if (s.ifsc_code) {
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(s.ifsc_code)) {
        throw new RazorpayError(400, {
          error: {
            code: "BAD_REQUEST_ERROR",
            description: "Invalid IFSC Code.",
            source: "business",
            step: "",
            reason: "invalid_ifsc_code",
            metadata: {}
          }
        });
      }
    }
    if (!s.beneficiary_name) {
      throw createValidationError("Beneficiary name is required.", "settlements.beneficiary_name");
    }
  }
}

/**
 * Invokes Razorpay Update Product Endpoint (PATCH /v2/accounts/:account_id/products/:product_id)
 */
export async function updateRazorpayProduct(accountId: string, productId: string, data: RazorpayProductUpdateRequest): Promise<any> {
  if (!accountId || typeof accountId !== 'string') {
    throw createValidationError("The account_id parameter is required.", "account_id");
  }
  if (!productId || typeof productId !== 'string') {
    throw createValidationError("The product_id parameter is required.", "product_id");
  }

  // 1. Perform validations
  validateRazorpayProductUpdateData(data);

  // 2. Read API Credentials
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;
  const isLiveMode = !!(keyId && keySecret);

  if (isLiveMode) {
    try {
      const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const response = await fetch(`https://api.razorpay.com/v2/accounts/${accountId}/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new RazorpayError(response.status, result);
      }
      return result;
    } catch (err: any) {
      if (err instanceof RazorpayError) {
        throw err;
      }
      throw new RazorpayError(500, {
        error: {
          code: "SERVER_ERROR",
          description: err.message || "Failed to make request to Razorpay servers.",
          source: "server",
          step: "network_request",
          reason: "connection_error",
          metadata: {}
        }
      });
    }
  } else {
    // Simulated Mode / Mock Mode
    if (accountId === 'err_missing_acc') {
      throw new RazorpayError(400, {
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Linked account does not exist",
          source: "",
          step: "",
          reason: "linked_account_id_does_not_exist",
          metadata: {}
        }
      });
    }

    if (productId === 'err_locked_prd') {
      throw new RazorpayError(400, {
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Merchant activation form has been locked for editing by admin.",
          source: "business",
          step: "review",
          reason: "form_locked",
          metadata: {}
        }
      });
    }

    // Success response mockup matching Razorpay specs
    return {
      requested_configuration: [],
      active_configuration: {
        settlements: {
          account_number: data.settlements?.account_number || "1234567890123456",
          ifsc_code: data.settlements?.ifsc_code || "HDFC0000317",
          beneficiary_name: data.settlements?.beneficiary_name || "Gaurav Kumar"
        }
      },
      requirements: [],
      tnc: {
        id: `tnc_${Math.random().toString(36).substring(2, 16)}`,
        accepted: true,
        accepted_at: Math.floor(Date.now() / 1000)
      },
      id: productId,
      product_name: "route",
      activation_status: "activated",
      account_id: accountId,
      requested_at: Math.floor(Date.now() / 1000)
    };
  }
}

/**
 * Validates Order Transfers parameters and amounts
 */
export function validateRazorpayOrderData(data: RazorpayOrderRequest): void {
  if (!data.amount || typeof data.amount !== 'number') {
    throw createValidationError("The amount field is required.", "amount");
  }
  if (data.amount < 100) {
    throw new RazorpayError(400, {
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "The amount must be at least INR 1.00",
        source: "business",
        step: "",
        reason: "invalid_amount",
        metadata: {}
      }
    });
  }
  if (!data.currency || typeof data.currency !== 'string') {
    throw createValidationError("The currency field is required.", "currency");
  }
  if (data.currency.toUpperCase() !== 'INR') {
    throw new RazorpayError(400, {
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "The currency should be INR for transfers",
        source: "business",
        step: "",
        reason: "invalid_currency",
        metadata: {}
      }
    });
  }

  if (data.transfers) {
    let totalTransferAmount = 0;
    for (const t of data.transfers) {
      if (!t.account) {
        throw new RazorpayError(400, {
          error: {
            code: "BAD_REQUEST_ERROR",
            description: "The input field is required",
            source: "business",
            step: "",
            reason: "field_missing",
            metadata: {},
            field: "transfers.account"
          }
        });
      }
      if (t.account === 'err_invalid_acc') {
        throw new RazorpayError(400, {
          error: {
            code: "BAD_REQUEST_ERROR",
            description: "input is an invalid account_code.",
            source: "business",
            step: "",
            reason: "invalid_account_code",
            metadata: {}
          }
        });
      }
      if (t.account === 'err_insufficient_bal') {
        throw new RazorpayError(400, {
          error: {
            code: "BAD_REQUEST_ERROR",
            description: "Transfer cannot be made due to insufficient balance",
            source: "business",
            step: "",
            reason: "insufficient_balance",
            metadata: {}
          }
        });
      }

      if (!t.amount || typeof t.amount !== 'number') {
        throw createValidationError("The amount field is required.", "transfers.amount");
      }
      if (t.amount < 100) {
        throw new RazorpayError(400, {
          error: {
            code: "BAD_REQUEST_ERROR",
            description: "The amount must be at least INR 1.00",
            source: "business",
            step: "",
            reason: "invalid_amount",
            metadata: {}
          }
        });
      }
      if (!t.currency || t.currency.toUpperCase() !== 'INR') {
        throw new RazorpayError(400, {
          error: {
            code: "BAD_REQUEST_ERROR",
            description: "The currency should be INR for transfers",
            source: "business",
            step: "",
            reason: "invalid_currency",
            metadata: {}
          }
        });
      }

      if (t.linked_account_notes) {
        const notesObj = t.notes || {};
        for (const key of t.linked_account_notes) {
          if (!(key in notesObj)) {
            throw new RazorpayError(400, {
              error: {
                code: "BAD_REQUEST_ERROR",
                description: "Keys sent in linked_account_notes must exist in notes",
                source: "business",
                step: "",
                reason: "notes_mismatch",
                metadata: {}
              }
            });
          }
        }
      }

      if (t.on_hold_until !== undefined && t.on_hold_until !== null) {
        if (t.on_hold_until < 946684800 || t.on_hold_until > 4765046400) {
          throw new RazorpayError(400, {
            error: {
              code: "BAD_REQUEST_ERROR",
              description: "on_hold_until must be between 946684800 and 4765046400",
              source: "business",
              step: "",
              reason: "invalid_on_hold_until",
              metadata: {}
            }
          });
        }
      }

      totalTransferAmount += t.amount;
    }

    if (totalTransferAmount > data.amount) {
      throw new RazorpayError(400, {
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "The sum of amount requested for transfer is greater than the captured amount",
          source: "business",
          step: "",
          reason: "amount_exceeded",
          metadata: {}
        }
      });
    }
  }
}

/**
 * Creates Razorpay Order with split transfers (POST /v1/orders)
 */
export async function createRazorpayOrder(data: RazorpayOrderRequest): Promise<any> {
  // 1. Perform validation checks
  validateRazorpayOrderData(data);

  // 2. Check API Credentials
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;
  const isLiveMode = !!(keyId && keySecret);

  if (isLiveMode) {
    try {
      const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const response = await fetch(`https://api.razorpay.com/v1/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new RazorpayError(response.status, result);
      }
      return result;
    } catch (err: any) {
      if (err instanceof RazorpayError) {
        throw err;
      }
      throw new RazorpayError(500, {
        error: {
          code: "SERVER_ERROR",
          description: err.message || "Failed to make request to Razorpay servers.",
          source: "server",
          step: "network_request",
          reason: "connection_error",
          metadata: {}
        }
      });
    }
  } else {
    // Simulated Mode / Mock Mode
    const orderId = `order_${Math.random().toString(36).substring(2, 16)}`;
    const transfers = (data.transfers || []).map(t => {
      const transferId = `trf_${Math.random().toString(36).substring(2, 16)}`;
      return {
        id: transferId,
        entity: "transfer",
        status: "created",
        source: orderId,
        recipient: t.account,
        amount: t.amount,
        currency: t.currency,
        amount_reversed: 0,
        notes: t.notes || {},
        linked_account_notes: t.linked_account_notes || [],
        on_hold: t.on_hold || false,
        on_hold_until: t.on_hold_until || null,
        recipient_settlement_id: null,
        created_at: Math.floor(Date.now() / 1000),
        processed_at: null,
        error: {
          code: null,
          description: null,
          reason: null,
          field: null,
          step: null,
          id: transferId,
          source: null,
          metadata: null
        }
      };
    });

    return {
      id: orderId,
      entity: "order",
      amount: data.amount,
      amount_paid: 0,
      amount_due: data.amount,
      currency: data.currency,
      receipt: data.receipt || null,
      offer_id: null,
      offers: {
        entity: "collection",
        count: 0,
        items: []
      },
      status: "created",
      attempts: 0,
      notes: [],
      created_at: Math.floor(Date.now() / 1000),
      transfers: transfers
    };
  }
}




