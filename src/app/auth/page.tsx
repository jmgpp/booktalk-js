'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { SignInForm } from '@/components/auth/sign-in-form';
import { SignUpForm } from '@/components/auth/sign-up-form';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // If user is already logged in, redirect to home page
    if (user && !loading) {
      console.log('User already logged in, redirecting to homepage');
      router.replace('/');
    }
  }, [user, loading, router]);

  // If loading, show a loading indicator
  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="loading-content">
              <h1 className="loading-title">Loading...</h1>
              <p className="loading-message">Please wait while we check your authentication status.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is logged in, show a redirecting message
  if (user) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="loading-content">
              <h1 className="loading-title">Already logged in</h1>
              <p className="loading-message">Redirecting to dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">📚</div>
            <h1 className="auth-title">BookTalk</h1>
            <h2 className="auth-subtitle">Share and discuss your favorite books</h2>
          </div>

          <div className="auth-content">
            <div className="auth-tabs">
              <button
                onClick={() => setActiveTab('signin')}
                className={activeTab === 'signin' ? 'active' : ''}
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={activeTab === 'signup' ? 'active' : ''}
              >
                Sign Up
              </button>
            </div>

            <div className="auth-form-container">
              {activeTab === 'signin' ? <SignInForm /> : <SignUpForm />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 