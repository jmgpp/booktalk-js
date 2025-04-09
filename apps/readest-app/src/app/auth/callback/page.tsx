'use client';

import { useRouter } from 'next/navigation';
import { handleAuthCallback } from '@/helpers/auth';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

export default function AuthCallback() {
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    
    // Check for data in both hash and search parameters
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const hashParams = new URLSearchParams(hash.slice(1));
    const searchParams = new URLSearchParams(search);
    
    // Check for error in search params first (common for OAuth errors)
    const searchError = searchParams.get('error');
    const searchErrorCode = searchParams.get('error_code');
    const searchErrorDescription = searchParams.get('error_description');
    
    // If there's an error in the search params, handle it
    if (searchError) {
      console.error('Auth error detected in URL:', {
        error: searchError,
        errorCode: searchErrorCode,
        errorDescription: searchErrorDescription
      });
      
      handleAuthCallback({
        error: searchError,
        errorCode: searchErrorCode,
        errorDescription: searchErrorDescription,
        login,
        navigate: router.push,
      });
      return;
    }
    
    // Otherwise, proceed with hash parameters for successful flows
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');
    const next = hashParams.get('next') ?? '/';
    const error = hashParams.get('error');
    const errorDescription = hashParams.get('error_description');
    const errorCode = hashParams.get('error_code');
    
    // Get provider-specific tokens for Google OAuth
    const provider = hashParams.get('provider');
    const providerToken = hashParams.get('provider_token');
    const providerRefreshToken = hashParams.get('provider_refresh_token');
    const expiresIn = hashParams.get('expires_in') ? parseInt(hashParams.get('expires_in')!) : null;

    // Check if we have tokens from the hash
    if (accessToken && refreshToken) {
      handleAuthCallback({
        accessToken,
        refreshToken,
        type,
        next,
        error,
        errorCode,
        errorDescription,
        provider,
        providerToken,
        providerRefreshToken,
        expiresIn,
        login,
        navigate: router.push,
      });
    } else {
      // No tokens found, check if Supabase handled the auth state automatically
      console.log('No tokens found in URL hash, attempting to check auth state');
      // Try redirecting to home, auth listener will redirect to login if needed
      router.push('/home');
    }
  }, [login, router]);

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      <span className='loading loading-infinity loading-xl w-20'></span>
    </div>
  );
}
