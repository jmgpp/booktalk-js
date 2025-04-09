import { supabase } from '@/lib/supabase/client';
import { UserBook, createUserBookFromGoogleBook } from '@/types/userBook';
import { GoogleBookVolume } from '@/types/googleBooks';

/**
 * Get all books in the user's library
 */
export async function getUserBooks(userId: string): Promise<UserBook[]> {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return [];
  }
  
  const { data, error } = await supabase
    .from('user_books')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null);
    
  if (error) {
    console.error('Error fetching user books:', error);
    throw error;
  }
  
  const books = data || [];
  
  // Check which books have files on this device
  // Simpler check now: Just rely on the hasfile flag from the DB
  // The deviceBookService now handles storing the path correctly for the current device
  const booksWithFileStatus = books.map(book => {
      // No need for the hasBookFile check here anymore, 
      // the hasfile flag on the book record is the source of truth
      return { ...book }; 
  });
  
  return booksWithFileStatus;
}

/**
 * Add a book from Google Books API to the user's library
 */
export async function addBookToLibrary(googleBook: GoogleBookVolume, userId: string): Promise<UserBook> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  const userBook = createUserBookFromGoogleBook(googleBook, userId);
  
  // Check if book already exists
  const { data: existingBooks } = await supabase
    .from('user_books')
    .select('*')
    .eq('user_id', userId)
    .eq('google_book_id', googleBook.id)
    .limit(1);
    
  if (existingBooks && existingBooks.length > 0) {
    // If book was soft deleted, restore it
    if (existingBooks[0].deleted_at) {
      const { data, error } = await supabase
        .from('user_books')
        .update({ deleted_at: null, updated_at: new Date().toISOString() })
        .eq('id', existingBooks[0].id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Otherwise return existing book
      return { ...existingBooks[0] };
    }
    
    // Otherwise return existing book
    return { ...existingBooks[0] };
  }
  
  // Insert new book
  const { data, error } = await supabase
    .from('user_books')
    .insert({
      ...userBook,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error adding book to library:', error);
    throw error;
  }
  
  // New book won't have a file yet
  return { ...data, hasFile: false };
}

/**
 * Update a book in the user's library
 */
export async function updateUserBook(book: Partial<UserBook> & { id: string }): Promise<UserBook> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  const { data, error } = await supabase
    .from('user_books')
    .update({
      ...book,
      updated_at: new Date().toISOString()
    })
    .eq('id', book.id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating user book:', error);
    throw error;
  }
  
  // Return the updated data from DB - hasFile flag is handled by DB/saveDeviceBookFilePath
  return { ...data };
}

/**
 * Remove a book from the user's library (soft delete)
 */
export async function removeBookFromLibrary(bookId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  // Soft delete
  const { error } = await supabase
    .from('user_books')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', bookId);
    
  if (error) {
    console.error('Error removing book from library:', error);
    throw error;
  }
} 