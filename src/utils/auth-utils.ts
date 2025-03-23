'use client';

/**
 * Utility to completely clear all Supabase authentication data from the browser
 * This is a more aggressive approach than just using supabase.auth.signOut()
 */
export async function forceSignOut() {
  if (typeof window === 'undefined') return;
  
  console.log('Force clearing all Supabase auth data');
  
  // Clear localStorage
  const localStorageKeys = Object.keys(localStorage);
  for (const key of localStorageKeys) {
    if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
      console.log('Clearing localStorage key:', key);
      localStorage.removeItem(key);
    }
  }
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Clear all cookies related to Supabase
  document.cookie.split(';').forEach(cookie => {
    const cookieName = cookie.split('=')[0].trim();
    if (cookieName.startsWith('sb-') || cookieName.includes('supabase')) {
      console.log('Clearing cookie:', cookieName);
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  });
  
  // Force redirect with cache busting to prevent browser caching
  window.location.href = `/auth?signout=${Date.now()}`;
} 