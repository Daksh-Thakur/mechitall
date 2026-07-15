'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  getOngoingChats,
  getChatMessages,
  sendChatMessage,
  getChatUploadSignedUrl,
  rejectQuote,
  cancelQuoteNegotiation,
} from '@/app/actions/machining-workflow';
import {
  submitQuoteOffer,
  submitBuyerCounterOffer,
  acceptQuoteOfferBySeller,
} from '@/app/actions/marketplace';
import { updateSellerOrderStatus } from '@/app/actions/rewards';
import { ChatThread, ChatMessage } from '@/types/machining';
import {
  RefreshCw, MessageSquare, ChevronRight, Send, Paperclip, FileText,
  ExternalLink, CircleDollarSign, CheckCircle2, XCircle, X, Eye,
} from 'lucide-react';

interface QuotationChatsTabProps {
  profile: any;
  showToast: (message: string, type: 'success' | 'error') => void;
  onUnreadChange?: () => void;
  initialActiveRfqId: string | null;
  onClearInitialActiveRfqId: () => void;
}

export default function QuotationChatsTab({
  profile,
  showToast,
  onUnreadChange,
  initialActiveRfqId,
  onClearInitialActiveRfqId,
}: QuotationChatsTabProps) {
  const supabase = createClient();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [chatSort, setChatSort] = useState<
    'date' | 'status-az' | 'status-za' | 'status-priority' | 'filter-accepted' | 'filter-rejected' | 'filter-submitted'
  >('date');

  const sortedThreads = React.useMemo(() => {
    let result = [...threads];
    if (chatSort === 'date') {
      result.sort((a, b) => {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA;
      });
    } else if (chatSort === 'filter-accepted') {
      result = result.filter(t => t.status === 'ACCEPTED' || t.machiningQuote?.status === 'Accepted');
    } else if (chatSort === 'filter-rejected') {
      result = result.filter(t => t.status === 'REJECTED' || t.machiningQuote?.status === 'Rejected');
    } else if (chatSort === 'filter-submitted') {
      result = result.filter(t => t.status === 'SUBMITTED' || (t.machiningQuote?.status as any) === 'Offered' || (t.machiningQuote?.status as any) === 'Submitted');
    } else if (chatSort === 'status-az') {
      result.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
    } else if (chatSort === 'status-za') {
      result.sort((a, b) => (b.status || '').localeCompare(a.status || ''));
    } else if (chatSort === 'status-priority') {
      const getPriority = (status: string) => {
        const s = status ? status.toUpperCase() : '';
        if (s === 'ACCEPTED') return 1;
        if (s === 'NEGOTIATING' || s === 'OFFERED' || s === 'SUBMITTED') return 2;
        if (s === 'REJECTED' || s === 'CANCELLED') return 3;
        return 4;
      };
      result.sort((a, b) => getPriority(a.status) - getPriority(b.status));
    }
    return result;
  }, [threads, chatSort]);

  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [threadOrder, setThreadOrder] = useState<any | null>(null);
  const [updatingThreadOrderStatus, setUpdatingThreadOrderStatus] = useState(false);
  const [showDesignDisclaimer, setShowDesignDisclaimer] = useState(false);
  const [pendingDesignUrl, setPendingDesignUrl] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const [offerPrice, setOfferPrice] = useState(0);
  const [offerQuantity, setOfferQuantity] = useState(1);
  const [offerMaterial, setOfferMaterial] = useState('');
  const [offerFinish, setOfferFinish] = useState('');
  const [sellerNotes, setSellerNotes] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [showCounterForm, setShowCounterForm] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll messages to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  // Focus a specific RFQ chat thread when navigated from order details
  useEffect(() => {
    if (initialActiveRfqId && threads.length > 0) {
      const thread = threads.find(t => t.rfqId === initialActiveRfqId);
      if (thread) { setActiveThread(thread); }
      else { showToast('Chat thread not found for this order.', 'error'); }
      onClearInitialActiveRfqId();
    }
  }, [initialActiveRfqId, threads]);

  // Load order associated with activeThread
  useEffect(() => {
    if (!activeThread) { setThreadOrder(null); return; }
    const fetchThreadOrder = async () => {
      const orderId = `RFQ-${activeThread.quoteId.substring(0, 8).toUpperCase()}`;
      const { data } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
      setThreadOrder(data || null);
    };
    fetchThreadOrder();
  }, [activeThread]);

  // Realtime subscription for the active chat panel
  useEffect(() => {
    const channel = supabase
      .channel('active-chat-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, async (payload: any) => {
        const newMsg = payload.new;
        if (activeThread && newMsg.quote_id === activeThread.quoteId) {
          setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
          markThreadAsSeen(activeThread.quoteId, newMsg.created_at, activeThread.status);
        }
        const res = await getOngoingChats();
        if (res.success && res.data) setThreads(res.data);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'machining_quotes' }, async (payload: any) => {
        const updatedQuote = payload.new;
        if (activeThread && updatedQuote.id === activeThread.machiningQuote?.id) {
          setActiveThread(prev => !prev ? null : {
            ...prev,
            status: updatedQuote.status === 'Accepted' ? 'ACCEPTED' : updatedQuote.status === 'Rejected' ? 'REJECTED' : prev.status,
            machiningQuote: { ...prev.machiningQuote!, ...updatedQuote, offer_price: updatedQuote.offer_price ? Number(updatedQuote.offer_price) : null },
          });
        }
        const res = await getOngoingChats();
        if (res.success && res.data) setThreads(res.data);
      })
      .subscribe((status: any, err: any) => {
        if (err) console.error('Active Chat Realtime subscription error:', err);
      });
    return () => { supabase.removeChannel(channel); };
  }, [activeThread, supabase]);

  const markThreadAsSeen = (threadId: string, lastMessageTime: string | null, status: string) => {
    try {
      const seenChats = JSON.parse(localStorage.getItem('mechitall_seen_chats') || '{}');
      seenChats[threadId] = { lastMessageTime: lastMessageTime || new Date().toISOString(), status };
      localStorage.setItem('mechitall_seen_chats', JSON.stringify(seenChats));
      if (onUnreadChange) onUnreadChange();
    } catch (err) {
      console.error('Failed to update local storage seen chats:', err);
    }
  };

  const loadThreads = async () => {
    setLoading(true);
    const res = await getOngoingChats();
    if (res.success && res.data) {
      setThreads(res.data);
      if (onUnreadChange) onUnreadChange();
      const params = new URLSearchParams(window.location.search);
      const quoteIdParam = params.get('quoteId') || params.get('thread');
      if (quoteIdParam) {
        const found = res.data.find(t => t.quoteId === quoteIdParam);
        if (found) { selectThread(found); } else if (res.data.length > 0) { selectThread(res.data[0]); }
      } else if (res.data.length > 0) { selectThread(res.data[0]); }
    } else { showToast(res.error || 'Failed to load chat threads', 'error'); }
    setLoading(false);
  };

  useEffect(() => { loadThreads(); }, []);

  // Sync offer form state when active thread changes
  useEffect(() => {
    if (activeThread?.machiningQuote) {
      const mq = activeThread.machiningQuote;
      setOfferPrice(mq.offer_price || 0);
      setOfferQuantity(mq.quantity || 1);
      setOfferMaterial(mq.selected_material || mq.material_capabilities[0] || 'Aluminium 6061');
      setOfferFinish(mq.selected_finish || mq.finish_options[0] || 'As-Machined');
      setSellerNotes(mq.seller_notes || '');
    } else {
      setOfferPrice(0); setOfferQuantity(1); setOfferMaterial(''); setOfferFinish(''); setSellerNotes('');
    }
  }, [activeThread]);

  // Subscribe to real-time message inserts for the active thread
  useEffect(() => {
    if (!activeThread) return;
    const loadMessages = async () => {
      const res = await getChatMessages(activeThread.quoteId);
      if (res.success && res.data) { setMessages(res.data); }
      else { showToast(res.error || 'Failed to load chat messages', 'error'); }
    };
    loadMessages();
    const channel = supabase
      .channel(`chat_messages:${activeThread.quoteId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `quote_id=eq.${activeThread.quoteId}` }, (payload: any) => {
        const newMsg = payload.new as any;
        const senderName = newMsg.sender_id === profile.id ? (profile.full_name || 'You') : (activeThread.otherParticipantName || 'Other');
        const formattedMsg: ChatMessage = { id: newMsg.id, rfq_id: newMsg.rfq_id, quote_id: newMsg.quote_id, sender_id: newMsg.sender_id, message_text: newMsg.message_text, file_attachment_path: newMsg.file_attachment_path, created_at: newMsg.created_at, sender_name: senderName };
        setMessages(prev => prev.some(m => m.id === formattedMsg.id) ? prev : [...prev, formattedMsg]);
        markThreadAsSeen(activeThread.quoteId, formattedMsg.created_at, activeThread.status);
        setThreads(prev => prev.map(t => t.quoteId === activeThread.quoteId ? { ...t, lastMessageText: formattedMsg.message_text, lastMessageTime: formattedMsg.created_at } : t));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeThread, profile?.id, profile?.full_name]);

  const selectThread = async (thread: ChatThread) => {
    setActiveThread(thread);
    setShowCounterForm(false);
    // Offer form state is synced by useEffect([activeThread]) — no duplication here
    setLoadingMessages(true);
    markThreadAsSeen(thread.quoteId, thread.lastMessageTime, thread.status);
    const res = await getChatMessages(thread.quoteId);
    if (res.success && res.data) { setMessages(res.data); }
    else { showToast(res.error || 'Failed to load message history', 'error'); }
    setLoadingMessages(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeThread) return;
    setSending(true);
    const res = await sendChatMessage({ rfqId: activeThread.rfqId, quoteId: activeThread.quoteId, messageText: newMessage.trim() });
    if (res.success && res.data) {
      setMessages(prev => [...prev, res.data!]);
      setNewMessage('');
      markThreadAsSeen(activeThread.quoteId, res.data!.created_at, activeThread.status);
      setThreads(prev => prev.map(t => t.quoteId === activeThread.quoteId ? { ...t, lastMessageText: res.data!.message_text, lastMessageTime: res.data!.created_at } : t));
    } else { showToast(res.error || 'Failed to send message', 'error'); }
    setSending(false);
  };

  const handleRejectQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !rejectionReasonInput.trim()) return;
    setRejecting(true);
    const res = await rejectQuote(activeThread.quoteId, activeThread.rfqId, rejectionReasonInput.trim());
    if (res.success) {
      showToast('Quotation rejected and status updated.', 'success');
      setShowRejectForm(false); setRejectionReasonInput('');
      const threadToSelect = { ...activeThread, status: 'REJECTED' as any };
      setActiveThread(threadToSelect);
      await selectThread(threadToSelect); await loadThreads();
    } else { showToast(res.error || 'Failed to reject quote.', 'error'); }
    setRejecting(false);
  };

  const handleCancelQuote = async () => {
    if (!activeThread) return;
    if (!confirm('Are you sure you want to cancel this quotation negotiation?')) return;
    setCancelling(true);
    const res = await cancelQuoteNegotiation(activeThread.quoteId, activeThread.rfqId);
    if (res.success) {
      showToast('Quotation negotiation cancelled successfully.', 'success');
      const threadToSelect = { ...activeThread, status: 'REJECTED' as any };
      setActiveThread(threadToSelect);
      await selectThread(threadToSelect); await loadThreads();
    } else { showToast(res.error || 'Failed to cancel quote negotiation.', 'error'); }
    setCancelling(false);
  };

  const handleUpdateThreadOrderStatus = async (nextStatus: 'Processing' | 'Shipped' | 'Delivered' | 'Completed') => {
    if (!activeThread || !threadOrder) return;
    setUpdatingThreadOrderStatus(true);
    try {
      await updateSellerOrderStatus(threadOrder.id, nextStatus);
      setThreadOrder((prev: any) => prev ? { ...prev, status: nextStatus } : null);
      showToast(`Order status updated to "${nextStatus}" successfully!`, 'success');
      const res = await sendChatMessage({ rfqId: activeThread.rfqId, quoteId: activeThread.quoteId, messageText: `[SYSTEM] Order status updated to "${nextStatus}". The buyer has been notified.` });
      if (res.success && res.data) setMessages(prev => [...prev, res.data!]);
    } catch (err: any) { showToast(err.message || 'Failed to update order status.', 'error'); }
    finally { setUpdatingThreadOrderStatus(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeThread) return;
    setUploading(true);
    try {
      const signedRes = await getChatUploadSignedUrl(activeThread.quoteId, file.name);
      if (!signedRes.success || !signedRes.data) { showToast(signedRes.error || 'Failed to generate signed upload URL', 'error'); return; }
      const { token, path } = signedRes.data;
      const client = createClient();
      const { error: uploadError } = await client.storage.from('chat-attachments').uploadToSignedUrl(path, token, file);
      if (uploadError) throw new Error(`Failed to upload file: ${uploadError.message}`);
      const res = await sendChatMessage({ rfqId: activeThread.rfqId, quoteId: activeThread.quoteId, messageText: `Shared an attachment: ${file.name}`, fileAttachmentPath: path });
      if (res.success && res.data) {
        setMessages(prev => [...prev, res.data!]);
        setThreads(prev => prev.map(t => t.quoteId === activeThread.quoteId ? { ...t, lastMessageText: res.data!.message_text, lastMessageTime: res.data!.created_at } : t));
        showToast('Attachment uploaded successfully!', 'success');
      } else { showToast(res.error || 'Failed to link attachment in chat', 'error'); }
    } catch (err: any) { showToast(err.message || 'Attachment upload failed', 'error'); }
    finally { setUploading(false); }
  };

  // Shared offer form fields — defined once to avoid duplication between initial and counter-offer forms
  const offerFormFields = (mq: any) => [
    { label: 'Material', node: <select key="mat" value={offerMaterial} onChange={e => setOfferMaterial(e.target.value)} className="w-full p-2 border border-zinc-700 rounded-lg bg-zinc-800/80 text-white text-[11px] focus:outline-none focus:border-[#00D0F5]/50">{(mq.material_capabilities || ['Aluminium 6061']).map((m: string) => <option key={m} value={m}>{m}</option>)}</select> },
    { label: 'Finish', node: <select key="fin" value={offerFinish} onChange={e => setOfferFinish(e.target.value)} className="w-full p-2 border border-zinc-700 rounded-lg bg-zinc-800/80 text-white text-[11px] focus:outline-none focus:border-[#00D0F5]/50">{(mq.finish_options || ['As-Machined']).map((f: string) => <option key={f} value={f}>{f}</option>)}</select> },
    { label: 'Qty', node: <input key="qty" type="number" required min={1} value={offerQuantity} onChange={e => setOfferQuantity(Math.max(1, Number(e.target.value)))} className="w-full p-2 border border-zinc-700 rounded-lg bg-zinc-800/80 text-white text-[11px] focus:outline-none focus:border-[#00D0F5]/50" /> },
    { label: 'Price (₹)', node: <input key="price" type="number" required min={1} value={offerPrice || ''} placeholder="0" onChange={e => setOfferPrice(Number(e.target.value))} className="w-full p-2 border border-zinc-700 rounded-lg bg-zinc-800/80 text-white text-[11px] focus:outline-none focus:border-[#00D0F5]/50" /> },
  ];

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread?.machiningQuote || offerPrice <= 0 || !offerMaterial || !offerFinish || offerQuantity < 1) { showToast('Please fill in all offer details.', 'error'); return; }
    setSubmittingOffer(true);
    try {
      await submitQuoteOffer(activeThread.machiningQuote.id, { price: offerPrice, notes: sellerNotes, quantity: offerQuantity, material: offerMaterial, finish: offerFinish });
      showToast('Pricing offer sent to buyer!', 'success');
      const updatedMachQuote = { ...activeThread.machiningQuote, status: 'Offered' as const, last_offered_by: 'SELLER' as const, offer_price: offerPrice, selected_material: offerMaterial, selected_finish: offerFinish, quantity: offerQuantity, seller_notes: sellerNotes };
      const updatedThread = { ...activeThread, status: 'Offered' as any, machiningQuote: updatedMachQuote };
      setActiveThread(updatedThread);
      setThreads(prev => prev.map(t => t.quoteId === activeThread.quoteId ? updatedThread : t));
      await sendChatMessage({ rfqId: activeThread.rfqId, quoteId: activeThread.quoteId, messageText: `[SYSTEM] Price quote submitted: ₹${offerPrice.toLocaleString('en-IN')} for ${offerQuantity} units in ${offerMaterial} (${offerFinish}).` });
      markThreadAsSeen(activeThread.quoteId, new Date().toISOString(), 'Offered');
      await loadThreads();
    } catch (err: any) { showToast(err.message || 'Failed to submit offer.', 'error'); }
    finally { setSubmittingOffer(false); }
  };

  const handleAcceptOffer = async () => {
    if (!activeThread?.machiningQuote || !profile) return;
    try {
      showToast('Offer accepted! Our team will contact you to complete payment.', 'success');
    } catch (err: any) { showToast(err.message || 'Failed to accept offer.', 'error'); }
  };

  const handleAcceptOfferBySeller = async () => {
    if (!activeThread?.machiningQuote) return;
    try {
      const res = await acceptQuoteOfferBySeller(activeThread.machiningQuote.id);
      showToast(`Counter-offer accepted! Order ${res.orderId} placed.`, 'success');
      const updatedMachQuote = { ...activeThread.machiningQuote, status: 'Accepted' as const };
      const updatedThread = { ...activeThread, status: 'ACCEPTED' as any, machiningQuote: updatedMachQuote };
      setActiveThread(updatedThread);
      setThreads(prev => prev.map(t => t.quoteId === activeThread.quoteId ? updatedThread : t));
      await sendChatMessage({ rfqId: activeThread.rfqId, quoteId: activeThread.quoteId, messageText: `[SYSTEM] Seller accepted the buyer's counter-offer! Order ${res.orderId} has been placed.` });
      markThreadAsSeen(activeThread.quoteId, new Date().toISOString(), 'ACCEPTED');
      await loadThreads();
    } catch (err: any) { showToast(err.message || 'Failed to accept offer.', 'error'); }
  };

  const handleCounterOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread?.machiningQuote || offerPrice <= 0 || !offerMaterial || !offerFinish || offerQuantity < 1) { showToast('Please fill in all counter-offer details.', 'error'); return; }
    setSubmittingOffer(true);
    try {
      await submitBuyerCounterOffer(activeThread.machiningQuote.id, { price: offerPrice, notes: sellerNotes, quantity: offerQuantity, material: offerMaterial, finish: offerFinish });
      showToast('Counter-offer sent to seller!', 'success');
      const updatedMachQuote = { ...activeThread.machiningQuote, status: 'Offered' as const, last_offered_by: 'BUYER' as const, offer_price: offerPrice, selected_material: offerMaterial, selected_finish: offerFinish, quantity: offerQuantity, seller_notes: sellerNotes };
      const updatedThread = { ...activeThread, status: 'Offered' as any, machiningQuote: updatedMachQuote };
      setActiveThread(updatedThread);
      setThreads(prev => prev.map(t => t.quoteId === activeThread.quoteId ? updatedThread : t));
      await sendChatMessage({ rfqId: activeThread.rfqId, quoteId: activeThread.quoteId, messageText: `[SYSTEM] Counter-offer submitted: ₹${offerPrice.toLocaleString('en-IN')} for ${offerQuantity} units in ${offerMaterial} (${offerFinish}).` });
      markThreadAsSeen(activeThread.quoteId, new Date().toISOString(), 'Offered');
      setShowCounterForm(false); await loadThreads();
    } catch (err: any) { showToast(err.message || 'Failed to submit counter-offer.', 'error'); }
    finally { setSubmittingOffer(false); }
  };

  // Read seen state once via useMemo — prevents N redundant localStorage reads inside .map()
  const seenChats = React.useMemo<Record<string, { lastMessageTime: string; status: string }>>(() => {
    try { return JSON.parse(localStorage.getItem('mechitall_seen_chats') || '{}'); }
    catch { return {}; }
  }, [threads]);

  return (
    <div className="flex flex-col md:flex-row rounded-2xl overflow-hidden border border-zinc-700/60 shadow-2xl min-h-[680px]" style={{ background: 'linear-gradient(135deg, #0B1120 0%, #0F172A 100%)' }}>

      {/* ── LEFT SIDEBAR ── */}
      <div className={`md:w-[340px] shrink-0 flex flex-col border-r border-zinc-800 ${activeThread ? 'hidden md:flex' : 'flex'}`}>
        <div className="px-5 pt-5 pb-4 border-b border-zinc-800/80">
          <h2 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#00D0F5]" />
            Negotiation Chats
          </h2>
          <p className="text-[10px] text-zinc-500 mt-1 font-medium">{sortedThreads.length} conversation{sortedThreads.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="px-4 py-3 border-b border-zinc-800/60 flex flex-wrap gap-1.5">
          {([
            ['date', 'All'],
            ['filter-accepted', '✅ Accepted'],
            ['filter-submitted', '🔄 Pending'],
            ['filter-rejected', '❌ Rejected'],
            ['status-priority', '⚡ Priority'],
          ] as const).map(([val, label]) => (
            <button key={val} onClick={() => setChatSort(val as any)} className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer ${chatSort === val ? 'bg-[#00D0F5]/15 border-[#00D0F5]/40 text-[#00D0F5]' : 'bg-zinc-800/60 border-zinc-700/40 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'}`}>{label}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/50">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-[#00D0F5]/50" />
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Loading chats...</span>
            </div>
          ) : sortedThreads.length > 0 ? sortedThreads.map(t => {
            const seen = seenChats[t.quoteId];
            const hasNewMsg = t.lastMessageTime && (!seen || new Date(t.lastMessageTime) > new Date(seen.lastMessageTime));
            const hasNewStatus = !seen || t.status !== seen.status;
            const isUnread = hasNewMsg || hasNewStatus;
            const isAccepted = t.status === 'ACCEPTED' || t.machiningQuote?.status === 'Accepted';
            const isRejected = t.status === 'REJECTED';
            const isActive = activeThread?.quoteId === t.quoteId;
            const statusDot = isAccepted ? 'bg-emerald-400' : isRejected ? 'bg-rose-500' : 'bg-amber-400';
            const initials = (t.otherParticipantName || 'UN').split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();
            return (
              <div key={t.quoteId} onClick={() => selectThread(t)} className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-all relative group ${isActive ? 'bg-[#00D0F5]/8 border-l-2 border-l-[#00D0F5]' : 'hover:bg-zinc-800/50 border-l-2 border-l-transparent'}`}>
                <div className="relative shrink-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-inner ${isAccepted ? 'bg-emerald-600/50 border border-emerald-500/40' : isRejected ? 'bg-rose-700/40 border border-rose-500/30' : 'bg-[#00D0F5]/15 border border-[#00D0F5]/30'}`}>{initials}</div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0B1120] ${statusDot}`}></span>
                  {isUnread && <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D0F5] opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00D0F5]"></span></span>}
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[11px] font-black line-clamp-1 ${isActive ? 'text-white' : 'text-zinc-200 group-hover:text-white'}`}>{t.rfqTitle}</span>
                    {t.lastMessageTime && <span className="text-[9px] font-mono text-zinc-600 shrink-0">{new Date(t.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] text-zinc-500 font-semibold line-clamp-1 flex-1">{t.lastMessageText ? `"${t.lastMessageText}"` : `With ${t.otherParticipantName}`}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isUnread && <span className="px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase bg-[#00D0F5]/20 text-[#00D0F5] border border-[#00D0F5]/30 animate-pulse">New</span>}
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${isAccepted ? 'text-emerald-400 bg-emerald-500/10' : isRejected ? 'text-rose-400 bg-rose-500/10' : 'text-amber-400 bg-amber-500/15'}`}>{isAccepted ? 'Accepted' : t.status === 'SUBMITTED' ? 'Submitted' : t.status}</span>
                    </div>
                  </div>
                  {isAccepted && t.machiningQuote?.offer_price && <div className="text-[9px] font-black text-[#00D0F5] font-mono">₹{Number(t.machiningQuote.offer_price).toLocaleString('en-IN')}</div>}
                </div>
              </div>
            );
          }) : (
            <div className="py-20 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/40 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-zinc-600" /></div>
              <div><p className="text-xs font-black text-zinc-400">No chats found</p><p className="text-[10px] text-zinc-600 mt-1 leading-normal">{chatSort !== 'date' ? 'Try a different filter above.' : 'Negotiation threads appear here once quotes are submitted.'}</p></div>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT CHAT PANEL ── */}
      <div id="chat-messages-panel" className={`flex-1 flex flex-col min-h-[680px] ${!activeThread ? 'items-center justify-center' : ''}`} style={{ background: 'linear-gradient(180deg, #0D1526 0%, #0B1120 100%)' }}>
        {activeThread ? (
          <>
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-zinc-800 bg-[#0F1A2E]/80 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveThread(null)} className="md:hidden p-1.5 rounded-lg border border-zinc-700/60 hover:bg-zinc-800 cursor-pointer shrink-0"><ChevronRight className="w-3.5 h-3.5 rotate-180 text-zinc-400" /></button>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 ${activeThread.status === 'ACCEPTED' || activeThread.machiningQuote?.status === 'Accepted' ? 'bg-emerald-600/50' : 'bg-[#00D0F5]/15'}`}>
                  {(activeThread.otherParticipantName || 'UN').split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xs font-black text-white leading-tight line-clamp-1">{activeThread.rfqTitle}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-mono text-[#007084]">#CHAT-{activeThread.quoteId.substring(0, 8).toUpperCase()}</span>
                    <span className="text-zinc-700">•</span>
                    <span className="text-[9px] text-zinc-500 font-semibold">{activeThread.otherParticipantName}</span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ml-1 ${activeThread.status === 'ACCEPTED' || activeThread.machiningQuote?.status === 'Accepted' ? 'text-emerald-400 bg-emerald-500/10' : activeThread.status === 'REJECTED' ? 'text-rose-400 bg-rose-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                      {activeThread.status === 'ACCEPTED' || activeThread.machiningQuote?.status === 'Accepted' ? 'Accepted' : activeThread.status === 'SUBMITTED' ? 'Submitted' : activeThread.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {activeThread.cadFilePath && !(profile.is_seller && activeThread.status === 'REJECTED') && (
                  <button onClick={async () => {
                    const client = createClient();
                    const { data } = await client.storage.from('rfq-cad-files').createSignedUrl(activeThread.cadFilePath!, 60);
                    if (data?.signedUrl) {
                      if (profile.is_seller && !localStorage.getItem('mechitall_design_disclaimer_accepted')) { setPendingDesignUrl(data.signedUrl); setShowDesignDisclaimer(true); }
                      else { window.open(data.signedUrl, '_blank'); }
                    } else { showToast('Failed to open design file.', 'error'); }
                  }} className="flex items-center gap-1.5 bg-[#00D0F5]/10 hover:bg-[#00D0F5]/20 text-[#00D0F5] border border-[#00D0F5]/20 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer">
                    <Eye className="w-3 h-3" /><span>Design</span>
                  </button>
                )}
                {profile.is_seller && threadOrder && (
                  <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5">
                    <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Status:</span>
                    <select value={threadOrder.status} disabled={updatingThreadOrderStatus} onChange={e => handleUpdateThreadOrderStatus(e.target.value as any)} className="bg-transparent border-none text-[10px] font-black text-white outline-none cursor-pointer focus:ring-0 p-0">
                      <option value="Processing" className="bg-zinc-900">Processing</option>
                      <option value="Shipped" className="bg-zinc-900">Shipped</option>
                      <option value="Delivered" className="bg-zinc-900">Delivered</option>
                      <option value="Completed" className="bg-zinc-900">Completed</option>
                    </select>
                  </div>
                )}
                {activeThread.status !== 'REJECTED' && (
                  <button onClick={handleCancelQuote} disabled={cancelling} className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer">
                    {cancelling ? <RefreshCw className="w-3 h-3 animate-spin" /> : <><XCircle className="w-3 h-3" /><span>{activeThread.status === 'ACCEPTED' || activeThread.machiningQuote?.status === 'Accepted' ? 'Cancel Production' : 'Cancel'}</span></>}
                  </button>
                )}
              </div>
            </div>

            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {loadingMessages ? (
                <div className="py-20 flex flex-col items-center gap-3"><RefreshCw className="w-5 h-5 animate-spin text-[#00D0F5]/40" /><span className="text-[10px] text-zinc-600 font-bold">Loading messages...</span></div>
              ) : messages.length > 0 ? messages.map(m => {
                const isOwnMessage = m.sender_id === profile.id;
                const isSystem = m.message_text?.startsWith('[SYSTEM]');
                if (isSystem) return <div key={m.id} className="flex justify-center"><span className="text-[9px] font-bold text-zinc-600 bg-zinc-800/60 border border-zinc-700/30 px-3 py-1 rounded-full">{m.message_text.replace('[SYSTEM] ', '')}</span></div>;
                return (
                  <div key={m.id} className={`flex gap-2.5 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 mt-1 ${isOwnMessage ? 'bg-[#00D0F5]/20 border border-[#00D0F5]/30' : 'bg-zinc-700 border border-zinc-600'}`}>{(m.sender_name || 'U').split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()}</div>
                    <div className={`flex flex-col max-w-[72%] gap-1 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                      <span className="text-[9px] font-bold text-zinc-500 px-1">{m.sender_name}</span>
                      <div className={`px-4 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-lg ${isOwnMessage ? 'bg-gradient-to-br from-[#00D0F5]/25 to-[#0099bb]/20 border border-[#00D0F5]/20 text-white rounded-tr-sm' : 'bg-zinc-800/80 border border-zinc-700/60 text-zinc-100 rounded-tl-sm'}`}>
                        <p>{m.message_text}</p>
                        {m.file_attachment_path && (
                          <div className={`mt-2 p-2 rounded-lg border flex items-center gap-2 ${isOwnMessage ? 'bg-black/20 border-white/10' : 'bg-zinc-900 border-zinc-700'}`}>
                            <FileText className="w-3.5 h-3.5 shrink-0 opacity-60" />
                            <div className="min-w-0 flex-1"><span className="block text-[10px] font-black truncate">{m.file_attachment_path.split('/').pop()}</span><span className="block text-[8px] opacity-50">Attachment</span></div>
                            <button onClick={async () => { const client = createClient(); const bucket = m.message_text.includes('Shared CAD Design:') ? 'rfq-cad-files' : 'chat-attachments'; const { data } = await client.storage.from(bucket).createSignedUrl(m.file_attachment_path!, 60); if (data?.signedUrl) { window.open(data.signedUrl, '_blank'); } else { showToast('Failed to open attachment link.', 'error'); } }} className="p-1 rounded hover:bg-black/20 cursor-pointer shrink-0"><ExternalLink className="w-3 h-3 opacity-60" /></button>
                          </div>
                        )}
                      </div>
                      <span className="text-[8px] text-zinc-700 px-1 font-mono">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              }) : (
                <div className="py-20 flex flex-col items-center gap-3 text-center"><div className="w-12 h-12 rounded-2xl bg-zinc-800/60 border border-zinc-700/30 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-zinc-600" /></div><p className="text-xs text-zinc-500 font-bold italic">No messages yet — start the negotiation</p></div>
              )}
            </div>

            {activeThread.machiningQuote && activeThread.status !== 'ACCEPTED' && (activeThread.machiningQuote.status as string) !== 'Accepted' && (
              <div className="mx-5 mb-3 p-4 rounded-xl border border-zinc-700/50 bg-zinc-900/60 space-y-3 backdrop-blur-sm">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#00D0F5] animate-pulse"></span><span className="text-[10px] font-black uppercase tracking-wider text-zinc-300">Quote Status: <span className="text-[#00D0F5]">{activeThread.machiningQuote.status}</span></span></div>
                  {activeThread.machiningQuote.status === 'Pending' && !profile.is_seller && <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded animate-pulse">Awaiting Fabricator Pricing</span>}
                  {activeThread.machiningQuote.status === 'Offered' && profile.is_seller && <span className="text-[9px] font-bold text-[#00D0F5] bg-[#00D0F5]/10 border border-[#00D0F5]/20 px-2 py-0.5 rounded">Awaiting Customer Approval</span>}
                </div>

                {activeThread.machiningQuote.status === 'Pending' && profile.is_seller && (
                  <form onSubmit={handleOfferSubmit} className="space-y-3 text-xs font-bold">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {offerFormFields(activeThread.machiningQuote).map(({ label, node }) => <div key={label} className="space-y-1"><label className="block text-[8px] text-zinc-500 uppercase tracking-wider">{label}</label>{node}</div>)}
                    </div>
                    {offerPrice > 0 && offerQuantity > 0 && <div className="flex items-center justify-between px-3 py-2 bg-[#00D0F5]/5 border border-[#00D0F5]/20 rounded-lg"><span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Total Amount</span><span className="text-sm font-black text-[#00D0F5]">₹{(offerPrice * offerQuantity).toLocaleString('en-IN')}</span></div>}
                    <input type="text" placeholder="Notes / inspection feedback..." value={sellerNotes} onChange={e => setSellerNotes(e.target.value)} className="w-full p-2 border border-zinc-700 rounded-lg bg-zinc-800/80 text-white text-[11px] focus:outline-none focus:border-[#00D0F5]/50" />
                    <button type="submit" disabled={submittingOffer} className="w-full py-2 bg-gradient-to-r from-[#00D0F5] to-[#0099bb] text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 hover:opacity-90 shadow">
                      {submittingOffer ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><CircleDollarSign className="w-3.5 h-3.5" /><span>Submit Price Offer to Buyer</span></>}
                    </button>
                  </form>
                )}

                {activeThread.machiningQuote.status === 'Offered' && (
                  <div className="space-y-3">
                    <div className="bg-zinc-800/60 border border-zinc-700/50 p-3 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-white uppercase tracking-wider flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>Latest Proposal — By {activeThread.machiningQuote.last_offered_by === 'BUYER' ? 'Buyer' : 'Seller'}</span>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${activeThread.machiningQuote.last_offered_by === 'BUYER' ? (profile.is_seller ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-zinc-400 bg-zinc-800 border-zinc-700') : (!profile.is_seller ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-zinc-400 bg-zinc-800 border-zinc-700')}`}>
                          {activeThread.machiningQuote.last_offered_by === 'BUYER' ? (profile.is_seller ? 'Awaiting Your Response' : 'Awaiting Seller') : (!profile.is_seller ? 'Awaiting Your Response' : 'Awaiting Buyer')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono font-bold text-zinc-500">
                        <span>Mat: <span className="text-white">{activeThread.machiningQuote.selected_material}</span></span>
                        <span>Finish: <span className="text-white">{activeThread.machiningQuote.selected_finish}</span></span>
                        <span>Qty: <span className="text-white">{activeThread.machiningQuote.quantity} units</span></span>
                        <span>Unit: <span className="text-white font-black">₹{Number(activeThread.machiningQuote.offer_price).toLocaleString('en-IN')}</span></span>
                        <span className="ml-auto text-[#00D0F5] font-black text-sm">Total: ₹{(Number(activeThread.machiningQuote.offer_price) * Number(activeThread.machiningQuote.quantity)).toLocaleString('en-IN')}</span>
                      </div>
                      {activeThread.machiningQuote.seller_notes && <p className="text-[9px] text-zinc-500 italic border-t border-zinc-700/40 pt-1.5">"{activeThread.machiningQuote.seller_notes}"</p>}
                      {!showCounterForm && (
                        <div className="flex gap-2 pt-1">
                          {!profile.is_seller && activeThread.machiningQuote.last_offered_by !== 'BUYER' && <><button onClick={handleAcceptOffer} className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow transition-all"><CheckCircle2 className="w-3.5 h-3.5" />Accept &amp; Place Order</button><button onClick={() => setShowCounterForm(true)} className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 text-xs font-bold text-zinc-400 rounded-lg cursor-pointer transition-all">Counter</button></>}
                          {profile.is_seller && activeThread.machiningQuote.last_offered_by === 'BUYER' && <><button onClick={handleAcceptOfferBySeller} className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow transition-all"><CheckCircle2 className="w-3.5 h-3.5" />Accept Counter-Offer</button><button onClick={() => setShowCounterForm(true)} className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 text-xs font-bold text-zinc-400 rounded-lg cursor-pointer transition-all">Counter</button></>}
                          {!profile.is_seller && activeThread.machiningQuote.last_offered_by === 'BUYER' && <button onClick={() => setShowCounterForm(true)} className="w-full py-2 border border-zinc-700 hover:bg-zinc-800 text-xs font-bold text-zinc-400 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-all"><CircleDollarSign className="w-3.5 h-3.5" />Modify Counter-Offer</button>}
                          {profile.is_seller && activeThread.machiningQuote.last_offered_by !== 'BUYER' && <button onClick={() => setShowCounterForm(true)} className="w-full py-2 border border-zinc-700 hover:bg-zinc-800 text-xs font-bold text-zinc-400 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-all"><CircleDollarSign className="w-3.5 h-3.5" />Modify Offer</button>}
                        </div>
                      )}
                    </div>
                    {showCounterForm && (
                      <form onSubmit={profile.is_seller ? handleOfferSubmit : handleCounterOfferSubmit} className="bg-zinc-900/40 border border-zinc-700/50 rounded-xl p-4 space-y-3 text-xs font-bold">
                        <div className="flex justify-between items-center pb-1 border-b border-zinc-800"><span className="text-[10px] text-white uppercase tracking-wider">{profile.is_seller ? 'Modify Offer' : 'Submit Counter-Offer'}</span></div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {offerFormFields(activeThread.machiningQuote).map(({ label, node }) => <div key={label} className="space-y-1"><label className="block text-[8px] text-zinc-500 uppercase tracking-wider">{label}</label>{node}</div>)}
                        </div>
                        {offerPrice > 0 && offerQuantity > 0 && <div className="flex items-center justify-between px-3 py-2 bg-[#00D0F5]/5 border border-[#00D0F5]/20 rounded-lg"><span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Total Amount</span><span className="text-sm font-black text-[#00D0F5]">₹{(offerPrice * offerQuantity).toLocaleString('en-IN')}</span></div>}
                        <input type="text" placeholder="Proposal notes..." value={sellerNotes} onChange={e => setSellerNotes(e.target.value)} className="w-full p-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white text-[11px] focus:outline-none focus:border-[#00D0F5]/50" />
                        <div className="flex gap-2">
                          <button type="submit" disabled={submittingOffer} className="flex-1 py-2 bg-gradient-to-r from-[#00D0F5] to-[#0099bb] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90 transition-all">{submittingOffer ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5" />Send Proposal</>}</button>
                          <button type="button" onClick={() => setShowCounterForm(false)} className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 text-xs font-bold text-zinc-400 rounded-lg cursor-pointer transition-all">Cancel</button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {activeThread.machiningQuote.status === 'Accepted' && (
                  <div className="bg-emerald-500/5 border border-emerald-500/15 p-3 rounded-lg text-[10px] font-bold space-y-1">
                    <p className="text-emerald-400 font-black flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Contract Terms Finalized &amp; Accepted</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-zinc-500 font-mono">
                      <span>Material: <span className="text-white">{activeThread.machiningQuote.selected_material}</span></span>
                      <span>Finish: <span className="text-white">{activeThread.machiningQuote.selected_finish}</span></span>
                      <span>Qty: <span className="text-white">{activeThread.machiningQuote.quantity} units</span></span>
                      <span>Unit Price: <span className="text-zinc-300 font-black">₹{Number(activeThread.machiningQuote.offer_price).toLocaleString('en-IN')}</span></span>
                      <span>Total: <span className="text-[#00D0F5] font-black">₹{(Number(activeThread.machiningQuote.offer_price) * Number(activeThread.machiningQuote.quantity)).toLocaleString('en-IN')}</span></span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="px-5 py-4 border-t border-zinc-800 bg-[#0F1A2E]/60 shrink-0 flex gap-3 items-center">
              <label className="p-2.5 rounded-xl border border-zinc-700/60 bg-zinc-800/60 cursor-pointer hover:bg-zinc-700/60 transition-colors shrink-0" title="Attach file">
                <Paperclip className={`w-4 h-4 ${uploading ? 'animate-pulse text-[#00D0F5]' : 'text-zinc-500'}`} />
                <input type="file" onChange={handleFileUpload} disabled={uploading || sending} className="hidden" />
              </label>
              <input type="text" placeholder="Type a message or negotiate terms..." value={newMessage} onChange={e => setNewMessage(e.target.value)} disabled={sending || uploading} className="flex-1 text-xs font-semibold px-4 py-2.5 rounded-xl border border-zinc-700/60 bg-zinc-900/60 text-white placeholder-zinc-600 focus:outline-none focus:border-[#00D0F5]/40 focus:bg-zinc-900 transition-all" />
              <button type="submit" disabled={sending || uploading || !newMessage.trim()} className="p-2.5 rounded-xl bg-gradient-to-br from-[#00D0F5] to-[#0099bb] text-white flex items-center justify-center shrink-0 disabled:opacity-40 cursor-pointer hover:opacity-90 transition-all shadow-lg"><Send className="w-4 h-4" /></button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 text-center p-10">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/60 border border-zinc-700/30 flex items-center justify-center shadow-inner"><MessageSquare className="w-7 h-7 text-zinc-600" /></div>
            <div><p className="text-sm font-black text-zinc-300">Select a conversation</p><p className="text-[11px] text-zinc-600 mt-1.5 max-w-xs leading-relaxed">Choose a negotiation thread to view messages, share CAD files, and finalize contract terms.</p></div>
          </div>
        )}
      </div>

      {/* Reject Quote Modal */}
      {showRejectForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowRejectForm(false)}></div>
          <div className="bg-zinc-800 border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl relative z-10 animate-fade-in space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-white uppercase tracking-tight font-['Space_Grotesk']">Reject Quotation</h3>
              <button onClick={() => setShowRejectForm(false)} className="p-1 rounded hover:bg-slate-50 text-zinc-400 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-zinc-400 font-semibold leading-relaxed">Please provide a reason for rejecting this quotation. This feedback will be sent directly to <strong>{activeThread?.otherParticipantName}</strong> inside this chat channel.</p>
            <form onSubmit={handleRejectQuote} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase">Rejection Reason / Feedback *</label>
                <textarea required rows={3} value={rejectionReasonInput} onChange={e => setRejectionReasonInput(e.target.value)} placeholder="e.g. Price is too high, lead times are too long, or specification mismatch..." className="w-full text-xs font-semibold p-3 border border-zinc-700/60 rounded-lg bg-zinc-900/30 text-white focus:outline-none focus:border-rose-500 resize-none" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowRejectForm(false)} className="flex-1 py-2.5 border border-zinc-700/60 hover:bg-zinc-900 text-xs font-bold text-zinc-500 rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" disabled={rejecting} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5">{rejecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Reject Quote'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Design Disclaimer Modal */}
      {showDesignDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDesignDisclaimer(false)}></div>
          <div className="bg-zinc-800 border border-zinc-700/60 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative z-10 space-y-4">
            <h3 className="text-sm font-black text-white uppercase">Design File Disclaimer</h3>
            <p className="text-xs text-zinc-400 font-semibold leading-relaxed">By accessing this design file, you agree to use it solely for the purpose of evaluating and fulfilling this specific quotation request. Unauthorized reproduction, distribution, or use of this design file is strictly prohibited.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDesignDisclaimer(false)} className="flex-1 py-2.5 border border-zinc-700/60 text-xs font-bold text-zinc-500 rounded-lg cursor-pointer hover:bg-zinc-900">Decline</button>
              <button onClick={() => { localStorage.setItem('mechitall_design_disclaimer_accepted', 'true'); setShowDesignDisclaimer(false); if (pendingDesignUrl) window.open(pendingDesignUrl, '_blank'); }} className="flex-1 py-2.5 bg-[#00D0F5] hover:bg-[#0099bb] text-white text-xs font-bold rounded-lg cursor-pointer">Accept &amp; View</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
