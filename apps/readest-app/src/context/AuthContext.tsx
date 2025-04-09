'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';
import posthog from 'posthog-js';
import { createBookTalkFolder } from '@/services/googleDrive';

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  });
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const userJson = localStorage.getItem('user');
      return userJson ? JSON.parse(userJson) : null;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize user's Google Drive folder
  useEffect(() => {
    if (user) {
      const initializeDriveFolder = async () => {
        try {
          // Check if user has Google authentication
          const { data: tokenData, error } = await supabase
            .from('user_drive_tokens')
            .select('*')
            .eq('id', user.id)
            .single();
          
          // Only proceed if we successfully found tokens (no error)
          if (tokenData && !error) {
            // User has Google authentication, create folder if needed
            await createBookTalkFolder();
          }
        } catch (error) {
          // User might not have Google authentication yet or table doesn't exist
          console.log('No Google Drive tokens found for user or table does not exist');
        }
      };
      
      initializeDriveFolder();
    }
  }, [user]);

  useEffect(() => {
    let initialCheckDone = false;

    const syncSession = (
      session: { access_token: string; refresh_token: string; user: User } | null,
      markLoadingComplete: boolean = false,
    ) => {
      console.log(session ? 'Syncing session' : 'Clearing session');
      if (session) {
        const { access_token, refresh_token, user } = session;
        localStorage.setItem('token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        localStorage.setItem('user', JSON.stringify(user));
        posthog.identify(user.id);
        setToken(access_token);
        setUser(user);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
      if (markLoadingComplete || initialCheckDone) {
          setIsLoading(false);
          initialCheckDone = true;
      }
    };

    const refreshSession = async () => {
      try {
        await supabase.auth.refreshSession();
      } catch (error){
        console.warn('Refresh session failed:', error);
        syncSession(null, true); 
      } finally {
        if (!initialCheckDone) {
             setIsLoading(false);
             initialCheckDone = true;
        }
      }
    };

    const { data: subscription } = supabase.auth.onAuthStateChange((_, session) => {
        syncSession(session, true); 
    });

    refreshSession(); 

    return () => {
      subscription?.subscription.unsubscribe();
    };
  }, []);

  const login = (newToken: string, newUser: User) => {
    console.log('Logging in');
    setToken(newToken);
    setUser(newUser);
    setIsLoading(false);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = async () => {
    console.log('Logging out');
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
