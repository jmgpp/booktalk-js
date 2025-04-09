# Google Books API Integration for BookTalk

This directory contains the implementation of the Google Books API integration for the BookTalk library. This integration allows users to search for books and add them to their personal library.

## Features

- Search for books using the Google Books API
- View book details including cover, title, author, description, etc.
- Add books to personal library
- Manage reading status (want to read, reading, read, DNF)
- Rate books (1-5 stars)
- Write reviews

## Setup

### 1. Set up the Supabase database table

Run the SQL migration script in the `src/db/migration.sql` file to create the necessary database table.

```sql
-- Create user_books table
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
```

### 2. Install dependencies

No additional dependencies are required for the Google Books API integration.

## Files and Components

- `/services/googleBooksApi.ts` - API service for interacting with Google Books API
- `/services/userBookService.ts` - Service for managing user's books in the database
- `/store/userBooksStore.ts` - Zustand store for managing user books state
- `/types/userBook.ts` - Types for user books
- `/types/googleBooks.ts` - Types for Google Books API response
- `/app/library/page.tsx` - Main library page
- `/app/library/components/BookSearchModal.tsx` - Modal for searching and adding books
- `/app/library/components/BookDetailsModal.tsx` - Modal for viewing and editing book details
- `/app/library/components/UserBookGrid.tsx` - Grid display for user's books

## Usage

1. Navigate to the library page
2. Click the "Search Books" button
3. Enter search terms in the modal that appears
4. Click on a book to add it to your library
5. Click on a book in your library to view details, add a rating, review, etc.

## Implementation Notes

- The Google Books data is cached in the database to minimize API calls
- Images from Google Books API are automatically fixed to use HTTPS
- User-specific data (status, rating, review) is stored separately from the book data
- Soft deletion is implemented to allow for recovery of deleted books 