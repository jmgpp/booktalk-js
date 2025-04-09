-- Create user_books table for storing books from Google Books API
CREATE TABLE IF NOT EXISTS user_books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  google_book_id TEXT NOT NULL,
  
  -- Google Books data (cached)
  title TEXT NOT NULL,
  authors TEXT[] NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  published_date TEXT,
  isbn TEXT,
  page_count INTEGER,
  
  -- User-specific data
  status TEXT CHECK (status IN ('want_to_read', 'reading', 'read', 'dnf')),
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  review TEXT,
  progress INTEGER CHECK (progress IS NULL OR (progress >= 0 AND progress <= 100)),
  shelf TEXT,
  hasFile BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure each user can only have one entry for each Google book
  UNIQUE(user_id, google_book_id)
);

-- Add policy for row-level security
CREATE POLICY "Users can only access their own books"
  ON user_books
  FOR ALL
  USING (auth.uid() = user_id);

-- Enable row-level security
ALTER TABLE user_books ENABLE ROW LEVEL SECURITY; 