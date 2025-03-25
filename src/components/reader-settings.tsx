"use client";

import React from 'react';
import { Plus, Minus, AlignLeft, AlignJustify, Sun, Moon, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReaderSettingsProps {
  visible: boolean;
  theme: string;
  font: string;
  size: number;
  margins: number;
  lineHeight: number;
  textAlign: string;
  onChangeTheme: (theme: string) => void;
  onChangeFont: (font: string) => void;
  onChangeFontSize: (size: number) => void;
  onChangeMargins: (margins: number[]) => void;
  onChangeLineHeight: (lineHeight: number[]) => void;
  onChangeTextAlign: (align: string) => void;
}

export default function ReaderSettings({
  visible,
  theme,
  font,
  size,
  margins,
  lineHeight,
  textAlign,
  onChangeTheme,
  onChangeFont,
  onChangeFontSize,
  onChangeMargins,
  onChangeLineHeight,
  onChangeTextAlign
}: ReaderSettingsProps) {
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
          <div className="flex justify-between gap-2">
            <Button
              onClick={() => onChangeTheme('light')}
              variant={theme === 'light' ? 'default' : 'outline'}
              size="sm"
              className={`w-[31%] ${
                theme !== 'light' && (
                  theme === 'light' ? '' : 
                  theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 
                  'bg-[#f6f0e0] border-[#d8c9a3] text-[#5f4b32] hover:bg-[#ede4cb]'
                )
              }`}
            >
              <Sun className="h-4 w-4 mr-1" /> Light
            </Button>
            <Button
              onClick={() => onChangeTheme('dark')}
              variant={theme === 'dark' ? 'default' : 'outline'}
              size="sm"
              className={`w-[31%] ${
                theme !== 'dark' && (
                  theme === 'light' ? '' : 
                  theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 
                  'bg-[#f6f0e0] border-[#d8c9a3] text-[#5f4b32] hover:bg-[#ede4cb]'
                )
              }`}
            >
              <Moon className="h-4 w-4 mr-1" /> Dark
            </Button>
            <Button
              onClick={() => onChangeTheme('sepia')}
              variant={theme === 'sepia' ? 'default' : 'outline'}
              size="sm"
              className={`w-[31%] ${
                theme !== 'sepia' && (
                  theme === 'light' ? '' : 
                  theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 
                  'bg-[#f6f0e0] border-[#d8c9a3] text-[#5f4b32] hover:bg-[#ede4cb]'
                )
              }`}
            >
              <BookOpen className="h-4 w-4 mr-1" /> Sepia
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
          <Select value={font} onValueChange={onChangeFont}>
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
              onClick={() => onChangeFontSize(Math.max(70, size - 10))}
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
              onClick={() => onChangeFontSize(Math.min(150, size + 10))}
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
              onClick={() => onChangeMargins([Math.max(0, margins - 5)])}
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
              onClick={() => onChangeMargins([Math.min(30, margins + 5)])}
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
              onClick={() => onChangeLineHeight([Math.max(1.0, lineHeight - 0.1)])}
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
              onClick={() => onChangeLineHeight([Math.min(2.5, lineHeight + 0.1)])}
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
              onClick={() => onChangeTextAlign('left')}
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
              onClick={() => onChangeTextAlign('justify')}
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
} 