'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { isTauriAppPlatform } from '@/services/environment';
import { useLibraryStore } from '@/store/libraryStore';
import { Book, BookFormat } from '@/types/book';
import { getFilename } from '@/utils/book';

// Helper to guess format (very basic)
const getFormatFromPath = (path: string): BookFormat => {
  const ext = path.split('.').pop()?.toUpperCase();
  switch (ext) {
    case 'EPUB': return 'EPUB';
    case 'PDF': return 'PDF';
    case 'MOBI': return 'MOBI';
    case 'AZW3': return 'MOBI'; // Treat AZW3 as MOBI for simplicity?
    case 'CBZ': return 'CBZ';
    case 'FB2': return 'FB2';
    // Add other formats if needed
    default: return 'EPUB'; // Default or throw error
  }
};

export default function TestReaderPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string>('');
  const { library, setLibrary } = useLibraryStore();

  const handleLoadBook = async () => {
    if (!isTauriAppPlatform()) {
      setMessage('File selection only works in the Tauri desktop app.');
      return;
    }

    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selectedPath = await open({
        multiple: false,
        // filters: ... (optional)
      });

      if (typeof selectedPath === 'string' && selectedPath) {
        setMessage(`Selected: ${selectedPath}`);

        // --- Create and add Book object --- 
        const now = Date.now();
        const fileName = getFilename(selectedPath);
        // Simple hash based on path + timestamp for uniqueness in this test
        const bookHash = `local-${selectedPath}-${now}`;

        const newBook: Book = {
          filePath: selectedPath,
          hash: bookHash, // Use generated hash as ID
          format: getFormatFromPath(selectedPath),
          title: fileName.replace(/\.[^/.]+$/, ""), // Remove extension for title
          author: 'Unknown', // Placeholder author
          createdAt: now,
          updatedAt: now,
          // Other fields can be undefined/null initially
        };

        // Add to library state
        const updatedLibrary = [...library, newBook];
        setLibrary(updatedLibrary);
        console.log('Added temporary book to library state:', newBook);

        // Navigate to reader using the book's hash
        router.push(`/reader?ids=${bookHash}`); // Use 'ids' param as ReaderContent expects

      } else {
        setMessage('No file selected.');
      }
    } catch (error) {
      console.error('Error selecting file or creating book:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Test Local Book Loader</h1>
      <p>This page allows selecting a local ebook file, adding a temporary representation to the app state, and opening it in the reader using its generated ID.</p>
      <button onClick={handleLoadBook} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
        Load Local Ebook & Add to State
      </button>
      {message && <p style={{ marginTop: '1rem', color: 'gray' }}>{message}</p>}
    </div>
  );
} 