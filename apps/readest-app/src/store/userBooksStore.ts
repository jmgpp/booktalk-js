import { create } from 'zustand';
import { UserBook } from '@/types/userBook';
import { GoogleBookVolume } from '@/types/googleBooks';
import { getUserBooks, addBookToLibrary, updateUserBook, removeBookFromLibrary } from '@/services/userBookService';

interface UserBooksState {
  userBooks: UserBook[];
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  fetchUserBooks: (userId: string) => Promise<void>;
  addBook: (googleBook: GoogleBookVolume, userId: string) => Promise<UserBook>;
  updateBook: (book: Partial<UserBook> & { id: string }) => Promise<void>;
  removeBook: (bookId: string) => Promise<void>;
  clearError: () => void;
}

export const useUserBooksStore = create<UserBooksState>((set, get) => ({
  userBooks: [],
  isLoading: false,
  error: null,
  
  fetchUserBooks: async (userId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const books = await getUserBooks(userId);
      set({ userBooks: books, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      console.error('Error fetching user books:', error);
    }
  },
  
  addBook: async (googleBook: GoogleBookVolume, userId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const newBook = await addBookToLibrary(googleBook, userId);
      set(state => ({ 
        userBooks: [...state.userBooks, newBook], 
        isLoading: false 
      }));
      return newBook;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      console.error('Error adding book to library:', error);
      throw error;
    }
  },
  
  updateBook: async (book: Partial<UserBook> & { id: string }) => {
    try {
      const updatedBook = await updateUserBook(book);
      set(state => ({
        userBooks: state.userBooks.map(b => 
          b.id === updatedBook.id ? updatedBook : b
        )
      }));
    } catch (error) {
      set({ error: error as Error });
      console.error('Error updating book:', error);
    }
  },
  
  removeBook: async (bookId: string) => {
    try {
      await removeBookFromLibrary(bookId);
      set(state => ({
        userBooks: state.userBooks.filter(b => b.id !== bookId)
      }));
    } catch (error) {
      set({ error: error as Error });
      console.error('Error removing book:', error);
    }
  },
  
  clearError: () => set({ error: null })
})); 