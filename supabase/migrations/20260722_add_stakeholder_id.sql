-- Migration: Add stakeholder columns to profiles
-- Date: 2026-07-22

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stakeholder_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stakeholder_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stakeholder_email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stakeholder_pan text;
