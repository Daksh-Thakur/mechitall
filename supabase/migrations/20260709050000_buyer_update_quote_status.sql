-- Allow buyers to update quotes for their own RFQs (so they can accept them)
DROP POLICY IF EXISTS "Buyers can update quotes for their own RFQs" ON public.quotes;
CREATE POLICY "Buyers can update quotes for their own RFQs" ON public.quotes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rfqs
      WHERE rfqs.id = quotes.rfq_id
        AND rfqs.buyer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rfqs
      WHERE rfqs.id = quotes.rfq_id
        AND rfqs.buyer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );
