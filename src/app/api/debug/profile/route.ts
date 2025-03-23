import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Create a simple server-side Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Check table definition using SQL query
    const { data: tableDefinition, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'profiles');

    // Get sample profile
    const { data: sampleProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    return NextResponse.json({
      message: 'Database debug information',
      schema: {
        data: tableDefinition,
        error: tableError ? { message: tableError.message, code: tableError.code } : null,
      },
      sample: {
        data: sampleProfile,
        error: profileError ? { message: profileError.message, code: profileError.code } : null,
      },
    });
  } catch (error) {
    console.error('Debug route error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 