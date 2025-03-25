"use client";

import React from 'react';
import { BookOpen } from 'lucide-react';

interface TocItem {
  href: string;
  label: string;
  subitems?: TocItem[];
}

interface ReaderTocProps {
  visible: boolean;
  theme: string;
  toc: TocItem[];
  onItemClick: (href: string) => void;
}

export default function ReaderToc({ visible, theme, toc, onItemClick }: ReaderTocProps) {
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
          'text-[#5f4b32]'}`}>Table of Contents</h3>
      </div>
      <div className="p-4 max-h-[calc(100%-60px)] overflow-y-auto">
        {toc.length === 0 ? (
          <p className={`text-sm italic ${
            theme === 'light' ? 'text-gray-500' : 
            theme === 'dark' ? 'text-gray-400' : 
            'text-[#8a7048]'}`}>
            No table of contents available for this book.
          </p>
        ) : (
          toc.map((item, index) => (
            <button
              key={index}
              onClick={() => onItemClick(item.href)}
              className={`w-full text-left p-2 text-sm rounded my-1 flex items-start 
                ${theme === 'light' ? 'hover:bg-gray-100 text-gray-700' : 
                theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 
                'hover:bg-[#ede4cb] text-[#5f4b32]'}`}
            >
              <BookOpen className={`h-4 w-4 mr-2 mt-0.5 flex-shrink-0 
                ${theme === 'light' ? 'text-blue-500' :
                theme === 'dark' ? 'text-blue-400' :
                'text-[#8a7048]'}`} />
              <span className="line-clamp-2">{item.label}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
} 