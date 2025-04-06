'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { isTauriAppPlatform } from '@/services/environment';
import { useLibraryStore } from '@/store/libraryStore';
import { Book, BookFormat } from '@/types/book';
import { getFilename } from '@/utils/book';
import { webFileStore } from '../../store/webFileStore';
import Link from 'next/link';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadTauriBook = async () => {
    if (!isTauriAppPlatform()) {
      setMessage('Tauri file selection only works in the Tauri desktop app.');
      return;
    }

    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selectedPath = await open({
        multiple: false,
        filters: [
          { name: 'Ebooks', extensions: ['epub', 'pdf'] },
        ],
      });

      if (typeof selectedPath === 'string' && selectedPath) {
        setMessage(`Selected (Tauri): ${selectedPath}`);
        const now = Date.now();
        const fileName = getFilename(selectedPath);
        const bookHash = `local-${selectedPath}-${now}`;

        const newBook: Book = {
          filePath: selectedPath,
          hash: bookHash,
          format: getFormatFromPath(selectedPath),
          title: fileName.replace(/\.[^/.]+$/, ""),
          author: 'Unknown',
          createdAt: now,
          updatedAt: now,
        };

        const updatedLibrary = [...library, newBook];
        setLibrary(updatedLibrary);
        console.log('Added temporary Tauri book to library state:', newBook);
        router.push(`/reader?ids=${bookHash}`);

      } else {
        setMessage('No file selected (Tauri).');
      }
    } catch (error) {
      console.error('Error selecting Tauri file or creating book:', error);
      setMessage(`Error (Tauri): ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleTriggerWebFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleWebFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setMessage('No file selected (Web).');
      return;
    }

    setMessage(`Selected (Web): ${file.name}`);

    const now = Date.now();
    const fileId = `webfile-${file.name}-${now}`;
    
    webFileStore.set(fileId, file);
    console.log(`Stored web file with ID: ${fileId}`, file);

    const newBook: Book = {
      hash: fileId,
      format: getFormatFromPath(file.name),
      title: file.name.replace(/\.[^/.]+$/, ""),
      author: 'Unknown',
      createdAt: now,
      updatedAt: now,
      isWebLoaded: true,
    };
    
    router.push(`/reader?ids=${fileId}`);

    event.target.value = '';
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}> 
        <Link href="/home" className="btn btn-sm btn-ghost" style={{ textDecoration: 'none', color: 'inherit' }}>
           &lt; Back to Home
        </Link>
      </div>
      
      <h1 style={{ textAlign: 'center' }}>Test Book Loader</h1>
      
      <h2 style={{ marginTop: '2rem' }}>Load from Tauri (Desktop App)</h2>
      <p>Select a local ebook file using Tauri API (requires desktop app).</p>
      <button onClick={handleLoadTauriBook} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
        Load from Tauri
      </button>

      <h2 style={{ marginTop: '2rem' }}>Load from Web Browser</h2>
      <p>Select a local ebook file using the browser file input.</p>
      <input 
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleWebFileChange}
        accept=".epub,.pdf"
      />
      <button onClick={handleTriggerWebFileSelect} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
        Load from Web
      </button>

      {message && <p style={{ marginTop: '1rem', color: 'gray' }}>{message}</p>}
    </div>
  );
} 