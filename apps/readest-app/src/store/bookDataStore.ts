'use client'; // Potentially needed if using hooks/async directly

import { create } from 'zustand';
import { SystemSettings } from '@/types/settings';
import { Book, BookConfig, BookNote, BookContent } from '@/types/book';
import { EnvConfigType } from '@/services/environment';
import { BookDoc, DocumentLoader, SectionItem, TOCItem } from '@/libs/document';
import { useLibraryStore } from './libraryStore';
import { useSettingsStore } from './settingsStore';
import { updateTocCFI, updateTocID } from '@/utils/toc';

export interface BookData {
  /* Persistent data shared with different views of the same book */
  id: string;
  book: Book | null;
  file: File | null;
  config: BookConfig | null;
  bookDoc: BookDoc | null;
}

export interface BookDataState {
  booksData: { [id: string]: BookData };
  ensureBookData: (envConfig: EnvConfigType, id: string) => Promise<BookData>;
  getConfig: (key: string | null) => BookConfig | null;
  setConfig: (key: string, partialConfig: Partial<BookConfig>) => void;
  saveConfig: (
    envConfig: EnvConfigType,
    bookKey: string,
    config: BookConfig,
    settings: SystemSettings,
  ) => void;
  updateBooknotes: (key: string, booknotes: BookNote[]) => BookConfig | undefined;
  getBookData: (keyOrId: string) => BookData | null;
}

