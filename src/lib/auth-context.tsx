'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Profile } from './database.types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

// Flag to prevent multiple redirects
let redirectInProgress = false;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log('AuthProvider initialized');
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('Initial session check:', session ? 'Session found' : 'No session');
      setUser(session?.user ?? null);
      
      if (session?.user) {
        getProfile(session.user.id);
      } else {
        setLoading(false);
        setInitialized(true);
      }
    }).catch(error => {
      if (!mounted) return;
      console.error('Error getting session:', error);
      setLoading(false);
      setInitialized(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event);
      
      if (!mounted) return;
      
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // User is signed in - update the profile only
        await getProfile(session.user.id);
      } else {
        // User is signed out
        setProfile(null);
        setLoading(false);
        setInitialized(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function getProfile(userId: string) {
    try {
      // First check if the profile exists
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile not found, try to create one
          console.log('Profile not found, creating profile');
          await createProfile(userId);
          return;
        }
        
        console.error('Error fetching profile:', error);
        setLoading(false);
        return;
      }

      console.log('Profile fetched successfully');
      setProfile(data);
      setLoading(false);
    } catch (err) {
      console.error('Unexpected error in getProfile:', err);
      setLoading(false);
    }
  }

  async function createProfile(userId: string) {
    try {
      console.log('Starting profile creation for user ID:', userId);
      
      // Get user from auth
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        console.error('Error getting user:', userError);
        setLoading(false);
        return;
      }
      
      const { user } = userData;
      console.log('Got user data:', { id: user.id, email: user.email });
      
      // Generate a username from email or metadata
      let username = '';
      if (user.user_metadata && user.user_metadata.username) {
        username = user.user_metadata.username;
      } else if (user.email) {
        // Extract part before @ and clean it up
        username = user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
      } else {
        // Fallback to a random username
        username = `user_${Math.floor(Math.random() * 10000)}`;
      }
      
      // Make sure username is not empty and meets minimum length
      if (!username || username.length < 3) {
        username = `user_${Math.floor(Math.random() * 10000)}`;
      }
      
      // First, check what columns exist in the profiles table
      let hasEmailColumn = true;
      try {
        const { data: columns } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_name', 'profiles')
          .eq('table_schema', 'public');
          
        console.log('Available columns:', columns);
        
        // Check if email column exists
        if (columns) {
          hasEmailColumn = columns.some(col => col.column_name === 'email');
        }
      } catch (err) {
        console.error('Error checking columns:', err);
      }
      
      // Prepare the minimal required profile data
      const profileData: any = {
        id: userId,
        username: username,
      };
      
      // Add email only if the column exists
      if (hasEmailColumn && user.email) {
        profileData.email = user.email;
      }
      
      console.log('Creating profile with data:', profileData);
      
      // Try inserting profile
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error creating profile:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // If there was an error, try a direct fetch first to see if profile already exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (!fetchError && existingProfile) {
          console.log('Profile already exists:', existingProfile);
          setProfile(existingProfile);
          setLoading(false);
          return;
        }
        
        // Try the server API as a last resort
        try {
          const response = await fetch('/api/create-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: userId,
              username,
              email: user.email,
              accessToken: (await supabase.auth.getSession()).data.session?.access_token || '',
            }),
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('Server API result:', result);
            
            if (result.success && result.data) {
              setProfile(result.data);
              setLoading(false);
              return;
            }
          }
        } catch (serverErr) {
          console.error('Error with server API:', serverErr);
        }
        
        setLoading(false);
        return;
      }
      
      console.log('Profile created successfully:', data);
      setProfile(data);
      setLoading(false);
    } catch (err) {
      console.error('Unexpected error in createProfile:', err);
      // Show the full error object for debugging
      if (err instanceof Error) {
        console.error('Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack,
        });
      } else {
        console.error('Non-Error object thrown:', err);
      }
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 