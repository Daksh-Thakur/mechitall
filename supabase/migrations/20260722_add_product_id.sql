-- Migration: Add product columns to profiles
-- Date: 2026-07-22

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS razorpay_product_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS razorpay_product_status text;
