import React from 'react';
import Image from 'next/image';
import { RecentBook } from '@/lib/reading-stats';
import { ReadingProgress } from './reading-progress';
import { Badge } from './ui/badge';
import { BookStatus } from '@/lib/database.types';

interface RecentBooksProps {
  books: RecentBook[];
  loading?: boolean;
}

const statusColors: Record<BookStatus, string> = {
  reading: 'bg-palette-blue text-white',
  finished: 'bg-palette-green text-white',
  want_to_read: 'bg-palette-orange text-white'
};

const statusLabels: Record<BookStatus, string> = {
  reading: 'Reading',
  finished: 'Finished',
  want_to_read: 'Want to Read'
};

export function RecentBooks({ books, loading = false }: RecentBooksProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-palette-purple/30 rounded-lg p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-24 bg-palette-purple/50 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-palette-purple/50 rounded w-3/4"></div>
                <div className="h-3 bg-palette-purple/50 rounded w-1/2"></div>
                <div className="h-3 bg-palette-purple/50 rounded w-1/4 mt-4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <div className="bg-palette-purple/10 rounded-lg p-6 text-center">
        <p className="text-palette-textLight/70">You haven't added any books to your library yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {books.map((book) => (
        <div 
          key={book.id} 
          className="bg-palette-purple/10 rounded-lg p-4 hover:bg-palette-purple/20 
            transition-colors duration-200 border border-palette-purple/20"
        >
          <div className="flex items-center gap-4">
            {/* Book cover */}
            <div className="relative w-16 h-24 rounded-md overflow-hidden flex-shrink-0 border border-palette-purple/30">
              {book.cover_url ? (
                <Image
                  src={book.cover_url}
                  alt={book.title}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-md"
                />
              ) : (
                <div className="w-full h-full bg-palette-darkPurple flex items-center justify-center">
                  <span className="text-xs text-center px-1 text-palette-textLight/70">No Cover</span>
                </div>
              )}
            </div>
            
            {/* Book info */}
            <div className="flex-1">
              <h3 className="font-medium text-palette-textLight">
                {book.title}
              </h3>
              <p className="text-sm text-palette-textLight/70 mb-2">
                {book.author}
              </p>
              <div className="flex items-center justify-between">
                <Badge className={statusColors[book.status]}>
                  {statusLabels[book.status]}
                </Badge>
                
                {book.status === 'reading' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-palette-textLight/70">{book.progress}%</span>
                    <div className="w-24 h-1.5 bg-palette-darkPurple rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-palette-blue rounded-full"
                        style={{ width: `${book.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 