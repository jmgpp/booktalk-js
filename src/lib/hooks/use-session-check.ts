'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/**
 * Hook to check session validity on navigation and route changes
 * Use this in protected pages to ensure stale sessions are detected
 */
export function useSessionCheck() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          window.location.href = '/auth';
          return;
        }
        
        if (!data.session) {
          console.log('No valid session found during navigation check, redirecting to auth');
          window.location.href = '/auth';
        }
      } catch (err) {
        console.error('Unexpected error in session check:', err);
      }
    };
    
    // Check session on mount
    checkSession();
    
    // Setup listener for route changes
    window.addEventListener('popstate', checkSession);
    
    return () => {
      window.removeEventListener('popstate', checkSession);
    };
  }, [router]);
} 