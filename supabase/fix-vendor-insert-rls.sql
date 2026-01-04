-- ============================================
-- FIX VENDOR INSERT RLS POLICY
-- ============================================
-- This allows admins to insert new vendors when approving requests

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Admins can insert vendors" ON public.vendors;

-- Create policy for admins to insert vendors
CREATE POLICY "Admins can insert vendors" ON public.vendors
    FOR INSERT WITH CHECK (public.is_admin());

-- Also allow admins to update vendors (for suspending/activating)
DROP POLICY IF EXISTS "Admins can update vendors" ON public.vendors;

CREATE POLICY "Admins can update vendors" ON public.vendors
    FOR UPDATE USING (public.is_admin());

-- Also allow admins to delete vendors if needed
DROP POLICY IF EXISTS "Admins can delete vendors" ON public.vendors;

CREATE POLICY "Admins can delete vendors" ON public.vendors
    FOR DELETE USING (public.is_admin());

