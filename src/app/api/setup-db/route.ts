import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  // Create a Supabase client with service role for admin access
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Should be stored as environment variable
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({
      success: false,
      error: 'Missing environment variables. For security, this endpoint only works with the service role key.',
    }, { status: 500 });
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  
  try {
    // Check if profiles table exists
    const { data: tableExists, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles');
    
    if (tableError) {
      return NextResponse.json({
        success: false,
        error: tableError.message,
      }, { status: 500 });
    }
    
    if (!tableExists || tableExists.length === 0) {
      // Create the profiles table if it doesn't exist
      await supabase.rpc('create_profiles_table_if_not_exists');
    }
    
    // Enable Row Level Security (RLS) on the profiles table
    await supabase.rpc('enable_rls_on_profiles');
    
    // Drop existing policies
    await supabase.rpc('drop_all_policies_on_profiles');
    
    // Create necessary policies
    
    // Policy 1: Allow users to select their own profile
    await supabase.rpc('create_policy_select_own_profile');
    
    // Policy 2: Allow authenticated users to insert their own profile
    await supabase.rpc('create_policy_insert_own_profile');
    
    // Policy 3: Allow users to update their own profile
    await supabase.rpc('create_policy_update_own_profile');
    
    // Check current policies
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'profiles');
    
    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully',
      policies: policies || [],
      errors: policiesError ? [policiesError.message] : [],
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 