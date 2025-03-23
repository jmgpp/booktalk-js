import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, username, email, accessToken } = body;
    
    // Basic validation
    if (!id || !username) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: id and username are required',
      }, { status: 400 });
    }
    
    // Debug message for schema troubleshooting
    console.log('Attempting to create profile with ID:', id, 'and username:', username);
    
    // Create a Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );
    
    // First, check the actual schema to verify columns
    try {
      const { data: columns, error: schemaError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'profiles')
        .eq('table_schema', 'public');
      
      console.log('Database schema for profiles:', columns);
      
      if (schemaError) {
        console.error('Error getting schema:', schemaError);
      }
    } catch (schemaErr) {
      console.error('Error checking schema:', schemaErr);
    }
    
    // Check if profile exists first
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .single();
    
    if (existingProfile) {
      return NextResponse.json({
        success: true,
        message: 'Profile already exists',
        data: existingProfile,
      });
    }
    
    // Create profile - omitting potentially problematic fields
    const now = new Date().toISOString();
    
    // Prepare base profile data without potentially problematic fields
    const profileData = {
      id,
      username
    };
    
    // Try to create profile with minimal fields first
    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select('*')
      .single();
    
    if (error) {
      console.error('Server-side profile creation error:', error);
      
      // Try a direct SQL approach as fallback
      try {
        const { data: rawResult, error: rawError } = await supabase.rpc(
          'create_minimal_profile',
          { user_id: id, user_name: username }
        );
        
        if (rawError) {
          console.error('SQL fallback error:', rawError);
          return NextResponse.json({
            success: false,
            error: 'Failed to create profile through all available methods',
            details: { 
              originalError: error.message,
              sqlError: rawError.message 
            }
          }, { status: 500 });
        }
        
        return NextResponse.json({
          success: true,
          message: 'Profile created via SQL function',
          data: rawResult,
        });
      } catch (sqlErr) {
        console.error('SQL approach error:', sqlErr);
      }
      
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error.details || {},
        code: error.code,
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Profile created successfully',
      data,
    });
  } catch (error) {
    console.error('Unexpected error in create-profile API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown server error',
    }, { status: 500 });
  }
} 