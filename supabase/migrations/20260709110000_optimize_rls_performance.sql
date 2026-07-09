-- ======================================================
-- MechItAll: Optimize RLS Performance and Security Definer Functions
-- ======================================================

DROP POLICY IF EXISTS "Sellers can manage own machining_services" ON public.machining_services;
CREATE POLICY "Sellers can manage own machining_services" ON public.machining_services
  FOR ALL TO authenticated
  USING (seller_profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid())))
  WITH CHECK (seller_profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Buyers can manage own machining_quotes" ON public.machining_quotes;
CREATE POLICY "Buyers can manage own machining_quotes" ON public.machining_quotes
  FOR ALL TO authenticated
  USING (buyer_profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid())))
  WITH CHECK (buyer_profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Sellers can select quotes for their services" ON public.machining_quotes;
CREATE POLICY "Sellers can select quotes for their services" ON public.machining_quotes
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.machining_services 
    WHERE machining_services.id = machining_quotes.service_id 
      AND machining_services.seller_profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid()))
  ));

DROP POLICY IF EXISTS "Sellers can update quotes for their services" ON public.machining_quotes;
CREATE POLICY "Sellers can update quotes for their services" ON public.machining_quotes
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.machining_services 
    WHERE machining_services.id = machining_quotes.service_id 
      AND machining_services.seller_profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.machining_services 
    WHERE machining_services.id = machining_quotes.service_id 
      AND machining_services.seller_profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid()))
  ));

DROP POLICY IF EXISTS "Users can read chat messages for their RFQs or Quotes" ON public.chat_messages;
CREATE POLICY "Users can read chat messages for their RFQs or Quotes" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (
    sender_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid()))
    OR EXISTS (
      SELECT 1 FROM public.rfqs 
      WHERE rfqs.id = chat_messages.rfq_id 
        AND rfqs.buyer_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid()))
    )
    OR (
      quote_id IS NOT NULL 
      AND EXISTS (
        SELECT 1 FROM public.quotes 
        WHERE quotes.id = chat_messages.quote_id 
          AND quotes.seller_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid()))
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert chat messages for their RFQs or Quotes" ON public.chat_messages;
CREATE POLICY "Users can insert chat messages for their RFQs or Quotes" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid()))
    AND (
      EXISTS (
        SELECT 1 FROM public.rfqs 
        WHERE rfqs.id = chat_messages.rfq_id 
          AND rfqs.buyer_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid()))
      )
      OR (
        quote_id IS NOT NULL 
        AND EXISTS (
          SELECT 1 FROM public.quotes 
          WHERE quotes.id = chat_messages.quote_id 
            AND quotes.seller_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid()))
        )
      )
    )
  );

