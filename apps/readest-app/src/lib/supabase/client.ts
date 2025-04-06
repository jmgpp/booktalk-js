import { createClient } from '@supabase/supabase-js';

// Use index signature access for environment variables
const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

// Remove debugging logs
// console.log('[Supabase Client] NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
// console.log('[Supabase Client] NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey);

if (!supabaseUrl) {
  console.warn('[Supabase Client] Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  // Optionally throw an error if the app cannot function without it
  // throw new Error('Missing Supabase URL. Please check your .env.local file.');
}

if (!supabaseAnonKey) {
  console.warn('[Supabase Client] Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  // Optionally throw an error
  // throw new Error('Missing Supabase Anon Key. Please check your .env.local file.');
}

// Create and export the Supabase client instance
// Check if variables exist before creating the client to avoid errors during creation
export const supabase = 
    (supabaseUrl && supabaseAnonKey) 
        ? createClient(supabaseUrl, supabaseAnonKey)
        : null; // Or handle the case where client creation fails

// You can also export the types if needed elsewhere
export type SupabaseClientType = typeof supabase; 