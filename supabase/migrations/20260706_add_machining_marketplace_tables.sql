-- 1. Create machining_services Table
CREATE TABLE IF NOT EXISTS public.machining_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  process_type text NOT NULL CHECK (process_type IN ('CNC Machining', '3D Printing', 'Sheet Metal', 'Laser Cutting')),
  description text,
  base_price numeric NOT NULL CHECK (base_price >= 0),
  lead_time text NOT NULL,
  material_capabilities text[] DEFAULT '{}'::text[] NOT NULL,
  finish_options text[] DEFAULT '{}'::text[] NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create machining_quotes Table
CREATE TABLE IF NOT EXISTS public.machining_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.machining_services(id) ON DELETE CASCADE,
  cad_file_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  selected_material text NOT NULL,
  selected_finish text NOT NULL,
  status text DEFAULT 'Pending' NOT NULL CHECK (status IN ('Pending', 'Offered', 'Accepted', 'Completed', 'Rejected')),
  offer_price numeric CHECK (offer_price >= 0),
  seller_notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security
ALTER TABLE public.machining_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machining_quotes ENABLE ROW LEVEL SECURITY;

-- 4. Policies for machining_services
DROP POLICY IF EXISTS "Allow public read access for machining_services" ON public.machining_services;
CREATE POLICY "Allow public read access for machining_services" ON public.machining_services
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Sellers can manage own machining_services" ON public.machining_services;
CREATE POLICY "Sellers can manage own machining_services" ON public.machining_services
  FOR ALL TO authenticated
  USING (seller_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (seller_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- 5. Policies for machining_quotes
DROP POLICY IF EXISTS "Buyers can manage own machining_quotes" ON public.machining_quotes;
CREATE POLICY "Buyers can manage own machining_quotes" ON public.machining_quotes
  FOR ALL TO authenticated
  USING (buyer_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (buyer_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Sellers can select quotes for their services" ON public.machining_quotes;
CREATE POLICY "Sellers can select quotes for their services" ON public.machining_quotes
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.machining_services 
    WHERE machining_services.id = machining_quotes.service_id 
      AND machining_services.seller_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "Sellers can update quotes for their services" ON public.machining_quotes;
CREATE POLICY "Sellers can update quotes for their services" ON public.machining_quotes
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.machining_services 
    WHERE machining_services.id = machining_quotes.service_id 
      AND machining_services.seller_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.machining_services 
    WHERE machining_services.id = machining_quotes.service_id 
      AND machining_services.seller_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  ));
