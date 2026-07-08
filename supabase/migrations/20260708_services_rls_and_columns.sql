-- ======================================================
-- MechItAll: General Services RLS and Columns
-- ======================================================

-- 1. Add missing columns to services table
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS seller_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS image_data text,
  ADD COLUMN IF NOT EXISTS images_data jsonb DEFAULT '[]'::jsonb;

-- 2. Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 3a. Allow public read of all services
DROP POLICY IF EXISTS "Allow public read-only access for services" ON public.services;
DROP POLICY IF EXISTS "Allow public read of services" ON public.services;
CREATE POLICY "Allow public read of services" ON public.services
  FOR SELECT TO anon, authenticated USING (true);

-- 3b. Allow authenticated sellers to insert their own services
DROP POLICY IF EXISTS "Sellers can insert own services" ON public.services;
CREATE POLICY "Sellers can insert own services" ON public.services
  FOR INSERT TO authenticated
  WITH CHECK (
    seller_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- 3c. Allow sellers to update their own services
DROP POLICY IF EXISTS "Sellers can update own services" ON public.services;
CREATE POLICY "Sellers can update own services" ON public.services
  FOR UPDATE TO authenticated
  USING (
    seller_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    seller_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- 3d. Allow sellers to delete their own services
DROP POLICY IF EXISTS "Sellers can delete own services" ON public.services;
CREATE POLICY "Sellers can delete own services" ON public.services
  FOR DELETE TO authenticated
  USING (
    seller_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );
