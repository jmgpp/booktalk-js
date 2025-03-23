'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Profile } from './database.types';
import { forceSignOut } from '@/utils/auth-utils';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  profileLoading: false,
  signOut: async () => {},
  signIn: async () => ({ error: null }),
  refreshProfile: async () => {},
});

// Flag to prevent multiple redirects
let redirectInProgress = false;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log('AuthProvider initialized');
    let mounted = true;

    // Safety timeout to ensure loading never gets stuck
    const loadingTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.log('Safety timeout: forcing loading state to false after 2 seconds');
        setLoading(false);
      }
    }, 2000);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('Initial session check:', session ? 'Session found' : 'No session');
      setUser(session?.user ?? null);
      
      if (session?.user) {
        getProfile(session.user.id, true);
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
      
      // Handle sign out event specifically
      if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing auth state');
        setUser(null);
        setProfile(null);
        setLoading(false);
        setProfileLoading(false);
        setInitialized(true);
        
        // Ensure we're not in a loop with redirects
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
          console.log('Redirecting to auth page after sign out');
          // Use a consistent approach for navigation
          window.location.href = '/auth?signout=true';
        }
        return;
      }
      
      setUser(session?.user ?? null);
      
      if (session?.user) {
        if (event === 'SIGNED_IN') {
          getProfile(session.user.id, false);
        } else {
          getProfile(session.user.id, false);
        }
      } else {
        setProfile(null);
        setLoading(false);
        setProfileLoading(false);
        setInitialized(true);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  async function getProfile(userId: string, isInitialLoad: boolean) {
    try {
      if (!isInitialLoad) {
        setProfileLoading(true);
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating profile');
          await createProfile(userId, isInitialLoad);
          return;
        }
        
        console.error('Error fetching profile:', error);
        setProfile(null);
        if (isInitialLoad) {
          setLoading(false);
        }
        setProfileLoading(false);
        return;
      }

      console.log('Profile fetched successfully');
      setProfile(data);
      if (isInitialLoad) {
        setLoading(false);
      }
      setProfileLoading(false);
    } catch (err) {
      console.error('Unexpected error in getProfile:', err);
      setProfile(null);
      if (isInitialLoad) {
        setLoading(false);
      }
      setProfileLoading(false);
    }
  }

  async function createProfile(userId: string, isInitialLoad: boolean = false) {
    try {
      console.log('Starting profile creation for user ID:', userId);
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        console.error('Error getting user:', userError);
        if (isInitialLoad) {
          setLoading(false);
        }
        setProfileLoading(false);
        return;
      }
      
      const { user } = userData;
      console.log('Got user data:', { id: user.id, email: user.email });
      
      let username = '';
      if (user.user_metadata && user.user_metadata.username) {
        username = user.user_metadata.username;
      } else if (user.email) {
        username = user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
      } else {
        username = `user_${Math.floor(Math.random() * 10000)}`;
      }
      
      if (!username || username.length < 3) {
        username = `user_${Math.floor(Math.random() * 10000)}`;
      }
      
      let hasEmailColumn = true;
      try {
        const { data: columns } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_name', 'profiles')
          .eq('table_schema', 'public');
          
        console.log('Available columns:', columns);
        
        if (columns) {
          hasEmailColumn = columns.some(col => col.column_name === 'email');
        }
      } catch (err) {
        console.error('Error checking columns:', err);
      }
      
      const profileData: any = {
        id: userId,
        username: username,
      };
      
      if (hasEmailColumn && user.email) {
        profileData.email = user.email;
      }
      
      console.log('Creating profile with data:', profileData);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error creating profile:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (!fetchError && existingProfile) {
          console.log('Profile already exists:', existingProfile);
          setProfile(existingProfile);
          if (isInitialLoad) {
            setLoading(false);
          }
          setProfileLoading(false);
          return;
        }
        
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
              if (isInitialLoad) {
                setLoading(false);
              }
              setProfileLoading(false);
              return;
            }
          }
        } catch (serverErr) {
          console.error('Error with server API:', serverErr);
        }
        
        if (isInitialLoad) {
          setLoading(false);
        }
        setProfileLoading(false);
        return;
      }
      
      const { data: newProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching new profile:', fetchError);
        if (isInitialLoad) {
          setLoading(false);
        }
        setProfileLoading(false);
        return;
      }
      
      console.log('Profile created and fetched successfully');
      setProfile(newProfile);
      if (isInitialLoad) {
        setLoading(false);
      }
      setProfileLoading(false);
    } catch (err) {
      console.error('Unexpected error in createProfile:', err);
      if (isInitialLoad) {
        setLoading(false);
      }
      setProfileLoading(false);
    }
  }

  // Add a signOut function that can be used throughout the app
  async function signOut() {
    console.log('SignOut called from auth context');
    try {
      // Attempt normal signout first
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Error in normal sign out:', error);
      
      // Force clear state immediately
      setUser(null);
      setProfile(null);
      
      // Use the forceful signout utility to ensure all auth data is cleared
      await forceSignOut();
    } catch (error) {
      console.error('Error in auth context signOut:', error);
      // Still try the force signout even if there was an error
      await forceSignOut();
    }
  }

  // Add a signIn function for use in sign-in form
  async function signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('SignIn error:', error);
        return { error };
      }

      console.log('SignIn successful, user:', data.user?.id);
      return { error: null };
    } catch (error) {
      console.error('Unexpected error in signIn:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error during sign in') };
    }
  }

  // Insert refreshProfile function in the AuthProvider component
  async function refreshProfile() {
    if (!user) return;
    
    try {
      setProfileLoading(true);
      await getProfile(user.id, false);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setProfileLoading(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        profileLoading,
        signOut,
        signIn,
        refreshProfile,
      }}
    >
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