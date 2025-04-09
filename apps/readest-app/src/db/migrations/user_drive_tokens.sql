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
CREATE TRIGGER update_user_drive_tokens_updated_at
  BEFORE UPDATE ON user_drive_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 