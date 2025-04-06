'use client';

import clsx from 'clsx';
import * as React from 'react';
import { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { ReadonlyURLSearchParams, useRouter, useSearchParams, redirect } from 'next/navigation';
import Link from 'next/link';

import { Book } from '@/types/book';
import { AppService } from '@/types/system';
import { navigateToLogin, navigateToReader } from '@/utils/nav';
import { getFilename, listFormater } from '@/utils/book';
import { eventDispatcher } from '@/utils/event';
import { ProgressPayload } from '@/utils/transfer';
import { throttle } from '@/utils/throttle';
import { parseOpenWithFiles } from '@/helpers/cli';
import { isTauriAppPlatform, hasUpdater } from '@/services/environment';
import { checkForAppUpdates } from '@/helpers/updater';
import { FILE_ACCEPT_FORMATS, SUPPORTED_FILE_EXTS } from '@/services/constants';
import { impactFeedback } from '@tauri-apps/plugin-haptics';
import { getCurrentWebview } from '@tauri-apps/api/webview';

import { useEnv } from '@/context/EnvContext';
import { useAuth } from '@/context/AuthContext';
import { useThemeStore } from '@/store/themeStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useLibraryStore } from '@/store/libraryStore';
import { useSettingsStore } from '@/store/settingsStore';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useTheme } from '@/hooks/useTheme';
import { useDemoBooks } from './hooks/useDemoBooks';
import { useBooksSync } from './hooks/useBooksSync';
import { useScreenWakeLock } from '@/hooks/useScreenWakeLock';
import { useOpenWithBooks } from '@/hooks/useOpenWithBooks';
import { tauriQuitApp } from '@/utils/window';

import { AboutWindow } from '@/components/AboutWindow';
import { Toast } from '@/components/Toast';
import Spinner from '@/components/Spinner';
import LibraryHeader from './components/LibraryHeader';
import Bookshelf from './components/Bookshelf';
import BookDetailModal from '@/components/BookDetailModal';
import useShortcuts from '@/hooks/useShortcuts';
import DropIndicator from '@/components/DropIndicator';

const LibraryPageWithSearchParams = () => {
  const searchParams = useSearchParams();
  return <LibraryPageContent searchParams={searchParams} />;
};

