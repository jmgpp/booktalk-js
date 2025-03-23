-- Function to create a minimal profile
CREATE OR REPLACE FUNCTION public.create_minimal_profile(user_id UUID, user_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Run with definer's privileges
AS $$
DECLARE
  profile_record JSONB;
BEGIN
  -- Check if profile already exists
  SELECT row_to_json(p)::JSONB INTO profile_record
  FROM public.profiles p
  WHERE p.id = user_id;
  
  -- If profile exists, return it
  IF profile_record IS NOT NULL THEN
    RETURN json_build_object(
      'status', 'exists',
      'profile', profile_record
    );
  END IF;
  
  -- Check what columns actually exist in the profiles table
  DECLARE
    column_exists BOOLEAN;
  BEGIN
    -- Check if 'email' column exists
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'email'
    ) INTO column_exists;
    
    -- If email column exists, use full insert
    IF column_exists THEN
      INSERT INTO public.profiles (id, username, email, created_at, updated_at)
      VALUES (
        user_id,
        user_name,
        (SELECT email FROM auth.users WHERE id = user_id),
        now(),
        now()
      )
      RETURNING row_to_json(profiles)::JSONB INTO profile_record;
    ELSE
      -- Minimal insert without email
      INSERT INTO public.profiles (id, username)
      VALUES (user_id, user_name)
      RETURNING row_to_json(profiles)::JSONB INTO profile_record;
    END IF;
  END;
  
  -- Return the created profile
  RETURN json_build_object(
    'status', 'created',
    'profile', profile_record
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'status', 'error',
      'message', SQLERRM,
      'code', SQLSTATE
    );
END;
$$; 