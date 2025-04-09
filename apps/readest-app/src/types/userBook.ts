import { GoogleBookVolume } from './googleBooks';

/**
 * Possible statuses for a book in the user's library
 */
export type BookStatus = 'want_to_read' | 'reading' | 'read' | 'dnf';

/**
 * UserBook represents a book in a user's library with both
 * Google Books data and user-specific data
 */
export interface UserBook {
  id: string;              // Database record ID
  user_id: string;         // User ID from Supabase auth
  google_book_id: string;  // ID from Google Books
  
  // Google Books data (cached)
  title: string;
  authors: string[];
  description?: string;
  thumbnail_url?: string;
  published_date?: string;
  isbn?: string;
  page_count?: number;
  
  // User-specific data
  status?: BookStatus;
  rating?: number;         // 1-5 stars
  review?: string;
  progress?: number;       // 0-100 percentage
  shelf?: string;          // Future implementation
  hasfile: boolean;        // Whether this book has an associated file
  
  // Metadata
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  
  // For compatibility with existing code
  hasFile?: boolean;       // Alias for hasfile
}

/**
 * Create a new UserBook object from a Google Books volume
 */
export function createUserBookFromGoogleBook(
  googleBook: GoogleBookVolume, 
  userId: string
): Omit<UserBook, 'id' | 'created_at' | 'updated_at'> {
  // Find ISBN if available
  const isbn = googleBook.volumeInfo.industryIdentifiers?.find(
    id => id.type === 'ISBN_13' || id.type === 'ISBN_10'
  )?.identifier;
  
  return {
    user_id: userId,
    google_book_id: googleBook.id,
    
    title: googleBook.volumeInfo.title,
    authors: googleBook.volumeInfo.authors || [],
    description: googleBook.volumeInfo.description,
    thumbnail_url: googleBook.volumeInfo.imageLinks?.thumbnail,
    published_date: googleBook.volumeInfo.publishedDate,
    isbn,
    page_count: googleBook.volumeInfo.pageCount,
    
    status: 'want_to_read',
    progress: 0,
    hasfile: false,
  };
} 