'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useUserBooksStore } from '@/store/userBooksStore';
import { UserBook } from '@/types/userBook';
import { GoogleBookVolume } from '@/types/googleBooks';
import { useTranslation } from '@/hooks/useTranslation';
import BookSearchModal from '@/app/library/components/BookSearchModal';
import BookDetailsModal from '@/app/library/components/BookDetailsModal';
import UserBookGrid from '@/app/library/components/UserBookGrid';

export default function LibraryPage() {
  const { user } = useAuth();
  const { userBooks, isLoading, error, fetchUserBooks, addBook, clearError } = useUserBooksStore();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<UserBook | null>(null);
  const _ = useTranslation();

  useEffect(() => {
    if (user) {
      fetchUserBooks(user.id);
    }
  }, [user, fetchUserBooks]);

  const handleAddBook = async (googleBook: GoogleBookVolume) => {
    if (!user) return;
    try {
      await addBook(googleBook, user.id);
      setSearchModalOpen(false);
    } catch (error) {
      console.error('Error adding book:', error);
    }
  };

  const handleOpenBookDetails = (book: UserBook) => {
    setSelectedBook(book);
  };

  const handleCloseBookDetails = () => {
    setSelectedBook(null);
  };

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-3xl font-bold">Welcome to BookTalk</h1>
          <p className="text-lg text-gray-600">Please sign in to access your library</p>
        </div>
        <Link href="/auth/login" className="btn btn-primary">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <header className="bg-base-100 shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/home" className="btn btn-sm btn-ghost">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {_("Back")}
              </Link>
              <div>
                <h1 className="text-2xl font-bold">My Library</h1>
                <p className="text-sm text-base-content/70">Manage your books</p>
              </div>
            </div>
            
            <div className="w-full sm:w-auto flex gap-2 justify-end">
              <button 
                className="btn btn-primary"
                onClick={() => setSearchModalOpen(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {_("Search Books")}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="alert alert-error mb-6">
            <div className="flex justify-between w-full">
              <span>{error.message}</span>
              <button 
                className="btn btn-ghost btn-sm"
                onClick={clearError}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : userBooks.length > 0 ? (
          <UserBookGrid books={userBooks} onBookClick={handleOpenBookDetails} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Your library is empty</h2>
            <p className="text-base-content/70 mb-6 max-w-md">
              Start building your collection by searching for books and adding them to your library
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => setSearchModalOpen(true)}
            >
              Search for Books
            </button>
          </div>
        )}
      </main>
      
      {/* Modals */}
      <BookSearchModal 
        isOpen={searchModalOpen} 
        onClose={() => setSearchModalOpen(false)} 
        onAddBook={handleAddBook} 
      />
      
      {selectedBook && (
        <BookDetailsModal 
          book={selectedBook} 
          isOpen={!!selectedBook} 
          onClose={handleCloseBookDetails} 
        />
      )}
    </div>
  );
}
