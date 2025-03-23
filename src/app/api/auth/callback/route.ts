import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            const cookieStore = await cookies();
            const cookie = cookieStore.get(name);
            return cookie?.value;
          },
          async set(name: string, value: string, options: any) {
            try {
              const cookieStore = await cookies();
              const { sameSite, ...otherOptions } = options;
              cookieStore.set(name, value, {
                ...otherOptions,
                sameSite: sameSite as 'lax' | 'strict' | 'none',
              });
            } catch (error) {
              console.error('Error setting cookie:', error);
            }
          },
          async remove(name: string, options: any) {
            try {
              const cookieStore = await cookies();
              cookieStore.delete(name);
            } catch (error) {
              console.error('Error removing cookie:', error);
            }
          },
        },
      }
    );

    try {
      // Exchange the code for a session
      await supabase.auth.exchangeCodeForSession(code);

      // Get the user data
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No user found');

      // Create the user profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        username: user.user_metadata.username,
        email: user.email,
      });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Don't throw here, as the user is already confirmed
      }
    } catch (error) {
      console.error('Auth callback error:', error);
    }
  }

  // Redirect to the home page
  return NextResponse.redirect(new URL('/', requestUrl.origin));
} 