# Setting Up Google Drive Integration

This guide explains how to set up the Google Drive integration for BookTalk, allowing users to store their ebooks in Google Drive and access them across devices.

## Prerequisites

1. A Google Cloud Platform account
2. A Supabase project
3. The BookTalk application code

## Step 1: Set Up Google OAuth

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Library"
4. Enable the Google Drive API
5. Go to "OAuth consent screen"
   - Set up your app information
   - Add scopes: `https://www.googleapis.com/auth/drive.file`, `email`, `profile`
   - Add test users if in "Testing" mode

6. Go to "Credentials" and create an OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: BookTalk
   - Authorized JavaScript origins: Add your app's domain(s)
   - Authorized redirect URIs: Add `https://[your-supabase-project].supabase.co/auth/v1/callback`

7. Copy the Client ID and Client Secret

## Step 2: Configure Supabase Auth

1. In Supabase dashboard, go to Authentication > Providers
2. Enable Google provider
3. Enter your Client ID and Client Secret from Google Cloud
4. Save changes

## Step 3: Create the Database Table

You need to create the `user_drive_tokens` table in your Supabase project. You can do this in one of two ways:

### Option A: Using the SQL Editor

1. Go to the SQL Editor in your Supabase dashboard
2. Run the following SQL:

```sql
-- Create user_drive_tokens table to store Google Drive API tokens and folder information
CREATE TABLE IF NOT EXISTS user_drive_tokens (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expiry_time TIMESTAMP WITH TIME ZONE NOT NULL,
  drive_folder_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE user_drive_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see only their own tokens
CREATE POLICY "Users can only access their own tokens" ON user_drive_tokens
  FOR ALL USING (auth.uid() = id);

-- Create function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at column when a row is updated
DROP TRIGGER IF EXISTS update_user_drive_tokens_updated_at ON user_drive_tokens;
CREATE TRIGGER update_user_drive_tokens_updated_at
  BEFORE UPDATE ON user_drive_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Option B: Using the Helper Script

1. Set the following environment variables:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_KEY`: Your Supabase service role key (NOT the anon key)

2. Run the script:
```bash
node scripts/create_drive_tokens_table.js
```

## Step 4: Test the Integration

1. Start the application
2. Sign in with a Google account
3. During the authentication process, grant permissions for the Drive API
4. The app will create a "BookTalk Library" folder in the user's Google Drive
5. When a user adds an ebook, it will automatically be stored in this folder

## Troubleshooting

### Error: "The user_drive_tokens table does not exist"

This error means the database table hasn't been created yet. Follow Step 3 above to create it.

### Error: "OAuth callback with invalid state"

This typically happens due to:
1. Incorrect redirect URI in Google Cloud Console
2. Using deep links in development mode
3. Browser caching issues

Try the following:
1. Clear your browser cookies and cache
2. Ensure the redirect URI is exactly `https://[your-supabase-project].supabase.co/auth/v1/callback`
3. In development, use the web URL instead of the Tauri deep link

### Error: "Missing drive.file permission"

Ensure you've added the `https://www.googleapis.com/auth/drive.file` scope in both:
1. The Google Cloud Console OAuth consent screen
2. The Supabase Auth provider settings 