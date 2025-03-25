"use client";

import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpenCheck, Upload, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface BookFileProps {
  onBookSelected: (bookUrl: string) => void;
}

export default function BookFileSelector({ onBookSelected }: BookFileProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [availableBooks, setAvailableBooks] = useState<string[]>([
    'Alice in Wonderland' // Default book that we know exists
  ]);
  const [open, setOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check if file is an EPUB
    if (file.name.toLowerCase().endsWith('.epub')) {
      setSelectedFile(file);
      setError(null);
    } else {
      setSelectedFile(null);
      setError('Please select an EPUB file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return newProgress;
      });
    }, 300);
    
    try {
      // In a real app, you would upload the file to a server
      // For now, we'll generate a temporary URL to demonstrate the functionality
      const bookUrl = URL.createObjectURL(selectedFile);
      
      // Wait for the "upload" simulation to complete
      setTimeout(() => {
        clearInterval(interval);
        setUploadProgress(100);
        
        // Add the book to available books
        setAvailableBooks(prev => [...prev, selectedFile.name.replace('.epub', '')]);
        
        // Notify parent component
        onBookSelected(bookUrl);
        
        // Close the dialog
        setIsUploading(false);
        setSelectedFile(null);
        setOpen(false);
      }, 3000);
    } catch (err) {
      clearInterval(interval);
      setError('Error uploading file. Please try again.');
      setIsUploading(false);
    }
  };

  const handleSelectBook = (book: string) => {
    // Map book name to URL - in a real app this would be more sophisticated
    const bookUrl = book === 'Alice in Wonderland' 
      ? '/books/alice.epub' 
      : `/books/${book.toLowerCase().replace(/\s+/g, '-')}.epub`;
    
    onBookSelected(bookUrl);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <BookOpenCheck className="h-5 w-5" />
          <span>Select Book</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select a Book</DialogTitle>
          <DialogDescription>
            Choose from available books or upload your own EPUB file.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Available Books</h3>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
              {availableBooks.map((book, index) => (
                <Button 
                  key={index} 
                  variant="outline" 
                  className="justify-start gap-2"
                  onClick={() => handleSelectBook(book)}
                >
                  <BookOpenCheck className="h-4 w-4" />
                  {book}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Upload EPUB</h3>
            <div className="flex flex-col gap-2">
              <Input
                type="file"
                accept=".epub"
                onChange={handleFileChange}
                disabled={isUploading}
                className="text-sm"
              />
              
              {error && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <X className="h-4 w-4" />
                  {error}
                </p>
              )}
              
              {selectedFile && (
                <div className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
              
              {isUploading && (
                <div className="w-full bg-secondary rounded-full h-2.5 my-2">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload and Open'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 