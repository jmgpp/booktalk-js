import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET() {
  // Create a Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({
      error: 'Supabase environment variables are not set',
    }, { status: 500 });
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Check database connection
    const { data: dbCheck, error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    // Try to create a test profile directly
    const testId = `test_${Date.now()}`;
    const testProfile = {
      id: testId,
      username: `test_user_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const { data: insertTest, error: insertError } = await supabase
      .from('profiles')
      .insert(testProfile)
      .select();
    
    // Clean up test profile if it was created
    if (insertTest) {
      await supabase
        .from('profiles')
        .delete()
        .eq('id', testId);
    }
    
    // Check RLS policies
    const { data: schemaInfo, error: schemaError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_name', 'profiles');
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      db_check: {
        success: !dbError,
        error: dbError ? dbError.message : null,
      },
      insert_test: {
        success: !!insertTest,
        error: insertError ? {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
        } : null,
      },
      schema_info: {
        success: !!schemaInfo,
        data: schemaInfo,
        error: schemaError ? schemaError.message : null,
      },
      supabase_config: {
        url_set: !!supabaseUrl,
        key_set: !!supabaseKey,
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 