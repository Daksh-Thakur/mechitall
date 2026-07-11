import crypto from 'crypto';

/**
 * PayU helper utility for secure payment hash generation and verification.
 */

const MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY || 'mock_key';
const MERCHANT_SALT = process.env.PAYU_MERCHANT_SALT || 'mock_salt';
const IS_SANDBOX = process.env.PAYU_SANDBOX !== 'false';

export function getPayUEndpoint(): string {
  // If keys are mock or not set, route to local simulator
  if (MERCHANT_KEY === 'mock_key' || MERCHANT_SALT === 'mock_salt') {
    return '/payu-simulator';
  }
  return IS_SANDBOX
    ? 'https://sandboxsecure.payu.in/_payment'
    : 'https://secure.payu.in/_payment';
}

/**
 * Generates payment request hash for PayU checkout.
 * Formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
 */
export function generatePayUHash(params: {
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string; // profile_id
  udf2?: string; // order_type ('shop' | 'quote')
  udf3?: string; // quote_id / metadata
  udf4?: string;
  udf5?: string;
}): string {
  const key = MERCHANT_KEY;
  const salt = MERCHANT_SALT;

  const udf1 = params.udf1 || '';
  const udf2 = params.udf2 || '';
  const udf3 = params.udf3 || '';
  const udf4 = params.udf4 || '';
  const udf5 = params.udf5 || '';

  const hashString = `${key}|${params.txnid}|${params.amount}|${params.productinfo}|${params.firstname}|${params.email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
  
  return crypto.createHash('sha512').update(hashString).digest('hex');
}

/**
 * Verifies the PayU response hash.
 * Formula: sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 */
export function verifyPayUResponse(body: {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  status: string;
  hash: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}): boolean {
  const salt = MERCHANT_SALT;
  const status = body.status;
  const key = body.key;
  const txnid = body.txnid;
  const amount = body.amount;
  const productinfo = body.productinfo;
  const firstname = body.firstname;
  const email = body.email;

  const udf1 = body.udf1 || '';
  const udf2 = body.udf2 || '';
  const udf3 = body.udf3 || '';
  const udf4 = body.udf4 || '';
  const udf5 = body.udf5 || '';

  const hashString = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  const computedHash = crypto.createHash('sha512').update(hashString).digest('hex');

  return computedHash.toLowerCase() === body.hash.toLowerCase();
}

/**
 * Triggers PayU Nodal Escrow Release Settlement.
 * Routes 10% to Master Aggregator and 90% to Child Merchant Key.
 */
export async function releasePayUEscrow(orderId: string, totalAmount: number, childMerchantKey: string) {
  const key = MERCHANT_KEY;
  const salt = MERCHANT_SALT;
  
  const releaseAmount = (totalAmount * 0.9).toFixed(2);
  const commissionAmount = (totalAmount * 0.1).toFixed(2);
  
  const isSandbox = process.env.PAYU_SANDBOX !== 'false';
  const releaseUrl = isSandbox
    ? 'https://sandboxsecure.payu.in/escrow/release'
    : 'https://api.payu.in/escrow/release';

  if (key === 'mock_key' || salt === 'mock_salt') {
    console.log(`[PayU Escrow Simulator] Mocking escrow release for Order ${orderId}`);
    return { success: true, transactionId: `PAYU-REL-MOCK-${Math.floor(100000 + Math.random() * 900000)}` };
  }

  const response = await fetch(releaseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}:${salt}`
    },
    body: JSON.stringify({
      merchantTransactionId: orderId,
      releaseAmount,
      commissionAmount,
      childMerchantKey,
    })
  });

  if (!response.ok) {
    throw new Error(`PayU Release API returned status: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.status === 'success' || data.status === 1 || data.status === '1') {
    return { success: true, transactionId: data.transactionId || data.payuId };
  } else {
    throw new Error(data.message || 'Escrow release failed');
  }
}

/**
 * Triggers PayU Refund API with split settlements logic (var8 parameter).
 * Returns the funds from child merchant to the original buyer source.
 */
export async function refundPayUTransaction(params: {
  txnid: string;
  amount: number;
  payuMihpayid?: string;
  childMerchantKey: string;
}) {
  const key = MERCHANT_KEY;
  const salt = MERCHANT_SALT;
  const isSandbox = process.env.PAYU_SANDBOX !== 'false';
  const refundUrl = isSandbox
    ? 'https://test.payu.in/merchant/postinterface.php'
    : 'https://info.payu.in/merchant/postinterface.php';

  if (key === 'mock_key' || salt === 'mock_salt') {
    console.log(`[PayU Escrow Simulator] Mocking refund for Order ${params.txnid}`);
    return { success: true, refundId: `PAYU-REF-MOCK-${Math.floor(100000 + Math.random() * 900000)}` };
  }

  const command = 'cancel_refund_transaction';
  const var1 = params.payuMihpayid || params.txnid;
  const var2 = `REFUND-${params.txnid}-${Date.now()}`;
  const var3 = params.amount.toFixed(2);
  const var8 = JSON.stringify({
    splitInfo: [
      {
        childMerchantKey: params.childMerchantKey,
        amount: (params.amount * 0.9).toFixed(2)
      }
    ]
  });

  // PayU API Command Hash: sha512(key|command|var1|salt)
  const hashString = `${key}|${command}|${var1}|${salt}`;
  const hash = crypto.createHash('sha512').update(hashString).digest('hex');

  const formData = new URLSearchParams({
    key,
    command,
    var1,
    var2,
    var3,
    var8,
    hash
  });

  const response = await fetch(refundUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData.toString()
  });

  if (!response.ok) {
    throw new Error(`PayU Refund API returned status: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.status === 'success' || data.status === 1 || data.status === '1') {
    return { success: true, refundId: data.refundId || data.payuId };
  } else {
    throw new Error(data.message || 'Refund request failed');
  }
}
