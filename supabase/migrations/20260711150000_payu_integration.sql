-- Migration: PayU integration columns and status constraints
-- Date: 2026-07-11

-- 1. Update profiles table to store Child Merchant Key from PayU Seller KYC
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS child_merchant_key text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS legal_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_account_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ifsc_code text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pan text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gstin text;

-- 2. Modify orders status CHECK constraint to allow 'Pending Payment'
-- First, drop the constraint if it exists. Note: in PostgreSQL, table level check constraints default to `table_column_check`
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('Pending Payment', 'Processing', 'Shipped', 'Delivered', 'Completed'));

-- 3. Add transactional and payment status tracking columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Success', 'Failed'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payu_txnid text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payu_mihpayid text;

-- 4. Add escrow, dispute, and release tracking columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS disputed boolean DEFAULT false NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispute_reason text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS escrow_released boolean DEFAULT false NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS released_at timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS released_transaction_id text;
