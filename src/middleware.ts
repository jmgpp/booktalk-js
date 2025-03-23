import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Skip middleware for specific paths
  if (
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/test-route')
  ) {
    return NextResponse.next();
  }

  // Check for signout in URL parameters
  const url = new URL(request.url);
  const isSigningOut = url.searchParams.has('signout') || 
                       request.headers.get('x-supabase-sign-out') === 'true';

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          });
        },
      },
    }
  );

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const path = request.nextUrl.pathname;
    
    // Log the path and session for debugging only
    console.log(`MIDDLEWARE: Path: ${path}, Session exists: ${!!session}, SigningOut: ${isSigningOut}`);

    // Check if this is a sign out operation
    if (isSigningOut || path === '/api/auth/signout') {
      console.log('MIDDLEWARE: Sign out operation detected - clearing all auth cookies');
      
      // Clear all known Supabase auth cookies
      const cookiesToClear = [
        'sb-access-token',
        'sb-refresh-token',
        'supabase-auth-token',
        '__supabase_auth_token',
        'sb-auth-token',
        'sb-provider-token'
      ];
      
      cookiesToClear.forEach(cookieName => {
        response.cookies.set({
          name: cookieName,
          value: '',
          maxAge: 0,
          path: '/',
        });
      });
      
      // Add extra header to help client-side code identify a signout
      response.headers.set('x-supabase-signout-complete', 'true');
      
      // If we have an explicit signout operation and we're not already on the auth page,
      // redirect to auth page with signout parameter
      if ((isSigningOut || path === '/api/auth/signout') && 
          !path.startsWith('/auth') && 
          !url.searchParams.has('signout')) {
        console.log('MIDDLEWARE: Redirecting to auth page with signout parameter');
        return NextResponse.redirect(new URL(`/auth?signout=${Date.now()}`, request.url));
      }
    }

    return response;
  } catch (error) {
    console.error('MIDDLEWARE ERROR:', error);
    // If we hit an error, just proceed without redirecting
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 