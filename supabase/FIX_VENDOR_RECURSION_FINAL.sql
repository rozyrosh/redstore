-- ============================================
-- FIX VENDOR TABLE INFINITE RECURSION - FINAL FIX
-- ============================================
-- This fixes the "infinite recursion detected in policy for relation 'vendors'" error
-- The issue is the "Vendors can view own vendor record" policy queries vendors table itself

-- Step 1: Make sure is_admin() function exists
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- Step 2: Drop ALL existing vendor policies (including the problematic one)
DROP POLICY IF EXISTS "Vendors are publicly viewable" ON public.vendors;
DROP POLICY IF EXISTS "Vendors can view own vendor record" ON public.vendors;
DROP POLICY IF EXISTS "Admins can view all vendors" ON public.vendors;
DROP POLICY IF EXISTS "Admins can insert vendors" ON public.vendors;
DROP POLICY IF EXISTS "Admins can update vendors" ON public.vendors;
DROP POLICY IF EXISTS "Admins can delete vendors" ON public.vendors;

-- Step 3: Recreate policies WITHOUT recursion
-- Public can view active vendors (no recursion - just checks is_active column)
CREATE POLICY "Vendors are publicly viewable" ON public.vendors
    FOR SELECT USING (is_active = true);

-- Vendors can view their own record (NO RECURSION - directly checks user_id, doesn't query vendors table)
CREATE POLICY "Vendors can view own vendor record" ON public.vendors
    FOR SELECT USING (user_id = auth.uid());

-- Admins can view all vendors (uses is_admin() function - no recursion)
CREATE POLICY "Admins can view all vendors" ON public.vendors
    FOR SELECT USING (public.is_admin());

-- Admins can insert vendors
CREATE POLICY "Admins can insert vendors" ON public.vendors
    FOR INSERT WITH CHECK (public.is_admin());

-- Admins can update vendors
CREATE POLICY "Admins can update vendors" ON public.vendors
    FOR UPDATE USING (public.is_admin());

-- Admins can delete vendors
CREATE POLICY "Admins can delete vendors" ON public.vendors
    FOR DELETE USING (public.is_admin());

-- ============================================
-- SUCCESS
-- ============================================
-- After running this, the vendors table should work without recursion errors.
-- Test by going to admin panel -> Vendors tab

