-- Create the rfq-cad-files and chat-attachments buckets in Supabase Storage if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('rfq-cad-files', 'rfq-cad-files', false),
  ('chat-attachments', 'chat-attachments', false),
  ('technical-documents', 'technical-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for technical-documents bucket to allow public read-only access
DROP POLICY IF EXISTS "Allow public read access for technical-documents" ON storage.objects;
CREATE POLICY "Allow public read access for technical-documents" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'technical-documents');

