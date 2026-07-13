import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 font-sans flex flex-col overflow-x-clip">
      <Navbar />
      <main className="flex-1 py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-8 bg-zinc-800 p-8 rounded-2xl border border-zinc-700/60 shadow-xl">
          <h1 className="text-3xl font-bold text-white font-['Space_Grotesk'] border-b border-zinc-700/60 pb-4">Privacy Policy</h1>
          <div className="space-y-6 text-sm text-zinc-300 leading-relaxed">
            <p>
              Welcome to MechItAll's Privacy Policy. We are committed to protecting your personal information and your right to privacy as an e-commerce marketplace for robotics and mechatronics.
            </p>
            <h2 className="text-xl font-semibold text-white">1. Information We Collect</h2>
            <p>
              We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products, when you participate in activities on the website, or otherwise when you contact us. This includes storing your uploaded CAD files for custom machining requests.
            </p>
            <h2 className="text-xl font-semibold text-white">2. Payment Processing</h2>
            <p>
              We handle payments via <strong className="text-white">PayU</strong>. We do not store your complete credit card numbers or payment details directly on our servers. All payment data is securely handled by our trusted payment gateways in compliance with industry standards.
            </p>
            <h2 className="text-xl font-semibold text-white">3. How We Use Your Information</h2>
            <p>
              We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
