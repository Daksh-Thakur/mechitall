-- Fix: infinite recursion detected in policy for relation "quotes"
--
-- Root Cause:
--   The "Buyers can view quotes of their RFQs" policy on `quotes` references `rfqs`.
--   The "Sellers can view RFQs they have submitted quotes for" policy on `rfqs` references `quotes`.
--   This creates a circular RLS evaluation loop → infinite recursion.
--
-- Fix:
--   Introduce a SECURITY DEFINER helper function that queries `quotes` directly
--   (bypassing RLS) and is used in the `rfqs` policy. This breaks the cycle because
--   the helper runs with elevated privileges and does NOT re-trigger `quotes` RLS.
--   The function is safe: it enforces auth.uid() internally.

-- 1. Create a narrow, safe helper function in the public schema.
--    SECURITY DEFINER means it bypasses RLS on `quotes` when called.
--    It is still safe because it enforces `auth.uid()` in the WHERE clause.
CREATE OR REPLACE FUNCTION public.seller_has_quote_for_rfq(p_rfq_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM quotes
    WHERE quotes.rfq_id = p_rfq_id
      AND quotes.seller_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
  );
$$;

-- Revoke execute from PUBLIC to prevent anonymous access, then grant only to authenticated.
REVOKE ALL ON FUNCTION public.seller_has_quote_for_rfq(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seller_has_quote_for_rfq(uuid) TO authenticated;

-- 2. Replace the rfqs policy that causes the recursion.
--    The old policy used EXISTS (SELECT 1 FROM public.quotes ...) directly,
--    which triggered quotes' own RLS → recursion. The new one calls the
--    SECURITY DEFINER function instead, which queries quotes WITHOUT RLS.
DROP POLICY IF EXISTS "Sellers can view RFQs they have submitted quotes for" ON public.rfqs;
CREATE POLICY "Sellers can view RFQs they have submitted quotes for" ON public.rfqs
  FOR SELECT TO authenticated
  USING (public.seller_has_quote_for_rfq(id));
