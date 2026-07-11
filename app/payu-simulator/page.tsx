import crypto from 'crypto';
import { getPayUEndpoint } from '@/utils/payu';

interface SimulatorPageProps {
  searchParams: Promise<{
    key?: string;
    txnid?: string;
    amount?: string;
    productinfo?: string;
    firstname?: string;
    email?: string;
    phone?: string;
    surl?: string;
    furl?: string;
    hash?: string;
    splitRequest?: string;
    udf1?: string; // profile_id
    udf2?: string; // order_type
    udf3?: string; // quote_id
    udf4?: string; // bolts_spent
    udf5?: string; // cart_items
  }>;
}

export default async function PayUSimulatorPage({ searchParams }: SimulatorPageProps) {
  const params = await searchParams;

  const key = params.key || 'mock_key';
  const txnid = params.txnid || '';
  const amount = params.amount || '0.00';
  const productinfo = params.productinfo || '';
  const firstname = params.firstname || '';
  const email = params.email || '';
  const phone = params.phone || '';
  const surl = params.surl || '';
  const furl = params.furl || '';
  const splitRequest = params.splitRequest || '';

  const udf1 = params.udf1 || '';
  const udf2 = params.udf2 || '';
  const udf3 = params.udf3 || '';
  const udf4 = params.udf4 || '';
  const udf5 = params.udf5 || '';

  const salt = process.env.PAYU_MERCHANT_SALT || 'mock_salt';

  // Pre-calculate hashes on server to protect the salt
  const calculateResponseHash = (status: string) => {
    const hashString = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    return crypto.createHash('sha512').update(hashString).digest('hex');
  };

  const successHash = calculateResponseHash('success');
  const failureHash = calculateResponseHash('failure');

  // Extract split settlements details
  let sellerShare = (Number(amount) * 0.9).toFixed(2);
  let platformShare = (Number(amount) * 0.1).toFixed(2);
  let childMerchantKey = 'N/A';

  try {
    if (splitRequest) {
      const parsed = JSON.parse(splitRequest);
      if (parsed.splitInfo && parsed.splitInfo.length > 0) {
        sellerShare = Number(parsed.splitInfo[0].amount).toFixed(2);
        platformShare = (Number(amount) - Number(sellerShare)).toFixed(2);
        childMerchantKey = parsed.splitInfo[0].childMerchantKey;
      }
    }
  } catch (e) {
    console.error('Error parsing splitRequest in simulator:', e);
  }

  return (
    <div className="min-h-screen bg-zinc-950 font-['Space_Grotesk'] text-zinc-100 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#00D0F5]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl"></div>

        {/* PayU Simulator Branding Header */}
        <div className="flex justify-between items-center pb-4 border-b border-zinc-850">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-white flex items-center">
              Pay<span className="text-[#A3E635]">U</span>
            </span>
            <span className="bg-zinc-800 text-[8px] font-mono font-bold tracking-widest px-2 py-0.5 rounded text-[#00D0F5] border border-[#00D0F5]/25">
              LOCAL SIMULATOR
            </span>
          </div>
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
            SECURE ESCROW CHECKOUT
          </span>
        </div>

        {/* Transaction Summary */}
        <div className="bg-zinc-950/50 border border-zinc-850 p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
              Total Amount (INR)
            </span>
            <span className="text-2xl font-mono font-black text-[#A3E635]">
              ₹{Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-zinc-850 text-xs">
            <div>
              <span className="block text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-wider">Transaction ID</span>
              <span className="font-mono text-white font-bold">{txnid}</span>
            </div>
            <div>
              <span className="block text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-wider">Buyer Name</span>
              <span className="text-white font-semibold">{firstname} ({email})</span>
            </div>
          </div>
        </div>

        {/* Split Settlements Split Engine Protected Panel */}
        <div className="bg-zinc-950/20 border border-dashed border-zinc-800 p-5 rounded-2xl space-y-3">
          <span className="block text-[10px] font-mono font-extrabold text-zinc-500 uppercase tracking-wider">
            Nodal Escrow Split Settlements Details
          </span>

          <div className="divide-y divide-zinc-900 text-xs font-mono space-y-2">
            <div className="flex justify-between py-1">
              <span className="text-zinc-500">Child Merchant (90% Seller Share):</span>
              <span className="text-white font-bold">₹{Number(sellerShare).toFixed(2)}</span>
            </div>
            <div className="text-[10px] text-zinc-600 pb-1">
              Key: <span className="text-zinc-400 font-bold">{childMerchantKey}</span>
            </div>
            <div className="flex justify-between py-1 pt-2">
              <span className="text-zinc-500">Aggregator (10% Commission Share):</span>
              <span className="text-white font-bold">₹{Number(platformShare).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Simulated Actions */}
        <div className="space-y-4 pt-2">
          {/* Form for simulating Success callback */}
          <form action={surl} method="POST">
            {/* Standard return parameters */}
            <input type="hidden" name="key" value={key} />
            <input type="hidden" name="txnid" value={txnid} />
            <input type="hidden" name="amount" value={amount} />
            <input type="hidden" name="productinfo" value={productinfo} />
            <input type="hidden" name="firstname" value={firstname} />
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="phone" value={phone} />
            <input type="hidden" name="status" value="success" />
            <input type="hidden" name="hash" value={successHash} />
            <input type="hidden" name="mihpayid" value={`MIH-${Math.floor(1000000000 + Math.random() * 9000000000)}`} />
            
            {/* Custom parameters (UDFs) */}
            <input type="hidden" name="udf1" value={udf1} />
            <input type="hidden" name="udf2" value={udf2} />
            <input type="hidden" name="udf3" value={udf3} />
            <input type="hidden" name="udf4" value={udf4} />
            <input type="hidden" name="udf5" value={udf5} />

            <button
              type="submit"
              className="w-full bg-[#A3E635] hover:bg-[#bef264] text-zinc-950 py-4 rounded-xl text-sm font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg shadow-lime-500/10 hover:shadow-lime-500/20"
            >
              Simulate Successful Payment (₹{amount})
            </button>
          </form>

          {/* Form for simulating Failure callback */}
          <form action={furl} method="POST">
            <input type="hidden" name="key" value={key} />
            <input type="hidden" name="txnid" value={txnid} />
            <input type="hidden" name="amount" value={amount} />
            <input type="hidden" name="productinfo" value={productinfo} />
            <input type="hidden" name="firstname" value={firstname} />
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="phone" value={phone} />
            <input type="hidden" name="status" value="failure" />
            <input type="hidden" name="hash" value={failureHash} />
            
            <input type="hidden" name="udf1" value={udf1} />
            <input type="hidden" name="udf2" value={udf2} />
            <input type="hidden" name="udf3" value={udf3} />
            <input type="hidden" name="udf4" value={udf4} />
            <input type="hidden" name="udf5" value={udf5} />

            <button
              type="submit"
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-rose-500 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border border-zinc-750 cursor-pointer"
            >
              Simulate Cancelled / Failed Payment
            </button>
          </form>
        </div>

        <p className="text-[10px] text-zinc-600 text-center uppercase tracking-wide font-mono font-semibold">
          This is a sandboxed local environment. No real funds will be transferred.
        </p>
      </div>
    </div>
  );
}
