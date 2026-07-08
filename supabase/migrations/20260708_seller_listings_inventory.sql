-- ======================================================
-- MechItAll: Seller Listings & Inventory Management
-- ======================================================

-- 1. Add missing columns to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_data text,
  ADD COLUMN IF NOT EXISTS images_data jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS seller_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Add order_items table to track which products were in each order
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Order items: buyers can read their own order items (via orders)
DROP POLICY IF EXISTS "Buyers can read own order items" ON public.order_items;
CREATE POLICY "Buyers can read own order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())));

-- Order items: server actions can insert
DROP POLICY IF EXISTS "Allow insert order items" ON public.order_items;
CREATE POLICY "Allow insert order items" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 3. RLS for products table

-- 3a. Allow public read of all products (drop old if exists first)
DROP POLICY IF EXISTS "Allow public read of products" ON public.products;
CREATE POLICY "Allow public read of products" ON public.products
  FOR SELECT TO anon, authenticated USING (true);

-- 3b. Allow authenticated sellers to insert their own products
DROP POLICY IF EXISTS "Sellers can insert own products" ON public.products;
CREATE POLICY "Sellers can insert own products" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (
    seller_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- 3c. Allow sellers to update their own products (e.g. edit stock)
DROP POLICY IF EXISTS "Sellers can update own products" ON public.products;
CREATE POLICY "Sellers can update own products" ON public.products
  FOR UPDATE TO authenticated
  USING (
    seller_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    seller_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- 4. Function to decrement stock for a list of items when an order is confirmed
CREATE OR REPLACE FUNCTION public.decrement_product_stock(
  p_order_id text,
  p_items jsonb   -- array of {product_id: text, quantity: integer, unit_price: numeric}
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Insert order_items record
    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price)
    VALUES (
      p_order_id,
      (item->>'product_id')::text,
      (item->>'quantity')::integer,
      (item->>'unit_price')::numeric
    )
    ON CONFLICT DO NOTHING;

    -- Decrement stock, floor at 0
    UPDATE public.products
    SET stock = GREATEST(0, stock - (item->>'quantity')::integer)
    WHERE id = (item->>'product_id')::text;
  END LOOP;
END;
$$;

-- Grant execute to authenticated users (called from server action)
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(text, jsonb) TO authenticated;