export const useBookDataStore = create<BookDataState>((set, get) => ({
  booksData: {},
  ensureBookData: async (envConfig: EnvConfigType, id: string): Promise<BookData> => {
    const existingData = get().booksData[id];
    // Return immediately if bookDoc exists (assuming full data is present)
    if (existingData?.bookDoc) {
      console.log(`[ensureBookData ${id}] Found cached bookDoc. Using existing data.`);
      return existingData;
    }

    console.log(`[ensureBookData ${id}] No cached bookDoc found. Loading...`);
    let book: Book | undefined | null = null;
    let file: File | null = null;
    let config: BookConfig | null = null;
    let bookDoc: BookDoc | null = null;

    try {
      const appService = await envConfig.getAppService();
      const { settings } = useSettingsStore.getState(); // Get settings
      const { library } = useLibraryStore.getState(); // Get library
      book = library.find((b) => b.hash === id);

      if (!book) {
        console.error(`[ensureBookData ${id}] !!! Book not found in libraryStore for ID: ${id}`);
        throw new Error('Book not found in library');
      }

      // Load content
      try {
        const content = (await appService.loadBookContent(book, settings)) as BookContent;
        file = content.file;
        config = content.config;
        console.log(`[ensureBookData ${id}] loadBookContent SUCCESS. File name: ${file?.name}`);
      } catch (loadError) {
        console.error(`[ensureBookData ${id}] !!! Error during appService.loadBookContent:`, loadError);
        throw loadError;
      }

      if (!file) {
        console.error(`[ensureBookData ${id}] !!! loadBookContent did not return a valid file handle.`);
        throw new Error('Failed to get file handle for book.');
      }

      // Parse the document
      try {
        const { book: loadedBookDoc } = await new DocumentLoader(file).open();
        bookDoc = loadedBookDoc as BookDoc;
        console.log(`[ensureBookData ${id}] DocumentLoader SUCCESS. bookDoc obtained: ${!!bookDoc}`);
      } catch (parseError) {
        console.error(`[ensureBookData ${id}] !!! Error during DocumentLoader:`, parseError);
        throw parseError;
      }

      if (!bookDoc) {
        console.error(`[ensureBookData ${id}] !!! DocumentLoader finished but bookDoc is null/undefined.`);
        throw new Error('Failed to parse book document (bookDoc is null).');
      }

      // Process TOC if available
      if (bookDoc.toc?.length && bookDoc.sections?.length) {
        console.log(`[ensureBookData ${id}] Processing TOC...`);
        updateTocID(bookDoc.toc);
        const sections = bookDoc.sections.reduce((map: Record<string, SectionItem>, section) => {
          map[section.id] = section;
          return map;
        }, {});
        updateTocCFI(bookDoc, bookDoc.toc, sections);
        console.log(`[ensureBookData ${id}] TOC processing complete.`);
      }

      // Ensure book, config, bookDoc are not null/undefined before assigning
      if (!book || !config || !bookDoc) {
        throw new Error('Failed to retrieve necessary book components after loading.');
      }

      const finalBookData: BookData = { id, book, file, config, bookDoc };
      
      // Update the store state
      set((state) => ({
        booksData: {
          ...state.booksData,
          [id]: finalBookData,
        },
      }));
      console.log(`[ensureBookData ${id}] Book data loaded and stored successfully.`);
      return finalBookData;

    } catch (error) {
      console.error(`[ensureBookData ${id}] !!! Error during data loading:`, error);
      // Decide error handling: maybe set a specific error state in booksData?
      // For now, re-throw to let the caller handle it.
      throw error instanceof Error ? error : new Error('Failed to ensure book data');
    }
  },
  getBookData: (keyOrId: string) => {
    // Correctly extract ID by finding the last hyphen
    const lastHyphenIndex = keyOrId.lastIndexOf('-');
    // Handle cases where there might not be a hyphen (though keys should have one)
    const id = lastHyphenIndex !== -1 ? keyOrId.substring(0, lastHyphenIndex) : keyOrId;
    console.log(`[getBookData] Extracted ID: ${id} from keyOrId: ${keyOrId}`); // Debug log
    return get().booksData[id] || null;
  },
  getConfig: (key: string | null) => {
    if (!key) return null;
    // Correctly extract ID by finding the last hyphen
    const lastHyphenIndex = key.lastIndexOf('-');
    const id = lastHyphenIndex !== -1 ? key.substring(0, lastHyphenIndex) : key;
    console.log(`[getConfig] Extracted ID: ${id} from key: ${key}`); // Debug log
    return get().booksData[id]?.config || null;
  },
  setConfig: (key: string, partialConfig: Partial<BookConfig>) => {
    set((state: BookDataState) => {
      // Correctly extract ID here too for consistency
      const lastHyphenIndex = key.lastIndexOf('-');
      const id = lastHyphenIndex !== -1 ? key.substring(0, lastHyphenIndex) : key;
      const bookData = state.booksData[id];
      
      if (!bookData) {
        console.warn(`[setConfig] No bookData found for extracted ID: ${id} from key: ${key}. Cannot set config.`);
        return state; // Return current state if bookData doesn't exist
      }

      const config = (bookData.config || {}) as BookConfig;
      Object.assign(config, partialConfig);
      return {
        booksData: {
          ...state.booksData,
          [id]: {
            ...bookData, // Use the retrieved bookData
            config,
          },
        },
      };
    });
  },
  saveConfig: async (
    envConfig: EnvConfigType,
    bookKey: string,
    config: BookConfig,
    settings: SystemSettings,
  ) => {
    const appService = await envConfig.getAppService();
    const { library, setLibrary } = useLibraryStore.getState();
    const bookIndex = library.findIndex((b) => b.hash === bookKey.split('-')[0]);
    if (bookIndex == -1) return;
    const book = library.splice(bookIndex, 1)[0]!;
    book.progress = config.progress;
    book.updatedAt = Date.now();
    library.unshift(book);
    setLibrary(library);
    config.updatedAt = Date.now();
    await appService.saveBookConfig(book, config, settings);
    await appService.saveLibraryBooks(library);
  },
  updateBooknotes: (key: string, booknotes: BookNote[]) => {
    let updatedConfig: BookConfig | undefined;
    set((state) => {
      const id = key.split('-')[0]!;
      const book = state.booksData[id];
      if (!book) return state;
      const dedupedBooknotes = Array.from(
        new Map(booknotes.map((item) => [`${item.id}-${item.type}-${item.cfi}`, item])).values(),
      );
      updatedConfig = {
        ...book.config,
        updatedAt: Date.now(),
        booknotes: dedupedBooknotes,
      };
      return {
        booksData: {
          ...state.booksData,
          [id]: {
            ...book,
            config: {
              ...book.config,
              updatedAt: Date.now(),
              booknotes: dedupedBooknotes,
            },
          },
        },
      };
    });
    return updatedConfig;
  },
}));
