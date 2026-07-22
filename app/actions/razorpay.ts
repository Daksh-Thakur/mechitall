'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { createRazorpayLinkedAccount, RazorpayAccountData, RazorpayError, createRazorpayStakeholder, RazorpayStakeholderData, requestRazorpayProduct, RazorpayProductRequest, updateRazorpayProduct, RazorpayProductUpdateRequest, createRazorpayOrder, RazorpayOrderRequest } from '@/utils/razorpay';

export interface CreateLinkedAccountPayload {
  email: string;
  phone: string;
  legal_business_name: string;
  customer_facing_business_name?: string;
  business_type: string;
  reference_id?: string;
  category: string;
  subcategory: string;
  business_model?: string;
  registered_address: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  pan: string;
  gst?: string;
  bank_account_number: string;
  ifsc_code: string;
}

export async function createRazorpayAccountAction(payload: CreateLinkedAccountPayload) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          description: "You must be signed in to perform this action.",
          field: "auth"
        }
      };
    }

    // 2. Format the payload for Razorpay Accounts API structure
    const accountData: RazorpayAccountData = {
      email: payload.email,
      phone: payload.phone,
      legal_business_name: payload.legal_business_name,
      customer_facing_business_name: payload.customer_facing_business_name,
      business_type: payload.business_type,
      reference_id: payload.reference_id,
      profile: {
        category: payload.category,
        subcategory: payload.subcategory,
        business_model: payload.business_model,
        addresses: {
          registered: {
            street1: payload.registered_address.street1,
            street2: payload.registered_address.street2,
            city: payload.registered_address.city,
            state: payload.registered_address.state,
            postal_code: payload.registered_address.postal_code,
            country: payload.registered_address.country
          }
        }
      },
      legal_info: {
        pan: payload.pan || undefined,
        gst: payload.gst || undefined
      }
    };

    // 3. Create Linked Account
    const razorpayResponse = await createRazorpayLinkedAccount(accountData);

    // 4. Update the user's profile in Supabase
    // Extract formatted address string for business_address
    const addr = payload.registered_address;
    const formattedAddress = [addr.street1, addr.street2, addr.city, addr.state, addr.postal_code, addr.country]
      .filter(Boolean)
      .join(', ');

    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        child_merchant_key: razorpayResponse.id,
        legal_name: payload.legal_business_name,
        company_name: payload.legal_business_name,
        business_address: formattedAddress,
        bank_account_number: payload.bank_account_number,
        ifsc_code: payload.ifsc_code,
        pan: payload.pan || null,
        gstin: payload.gst || null,
        seller_kyc_completed: true,
        is_seller: true, // Auto-activate seller mode
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (dbError) {
      console.error("Database update error:", dbError);
      return {
        success: false,
        error: {
          code: "DATABASE_ERROR",
          description: `Linked Account created successfully (${razorpayResponse.id}) but failed to update local profile: ${dbError.message}`,
          field: "database"
        }
      };
    }

    return {
      success: true,
      data: razorpayResponse
    };
  } catch (err: any) {
    console.error("Razorpay action error:", err);
    if (err instanceof RazorpayError) {
      return {
        success: false,
        error: err.errorPayload?.error || {
          code: "BAD_REQUEST_ERROR",
          description: err.message,
          field: ""
        }
      };
    }

    return {
      success: false,
      error: {
        code: "SERVER_ERROR",
        description: err.message || "An unexpected server error occurred.",
        field: ""
      }
    };
  }
}

export interface CreateStakeholderPayload {
  accountId: string;
  name: string;
  email: string;
  percentage_ownership?: number;
  relationship: {
    director?: boolean;
    executive?: boolean;
  };
  phone?: {
    primary?: string;
    secondary?: string;
  };
  residential_address?: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  pan: string;
}

