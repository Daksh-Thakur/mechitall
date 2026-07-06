-- Create chat_messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id uuid NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_text text NOT NULL,
  file_attachment_path text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Implements RLS Policies for chat_messages

-- Policy for Selecting:
-- 1. Sender can select.
-- 2. Buyer of the RFQ can select.
-- 3. Seller of the quote can select.
DROP POLICY IF EXISTS "Users can read chat messages for their RFQs or Quotes" ON public.chat_messages;
CREATE POLICY "Users can read chat messages for their RFQs or Quotes" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (
    sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.rfqs 
      WHERE rfqs.id = chat_messages.rfq_id 
        AND rfqs.buyer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
    OR (
      quote_id IS NOT NULL 
      AND EXISTS (
        SELECT 1 FROM public.quotes 
        WHERE quotes.id = chat_messages.quote_id 
          AND quotes.seller_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      )
    )
  );

-- Policy for Inserting:
-- 1. Sender ID must match the active user's profile.
-- 2. User must be either the buyer of the RFQ or the seller of the quote.
DROP POLICY IF EXISTS "Users can insert chat messages for their RFQs or Quotes" ON public.chat_messages;
CREATE POLICY "Users can insert chat messages for their RFQs or Quotes" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND (
      EXISTS (
        SELECT 1 FROM public.rfqs 
        WHERE rfqs.id = chat_messages.rfq_id 
          AND rfqs.buyer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      )
      OR (
        quote_id IS NOT NULL 
        AND EXISTS (
          SELECT 1 FROM public.quotes 
          WHERE quotes.id = chat_messages.quote_id 
            AND quotes.seller_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        )
      )
    )
  );
