/**
 * This script creates the user_drive_tokens table in Supabase
 * Run it with: node scripts/create_drive_tokens_table.js
 * 
 * Environment variables needed:
 *   SUPABASE_URL - The URL of your Supabase project
 *   SUPABASE_SERVICE_KEY - The service role key for your Supabase project
 */

const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required');
  process.exit(1);
}

// Create Supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTable() {
  console.log('Creating user_drive_tokens table...');

  try {
    // Create the table using PostgreSQL
    const { error } = await supabase.rpc('exec_sql', {
      query: `
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
      `
    });

    if (error) {
      console.error('Error creating table:', error);
      process.exit(1);
    }

    console.log('Table created successfully!');
    console.log('You can now use Google Drive integration in your app.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the function
createTable(); 