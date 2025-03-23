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
    console.log(`MIDDLEWARE: Path: ${path}, Session exists: ${!!session}`);

    // Disable server-side redirects - let client handle them
    /*
    // If user is not signed in and the current path is not /auth,
    // redirect the user to /auth
    if (!session && !path.startsWith('/auth')) {
      console.log('MIDDLEWARE: Redirecting unauthenticated user to /auth');
      return NextResponse.redirect(new URL('/auth', request.url));
    }

    // If user is signed in and the current path is /auth,
    // redirect the user to /
    if (session && path.startsWith('/auth')) {
      console.log('MIDDLEWARE: Redirecting authenticated user to /');
      return NextResponse.redirect(new URL('/', request.url));
    }
    */
    
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