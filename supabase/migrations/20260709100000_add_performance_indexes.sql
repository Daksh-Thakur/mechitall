-- Create database indexes to optimize RLS evaluations and dashboard queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_buyer_id ON public.rfqs(buyer_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON public.rfqs(status);
CREATE INDEX IF NOT EXISTS idx_quotes_seller_id ON public.quotes(seller_id);
CREATE INDEX IF NOT EXISTS idx_quotes_rfq_id ON public.quotes(rfq_id);
CREATE INDEX IF NOT EXISTS idx_machining_quotes_buyer_profile_id ON public.machining_quotes(buyer_profile_id);
CREATE INDEX IF NOT EXISTS idx_machining_quotes_rfq_id ON public.machining_quotes(rfq_id);
CREATE INDEX IF NOT EXISTS idx_orders_profile_id ON public.orders(profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_quote_id ON public.chat_messages(quote_id);
