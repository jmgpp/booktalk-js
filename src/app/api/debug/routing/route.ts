import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  
  // Get the current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  // Get URL info
  const url = request.url;
  const headers = Object.fromEntries(request.headers);
  const referrer = request.headers.get('referer') || 'none';
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    auth: {
      hasSession: !!session,
      userId: session?.user?.id || null,
      sessionError: sessionError ? String(sessionError) : null,
    },
    request: {
      url,
      referrer,
      userAgent: headers['user-agent'] || 'unknown',
      headerKeys: Object.keys(headers),
    }
  });
} 