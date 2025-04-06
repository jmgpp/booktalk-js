'use client';

import clsx from 'clsx';
import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useEnv } from '@/context/EnvContext';
import { useSettingsStore } from '@/store/settingsStore';
import { useBookDataStore } from '@/store/bookDataStore';
import { useReaderStore } from '@/store/readerStore';
import { useSidebarStore } from '@/store/sidebarStore';
import { Book } from '@/types/book';
import { SystemSettings } from '@/types/settings';
import { parseOpenWithFiles } from '@/helpers/cli';
import { tauriHandleClose, tauriHandleOnCloseWindow } from '@/utils/window';
import { isTauriAppPlatform } from '@/services/environment';
import { uniqueId } from '@/utils/misc';
import { eventDispatcher } from '@/utils/event';
import { navigateToLibrary } from '@/utils/nav';
import { BOOK_IDS_SEPARATOR } from '@/services/constants';

import useBooksManager from '../hooks/useBooksManager';
import useBookShortcuts from '../hooks/useBookShortcuts';
import BookDetailModal from '@/components/BookDetailModal';
import Spinner from '@/components/Spinner';
import SideBar from './sidebar/SideBar';
import Notebook from './notebook/Notebook';
import BooksGrid from './BooksGrid';
import TTSControl from './tts/TTSControl';

