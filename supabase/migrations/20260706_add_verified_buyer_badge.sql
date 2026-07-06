-- Add is_verified_buyer column to public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified_buyer boolean DEFAULT false NOT NULL;
