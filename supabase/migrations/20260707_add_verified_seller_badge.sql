-- Add is_verified_seller column to public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified_seller boolean DEFAULT false NOT NULL;

-- Add seller_id column to public.orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
