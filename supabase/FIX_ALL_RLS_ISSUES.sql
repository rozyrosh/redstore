-- ============================================
-- COMPLETE RLS FIX FOR ADMIN PANEL
-- ============================================
-- Run this entire file in Supabase SQL Editor to fix all RLS issues
-- This fixes: infinite recursion, vendor insert, and all admin permissions

-- ============================================
-- STEP 1: Fix is_admin() function (prevents infinite recursion)
-- ============================================

-- Drop the problematic policy first
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Create function to check admin status (bypasses RLS)
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- Recreate the admin policy using the function
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (public.is_admin());

-- ============================================
-- STEP 2: Fix VENDORS table policies (NO RECURSION)
-- ============================================

-- Drop ALL existing vendor policies to avoid conflicts
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

-- Vendors can view their own record (check directly, no join to avoid recursion)
CREATE POLICY "Vendors can view own vendor record" ON public.vendors
    FOR SELECT USING (user_id = auth.uid());

-- Admins can do everything with vendors (using is_admin() function - no recursion)
CREATE POLICY "Admins can view all vendors" ON public.vendors
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert vendors" ON public.vendors
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update vendors" ON public.vendors
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete vendors" ON public.vendors
    FOR DELETE USING (public.is_admin());

-- ============================================
-- STEP 3: Fix VENDOR_REQUESTS table policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all vendor requests" ON public.vendor_requests;
DROP POLICY IF EXISTS "Admins can update vendor requests" ON public.vendor_requests;

-- Recreate with is_admin() function
CREATE POLICY "Admins can view all vendor requests" ON public.vendor_requests
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update vendor requests" ON public.vendor_requests
    FOR UPDATE USING (public.is_admin());

-- ============================================
-- STEP 4: Fix CATEGORIES table policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

-- Create comprehensive category management policy
CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (public.is_admin());

-- ============================================
-- STEP 5: Fix PRODUCTS table policies
-- ============================================

-- Drop existing admin policy
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;

-- Create comprehensive product management policy
CREATE POLICY "Admins can manage all products" ON public.products
    FOR ALL USING (public.is_admin());

-- ============================================
-- STEP 6: Fix PRODUCT_VARIANTS table policies
-- ============================================

-- Drop existing admin policy if exists
DROP POLICY IF EXISTS "Admins can manage all product variants" ON public.product_variants;

-- Create comprehensive variant management policy
CREATE POLICY "Admins can manage all product variants" ON public.product_variants
    FOR ALL USING (public.is_admin());

-- ============================================
-- STEP 7: Fix PRODUCT_IMAGES table policies
-- ============================================

-- Drop existing admin policy if exists
DROP POLICY IF EXISTS "Admins can manage all product images" ON public.product_images;

-- Create comprehensive image management policy
CREATE POLICY "Admins can manage all product images" ON public.product_images
    FOR ALL USING (public.is_admin());

-- ============================================
-- STEP 8: Fix ORDERS table policies
-- ============================================

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

-- Create comprehensive order management policies
CREATE POLICY "Admins can view all orders" ON public.orders
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update orders" ON public.orders
    FOR UPDATE USING (public.is_admin());

-- ============================================
-- STEP 9: Fix ORDER_ITEMS table policies
-- ============================================

-- Drop existing admin policy
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;

-- Recreate with is_admin() function
CREATE POLICY "Admins can view all order items" ON public.order_items
    FOR SELECT USING (public.is_admin());

-- ============================================
-- STEP 10: Fix PAYMENTS table policies
-- ============================================

-- Drop existing admin policy
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;

-- Recreate with is_admin() function
CREATE POLICY "Admins can view all payments" ON public.payments
    FOR SELECT USING (public.is_admin());

-- ============================================
-- STEP 11: Fix PAYOUTS table policies
-- ============================================

-- Drop existing admin policy
DROP POLICY IF EXISTS "Admins can view all payouts" ON public.payouts;

-- Recreate with is_admin() function
CREATE POLICY "Admins can view all payouts" ON public.payouts
    FOR SELECT USING (public.is_admin());

-- ============================================
-- STEP 12: Fix USERS table - allow admins to update user roles
-- ============================================

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Admins can update users" ON public.users;

-- Create policy for admins to update user roles
CREATE POLICY "Admins can update users" ON public.users
    FOR UPDATE USING (public.is_admin());

-- ============================================
-- VERIFICATION
-- ============================================
-- After running this, verify:
-- 1. SELECT * FROM pg_policies WHERE tablename IN ('users', 'vendors', 'vendor_requests', 'categories', 'products');
-- 2. Try approving a vendor request in the admin panel
-- 3. Try updating a user role
-- 4. Try viewing all orders

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
-- If you see "Success. No rows returned" or similar, all policies have been created!
-- You can now use the admin panel without RLS errors.

