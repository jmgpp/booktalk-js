-- Re-create profiles table with correct structure if needed
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies (clean slate)
DROP POLICY IF EXISTS "Allow users to view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow anyone to view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow anyone to insert profile" ON public.profiles;

-- Create Policies

-- 1. Select: Allow users to view their own profile
CREATE POLICY "Allow users to view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- 2. Insert: Allow authenticated users to insert their own profile
CREATE POLICY "Allow users to insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Update: Allow users to update their own profile
CREATE POLICY "Allow users to update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 4. Public Access: Allow unauthenticated requests to read profiles
-- Uncomment this if you want public profile viewing
-- CREATE POLICY "Allow anyone to view profiles" ON public.profiles
--     FOR SELECT USING (true);

-- 5. Temporary Policy: Allow anyone to create profiles (for debugging)
-- WARNING: ONLY USE TEMPORARILY FOR DEBUGGING
CREATE POLICY "Allow anyone to insert profile" ON public.profiles
    FOR INSERT WITH CHECK (true);

-- This policy above is DANGEROUS and should be removed after testing

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);

-- Helper functions

-- Function to check if user can create a profile
CREATE OR REPLACE FUNCTION public.can_create_profile(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user exists in auth.users
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 