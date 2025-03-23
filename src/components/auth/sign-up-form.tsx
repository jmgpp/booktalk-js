'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  async function checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      // If there's no error (or it's not a "not found" error), the username exists
      if (error && error.code === 'PGRST116') {
        return true; // Username is available
      }
      
      if (error) {
        console.error('Error checking username:', error);
        return true; // Proceed with signup despite the error
      }

      return false; // Username is taken
    } catch (err) {
      console.error('Unexpected error checking username:', err);
      return true; // Proceed with signup despite the error
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    setDebugInfo(null);

    try {
      // Basic validation
      if (!email || !password || !username) {
        throw new Error('Email, password, and username are required');
      }

      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Check if username is available
      const isUsernameAvailable = await checkUsernameAvailability(username);
      if (!isUsernameAvailable) {
        throw new Error('Username is already taken');
      }

      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            username,
          },
        },
      });

      if (error) {
        console.error('Supabase auth error:', error);
        setDebugInfo(`Error code: ${error.status || 'unknown'}. ${error.message}`);
        throw error;
      }

      if (!data || !data.user) {
        throw new Error('No user data returned');
      }

      // Success! Show confirmation message
      setSuccess(true);
      console.log('Sign up successful, verification email sent');
    } catch (error) {
      console.error('Sign up error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign up';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          <p className="font-medium">Success! Please check your email</p>
          <p className="mt-2">
            We've sent a confirmation link to <strong>{email}</strong>. Click the link in the
            email to verify your account and complete the sign-up process.
          </p>
        </div>
        <p className="text-sm text-gray-500">
          Don't see the email? Check your spam folder or try signing up again.
        </p>
      </div>
    );
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
          htmlFor="username"
          className="block text-sm font-medium text-gray-700"
        >
          Username
        </label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.trim())}
          required
          placeholder="Choose a username"
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
          placeholder="Create a password"
          error={!!error}
        />
        <p className="mt-1 text-xs text-gray-500">
          Must be at least 6 characters long
        </p>
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Signing up...' : 'Sign up'}
      </Button>
    </form>
  );
} 