const LibraryPageContent = ({ searchParams }: { searchParams: ReadonlyURLSearchParams | null }) => {
  const router = useRouter();
  const { envConfig, appService } = useEnv();
  const { user, isLoading: authIsLoading } = useAuth();
  const {
    library: libraryBooks,
    updateBook,
    setLibrary,
    checkOpenWithBooks,
    setCheckOpenWithBooks,
  } = useLibraryStore();
  const _ = useTranslation();
  useTheme();
  const { updateAppTheme } = useThemeStore();
  const { settings, setSettings, saveSettings } = useSettingsStore();
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [showDetailsBook, setShowDetailsBook] = useState<Book | null>(null);
  const [booksTransferProgress, setBooksTransferProgress] = useState<{
    [key: string]: number | null;
  }>({});
  const [isDragging, setIsDragging] = useState(false);
  const demoBooks = useDemoBooks();
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const isInitiating = useRef(false);

  useOpenWithBooks();

  const { pullLibrary, pushLibrary } = useBooksSync({
    onSyncStart: () => setLibraryLoading(true),
    onSyncEnd: () => setLibraryLoading(false),
  });

  usePullToRefresh(containerRef, pullLibrary);
  useScreenWakeLock(settings.screenWakeLock);

  useShortcuts({
    onQuitApp: async () => {
      if (isTauriAppPlatform()) {
        await tauriQuitApp();
      }
    },
  });

  useEffect(() => {
    updateAppTheme('base-200');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const doCheckAppUpdates = async () => {
      if (hasUpdater() && settings.autoCheckUpdates) {
        await checkForAppUpdates(_);
      }
    };
    doCheckAppUpdates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const handleDropedFiles = async (files: File[] | string[]) => {
    if (files.length === 0) return;
    const supportedFiles = files.filter((file) => {
      let fileExt;
      if (typeof file === 'string') {
        fileExt = file.split('.').pop()?.toLowerCase();
      } else {
        fileExt = file.name.split('.').pop()?.toLowerCase();
      }
      return FILE_ACCEPT_FORMATS.includes(`.${fileExt}`);
    });
    if (supportedFiles.length === 0) {
      eventDispatcher.dispatch('toast', {
        message: _('No supported files found. Supported formats: {{formats}}', {
          formats: FILE_ACCEPT_FORMATS,
        }),
        type: 'error',
      });
      return;
    }

    if (appService?.hasHaptics) {
      impactFeedback('medium');
    }

    await importBooks(supportedFiles);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement> | DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement> | DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement> | DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const files = Array.from(event.dataTransfer.files);
      handleDropedFiles(files);
    }
  };

  // --- Comment out Tauri Drag and Drop Effect --- 
  /*
  useEffect(() => {
    // Only run this effect in the Tauri environment
    if (!isTauriAppPlatform()) {
      return;
    }

    // Dynamically import Tauri API only when needed
    const setupDragDrop = async () => {
      if (!isTauriAppPlatform()) return; // Re-check after async context

      const { getCurrentWebview } = await import('@tauri-apps/api/webview');

      const unlisten = getCurrentWebview().onDragDropEvent((event) => {
        console.log('DragDrop event:', event);
        switch (event.payload.type) {
          case 'hover':
            // handleDragOver(event.payload.event); // Assuming handleDragOver exists
            console.log('Drag Hover');
            break;
          case 'drop':
            // handleDrop(event.payload.event); // Assuming handleDrop exists
             console.log('Dropped files:', event.payload.paths);
            break;
          case 'cancel':
            // handleDragLeave(event.payload.event); // Assuming handleDragLeave exists
             console.log('Drag Cancel/Leave');
            break;
        }
      });

      // Return the cleanup function
      return async () => {
        const cleanup = await unlisten;
        cleanup();
      };
    };

    let cleanupPromise: Promise<() => void> | null = null;
    setupDragDrop().then(cleanup => {
      if (cleanup) {
        cleanupPromise = Promise.resolve(cleanup); // Store cleanup for useEffect return
      }
    });

    // Return function to call the cleanup function when component unmounts
    return () => {
      cleanupPromise?.then(cleanup => cleanup());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageRef.current]); // Dependencies might need adjustment based on handle* functions
  */

  const handleOpenWithBooks = useCallback(
    async (appService: AppService | null, libraryBooks: Book[]) => {
      if (!appService) return;
      const openWithFiles = (await parseOpenWithFiles()) || [];
      if (openWithFiles.length > 0) {
        const processOpenWithFiles = async (appSvc: AppService, files: string[], books: Book[]) => {
          const settings = await appSvc.loadSettings();
          const bookIds: string[] = [];
          for (const file of files) {
            console.log('Open with book:', file);
            try {
              const temp = !settings.autoImportBooksOnOpen;
              const book = await appSvc.importBook(file, books, true, true, false, temp);
              if (book) {
                bookIds.push(book.hash);
              }
            } catch (error) {
              console.log('Failed to import book:', file, error);
            }
          }
          setLibrary(books);
          appSvc.saveLibraryBooks(books);
          console.log('Opening books:', bookIds);
          if (bookIds.length > 0) {
            setTimeout(() => {
              navigateToReader(router, bookIds);
            }, 0);
          }
        };

        await processOpenWithFiles(appService, openWithFiles, libraryBooks);
      } else {
        setCheckOpenWithBooks(false);
        setLibrary(libraryBooks);
      }
    },
    [setCheckOpenWithBooks, setLibrary, router]
  );

  useEffect(() => {
    if (authIsLoading) {
      console.log('LibraryPage: Waiting for auth...');
      return;
    }

    if (!authIsLoading && !user) {
      console.log('LibraryPage: Auth loaded, no user, redirecting to /auth');
      redirect('/auth');
      return;
    }

    if (user && !isInitiating.current) {
      isInitiating.current = true;
      console.log('LibraryPage: User found, initializing library...');
      setLibraryLoading(true);
      const loadingTimeout = setTimeout(() => {
        // Optionally handle long loads
      }, 5000);

      const initLibrary = async () => {
        try {
          const appSvc = await envConfig.getAppService();
          if (!appSvc) {
            console.error('AppService is null during initLibrary');
            return;
          }

          const currentSettings = await appSvc.loadSettings();
          setSettings(currentSettings);
          const books = await appSvc.loadLibraryBooks();

          if (checkOpenWithBooks && isTauriAppPlatform()) {
            await handleOpenWithBooks(appSvc, books);
          } else {
            setCheckOpenWithBooks(false);
            setLibrary(books);
          }
          setLibraryLoaded(true);
        } catch (error) {
          console.error("Failed to initialize library:", error);
        } finally {
          clearTimeout(loadingTimeout);
          setLibraryLoading(false);
          isInitiating.current = false;
        }
      };

      initLibrary();
    }
  }, [user, authIsLoading, searchParams, checkOpenWithBooks, envConfig, handleOpenWithBooks, setCheckOpenWithBooks, setLibrary, setSettings]);

  useEffect(() => {
    if (demoBooks.length > 0 && libraryLoaded) {
      const newLibrary = [...libraryBooks];
      for (const book of demoBooks) {
        const idx = newLibrary.findIndex((b) => b.hash === book.hash);
        if (idx === -1) {
          newLibrary.push(book);
        } else {
          newLibrary[idx] = book;
        }
      }
      setLibrary(newLibrary);
      appService?.saveLibraryBooks(newLibrary);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoBooks, libraryLoaded]);

  const importBooks = async (files: (string | File)[]) => {
    setLibraryLoading(true);
    const failedFiles = [];
    const errorMap: [string, string][] = [
      ['No chapters detected.', _('No chapters detected.')],
      ['Failed to parse EPUB.', _('Failed to parse the EPUB file.')],
      ['Unsupported format.', _('This book format is not supported.')],
    ];
    for (const file of files) {
      try {
        const book = await appService?.importBook(file, libraryBooks);
        setLibrary(libraryBooks);
        if (user && book && !book.uploadedAt && settings.autoUpload) {
          console.log('Uploading book:', book.title);
          handleBookUpload(book);
        }
      } catch (error) {
        const filename = typeof file === 'string' ? file : file.name;
        const baseFilename = getFilename(filename);
        failedFiles.push(baseFilename);
        const errorMessage =
          error instanceof Error
            ? errorMap.find(([substring]) => error.message.includes(substring))?.[1] || ''
            : '';
        eventDispatcher.dispatch('toast', {
          message:
            _('Failed to import book(s): {{filenames}}', {
              filenames: listFormater(false).format(failedFiles),
            }) + (errorMessage ? `\n${errorMessage}` : ''),
          type: 'error',
        });
        console.error('Failed to import book:', filename, error);
      }
    }
    appService?.saveLibraryBooks(libraryBooks);
    setLibraryLoading(false);
  };

  const selectFilesTauri = async () => {
    const exts = appService?.isAndroidApp ? [] : SUPPORTED_FILE_EXTS;
    const files = (await appService?.selectFiles(_('Select Books'), exts)) || [];
    return files.filter((file) => SUPPORTED_FILE_EXTS.some((ext) => file.endsWith(`.${ext}`)));
  };

  const selectFilesWeb = () => {
    return new Promise((resolve) => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = FILE_ACCEPT_FORMATS;
      fileInput.multiple = true;
      fileInput.click();

      fileInput.onchange = () => {
        resolve(fileInput.files);
      };
    });
  };

  const updateBookTransferProgress = throttle((bookHash: string, progress: ProgressPayload) => {
    if (progress.total === 0) return;
    const progressPct = (progress.progress / progress.total) * 100;
    setBooksTransferProgress((prev) => ({
      ...prev,
      [bookHash]: progressPct,
    }));
  }, 500);

  const handleBookUpload = async (book: Book) => {
    try {
      await appService?.uploadBook(book, (progress) => {
        updateBookTransferProgress(book.hash, progress);
      });
      await updateBook(envConfig, book);
      pushLibrary();
      eventDispatcher.dispatch('toast', {
        type: 'info',
        timeout: 2000,
        message: _('Book uploaded: {{title}}', {
          title: book.title,
        }),
      });
      return true;
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('Not authenticated') && settings.keepLogin) {
          settings.keepLogin = false;
          setSettings(settings);
          navigateToLogin(router);
          return false;
        } else if (err.message.includes('Insufficient storage quota')) {
          eventDispatcher.dispatch('toast', {
            type: 'error',
            message: _('Insufficient storage quota'),
          });
          return false;
        }
      }
      eventDispatcher.dispatch('toast', {
        type: 'error',
        message: _('Failed to upload book: {{title}}', {
          title: book.title,
        }),
      });
      return false;
    }
  };

  const handleBookDownload = async (book: Book) => {
    try {
      await appService?.downloadBook(book, false, (progress) => {
        updateBookTransferProgress(book.hash, progress);
      });
      await updateBook(envConfig, book);
      eventDispatcher.dispatch('toast', {
        type: 'info',
        timeout: 2000,
        message: _('Book downloaded: {{title}}', {
          title: book.title,
        }),
      });
      return true;
    } catch {
      eventDispatcher.dispatch('toast', {
        message: _('Failed to download book: {{title}}', {
          title: book.title,
        }),
        type: 'error',
      });
      return false;
    }
  };

  const handleBookDelete = async (book: Book) => {
    try {
      await appService?.deleteBook(book, !!book.uploadedAt);
      await updateBook(envConfig, book);
      pushLibrary();
      eventDispatcher.dispatch('toast', {
        type: 'info',
        timeout: 2000,
        message: _('Book deleted: {{title}}', {
          title: book.title,
        }),
      });
      return true;
    } catch {
      eventDispatcher.dispatch('toast', {
        message: _('Failed to delete book: {{title}}', {
          title: book.title,
        }),
        type: 'error',
      });
      return false;
    }
  };

  const handleImportBooks = async () => {
    setIsSelectMode(false);
    console.log('Importing books...');
    let files;

    if (isTauriAppPlatform()) {
      if (appService?.isIOSApp) {
        files = (await selectFilesWeb()) as [File];
      } else {
        files = (await selectFilesTauri()) as [string];
      }
    } else {
      files = (await selectFilesWeb()) as [File];
    }
    importBooks(files);
  };

  const handleToggleSelectMode = () => {
    if (!isSelectMode && appService?.hasHaptics) {
      impactFeedback('medium');
    }
    setIsSelectMode((pre) => !pre);
  };

  const handleSetSelectMode = (selectMode: boolean) => {
    if (selectMode && appService?.hasHaptics) {
      impactFeedback('medium');
    }
    setIsSelectMode(selectMode);
  };

  const handleShowDetailsBook = (book: Book) => {
    setShowDetailsBook(book);
  };

  if (!appService) {
    return null;
  }

  if (checkOpenWithBooks) {
    return (
      libraryLoading && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          <Spinner loading />
        </div>
      )
    );
  }

  if (authIsLoading) {
    return <div>Authenticating...</div>;
  }

  if (!user) {
    return <div>Redirecting to login...</div>;
  }

  if (libraryLoading || !libraryLoaded) {
    return <div>Loading Library...</div>;
  }

  return (
    <div
      ref={pageRef}
      className={clsx(
        'library-page bg-base-200 text-base-content flex select-none flex-col overflow-hidden',
        appService?.isIOSApp ? 'h-[100vh]' : 'h-dvh',
        appService?.hasRoundedWindow && 'rounded-window',
      )}
    >
      <div className='absolute left-4 top-16 z-20'>
        <Link href="/home" className="btn btn-sm btn-ghost">
          &lt; Back to Home
        </Link>
      </div>
      <div className='fixed top-0 z-40 w-full'>
        <LibraryHeader
          isSelectMode={isSelectMode}
          onImportBooks={handleImportBooks}
          onToggleSelectMode={handleToggleSelectMode}
        />
      </div>
      {libraryLoading && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          <Spinner loading />
        </div>
      )}
      {libraryLoaded &&
        (libraryBooks.some((book) => !book.deletedAt) ? (
          <div
            ref={containerRef}
            className={clsx(
              'scroll-container drop-zone mt-[48px] flex-grow overflow-y-auto px-4 sm:px-2',
              appService?.hasSafeAreaInset && 'mt-[calc(52px+env(safe-area-inset-top))]',
              appService?.hasSafeAreaInset && 'pb-[calc(env(safe-area-inset-bottom))]',
              isDragging && 'drag-over',
            )}
          >
            <DropIndicator />
            <Bookshelf
              libraryBooks={libraryBooks}
              isSelectMode={isSelectMode}
              handleImportBooks={handleImportBooks}
              handleBookUpload={handleBookUpload}
              handleBookDownload={handleBookDownload}
              handleBookDelete={handleBookDelete}
              handleSetSelectMode={handleSetSelectMode}
              handleShowDetailsBook={handleShowDetailsBook}
              booksTransferProgress={booksTransferProgress}
            />
          </div>
        ) : (
          <div className='hero drop-zone h-screen items-center justify-center'>
            <DropIndicator />
            <div className='hero-content text-neutral-content text-center'>
              <div className='max-w-md'>
                <h1 className='mb-5 text-5xl font-bold'>{_('Your Library')}</h1>
                <p className='mb-5'>
                  {_(
                    'Welcome to your library. You can import your books here and read them anytime.',
                  )}
                </p>
                <button className='btn btn-primary rounded-xl' onClick={handleImportBooks}>
                  {_('Import Books')}
                </button>
              </div>
            </div>
          </div>
        ))}
      {showDetailsBook && (
        <BookDetailModal
          isOpen={!!showDetailsBook}
          book={showDetailsBook}
          onClose={() => setShowDetailsBook(null)}
        />
      )}
      <AboutWindow />
      <Toast />
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/test-reader">
          <button style={{ padding: '0.5rem 1rem' }}>Go to Test Reader Page</button>
        </Link>
      </div>
    </div>
  );
};

const LibraryPage = () => {
  return (
    <Suspense
      fallback={
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          <Spinner loading />
        </div>
      }
    >
      <LibraryPageWithSearchParams />
    </Suspense>
  );
};

export default LibraryPage;
