-- =============================================================================
-- Migration: Fix profiles Table RLS Infinite Recursion
-- =============================================================================

-- 1. Drop existing faulty policies
DROP POLICY IF EXISTS "Allow admins to view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow admins to manage all profiles" ON public.profiles;

-- 2. Re-create policies using JWT claims metadata instead of recursive EXISTS queries
CREATE POLICY "Allow admins to view all profiles" ON public.profiles
    FOR SELECT USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

CREATE POLICY "Allow admins to manage all profiles" ON public.profiles
    FOR ALL USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- 3. Validation SELECT statement to verify existing policies are active
SELECT tablename, policyname, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';
