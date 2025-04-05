import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { isTauriAppPlatform } from '@/services/environment';
import { useLibraryStore } from '@/store/libraryStore';
import { navigateToLibrary } from '@/utils/nav';

interface SingleInstancePayload {
  args: string[];
  cwd: string;
}

export function useOpenWithBooks() {
  const router = useRouter();
  const { setCheckOpenWithBooks } = useLibraryStore();
  const listenedOpenWithBooks = useRef(false);

  const handleOpenWithFileUrl = (url: string) => {
    console.log('Handle Open with URL:', url);
    let filePath = url;
    if (filePath.startsWith('file://')) {
      filePath = decodeURI(filePath.replace('file://', ''));
    }
    if (!/^(https?:|data:|blob:)/i.test(filePath)) {
      window.OPEN_WITH_FILES = [filePath];
      setCheckOpenWithBooks(true);
      navigateToLibrary(router, `reload=${Date.now()}`);
    }
  };

  useEffect(() => {
    if (!isTauriAppPlatform()) {
      return; // Exit early if not in Tauri
    }
    if (listenedOpenWithBooks.current) {
      return;
    }
    listenedOpenWithBooks.current = true;

    let cleanupFunc: (() => void) | null = null;

    const setupTauriListeners = async () => {
      // Dynamic imports within the async function
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const { onOpenUrl } = await import('@tauri-apps/plugin-deep-link');

      const unlistenDeeplinkPromise = getCurrentWindow().listen('single-instance', ({ event, payload }) => {
        console.log('Received deep link:', event, payload);
        const { args } = payload as SingleInstancePayload;
        if (args?.[1]) {
          handleOpenWithFileUrl(args[1]);
        }
      });

      const unlistenOpenUrlPromise = onOpenUrl((urls) => {
        urls.forEach((url) => {
          handleOpenWithFileUrl(url);
        });
      });

      // Assign the combined cleanup logic
      cleanupFunc = async () => {
        const unlistenDeeplink = await unlistenDeeplinkPromise;
        unlistenDeeplink();
        const unlistenOpenUrl = await unlistenOpenUrlPromise;
        if (unlistenOpenUrl) { // onOpenUrl might return null/undefined if already unlistened
           unlistenOpenUrl();
        }
      };
    };

    setupTauriListeners();

    // Return a function that calls the cleanup logic when available
    return () => {
      if (cleanupFunc) {
        cleanupFunc();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Keep dependencies minimal, assuming handleOpenWithFileUrl is stable
}
