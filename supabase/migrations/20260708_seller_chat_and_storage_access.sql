-- 1. Enable sellers to view RFQs they have submitted quotes for (even if closed)
DROP POLICY IF EXISTS "Sellers can view RFQs they have submitted quotes for" ON public.rfqs;
CREATE POLICY "Sellers can view RFQs they have submitted quotes for" ON public.rfqs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes
      WHERE quotes.rfq_id = rfqs.id
        AND quotes.seller_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- 2. Storage Policies for rfq-cad-files bucket
DROP POLICY IF EXISTS "Sellers and Buyers can read RFQ CAD files" ON storage.objects;
CREATE POLICY "Sellers and Buyers can read RFQ CAD files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'rfq-cad-files'
    AND (
      EXISTS (
        SELECT 1 FROM public.rfqs
        WHERE rfqs.id::text = split_part(name, '/', 1)
          AND (
            rfqs.buyer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
            OR EXISTS (
              SELECT 1 FROM public.quotes
              WHERE quotes.rfq_id = rfqs.id
                AND quotes.seller_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
            )
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
      SELECT 1 FROM public.rfqs
      WHERE rfqs.id::text = split_part(name, '/', 1)
        AND rfqs.buyer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- 3. Storage Policies for chat-attachments bucket
DROP POLICY IF EXISTS "Sellers and Buyers can read chat attachments" ON storage.objects;
CREATE POLICY "Sellers and Buyers can read chat attachments" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND (
      EXISTS (
        SELECT 1 FROM public.quotes
        JOIN public.rfqs ON rfqs.id = quotes.rfq_id
        WHERE quotes.id::text = split_part(name, '/', 1)
          AND (
            quotes.seller_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
            OR rfqs.buyer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
          )
      )
    )
  );

DROP POLICY IF EXISTS "Sellers and Buyers can upload chat attachments" ON storage.objects;
CREATE POLICY "Sellers and Buyers can upload chat attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND EXISTS (
      SELECT 1 FROM public.quotes
      JOIN public.rfqs ON rfqs.id = quotes.rfq_id
      WHERE quotes.id::text = split_part(name, '/', 1)
        AND (
          quotes.seller_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
          OR rfqs.buyer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        )
    )
  );
