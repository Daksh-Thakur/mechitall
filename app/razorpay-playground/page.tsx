'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Terminal, Send, CheckCircle2, XCircle, AlertTriangle, ChevronRight, Copy, RotateCcw, Info, Code, Sparkles, User, Layers, Cpu, Settings, ArrowLeftRight } from 'lucide-react';
import { createRazorpayAccountAction, createRazorpayStakeholderAction, requestRazorpayProductAction, updateRazorpayProductAction, createRazorpayOrderAction } from '@/app/actions/razorpay';
import { createClient } from '@/utils/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Preset Templates to test different API behaviors
const PRESETS = {
  success: {
    email: 'gaurav.kumar@example.com',
    phone: '9000090000',
    legal_business_name: 'Acme Corp',
    customer_facing_business_name: 'Acme Store',
    business_type: 'partnership',
    reference_id: '124124',
    category: 'healthcare',
    subcategory: 'clinic',
    business_model: 'Online medical clinic services',
    street1: '507, Koramangala 1st block',
    street2: 'MG Road',
    city: 'Bengaluru',
    state: 'KA',
    postal_code: '560034',
    pan: 'AAACL1234C',
    gst: '18AABCU9603R1ZM',
    bank_account_number: '1234567890',
    ifsc_code: 'HDFC0000317'
  },
  invalid_pan: {
    email: 'gaurav.kumar@example.com',
    phone: '9000090000',
    legal_business_name: 'Acme Corp',
    customer_facing_business_name: 'Acme Store',
    business_type: 'partnership',
    reference_id: '124124',
    category: 'healthcare',
    subcategory: 'clinic',
    business_model: 'Online medical clinic services',
    street1: '507, Koramangala 1st block',
    street2: 'MG Road',
    city: 'Bengaluru',
    state: 'KA',
    postal_code: '560034',
    pan: 'AAACL1234X', // invalid fourth digit (must be C, H, F, A, T, B, J, G, L)
    gst: '18AABCU9603R1ZM',
    bank_account_number: '1234567890',
    ifsc_code: 'HDFC0000317'
  },
  invalid_gstin: {
    email: 'gaurav.kumar@example.com',
    phone: '9000090000',
    legal_business_name: 'Acme Corp',
    customer_facing_business_name: 'Acme Store',
    business_type: 'partnership',
    reference_id: '124124',
    category: 'healthcare',
    subcategory: 'clinic',
    business_model: 'Online medical clinic services',
    street1: '507, Koramangala 1st block',
    street2: 'MG Road',
    city: 'Bengaluru',
    state: 'KA',
    postal_code: '560034',
    pan: 'AAACL1234C',
    gst: '18AABCU9603', // invalid length
    bank_account_number: '1234567890',
    ifsc_code: 'HDFC0000317'
  },
  duplicate_email: {
    email: 'merchant@example.com', // triggers existing email simulation error
    phone: '9000090000',
    legal_business_name: 'Acme Corp',
    customer_facing_business_name: 'Acme Store',
    business_type: 'partnership',
    reference_id: '124124',
    category: 'healthcare',
    subcategory: 'clinic',
    business_model: 'Online medical clinic services',
    street1: '507, Koramangala 1st block',
    street2: 'MG Road',
    city: 'Bengaluru',
    state: 'KA',
    postal_code: '560034',
    pan: 'AAACL1234C',
    gst: '18AABCU9603R1ZM',
    bank_account_number: '1234567890',
    ifsc_code: 'HDFC0000317'
  },
  invalid_ifsc: {
    email: 'gaurav.kumar@example.com',
    phone: '9000090000',
    legal_business_name: 'Acme Corp',
    customer_facing_business_name: 'Acme Store',
    business_type: 'partnership',
    reference_id: 'err_ifsc', // triggers invalid IFSC simulation error
    category: 'healthcare',
    subcategory: 'clinic',
    business_model: 'Online medical clinic services',
    street1: '507, Koramangala 1st block',
    street2: 'MG Road',
    city: 'Bengaluru',
    state: 'KA',
    postal_code: '560034',
    pan: 'AAACL1234C',
    gst: '18AABCU9603R1ZM',
    bank_account_number: '1234567890',
    ifsc_code: 'INVALID_IFSC'
  }
};

const STAKEHOLDER_PRESETS = {
  success: {
    accountId: 'acc_GLGeLkU2JUeyDZ',
    name: 'Gaurav Kumar',
    email: 'gaurav.kumar@example.com',
    pan: 'AVOPB1234P', // individual PAN (4th character is P)
    percentage_ownership: '100.00',
    director: true,
    executive: true,
    phone_primary: '9000090000',
    phone_secondary: '999999991',
    street: '506, Koramangala 1st block',
    city: 'Bengaluru',
    state: 'Karnataka',
    postal_code: '560034',
    country: 'IN'
  },
  invalid_pan: {
    accountId: 'acc_GLGeLkU2JUeyDZ',
    name: 'Gaurav Kumar',
    email: 'gaurav.kumar@example.com',
    pan: 'AVOPB1234C', // invalid stakeholder PAN (4th digit not P)
    percentage_ownership: '100.00',
    director: true,
    executive: true,
    phone_primary: '9000090000',
    phone_secondary: '999999991',
    street: '506, Koramangala 1st block',
    city: 'Bengaluru',
    state: 'Karnataka',
    postal_code: '560034',
    country: 'IN'
  },
  duplicate_stakeholder: {
    accountId: 'acc_GLGeLkU2JUeyDZ',
    name: 'err_multiple', // triggers too many stakeholders simulation error
    email: 'error_duplicate@example.com',
    pan: 'AVOPB1234P',
    percentage_ownership: '10.00',
    director: true,
    executive: true,
    phone_primary: '9000090000',
    phone_secondary: '999999991',
    street: '506, Koramangala 1st block',
    city: 'Bengaluru',
    state: 'Karnataka',
    postal_code: '560034',
    country: 'IN'
  },
  account_not_found: {
    accountId: 'err_missing_acc', // triggers linked account does not exist simulation error
    name: 'Gaurav Kumar',
    email: 'gaurav.kumar@example.com',
    pan: 'AVOPB1234P',
    percentage_ownership: '100.00',
    director: true,
    executive: true,
    phone_primary: '9000090000',
    phone_secondary: '999999991',
    street: '506, Koramangala 1st block',
    city: 'Bengaluru',
    state: 'Karnataka',
    postal_code: '560034',
    country: 'IN'
  }
};

const PRODUCT_PRESETS = {
  success: {
    accountId: 'acc_HQVlm3bnPmccC0',
    productName: 'route',
    tncAccepted: true
  },
  invalid_product: {
    accountId: 'acc_HQVlm3bnPmccC0',
    productName: 'payment_gateway', // invalid product name
    tncAccepted: true
  },
  tnc_rejected: {
    accountId: 'acc_HQVlm3bnPmccC0',
    productName: 'route',
    tncAccepted: false // tnc rejected
  },
  account_not_found: {
    accountId: 'err_missing_acc', // triggers linked account does not exist simulation error
    productName: 'route',
    tncAccepted: true
  }
};

