-- Create enums if not exists
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('BUYER', 'SELLER', 'BOTH', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE rfq_status AS ENUM ('DRAFT', 'OPEN_FOR_BIDS', 'CLOSED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE quote_status AS ENUM ('SUBMITTED', 'ACCEPTED', 'REJECTED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. Ensure profiles table and foreign keys exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text DEFAULT 'Guest User' NOT NULL,
  wallet_balance integer DEFAULT 0 NOT NULL CHECK (wallet_balance >= 0),
  loyalty_tier text DEFAULT 'Tinkerer' NOT NULL CHECK (loyalty_tier IN ('Tinkerer', 'Master Builder')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Alter profiles to add auth relation columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'BUYER' NOT NULL;

-- Link user_id to auth.users
DO $$ BEGIN
  ALTER TABLE public.profiles 
    ADD CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create rfqs Table
CREATE TABLE IF NOT EXISTS public.rfqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  material_preference text,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  cad_file_path text,
  status rfq_status DEFAULT 'DRAFT' NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create quotes Table
CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id uuid NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_cost numeric NOT NULL CHECK (total_cost >= 0),
  lead_time_days integer NOT NULL CHECK (lead_time_days > 0),
  seller_notes text,
  status quote_status DEFAULT 'SUBMITTED' NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- 5. Implements RLS Policies for rfqs
DROP POLICY IF EXISTS "Buyers can select own RFQs" ON public.rfqs;
CREATE POLICY "Buyers can select own RFQs" ON public.rfqs
  FOR SELECT TO authenticated
  USING (buyer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Buyers can insert own RFQs" ON public.rfqs;
CREATE POLICY "Buyers can insert own RFQs" ON public.rfqs
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Buyers can update own RFQs" ON public.rfqs;
CREATE POLICY "Buyers can update own RFQs" ON public.rfqs
  FOR UPDATE TO authenticated
  USING (buyer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (buyer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Buyers can delete own RFQs" ON public.rfqs;
CREATE POLICY "Buyers can delete own RFQs" ON public.rfqs
  FOR DELETE TO authenticated
  USING (buyer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Sellers can view open RFQs" ON public.rfqs;
CREATE POLICY "Sellers can view open RFQs" ON public.rfqs
  FOR SELECT TO authenticated
  USING (status = 'OPEN_FOR_BIDS');

-- 6. Implements RLS Policies for quotes
DROP POLICY IF EXISTS "Sellers can select own quotes" ON public.quotes;
CREATE POLICY "Sellers can select own quotes" ON public.quotes
  FOR SELECT TO authenticated
  USING (seller_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Sellers can insert own quotes" ON public.quotes;
CREATE POLICY "Sellers can insert own quotes" ON public.quotes
  FOR INSERT TO authenticated
  WITH CHECK (seller_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Sellers can update own quotes" ON public.quotes;
CREATE POLICY "Sellers can update own quotes" ON public.quotes
  FOR UPDATE TO authenticated
  USING (seller_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (seller_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Sellers can delete own quotes" ON public.quotes;
CREATE POLICY "Sellers can delete own quotes" ON public.quotes
  FOR DELETE TO authenticated
  USING (seller_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Buyers can view quotes of their RFQs" ON public.quotes;
CREATE POLICY "Buyers can view quotes of their RFQs" ON public.quotes
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.rfqs 
    WHERE rfqs.id = quotes.rfq_id 
      AND rfqs.buyer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  ));
