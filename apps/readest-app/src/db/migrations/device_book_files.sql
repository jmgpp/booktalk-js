-- Create device_book_files table to track book files across devices
CREATE TABLE IF NOT EXISTS device_book_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_book_id UUID NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  original_file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_format TEXT NOT NULL,
  is_web_loaded BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Each book can only have one file per device
  UNIQUE(user_book_id, device_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_device_book_files_user_book_id ON device_book_files(user_book_id);
CREATE INDEX IF NOT EXISTS idx_device_book_files_device_id ON device_book_files(device_id);

-- Add RLS policies
ALTER TABLE device_book_files ENABLE ROW LEVEL SECURITY;

-- Users can only see their own book files
CREATE POLICY device_book_files_select_policy ON device_book_files 
  FOR SELECT 
  USING (
    user_book_id IN (
      SELECT id FROM user_books WHERE user_id = auth.uid()
    )
  );

-- Users can only insert their own book files
CREATE POLICY device_book_files_insert_policy ON device_book_files 
  FOR INSERT 
  WITH CHECK (
    user_book_id IN (
      SELECT id FROM user_books WHERE user_id = auth.uid()
    )
  );

-- Users can only update their own book files
CREATE POLICY device_book_files_update_policy ON device_book_files 
  FOR UPDATE 
  USING (
    user_book_id IN (
      SELECT id FROM user_books WHERE user_id = auth.uid()
    )
  );

-- Users can only delete their own book files
CREATE POLICY device_book_files_delete_policy ON device_book_files 
  FOR DELETE 
  USING (
    user_book_id IN (
      SELECT id FROM user_books WHERE user_id = auth.uid()
    )
  ); 