const PRODUCT_UPDATE_PRESETS = {
  success: {
    accountId: 'acc_HQVlm3bnPmccC0',
    productId: 'acc_prd_HEgNpywUFctQ9e',
    account_number: '1234567890123456',
    ifsc_code: 'HDFC0000317',
    beneficiary_name: 'Gaurav Kumar',
    tnc_accepted: true
  },
  form_locked: {
    accountId: 'acc_HQVlm3bnPmccC0',
    productId: 'err_locked_prd', // triggers lock state error simulation
    account_number: '1234567890123456',
    ifsc_code: 'HDFC0000317',
    beneficiary_name: 'Gaurav Kumar',
    tnc_accepted: true
  },
  invalid_ifsc: {
    accountId: 'acc_HQVlm3bnPmccC0',
    productId: 'acc_prd_HEgNpywUFctQ9e',
    account_number: '1234567890123456',
    ifsc_code: 'INVALID_IFSC',
    beneficiary_name: 'Gaurav Kumar',
    tnc_accepted: true
  },
  invalid_account_number: {
    accountId: 'acc_HQVlm3bnPmccC0',
    productId: 'acc_prd_HEgNpywUFctQ9e',
    account_number: '123', // triggers invalid length (must be 5 to 20 chars)
    ifsc_code: 'HDFC0000317',
    beneficiary_name: 'Gaurav Kumar',
    tnc_accepted: true
  },
  account_not_found: {
    accountId: 'err_missing_acc', // triggers linked account does not exist simulation error
    productId: 'acc_prd_HEgNpywUFctQ9e',
    account_number: '1234567890123456',
    ifsc_code: 'HDFC0000317',
    beneficiary_name: 'Gaurav Kumar',
    tnc_accepted: true
  }
};

const ORDER_TRANSFERS_PRESETS = {
  success: {
    amount: 2000,
    currency: 'INR',
    receipt: 'receipt#1',
    t1_account: 'acc_IRQWUleX4BqvYn',
    t1_amount: 1000,
    t1_currency: 'INR',
    t1_note_branch: 'Acme Corp Bangalore North',
    t1_note_name: 'Gaurav Kumar',
    t1_linked_notes: 'branch',
    t1_on_hold: true,
    t1_on_hold_until: 1671222870,
    t2_account: 'acc_IROu8Nod6PXPtZ',
    t2_amount: 1000,
    t2_currency: 'INR',
    t2_note_branch: 'Acme Corp Bangalore South',
    t2_note_name: 'Saurav Kumar',
    t2_linked_notes: 'branch',
    t2_on_hold: false,
    t2_on_hold_until: 0
  },
  invalid_acc_code: {
    amount: 2000,
    currency: 'INR',
    receipt: 'receipt#1',
    t1_account: 'err_invalid_acc', // triggers invalid account code error simulation
    t1_amount: 1000,
    t1_currency: 'INR',
    t1_note_branch: 'Acme Corp Bangalore North',
    t1_note_name: 'Gaurav Kumar',
    t1_linked_notes: 'branch',
    t1_on_hold: false,
    t1_on_hold_until: 0,
    t2_account: '',
    t2_amount: 0,
    t2_currency: 'INR',
    t2_note_branch: '',
    t2_note_name: '',
    t2_linked_notes: '',
    t2_on_hold: false,
    t2_on_hold_until: 0
  },
  insufficient_balance: {
    amount: 2000,
    currency: 'INR',
    receipt: 'receipt#1',
    t1_account: 'err_insufficient_bal', // triggers insufficient balance simulation
    t1_amount: 1000,
    t1_currency: 'INR',
    t1_note_branch: 'Acme Corp Bangalore North',
    t1_note_name: 'Gaurav Kumar',
    t1_linked_notes: 'branch',
    t1_on_hold: false,
    t1_on_hold_until: 0,
    t2_account: '',
    t2_amount: 0,
    t2_currency: 'INR',
    t2_note_branch: '',
    t2_note_name: '',
    t2_linked_notes: '',
    t2_on_hold: false,
    t2_on_hold_until: 0
  },
  amount_exceeded: {
    amount: 2000,
    currency: 'INR',
    receipt: 'receipt#1',
    t1_account: 'acc_IRQWUleX4BqvYn',
    t1_amount: 1500,
    t1_currency: 'INR',
    t1_note_branch: 'Acme Corp Bangalore North',
    t1_note_name: 'Gaurav Kumar',
    t1_linked_notes: 'branch',
    t1_on_hold: false,
    t1_on_hold_until: 0,
    t2_account: 'acc_IROu8Nod6PXPtZ',
    t2_amount: 1500, // total 3000 exceeds order amount 2000
    t2_currency: 'INR',
    t2_note_branch: 'Acme Corp Bangalore South',
    t2_note_name: 'Saurav Kumar',
    t2_linked_notes: 'branch',
    t2_on_hold: false,
    t2_on_hold_until: 0
  },
  notes_mismatch: {
    amount: 2000,
    currency: 'INR',
    receipt: 'receipt#1',
    t1_account: 'acc_IRQWUleX4BqvYn',
    t1_amount: 1000,
    t1_currency: 'INR',
    t1_note_branch: '', // missing branch in notes
    t1_note_name: 'Gaurav Kumar',
    t1_linked_notes: 'branch', // branch key referenced but doesn't exist
    t1_on_hold: false,
    t1_on_hold_until: 0,
    t2_account: '',
    t2_amount: 0,
    t2_currency: 'INR',
    t2_note_branch: '',
    t2_note_name: '',
    t2_linked_notes: '',
    t2_on_hold: false,
    t2_on_hold_until: 0
  },
  invalid_currency: {
    amount: 2000,
    currency: 'USD', // triggers non-INR currency error
    receipt: 'receipt#1',
    t1_account: 'acc_IRQWUleX4BqvYn',
    t1_amount: 1000,
    t1_currency: 'USD',
    t1_note_branch: '',
    t1_note_name: '',
    t1_linked_notes: '',
    t1_on_hold: false,
    t1_on_hold_until: 0,
    t2_account: '',
    t2_amount: 0,
    t2_currency: 'INR',
    t2_note_branch: '',
    t2_note_name: '',
    t2_linked_notes: '',
    t2_on_hold: false,
    t2_on_hold_until: 0
  }
};

