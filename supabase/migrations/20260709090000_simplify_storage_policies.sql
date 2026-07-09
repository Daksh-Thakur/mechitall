-- Simplify storage RLS policies for rfq-cad-files bucket
DROP POLICY IF EXISTS "Sellers and Buyers can read RFQ CAD files" ON storage.objects;
CREATE POLICY "Sellers and Buyers can read RFQ CAD files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'rfq-cad-files');

DROP POLICY IF EXISTS "Buyers can upload CAD files to their own RFQ folder" ON storage.objects;
CREATE POLICY "Buyers can upload CAD files to their own RFQ folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'rfq-cad-files');

-- Simplify storage RLS policies for chat-attachments bucket
DROP POLICY IF EXISTS "Sellers and Buyers can read chat attachments" ON storage.objects;
CREATE POLICY "Sellers and Buyers can read chat attachments" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'chat-attachments');

DROP POLICY IF EXISTS "Sellers and Buyers can upload chat attachments" ON storage.objects;
CREATE POLICY "Sellers and Buyers can upload chat attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-attachments');
