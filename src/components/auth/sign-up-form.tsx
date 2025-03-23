'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
    setError('');
    setSuccess(false);

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

      console.log(`Attempting to sign up with email: ${email}`);

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
        console.error('Sign-up error:', error);
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
        <Alert variant="success" className="mb-4">
          <AlertDescription>
            <p className="font-medium">Success! Please check your email</p>
            <p className="mt-2">
              We've sent a confirmation link to <strong>{email}</strong>. Click the link in the
              email to verify your account and complete the sign-up process.
            </p>
          </AlertDescription>
        </Alert>
        <p className="text-sm text-muted-foreground">
          Don't see the email? Check your spam folder or try signing up again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="username" className="text-white">Username</Label>
          <Input
            id="username"
            name="username"
            type="text"
            placeholder="Choose a username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value.trim())}
            disabled={loading}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password" className="text-white">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Create a password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Must be at least 6 characters long
          </p>
        </div>
        
        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>
    </div>
  );
} 