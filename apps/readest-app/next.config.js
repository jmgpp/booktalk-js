/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Use output: 'export' for static exports if needed, otherwise keep default
  // output: 'export', 
  
  // Add Webpack configuration
  webpack: (config, { isServer, webpack }) => {
    // Mark Tauri API as external for the client-side bundle
    // This prevents Next.js from trying to bundle it
    if (!isServer) {
      config.externals = ["@tauri-apps/api", ...config.externals];
    }

    // Important: return the modified config
    return config;
  },
  
  // Add image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'http', // Or 'https' if google uses https for images
        hostname: 'books.google.com',
        port: '', // Keep empty unless specific port
        pathname: '/**', // Allow any path under this hostname
      },
      {
        protocol: 'https',
        hostname: 'lrgrbzcufefdblmswlzl.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Add other allowed domains here if needed
      // {
      //   protocol: 'https',
      //   hostname: 'example.com',
      // },
    ],
  },
  
  // If using output: 'export', you might need trailingSlash: true
  // trailingSlash: true,

  // Optional: Disable image optimization if causing issues with static export
  // images: {
  //   unoptimized: true,
  // },
};

module.exports = nextConfig; 