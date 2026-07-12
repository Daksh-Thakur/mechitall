'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 font-sans flex flex-col overflow-x-clip">
      <Navbar />

      <main className="flex-1 py-16">
        <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Contact Details & Info (4 cols) */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-emerald-400 bg-emerald-400/5 border border-emerald-400/15 px-3 py-1 rounded">
                Contact Engineering
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight font-['Space_Grotesk']">
                Get in Touch
              </h1>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Have questions about mechatronic parts specifications, our digital RFQ custom machining pipelines, or escrow payments? Our engineering team is ready to assist.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-zinc-800 border border-zinc-700/60 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-white uppercase font-mono">Email Address</span>
                  <span className="text-xs text-zinc-400 font-mono">mechitallsupport@gmail.com</span>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-zinc-800 border border-zinc-700/60 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-white uppercase font-mono">Phone Support</span>
                  <span className="text-xs text-zinc-400 font-mono">+91 (120) 490-8800</span>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-zinc-800 border border-zinc-700/60 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-white uppercase font-mono">Corporate HQ</span>
                  <span className="text-xs text-zinc-400 leading-relaxed font-sans">Sector 62, Noida, Uttar Pradesh, 201301, India</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form (7 cols) */}
          <div className="lg:col-span-7 bg-zinc-800 border border-zinc-700/60 p-8 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold text-white font-['Space_Grotesk'] mb-6">Submit an Inquiry</h2>

            {submitted ? (
              <div className="bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 p-6 rounded-xl space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono">Message Sent Successfully!</h3>
                <p className="text-xs leading-relaxed font-sans">
                  Thank you for contacting MechItAll. Our engineering team will review your inquiry and get back to you within 24 business hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 hover:underline cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 text-xs font-bold font-mono">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-zinc-400 uppercase">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full text-xs font-sans font-semibold p-3 border border-zinc-700 rounded-xl bg-zinc-900 text-white focus:outline-none focus:border-emerald-400/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-zinc-400 uppercase">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="jane@corp.com"
                      className="w-full text-xs font-sans font-semibold p-3 border border-zinc-700 rounded-xl bg-zinc-900 text-white focus:outline-none focus:border-emerald-400/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-zinc-400 uppercase">Subject *</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Custom CNC Quote Inquiry"
                    className="w-full text-xs font-sans font-semibold p-3 border border-zinc-700 rounded-xl bg-zinc-900 text-white focus:outline-none focus:border-emerald-400/50 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-zinc-400 uppercase">Message Details *</label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Describe your design specifications or sourcing requirements in detail..."
                    className="w-full text-xs font-sans font-medium p-3 border border-zinc-700 rounded-xl bg-zinc-900 text-white resize-none focus:outline-none focus:border-emerald-400/50 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-400/10 border border-emerald-400/30 hover:bg-emerald-400/20 hover:border-emerald-400/50 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending Message...' : <><Send className="w-3.5 h-3.5" /> Submit Inquiry</>}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
