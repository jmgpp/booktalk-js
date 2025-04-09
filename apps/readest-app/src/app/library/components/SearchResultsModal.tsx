'use client';

import React, { useState, useEffect } from 'react';
import { GoogleBookVolume } from '@/types/googleBooks';
import SearchResultsList from './SearchResultsList';
import BookSearchBar from './BookSearchBar';

interface SearchResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery: string;
  searchResults: GoogleBookVolume[];
  isLoading: boolean;
  error: string | null;
  onAddBook: (book: GoogleBookVolume) => void;
  onSearchInModal: (query: string) => void;
}

const SearchResultsModal: React.FC<SearchResultsModalProps> = ({ 
  isOpen, 
  onClose, 
  initialQuery,
  searchResults, 
  isLoading, 
  error, 
  onAddBook, 
  onSearchInModal 
}) => {
  return (
    <dialog className={`modal modal-bottom sm:modal-middle ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box w-full max-w-5xl h-full sm:h-auto sm:max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Search Results</h3>
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onClose}>✕</button>
        </div>

        <div className="mb-4 sticky top-0 bg-base-100 z-10 py-2">
           <BookSearchBar 
              onSearch={onSearchInModal} 
              isLoading={isLoading} 
           />
        </div>
        
        <div className="overflow-y-auto max-h-[calc(100vh-180px)] sm:max-h-[calc(90vh-160px)]">
          {error && !isLoading && (
            <div className="alert alert-error shadow-lg mt-4">
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2 2m2-2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Error: {error}</span>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            !error && <SearchResultsList 
              searchResults={searchResults}
              isLoading={false} 
              error={null}
              onAddBook={onAddBook} 
            />
          )}
          
          {!isLoading && !error && searchResults.length === 0 && (
            <p className="text-center text-gray-500 py-4">No books found matching your search.</p>
          )}
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

export default SearchResultsModal; 