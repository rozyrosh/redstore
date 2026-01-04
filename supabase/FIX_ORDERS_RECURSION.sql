-- ============================================
-- FIX ORDERS TABLE INFINITE RECURSION
-- ============================================
-- This fixes the "infinite recursion detected in policy for relation 'orders'" error
-- The issue occurs when placing an order because:
-- 1. The "Vendors can view own orders" policy queries order_items which references orders
-- 2. The "Users can view own order items" policy queries orders
-- 3. This creates a circular dependency during INSERT operations
--
-- Solution: Use is_admin() function and fix vendor policy to avoid recursion

-- ============================================
-- STEP 1: Ensure is_admin() function exists
-- ============================================
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

-- ============================================
-- STEP 1.5: Create function to check if user is vendor (bypasses RLS)
-- ============================================
CREATE OR REPLACE FUNCTION public.is_vendor()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM public.vendors WHERE user_id = auth.uid() LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.is_vendor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_vendor() TO anon;

-- ============================================
-- STEP 1.6: Create function to check if vendor can view order (bypasses RLS)
-- ============================================
-- This function checks if the current user (as vendor) can view an order
-- by checking order_items directly, bypassing RLS to prevent recursion
CREATE OR REPLACE FUNCTION public.vendor_can_view_order(order_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  vendor_uuid UUID;
BEGIN
  -- Get vendor ID for current user (bypasses RLS)
  SELECT id INTO vendor_uuid FROM public.vendors WHERE user_id = auth.uid() LIMIT 1;
  
  -- If user is not a vendor, return false
  IF vendor_uuid IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if any order_items belong to this vendor (bypasses RLS)
  RETURN EXISTS (
    SELECT 1 FROM public.order_items
    WHERE order_id = order_uuid AND vendor_id = vendor_uuid
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.vendor_can_view_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vendor_can_view_order(UUID) TO anon;

-- ============================================
-- STEP 2: Drop ALL existing orders policies
-- ============================================
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Vendors can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

-- ============================================
-- STEP 3: Recreate orders policies WITHOUT recursion
-- ============================================

-- Users can view their own orders (simple check, no recursion)
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

-- Vendors can view orders for their products
-- FIXED: Use vendor_can_view_order() function which bypasses RLS entirely
-- This completely prevents recursion by using SECURITY DEFINER function
CREATE POLICY "Vendors can view own orders" ON public.orders
    FOR SELECT USING (public.vendor_can_view_order(orders.id));

-- Admins can view all orders (using is_admin() function - no recursion)
CREATE POLICY "Admins can view all orders" ON public.orders
    FOR SELECT USING (public.is_admin());

-- Users can create orders
CREATE POLICY "Users can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Admins can update orders
CREATE POLICY "Admins can update orders" ON public.orders
    FOR UPDATE USING (public.is_admin());

-- ============================================
-- STEP 4: Fix ORDER_ITEMS policies to avoid recursion
-- ============================================

-- Drop existing order_items policies
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Vendors can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;

-- Users can view items in their own orders
-- FIXED: Use a simpler check that doesn't cause recursion
CREATE POLICY "Users can view own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id 
            AND o.user_id = auth.uid()
        )
    );

-- Vendors can view items for their products (use is_vendor() function)
CREATE POLICY "Vendors can view own order items" ON public.order_items
    FOR SELECT USING (vendor_id = public.is_vendor());

-- Admins can view all order items (using is_admin() function)
CREATE POLICY "Admins can view all order items" ON public.order_items
    FOR SELECT USING (public.is_admin());

-- Users can insert order items (for their own orders)
CREATE POLICY "Users can insert order items" ON public.order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id 
            AND o.user_id = auth.uid()
        )
    );

-- ============================================
-- SUCCESS
-- ============================================
-- After running this, orders should be created without recursion errors.
-- Test by placing an order in the checkout page.

