import { User } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';

interface UseAuthCallbackOptions {
  accessToken?: string | null;
  refreshToken?: string | null;
  login: (accessToken: string, user: User) => void;
  navigate: (path: string) => void;
  type?: string | null;
  next?: string;
  error?: string | null;
  errorCode?: string | null;
  errorDescription?: string | null;
  // Additional properties for Google OAuth
  provider?: string | null;
  providerToken?: string | null;
  providerRefreshToken?: string | null;
  expiresIn?: number | null;
}

export function handleAuthCallback({
  accessToken,
  refreshToken,
  login,
  navigate,
  type,
  next = '/',
  error,
  errorCode,
  errorDescription,
  provider,
  providerToken,
  providerRefreshToken,
  expiresIn,
}: UseAuthCallbackOptions) {
  async function finalizeSession() {
    // Handle specific OAuth errors
    if (error) {
      console.error(`Auth error: ${error}`, { errorCode, errorDescription });
      
      // Handle bad_oauth_state error specifically - this is common with OAuth flows
      if (errorCode === 'bad_oauth_state') {
        console.log('Detected bad OAuth state, redirecting to auth page for fresh login');
        navigate('/auth');
        return;
      }
      
      // Handle other errors
      navigate('/auth/error');
      return;
    }

    // If there are no tokens but also no error, we need to check if we're already logged in
    if (!accessToken || !refreshToken) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          // User is already authenticated, proceed to the app
          login(data.session.access_token, data.session.user);
          navigate('/home');
          return;
        } else {
          // No existing session found, redirect to login
          navigate('/auth');
          return;
        }
      } catch (sessionError) {
        console.error('Error checking existing session:', sessionError);
        navigate('/auth');
        return;
      }
    }

    // Set the session with the new tokens
    const { error: err } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (err) {
      console.error('Error setting session:', err);
      navigate('/auth/error');
      return;
    }

    // Get the user data after setting the session
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      login(accessToken, user);
      
      // Store Google Drive tokens if this is a Google OAuth login
      if (provider === 'google' && providerToken && providerRefreshToken && expiresIn) {
        try {
          // Calculate expiry time
          const expiryTime = new Date();
          expiryTime.setSeconds(expiryTime.getSeconds() + expiresIn);
          
          // Check if the user_drive_tokens table exists
          const { error: checkError } = await supabase
            .from('user_drive_tokens')
            .select('id')
            .limit(1)
            .single();
          
          // If we get a 404 error, it means the table doesn't exist yet
          if (checkError && (checkError.code === 'PGRST116' || checkError.message.includes('does not exist'))) {
            console.error('The user_drive_tokens table does not exist yet. Create it in Supabase dashboard');
            // Continue without storing tokens - we'll store them later when table exists
          } else {
            // Table exists, store the tokens
            const { error: tokenError } = await supabase
              .from('user_drive_tokens')
              .upsert({
                id: user.id,
                access_token: providerToken,
                refresh_token: providerRefreshToken,
                expiry_time: expiryTime.toISOString(),
              });
              
            if (tokenError) {
              console.error('Error storing Google Drive tokens:', tokenError);
            }
          }
        } catch (tokenErr) {
          console.error('Failed to store Google Drive tokens:', tokenErr);
        }
      }
      
      if (type === 'recovery') {
        navigate('/auth/recovery');
        return;
      }
      navigate(next);
    } else {
      console.error('Error fetching user data');
      navigate('/auth/error');
    }
  }

  finalizeSession();
}
