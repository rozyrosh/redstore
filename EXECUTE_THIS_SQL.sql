-- ============================================
-- FIX RLS INFINITE RECURSION FOR USERS TABLE
-- ============================================
-- Copy and paste this entire file into Supabase SQL Editor
-- This fixes the "infinite recursion detected in policy" error

-- Step 1: Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Step 2: Create a function to check if user is admin (bypasses RLS)
-- This function uses SECURITY DEFINER to bypass RLS checks
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

-- Step 3: Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- Step 4: Recreate the admin policy using the function
-- This avoids recursion because the function bypasses RLS
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (public.is_admin());

-- ============================================
-- VERIFICATION
-- ============================================
-- After running, you can verify it worked by checking:
-- 1. The function exists: SELECT * FROM pg_proc WHERE proname = 'is_admin';
-- 2. The policy exists: SELECT * FROM pg_policies WHERE tablename = 'users' AND policyname = 'Admins can view all users';
-- 3. Try accessing /dashboard/admin in your app

