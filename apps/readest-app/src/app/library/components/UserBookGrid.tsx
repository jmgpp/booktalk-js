'use client';

import { UserBook, BookStatus } from '@/types/userBook';
import { useTranslation } from '@/hooks/useTranslation';

interface UserBookGridProps {
  books: UserBook[];
  onBookClick: (book: UserBook) => void;
}

export default function UserBookGrid({ books, onBookClick }: UserBookGridProps) {
  const _ = useTranslation();

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h3 className="text-xl font-semibold mb-2">{_('Your library is empty')}</h3>
        <p className="text-base-content/70 mb-6">
          {_('Search for books to add them to your library')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {books.map((book) => (
        <div 
          key={book.id} 
          className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow cursor-pointer h-full flex flex-col"
          onClick={() => onBookClick(book)}
        >
          <figure className="h-64 bg-base-300 relative">
            {book.thumbnail_url ? (
              <img 
                src={book.thumbnail_url} 
                alt={book.title}
                className="h-full object-contain"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-center p-4">
                {_('No cover available')}
              </div>
            )}
          </figure>
          <div className="card-body p-3 flex-1 flex flex-col">
            <h2 className="card-title text-sm line-clamp-2">{book.title}</h2>
            <p className="text-xs text-gray-500 line-clamp-1">
              {book.authors?.join(', ') || _('Unknown author')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: BookStatus }) {
  const _ = useTranslation();
  
  const statusMap = {
    'want_to_read': { label: _('Want to Read'), color: 'badge-primary' },
    'reading': { label: _('Reading'), color: 'badge-accent' },
    'read': { label: _('Read'), color: 'badge-success' },
    'dnf': { label: _('DNF'), color: 'badge-error' },
  };
  
  const { label, color } = statusMap[status];
  
  return (
    <span className={`badge badge-sm ${color}`}>
      {label}
    </span>
  );
}

function StarRating({ rating }: { rating: number }) {
  const stars = [];
  
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} className={`text-xs ${i <= rating ? 'text-yellow-500' : 'text-gray-400'}`}>
        ★
      </span>
    );
  }
  
  return <div className="flex">{stars}</div>;
} 