-- Allow buyers to insert quotes for their own RFQs to link quote requests with chats
DROP POLICY IF EXISTS "Sellers can insert own quotes" ON public.quotes;
CREATE POLICY "Sellers can insert own quotes" ON public.quotes
  FOR INSERT TO authenticated
  WITH CHECK (
    seller_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
    OR
    rfq_id IN (
      SELECT id FROM public.rfqs WHERE buyer_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );
