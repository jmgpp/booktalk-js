'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Log the attempt (for debugging)
      console.log(`Attempting to sign in with email: ${email.substring(0, 3)}***`);
      
      // Attempt to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase auth error:', error);
        setDebugInfo(`Error code: ${error.status || 'unknown'}. ${error.message}`);
        throw error;
      }

      if (!data || !data.user) {
        throw new Error('No user data returned');
      }

      console.log('Sign in successful');
      
      // Check if profile exists and create it if needed
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create one directly
        await createProfile(data.user.id, data.user.email || '', data.user.user_metadata?.username);
      } else if (profileError) {
        console.error('Error checking profile:', profileError);
      }
      
      // Log our successful login
      console.log('Successfully signed in and checked profile. Redirecting to homepage...');
      setDebugInfo('Login successful! Redirecting...');
      
      // Force an immediate redirect after successful login
      setTimeout(() => {
        console.log('SIGN-IN FORM: Forcing direct navigation to homepage');
        window.location.href = '/';
      }, 600);
    } catch (error) {
      console.error('Sign in error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign in';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function createProfile(userId: string, email: string, username?: string) {
    try {
      console.log('Creating profile in sign-in form for user ID:', userId);
      
      // Generate a username if not provided
      let finalUsername = username || '';
      if (!finalUsername && email) {
        finalUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
      }
      
      // Make sure username is valid
      if (!finalUsername || finalUsername.length < 3) {
        finalUsername = `user_${Math.floor(Math.random() * 10000)}`;
      }
      
      // Check schema first to see what fields are available
      let hasEmailColumn = true;
      try {
        const response = await fetch('/api/schema');
        const schemaData = await response.json();
        console.log('Schema data:', schemaData);
        
        if (schemaData.schema && schemaData.schema.columns) {
          const columns = schemaData.schema.columns;
          hasEmailColumn = columns.some((col: any) => col.column_name === 'email');
        }
        
        if (!schemaData.schema.tableExists) {
          setDebugInfo('Profiles table does not exist in the database!');
          return;
        }
      } catch (err) {
        console.error('Error checking schema:', err);
      }
      
      // Create the minimal profile
      const profileData: any = {
        id: userId,
        username: finalUsername,
      };
      
      // Add email only if the column exists
      if (hasEmailColumn && email) {
        profileData.email = email;
      }
      
      console.log('Attempting to create profile with data:', profileData);
      
      // First attempt: client-side direct insert
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating profile during sign in:', error);
        setDebugInfo(`Client-side profile creation failed: ${error.message}. Trying server API...`);
        
        // Second attempt: Check if profile already exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (!fetchError && existingProfile) {
          console.log('Profile already exists, proceeding with login');
          return;
        }
        
        // Third attempt: Use server API as fallback
        try {
          // Get the current session for the access token
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData.session?.access_token;
          
          if (!accessToken) {
            console.error('No access token available');
            setDebugInfo('No access token available for server API');
            return;
          }
          
          const serverResponse = await fetch('/api/create-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: userId,
              username: finalUsername,
              email,
              accessToken,
            }),
          });
          
          const serverResult = await serverResponse.json();
          console.log('Server profile creation result:', serverResult);
          
          if (serverResult.success) {
            setDebugInfo(`Profile created via server API: ${serverResult.message}`);
          } else {
            setDebugInfo(`Server profile creation failed: ${serverResult.error}`);
          }
        } catch (serverErr) {
          console.error('Error with server profile creation:', serverErr);
          setDebugInfo(`Server API error: ${serverErr instanceof Error ? serverErr.message : 'Unknown error'}`);
        }
      } else {
        console.log('Profile created successfully during sign in:', data);
      }
    } catch (err) {
      console.error('Unexpected error creating profile during sign in:', err);
      if (err instanceof Error) {
        setDebugInfo(`Unexpected error: ${err.message}`);
      } else {
        setDebugInfo(`Unknown error occurred creating profile`);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-500">
          {error}
        </div>
      )}
      {debugInfo && (
        <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-800">
          <p><strong>Debug info:</strong> {debugInfo}</p>
        </div>
      )}
      <div className="space-y-1">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Enter your email"
          error={!!error}
        />
      </div>
      <div className="space-y-1">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Enter your password"
          error={!!error}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
} 