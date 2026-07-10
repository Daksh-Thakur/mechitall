-- Add last_offered_by column to public.machining_quotes
ALTER TABLE public.machining_quotes 
  ADD COLUMN IF NOT EXISTS last_offered_by text CHECK (last_offered_by IN ('BUYER', 'SELLER')) DEFAULT 'SELLER';
