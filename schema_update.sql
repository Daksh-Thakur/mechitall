-- 1. Create Profiles Table if not exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text DEFAULT 'Guest User' NOT NULL,
  wallet_balance integer DEFAULT 0 NOT NULL CHECK (wallet_balance >= 0),
  loyalty_tier text DEFAULT 'Tinkerer' NOT NULL CHECK (loyalty_tier IN ('Tinkerer', 'Master Builder')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id text PRIMARY KEY, -- formats like PO-2026-XXXXX
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  total_amount numeric NOT NULL,
  items_count integer NOT NULL,
  status text NOT NULL CHECK (status IN ('Processing', 'Shipped', 'Delivered', 'Completed')),
  unboxing_photo_url text,
  rewards_claimed boolean DEFAULT false NOT NULL,
  delivered_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Bolts Transactions Table
CREATE TABLE IF NOT EXISTS public.bolts_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL, -- positive for credits, negative for debits (redemption, expiration)
  type text NOT NULL CHECK (type IN ('credit', 'debit', 'expiration')),
  order_id text REFERENCES public.orders(id) ON DELETE SET NULL,
  description text NOT NULL,
  expires_at timestamp with time zone, -- set only for credits
  is_expired boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Rewards Settings Table (Margin Protection Variables)
CREATE TABLE IF NOT EXISTS public.rewards_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  bolts_per_dollar_spent numeric DEFAULT 1.0 NOT NULL, -- e.g. 1 Bolt earned per ₹1 spent
  exchange_rate_bolts_per_dollar numeric DEFAULT 10.0 NOT NULL, -- 10 Bolts = ₹1.00 store credit value
  max_bolts_per_transaction integer DEFAULT 100 NOT NULL, -- max cap per order
  inspection_window_days integer DEFAULT 7 NOT NULL
);

-- Seed rewards settings if not already present
INSERT INTO public.rewards_settings (id, bolts_per_dollar_spent, exchange_rate_bolts_per_dollar, max_bolts_per_transaction, inspection_window_days)
VALUES (1, 1.0, 10.0, 100, 7)
ON CONFLICT (id) DO NOTHING;

-- 5. Trigger function to automatically upgrade Tinkerer to Master Builder when they hit 500 cumulative/current balance
CREATE OR REPLACE FUNCTION public.check_loyalty_tier_upgrade()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.wallet_balance >= 500 THEN
    NEW.loyalty_tier := 'Master Builder';
  ELSE
    NEW.loyalty_tier := 'Tinkerer';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_upgrade_tier ON public.profiles;
CREATE TRIGGER trigger_upgrade_tier
BEFORE INSERT OR UPDATE OF wallet_balance ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_loyalty_tier_upgrade();

-- 6. Expiration logic function
CREATE OR REPLACE FUNCTION public.expire_old_bolts()
RETURNS void AS $$
DECLARE
  rec RECORD;
BEGIN
  -- Loop through unexpired credits that are past their expiration date
  FOR rec IN 
    SELECT id, profile_id, amount 
    FROM public.bolts_transactions 
    WHERE type = 'credit' 
      AND is_expired = false 
      AND expires_at < now()
  LOOP
    -- Mark ledger entry as expired
    UPDATE public.bolts_transactions 
    SET is_expired = true 
    WHERE id = rec.id;

    -- Add expiration debit transaction
    INSERT INTO public.bolts_transactions (profile_id, amount, type, description)
    VALUES (rec.profile_id, -rec.amount, 'expiration', 'Expiration of ' || rec.amount || ' earned Bolts');

    -- Deduct from profile balance
    UPDATE public.profiles
    SET wallet_balance = GREATEST(0, wallet_balance - rec.amount)
    WHERE id = rec.profile_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 7. Enable RLS and Create Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bolts_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public update profiles" ON public.profiles;
CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert profiles" ON public.profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update profiles" ON public.profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public update orders" ON public.orders;
CREATE POLICY "Allow public read orders" ON public.orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update orders" ON public.orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read transactions" ON public.bolts_transactions;
DROP POLICY IF EXISTS "Allow public insert transactions" ON public.bolts_transactions;
CREATE POLICY "Allow public read transactions" ON public.bolts_transactions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert transactions" ON public.bolts_transactions FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read settings" ON public.rewards_settings;
CREATE POLICY "Allow public read settings" ON public.rewards_settings FOR SELECT TO anon, authenticated USING (true);

-- 8. Storage Buckets and Policies for technical-documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('technical-documents', 'technical-documents', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public read access for technical-documents" ON storage.objects;
CREATE POLICY "Allow public read access for technical-documents" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'technical-documents');

