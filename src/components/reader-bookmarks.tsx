"use client";

import React from 'react';
import { Bookmark, X } from 'lucide-react';

interface BookmarkItem {
  cfi: string;
  text: string;
  timestamp: number;
}

interface ReaderBookmarksProps {
  visible: boolean;
  theme: string;
  bookmarks: BookmarkItem[];
  onNavigate: (cfi: string) => void;
  onRemove: (event: React.MouseEvent, cfi: string) => void;
}

export default function ReaderBookmarks({ visible, theme, bookmarks, onNavigate, onRemove }: ReaderBookmarksProps) {
  return (
    <div className={`absolute top-[48px] right-0 h-[calc(100%-48px)] w-72 
      ${theme === 'light' ? 'bg-white border-gray-200' : 
        theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 
        'bg-[#f9f3e3] border-[#d8c9a3]'} 
      border-l z-20 transform transition-transform duration-300 ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className={`p-4 border-b ${
        theme === 'light' ? 'border-gray-200' : 
        theme === 'dark' ? 'border-gray-800' : 
        'border-[#d8c9a3]'}`}>
        <h3 className={`text-lg font-semibold ${
          theme === 'light' ? 'text-gray-900' : 
          theme === 'dark' ? 'text-gray-100' : 
          'text-[#5f4b32]'}`}>Bookmarks</h3>
      </div>
      <div className="p-4 max-h-[calc(100%-60px)] overflow-y-auto">
        {bookmarks.length === 0 ? (
          <p className={`text-sm italic ${
            theme === 'light' ? 'text-gray-500' : 
            theme === 'dark' ? 'text-gray-400' : 
            'text-[#8a7048]'}`}>
            No bookmarks yet. Add bookmarks while reading to see them here.
          </p>
        ) : (
          bookmarks
            .sort((a, b) => b.timestamp - a.timestamp) // Show newest first
            .map((bookmark, index) => (
              <div
                key={index}
                onClick={() => onNavigate(bookmark.cfi)}
                className={`w-full text-left p-2 text-sm rounded my-1 flex items-start justify-between group cursor-pointer
                  ${theme === 'light' ? 'hover:bg-gray-100 text-gray-700' : 
                  theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 
                  'hover:bg-[#ede4cb] text-[#5f4b32]'}`}
              >
                <div className="flex items-start">
                  <Bookmark className={`h-4 w-4 mr-2 mt-0.5 flex-shrink-0 fill-current ${
                    theme === 'light' ? 'text-blue-500' :
                    theme === 'dark' ? 'text-blue-400' :
                    'text-[#8a7048]'}`} />
                  <div>
                    <span className="block">{bookmark.text}</span>
                    <span className={`text-xs ${
                      theme === 'light' ? 'text-gray-500' : 
                      theme === 'dark' ? 'text-gray-400' : 
                      'text-[#8a7048]/70'}`}>
                      {new Date(bookmark.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => onRemove(e, bookmark.cfi)}
                  className={`opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-full 
                    ${theme === 'light' ? 'hover:bg-gray-200 text-gray-600' : 
                    theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 
                    'hover:bg-[#d8c9a3] text-[#8a7048]'}`}
                  aria-label="Remove bookmark"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))
        )}
      </div>
    </div>
  );
} 