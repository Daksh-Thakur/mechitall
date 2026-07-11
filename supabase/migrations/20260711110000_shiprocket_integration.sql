-- Alter orders table to support Shiprocket tracking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispatch_photo_url text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispatched_at timestamp with time zone;

-- Create the dispatch-photos bucket in Supabase Storage if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('dispatch-photos', 'dispatch-photos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for dispatch-photos bucket
DROP POLICY IF EXISTS "Sellers and Buyers can read dispatch photos" ON storage.objects;
CREATE POLICY "Sellers and Buyers can read dispatch photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'dispatch-photos');

DROP POLICY IF EXISTS "Sellers and Buyers can upload dispatch photos" ON storage.objects;
CREATE POLICY "Sellers and Buyers can upload dispatch photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dispatch-photos');
