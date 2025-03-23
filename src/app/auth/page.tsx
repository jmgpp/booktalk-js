'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { SignInForm } from '@/components/auth/sign-in-form';
import { SignUpForm } from '@/components/auth/sign-up-form';
import { Logo } from "@/components/ui/logo"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthPage() {
  const [signOutComplete, setSignOutComplete] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, profileLoading } = useAuth();
  const isSignOut = searchParams.has('signout');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  // Simulate quicker initial render
  useEffect(() => {
    // After first render, we can mark initial load as done
    setIsInitialLoad(false);
  }, []);

  // Check for signout parameter and ensure we're fully signed out
  useEffect(() => {
    if (isSignOut && !signOutComplete) {
      console.log('Sign out detected in auth page, ensuring clean state');
      
      // Force a second signout to be sure
      const performSecondSignOut = async () => {
        try {
          // Clear any remaining auth state
          await supabase.auth.signOut();
          
          // Clear any Supabase items in localStorage
          for (const key of Object.keys(localStorage)) {
            if (key.startsWith('sb-') || key.includes('supabase')) {
              localStorage.removeItem(key);
            }
          }
          
          // Mark signout as complete
          setSignOutComplete(true);
          console.log('Secondary sign out completed successfully');
        } catch (error) {
          console.error('Error in secondary sign out:', error);
        }
      };
      
      performSecondSignOut();
    }
  }, [searchParams, signOutComplete, isSignOut]);

  // Handle navigation when user logs in
  useEffect(() => {
    if (user && !loading && !isSignOut && !redirecting) {
      console.log('User authenticated, preparing to redirect to homepage');
      
      // Set redirecting flag to prevent UI flashing
      setRedirecting(true);
      setSuccessMessage('Login successful! Redirecting to dashboard...');
      
      // Short delay before redirect to allow for smooth transition
      const redirectTimeout = setTimeout(() => {
        console.log('Redirecting to homepage now');
        
        // Try Next.js router first
        router.push('/');
        
        // Set a fallback with direct navigation after a brief delay
        // This ensures we navigate even if the router method fails
        const fallbackTimeout = setTimeout(() => {
          if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth')) {
            console.log('Using fallback navigation method');
            window.location.href = '/';
          }
        }, 500);
        
        return () => clearTimeout(fallbackTimeout);
      }, 1000); // Increased from 800ms to 1000ms
      
      return () => clearTimeout(redirectTimeout);
    }
  }, [user, loading, router, isSignOut, redirecting]);

  // Add a safety mechanism to ensure we get to the homepage
  useEffect(() => {
    if (redirecting) {
      // Force navigation after 3 seconds if we're still on the auth page
      const safetyTimeout = setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth')) {
          console.log('Safety redirect activated - forcing navigation to homepage');
          window.location.href = '/';
        }
      }, 3000);
      
      return () => clearTimeout(safetyTimeout);
    }
  }, [redirecting]);

  // Determine card text based on auth state
  const getCardTitle = () => {
    if (redirecting) return "Login Successful";
    if (isSignOut && signOutComplete) return "You've been signed out";
    return "Welcome";
  };

  const getCardDescription = () => {
    if (redirecting) return "You will be redirected to the dashboard momentarily";
    if (isSignOut && signOutComplete) return "Sign in to your account to continue";
    return "Sign in to your account or create a new one";
  };

  // Show an optimized loading state only during the true loading phase
  if (loading && !isInitialLoad) {
    return (
      <div className="min-h-screen bg-palette-darkPurple flex flex-col items-center justify-center p-4">
        <div className="text-center mb-6">
          <div className="animate-pulse mb-4">
            <Logo size="large" className="mx-auto" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-palette-textLight">Loading...</h1>
          <p className="text-palette-textLight/70">Please wait while we check your authentication status.</p>
        </div>
      </div>
    );
  }
  
  // If we're in the process of redirecting, show a clean redirect message
  if (redirecting) {
    return (
      <div className="min-h-screen bg-palette-darkPurple flex flex-col items-center justify-center p-4">
        <div className="text-center mb-6">
          <div className="mb-4">
            <Logo size="large" className="mx-auto" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-palette-textLight">Login Successful</h1>
          <p className="text-palette-textLight/70">Redirecting to dashboard...</p>
          <div className="mt-4 flex justify-center">
            <div className="w-16 h-1 bg-palette-purple rounded-full overflow-hidden">
              <div className="h-full bg-palette-pink animate-[progress_1s_ease-in-out_infinite]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-palette-darkPurple flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <Logo size="large" className="mx-auto mb-4" />
          <p className="text-lg text-palette-textLight/70 mt-2">Share and discuss your favorite books</p>
        </div>
        
        <Card className="border-palette-purple bg-palette-darkPurpleLight">
          <CardHeader className="pb-2">
            <CardTitle className="text-center text-2xl text-palette-textLight">
              {getCardTitle()}
            </CardTitle>
            <CardDescription className="text-center text-palette-textLight/70">
              {getCardDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {successMessage ? (
              <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-md text-center">
                <p className="text-green-400">{successMessage}</p>
              </div>
            ) : (
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="w-full mb-6 bg-palette-purple/30">
                  <TabsTrigger 
                    value="signin" 
                    className="flex-1 data-[state=active]:bg-palette-pink data-[state=active]:text-white"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup"
                    className="flex-1 data-[state=active]:bg-palette-pink data-[state=active]:text-white"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  <SignInForm onSuccess={() => {
                    setSuccessMessage('Login successful! Redirecting to dashboard...');
                    setRedirecting(true);
                  }} />
                </TabsContent>
                
                <TabsContent value="signup">
                  <SignUpForm />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
        
        <p className="text-center mt-8 text-palette-textLight/50 text-sm">
          &copy; 2023 BookTalk. All rights reserved.
        </p>
      </div>
    </div>
  );
} 