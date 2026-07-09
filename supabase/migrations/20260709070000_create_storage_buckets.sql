-- Create the rfq-cad-files and chat-attachments buckets in Supabase Storage if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('rfq-cad-files', 'rfq-cad-files', false),
  ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;