const SUPPORTED_STATES: Record<string, string> = {
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

export default function RazorpayPlayground() {
  const [activeTab, setActiveTab] = useState<'accounts' | 'stakeholders' | 'products_request' | 'products_update' | 'orders_transfer'>('accounts');
  const [form, setForm] = useState(PRESETS.success);
  const [sthForm, setSthForm] = useState(STAKEHOLDER_PRESETS.success);
  const [prdForm, setPrdForm] = useState(PRODUCT_PRESETS.success);
  const [updForm, setUpdForm] = useState(PRODUCT_UPDATE_PRESETS.success);
  const [ordForm, setOrdForm] = useState(ORDER_TRANSFERS_PRESETS.success);
  const [loading, setLoading] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{ code: string; desc: string; solution: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    }
    checkAuth();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
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

  const handlePrdChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setPrdForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setPrdForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setUpdForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setUpdForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleOrdChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setOrdForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setOrdForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const applyPreset = (key: keyof typeof PRESETS) => {
    setForm(PRESETS[key]);
    setResponse(null);
    setStatusCode(null);
    setErrorInfo(null);
  };

  const applySthPreset = (key: keyof typeof STAKEHOLDER_PRESETS) => {
    setSthForm(STAKEHOLDER_PRESETS[key]);
    setResponse(null);
    setStatusCode(null);
    setErrorInfo(null);
  };

  const applyPrdPreset = (key: keyof typeof PRODUCT_PRESETS) => {
    setPrdForm(PRODUCT_PRESETS[key]);
    setResponse(null);
    setStatusCode(null);
    setErrorInfo(null);
  };

  const applyUpdPreset = (key: keyof typeof PRODUCT_UPDATE_PRESETS) => {
    setUpdForm(PRODUCT_UPDATE_PRESETS[key]);
    setResponse(null);
    setStatusCode(null);
    setErrorInfo(null);
  };

  const applyOrdPreset = (key: keyof typeof ORDER_TRANSFERS_PRESETS) => {
    setOrdForm(ORDER_TRANSFERS_PRESETS[key]);
    setResponse(null);
    setStatusCode(null);
    setErrorInfo(null);
  };

  const getRequestBody = () => {
    return {
      email: form.email,
      phone: form.phone,
      type: 'route',
      reference_id: form.reference_id,
      legal_business_name: form.legal_business_name,
      business_type: form.business_type,
      profile: {
        category: form.category,
        subcategory: form.subcategory,
        business_model: form.business_model,
        addresses: {
          registered: {
            street1: form.street1,
            street2: form.street2 || undefined,
            city: form.city,
            state: form.state,
            postal_code: parseInt(form.postal_code) || form.postal_code,
            country: 'IN'
          }
        }
      },
      legal_info: {
        pan: form.pan || undefined,
        gst: form.gst || undefined
      }
    };
  };

  const getSthRequestBody = () => {
    return {
      name: sthForm.name,
      email: sthForm.email,
      percentage_ownership: parseFloat(sthForm.percentage_ownership) || undefined,
      relationship: {
        director: sthForm.director,
        executive: sthForm.executive
      },
      phone: sthForm.phone_primary || sthForm.phone_secondary ? {
        primary: sthForm.phone_primary ? parseInt(sthForm.phone_primary) : undefined,
        secondary: sthForm.phone_secondary ? parseInt(sthForm.phone_secondary) : undefined
      } : undefined,
      addresses: sthForm.street ? {
        residential: {
          street: sthForm.street,
          city: sthForm.city,
          state: sthForm.state,
          postal_code: sthForm.postal_code,
          country: sthForm.country
        }
      } : undefined,
      kyc: {
        pan: sthForm.pan || undefined
      }
    };
  };

  const getPrdRequestBody = () => {
    return {
      product_name: prdForm.productName,
      tnc_accepted: prdForm.tncAccepted
    };
  };

  const getUpdRequestBody = () => {
    return {
      settlements: {
        account_number: updForm.account_number,
        ifsc_code: updForm.ifsc_code,
        beneficiary_name: updForm.beneficiary_name
      },
      tnc_accepted: updForm.tnc_accepted
    };
  };

  const getOrdRequestBody = () => {
    const transfers: any[] = [];
    if (ordForm.t1_account) {
      const notes: Record<string, string> = {};
      if (ordForm.t1_note_branch) notes.branch = ordForm.t1_note_branch;
      if (ordForm.t1_note_name) notes.name = ordForm.t1_note_name;

      const linkedNotes = ordForm.t1_linked_notes 
        ? ordForm.t1_linked_notes.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      transfers.push({
        account: ordForm.t1_account,
        amount: Number(ordForm.t1_amount),
        currency: ordForm.t1_currency,
        notes: Object.keys(notes).length ? notes : undefined,
        linked_account_notes: linkedNotes.length ? linkedNotes : undefined,
        on_hold: ordForm.t1_on_hold,
        on_hold_until: ordForm.t1_on_hold_until ? Number(ordForm.t1_on_hold_until) : undefined
      });
    }

    if (ordForm.t2_account) {
      const notes: Record<string, string> = {};
      if (ordForm.t2_note_branch) notes.branch = ordForm.t2_note_branch;
      if (ordForm.t2_note_name) notes.name = ordForm.t2_note_name;

      const linkedNotes = ordForm.t2_linked_notes 
        ? ordForm.t2_linked_notes.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      transfers.push({
        account: ordForm.t2_account,
        amount: Number(ordForm.t2_amount),
        currency: ordForm.t2_currency,
        notes: Object.keys(notes).length ? notes : undefined,
        linked_account_notes: linkedNotes.length ? linkedNotes : undefined,
        on_hold: ordForm.t2_on_hold,
        on_hold_until: ordForm.t2_on_hold_until ? Number(ordForm.t2_on_hold_until) : undefined
      });
    }

    return {
      amount: Number(ordForm.amount),
      currency: ordForm.currency,
      receipt: ordForm.receipt || undefined,
      transfers: transfers.length ? transfers : undefined
    };
  };

  const handleCopyCurl = () => {
    let curlCmd = "";
    if (activeTab === 'accounts') {
      curlCmd = `curl -X POST 'https://api.razorpay.com/v2/accounts' \\
     -u [YOUR_KEY_ID]:[YOUR_SECRET] \\
     -H "Content-type: application/json" \\
     -d '${JSON.stringify(getRequestBody(), null, 2)}'`;
    } else if (activeTab === 'stakeholders') {
      curlCmd = `curl -X POST 'https://api.razorpay.com/v2/accounts/${sthForm.accountId}/stakeholders' \\
     -u [YOUR_KEY_ID]:[YOUR_SECRET] \\
     -H "Content-type: application/json" \\
     -d '${JSON.stringify(getSthRequestBody(), null, 2)}'`;
    } else if (activeTab === 'products_request') {
      curlCmd = `curl -X POST 'https://api.razorpay.com/v2/accounts/${prdForm.accountId}/products' \\
     -u [YOUR_KEY_ID]:[YOUR_SECRET] \\
     -H "Content-Type: application/json" \\
     -d '${JSON.stringify(getPrdRequestBody(), null, 2)}'`;
    } else if (activeTab === 'products_update') {
      curlCmd = `curl -X PATCH 'https://api.razorpay.com/v2/accounts/${updForm.accountId}/products/${updForm.productId}' \\
     -u [YOUR_KEY_ID]:[YOUR_SECRET] \\
     -H "Content-Type: application/json" \\
     -d '${JSON.stringify(getUpdRequestBody(), null, 2)}'`;
    } else {
      curlCmd = `curl -X POST 'https://api.razorpay.com/v1/orders' \\
     -u [YOUR_KEY_ID]:[YOUR_SECRET] \\
     -H "Content-Type: application/json" \\
     -d '${JSON.stringify(getOrdRequestBody(), null, 2)}'`;
    }
    navigator.clipboard.writeText(curlCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);
    setStatusCode(null);
    setErrorInfo(null);

    try {
      if (activeTab === 'accounts') {
        if (dryRun) {
          const { createRazorpayLinkedAccount } = await import('@/utils/razorpay');
          const res = await createRazorpayLinkedAccount(getRequestBody());
          setStatusCode(200);
          setResponse(res);
        } else {
          if (!isAuthenticated) {
            setStatusCode(401);
            setResponse({
              error: {
                code: "UNAUTHORIZED",
                description: "You must be signed in to execute in Database Update mode. Use Dry Run to test validations without signing in.",
                field: "auth"
              }
            });
            setLoading(false);
            return;
          }
          const res = await createRazorpayAccountAction({
            email: form.email,
            phone: form.phone,
            legal_business_name: form.legal_business_name,
            customer_facing_business_name: form.customer_facing_business_name || undefined,
            business_type: form.business_type,
            reference_id: form.reference_id || undefined,
            category: form.category,
            subcategory: form.subcategory,
            business_model: form.business_model || undefined,
            registered_address: {
              street1: form.street1,
              street2: form.street2 || undefined,
              city: form.city,
              state: form.state,
              postal_code: form.postal_code,
              country: 'IN'
            },
            pan: form.pan,
            gst: form.gst || undefined,
            bank_account_number: form.bank_account_number,
            ifsc_code: form.ifsc_code
          });
          if (res.success) {
            setStatusCode(200);
            setResponse(res.data);
          } else {
            setStatusCode(400);
            setResponse({ error: res.error });
            setErrorInfo({
              code: res.error?.code || 'BAD_REQUEST_ERROR',
              desc: res.error?.description || '',
              solution: getSolution(res.error?.description || '')
            });
          }
        }
      } else if (activeTab === 'stakeholders') {
        if (dryRun) {
          const { createRazorpayStakeholder } = await import('@/utils/razorpay');
          const res = await createRazorpayStakeholder(sthForm.accountId, getSthRequestBody());
          setStatusCode(200);
          setResponse(res);
        } else {
          if (!isAuthenticated) {
            setStatusCode(401);
            setResponse({
              error: {
                code: "UNAUTHORIZED",
                description: "You must be signed in to execute in Database Update mode. Use Dry Run to test validations without signing in.",
                field: "auth"
              }
            });
            setLoading(false);
            return;
          }
          const res = await createRazorpayStakeholderAction({
            accountId: sthForm.accountId,
            name: sthForm.name,
            email: sthForm.email,
            percentage_ownership: parseFloat(sthForm.percentage_ownership) || undefined,
            relationship: {
              director: sthForm.director,
              executive: sthForm.executive
            },
            phone: sthForm.phone_primary || sthForm.phone_secondary ? {
              primary: sthForm.phone_primary || undefined,
              secondary: sthForm.phone_secondary || undefined
            } : undefined,
            residential_address: sthForm.street ? {
              street: sthForm.street,
              city: sthForm.city,
              state: sthForm.state,
              postal_code: sthForm.postal_code,
              country: sthForm.country
            } : undefined,
            pan: sthForm.pan
          });
          if (res.success) {
            setStatusCode(200);
            setResponse(res.data);
          } else {
            setStatusCode(400);
            setResponse({ error: res.error });
            setErrorInfo({
              code: res.error?.code || 'BAD_REQUEST_ERROR',
              desc: res.error?.description || '',
              solution: getSolution(res.error?.description || '')
            });
          }
        }
      } else if (activeTab === 'products_request') {
        if (dryRun) {
          const { requestRazorpayProduct } = await import('@/utils/razorpay');
          const res = await requestRazorpayProduct(prdForm.accountId, getPrdRequestBody());
          setStatusCode(200);
          setResponse(res);
        } else {
          if (!isAuthenticated) {
            setStatusCode(401);
            setResponse({
              error: {
                code: "UNAUTHORIZED",
                description: "You must be signed in to execute in Database Update mode. Use Dry Run to test validations without signing in.",
                field: "auth"
              }
            });
            setLoading(false);
            return;
          }
          const res = await requestRazorpayProductAction({
            accountId: prdForm.accountId,
            productName: prdForm.productName,
            tncAccepted: prdForm.tncAccepted
          });
          if (res.success) {
            setStatusCode(200);
            setResponse(res.data);
          } else {
            setStatusCode(400);
            setResponse({ error: res.error });
            setErrorInfo({
              code: res.error?.code || 'BAD_REQUEST_ERROR',
              desc: res.error?.description || '',
              solution: getSolution(res.error?.description || '')
            });
          }
        }
      } else if (activeTab === 'products_update') {
        if (dryRun) {
          const { updateRazorpayProduct } = await import('@/utils/razorpay');
          const res = await updateRazorpayProduct(updForm.accountId, updForm.productId, getUpdRequestBody());
          setStatusCode(200);
          setResponse(res);
        } else {
          if (!isAuthenticated) {
            setStatusCode(401);
            setResponse({
              error: {
                code: "UNAUTHORIZED",
                description: "You must be signed in to execute in Database Update mode. Use Dry Run to test validations without signing in.",
                field: "auth"
              }
            });
            setLoading(false);
            return;
          }
          const res = await updateRazorpayProductAction({
            accountId: updForm.accountId,
            productId: updForm.productId,
            settlements: {
              account_number: updForm.account_number,
              ifsc_code: updForm.ifsc_code,
              beneficiary_name: updForm.beneficiary_name
            },
            tncAccepted: updForm.tnc_accepted
          });
          if (res.success) {
            setStatusCode(200);
            setResponse(res.data);
          } else {
            setStatusCode(400);
            setResponse({ error: res.error });
            setErrorInfo({
              code: res.error?.code || 'BAD_REQUEST_ERROR',
              desc: res.error?.description || '',
              solution: getSolution(res.error?.description || '')
            });
          }
        }
      } else {
        // Order creation tab submit
        if (dryRun) {
          const { createRazorpayOrder } = await import('@/utils/razorpay');
          const res = await createRazorpayOrder(getOrdRequestBody());
          setStatusCode(200);
          setResponse(res);
        } else {
          if (!isAuthenticated) {
            setStatusCode(401);
            setResponse({
              error: {
                code: "UNAUTHORIZED",
                description: "You must be signed in to execute in Database Update mode. Use Dry Run to test validations without signing in.",
                field: "auth"
              }
            });
            setLoading(false);
            return;
          }
          const res = await createRazorpayOrderAction(getOrdRequestBody());
          if (res.success) {
            setStatusCode(200);
            setResponse(res.data);
          } else {
            setStatusCode(400);
            setResponse({ error: res.error });
            setErrorInfo({
              code: res.error?.code || 'BAD_REQUEST_ERROR',
              desc: res.error?.description || '',
              solution: getSolution(res.error?.description || '')
            });
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setStatusCode(err.statusCode || 400);
      const errPayload = err.errorPayload || {
        error: {
          code: "BAD_REQUEST_ERROR",
          description: err.message,
          field: ""
        }
      };
      setResponse(errPayload);
      setErrorInfo({
        code: errPayload.error?.code || 'BAD_REQUEST_ERROR',
        desc: errPayload.error?.description || '',
        solution: getSolution(errPayload.error?.description || '')
      });
    } finally {
      setLoading(false);
    }
  };

  const getSolution = (desc: string): string => {
    if (desc.includes("IFSC")) {
      return "Make sure you pass a valid bank branch IFSC code without typos.";
    } else if (desc.includes("account number") && (desc.includes("5 and 20") || desc.includes("between 5"))) {
      return "Ensure the bank account number length is between 5 and 20 characters.";
    } else if (desc.includes("account number")) {
      return "Make sure to pass a valid bank account number between 5 and 35 characters.";
    } else if (desc.includes("email already exists")) {
      return "Make sure the email address is unique. Try a different domain or alias.";
    } else if (desc.includes("business type")) {
      return "Ensure to send correct values for business parameters (e.g. partnership, llp, proprietorship).";
    } else if (desc.includes("PAN") && desc.includes("Individual")) {
      return "Ensure the 4th digit of a stakeholder PAN matches 'P' (Individual PAN).";
    } else if (desc.includes("PAN")) {
      return "Ensure the 4th digit of business PAN matches C, H, F, A, T, B, J, G, or L.";
    } else if (desc.includes("GSTIN")) {
      return "Provide a valid 15-character GSTIN matching the business structure.";
    } else if (desc.includes("at least 3 characters") || desc.includes("reference_id")) {
      return "The reference_id value should be between 3 to 20 characters.";
    } else if (desc.includes("cannot be more than one")) {
      return "Route products are limited to a maximum of 1 stakeholder account.";
    } else if (desc.includes("does not exist") || desc.includes("Linked account")) {
      return "Ensure the Linked Account ID is valid and exists before proceeding.";
    } else if (desc.includes("product requested is invalid")) {
      return "Ensure the product_name parameter is set exactly to 'route'.";
    } else if (desc.includes("tnc accepted is invalid") || desc.includes("accept the tnc")) {
      return "Accept terms and conditions by passing tnc_accepted as true.";
    } else if (desc.includes("locked")) {
      return "The activation form is locked as it is currently under review by admin. Please wait.";
    } else if (desc.includes("invalid account_code")) {
      return "Double check the sub-merchant Linked Account code ID starting with 'acc_'.";
    } else if (desc.includes("insufficient balance")) {
      return "Simulated account has no funds. Add reserve balance in the merchant portal.";
    } else if (desc.includes("exceeds the captured") || desc.includes("sum of amount requested")) {
      return "The total transferred split amounts cannot exceed the root order amount.";
    } else if (desc.includes("linked_account_notes must exist")) {
      return "All keys listed under linked_account_notes must exist as key properties inside notes.";
    } else if (desc.includes("on_hold_until must be between")) {
      return "Hold settlement timestamp must be a future Unix timestamp (between 946684800 and 4765046400).";
    } else if (desc.includes("amount must be at least")) {
      return "Order amount and transfer amounts must be at least ₹1.00 (100 paise).";
    } else if (desc.includes("INR for transfers") || desc.includes("currency should be")) {
      return "Ensure all order and transfer currencies are set strictly to 'INR'.";
    }
    return "Make sure the details provided conform to the required schemas.";
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-955 font-sans text-zinc-200">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 md:py-12 w-full space-y-8">
        {/* Header Console */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D0F5]/5 rounded-full blur-3xl -z-10"></div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-[#00D0F5]/10 text-[#00D0F5] border border-[#00D0F5]/20 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                Developer Tool
              </span>
              <span className="text-zinc-500 font-bold">•</span>
              <span className="text-zinc-400 text-xs font-mono font-bold uppercase">
                {activeTab === 'accounts' 
                  ? 'POST /v2/accounts' 
                  : activeTab === 'stakeholders' 
                  ? 'POST /v2/accounts/:id/stakeholders' 
                  : activeTab === 'products_request'
                  ? 'POST /v2/accounts/:id/products'
                  : activeTab === 'products_update'
                  ? 'PATCH /v2/accounts/:id/products/:product_id'
                  : 'POST /v1/orders'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase font-['Space_Grotesk'] flex items-center gap-2">
              <Terminal className="w-6 h-6 text-[#00D0F5]" />
              Razorpay API Playground
            </h1>
            <p className="text-xs text-zinc-400 max-w-xl font-semibold leading-relaxed">
              Test request bodies, validate business formats, and simulate error codes locally for Linked Accounts, Stakeholders, Product configurations, and Order Transfers.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/profile?tab=seller_earnings"
              className="bg-zinc-800 border border-zinc-700/60 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all"
            >
              Back to Seller Hub
            </Link>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap border-b border-zinc-850">
          <button
            onClick={() => {
              setActiveTab('accounts');
              setResponse(null);
              setStatusCode(null);
              setErrorInfo(null);
            }}
            className={`px-4 md:px-6 py-3 border-b-2 text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'accounts'
                ? 'border-[#00D0F5] text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-350'
            }`}
          >
            Accounts API
          </button>
          <button
            onClick={() => {
              setActiveTab('stakeholders');
              setResponse(null);
              setStatusCode(null);
              setErrorInfo(null);
            }}
            className={`px-4 md:px-6 py-3 border-b-2 text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'stakeholders'
                ? 'border-[#00D0F5] text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-350'
            }`}
          >
            Stakeholders API
          </button>
          <button
            onClick={() => {
              setActiveTab('products_request');
              setResponse(null);
              setStatusCode(null);
              setErrorInfo(null);
            }}
            className={`px-4 md:px-6 py-3 border-b-2 text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'products_request'
                ? 'border-[#00D0F5] text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-350'
            }`}
          >
            Request Product API
          </button>
          <button
            onClick={() => {
              setActiveTab('products_update');
              setResponse(null);
              setStatusCode(null);
              setErrorInfo(null);
            }}
            className={`px-4 md:px-6 py-3 border-b-2 text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'products_update'
                ? 'border-[#00D0F5] text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-350'
            }`}
          >
            Update Product API (PATCH)
          </button>
          <button
            onClick={() => {
              setActiveTab('orders_transfer');
              setResponse(null);
              setStatusCode(null);
              setErrorInfo(null);
            }}
            className={`px-4 md:px-6 py-3 border-b-2 text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'orders_transfer'
                ? 'border-[#00D0F5] text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-350'
            }`}
          >
            Order Transfers API
          </button>
        </div>

        {/* Console Presets Bar */}
        <div className="flex flex-wrap gap-2.5 items-center bg-zinc-900/40 border border-zinc-800/80 p-3 rounded-2xl">
          <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider font-mono mr-2">
            API Presets:
          </span>
          {activeTab === 'accounts' ? (
            <>
              <button
                onClick={() => applyPreset('success')}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald border border-emerald-500/20 hover:bg-emerald-500/20 text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                ✓ Success Template
              </button>
              <button
                onClick={() => applyPreset('invalid_pan')}
                className="px-3.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                ✗ Invalid PAN
              </button>
              <button
                onClick={() => applyPreset('duplicate_email')}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                ⚠ Duplicate Email
              </button>
              <button
                onClick={() => applyPreset('invalid_ifsc')}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                ⚠ Invalid IFSC
              </button>
            </>
          ) : activeTab === 'stakeholders' ? (
            <>
              <button
                onClick={() => applySthPreset('success')}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald border border-emerald-500/20 hover:bg-emerald-500/20 text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                ✓ Success Stakeholder
              </button>
              <button
                onClick={() => applySthPreset('invalid_pan')}
                className="px-3.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                ✗ Invalid PAN (Not Individual)
              </button>
              <button
                onClick={() => applySthPreset('duplicate_stakeholder')}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                ⚠ Limit Exceeded
              </button>
              <button
                onClick={() => applySthPreset('account_not_found')}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                ⚠ Account Not Found
              </button>
            </>
          ) : activeTab === 'products_request' ? (
            <>
              <button
                onClick={() => applyPrdPreset('success')}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald border border-emerald-500/20 hover:bg-emerald-500/20 text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                ✓ Success Product
              </button>
              <button
                onClick={() => applyPrdPreset('invalid_product')}
                className="px-3.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                ✗ Invalid Product Name
              </button>
              <button
                onClick={() => applyPrdPreset('tnc_rejected')}
                className="px-3.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                ✗ TNC Rejected
              </button>
              <button
                onClick={() => applyPrdPreset('account_not_found')}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                ⚠ Account Not Found
              </button>
            </>
          ) : activeTab === 'products_update' ? (
            <>
              <button
                onClick={() => applyUpdPreset('success')}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald border border-emerald-500/20 hover:bg-emerald-500/20 text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                ✓ Success Update
              </button>
              <button
                onClick={() => applyUpdPreset('form_locked')}
                className="px-3.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                ✗ Review Stage Locked
              </button>
              <button
                onClick={() => applyUpdPreset('invalid_ifsc')}
                className="px-3.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                ✗ Invalid IFSC Code
              </button>
              <button
                onClick={() => applyUpdPreset('invalid_account_number')}
                className="px-3.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                ✗ Invalid Account Length
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => applyOrdPreset('success')}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald border border-emerald-500/20 hover:bg-emerald-500/20 text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                ✓ Success Split Order
              </button>
              <button
                onClick={() => applyOrdPreset('invalid_acc_code')}
                className="px-3.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                ✗ Invalid Account ID
              </button>
              <button
                onClick={() => applyOrdPreset('insufficient_balance')}
                className="px-3.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                ✗ Insufficient Balance
              </button>
              <button
                onClick={() => applyOrdPreset('amount_exceeded')}
                className="px-3.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                ✗ Split Exceeds Order Limit
              </button>
              <button
                onClick={() => applyOrdPreset('notes_mismatch')}
                className="px-3.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                ✗ Notes Mismatch
              </button>
              <button
                onClick={() => applyOrdPreset('invalid_currency')}
                className="px-3.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                ✗ Non-INR Currency
              </button>
            </>
          )}
        </div>

        {/* Main Grid split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left panel: Form parameters */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <span className="text-xs font-black uppercase tracking-wider font-mono text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#00D0F5]" />
                Request Parameters
              </span>

              {/* Mode Selectors */}
              <div className="flex bg-zinc-950 border border-zinc-800 p-1 rounded-xl text-[9px] font-mono uppercase font-black">
                <button
                  type="button"
                  onClick={() => setDryRun(true)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    dryRun ? 'bg-zinc-800 text-[#00D0F5] border border-zinc-700/60' : 'text-zinc-500 hover:text-zinc-350'
                  }`}
                >
                  Dry Run (Val)
                </button>
                <button
                  type="button"
                  onClick={() => setDryRun(false)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    !dryRun ? 'bg-zinc-800 text-[#00D0F5] border border-zinc-700/60' : 'text-zinc-500 hover:text-zinc-350'
                  }`}
                >
                  DB Sync
                </button>
              </div>
            </div>

            {/* Inputs based on active tab */}
            {activeTab === 'accounts' ? (
              <div className="space-y-4 text-left">
                <h3 className="text-xs font-bold text-[#00D0F5] uppercase tracking-wider font-mono">1. Root Account Fields</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      required
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider block">Legal Business Name</label>
                    <input
                      type="text"
                      name="legal_business_name"
                      required
                      value={form.legal_business_name}
                      onChange={handleChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">Billing Customer Label</label>
                    <input
                      type="text"
                      name="customer_facing_business_name"
                      value={form.customer_facing_business_name}
                      onChange={handleChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">Business Type</label>
                    <input
                      type="text"
                      name="business_type"
                      required
                      value={form.business_type}
                      onChange={handleChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">Reference ID</label>
                    <input
                      type="text"
                      name="reference_id"
                      value={form.reference_id}
                      onChange={handleChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                </div>

                <h3 className="text-xs font-bold text-[#00D0F5] uppercase tracking-wider font-mono pt-2">2. Payout & KYC Legal Info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">Bank Account Number</label>
                    <input
                      type="text"
                      name="bank_account_number"
                      required
                      value={form.bank_account_number}
                      onChange={handleChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">IFSC Code</label>
                    <input
                      type="text"
                      name="ifsc_code"
                      required
                      value={form.ifsc_code}
                      onChange={handleChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">Business PAN Card</label>
                    <input
                      type="text"
                      name="pan"
                      required
                      value={form.pan}
                      onChange={handleChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">GSTIN Number</label>
                    <input
                      type="text"
                      name="gst"
                      value={form.gst}
                      onChange={handleChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">Category</label>
                    <input
                      type="text"
                      name="category"
                      required
                      value={form.category}
                      onChange={handleChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">Subcategory</label>
                    <input
                      type="text"
                      name="subcategory"
                      required
                      value={form.subcategory}
                      onChange={handleChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">Model</label>
                    <input
                      type="text"
                      name="business_model"
                      value={form.business_model}
                      onChange={handleChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                </div>

                <h3 className="text-xs font-bold text-[#00D0F5] uppercase tracking-wider font-mono pt-2">3. Registered Address</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">Street Line 1</label>
                    <input
                      type="text"
                      name="street1"
                      required
                      value={form.street1}
                      onChange={handleChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">Street Line 2</label>
                    <input
                      type="text"
                      name="street2"
                      value={form.street2}
                      onChange={handleChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">City</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={form.city}
                      onChange={handleChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">State Code</label>
                    <select
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    >
                      {Object.entries(SUPPORTED_STATES).map(([code, name]) => (
                        <option key={code} value={code}>
                          {name} ({code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">Postal Code</label>
                    <input
                      type="text"
                      name="postal_code"
                      required
                      value={form.postal_code}
                      onChange={handleChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                </div>
              </div>
            ) : activeTab === 'stakeholders' ? (
              // Stakeholders tab inputs
              <div className="space-y-4 text-left">
                <h3 className="text-xs font-bold text-[#00D0F5] uppercase tracking-wider font-mono">1. Root Account Linking</h3>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Linked Account ID *</label>
                  <input
                    type="text"
                    name="accountId"
                    required
                    value={sthForm.accountId}
                    onChange={handleSthChange}
                    className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                  />
                </div>

                <h3 className="text-xs font-bold text-[#00D0F5] uppercase tracking-wider font-mono pt-2">2. Personal & KYC Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">Full Legal Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={sthForm.name}
                      onChange={handleSthChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={sthForm.email}
                      onChange={handleSthChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">Individual PAN *</label>
                    <input
                      type="text"
                      name="pan"
                      required
                      value={sthForm.pan}
                      onChange={handleSthChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">Ownership Percentage *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="percentage_ownership"
                      required
                      value={sthForm.percentage_ownership}
                      onChange={handleSthChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
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
                    <span>Director</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      name="executive"
                      checked={sthForm.executive}
                      onChange={handleSthChange}
                      className="rounded border-zinc-800 bg-zinc-950 text-[#00D0F5] focus:ring-[#00D0F5]"
                    />
                    <span>Executive</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">Primary Phone</label>
                    <input
                      type="text"
                      name="phone_primary"
                      value={sthForm.phone_primary}
                      onChange={handleSthChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">Secondary Phone</label>
                    <input
                      type="text"
                      name="phone_secondary"
                      value={sthForm.phone_secondary}
                      onChange={handleSthChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                </div>

                <h3 className="text-xs font-bold text-[#00D0F5] uppercase tracking-wider font-mono pt-2">3. Residential Address (Optional)</h3>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">Street Address</label>
                  <input
                    type="text"
                    name="street"
                    value={sthForm.street}
                    onChange={handleSthChange}
                    className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">City</label>
                    <input
                      type="text"
                      name="city"
                      value={sthForm.city}
                      onChange={handleSthChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">State</label>
                    <input
                      type="text"
                      name="state"
                      value={sthForm.state}
                      onChange={handleSthChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">Postal Code</label>
                    <input
                      type="text"
                      name="postal_code"
                      value={sthForm.postal_code}
                      onChange={handleSthChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                </div>
              </div>
            ) : activeTab === 'products_request' ? (
              // Products API Inputs Form
              <div className="space-y-4 text-left">
                <h3 className="text-xs font-bold text-[#00D0F5] uppercase tracking-wider font-mono">1. Account Linking</h3>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">Linked Account ID *</label>
                  <input
                    type="text"
                    name="accountId"
                    required
                    value={prdForm.accountId}
                    onChange={handlePrdChange}
                    className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                  />
                </div>

                <h3 className="text-xs font-bold text-[#00D0F5] uppercase tracking-wider font-mono pt-2">2. Configuration Details</h3>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">Product Name *</label>
                  <input
                    type="text"
                    name="productName"
                    required
                    value={prdForm.productName}
                    onChange={handlePrdChange}
                    className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                  />
                </div>

                <div className="flex gap-4 py-3 bg-zinc-955/20 border border-zinc-800 p-4 rounded-xl items-start">
                  <input
                    type="checkbox"
                    id="tncAccepted"
                    name="tncAccepted"
                    checked={prdForm.tncAccepted}
                    onChange={handlePrdChange}
                    className="rounded border-zinc-800 bg-zinc-950 text-[#00D0F5] focus:ring-[#00D0F5] mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="tncAccepted" className="text-xs text-zinc-300 font-semibold cursor-pointer">
                    I accept the terms and conditions for Route product configuration.
                  </label>
                </div>
              </div>
            ) : activeTab === 'products_update' ? (
              // Product PATCH Update Form
              <div className="space-y-4 text-left font-sans">
                <h3 className="text-xs font-bold text-[#00D0F5] uppercase tracking-wider font-mono">1. Endpoint Parameters</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block font-mono">Account ID *</label>
                    <input
                      type="text"
                      name="accountId"
                      required
                      value={updForm.accountId}
                      onChange={handleUpdChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block font-mono">Product ID *</label>
                    <input
                      type="text"
                      name="productId"
                      required
                      value={updForm.productId}
                      onChange={handleUpdChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                </div>

                <h3 className="text-xs font-bold text-[#00D0F5] uppercase tracking-wider font-mono pt-2">2. Settlements Settlement Details</h3>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block font-mono">Beneficiary Name *</label>
                  <input
                    type="text"
                    name="beneficiary_name"
                    required
                    value={updForm.beneficiary_name}
                    onChange={handleUpdChange}
                    className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold focus:outline-none focus:border-[#00D0F5]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block font-mono">Account Number *</label>
                    <input
                      type="text"
                      name="account_number"
                      required
                      value={updForm.account_number}
                      onChange={handleUpdChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block font-mono">IFSC Code *</label>
                    <input
                      type="text"
                      name="ifsc_code"
                      required
                      value={updForm.ifsc_code}
                      onChange={handleUpdChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                </div>

                <div className="flex gap-4 py-3 bg-zinc-955/20 border border-zinc-800 p-4 rounded-xl items-start">
                  <input
                    type="checkbox"
                    id="updTncAccepted"
                    name="tnc_accepted"
                    checked={updForm.tnc_accepted}
                    onChange={handleUpdChange}
                    className="rounded border-zinc-800 bg-zinc-955 text-[#00D0F5] focus:ring-[#00D0F5] mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="updTncAccepted" className="text-xs text-zinc-300 font-semibold cursor-pointer">
                    I confirm terms and conditions acceptance for updating Route settlements gateway parameters.
                  </label>
                </div>
              </div>
            ) : (
              // Order split transfers form
              <div className="space-y-4 text-left font-sans">
                <h3 className="text-xs font-bold text-[#00D0F5] uppercase tracking-wider font-mono">1. Order Attributes</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block font-mono">Order Amount *</label>
                    <input
                      type="number"
                      name="amount"
                      required
                      value={ordForm.amount}
                      onChange={handleOrdChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block font-mono">Currency *</label>
                    <input
                      type="text"
                      name="currency"
                      required
                      value={ordForm.currency}
                      onChange={handleOrdChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block font-mono">Receipt Reference</label>
                    <input
                      type="text"
                      name="receipt"
                      value={ordForm.receipt}
                      onChange={handleOrdChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                </div>

                <div className="border-t border-zinc-850 pt-3">
                  <h3 className="text-xs font-bold text-[#00D0F5] uppercase tracking-wider font-mono flex items-center gap-1">
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    2. Split Transfer #1 (Required)
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block font-mono">Recipient Account ID *</label>
                    <input
                      type="text"
                      name="t1_account"
                      required
                      value={ordForm.t1_account}
                      onChange={handleOrdChange}
                      placeholder="e.g. acc_IRQWUleX4BqvYn"
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block font-mono">Split Amount (paise) *</label>
                    <input
                      type="number"
                      name="t1_amount"
                      required
                      value={ordForm.t1_amount}
                      onChange={handleOrdChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block font-mono">Notes Branch Key</label>
                    <input
                      type="text"
                      name="t1_note_branch"
                      value={ordForm.t1_note_branch}
                      onChange={handleOrdChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block font-mono">Notes Name Key</label>
                    <input
                      type="text"
                      name="t1_note_name"
                      value={ordForm.t1_note_name}
                      onChange={handleOrdChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block font-mono">Linked Notes Keys</label>
                    <input
                      type="text"
                      name="t1_linked_notes"
                      value={ordForm.t1_linked_notes}
                      onChange={handleOrdChange}
                      placeholder="e.g. branch"
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2 bg-zinc-955/20 border border-zinc-800 p-4 rounded-xl items-center">
                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      name="t1_on_hold"
                      checked={ordForm.t1_on_hold}
                      onChange={handleOrdChange}
                      className="rounded border-zinc-800 bg-zinc-955 text-[#00D0F5] focus:ring-[#00D0F5]"
                    />
                    <span>Put Split Settlement On Hold</span>
                  </label>
                  {ordForm.t1_on_hold && (
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">On Hold Until Unix Timestamp</label>
                      <input
                        type="number"
                        name="t1_on_hold_until"
                        value={ordForm.t1_on_hold_until || ''}
                        onChange={handleOrdChange}
                        placeholder="e.g. 1671222870"
                        className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-1.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                      />
                    </div>
                  )}
                </div>

                <div className="border-t border-zinc-850 pt-3">
                  <h3 className="text-xs font-bold text-[#00D0F5] uppercase tracking-wider font-mono flex items-center gap-1">
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    3. Split Transfer #2 (Optional)
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block font-mono">Recipient Account ID</label>
                    <input
                      type="text"
                      name="t2_account"
                      value={ordForm.t2_account}
                      onChange={handleOrdChange}
                      placeholder="e.g. acc_IROu8Nod6PXPtZ"
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block font-mono">Split Amount (paise)</label>
                    <input
                      type="number"
                      name="t2_amount"
                      value={ordForm.t2_amount || ''}
                      onChange={handleOrdChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block font-mono">Notes Branch Key</label>
                    <input
                      type="text"
                      name="t2_note_branch"
                      value={ordForm.t2_note_branch}
                      onChange={handleOrdChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block font-mono">Notes Name Key</label>
                    <input
                      type="text"
                      name="t2_note_name"
                      value={ordForm.t2_note_name}
                      onChange={handleOrdChange}
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block font-mono">Linked Notes Keys</label>
                    <input
                      type="text"
                      name="t2_linked_notes"
                      value={ordForm.t2_linked_notes}
                      onChange={handleOrdChange}
                      placeholder="e.g. branch"
                      className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-2.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2 bg-zinc-955/20 border border-zinc-800 p-4 rounded-xl items-center">
                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      name="t2_on_hold"
                      checked={ordForm.t2_on_hold}
                      onChange={handleOrdChange}
                      className="rounded border-zinc-800 bg-zinc-955 text-[#00D0F5] focus:ring-[#00D0F5]"
                    />
                    <span>Put Split Settlement On Hold</span>
                  </label>
                  {ordForm.t2_on_hold && (
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">On Hold Until Unix Timestamp</label>
                      <input
                        type="number"
                        name="t2_on_hold_until"
                        value={ordForm.t2_on_hold_until || ''}
                        onChange={handleOrdChange}
                        placeholder="e.g. 1671222870"
                        className="w-full bg-zinc-955 border border-zinc-800 rounded-lg p-1.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#00D0F5]"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-zinc-850 flex justify-between items-center gap-4">
              {!dryRun && !isAuthenticated && (
                <div className="flex items-center gap-2 text-red-400 text-[10px] font-bold uppercase tracking-wider bg-red-500/5 px-3 py-2 rounded-xl border border-red-500/10">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Signin required for Database sync mode</span>
                </div>
              )}
              <div />
              <button
                type="submit"
                disabled={loading}
                className="bg-[#00D0F5] hover:bg-[#00e5ff] text-zinc-955 py-3 px-6 rounded-xl text-xs font-mono font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#00D0F5]/10 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4 shrink-0" />
                <span>{loading ? 'Executing API Call...' : 'Send API Request'}</span>
              </button>
            </div>
          </form>

          {/* Right panel: Live CURL & response viewer */}
          <div className="lg:col-span-5 space-y-6">
            {/* cURL panel */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
                <span className="text-[10px] font-black uppercase tracking-wider font-mono text-zinc-400 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-zinc-550" />
                  Request cURL Template
                </span>
                <button
                  onClick={handleCopyCurl}
                  className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#00D0F5] hover:opacity-80 transition-opacity flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="bg-zinc-955/70 p-3 rounded-xl border border-zinc-850/80 text-[10px] font-mono text-zinc-450 text-left overflow-x-auto select-all max-h-[140px] leading-relaxed">
                {activeTab === 'accounts' ? (
                  `curl -X POST 'https://api.razorpay.com/v2/accounts' \\
 -u [YOUR_KEY_ID]:[YOUR_SECRET] \\
 -H "Content-type: application/json" \\
 -d '${JSON.stringify(getRequestBody(), null, 2)}'`
                ) : activeTab === 'stakeholders' ? (
                  `curl -X POST 'https://api.razorpay.com/v2/accounts/${sthForm.accountId}/stakeholders' \\
 -u [YOUR_KEY_ID]:[YOUR_SECRET] \\
 -H "Content-type: application/json" \\
 -d '${JSON.stringify(getSthRequestBody(), null, 2)}'`
                ) : activeTab === 'products_request' ? (
                  `curl -X POST 'https://api.razorpay.com/v2/accounts/${prdForm.accountId}/products' \\
 -u [YOUR_KEY_ID]:[YOUR_SECRET] \\
 -H "Content-Type: application/json" \\
 -d '${JSON.stringify(getPrdRequestBody(), null, 2)}'`
                ) : activeTab === 'products_update' ? (
                  `curl -X PATCH 'https://api.razorpay.com/v2/accounts/${updForm.accountId}/products/${updForm.productId}' \\
 -u [YOUR_KEY_ID]:[YOUR_SECRET] \\
 -H "Content-Type: application/json" \\
 -d '${JSON.stringify(getUpdRequestBody(), null, 2)}'`
                ) : (
                  `curl -X POST 'https://api.razorpay.com/v1/orders' \\
 -u [YOUR_KEY_ID]:[YOUR_SECRET] \\
 -H "Content-type: application/json" \\
 -d '${JSON.stringify(getOrdRequestBody(), null, 2)}'`
                )}
              </pre>
            </div>

            {/* Response Console */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between min-h-[440px]">
              <div>
                <div className="flex justify-between items-center pb-3 border-b border-zinc-850">
                  <span className="text-xs font-black uppercase tracking-wider font-mono text-white flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-zinc-450" />
                    Response Payload
                  </span>
                  {statusCode !== null && (
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase ${
                      statusCode === 200 
                        ? 'bg-emerald-500/10 text-emerald border border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      Status: {statusCode}
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  {response ? (
                    <pre className="bg-zinc-955 p-4 rounded-2xl border border-zinc-850 text-[10px] font-mono text-zinc-400 text-left overflow-auto max-h-[300px] leading-relaxed">
                      {JSON.stringify(response, null, 2)}
                    </pre>
                  ) : (
                    <div className="border border-dashed border-zinc-800 rounded-2xl p-12 text-center text-xs font-semibold text-zinc-550 space-y-2">
                      <Terminal className="w-8 h-8 text-zinc-700 mx-auto animate-pulse" />
                      <p>Send an API request using the parameters on the left to see the Razorpay JSON response.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Solution Card for failures */}
              {errorInfo && (
                <div className="bg-red-500/5 border border-red-500/15 p-4 rounded-2xl space-y-2 text-[11px] font-semibold text-red-400 text-left">
                  <div className="flex items-center gap-1.5 text-red-500 uppercase tracking-wider font-mono text-[9px] font-black">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Error Solution Mapping</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed">
                    <strong>Code:</strong> {errorInfo.code}
                  </p>
                  <p className="text-zinc-400 leading-relaxed">
                    <strong>Description:</strong> {errorInfo.desc}
                  </p>
                  <p className="text-emerald/95 leading-relaxed bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg mt-1 font-sans">
                    <strong>Recommended Solution:</strong> {errorInfo.solution}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
