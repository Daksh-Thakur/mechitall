-- Update storage RLS policies for rfq-cad-files bucket to check quotes via chatId prefix
DROP POLICY IF EXISTS "Sellers and Buyers can read RFQ CAD files" ON storage.objects;
CREATE POLICY "Sellers and Buyers can read RFQ CAD files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'rfq-cad-files'
    AND (
      EXISTS (
        SELECT 1 FROM public.quotes q
        JOIN public.rfqs r ON r.id = q.rfq_id
        WHERE q.id::text = split_part(name, '/', 1)
          AND (
            r.buyer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
            OR q.seller_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
          )
      )
    )
  );

DROP POLICY IF EXISTS "Buyers can upload CAD files to their own RFQ folder" ON storage.objects;
CREATE POLICY "Buyers can upload CAD files to their own RFQ folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'rfq-cad-files'
    AND EXISTS (
      SELECT 1 FROM public.quotes q
      JOIN public.rfqs r ON r.id = q.rfq_id
      WHERE q.id::text = split_part(name, '/', 1)
        AND r.buyer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );
