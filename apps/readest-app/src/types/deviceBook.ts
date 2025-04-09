import { BookFormat } from './book';

/**
 * Represents a book file stored on a specific device
 */
export interface DeviceBookFile {
  id: string;                // Database record ID
  user_book_id: string;      // FK to UserBook
  device_id: string;         // Unique identifier for the device
  file_path: string;         // Path to the file in app directory (desktop/mobile)
  original_file_name: string; // Original file name for user recognition
  file_size: number;         // For basic verification
  file_format: string;       // Format of the book file
  is_web_loaded: boolean;     // Flag for web platform
  
  // Metadata
  created_at: string;
  updated_at: string;
  last_accessed_at: string;  // When the file was last opened
} 