DROP POLICY IF EXISTS "Buyers can select own RFQs" ON public.rfqs;
CREATE POLICY "Buyers can select own RFQs" ON public.rfqs
  FOR SELECT TO authenticated
  USING (buyer_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Buyers can insert own RFQs" ON public.rfqs;
CREATE POLICY "Buyers can insert own RFQs" ON public.rfqs
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Buyers can update own RFQs" ON public.rfqs;
CREATE POLICY "Buyers can update own RFQs" ON public.rfqs
  FOR UPDATE TO authenticated
  USING (buyer_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid())))
  WITH CHECK (buyer_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Buyers can delete own RFQs" ON public.rfqs;
CREATE POLICY "Buyers can delete own RFQs" ON public.rfqs
  FOR DELETE TO authenticated
  USING (buyer_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Sellers can select own quotes" ON public.quotes;
CREATE POLICY "Sellers can select own quotes" ON public.quotes
  FOR SELECT TO authenticated
  USING (seller_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Sellers can insert own quotes" ON public.quotes;
CREATE POLICY "Sellers can insert own quotes" ON public.quotes
  FOR INSERT TO authenticated
  WITH CHECK (
    seller_id IN (
      SELECT id FROM public.profiles WHERE user_id = (select auth.uid())
    )
    OR
    rfq_id IN (
      SELECT id FROM public.rfqs WHERE buyer_id IN (
        SELECT id FROM public.profiles WHERE user_id = (select auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Sellers can update own quotes" ON public.quotes;
CREATE POLICY "Sellers can update own quotes" ON public.quotes
  FOR UPDATE TO authenticated
  USING (seller_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid())))
  WITH CHECK (seller_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Sellers can delete own quotes" ON public.quotes;
CREATE POLICY "Sellers can delete own quotes" ON public.quotes
  FOR DELETE TO authenticated
  USING (seller_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Buyers can view quotes of their RFQs" ON public.quotes;
CREATE POLICY "Buyers can view quotes of their RFQs" ON public.quotes
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.rfqs 
    WHERE rfqs.id = quotes.rfq_id 
      AND rfqs.buyer_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid()))
  ));

DROP POLICY IF EXISTS "Buyers can read own order items" ON public.order_items;
CREATE POLICY "Buyers can read own order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid()))));

DROP POLICY IF EXISTS "Sellers can insert own products" ON public.products;
CREATE POLICY "Sellers can insert own products" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (
    seller_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Sellers can update own products" ON public.products;
CREATE POLICY "Sellers can update own products" ON public.products
  FOR UPDATE TO authenticated
  USING (
    seller_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    seller_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Sellers can insert own services" ON public.services;
CREATE POLICY "Sellers can insert own services" ON public.services
  FOR INSERT TO authenticated
  WITH CHECK (
    seller_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Sellers can update own services" ON public.services;
CREATE POLICY "Sellers can update own services" ON public.services
  FOR UPDATE TO authenticated
  USING (
    seller_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    seller_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Sellers can delete own services" ON public.services;
CREATE POLICY "Sellers can delete own services" ON public.services
  FOR DELETE TO authenticated
  USING (
    seller_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Buyers can update quotes for their own RFQs" ON public.quotes;
CREATE POLICY "Buyers can update quotes for their own RFQs" ON public.quotes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rfqs
      WHERE rfqs.id = quotes.rfq_id
        AND rfqs.buyer_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rfqs
      WHERE rfqs.id = quotes.rfq_id
        AND rfqs.buyer_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid()))
    )
  );

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
            rfqs.buyer_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid()))
            OR EXISTS (
              SELECT 1 FROM public.quotes
              WHERE quotes.rfq_id = rfqs.id
                AND quotes.seller_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid()))
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
        AND rfqs.buyer_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid()))
    )
  );

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
            quotes.seller_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid()))
            OR rfqs.buyer_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid()))
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
          quotes.seller_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid()))
          OR rfqs.buyer_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid()))
        )
    )
  );

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
            mq.buyer_profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid()))
            OR ms.seller_profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid()))
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
        AND mq.buyer_profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid()))
    )
  );

-- ======================================================
-- Optimize and Secure SECURITY DEFINER functions
-- ======================================================

-- 1. decrement_product_stock
CREATE OR REPLACE FUNCTION public.decrement_product_stock(
  p_order_id text,
  p_items jsonb   -- array of {product_id: text, quantity: integer, unit_price: numeric}
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  item jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Insert order_items record
    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price)
    VALUES (
      p_order_id,
      (item->>'product_id')::text,
      (item->>'quantity')::integer,
      (item->>'unit_price')::numeric
    )
    ON CONFLICT DO NOTHING;

    -- Decrement stock, floor at 0
    UPDATE public.products
    SET stock = GREATEST(0, stock - (item->>'quantity')::integer)
    WHERE id = (item->>'product_id')::text;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_product_stock(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(text, jsonb) TO authenticated;


-- 2. seller_has_quote_for_rfq
CREATE OR REPLACE FUNCTION public.seller_has_quote_for_rfq(p_rfq_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.quotes
    WHERE public.quotes.rfq_id = p_rfq_id
      AND public.quotes.seller_id IN (
        SELECT id FROM public.profiles WHERE user_id = (select auth.uid())
      )
  );
$$;

REVOKE ALL ON FUNCTION public.seller_has_quote_for_rfq(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seller_has_quote_for_rfq(uuid) TO authenticated;
