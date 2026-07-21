-- Migration: Add vendor_agreement_pdf column to profiles table
-- Date: 2026-07-21

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vendor_agreement_pdf text;
