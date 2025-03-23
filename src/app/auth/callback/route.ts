import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  // If no code, redirect to home
  if (!code) {
    return NextResponse.redirect(new URL('/', requestUrl.origin));
  }

  try {
    // Create a direct Supabase client without cookie handling for this request
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(
        new URL(`/auth?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      );
    }

    if (!data.session || !data.session.user) {
      console.error('No session or user data');
      return NextResponse.redirect(
        new URL('/auth?error=Failed%20to%20get%20user%20data', requestUrl.origin)
      );
    }

    // Check if profile exists
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.session.user.id)
      .single();

    // If profile doesn't exist, create one
    if (profileError && profileError.code === 'PGRST116') {
      const user = data.session.user;
      
      // Generate username from metadata or email
      let username = '';
      if (user.user_metadata && user.user_metadata.username) {
        username = user.user_metadata.username;
      } else if (user.email) {
        username = user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
      } else {
        username = `user_${Math.floor(Math.random() * 10000)}`;
      }
      
      // Create profile
      const now = new Date().toISOString();
      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        username,
        email: user.email || '',
        full_name: null,
        avatar_url: null,
        bio: null,
        created_at: now,
        updated_at: now,
      });
      
      if (insertError) {
        console.error('Error creating profile during confirmation:', insertError);
      }
    }

    // Set the cookies for auth
    const response = NextResponse.redirect(new URL('/', requestUrl.origin));
    
    // Set cookies from the session
    if (data.session) {
      response.cookies.set('sb-access-token', data.session.access_token, { 
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
      
      response.cookies.set('sb-refresh-token', data.session.refresh_token, {
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
    }
    
    return response;
  } catch (error) {
    console.error('Unexpected error in callback route:', error);
    return NextResponse.redirect(
      new URL('/auth?error=Something%20went%20wrong', requestUrl.origin)
    );
  }
} 