-- Add KYC columns to public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seller_kyc_completed boolean DEFAULT false NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_seller boolean DEFAULT false NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tax_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS machine_count integer DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS primary_capability text;
