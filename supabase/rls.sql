-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS
-- ============================================
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users (using security definer function to avoid recursion)
-- Note: This requires the is_admin() function from fix-rls-recursion.sql
-- If you get recursion errors, run fix-rls-recursion.sql first

-- Drop existing policy
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

-- Create policy using the function
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (public.is_admin());

-- ============================================
-- VENDOR REQUESTS
-- ============================================
-- Users can create their own vendor requests
CREATE POLICY "Users can create own vendor requests" ON public.vendor_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own vendor requests
CREATE POLICY "Users can view own vendor requests" ON public.vendor_requests
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all vendor requests
CREATE POLICY "Admins can view all vendor requests" ON public.vendor_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update vendor requests
CREATE POLICY "Admins can update vendor requests" ON public.vendor_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- VENDORS
-- ============================================
-- Vendors are publicly viewable
CREATE POLICY "Vendors are publicly viewable" ON public.vendors
    FOR SELECT USING (is_active = true);

-- Vendors can view their own vendor record
CREATE POLICY "Vendors can view own vendor record" ON public.vendors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.vendors
            WHERE user_id = auth.uid()
        )
    );

-- Admins can view all vendors
CREATE POLICY "Admins can view all vendors" ON public.vendors
    FOR SELECT USING (public.is_admin());

-- Admins can insert vendors (when approving requests)
CREATE POLICY "Admins can insert vendors" ON public.vendors
    FOR INSERT WITH CHECK (public.is_admin());

-- Admins can update vendors (suspend/activate, change commission)
CREATE POLICY "Admins can update vendors" ON public.vendors
    FOR UPDATE USING (public.is_admin());

-- Admins can delete vendors
CREATE POLICY "Admins can delete vendors" ON public.vendors
    FOR DELETE USING (public.is_admin());

-- ============================================
-- CUSTOMER ADDRESSES
-- ============================================
-- Users can manage their own addresses
CREATE POLICY "Users can view own addresses" ON public.customer_addresses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses" ON public.customer_addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses" ON public.customer_addresses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses" ON public.customer_addresses
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- CUSTOMER PAYMENT METHODS
-- ============================================
-- Users can manage their own payment methods
CREATE POLICY "Users can view own payment methods" ON public.customer_payment_methods
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment methods" ON public.customer_payment_methods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment methods" ON public.customer_payment_methods
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods" ON public.customer_payment_methods
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- CATEGORIES
-- ============================================
-- Categories are publicly viewable
CREATE POLICY "Categories are publicly viewable" ON public.categories
    FOR SELECT USING (is_active = true);

-- Admins can manage categories
CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- PRODUCTS
-- ============================================
-- Products are publicly viewable (active only)
CREATE POLICY "Active products are publicly viewable" ON public.products
    FOR SELECT USING (is_active = true);

-- Vendors can manage their own products
CREATE POLICY "Vendors can view own products" ON public.products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.vendors
            WHERE id = products.vendor_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Vendors can insert own products" ON public.products
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.vendors
            WHERE id = products.vendor_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Vendors can update own products" ON public.products
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.vendors
            WHERE id = products.vendor_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Vendors can delete own products" ON public.products
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.vendors
            WHERE id = products.vendor_id AND user_id = auth.uid()
        )
    );

-- Admins can manage all products
CREATE POLICY "Admins can manage all products" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- PRODUCT VARIANTS
-- ============================================
-- Product variants are publicly viewable
CREATE POLICY "Product variants are publicly viewable" ON public.product_variants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.products
            WHERE id = product_variants.product_id AND is_active = true
        )
    );

-- Vendors can manage variants for their products
CREATE POLICY "Vendors can manage own product variants" ON public.product_variants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.products p
            JOIN public.vendors v ON v.id = p.vendor_id
            WHERE p.id = product_variants.product_id AND v.user_id = auth.uid()
        )
    );

-- ============================================
-- PRODUCT IMAGES
-- ============================================
-- Product images are publicly viewable
CREATE POLICY "Product images are publicly viewable" ON public.product_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.products
            WHERE id = product_images.product_id AND is_active = true
        )
    );

-- Vendors can manage images for their products
CREATE POLICY "Vendors can manage own product images" ON public.product_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.products p
            JOIN public.vendors v ON v.id = p.vendor_id
            WHERE p.id = product_images.product_id AND v.user_id = auth.uid()
        )
    );

-- ============================================
-- CARTS
-- ============================================
-- Users can manage their own carts
CREATE POLICY "Users can view own carts" ON public.carts
    FOR SELECT USING (
        user_id = auth.uid() OR
        (user_id IS NULL AND session_id = current_setting('app.session_id', true))
    );

CREATE POLICY "Users can insert own carts" ON public.carts
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR
        (user_id IS NULL AND session_id = current_setting('app.session_id', true))
    );

CREATE POLICY "Users can update own carts" ON public.carts
    FOR UPDATE USING (
        user_id = auth.uid() OR
        (user_id IS NULL AND session_id = current_setting('app.session_id', true))
    );

CREATE POLICY "Users can delete own carts" ON public.carts
    FOR DELETE USING (
        user_id = auth.uid() OR
        (user_id IS NULL AND session_id = current_setting('app.session_id', true))
    );

-- ============================================
-- WISHLISTS
-- ============================================
-- Users can manage their own wishlists
CREATE POLICY "Users can view own wishlists" ON public.wishlists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wishlists" ON public.wishlists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishlists" ON public.wishlists
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- ORDERS
-- ============================================
-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

-- Vendors can view orders for their products
CREATE POLICY "Vendors can view own orders" ON public.orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.order_items oi
            JOIN public.products p ON p.id = oi.product_id
            JOIN public.vendors v ON v.id = p.vendor_id
            WHERE oi.order_id = orders.id AND v.user_id = auth.uid()
        )
    );

-- Admins can view all orders
CREATE POLICY "Admins can view all orders" ON public.orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can create orders
CREATE POLICY "Users can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ============================================
-- ORDER ITEMS
-- ============================================
-- Users can view items in their own orders
CREATE POLICY "Users can view own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE id = order_items.order_id AND user_id = auth.uid()
        )
    );

-- Vendors can view items for their products
CREATE POLICY "Vendors can view own order items" ON public.order_items
    FOR SELECT USING (vendor_id IN (
        SELECT id FROM public.vendors WHERE user_id = auth.uid()
    ));

-- Admins can view all order items
CREATE POLICY "Admins can view all order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- PAYMENTS
-- ============================================
-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can create payments
CREATE POLICY "Users can create payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Admins can view all payments
CREATE POLICY "Admins can view all payments" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- PAYOUTS
-- ============================================
-- Vendors can view their own payouts
CREATE POLICY "Vendors can view own payouts" ON public.payouts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.vendors
            WHERE id = payouts.vendor_id AND user_id = auth.uid()
        )
    );

-- Admins can view all payouts
CREATE POLICY "Admins can view all payouts" ON public.payouts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- REVIEWS
-- ============================================
-- Reviews are publicly viewable
CREATE POLICY "Reviews are publicly viewable" ON public.reviews
    FOR SELECT USING (true);

-- Users can create reviews
CREATE POLICY "Users can create reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews" ON public.reviews
    FOR DELETE USING (auth.uid() = user_id);

