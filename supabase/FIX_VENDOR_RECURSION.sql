-- ============================================
-- FIX VENDOR TABLE INFINITE RECURSION
-- ============================================
-- This fixes the "infinite recursion detected in policy for relation 'vendors'" error
-- Run this AFTER running FIX_ALL_RLS_ISSUES.sql

-- First, make sure is_admin() function exists
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

-- Drop ALL existing vendor policies
DROP POLICY IF EXISTS "Vendors are publicly viewable" ON public.vendors;
DROP POLICY IF EXISTS "Vendors can view own vendor record" ON public.vendors;
DROP POLICY IF EXISTS "Admins can view all vendors" ON public.vendors;
DROP POLICY IF EXISTS "Admins can insert vendors" ON public.vendors;
DROP POLICY IF EXISTS "Admins can update vendors" ON public.vendors;
DROP POLICY IF EXISTS "Admins can delete vendors" ON public.vendors;

-- Recreate vendor policies WITHOUT recursion
-- Public can view active vendors
CREATE POLICY "Vendors are publicly viewable" ON public.vendors
    FOR SELECT USING (is_active = true);

-- Vendors can view their own record (check directly, no join)
CREATE POLICY "Vendors can view own vendor record" ON public.vendors
    FOR SELECT USING (user_id = auth.uid());

-- Admins can do everything with vendors (using is_admin() function)
CREATE POLICY "Admins can view all vendors" ON public.vendors
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert vendors" ON public.vendors
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update vendors" ON public.vendors
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete vendors" ON public.vendors
    FOR DELETE USING (public.is_admin());

-- ============================================
-- VERIFICATION
-- ============================================
-- After running, test by:
-- 1. Going to admin panel -> Vendors tab
-- 2. Should see vendors without recursion error
-- 3. Check browser console - no more 500 errors

