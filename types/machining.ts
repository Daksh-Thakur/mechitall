export type UserRole = 'BUYER' | 'SELLER' | 'BOTH' | 'ADMIN';
export type RFQStatus = 'DRAFT' | 'OPEN_FOR_BIDS' | 'CLOSED';
export type QuoteStatus = 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface Profile {
  id: string;
  user_id: string | null;
  email: string | null;
  full_name: string;
  wallet_balance: number;
  loyalty_tier: 'Tinkerer' | 'Master Builder';
  role: UserRole;
  is_verified_seller?: boolean;
  created_at: string;
  updated_at: string;
}

export interface RFQ {
  id: string;
  buyer_id: string;
  title: string;
  description: string | null;
  material_preference: string | null;
  quantity: number;
  cad_file_path: string | null;
  status: RFQStatus;
  created_at: string;
}

export interface Quote {
  id: string;
  rfq_id: string;
  seller_id: string;
  total_cost: number;
  lead_time_days: number;
  seller_notes: string | null;
  status: QuoteStatus;
  created_at: string;
}

export interface RFQInput {
  title: string;
  description?: string;
  materialPreference?: string;
  quantity: number;
  cadFilePath?: string;
  status?: RFQStatus;
}

export interface QuoteInput {
  rfqId: string;
  totalCost: number;
  leadTimeDays: number;
  sellerNotes?: string;
}

export interface ChatMessage {
  id: string;
  rfq_id: string;
  quote_id: string | null;
  sender_id: string;
  message_text: string;
  file_attachment_path: string | null;
  created_at: string;
  sender_name?: string; // Optional field populated by server
}

export interface ChatMessageInput {
  rfqId: string;
  quoteId?: string;
  messageText: string;
  fileAttachmentPath?: string;
}

export interface ChatThread {
  quoteId: string;
  rfqId: string;
  rfqTitle: string;
  otherParticipantName: string;
  status: QuoteStatus;
  lastMessageText: string | null;
  lastMessageTime: string | null;
  cadFilePath?: string | null;
}

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

