'use client';

import { useState, useRef } from 'react';
import { GoogleBookVolume } from '@/types/googleBooks';
import { searchGoogleBooks } from '@/services/googleBooksApi';
import { useTranslation } from '@/hooks/useTranslation';

interface BookSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBook: (book: GoogleBookVolume) => void;
}

export default function BookSearchModal({ isOpen, onClose, onAddBook }: BookSearchModalProps) {
  const _ = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GoogleBookVolume[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<GoogleBookVolume | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const executeSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    setError(null);
    
    try {
      const books = await searchGoogleBooks(query);
      setResults(books);
    } catch (err) {
      setError(_('Failed to search books. Please try again.'));
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeSearch();
    }
  };

  const handleShowBookDetails = (book: GoogleBookVolume) => {
    setSelectedBook(book);
  };

  const handleCloseBookDetails = () => {
    setSelectedBook(null);
  };

  // Focus the input when the modal opens
  if (isOpen && inputRef.current && document.activeElement !== inputRef.current) {
    // Use setTimeout to avoid React warnings about state changes during render
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-4xl max-h-[90vh] bg-base-100 rounded-lg flex flex-col">
        <div className="p-4 border-b border-base-300 flex justify-between items-center">
          <h2 className="text-xl font-bold">{_('Search Books')}</h2>
          <button className="btn btn-sm btn-circle" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="p-4">
          <div className="input-group w-full">
            <input
              ref={inputRef}
              type="text"
              placeholder={_('Search by title, author, or ISBN...')}
              className="input input-bordered w-full"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button 
              className="btn btn-square"
              onClick={executeSearch}
              disabled={isSearching || !query.trim()}
            >
              {isSearching ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-base-content/70 mt-1 ml-1">
            {_('Press Enter to search')}
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {isSearching ? (
            <div className="flex justify-center items-center h-full">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : results.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {query.trim() ? _('No books found') : _('Enter your search terms and press Enter')}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {results.map((book) => (
                <div 
                  key={book.id} 
                  className="card card-compact bg-base-200 shadow-lg hover:shadow-xl transition-shadow cursor-pointer h-full flex flex-col"
                  onClick={() => handleShowBookDetails(book)}
                >
                  <figure className="h-64 bg-base-300 relative">
                    {book.volumeInfo.imageLinks?.thumbnail ? (
                      <img 
                        src={book.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:')} 
                        alt={book.volumeInfo.title}
                        className="h-full object-contain"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-center p-4">
                        {_('No cover available')}
                      </div>
                    )}
                  </figure>
                  <div className="card-body p-3 flex-1 flex flex-col">
                    <h2 className="card-title text-sm line-clamp-2">{book.volumeInfo.title}</h2>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {book.volumeInfo.authors?.join(', ') || _('Unknown author')}
                    </p>
                    <div className="card-actions justify-end mt-auto">
                      <button 
                        className="btn btn-primary btn-xs"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click event
                          onAddBook(book);
                        }}
                      >
                        {_('Add to Library')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Book Details Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl max-h-[90vh] bg-base-100 rounded-lg flex flex-col">
            <div className="p-4 border-b border-base-300 flex justify-between items-center">
              <h2 className="text-xl font-bold">{_('Book Details')}</h2>
              <button className="btn btn-sm btn-circle" onClick={handleCloseBookDetails}>
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 w-full md:w-1/3 flex justify-center md:block">
                  {selectedBook.volumeInfo.imageLinks?.thumbnail ? (
                    <img
                      src={selectedBook.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:')}
                      alt={selectedBook.volumeInfo.title}
                      className="max-h-[40vh] md:max-h-[60vh] w-auto md:w-full md:object-cover object-contain shadow-lg rounded"
                    />
                  ) : (
                    <div className="w-full max-h-[40vh] md:max-h-[60vh] aspect-[2/3] bg-base-300 flex items-center justify-center rounded shadow-lg">
                      <span className="text-lg font-medium p-4 text-center">{selectedBook.volumeInfo.title}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-1">{selectedBook.volumeInfo.title}</h1>
                  {selectedBook.volumeInfo.subtitle && (
                    <p className="text-lg mb-2 text-base-content/80">{selectedBook.volumeInfo.subtitle}</p>
                  )}
                  <p className="text-base-content/70 mb-4">
                    {selectedBook.volumeInfo.authors?.join(', ') || _('Unknown author')}
                  </p>
                  
                  {selectedBook.volumeInfo.description && (
                    <div className="mb-4">
                      <p className="text-sm">{selectedBook.volumeInfo.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                    {selectedBook.volumeInfo.publishedDate && (
                      <div>
                        <span className="text-xs text-base-content/50">{_('Published')}</span>
                        <p className="text-sm">{selectedBook.volumeInfo.publishedDate}</p>
                      </div>
                    )}
                    
                    {selectedBook.volumeInfo.pageCount && (
                      <div>
                        <span className="text-xs text-base-content/50">{_('Pages')}</span>
                        <p className="text-sm">{selectedBook.volumeInfo.pageCount}</p>
                      </div>
                    )}
                    
                    {selectedBook.volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13' || id.type === 'ISBN_10')?.identifier && (
                      <div>
                        <span className="text-xs text-base-content/50">ISBN</span>
                        <p className="text-sm">
                          {selectedBook.volumeInfo.industryIdentifiers.find(id => id.type === 'ISBN_13' || id.type === 'ISBN_10')?.identifier}
                        </p>
                      </div>
                    )}
                    
                    {selectedBook.volumeInfo.publisher && (
                      <div>
                        <span className="text-xs text-base-content/50">{_('Publisher')}</span>
                        <p className="text-sm">{selectedBook.volumeInfo.publisher}</p>
                      </div>
                    )}
                  </div>
                  
                  {selectedBook.volumeInfo.categories && selectedBook.volumeInfo.categories.length > 0 && (
                    <div className="mb-4">
                      <span className="text-xs text-base-content/50">{_('Categories')}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedBook.volumeInfo.categories.map((category, index) => (
                          <span key={index} className="badge badge-outline">{category}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-base-300 flex justify-end">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  onAddBook(selectedBook);
                  handleCloseBookDetails();
                }}
              >
                {_('Add to Library')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 