import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useEnv } from '@/context/EnvContext';
import { useSync } from '@/hooks/useSync';
import { useLibraryStore } from '@/store/libraryStore';
import { SYNC_BOOKS_INTERVAL_SEC } from '@/services/constants';
import { Book } from '@/types/book';

export interface UseBooksSyncProps {
  // Remove unused props
  // onSyncStart?: () => void;
  // onSyncEnd?: () => void;
}

export const useBooksSync = (/*{ onSyncStart, onSyncEnd }: UseBooksSyncProps*/) => {
  const { user } = useAuth();
  const { appService } = useEnv();
  const { library, setLibrary } = useLibraryStore();
  const { syncedBooks, syncBooks, lastSyncedAtBooks } = useSync();
  const syncBooksPullingRef = useRef(false);

  const pullLibrary = async () => {
    // console.log('Skipping pullLibrary (sync disabled)');
    // if (!user) return;
    // syncBooks([], 'pull');
  };

  const pushLibrary = async () => {
    // console.log('Skipping pushLibrary (sync disabled)');
    // if (!user) return;
    // const newBooks = getNewBooks();
    // syncBooks(newBooks, 'push');
  };

  useEffect(() => {
    // console.log('Skipping initial library pull (sync disabled)');
    /*
    if (!user) return;
    if (syncBooksPullingRef.current) return;
    syncBooksPullingRef.current = true;
    pullLibrary();
    */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Keep empty dependency array

  const lastSyncTime = useRef<number>(0);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getNewBooks = () => {
    // This function might still be called elsewhere, but push is disabled
    if (!user) return [];
    const newBooks = library.filter(
      (book) => lastSyncedAtBooks < book.updatedAt || lastSyncedAtBooks < (book.deletedAt ?? 0),
    );
    return newBooks;
  };

  useEffect(() => {
    // console.log('Skipping timed library sync (sync disabled)');
    /*
    if (!user) return;
    const now = Date.now();
    const timeSinceLastSync = now - lastSyncTime.current;
    if (timeSinceLastSync > SYNC_BOOKS_INTERVAL_SEC * 1000) {
      lastSyncTime.current = now;
      const newBooks = getNewBooks();
      syncBooks(newBooks, 'both');
    } else {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(
        () => {
          lastSyncTime.current = Date.now();
          const newBooks = getNewBooks();
          syncBooks(newBooks, 'both');
          syncTimeoutRef.current = null;
        },
        SYNC_BOOKS_INTERVAL_SEC * 1000 - timeSinceLastSync,
      );
    }
    */
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [library, user]); // Dependencies still relevant if logic were enabled

  const updateLibrary = async () => {
    // console.log('Skipping updateLibrary from sync (sync disabled)');
    /*
    if (!syncedBooks?.length) return;
    // Process old books first so that when we update the library the order is preserved
    syncedBooks.sort((a, b) => a.updatedAt - b.updatedAt);

    const processOldBook = async (oldBook: Book) => {
      const matchingBook = syncedBooks.find((newBook) => newBook.hash === oldBook.hash);
      if (matchingBook) {
        if (!matchingBook.deletedAt && matchingBook.uploadedAt && !oldBook.downloadedAt) {
          await appService?.downloadBook(oldBook, true);
        }
        const mergedBook =
          matchingBook.updatedAt > oldBook.updatedAt
            ? { ...oldBook, ...matchingBook }
            : { ...matchingBook, ...oldBook };
        return mergedBook;
      }
      return oldBook;
    };

    const updatedLibrary = await Promise.all(library.map(processOldBook));
    const processNewBook = async (newBook: Book) => {
      if (!updatedLibrary.some((oldBook) => oldBook.hash === newBook.hash)) {
        if (newBook.uploadedAt && !newBook.deletedAt) {
          try {
            await appService?.downloadBook(newBook, true);
            newBook.coverImageUrl = await appService?.generateCoverImageUrl(newBook);
            updatedLibrary.push(newBook);
            setLibrary(updatedLibrary);
          } catch {
            console.error('Failed to download book:', newBook);
          }
        }
      }
    };
    // These were the calls using the props:
    // onSyncStart?.();
    const batchSize = 3;
    for (let i = 0; i < syncedBooks.length; i += batchSize) {
      const batch = syncedBooks.slice(i, i + batchSize);
      await Promise.all(batch.map(processNewBook));
    }
    // onSyncEnd?.();
    setLibrary(updatedLibrary);
    appService?.saveLibraryBooks(updatedLibrary);
    */
  };

  useEffect(() => {
    // console.log('Skipping updateLibrary trigger (sync disabled)');
    // updateLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncedBooks]);

  return { pullLibrary, pushLibrary };
};
