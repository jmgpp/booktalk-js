import React from 'react';
import { GoogleBookVolume } from '@/types/googleBooks'; // Import the type

interface SearchResultsListProps {
  searchResults: GoogleBookVolume[];
  isLoading: boolean;
  error: string | null;
  onAddBook: (book: GoogleBookVolume) => void; // Callback to add a book
}

const SearchResultsList: React.FC<SearchResultsListProps> = ({ 
  searchResults, 
  isLoading, 
  error, 
  onAddBook 
}) => {

  // Loading and initial empty state are handled by the modal component
  if (searchResults.length === 0) {
    // This might briefly show if results are cleared before new ones load,
    // but primarily the modal handles the "no results found" message.
    return null; 
  }

  return (
    // Adjust grid columns: 2 on smallest, 3 on sm and up
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-1">
      {searchResults.map((book) => (
        // Card with vertical emphasis
        <div key={book.id} className="card card-compact bg-base-100 shadow-xl overflow-hidden">
          {/* Figure takes significant portion, maintains aspect ratio */}
          <figure className="aspect-[2/3] bg-base-300 flex items-center justify-center text-neutral-content">
            {book.volumeInfo.imageLinks?.thumbnail ? (
              <img 
                src={book.volumeInfo.imageLinks.thumbnail}
                alt={`Cover of ${book.volumeInfo.title}`}
                className="w-full h-full object-cover" // Cover ensures image fills space
              />
            ) : (
              <span className="text-sm p-2 text-center">No Cover</span>
            )}
          </figure>
          {/* Reduced padding in card-body for compact look */}
          <div className="card-body p-2">
            <h3 
              className="font-semibold text-sm leading-tight line-clamp-2 mb-1" 
              title={book.volumeInfo.title} // Add title attribute for full title on hover
            >
              {book.volumeInfo.title}
            </h3>
            <p className="text-xs text-gray-500 line-clamp-1 mb-2">
              {book.volumeInfo.authors ? book.volumeInfo.authors.join(', ') : 'Unknown Author'}
            </p>
            <div className="card-actions justify-end">
              <button 
                className="btn btn-primary btn-xs" // Smaller button
                onClick={() => onAddBook(book)}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchResultsList; 