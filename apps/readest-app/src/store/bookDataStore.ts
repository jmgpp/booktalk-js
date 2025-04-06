'use client'; // Potentially needed if using hooks/async directly

import { create } from 'zustand';
import { SystemSettings } from '@/types/settings';
import { Book, BookConfig, BookNote, BookContent, BookFormat, ViewSettings } from '@/types/book';
import { EnvConfigType } from '@/services/environment';
import { BookDoc, DocumentLoader, SectionItem, TOCItem } from '@/libs/document';
import { useLibraryStore } from './libraryStore';
import { useSettingsStore } from './settingsStore';
import { updateTocCFI, updateTocID } from '@/utils/toc';
import { webFileStore } from './webFileStore';
import { devtools } from 'zustand/middleware'; // Import devtools

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

// Wrap the store creation with devtools
export const useBookDataStore = create<BookDataState>()(
  devtools(
    (set, get) => ({
      booksData: {},
      ensureBookData: async (envConfig: EnvConfigType, id: string): Promise<BookData> => {
        const existingData = get().booksData[id];
        if (existingData?.bookDoc) {
          console.log(`[ensureBookData ${id}] Found cached bookDoc. Using existing data.`);
          return existingData;
        }

        let book: Book | undefined | null = null;
        let file: File | null = null;
        let config: BookConfig | null = null;
        let bookDoc: BookDoc | null = null;

        try {
          // --- Check if it's a web-loaded file --- 
          if (id.startsWith('webfile-')) {
            console.log(`[ensureBookData ${id}] Detected web file ID. Retrieving from store.`);
            file = webFileStore.get(id) || null;
            if (!file) {
              console.error(`[ensureBookData ${id}] !!! File not found in webFileStore for ID: ${id}`);
              // Remove the stale entry if it exists?
              webFileStore.delete(id); 
              throw new Error('Web file data not found or expired.');
            }
            
            // Create a minimal Book object for web files
            // We don't add this to the main libraryStore
            const now = Date.now();
            book = {
              hash: id, // Use the web file ID as hash
              format: getFormatFromPath(file.name), // Reuse helper from test page (or move it)
              title: file.name.replace(/\.[^/.]+$/, ""),
              author: 'Unknown',
              createdAt: now,
              updatedAt: now,
              isWebLoaded: true,
            };
            
            // Create a default config for web files, including minimal viewSettings
            const defaultViewSettings: Partial<ViewSettings> = {
              sideBarTab: 'toc', // Default sidebar tab
              // Add other crucial defaults if necessary
            };
            config = {
               updatedAt: now,
               viewSettings: defaultViewSettings, // Include default view settings
            };

            console.log(`[ensureBookData ${id}] Retrieved file from web store: ${file.name}`);
          
          } else { 
            // --- Existing logic for Tauri/Library books --- 
            console.log(`[ensureBookData ${id}] Not a web file ID. Loading from library/Tauri...`);
            const appService = await envConfig.getAppService();
            const { settings } = useSettingsStore.getState(); // Get settings
            const { library } = useLibraryStore.getState(); // Get library
            // Find book in library using the ID (which should be the full hash for library books)
            book = library.find((b) => b.hash === id); 

            if (!book) {
              console.error(`[ensureBookData ${id}] !!! Book not found in libraryStore for ID: ${id}`);
              throw new Error('Book not found in library');
            }

            // Load content via appService
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
            console.log(`[ensureBookData ${id}] Loaded file via Tauri/Library: ${file.name}`);
          }

          // --- Common logic: Parse document --- 
          if (!file) { // Should be guaranteed to have a file by now
              throw new Error('File object is missing after loading stage.');
          }
          
          try {
            console.log(`[ensureBookData ${id}] Parsing document...`);
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

          // --- Update book metadata from parsed bookDoc --- 
          // This ensures the book object in the store has the correct title/author, not just from filename
          if (book && bookDoc.metadata) {
              console.log(`[ensureBookData ${id}] Updating book metadata from bookDoc...`);
              let finalTitle = book.title; // Start with filename title as fallback
              if (typeof bookDoc.metadata.title === 'string') {
                  finalTitle = bookDoc.metadata.title;
              } else if (bookDoc.metadata.title && typeof bookDoc.metadata.title === 'object') {
                  // Handle LanguageMap or similar - attempt to find English or first available
                  finalTitle = bookDoc.metadata.title['en'] || Object.values(bookDoc.metadata.title)[0] || finalTitle;
              }
              
              let finalAuthor = book.author; // Start with 'Unknown' as fallback
              if (typeof bookDoc.metadata.author === 'string') {
                  finalAuthor = bookDoc.metadata.author;
              } else if (bookDoc.metadata.author && typeof bookDoc.metadata.author === 'object') {
                  // Handle Contributor object - typically has a 'name' property
                  finalAuthor = (bookDoc.metadata.author as any).name || finalAuthor;
              }

              // Update the book object
              book = {
                  ...book,
                  title: finalTitle,
                  author: finalAuthor,
              };
              console.log(`[ensureBookData ${id}] Updated book metadata: Title='${finalTitle}', Author='${finalAuthor}'`);
          }
           // --- Try to get cover image --- 
          try {
              const coverBlob = await bookDoc.getCover();
              if (coverBlob) {
                  const coverUrl = URL.createObjectURL(coverBlob);
                  console.log(`[ensureBookData ${id}] Generated Blob URL for cover image.`);
                  // Update the book object with the cover URL
                  book = {
                      ...book!,
                      coverImageUrl: coverUrl,
                  };
              } else {
                   console.log(`[ensureBookData ${id}] No cover image found in bookDoc.`);
              }
          } catch (coverError) {
               console.error(`[ensureBookData ${id}] Error getting cover image:`, coverError);
          }
          // --- End Cover Image --- 
          
          // Ensure essential components exist
          if (!book || !config || !bookDoc) {
            throw new Error('Failed to retrieve necessary book components after loading/parsing.');
          }

          // --- Common logic: Store final data --- 
          const finalBookData: BookData = { id, book, file, config, bookDoc };
          
          set((state) => ({
            booksData: {
              ...state.booksData,
              [id]: finalBookData,
            },
          }));
          console.log(`[ensureBookData ${id}] Book data loaded/parsed and stored successfully.`);
          
          // Clean up web file store entry after successful processing
          if (id.startsWith('webfile-')) {
               webFileStore.delete(id); 
               console.log(`[ensureBookData ${id}] Removed entry from webFileStore.`);
          }
          
          return finalBookData;

        } catch (error) {
          console.error(`[ensureBookData ${id}] !!! Error during data loading/processing:`, error);
          // Clean up web file store entry on error too?
          if (id.startsWith('webfile-')) {
               webFileStore.delete(id); 
               console.log(`[ensureBookData ${id}] Removed entry from webFileStore due to error.`);
          }
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
    }),
    {
      name: 'BookDataStore', // Name for DevTools
      serialize: {
        // Custom serializer to handle large/non-serializable objects
        replacer: (key: string, value: any) => {
          if (key === 'file' && value instanceof File) {
            return `[File: ${value.name}, Size: ${value.size}]`; // Replace File with info string
          }
          if (key === 'bookDoc') { 
            // Replace bookDoc - check if it has metadata to show title?
            const title = value?.metadata?.title;
            if (typeof title === 'string') {
                 return `[BookDoc: ${title}]`;
            }
            return '[BookDoc Object]'; // Generic placeholder
          }
          // Add checks for other large/circular objects if needed
          return value; // Keep other values as is
        },
      },
    }
  )
);

// Helper function (consider moving to a utils file)
// Duplicated from test page for now
const getFormatFromPath = (path: string): BookFormat => {
  const ext = path.split('.').pop()?.toUpperCase();
  switch (ext) {
    case 'EPUB': return 'EPUB';
    case 'PDF': return 'PDF';
    case 'MOBI': return 'MOBI';
    case 'AZW3': return 'MOBI'; 
    case 'CBZ': return 'CBZ';
    case 'FB2': return 'FB2';
    default: return 'EPUB';
  }
};
