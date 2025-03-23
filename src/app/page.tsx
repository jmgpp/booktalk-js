'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    console.log('Homepage mounted, auth state:', { user, profile, loading });
    
    // Track status for debugging
    if (loading) {
      setDebugInfo('Auth is still loading...');
    } else if (!user) {
      setDebugInfo('No user found, redirecting to auth page');
      router.replace('/auth');
    } else {
      setDebugInfo(`User authenticated: ${user.id}`);
    }
  }, [user, profile, loading, router]);

  const handleSignOut = async () => {
    try {
      setDebugInfo('Signing out...');
      await supabase.auth.signOut();
      router.replace('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      setDebugInfo(`Error signing out: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="loading-container">
          <div className="loading-content">
            <h1 className="loading-title">Loading...</h1>
            <p className="loading-message">Please wait while we load your data.</p>
            {debugInfo && (
              <div className="mt-4 text-sm text-yellow-600">{debugInfo}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="loading-container">
          <div className="loading-content">
            <h1 className="loading-title">Redirecting...</h1>
            <p className="loading-message">Please wait while we redirect you to the login page.</p>
            {debugInfo && (
              <div className="mt-4 text-sm text-yellow-600">{debugInfo}</div>
            )}
            <div className="loading-action">
              <Button onClick={() => router.replace('/auth')}>
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Book Talk</h1>
        <Button onClick={handleSignOut}>Sign Out</Button>
      </header>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Welcome, {profile?.username || user.email}</h2>
        <div className="text-sm">
          <p><strong>Email:</strong> {user.email}</p>
          {profile && (
            <>
              <p className="mt-2"><strong>Username:</strong> {profile.username}</p>
              <p><strong>Joined:</strong> {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}</p>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Debug Info</h2>
        {debugInfo && (
          <div className="mb-4 p-2 bg-yellow-50 text-yellow-800 rounded">
            {debugInfo}
          </div>
        )}
        <div className="bg-gray-50 p-4 rounded text-xs overflow-auto max-h-[300px]">
          <pre>
            {JSON.stringify({ user, profile }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
