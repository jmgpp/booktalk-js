'use client';

import clsx from 'clsx';
import React, { useEffect } from 'react';

import { useEnv } from '@/context/EnvContext';
import { useBookDataStore } from '@/store/bookDataStore';
import { useSidebarStore } from '@/store/sidebarStore';
import getGridTemplate from '@/utils/grid';
import BookGridItem from './BookGridItem';

interface BooksGridProps {
  bookKeys: string[];
  onCloseBook: (bookKey: string) => void;
}

const BooksGrid: React.FC<BooksGridProps> = ({ bookKeys, onCloseBook }) => {
  const { appService } = useEnv();
  const { getBookData } = useBookDataStore();
  const { sideBarBookKey } = useSidebarStore();
  const gridTemplate = getGridTemplate(bookKeys.length, window.innerWidth / window.innerHeight);

  useEffect(() => {
    if (!sideBarBookKey) return;
    const bookData = getBookData(sideBarBookKey);
    if (!bookData || !bookData.book) return;
    document.title = bookData.book.title;
  }, [sideBarBookKey, getBookData]);

  return (
    <div
      className={clsx(
        'grid h-full flex-grow',
        appService?.hasSafeAreaInset && 'pt-[env(safe-area-inset-top)]',
      )}
      style={{
        gridTemplateColumns: gridTemplate.columns,
        gridTemplateRows: gridTemplate.rows,
      }}
    >
      {bookKeys.map((bookKey, index) => (
          <BookGridItem 
            key={bookKey}
            bookKey={bookKey}
            index={index}
            bookKeysLength={bookKeys.length}
            onCloseBook={onCloseBook} 
          />
      ))}
    </div>
  );
};

export default BooksGrid;
