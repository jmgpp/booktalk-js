"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ReactReader } from 'react-reader';
import Link from 'next/link';
import { ArrowLeft, Menu, Minus, Plus, ChevronLeft, ChevronRight, BookOpen, Settings2, AlignLeft, AlignJustify } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Script from 'next/script';

export default function EpubReaderPage() {
  const [location, setLocation] = useState<string | number>(0);
  const [size, setSize] = useState<number>(100);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [settingsVisible, setSettingsVisible] = useState<boolean>(false);
  const [tocVisible, setTocVisible] = useState<boolean>(false);
  const [chapter, setChapter] = useState<string>("");
  const [toc, setToc] = useState<any[]>([]);
  const [theme, setTheme] = useState<string>("light");
  const [bookTitle, setBookTitle] = useState<string>("Alice in Wonderland");
  const [touchPosition, setTouchPosition] = useState<number | null>(null);
  const [font, setFont] = useState<string>("Default");
  const [margins, setMargins] = useState<number>(20); // percentage
  const [lineHeight, setLineHeight] = useState<number>(1.5);
  const [textAlign, setTextAlign] = useState<string>("justify");
  const [userChangedSettings, setUserChangedSettings] = useState<boolean>(false);
  const renditionRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // When the rendition is created, store the reference
  const getRendition = (rendition: any) => {
    renditionRef.current = rendition;
    
    // Only apply custom settings if user has changed something
    if (userChangedSettings) {
      setTimeout(() => {
        applySettings();
      }, 100);
    }

    // Listen for location change and update chapter title
    rendition.on('locationChanged', (loc: any) => {
      if (rendition.location && rendition.location.start) {
        const { href } = rendition.location.start;
        const chapterItem = toc.find(item => item.href.includes(href.split('#')[0]));
        if (chapterItem) {
          setChapter(chapterItem.label);
        }
      }
    });

    // Get book title from metadata
    rendition.book.loaded.metadata.then((metadata: any) => {
      if (metadata.title) {
        setBookTitle(metadata.title);
      }
    });

    setIsLoading(false);
  };

  // Apply all settings to the reader
  const applySettings = () => {
    if (!renditionRef.current) return;
    
    const rendition = renditionRef.current;
    
    // Base styles for all themes
    const baseStyles = {
      '::selection': {
        background: 'rgba(72, 194, 247, 0.3)'
      },
      '.epubjs-hl': {
        fill: theme === 'dark' ? 'rgba(72, 194, 247, 0.5)' : 'rgba(72, 194, 247, 0.3)',
        'mix-blend-mode': theme === 'dark' ? 'screen' : 'multiply'
      },
      'body': {
        fontFamily: getFontFamily(),
        lineHeight: lineHeight,
        textAlign: textAlign,
        padding: `0 ${margins}%`
      },
      '.ReactReader': {
        height: '100%',
        width: '100%', 
        overflow: 'hidden'
      }
    };
    
    // Theme-specific styles
    let themeStyles = {};
    if (theme === 'light') {
      themeStyles = {
        'body': {
          color: '#383150',
          background: '#ffffff',
        },
        'a': {
          color: '#48C2F7'
        },
        '.epub-container': {
          background: '#ffffff'
        }
      };
    } else if (theme === 'dark') {
      themeStyles = {
        'body': {
          color: '#e1e1e1',
          background: '#121212',
        },
        'a': {
          color: '#55ccff'
        },
        '.epub-container': {
          background: '#121212'
        }
      };
    } else if (theme === 'sepia') {
      themeStyles = {
        'body': {
          color: '#5f4b32',
          background: '#f6f0e0',
        },
        'a': {
          color: '#48C2F7'
        },
        '.epub-container': {
          background: '#f6f0e0'
        }
      };
    }
    
    // Merge base styles with theme styles
    const mergedStyles = { ...baseStyles, ...themeStyles };
    
    // Apply all styles
    rendition.themes.default(mergedStyles);
    
    // Apply font size separately
    rendition.themes.fontSize(`${size}%`);
    
    // Apply styles directly to iframe content (more reliable approach)
    try {
      const iframe = document.querySelector('.epub-view iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentDocument) {
        const iframeDoc = iframe.contentDocument;
        const style = iframeDoc.createElement('style');
        style.textContent = `
          body {
            font-family: ${getFontFamily()} !important;
            line-height: ${lineHeight} !important;
            text-align: ${textAlign} !important;
            padding: 0 ${margins}% !important;
            color: ${theme === 'light' ? '#383150' : theme === 'dark' ? '#e1e1e1' : '#5f4b32'} !important;
            background-color: ${theme === 'light' ? '#ffffff' : theme === 'dark' ? '#121212' : '#f6f0e0'} !important;
          }
        `;
        
        // Remove any previously injected style
        const existingStyle = iframeDoc.getElementById('epub-custom-style');
        if (existingStyle) {
          existingStyle.remove();
        }
        
        style.id = 'epub-custom-style';
        iframeDoc.head.appendChild(style);
      }
    } catch (error) {
      console.error('Error applying styles directly:', error);
    }
  };

  // Get font family based on selection
  const getFontFamily = () => {
    switch (font) {
      case 'Roboto':
        return '"Roboto", sans-serif';
      case 'Vollkorn':
        return '"Vollkorn", serif';
      case 'Serif':
        return 'Georgia, serif';
      case 'Sans':
        return 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
      case 'Mono':
        return 'Consolas, Monaco, "Andale Mono", monospace';
      default:
        return 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
    }
  };

  // Handle settings changes - set userChangedSettings flag
  const handleSettingChange = () => {
    if (!userChangedSettings) {
      setUserChangedSettings(true);
    }
  };

  // Handle settings changes
  const changeFontSize = (newSize: number) => {
    handleSettingChange();
    setSize(newSize);
    applySettings();
  };

  const changeTheme = (newTheme: string) => {
    handleSettingChange();
    setTheme(newTheme);
    applySettings();
  };

  const changeFont = (newFont: string) => {
    handleSettingChange();
    setFont(newFont);
    applySettings();
  };

  const changeMargins = (newMargins: number[]) => {
    handleSettingChange();
    setMargins(newMargins[0]);
    applySettings();
  };

  const changeLineHeight = (newLineHeight: number[]) => {
    handleSettingChange();
    setLineHeight(newLineHeight[0]);
    applySettings();
  };

  const changeTextAlign = (newAlign: string) => {
    handleSettingChange();
    setTextAlign(newAlign);
    applySettings();
  };

  // Get TOC
  const handleTocChange = (newToc: any[]) => {
    setToc(newToc);
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

  // Navigate to a specific TOC item
  const handleTocItemClick = (href: string) => {
    if (renditionRef.current) {
      renditionRef.current.display(href);
      setTocVisible(false);
    }
  };

  // Toggle panels
  const toggleSettings = () => {
    setSettingsVisible(!settingsVisible);
    setTocVisible(false);
  };

  const toggleToc = () => {
    setTocVisible(!tocVisible);
    setSettingsVisible(false);
  };

  // Touch event handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    const touchDown = e.touches[0].clientX;
    setTouchPosition(touchDown);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchPosition === null) {
      return;
    }
    
    const currentTouch = e.touches[0].clientX;
    const diff = touchPosition - currentTouch;
    
    // Determine swipe direction with a minimum threshold
    if (diff > 50) {
      nextPage();
      setTouchPosition(null);
    }
    
    if (diff < -50) {
      prevPage();
      setTouchPosition(null);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevPage();
      } else if (e.key === 'ArrowRight') {
        nextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Apply settings when dependencies change
  useEffect(() => {
    if (renditionRef.current && userChangedSettings) {
      applySettings();
    }
  }, [size, theme, font, margins, lineHeight, textAlign, userChangedSettings]);

  // Re-apply settings periodically to handle iframe refreshes, but only if user changed settings
  useEffect(() => {
    if (!userChangedSettings) return;
    
    const interval = setInterval(() => {
      if (renditionRef.current) {
        applySettings();
      }
    }, 2000); // Check every 2 seconds
    
    return () => clearInterval(interval);
  }, [size, theme, font, margins, lineHeight, textAlign, userChangedSettings]);

  // Custom loading view component
  const loadingView = (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-card bg-opacity-90 z-10">
      <Skeleton className="h-12 w-12 rounded-full bg-primary/20" />
      <p className="text-muted-foreground mt-3 animate-pulse">Loading your book...</p>
    </div>
  );

  // TOC Panel
  const TocPanel = () => (
    <div className={`absolute top-[48px] right-0 h-[calc(100%-48px)] w-72 
      ${theme === 'light' ? 'bg-white border-gray-200' : 
        theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 
        'bg-[#f9f3e3] border-[#d8c9a3]'} 
      border-l z-20 transform transition-transform duration-300 ${tocVisible ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className={`p-4 border-b ${
        theme === 'light' ? 'border-gray-200' : 
        theme === 'dark' ? 'border-gray-800' : 
        'border-[#d8c9a3]'}`}>
        <h3 className={`text-lg font-semibold ${
          theme === 'light' ? 'text-gray-900' : 
          theme === 'dark' ? 'text-gray-100' : 
          'text-[#5f4b32]'}`}>Table of Contents</h3>
      </div>
      <div className="p-4 max-h-[calc(100%-60px)] overflow-y-auto">
        {toc.map((item, index) => (
          <button
            key={index}
            onClick={() => handleTocItemClick(item.href)}
            className={`w-full text-left p-2 text-sm rounded my-1 flex items-start ${
              theme === 'light' ? 'hover:bg-gray-100 text-gray-700' : 
              theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 
              'hover:bg-[#ede4cb] text-[#5f4b32]'}`}
          >
            <BookOpen className={`h-4 w-4 mr-2 mt-0.5 flex-shrink-0 ${
              theme === 'light' ? 'text-blue-500' :
              theme === 'dark' ? 'text-blue-400' :
              'text-[#8a7048]'}`} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // Custom settings component
  const SettingsPanel = () => (
    <div className={`absolute top-[48px] right-0 h-[calc(100%-48px)] w-72 
      ${theme === 'light' ? 'bg-white border-gray-200' : 
        theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 
        'bg-[#f9f3e3] border-[#d8c9a3]'} 
      border-l z-20 transform transition-transform duration-300 ${settingsVisible ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className={`p-4 border-b ${
        theme === 'light' ? 'border-gray-200' : 
        theme === 'dark' ? 'border-gray-800' : 
        'border-[#d8c9a3]'}`}>
        <h3 className={`text-lg font-semibold ${
          theme === 'light' ? 'text-gray-900' : 
          theme === 'dark' ? 'text-gray-100' : 
          'text-[#5f4b32]'}`}>Settings</h3>
      </div>
      <div className={`p-4 max-h-[calc(100%-60px)] overflow-y-auto space-y-6`}>
        {/* Theme */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            theme === 'light' ? 'text-gray-700' : 
            theme === 'dark' ? 'text-gray-300' : 
            'text-[#5f4b32]'
          }`}>Theme</label>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => changeTheme('light')}
              variant={theme === 'light' ? 'default' : 'outline'}
              size="sm"
              className={`w-20 ${
                theme === 'light' 
                  ? ''
                  : theme === 'dark'
                  ? 'border-gray-700 hover:bg-gray-800 hover:text-gray-200 text-gray-300 focus:ring-offset-gray-900'
                  : 'border-[#d8c9a3] hover:bg-[#ede4cb] text-[#5f4b32] focus:ring-offset-[#f6f0e0]'
              }`}
            >
              Light
            </Button>
            <Button
              onClick={() => changeTheme('dark')}
              variant={theme === 'dark' ? 'default' : 'outline'}
              size="sm"
              className={`w-20 ${
                theme === 'light' 
                  ? ''
                  : theme === 'dark'
                  ? 'border-gray-700 hover:bg-gray-800 hover:text-gray-200 text-gray-300 focus:ring-offset-gray-900'
                  : 'border-[#d8c9a3] hover:bg-[#ede4cb] text-[#5f4b32] focus:ring-offset-[#f6f0e0]'
              }`}
            >
              Dark
            </Button>
            <Button
              onClick={() => changeTheme('sepia')}
              variant={theme === 'sepia' ? 'default' : 'outline'}
              size="sm"
              className={`w-20 ${
                theme === 'light' 
                  ? ''
                  : theme === 'dark'
                  ? 'border-gray-700 hover:bg-gray-800 hover:text-gray-200 text-gray-300 focus:ring-offset-gray-900'
                  : 'border-[#d8c9a3] hover:bg-[#ede4cb] text-[#5f4b32] focus:ring-offset-[#f6f0e0]'
              }`}
            >
              Sepia
            </Button>
          </div>
        </div>
        
        {/* Font Family */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            theme === 'light' ? 'text-gray-700' : 
            theme === 'dark' ? 'text-gray-300' : 
            'text-[#5f4b32]'
          }`}>Font</label>
          <Select value={font} onValueChange={changeFont}>
            <SelectTrigger className={`w-full ${
              theme === 'light' ? '' : 
              theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-200' : 
              'bg-[#f6f0e0] border-[#d8c9a3] text-[#5f4b32]'
            }`}>
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent className={
              theme === 'light' ? '' : 
              theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-200' : 
              'bg-[#f6f0e0] border-[#d8c9a3] text-[#5f4b32]'
            }>
              <SelectItem value="Default">Default</SelectItem>
              <SelectItem value="Roboto">Roboto</SelectItem>
              <SelectItem value="Vollkorn">Vollkorn</SelectItem>
              <SelectItem value="Serif">Serif</SelectItem>
              <SelectItem value="Sans">Sans Serif</SelectItem>
              <SelectItem value="Mono">Monospace</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Font Size */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            theme === 'light' ? 'text-gray-700' : 
            theme === 'dark' ? 'text-gray-300' : 
            'text-[#5f4b32]'
          }`}>Font Size</label>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => changeFontSize(Math.max(70, size - 10))}
              variant="outline"
              size="icon"
              className={`h-8 w-8 ${
                theme === 'light' ? '' : 
                theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 
                'bg-[#f6f0e0] border-[#d8c9a3] text-[#5f4b32] hover:bg-[#ede4cb]'
              }`}
              disabled={size <= 70}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <div className={`text-sm font-medium w-12 text-center ${
              theme === 'light' ? 'text-gray-600' :
              theme === 'dark' ? 'text-gray-300' :
              'text-[#5f4b32]'
            }`}>{size}%</div>
            <Button
              onClick={() => changeFontSize(Math.min(150, size + 10))}
              variant="outline"
              size="icon"
              className={`h-8 w-8 ${
                theme === 'light' ? '' : 
                theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 
                'bg-[#f6f0e0] border-[#d8c9a3] text-[#5f4b32] hover:bg-[#ede4cb]'
              }`}
              disabled={size >= 150}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Margins */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            theme === 'light' ? 'text-gray-700' : 
            theme === 'dark' ? 'text-gray-300' : 
            'text-[#5f4b32]'
          }`}>Margins: {margins}%</label>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => changeMargins([Math.max(0, margins - 5)])}
              variant="outline"
              size="icon"
              className={`h-8 w-8 ${
                theme === 'light' 
                  ? ''
                  : theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 focus:ring-offset-gray-900'
                  : 'bg-[#f6f0e0] border-[#d8c9a3] text-[#5f4b32] hover:bg-[#ede4cb] focus:ring-offset-[#f6f0e0]'
              }`}
              disabled={margins <= 0}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <div className={`text-sm font-medium w-12 text-center ${
              theme === 'light' ? 'text-gray-600' :
              theme === 'dark' ? 'text-gray-300' :
              'text-[#5f4b32]'
            }`}>{margins}%</div>
            <Button
              onClick={() => changeMargins([Math.min(30, margins + 5)])}
              variant="outline"
              size="icon"
              className={`h-8 w-8 ${
                theme === 'light' 
                  ? ''
                  : theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 focus:ring-offset-gray-900'
                  : 'bg-[#f6f0e0] border-[#d8c9a3] text-[#5f4b32] hover:bg-[#ede4cb] focus:ring-offset-[#f6f0e0]'
              }`}
              disabled={margins >= 30}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Line Height */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            theme === 'light' ? 'text-gray-700' : 
            theme === 'dark' ? 'text-gray-300' : 
            'text-[#5f4b32]'
          }`}>Line Height: {lineHeight.toFixed(1)}</label>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => changeLineHeight([Math.max(1.0, lineHeight - 0.1)])}
              variant="outline"
              size="icon"
              className={`h-8 w-8 ${
                theme === 'light' ? '' : 
                theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 
                'bg-[#f6f0e0] border-[#d8c9a3] text-[#5f4b32] hover:bg-[#ede4cb]'
              }`}
              disabled={lineHeight <= 1.0}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <div className={`text-sm font-medium w-12 text-center ${
              theme === 'light' ? 'text-gray-600' :
              theme === 'dark' ? 'text-gray-300' :
              'text-[#5f4b32]'
            }`}>{lineHeight.toFixed(1)}</div>
            <Button
              onClick={() => changeLineHeight([Math.min(2.5, lineHeight + 0.1)])}
              variant="outline"
              size="icon"
              className={`h-8 w-8 ${
                theme === 'light' ? '' : 
                theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 
                'bg-[#f6f0e0] border-[#d8c9a3] text-[#5f4b32] hover:bg-[#ede4cb]'
              }`}
              disabled={lineHeight >= 2.5}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Text Alignment */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            theme === 'light' ? 'text-gray-700' : 
            theme === 'dark' ? 'text-gray-300' : 
            'text-[#5f4b32]'
          }`}>Text Alignment</label>
          <div className="flex justify-between gap-2">
            <Button
              onClick={() => changeTextAlign('left')}
              variant={textAlign === 'left' ? 'default' : 'outline'}
              size="sm"
              className={`w-[48%] ${
                textAlign !== 'left' && (
                  theme === 'light' ? '' : 
                  theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 
                  'bg-[#f6f0e0] border-[#d8c9a3] text-[#5f4b32] hover:bg-[#ede4cb]'
                )
              }`}
            >
              <AlignLeft className="h-4 w-4 mr-1" /> Left
            </Button>
            <Button
              onClick={() => changeTextAlign('justify')}
              variant={textAlign === 'justify' ? 'default' : 'outline'}
              size="sm"
              className={`w-[48%] ${
                textAlign !== 'justify' && (
                  theme === 'light' ? '' : 
                  theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 
                  'bg-[#f6f0e0] border-[#d8c9a3] text-[#5f4b32] hover:bg-[#ede4cb]'
                )
              }`}
            >
              <AlignJustify className="h-4 w-4 mr-1" /> Justify
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Script
        id="google-fonts"
        strategy="afterInteractive"
        src="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Vollkorn:wght@400;700&display=swap"
      />
      <div className={`flex flex-col h-screen ${
        theme === 'light' ? 'bg-white' : 
        theme === 'dark' ? 'bg-[#121212]' : 
        'bg-[#f6f0e0]'
      }`} ref={containerRef}>
        {/* Title Bar with improved contrast */}
        <div className={`relative z-50 h-12 flex items-center justify-between px-4 ${
          theme === 'light' || theme === 'sepia' ? 'bg-[#3d3847] text-white' : 'bg-[rgb(61,56,71)] text-palette-textLight'
        }`}>
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium truncate max-w-[200px] sm:max-w-xs">
              {bookTitle}
              {chapter && <span className="text-sm font-normal opacity-70 ml-2 hidden md:inline truncate">— {chapter}</span>}
            </span>
          </Link>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={toggleToc}
              variant={tocVisible ? "default" : "ghost"}
              size="icon"
              className={`h-8 w-8 ${
                tocVisible 
                  ? "bg-white/20" 
                  : "text-white hover:bg-white/10"
              } rounded`}
            >
              <BookOpen className="h-5 w-5" />
            </Button>
            <Button
              onClick={toggleSettings}
              variant={settingsVisible ? "default" : "ghost"}
              size="icon"
              className={`h-8 w-8 ${
                settingsVisible 
                  ? "bg-white/20" 
                  : "text-white hover:bg-white/10"
              } rounded`}
            >
              <Settings2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Full-screen Reader container with touch events */}
        <div 
          className={`flex-grow relative ${
            theme === 'light' ? 'bg-white' : 
            theme === 'dark' ? 'bg-[#121212]' : 
            'bg-[#f6f0e0]'
          }`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          style={{ 
            '--bg-color': theme === 'light' ? '#ffffff' : theme === 'dark' ? '#121212' : '#f6f0e0' 
          } as React.CSSProperties}
        >
          {isLoading && loadingView}
          
          <div className="h-full w-full">
            <style jsx global>{`
              html, body {
                background-color: ${theme === 'light' ? '#ffffff' : theme === 'dark' ? '#121212' : '#f6f0e0'} !important;
              }
              
              #__next {
                background-color: ${theme === 'light' ? '#ffffff' : theme === 'dark' ? '#121212' : '#f6f0e0'} !important;
              }
              
              body, div, #root, #__next, [data-reactroot] {
                background-color: ${theme === 'light' ? '#ffffff' : theme === 'dark' ? '#121212' : '#f6f0e0'} !important;
              }
              
              .ReactReader {
                background-color: ${theme === 'light' ? '#ffffff' : theme === 'dark' ? '#121212' : '#f6f0e0'} !important;
              }
              
              .epub-container {
                background-color: ${theme === 'light' ? '#ffffff' : theme === 'dark' ? '#121212' : '#f6f0e0'} !important;
              }
              
              .epub-view > iframe {
                background-color: ${theme === 'light' ? '#ffffff' : theme === 'dark' ? '#121212' : '#f6f0e0'} !important;
              }

              .ReactReader button {
                color: ${theme === 'light' ? '#383150' : theme === 'dark' ? '#e1e1e1' : '#5f4b32'};
              }
              
              /* Fix for slider thumb dragging */
              [data-radix-slider-thumb] {
                cursor: pointer !important;
                touch-action: none !important;
              }
            `}</style>
            
            <div className={`w-full h-full ${theme === 'light' ? 'bg-white' : theme === 'dark' ? 'bg-[#121212]' : 'bg-[#f6f0e0]'}`}>
              <ReactReader
                url="/books/alice.epub"
                location={location}
                locationChanged={(epubcfi: string) => setLocation(epubcfi)}
                getRendition={getRendition}
                showToc={false}
                tocChanged={handleTocChange}
                epubOptions={{
                  flow: "paginated",
                  width: "100%",
                  height: "100%"
                }}
                loadingView={loadingView}
              />
            </div>
            
            {/* Settings and TOC panels */}
            <SettingsPanel />
            <TocPanel />
            
            {/* Navigation buttons overlay */}
            <div className="absolute left-0 top-0 h-full flex items-center">
              <Button 
                onClick={prevPage}
                variant="ghost" 
                size="icon"
                className={`h-12 w-12 rounded-r-full ml-2 ${
                  theme === 'light' ? 'bg-gray-100/50 hover:bg-gray-200/50' :
                  theme === 'dark' ? 'bg-gray-800/50 hover:bg-gray-700/50' :
                  'bg-[#e6d9ba]/50 hover:bg-[#d8c9a3]/50'
                }`}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            </div>
            <div className="absolute right-0 top-0 h-full flex items-center">
              <Button 
                onClick={nextPage}
                variant="ghost" 
                size="icon"
                className={`h-12 w-12 rounded-l-full mr-2 ${
                  theme === 'light' ? 'bg-gray-100/50 hover:bg-gray-200/50' :
                  theme === 'dark' ? 'bg-gray-800/50 hover:bg-gray-700/50' :
                  'bg-[#e6d9ba]/50 hover:bg-[#d8c9a3]/50'
                }`}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}