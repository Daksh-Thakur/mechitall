'use client';
import React, { useState } from 'react';
import { Cpu } from 'lucide-react';
import { submitSellerKYC } from '@/app/actions/rewards';
import { jsPDF } from 'jspdf';

interface SellerKYCModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  fetchProfile: () => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

const generateAgreementPDF = (sellerId: string, vendorName: string, legalName: string, dateStr: string) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(20);
  doc.setTextColor(11, 21, 40);
  doc.text("MechItAll Vendor Agreement", 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text("Marketplace Terms for Sellers on the MechItAll Platform", 105, 27, { align: 'center' });
  
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 32, 190, 32);
  
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  
  let y = 40;
  const margin = 20;
  const width = 170;
  
  const introText = `This Vendor Agreement ("Agreement") is entered into between MechItAll ("Platform," "we," "us") and any individual or entity that registers as a Seller ("Seller," "you") to list off-the-shelf components or offer custom manufacturing services through the Platform. By completing Seller registration, you agree to be bound by this Agreement.`;
  const splitIntro = doc.splitTextToSize(introText, width);
  doc.text(splitIntro, margin, y);
  y += splitIntro.length * 4.5 + 4;
  
  doc.setFontSize(10);
  doc.setTextColor(11, 21, 40);
  doc.setFont('helvetica', 'bold');
  doc.text(`Seller ID (UUID): ${sellerId}`, margin, y);
  y += 5;
  doc.text(`Seller Name / Registered Business Name: ${vendorName}`, margin, y);
  y += 5;
  doc.text(`Legal Name (as in Bank Account): ${legalName}`, margin, y);
  y += 5;
  doc.text(`Signing Date: ${dateStr}`, margin, y);
  y += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);

  const sections = [
    {
      title: "1. Definitions",
      text: `"Buyer" means any registered user who purchases inventory items or commissions custom fabrication services through the Platform.\n"Seller" or "Vendor" means any individual or entity registered to list inventory or offer custom manufacturing services through the Platform.\n"Platform" means the MechItAll website, mobile application, and associated services.\n"Nodal Account" means the RBI-compliant escrow account maintained with PayU through which all transaction funds are routed.\n"RFQ" means a Request for Quote submitted by a Buyer for custom manufacturing services.\n"Dispatch" means the point at which an order is handed to a shipping carrier and a tracking number is generated.\n"Business Day" means a day other than a Saturday, Sunday, or public holiday in India.`
    },
    {
      title: "2. Account Setup and KYC Verification",
      text: `To ensure a secure environment for our maker community, all Sellers must undergo identity verification before listing products or services.\nMandatory Verification: Upgrading to a Seller account requires submission of a valid PAN. Sellers must be at least 18 years of age and legally competent to contract, or, if registering on behalf of an entity, must have authority to bind that entity.\nBusiness Verification: GSTIN validation is optional but, once completed, entitles the Seller to display an exclusive "Verified Business" badge on their storefront.\nOngoing Accuracy: Sellers must promptly update their KYC information (including PAN, GSTIN, bank/payout details, and contact information) if it changes. The Platform may suspend a Seller account where submitted information is found to be inaccurate, expired, or fraudulent.\nAccount Liability: You represent that all information provided during onboarding is accurate and current. You are solely responsible for maintaining the confidentiality of your account credentials and for all activity conducted under your account, whether or not authorized by you.`
    },
    {
      title: "3. Marketplace Conduct and Anti-Circumvention",
      text: `Trust and security are foundational to MechItAll. We enforce a strict "No Leakage" policy.\nPlatform Exclusivity: All transactions, including negotiations, payments, and buyer-seller communications, must occur on the MechItAll platform.\nProhibited Conduct: Sellers may not solicit or direct Buyers to negotiate, pay, or communicate off-platform in order to avoid commission fees. This includes, without limitation, sharing personal contact details for the purpose of completing a transaction outside the Platform, or encouraging a Buyer to cancel an in-platform order so that it can be re-placed off-platform.\nPenalties: Violation of this policy may result in warning, listing removal, temporary suspension, or a permanent ban, at the Platform's discretion based on the severity and history of the violation. The Platform may also recover any commission it was deprived of as a result of the violation.\nNo Liability for Off-Platform Transactions: Sellers are strongly discouraged from accepting any payment or completing any transaction with a Buyer outside the Platform. Because such transactions bypass the escrow, dispatch-evidence, and dispute-mediation mechanisms described in this Agreement, the Platform has no visibility into and cannot verify them. Accordingly, the Platform bears no liability or responsibility for any dispute, non-payment, non-delivery, product defect, or other loss arising from a payment or transaction conducted outside the Platform, and will not mediate or arbitrate such disputes. Sellers who transact off-platform do so entirely at their own risk and remain subject to the penalties described above.`
    },
    {
      title: "4. Commissions and Pricing",
      text: `Commission Structure: Marketplace commission is calculated on the Total Checkout Price (Item Price + Shipping Price), at the rate published in the Seller Dashboard fee schedule for the relevant product category. The Platform will provide at least 15 days' notice before any change to commission rates takes effect for new orders.\nFee Avoidance: Sellers may not artificially inflate shipping costs, or artificially deflate item prices while inflating shipping, in order to reduce the commission payable.\nCustom Quotes (RFQ): A custom fabrication quote accepted and paid for by a Buyer is a binding contract. Requests for design changes after payment must be submitted as new, separate quote requests and are not automatically incorporated into the original order. Every RFQ quote must state an estimated production and dispatch timeline. If a Buyer requests cancellation before production has commenced, the Seller may deduct a reasonable processing fee (as disclosed in the quote) from any refund; once production has commenced, cancellation is subject to Seller approval or admin mediation under Section 8.`
    },
    {
      title: "5. Taxes",
      text: `Sellers are solely responsible for determining, collecting, and remitting all applicable taxes (including GST) on their sales made through the Platform, and for obtaining and maintaining any registrations required to do so. Where the Platform is required by law to collect tax at source (TCS) or comply with other e-commerce operator obligations, payouts to Sellers will be net of such statutory deductions, and the Platform will issue the relevant statements for the Seller's tax filings.`
    },
    {
      title: "6. Shipping, Logistics, and Evidence",
      text: `MechItAll operates on a Seller-fulfilled model: Sellers control their own logistics, subject to the evidentiary rules below.\nFulfillment: Sellers are responsible for their own shipping arrangements.\nDispatch Evidence: Sellers must upload proof of dispatch (tracking number and a photo of the packaged item) to the Platform within 24 hours of handing the order to the carrier.\nNon-Delivery Claims: Timely-uploaded proof of dispatch is the Seller's primary evidence against non-delivery claims. Where a Seller fails to upload proof of dispatch within the required window, non-delivery disputes will ordinarily be resolved in the Buyer's favor. Where proof of dispatch exists but the Buyer disputes receipt, the Platform will review the carrier's delivery records as part of admin mediation under Section 8.\nPartial Shipments: If an order consists of multiple items shipped separately, the Buyer must flag the order as "Partially Dispatched." The 7-day escrow inspection timer under Section 7 then runs independently for each item, starting from that specific item's delivery date as recorded by the carrier.\nPackaging Standards: Sellers shipping fragile or precision-tolerance components are responsible for packaging adequate to prevent transit damage; damage attributable to inadequate packaging is treated as a Seller-side defect for the purposes of Section 8.`
    },
    {
      title: "7. Escrow Payments and Payouts",
      text: `To guarantee security for high-value engineering parts, all funds are routed through RBI-compliant Nodal Accounts.\nEscrow Security: All payments (for both inventory and custom services) are processed via PayU's nodal escrow accounts. Funds are held securely until the order is delivered and verified.\nThe 7-Day Window: Once carrier tracking marks an order (or, for partial shipments, an individual item) as "Delivered," a 7-day inspection timer begins for that order or item.\nFund Release: If the Buyer uploads an unboxing/verification photo confirming the product is satisfactory, PayU releases the corresponding escrow funds to the Seller. If 7 days pass without Buyer confirmation or a dispute, the transaction is sealed and funds are automatically released to the Seller.\nPayout Terms: Released funds are paid out to the Seller's registered bank account net of Platform commission and any statutory deductions under Section 5, on the Platform's standard payout cycle as published in the Seller Dashboard. Funds subject to an open dispute under Section 8 remain frozen and are excluded from the payout cycle until resolved.`
    },
    {
      title: "8. Dispute Resolution and Returns",
      text: `Custom manufacturing frequently involves tight tolerances, making structured dispute resolution necessary.\nThe Freeze Protocol: If a Buyer clicks "Report an Issue" within the 7-day inspection window, the corresponding PayU payout is immediately frozen pending resolution.\nMediation: Buyers and Sellers have a 72-hour window from the report to resolve the issue directly through the built-in messaging portal.\nAdmin Verdict: If mediation fails or the 72-hour window lapses without resolution, the Platform requires both parties to submit supporting evidence within a further 72 hours. Platform admins will review the submitted evidence (including dispatch proof, carrier records, and messaging logs) and issue a binding decision to refund the Buyer or release funds to the Seller. If a party fails to submit evidence within the stipulated window, the admin may decide based on the evidence available, which may result in a decision against the non-responsive party.\nReturn Liability: In the event of a dispute resolved in the Buyer's favor, return shipping costs are the responsibility of the Seller for defective or misrepresented items, or as otherwise determined through admin mediation. For custom or low-value parts, admins may authorize a "Proof of Destruction/Disposal" by the Buyer in lieu of return shipping.`
    },
    {
      title: "9. Intellectual Property (IP) Protection",
      text: `Buyer IP Rights: Buyers retain all rights, title, and interest in their uploaded CAD/STL files and other proprietary design materials submitted for custom quotes.\nSeller Restrictions: Sellers are strictly prohibited from reproducing, mass-producing, sublicensing, or otherwise using Buyer-provided files for any purpose beyond fulfilling the specific RFQ for which they were provided, and must not disclose those files to third parties.\nRetention and Confidentiality: Sellers must treat Buyer-provided files as confidential and should delete them once the order is fulfilled and the dispute window has closed, unless the Buyer agrees in writing to a longer retention period.\nPlatform Role: The Platform is not a party to, and does not adjudicate, IP ownership disputes between Buyers and Sellers, but may remove a listing or suspend an account upon receiving a credible infringement notice.`
    },
    {
      title: "10. Warranties and Disclaimers",
      text: `The Platform is a marketplace facilitator connecting Buyers and Sellers; it is not the manufacturer or seller of record for any listed item or custom service, and has no direct involvement in the design, manufacturing, or provision of any product or service listed by a Seller. Sellers are solely responsible for the accuracy of their listings and quotes, and for ensuring that products and services comply with applicable safety, quality, and regulatory standards. Except as expressly stated in this Agreement, the Platform makes no warranties regarding the quality, safety, or fitness for purpose of any item or service offered by Sellers.\nSole Responsibility of the Seller: As between the Platform and the Seller, the Seller bears sole and direct responsibility for any complaint, claim, liability, or legal proceeding relating to the quality, safety, performance, description, or legality of a listed product or custom manufacturing service, including any injury, damage, or loss arising from its use. The Platform's role is limited to providing the marketplace, escrow, and dispute-mediation infrastructure described in this Agreement, and it assumes no liability for the underlying product or service itself. This allocation of responsibility applies in addition to, and does not limit, the Seller's indemnification obligations under Section 12.`
    },
    {
      title: "11. Limitation of Liability",
      text: `Platform Provided "As Is": The Platform, including its escrow, dispatch-tracking, and dispute-mediation tools, is provided on an "as is" and "as available" basis, without warranties of any kind, whether express, implied, or statutory, including any implied warranty of merchantability, fitness for a particular purpose, or non-infringement, except as expressly stated in this Agreement.\nExclusion of Consequential Loss: To the maximum extent permitted by law, neither party will be liable to the other for any indirect, incidental, special, or consequential damages, or for any loss of profits, revenue, or goodwill, arising out of or in connection with this Agreement, even if that party has been advised of the possibility of such damages. This exclusion does not apply to a Seller's indemnification obligations under Section 12, or to either party's breach of confidentiality obligations under Section 9.\nOverall Cap: To the maximum extent permitted by law, the Platform's aggregate liability to a Seller arising out of or in connection with this Agreement, however arising, will not exceed the greater of (a) the total commission collected by the Platform from that Seller in the twelve months immediately preceding the event giving rise to the claim, or (b) INR 25,000. This cap does not apply to the Platform's payment obligations to release funds properly due to a Seller under Section 7, or to losses caused by the Platform's fraud or gross negligence.\nNo Liability for Third Parties or Underlying Transactions: The Platform is not liable for: (a) the acts, omissions, or delays of PayU or any other third-party payment, logistics, or verification provider, beyond the Platform's own obligation to pursue such providers in good faith on the Seller's behalf; (b) the quality, safety, legality, or delivery of any product or service transacted between a Buyer and a Seller, as set out in Section 10; (c) any transaction or dispute conducted outside the Platform, as set out in Section 3; or (d) any admin decision issued in good faith under the dispute-mediation process in Section 8.\nBasket Clause: The exclusions and limits in this Section 11 apply to every claim of any kind arising out of or in connection with this Agreement or the Platform, regardless of the legal theory on which it is based, and survive termination of this Agreement. They apply in addition to, and are not limited by, any other disclaimer or limitation elsewhere in this Agreement.`
    },
    {
      title: "12. Indemnification",
      text: `The Seller agrees to indemnify and hold the Platform harmless from any claims, losses, liabilities, or legal proceedings (including those brought by a Buyer, a regulator, or any third party) arising from: (a) inaccurate listings or quotes; (b) products or services that infringe third-party IP rights or violate applicable law; (c) defective, unsafe, or non-conforming products or services, including any resulting injury, damage, or loss; or (d) the Seller's failure to meet its tax obligations under Section 5. This indemnity reflects the allocation of responsibility set out in Section 10 and survives termination of this Agreement.`
    },
    {
      title: "13. Term, Suspension, and Termination",
      text: `This Agreement takes effect upon Seller registration and continues until terminated. A Seller may deactivate its account at any time, subject to completing all pending orders and disputes. The Platform may suspend or terminate a Seller account for breach of this Agreement, including the conduct described in Sections 2 and 3. Sections 5 (Taxes), 9 (IP Protection), 11 (Limitation of Liability), 12 (Indemnification), and 16 (Governing Law) survive termination.`
    },
    {
      title: "14. Data Privacy",
      text: `The Platform and Sellers will handle Buyer personal data obtained through the Platform (such as shipping addresses and contact details) solely for the purpose of fulfilling orders, and will not use it for unrelated marketing without the Buyer's consent. Both parties agree to comply with applicable Indian data protection law, including the Digital Personal Data Protection Act, 2023, in handling such data.`
    },
    {
      title: "15. Force Majeure",
      text: `Neither party is liable for delay or failure to perform its obligations (other than payment obligations) where such delay or failure results from causes beyond its reasonable control, including natural disasters, strikes, war, government action, or failure of third-party logistics or payment infrastructure.`
    },
    {
      title: "16. Governing Law and Dispute Resolution",
      text: `This Agreement is governed by the laws of India. Any dispute between the Platform and a Seller arising out of this Agreement that cannot be resolved through the mechanisms in Section 8 will be referred to arbitration under the Arbitration and Conciliation Act, 1996, seated in Shimla, with proceedings conducted in English, subject to the exclusive jurisdiction of the courts at Shimla for any interim relief.`
    },
    {
      title: "17. Amendments and Notices",
      text: `The Platform may amend this Agreement from time to time by posting the updated terms and providing at least 15 days' notice via the Seller Dashboard and registered email before the changes take effect. Continued use of the Platform after that date constitutes acceptance of the amended terms. Notices under this Agreement will be sent to the email address or in-app contact details registered with the Seller's account.`
    },
    {
      title: "18. Miscellaneous",
      text: `Entire Agreement: This Agreement, together with the fee schedule and any policies referenced in the Seller Dashboard, constitutes the entire agreement between the parties and supersedes prior understandings on the subject matter.\nSeverability: If any provision of this Agreement is held unenforceable, the remaining provisions continue in full force.\nNo Waiver: Failure to enforce any provision is not a waiver of the right to do so later.\nAssignment: A Seller may not assign this Agreement without the Platform's prior written consent; the Platform may assign this Agreement in connection with a merger, acquisition, or sale of assets.\nRelationship of Parties: Nothing in this Agreement creates a partnership, joint venture, agency, or employment relationship between the Platform and any Seller.`
    }
  ];

  for (const sec of sections) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.text(sec.title, margin, y);
    y += 5;
    
    doc.setFont('helvetica', 'normal');
    const splitSecText = doc.splitTextToSize(sec.text, width);
    doc.text(splitSecText, margin, y);
    y += splitSecText.length * 4.2 + 6;
  }

  if (y > 250) {
    doc.addPage();
    y = 25;
  } else {
    y += 5;
  }

  doc.setDrawColor(220, 220, 220);
  doc.line(20, y, 190, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text("For MechItAll (Platform):", margin, y);
  doc.text("For Seller:", 120, y);
  y += 15;

  doc.setFont('helvetica', 'normal');
  doc.text("Authorized Signatory", margin, y);
  doc.text(legalName || vendorName, 120, y);
  y += 5;
  doc.text("MechItAll Platform Team", margin, y);
  doc.text("Registrant / Seller Representative", 120, y);

  return doc.output('datauristring');
};