export async function createRazorpayStakeholderAction(payload: CreateStakeholderPayload) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          description: "You must be signed in to perform this action.",
          field: "auth"
        }
      };
    }

    // 2. Fetch account_id from profile if not provided
    let accountId = payload.accountId;
    if (!accountId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('child_merchant_key')
        .eq('user_id', user.id)
        .single();
      accountId = profile?.child_merchant_key || '';
    }

    if (!accountId || !accountId.startsWith('acc_')) {
      return {
        success: false,
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Linked account does not exist. Please create a Linked Account first.",
          field: "account_id"
        }
      };
    }

    // 3. Format the payload for Razorpay Stakeholder API
    const stakeholderData: RazorpayStakeholderData = {
      name: payload.name,
      email: payload.email,
      percentage_ownership: payload.percentage_ownership,
      relationship: {
        director: payload.relationship.director || false,
        executive: payload.relationship.executive || false
      },
      phone: payload.phone ? {
        primary: payload.phone.primary || undefined,
        secondary: payload.phone.secondary || undefined
      } : undefined,
      addresses: payload.residential_address ? {
        residential: {
          street: payload.residential_address.street,
          city: payload.residential_address.city,
          state: payload.residential_address.state,
          postal_code: payload.residential_address.postal_code,
          country: payload.residential_address.country
        }
      } : undefined,
      kyc: {
        pan: payload.pan || undefined
      }
    };

    // 4. Invoke API call / mock simulation
    const response = await createRazorpayStakeholder(accountId, stakeholderData);

    // 5. Update user profile. Include fallback check constraint handler
    const updatePayload: any = {
      stakeholder_id: response.id,
      stakeholder_name: response.name,
      stakeholder_email: response.email,
      stakeholder_pan: response.kyc?.pan || null,
      updated_at: new Date().toISOString()
    };

    const { error: dbError } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('user_id', user.id);

    if (dbError) {
      if (dbError.code === '42703' || dbError.message.includes('stakeholder_id')) {
        console.warn("stakeholder_id column does not exist in public.profiles yet. Proceeding with API success fallback.");
      } else {
        console.error("Database update error:", dbError);
        return {
          success: false,
          error: {
            code: "DATABASE_ERROR",
            description: `Stakeholder created successfully (${response.id}) but failed to update profile: ${dbError.message}`,
            field: "database"
          }
        };
      }
    }

    return {
      success: true,
      data: response
    };
  } catch (err: any) {
    console.error("Razorpay stakeholder action error:", err);
    if (err instanceof RazorpayError) {
      return {
        success: false,
        error: err.errorPayload?.error || {
          code: "BAD_REQUEST_ERROR",
          description: err.message,
          field: ""
        }
      };
    }

    return {
      success: false,
      error: {
        code: "SERVER_ERROR",
        description: err.message || "An unexpected server error occurred.",
        field: ""
      }
    };
  }
}

export interface RequestProductPayload {
  accountId: string;
  productName: string;
  tncAccepted: boolean;
}

export async function requestRazorpayProductAction(payload: RequestProductPayload) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          description: "You must be signed in to perform this action.",
          field: "auth"
        }
      };
    }

    // 2. Fetch accountId from profile if not provided
    let accountId = payload.accountId;
    if (!accountId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('child_merchant_key')
        .eq('user_id', user.id)
        .single();
      accountId = profile?.child_merchant_key || '';
    }

    if (!accountId || !accountId.startsWith('acc_')) {
      return {
        success: false,
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Linked account does not exist. Please create a Linked Account first.",
          field: "account_id"
        }
      };
    }

    // 3. Request Product Configuration
    const requestData: RazorpayProductRequest = {
      product_name: payload.productName,
      tnc_accepted: payload.tncAccepted
    };

    const response = await requestRazorpayProduct(accountId, requestData);

    // 4. Update Profile in DB
    const updatePayload: any = {
      razorpay_product_id: response.id,
      razorpay_product_status: response.activation_status,
      updated_at: new Date().toISOString()
    };

    const { error: dbError } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('user_id', user.id);

    if (dbError) {
      if (dbError.code === '42703' || dbError.message.includes('razorpay_product_id')) {
        console.warn("razorpay_product_id column does not exist in public.profiles yet. Proceeding with API success fallback.");
      } else {
        console.error("Database update error:", dbError);
        return {
          success: false,
          error: {
            code: "DATABASE_ERROR",
            description: `Product requested successfully (${response.id}) but failed to update local profile: ${dbError.message}`,
            field: "database"
          }
        };
      }
    }

    return {
      success: true,
      data: response
    };
  } catch (err: any) {
    console.error("Razorpay product request action error:", err);
    if (err instanceof RazorpayError) {
      return {
        success: false,
        error: err.errorPayload?.error || {
          code: "BAD_REQUEST_ERROR",
          description: err.message,
          field: ""
        }
      };
    }

    return {
      success: false,
      error: {
        code: "SERVER_ERROR",
        description: err.message || "An unexpected server error occurred.",
        field: ""
      }
    };
  }
}

export interface UpdateProductPayload {
  accountId: string;
  productId: string;
  settlements?: {
    account_number?: string;
    ifsc_code?: string;
    beneficiary_name?: string;
  };
  tncAccepted: boolean;
}

