import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Check Supabase connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Supabase connection error',
        error: error.message,
        code: error.code,
        details: error.details,
      }, { status: 500 });
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Supabase connection successful',
      env: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
        nodeEnv: process.env.NODE_ENV,
      },
      data,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 