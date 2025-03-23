import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        pathname: '/**',
      },
      {
        protocol: 'https', 
        hostname: '**.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; img-src 'self' blob: data: https://ui-avatars.com https://images.unsplash.com https://lrgrbzcufefdblmswlzl.supabase.co; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' blob: https://*.supabase.co https://*.supabase.in; frame-src 'self'; font-src 'self' data:;"
          }
        ]
      }
    ]
  }
};

export default nextConfig;
