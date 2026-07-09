-- Update storage policies for rfq-cad-files bucket to check machining_quotes via quoteId prefix
DROP POLICY IF EXISTS "Sellers and Buyers can read RFQ CAD files" ON storage.objects;
CREATE POLICY "Sellers and Buyers can read RFQ CAD files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'rfq-cad-files'
    AND (
      EXISTS (
        SELECT 1 FROM public.machining_quotes mq
        JOIN public.machining_services ms ON ms.id = mq.service_id
        WHERE mq.id::text = split_part(name, '/', 1)
          AND (
            mq.buyer_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
            OR ms.seller_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
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
      SELECT 1 FROM public.machining_quotes mq
      WHERE mq.id::text = split_part(name, '/', 1)
        AND mq.buyer_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );
