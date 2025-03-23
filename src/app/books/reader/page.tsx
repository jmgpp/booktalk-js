"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ReactReader } from 'react-reader';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EpubReaderPage() {
  const [location, setLocation] = useState<string | number>(0);
  const [size, setSize] = useState<number>(100);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showToc, setShowToc] = useState<boolean>(true);
  const renditionRef = useRef<any>(null);
  const router = useRouter();

  // When the rendition is created, store the reference
  const getRendition = (rendition: any) => {
    renditionRef.current = rendition;
    rendition.themes.default({
      '::selection': {
        background: 'rgba(72, 194, 247, 0.3)'
      },
      '.epubjs-hl': {
        fill: 'rgba(72, 194, 247, 0.3)',
        'mix-blend-mode': 'multiply'
      }
    });
    setIsLoading(false);
  };

  // Change font size
  const changeFontSize = (newSize: number) => {
    setSize(newSize);
    if (renditionRef.current) {
      renditionRef.current.themes.fontSize(`${newSize}%`);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-palette-bg">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-palette-border bg-white">
        <Link href="/" className="text-palette-blue hover:text-palette-primary transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-xl font-semibold text-palette-text">EPUB Reader</h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowToc(!showToc)}
            className="p-2 rounded-md bg-palette-softBg hover:bg-palette-border transition-colors text-palette-text"
          >
            {showToc ? 'Hide TOC' : 'Show TOC'}
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => changeFontSize(Math.max(70, size - 10))}
              className="p-2 rounded-md bg-palette-softBg hover:bg-palette-border transition-colors text-palette-text"
              disabled={size <= 70}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-palette-text">{size}%</span>
            <button 
              onClick={() => changeFontSize(Math.min(150, size + 10))}
              className="p-2 rounded-md bg-palette-softBg hover:bg-palette-border transition-colors text-palette-text"
              disabled={size >= 150}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Reader container */}
      <div className="flex-grow relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-palette-bg bg-opacity-80 z-10">
            <div className="text-palette-blue animate-pulse">Loading...</div>
          </div>
        )}
        <ReactReader
          url="/books/alice.epub"
          location={location}
          locationChanged={(epubcfi: string) => setLocation(epubcfi)}
          getRendition={getRendition}
          showToc={showToc}
          epubOptions={{
            flow: "paginated",
            width: "100%",
            height: "100%"
          }}
        />
      </div>
    </div>
  );
} 