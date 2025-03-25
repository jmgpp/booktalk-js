"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ReactReader } from 'react-reader';
import Link from 'next/link';
import { ArrowLeft, Bookmark, BookOpen, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReaderUIProps {
  bookUrl: string;
  onBookChange: (url: string) => void;
}

export default function ReaderUI({ bookUrl, onBookChange }: ReaderUIProps) {
  const [location, setLocation] = useState<string | number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [bookTitle, setBookTitle] = useState<string>("Alice in Wonderland");
  const [showUI, setShowUI] = useState<boolean>(true);
  const [chapter, setChapter] = useState<string>("");
  const [theme, setTheme] = useState<string>("light");
  const [uiTimeout, setUiTimeout] = useState<NodeJS.Timeout | null>(null);
  const [settingsVisible, setSettingsVisible] = useState<boolean>(false);
  const [tocVisible, setTocVisible] = useState<boolean>(false);
  const [bookmarksVisible, setBookmarksVisible] = useState<boolean>(false);
  const [isCurrentLocationBookmarked, setIsCurrentLocationBookmarked] = useState<boolean>(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchStartTime, setTouchStartTime] = useState<number | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const renditionRef = useRef<any>(null);
  const gestureLayerRef = useRef<HTMLDivElement>(null);

  // Basic renderer without all the features
  const getRendition = (rendition: any) => {
    renditionRef.current = rendition;
    setIsLoading(false);
    
    // Get book title from metadata
    rendition.book.loaded.metadata.then((metadata: any) => {
      if (metadata.title) {
        setBookTitle(metadata.title);
      }
    });
  };

  // Toggle UI visibility
  const toggleUIVisibility = () => {
    setShowUI(prev => !prev);
    
    // If we're showing the UI, set a timeout to hide it after a delay
    if (!showUI) {
      if (uiTimeout) {
        clearTimeout(uiTimeout);
      }
      
      const timeout = setTimeout(() => {
        // Only hide UI when not in panels
        if (!settingsVisible && !tocVisible && !bookmarksVisible) {
          setShowUI(false);
        }
      }, 3000);
      
      setUiTimeout(timeout);
    }
  };

  // Toggle panels
  const toggleSettings = () => {
    setSettingsVisible(!settingsVisible);
    setTocVisible(false);
    setBookmarksVisible(false);
    setShowUI(true);
  };

  const toggleToc = () => {
    setTocVisible(!tocVisible);
    setSettingsVisible(false);
    setBookmarksVisible(false);
    setShowUI(true);
  };

  const toggleBookmark = () => {
    setBookmarksVisible(!bookmarksVisible);
    setSettingsVisible(false);
    setTocVisible(false);
    setShowUI(true);
  };

  // Navigate to next/previous page
  const prevPage = () => {
    if (renditionRef.current) {
      renditionRef.current.prev();
    }
  };

  const nextPage = () => {
    if (renditionRef.current) {
      renditionRef.current.next();
    }
  };

  // Gesture event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent default behavior to avoid conflicting with epub.js readers
    e.stopPropagation();
    
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
    setTouchStartTime(Date.now());

    // Set up long press timer
    const timer = setTimeout(() => {
      // Handle long press action here
      console.log("Long press detected");
    }, 500);
    
    setLongPressTimer(timer);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Prevent default to disable epub.js built-in handling
    e.stopPropagation();
    
    // Clear long press timer on move
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    // Skip if no starting point
    if (touchStartX === null || touchStartY === null) return;
    
    const touch = e.touches[0];
    const moveX = touch.clientX - touchStartX;
    const moveY = touch.clientY - touchStartY;
    
    // Check if horizontal swipe is significant and greater than vertical movement
    if (Math.abs(moveX) > 30 && Math.abs(moveX) > Math.abs(moveY)) {
      e.preventDefault(); // Prevent default behavior like scrolling
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Prevent default behavior to avoid conflicting with epub.js readers
    e.stopPropagation();
    
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    // Skip if no starting point
    if (touchStartX === null || touchStartY === null || touchStartTime === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const moveX = touchEndX - touchStartX;
    const moveY = touchEndY - touchStartY;
    const timeElapsed = Date.now() - touchStartTime;
    
    // Check if it's a tap (short press without much movement)
    if (Math.abs(moveX) < 10 && Math.abs(moveY) < 10 && timeElapsed < 300) {
      toggleUIVisibility();
    } 
    // Check for horizontal swipe
    else if (Math.abs(moveX) > 30 && Math.abs(moveX) > Math.abs(moveY)) {
      if (moveX > 0) {
        prevPage();
      } else {
        nextPage();
      }
    }
    
    // Reset touch state
    setTouchStartX(null);
    setTouchStartY(null);
    setTouchStartTime(null);
  };

  // Mouse/click handlers
  const handleClick = (e: React.MouseEvent) => {
    toggleUIVisibility();
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (uiTimeout) {
        clearTimeout(uiTimeout);
      }
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [uiTimeout, longPressTimer]);

  return (
    <div className="flex flex-col w-full h-screen relative">
      {/* Single header with very transparent background */}
      <div className={`absolute top-0 left-0 right-0 z-50 h-12 flex items-center justify-between px-4 
        transition-transform duration-300 ease-in-out ${showUI ? 'translate-y-0' : '-translate-y-full'} 
        bg-slate-800/40 backdrop-blur-sm`}>
        <Link href="/" className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5 text-secondary" />
          <span className="font-medium truncate max-w-[200px] sm:max-w-xs text-primary">
            {bookTitle}
            {chapter && <span className="text-sm font-normal opacity-70 ml-2 hidden md:inline truncate">— {chapter}</span>}
          </span>
        </Link>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={toggleBookmark}
            variant={isCurrentLocationBookmarked ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8 text-primary"
          >
            <Bookmark className={`h-5 w-5 ${isCurrentLocationBookmarked ? "fill-current" : ""}`} />
          </Button>
          <Button
            onClick={toggleToc}
            variant={tocVisible ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8 text-primary"
          >
            <BookOpen className="h-5 w-5" />
          </Button>
          <Button
            onClick={toggleSettings}
            variant={settingsVisible ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8 text-primary"
          >
            <Settings2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Settings panel (placeholder) */}
      {settingsVisible && (
        <div className="absolute top-12 right-0 z-40 w-64 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-4 rounded-bl-md shadow-lg">
          <h3 className="font-medium mb-2">Settings</h3>
          <p className="text-sm text-muted-foreground">Reader settings panel</p>
        </div>
      )}
      
      {/* TOC panel (placeholder) */}
      {tocVisible && (
        <div className="absolute top-12 right-0 z-40 w-64 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-4 rounded-bl-md shadow-lg">
          <h3 className="font-medium mb-2">Table of Contents</h3>
          <p className="text-sm text-muted-foreground">Book chapters will appear here</p>
        </div>
      )}
      
      {/* Bookmarks panel (placeholder) */}
      {bookmarksVisible && (
        <div className="absolute top-12 right-0 z-40 w-64 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-4 rounded-bl-md shadow-lg">
          <h3 className="font-medium mb-2">Bookmarks</h3>
          <p className="text-sm text-muted-foreground">Your saved bookmarks will appear here</p>
        </div>
      )}
      
      {/* Gesture capture layer */}
      <div 
        ref={gestureLayerRef}
        className="absolute inset-0 z-30 touch-none pointer-events-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      />
      
      {/* Reader (full height) */}
      <div className="w-full h-full">
        <ReactReader
          url={bookUrl}
          location={location}
          locationChanged={(epubcfi: string) => setLocation(epubcfi)}
          getRendition={getRendition}
          showToc={false}
          epubOptions={{
            flow: "paginated",
            width: "100%",
            height: "100%",
            manager: "continuous",
            snap: false // Disable built-in swipe
          }}
        />
      </div>
    </div>
  );
} 