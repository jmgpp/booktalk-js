'use client';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { IoArrowBack } from 'react-icons/io5';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase';
import { useEnv } from '@/context/EnvContext';
import { useThemeStore } from '@/store/themeStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useTrafficLightStore } from '@/store/trafficLightStore';
import { isTauriAppPlatform } from '@/services/environment';
import { handleAuthCallback } from '@/helpers/auth';
import { READEST_WEB_BASE_URL } from '@/services/constants';
import WindowButtons from '@/components/WindowButtons';

const WEB_AUTH_CALLBACK = `${READEST_WEB_BASE_URL}/auth/callback`;
const DEEPLINK_CALLBACK = 'readest://auth-callback';

export default function AuthPage() {
  const _ = useTranslation();
  const router = useRouter();
  const { login } = useAuth();
  const { envConfig, appService } = useEnv();
  const { isDarkMode } = useThemeStore();
  const { isTrafficLightVisible } = useTrafficLightStore();
  const { settings, setSettings, saveSettings } = useSettingsStore();
  const [isMounted, setIsMounted] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  const getTauriRedirectTo = (isOAuth: boolean) => {
    return DEEPLINK_CALLBACK;
  };

  const getWebRedirectTo = () => {
    return process.env.NODE_ENV === 'production'
      ? WEB_AUTH_CALLBACK
      : `${window.location.origin}/auth/callback`;
  };

  const handleGoBack = () => {
    settings.keepLogin = false;
    setSettings(settings);
    saveSettings(envConfig, settings);
    router.back();
  };

  const getAuthLocalization = () => {
    return {
      variables: {
        sign_in: {
          email_label: _('Email address'),
          password_label: _('Your Password'),
          email_input_placeholder: _('Your email address'),
          password_input_placeholder: _('Your password'),
          button_label: _('Sign in'),
          loading_button_label: _('Signing in...'),
          social_provider_text: _('Sign in with {{provider}}'),
          link_text: _('Already have an account? Sign in'),
        },
        sign_up: {
          email_label: _('Email address'),
          password_label: _('Create a Password'),
          email_input_placeholder: _('Your email address'),
          password_input_placeholder: _('Your password'),
          button_label: _('Sign up'),
          loading_button_label: _('Signing up...'),
          social_provider_text: _('Sign in with {{provider}}'),
          link_text: _('Don\'t have an account? Sign up'),
          confirmation_text: _('Check your email for the confirmation link'),
        },
        magic_link: {
          email_input_label: _('Email address'),
          email_input_placeholder: _('Your email address'),
          button_label: _('Sign in'),
          loading_button_label: _('Signing in ...'),
          link_text: _('Send a magic link email'),
          confirmation_text: _('Check your email for the magic link'),
        },
        forgotten_password: {
          email_label: _('Email address'),
          password_label: _('Your Password'),
          email_input_placeholder: _('Your email address'),
          button_label: _('Send reset password instructions'),
          loading_button_label: _('Sending reset instructions ...'),
          link_text: _('Forgot your password?'),
          confirmation_text: _('Check your email for the password reset link'),
        },
        verify_otp: {
          email_input_label: _('Email address'),
          email_input_placeholder: _('Your email address'),
          phone_input_label: _('Phone number'),
          phone_input_placeholder: _('Your phone number'),
          token_input_label: _('Token'),
          token_input_placeholder: _('Your OTP token'),
          button_label: _('Verify token'),
          loading_button_label: _('Signing in ...'),
        },
      },
    };
  };

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token && session.user) {
        login(session.access_token, session.user);
        const redirectTo = new URLSearchParams(window.location.search).get('redirect');
        router.push(redirectTo ?? '/home');
      }
    });

    return () => {
      subscription?.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div
      className={clsx(
        'fixed inset-0 z-0 flex select-none flex-col items-center overflow-y-auto',
        'bg-base-100 border-base-200 border',
        appService?.hasSafeAreaInset && isTauriAppPlatform() && 'pt-[env(safe-area-inset-top)]',
      )}
      style={!isTauriAppPlatform() ? { maxWidth: '420px', margin: 'auto', padding: '2rem', paddingTop: '4rem' } : {}}
    >
      <div
        ref={headerRef}
        className={clsx(
          'fixed z-10 flex w-full items-center justify-between py-2 pe-6 ps-4',
          appService?.hasTrafficLight && isTauriAppPlatform() && 'pt-11',
          !isTauriAppPlatform() && 'top-6 left-6'
        )}
      >
        <button onClick={handleGoBack} className={clsx('btn btn-ghost h-8 min-h-8 w-8 p-0')}>
          <IoArrowBack className='text-base-content' />
        </button>

        {isTauriAppPlatform() && appService?.hasWindowBar && (
          <WindowButtons
            headerRef={headerRef}
            showMinimize={!isTrafficLightVisible}
            showMaximize={!isTrafficLightVisible}
            showClose={!isTrafficLightVisible}
            onClose={handleGoBack}
          />
        )}
      </div>
      <div
        className={clsx(
          'z-20 pb-8',
          isTauriAppPlatform() ? (appService?.hasTrafficLight ? 'mt-24' : 'mt-12') : 'mt-0',
        )}
        style={{ maxWidth: '420px' }}
      >
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme={isDarkMode ? 'dark' : 'light'}
          providers={[]}
          view="sign_in"
          showLinks={true}
          redirectTo={isTauriAppPlatform() ? getTauriRedirectTo(false) : getWebRedirectTo()}
          localization={getAuthLocalization()}
        />
      </div>
    </div>
  );
}