const ReaderContent: React.FC<{ ids?: string; filePath?: string; settings: SystemSettings }> = ({
  ids,
  filePath,
  settings,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { envConfig, appService } = useEnv();
  const { bookKeys, dismissBook, getNextBookKey } = useBooksManager();
  const { sideBarBookKey, setSideBarBookKey } = useSidebarStore();
  const { saveSettings } = useSettingsStore();
  const { getConfig, getBookData, saveConfig } = useBookDataStore();
  const { getView, setBookKeys } = useReaderStore();
  const { initViewState, getViewState, clearViewState } = useReaderStore();
  const [showDetailsBook, setShowDetailsBook] = useState<Book | null>(null);
  const isInitiating = useRef(false);
  const [loading, setLoading] = useState(false);

  useBookShortcuts({ sideBarBookKey, bookKeys });

  // --- Subscribe directly to bookData for the current book --- 
  const currentBookKey = bookKeys?.[0]; 
  
  // Correctly extract the ID (hash or full path) from the key
  // The key format is `${id}-${uniqueSuffix}`
  const currentBookId = currentBookKey 
    ? currentBookKey.substring(0, currentBookKey.lastIndexOf('-')) 
    : null;

  // Select the bookData for this ID from the store
  const bookData = useBookDataStore((state) => 
    currentBookId ? state.booksData[currentBookId] : undefined
  );

  // --- Initialization Effect ---
  useEffect(() => {
    if (isInitiating.current || searchParams === null) {
      return; 
    }

    const currentFilePath = filePath;
    const currentIdsString = ids || searchParams.get('ids') || ''; 
    let sourceFound = false;
    let bookKeyToInit: string | null = null;
    let idToInit: string | null = null;
    let isFilePathSource = false;

    if (currentFilePath) {
      console.log('ReaderContent Effect: Source is filePath:', currentFilePath);
      sourceFound = true;
      isFilePathSource = true;
      // Generate a stable key if possible, or use uniqueId for temporary files
      bookKeyToInit = `${currentFilePath}-${uniqueId()}`; 
      idToInit = currentFilePath;
      setBookKeys([bookKeyToInit]);
      setSideBarBookKey(bookKeyToInit);
    } else if (currentIdsString) {
      const initialIds = currentIdsString.split(BOOK_IDS_SEPARATOR).filter(Boolean);
      if (initialIds.length > 0) {
        console.log('ReaderContent Effect: Source is ids:', initialIds);
        sourceFound = true;
        isFilePathSource = false;
        const initialBookKeys = initialIds.map((id) => `${id}-${uniqueId()}`);
        bookKeyToInit = initialBookKeys[0]!;
        idToInit = initialIds[0]!;
        setBookKeys(initialBookKeys);
        setSideBarBookKey(bookKeyToInit);
      } else {
         console.warn('ReaderContent Effect: ids string provided but empty.');
      }
    } 
    
    if (sourceFound && bookKeyToInit && idToInit && !isInitiating.current) {
        isInitiating.current = true;
        setLoading(true); // Set loading state

        const initProcess = async () => {
            try {
                console.log(`ReaderContent Effect: Ensuring book data for ID/Path: ${idToInit}`);
                const { ensureBookData } = useBookDataStore.getState();
                // Capture the returned bookData
                const ensuredBookData = await ensureBookData(envConfig, idToInit);
                console.log(`ReaderContent Effect: Book data ensured. Calling initViewState for key: ${bookKeyToInit}`);
                // Pass the ensured data directly to initViewState
                await initViewState(envConfig, idToInit, bookKeyToInit!, ensuredBookData, true);
                console.log(`ReaderContent Effect: initViewState finished for key: ${bookKeyToInit}`);
            } catch (error) {
                console.error(`ReaderContent Effect: Error during init process for ${bookKeyToInit}:`, error);
                navigateToLibrary(router);
            } finally {
                setLoading(false);
                isInitiating.current = false;
            }
        };

        initProcess();

    } else if (!sourceFound && searchParams !== null) { // Check searchParams loaded
        console.warn('ReaderContent Effect: No source found. Redirecting.');
        navigateToLibrary(router);
    }

    // --- Setup Show Book Details Listener --- 
    const handleShowBookDetails = (event: CustomEvent) => {
      const book = event.detail as Book;
      setShowDetailsBook(book);
    };
    eventDispatcher.on('show-book-details', handleShowBookDetails);

    // Cleanup listener
    return () => {
      eventDispatcher.off('show-book-details', handleShowBookDetails);
      // Maybe reset initiating flag on unmount?
      // isInitiating.current = false;
    };

  }, [filePath, ids, searchParams, setBookKeys, setSideBarBookKey, initViewState, envConfig, navigateToLibrary, router, /* Removed getViewState, setShowDetailsBook */]); // Update dependencies

  useEffect(() => {
    if (isTauriAppPlatform()) tauriHandleOnCloseWindow(handleCloseBooks);
    window.addEventListener('beforeunload', handleCloseBooks);
    eventDispatcher.on('quit-app', handleCloseBooks);
    return () => {
      window.removeEventListener('beforeunload', handleCloseBooks);
      eventDispatcher.off('quit-app', handleCloseBooks);
    };
  }, [bookKeys]);

  const saveBookConfig = async (bookKey: string) => {
    const config = getConfig(bookKey);
    const { book } = getBookData(bookKey) || {};
    const { isPrimary } = getViewState(bookKey) || {};
    if (isPrimary && book && config) {
      eventDispatcher.dispatch('sync-book-progress', { bookKey });
      const settings = useSettingsStore.getState().settings;
      await saveConfig(envConfig, bookKey, config, settings);
    }
  };

  const saveConfigAndCloseBook = async (bookKey: string) => {
    console.log('Closing book', bookKey);
    try {
      getView(bookKey)?.close();
      getView(bookKey)?.remove();
    } catch {
      console.info('Error closing book', bookKey);
    }
    eventDispatcher.dispatch('tts-stop', { bookKey });
    await saveBookConfig(bookKey);
    clearViewState(bookKey);
  };

  const saveSettingsAndGoToLibrary = () => {
    saveSettings(envConfig, settings);
    navigateToLibrary(router);
  };

  const handleCloseBooks = async () => {
    const settings = useSettingsStore.getState().settings;
    await Promise.all(bookKeys.map((key) => saveConfigAndCloseBook(key)));
    await saveSettings(envConfig, settings);
  };

  const handleCloseBooksToLibrary = () => {
    handleCloseBooks();
    navigateToLibrary(router);
  };

  const handleCloseBook = async (bookKey: string) => {
    saveConfigAndCloseBook(bookKey);
    if (sideBarBookKey === bookKey) {
      setSideBarBookKey(getNextBookKey(sideBarBookKey));
    }
    dismissBook(bookKey);
    if (bookKeys.filter((key) => key !== bookKey).length == 0) {
      const openWithFiles = (await parseOpenWithFiles()) || [];
      if (openWithFiles.length > 0) {
        tauriHandleClose();
      } else {
        saveSettingsAndGoToLibrary();
      }
    }
  };

  // Loading state display (simplified - use the local loading state)
  if (loading || !bookKeys || bookKeys.length === 0) {
    return (
      <div className={clsx('hero hero-content', appService?.isIOSApp ? 'h-[100vh]' : 'h-dvh')}>
        <Spinner loading={true} /> 
      </div>
    );
  }

  // Check if bookData is ready AFTER loading state is false
  if (!bookData || !bookData.book || !bookData.bookDoc) {
     console.warn('[ReaderContent] Render: Loading is false, but bookData is still missing/incomplete for', currentBookId);
     // Maybe show a more specific error or retry state?
     return (
       <div className={clsx('hero hero-content', appService?.isIOSApp ? 'h-[100vh]' : 'h-dvh')}>
         <p>Error loading book data. Please try again.</p> {/* Or a more specific error */}
         <button onClick={() => navigateToLibrary(router)}>Back to Library</button>
       </div>
     );
   }

  return (
    <div className={clsx('flex', appService?.isIOSApp ? 'h-[100vh]' : 'h-dvh')}>
      <SideBar onGoToLibrary={handleCloseBooksToLibrary} />
      <BooksGrid bookKeys={bookKeys} onCloseBook={handleCloseBook} />
      <TTSControl />
      <Notebook />
      {showDetailsBook && (
        <BookDetailModal
          isOpen={!!showDetailsBook}
          book={showDetailsBook}
          onClose={() => setShowDetailsBook(null)}
        />
      )}
    </div>
  );
};

export default ReaderContent;