export async function updateRazorpayProductAction(payload: UpdateProductPayload) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          description: "You must be signed in to perform this action.",
          field: "auth"
        }
      };
    }

    // 2. Fetch accountId & productId from profile if not provided
    let accountId = payload.accountId;
    let productId = payload.productId;
    if (!accountId || !productId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('child_merchant_key, razorpay_product_id')
        .eq('user_id', user.id)
        .single();
      if (!accountId) accountId = profile?.child_merchant_key || '';
      if (!productId) productId = profile?.razorpay_product_id || '';
    }

    if (!accountId || !accountId.startsWith('acc_')) {
      return {
        success: false,
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Linked account does not exist. Please create a Linked Account first.",
          field: "account_id"
        }
      };
    }

    if (!productId || !productId.startsWith('acc_prd_')) {
      return {
        success: false,
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Product ID does not exist. Please request a product configuration first.",
          field: "product_id"
        }
      };
    }

    // 3. Update Product Configuration
    const requestData: RazorpayProductUpdateRequest = {
      settlements: payload.settlements ? {
        account_number: payload.settlements.account_number || undefined,
        ifsc_code: payload.settlements.ifsc_code || undefined,
        beneficiary_name: payload.settlements.beneficiary_name || undefined
      } : undefined,
      tnc_accepted: payload.tncAccepted
    };

    const response = await updateRazorpayProduct(accountId, productId, requestData);

    // 4. Update Profile in DB
    const updatePayload: any = {
      razorpay_product_status: response.activation_status,
      updated_at: new Date().toISOString()
    };

    // If settlements was updated, sync it to core profiles table fields too!
    if (payload.settlements) {
      if (payload.settlements.account_number) {
        updatePayload.bank_account_number = payload.settlements.account_number;
      }
      if (payload.settlements.ifsc_code) {
        updatePayload.ifsc_code = payload.settlements.ifsc_code;
      }
      if (payload.settlements.beneficiary_name) {
        updatePayload.legal_name = payload.settlements.beneficiary_name;
      }
    }

    const { error: dbError } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('user_id', user.id);

    if (dbError) {
      console.error("Database update error:", dbError);
      return {
        success: false,
        error: {
          code: "DATABASE_ERROR",
          description: `Product updated successfully (${response.id}) but failed to update local profile: ${dbError.message}`,
          field: "database"
        }
      };
    }

    return {
      success: true,
      data: response
    };
  } catch (err: any) {
    console.error("Razorpay product update action error:", err);
    if (err instanceof RazorpayError) {
      return {
        success: false,
        error: err.errorPayload?.error || {
          code: "BAD_REQUEST_ERROR",
          description: err.message,
          field: ""
        }
      };
    }

    return {
      success: false,
      error: {
        code: "SERVER_ERROR",
        description: err.message || "An unexpected server error occurred.",
        field: ""
      }
    };
  }
}

export interface CreateOrderPayload {
  amount: number;
  currency: string;
  receipt?: string;
  transfers?: Array<{
    account: string;
    amount: number;
    currency: string;
    notes?: Record<string, string>;
    linked_account_notes?: string[];
    on_hold?: boolean;
    on_hold_until?: number;
  }>;
}

export async function createRazorpayOrderAction(payload: CreateOrderPayload) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          description: "You must be signed in to perform this action.",
          field: "auth"
        }
      };
    }

    // 2. Invoke API/mock order creation
    const orderRequest: RazorpayOrderRequest = {
      amount: payload.amount,
      currency: payload.currency,
      receipt: payload.receipt,
      transfers: payload.transfers
    };

    const response = await createRazorpayOrder(orderRequest);

    // 3. Optional: Sync order details to database if tables exist.
    const { error: dbError } = await supabase
      .from('orders')
      .insert({
        razorpay_order_id: response.id,
        amount: response.amount,
        currency: response.currency,
        status: response.status,
        buyer_id: user.id,
        created_at: new Date(response.created_at * 1000).toISOString(),
        updated_at: new Date().toISOString()
      });

    if (dbError) {
      console.warn("Soft warning: public.orders row insertion failed or missing columns:", dbError.message);
    }

    return {
      success: true,
      data: response
    };
  } catch (err: any) {
    console.error("Razorpay order creation action error:", err);
    if (err instanceof RazorpayError) {
      return {
        success: false,
        error: err.errorPayload?.error || {
          code: "BAD_REQUEST_ERROR",
          description: err.message,
          field: ""
        }
      };
    }

    return {
      success: false,
      error: {
        code: "SERVER_ERROR",
        description: err.message || "An unexpected server error occurred.",
        field: ""
      }
    };
  }
}