export default function SellerKYCModal({
  isOpen,
  onClose,
  profileId,
  fetchProfile,
  showToast,
}: SellerKYCModalProps) {
  const [togglingSeller, setTogglingSeller] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [companyNameVal, setCompanyNameVal] = useState('');
  const [legalNameVal, setLegalNameVal] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="bg-zinc-800/95 backdrop-blur-lg border border-slate-200/50 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative z-10 animate-fade-in-down max-h-[90vh] overflow-y-auto no-scrollbar space-y-6">
        <div className="text-center space-y-2">
          <img 
            src="/logo.png" 
            alt="MechItAll Logo" 
            className="w-12 h-12 object-contain rounded-full mx-auto shadow-md"
          />
          <h3 className="text-lg font-black text-white tracking-tight uppercase">Seller Registration &amp; KYC</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed font-semibold">
            Please complete your shop verification details to register as a custom fabrication seller on MechItAll.
          </p>
        </div>

        <form onSubmit={async (e) => {
          e.preventDefault();
          const target = e.target as any;
          const companyName = target.companyName.value.trim();
          const taxId = target.taxId.value.trim();
          const machineCount = parseInt(target.machineCount.value) || 0;
          const businessAddress = target.businessAddress.value.trim();
          const primaryCapability = target.primaryCapability.value;
          const legalName = target.legalName.value.trim();
          const bankAccountNumber = target.bankAccountNumber.value.trim();
          const ifscCode = target.ifscCode.value.trim();
          const pan = target.pan.value.trim();
          const gstin = target.gstin.value.trim();

          if (!companyName || !taxId || !businessAddress || !primaryCapability || !legalName || !bankAccountNumber || !ifscCode || !pan) {
            showToast('Please fill in all required fields.', 'error');
            return;
          }

          if (!agreed) {
            showToast('Please accept the Vendor Agreement to proceed.', 'error');
            return;
          }

          setTogglingSeller(true);
          try {
            const dateStr = new Date().toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
            const agreementPdf = generateAgreementPDF(profileId, companyName, legalName, dateStr);

            await submitSellerKYC(profileId, {
              companyName,
              taxId,
              machineCount,
              businessAddress,
              primaryCapability,
              legalName,
              bankAccountNumber,
              ifscCode,
              pan,
              gstin,
              vendorAgreementPdf: agreementPdf
            });
            showToast('KYC Verified & Seller Mode Activated!', 'success');
            onClose();
            await fetchProfile();
          } catch (err: any) {
            showToast(err.message || 'Failed to submit KYC.', 'error');
          } finally {
            setTogglingSeller(false);
          }
        }} className="space-y-4 text-left">

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase">Legal Name (as in Bank Account) *</label>
            <input
              type="text"
              name="legalName"
              required
              value={legalNameVal}
              onChange={(e) => setLegalNameVal(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#007084]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase">Bank Account Number *</label>
              <input
                type="text"
                name="bankAccountNumber"
                required
                placeholder="e.g. 918273645019"
                className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#007084]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase">IFSC Code *</label>
              <input
                type="text"
                name="ifscCode"
                required
                placeholder="e.g. IFSC Code"
                className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#007084]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase">PAN Number *</label>
              <input
                type="text"
                name="pan"
                required
                placeholder="e.g. PAN Number"
                className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#007084]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase">GSTIN (Optional)</label>
              <input
                type="text"
                name="gstin"
                placeholder="e.g. GSTIN"
                className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#007084]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase">Company / Shop Name *</label>
            <input
              type="text"
              name="companyName"
              required
              value={companyNameVal}
              onChange={(e) => setCompanyNameVal(e.target.value)}
              placeholder="e.g. Precision CNC Lab Ltd."
              className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#007084]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase">Tax Identification ID *</label>
            <input
              type="text"
              name="taxId"
              required
              placeholder="e.g. Tax ID"
              className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#007084]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase">Machine Count</label>
              <input
                type="number"
                name="machineCount"
                min={0}
                defaultValue={1}
                className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#007084]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase">Primary Capability *</label>
              <select
                name="primaryCapability"
                required
                className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#007084]"
              >
                <option value="CNC Machining">CNC Machining</option>
                <option value="3D Printing">3D Printing</option>
                <option value="Sheet Metal Fabrication">Sheet Metal Fabrication</option>
                <option value="Laser Cutting">Laser Cutting</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase">Business Address *</label>
            <textarea
              name="businessAddress"
              required
              rows={2}
              placeholder="Street, City, Zip Code..."
              className="w-full text-xs font-bold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-[#007084] resize-none"
            ></textarea>
          </div>

          {/* Vendor Agreement Section */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase">Vendor Agreement *</label>
            <div className="h-40 overflow-y-auto p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/40 text-[10px] text-zinc-400 font-sans space-y-3 leading-relaxed no-scrollbar select-none">
              <h4 className="font-extrabold text-white text-[11px] mb-1">MechItAll Vendor Agreement</h4>
              <p className="font-semibold text-zinc-300">Marketplace Terms for Sellers on the MechItAll Platform</p>
              <p>This Vendor Agreement ("Agreement") is entered into between MechItAll ("Platform," "we," "us") and any individual or entity that registers as a Seller ("Seller," "you") to list off-the-shelf components or offer custom manufacturing services through the Platform. By completing Seller registration, you agree to be bound by this Agreement.</p>
              <p className="font-semibold text-white">Seller Name / Registered Business Name: [Filled upon agreement]</p>
              <p><strong>1. Definitions</strong><br/>
              "Buyer" means any registered user who purchases inventory items or commissions custom fabrication services through the Platform.<br/>
              "Seller" or "Vendor" means any individual or entity registered to list inventory or offer custom manufacturing services through the Platform.<br/>
              "Platform" means the MechItAll website, mobile application, and associated services.<br/>
              "Nodal Account" means the RBI-compliant escrow account maintained with PayU through which all transaction funds are routed.<br/>
              "RFQ" means a Request for Quote submitted by a Buyer for custom manufacturing services.<br/>
              "Dispatch" means the point at which an order is handed to a shipping carrier and a tracking number is generated.<br/>
              "Business Day" means a day other than a Saturday, Sunday, or public holiday in India.</p>
              <p><strong>2. Account Setup and KYC Verification</strong><br/>
              To ensure a secure environment for our maker community, all Sellers must undergo identity verification before listing products or services.<br/>
              Mandatory Verification: Upgrading to a Seller account requires submission of a valid PAN. Sellers must be at least 18 years of age and legally competent to contract, or, if registering on behalf of an entity, must have authority to bind that entity.<br/>
              Business Verification: GSTIN validation is optional but, once completed, entitles the Seller to display an exclusive "Verified Business" badge on their storefront.<br/>
              Ongoing Accuracy: Sellers must promptly update their KYC information (including PAN, GSTIN, bank/payout details, and contact information) if it changes. The Platform may suspend a Seller account where submitted information is found to be inaccurate, expired, or fraudulent.<br/>
              Account Liability: You represent that all information provided during onboarding is accurate and current. You are solely responsible for maintaining the confidentiality of your account credentials and for all activity conducted under your account, whether or not authorized by you.</p>
              <p><strong>3. Marketplace Conduct and Anti-Circumvention</strong><br/>
              Trust and security are foundational to MechItAll. We enforce a strict "No Leakage" policy.<br/>
              Platform Exclusivity: All transactions, including negotiations, payments, and buyer-seller communications, must occur on the MechItAll platform.<br/>
              Prohibited Conduct: Sellers may not solicit or direct Buyers to negotiate, pay, or communicate off-platform in order to avoid commission fees. This includes, without limitation, sharing personal contact details for the purpose of completing a transaction outside the Platform, or encouraging a Buyer to cancel an in-platform order so that it can be re-placed off-platform.<br/>
              Penalties: Violation of this policy may result in warning, listing removal, temporary suspension, or a permanent ban, at the Platform's discretion based on the severity and history of the violation. The Platform may also recover any commission it was deprived of as a result of the violation.<br/>
              No Liability for Off-Platform Transactions: Sellers are strongly discouraged from accepting any payment or completing any transaction with a Buyer outside the Platform. Because such transactions bypass the escrow, dispatch-evidence, and dispute-mediation mechanisms described in this Agreement, the Platform has no visibility into and cannot verify them. Accordingly, the Platform bears no liability or responsibility for any dispute, non-payment, non-delivery, product defect, or other loss arising from a payment or transaction conducted outside the Platform, and will not mediate or arbitrate such disputes. Sellers who transact off-platform do so entirely at their own risk and remain subject to the penalties described above.</p>
              <p><strong>4. Commissions and Pricing</strong><br/>
              Commission Structure: Marketplace commission is calculated on the Total Checkout Price (Item Price + Shipping Price), at the rate published in the Seller Dashboard fee schedule for the relevant product category. The Platform will provide at least 15 days' notice before any change to commission rates takes effect for new orders.<br/>
              Fee Avoidance: Sellers may not artificially inflate shipping costs, or artificially deflate item prices while inflating shipping, in order to reduce the commission payable.<br/>
              Custom Quotes (RFQ): A custom fabrication quote accepted and paid for by a Buyer is a binding contract. Requests for design changes after payment must be submitted as new, separate quote requests and are not automatically incorporated into the original order. Every RFQ quote must state an estimated production and dispatch timeline. If a Buyer requests cancellation before production has commenced, the Seller may deduct a reasonable processing fee (as disclosed in the quote) from any refund; once production has commenced, cancellation is subject to Seller approval or admin mediation under Section 8.</p>
              <p><strong>5. Taxes</strong><br/>
              Sellers are solely responsible for determining, collecting, and remitting all applicable taxes (including GST) on their sales made through the Platform, and for obtaining and maintaining any registrations required to do so. Where the Platform is required by law to collect tax at source (TCS) or comply with other e-commerce operator obligations, payouts to Sellers will be net of such statutory deductions, and the Platform will issue the relevant statements for the Seller's tax filings.</p>
              <p><strong>6. Shipping, Logistics, and Evidence</strong><br/>
              MechItAll operates on a Seller-fulfilled model: Sellers control their own logistics, subject to the evidentiary rules below.<br/>
              Fulfillment: Sellers are responsible for their own shipping arrangements.<br/>
              Dispatch Evidence: Sellers must upload proof of dispatch (tracking number and a photo of the packaged item) to the Platform within 24 hours of handing the order to the carrier.<br/>
              Non-Delivery Claims: Timely-uploaded proof of dispatch is the Seller's primary evidence against non-delivery claims. Where a Seller fails to upload proof of dispatch within the required window, non-delivery disputes will ordinarily be resolved in the Buyer's favor. Where proof of dispatch exists but the Buyer disputes receipt, the Platform will review the carrier's delivery records as part of admin mediation under Section 8.<br/>
              Partial Shipments: If an order consists of multiple items shipped separately, the Buyer must flag the order as "Partially Dispatched." The 7-day escrow inspection timer under Section 7 then runs independently for each item, starting from that specific item's delivery date as recorded by the carrier.<br/>
              Packaging Standards: Sellers shipping fragile or precision-tolerance components are responsible for packaging adequate to prevent transit damage; damage attributable to inadequate packaging is treated as a Seller-side defect for the purposes of Section 8.</p>
              <p><strong>7. Escrow Payments and Payouts</strong><br/>
              To guarantee security for high-value engineering parts, all funds are routed through RBI-compliant Nodal Accounts.<br/>
              Escrow Security: All payments (for both inventory and custom services) are processed via PayU's nodal escrow accounts. Funds are held securely until the order is delivered and verified.<br/>
              The 7-Day Window: Once carrier tracking marks an order (or, for partial shipments, an individual item) as "Delivered," a 7-day inspection timer begins for that order or item.<br/>
              Fund Release: If the Buyer uploads an unboxing/verification photo confirming the product is satisfactory, PayU releases the corresponding escrow funds to the Seller. If 7 days pass without Buyer confirmation or a dispute, the transaction is sealed and funds are automatically released to the Seller.<br/>
              Payout Terms: Released funds are paid out to the Seller's registered bank account net of Platform commission and any statutory deductions under Section 5, on the Platform's standard payout cycle as published in the Seller Dashboard. Funds subject to an open dispute under Section 8 remain frozen and are excluded from the payout cycle until resolved.</p>
              <p><strong>8. Dispute Resolution and Returns</strong><br/>
              Custom manufacturing frequently involves tight tolerances, making structured dispute resolution necessary.<br/>
              The Freeze Protocol: If a Buyer clicks "Report an Issue" within the 7-day inspection window, the corresponding PayU payout is immediately frozen pending resolution.<br/>
              Mediation: Buyers and Sellers have a 72-hour window from the report to resolve the issue directly through the built-in messaging portal.<br/>
              Admin Verdict: If mediation fails or the 72-hour window lapses without resolution, the Platform requires both parties to submit supporting evidence within a further 72 hours. Platform admins will review the submitted evidence (including dispatch proof, carrier records, and messaging logs) and issue a binding decision to refund the Buyer or release funds to the Seller. If a party fails to submit evidence within the stipulated window, the admin may decide based on the evidence available, which may result in a decision against the non-responsive party.<br/>
              Return Liability: In the event of a dispute resolved in the Buyer's favor, return shipping costs are the responsibility of the Seller for defective or misrepresented items, or as otherwise determined through admin mediation. For custom or low-value parts, admins may authorize a "Proof of Destruction/Disposal" by the Buyer in lieu of return shipping.</p>
              <p><strong>9. Intellectual Property (IP) Protection</strong><br/>
              Buyer IP Rights: Buyers retain all rights, title, and interest in their uploaded CAD/STL files and other proprietary design materials submitted for custom quotes.<br/>
              Seller Restrictions: Sellers are strictly prohibited from reproducing, mass-producing, sublicensing, or otherwise using Buyer-provided files for any purpose beyond fulfilling the specific RFQ for which they were provided, and must not disclose those files to third parties.<br/>
              Retention and Confidentiality: Sellers must treat Buyer-provided files as confidential and should delete them once the order is fulfilled and the dispute window has closed, unless the Buyer agrees in writing to a longer retention period.<br/>
              Platform Role: The Platform is not a party to, and does not adjudicate, IP ownership disputes between Buyers and Sellers, but may remove a listing or suspend an account upon receiving a credible infringement notice.</p>
              <p><strong>10. Warranties and Disclaimers</strong><br/>
              The Platform is a marketplace facilitator connecting Buyers and Sellers; it is not the manufacturer or seller of record for any listed item or custom service, and has no direct involvement in the design, manufacturing, or provision of any product or service listed by a Seller. Sellers are solely responsible for the accuracy of their listings and quotes, and for ensuring that products and services comply with applicable safety, quality, and regulatory standards. Except as expressly stated in this Agreement, the Platform makes no warranties regarding the quality, safety, or fitness for purpose of any item or service offered by Sellers.<br/>
              Sole Responsibility of the Seller: As between the Platform and the Seller, the Seller bears sole and direct responsibility for any complaint, claim, liability, or legal proceeding relating to the quality, safety, performance, description, or legality of a listed product or custom manufacturing service, including any injury, damage, or loss arising from its use. The Platform's role is limited to providing the marketplace, escrow, and dispute-mediation infrastructure described in this Agreement, and it assumes no liability for the underlying product or service itself. This allocation of responsibility applies in addition to, and does not limit, the Seller's indemnification obligations under Section 12.</p>
              <p><strong>11. Limitation of Liability</strong><br/>
              Platform Provided "As Is": The Platform, including its escrow, dispatch-tracking, and dispute-mediation tools, is provided on an "as is" and "as available" basis, without warranties of any kind, whether express, implied, or statutory, including any implied warranty of merchantability, fitness for a particular purpose, or non-infringement, except as expressly stated in this Agreement.<br/>
              Exclusion of Consequential Loss: To the maximum extent permitted by law, neither party will be liable to the other for any indirect, incidental, special, or consequential damages, or for any loss of profits, revenue, or goodwill, arising out of or in connection with this Agreement, even if that party has been advised of the possibility of such damages. This exclusion does not apply to a Seller's indemnification obligations under Section 12, or to either party's breach of confidentiality obligations under Section 9.<br/>
              Overall Cap: To the maximum extent permitted by law, the Platform's aggregate liability to a Seller arising out of or in connection with this Agreement, however arising, will not exceed the greater of (a) the total commission collected by the Platform from that Seller in the twelve months immediately preceding the event giving rise to the claim, or (b) INR 25,000. This cap does not apply to the Platform's payment obligations to release funds properly due to a Seller under Section 7, or to losses caused by the Platform's fraud or gross negligence.<br/>
              No Liability for Third Parties or Underlying Transactions: The Platform is not liable for: (a) the acts, omissions, or delays of PayU or any other third-party payment, logistics, or verification provider, beyond the Platform's own obligation to pursue such providers in good faith on the Seller's behalf; (b) the quality, safety, legality, or delivery of any product or service transacted between a Buyer and a Seller, as set out in Section 10; (c) any transaction or dispute conducted outside the Platform, as set out in Section 3; or (d) any admin decision issued in good faith under the dispute-mediation process in Section 8.<br/>
              Basket Clause: The exclusions and limits in this Section 11 apply to every claim of any kind arising out of or in connection with this Agreement or the Platform, regardless of the legal theory on which it is based, and survive termination of this Agreement. They apply in addition to, and are not limited by, any other disclaimer or limitation elsewhere in this Agreement.</p>
              <p><strong>12. Indemnification</strong><br/>
              The Seller agrees to indemnify and hold the Platform harmless from any claims, losses, liabilities, or legal proceedings (including those brought by a Buyer, a regulator, or any third party) arising from: (a) inaccurate listings or quotes; (b) products or services that infringe third-party IP rights or violate applicable law; (c) defective, unsafe, or non-conforming products or services, including any resulting injury, damage, or loss; or (d) the Seller's failure to meet its tax obligations under Section 5. This indemnity reflects the allocation of responsibility set out in Section 10 and survives termination of this Agreement.</p>
              <p><strong>13. Term, Suspension, and Termination</strong><br/>
              This Agreement takes effect upon Seller registration and continues until terminated. A Seller may deactivate its account at any time, subject to completing all pending orders and disputes. The Platform may suspend or terminate a Seller account for breach of this Agreement, including the conduct described in Sections 2 and 3. Sections 5 (Taxes), 9 (IP Protection), 11 (Limitation of Liability), 12 (Indemnification), and 16 (Governing Law) survive termination.</p>
              <p><strong>14. Data Privacy</strong><br/>
              The Platform and Sellers will handle Buyer personal data obtained through the Platform (such as shipping addresses and contact details) solely for the purpose of fulfilling orders, and will not use it for unrelated marketing without the Buyer's consent. Both parties agree to comply with applicable Indian data protection law, including the Digital Personal Data Protection Act, 2023, in handling such data.</p>
              <p><strong>15. Force Majeure</strong><br/>
              Neither party is liable for delay or failure to perform its obligations (other than payment obligations) where such delay or failure results from causes beyond its reasonable control, including natural disasters, strikes, war, government action, or failure of third-party logistics or payment infrastructure.</p>
              <p><strong>16. Governing Law and Dispute Resolution</strong><br/>
              This Agreement is governed by the laws of India. Any dispute between the Platform and a Seller arising out of this Agreement that cannot be resolved through the mechanisms in Section 8 will be referred to arbitration under the Arbitration and Conciliation Act, 1996, seated in Shimla, with proceedings conducted in English, subject to the exclusive jurisdiction of the courts at Shimla for any interim relief.</p>
              <p><strong>17. Amendments and Notices</strong><br/>
              The Platform may amend this Agreement from time to time by posting the updated terms and providing at least 15 days' notice via the Seller Dashboard and registered email before the changes take effect. Continued use of the Platform after that date constitutes acceptance of the amended terms. Notices under this Agreement will be sent to the email address or in-app contact details registered with the Seller's account.</p>
              <p><strong>18. Miscellaneous</strong><br/>
              Entire Agreement: This Agreement, together with the fee schedule and any policies referenced in the Seller Dashboard, constitutes the entire agreement between the parties and supersedes prior understandings on the subject matter.<br/>
              Severability: If any provision of this Agreement is held unenforceable, the remaining provisions continue in full force.<br/>
              No Waiver: Failure to enforce any provision is not a waiver of the right to do so later.<br/>
              Assignment: A Seller may not assign this Agreement without the Platform's prior written consent; the Platform may assign this Agreement in connection with a merger, acquisition, or sale of assets.<br/>
              Relationship of Parties: Nothing in this Agreement creates a partnership, joint venture, agency, or employment relationship between the Platform and any Seller.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2 pt-1 pb-2">
            <input
              type="checkbox"
              id="agreeAgreement"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              required
              className="mt-0.5 w-4 h-4 rounded text-[#007084] focus:ring-[#007084] bg-zinc-900 border-zinc-700 cursor-pointer"
            />
            <label htmlFor="agreeAgreement" className="text-[10px] text-zinc-300 font-bold select-none cursor-pointer leading-tight">
              I have read and agree to the MechItAll Vendor Agreement. I understand that my business name (<span className="text-[#00D0F5] font-extrabold">{companyNameVal || 'Company Name'}</span>) and legal name (<span className="text-[#00D0F5] font-extrabold">{legalNameVal || 'Legal Name'}</span>) will be filled in the agreement. *
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg border border-zinc-700/60 hover:bg-zinc-900 text-xs font-bold text-zinc-500 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={togglingSeller || !agreed}
              className={`flex-1 text-white py-3 rounded-lg text-xs font-extrabold cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                agreed ? 'bg-[#0B1528] hover:bg-slate-900' : 'bg-zinc-700 opacity-50 cursor-not-allowed'
              }`}
            >
              Verify &amp; Activate
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
