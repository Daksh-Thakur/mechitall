-- Drop old overly permissive policies
DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public update profiles" ON public.profiles;

DROP POLICY IF EXISTS "Allow public read orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public update orders" ON public.orders;

DROP POLICY IF EXISTS "Allow public read transactions" ON public.bolts_transactions;
DROP POLICY IF EXISTS "Allow public insert transactions" ON public.bolts_transactions;

DROP POLICY IF EXISTS "Allow public read settings" ON public.rewards_settings;

-- 1. Profiles Table Policies
-- Allow anyone to read profiles (so users can view seller/buyer profile details)
CREATE POLICY "Allow public read profiles" 
  ON public.profiles FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- Restrict inserting and updating profiles to the owner only (user_id = auth.uid())
CREATE POLICY "Allow users to insert their own profile" 
  ON public.profiles FOR INSERT 
  TO authenticated 
  WITH CHECK ( (select auth.uid()) = user_id );

CREATE POLICY "Allow users to update their own profile" 
  ON public.profiles FOR UPDATE 
  TO authenticated 
  USING ( (select auth.uid()) = user_id )
  WITH CHECK ( (select auth.uid()) = user_id );

-- 2. Orders Table Policies
-- Users can only view their own orders
CREATE POLICY "Allow users to read their own orders" 
  ON public.orders FOR SELECT 
  TO authenticated 
  USING ( profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid())) );

-- Users can only create their own orders
CREATE POLICY "Allow users to insert their own orders" 
  ON public.orders FOR INSERT 
  TO authenticated 
  WITH CHECK ( profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid())) );

-- Users can only update their own orders
CREATE POLICY "Allow users to update their own orders" 
  ON public.orders FOR UPDATE 
  TO authenticated 
  USING ( profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid())) )
  WITH CHECK ( profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid())) );

-- 3. Bolts Transactions Table Policies
-- Users can only view their own transactions
CREATE POLICY "Allow users to read their own transactions" 
  ON public.bolts_transactions FOR SELECT 
  TO authenticated 
  USING ( profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid())) );

-- Users can only insert their own transactions
CREATE POLICY "Allow users to insert their own transactions" 
  ON public.bolts_transactions FOR INSERT 
  TO authenticated 
  WITH CHECK ( profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid())) );

-- 4. Rewards Settings Table Policies
-- Global settings remain readable but write access is disabled for public roles
CREATE POLICY "Allow public read settings" 
  ON public.rewards_settings FOR SELECT 
  TO anon, authenticated 
  USING (true);
