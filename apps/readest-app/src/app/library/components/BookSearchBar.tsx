'use client';

import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa'; // Example icon

interface BookSearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean; // Optional loading state for button
}

const BookSearchBar: React.FC<BookSearchBarProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleSearchClick = () => {
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearchClick();
    }
  };

  return (
    <div className="join"> {/* Use DaisyUI join to group input and button */}
      <input 
        type="text" 
        placeholder="Search Google Books by title, author..." 
        className="input input-bordered join-item w-full max-w-md" // DaisyUI input classes
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
      />
      <button 
        className={`btn btn-primary join-item ${isLoading ? 'loading' : ''}`} // DaisyUI button classes
        onClick={handleSearchClick}
        disabled={isLoading || !query.trim()}
      >
        {isLoading ? 'Searching...' : <FaSearch />}
      </button>
    </div>
  );
};

export default BookSearchBar; 