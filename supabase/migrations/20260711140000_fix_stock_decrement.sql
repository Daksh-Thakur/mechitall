-- Fix decrement_product_stock to cast product_id to uuid instead of text to match products table primary key

CREATE OR REPLACE FUNCTION public.decrement_product_stock(
  p_order_id text,
  p_items jsonb   -- array of {product_id: uuid, quantity: integer, unit_price: numeric}
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
    -- CRITICAL FIX: Cast item->>'product_id' to uuid since public.products.id is uuid
    UPDATE public.products
    SET stock = GREATEST(0, stock - (item->>'quantity')::integer)
    WHERE id = (item->>'product_id')::uuid;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_product_stock(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(text, jsonb) TO authenticated;
