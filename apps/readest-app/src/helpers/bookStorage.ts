import { supabase } from '@/utils/supabase';
import { isTauriAppPlatform } from '@/services/environment';
import { uploadBookFile, downloadBookFile } from '@/services/googleDrive';

/**
 * Check if the user has Google Drive integration set up
 * @param userId The user ID to check
 * @returns true if the user has Google Drive integration, false otherwise
 */
async function hasGoogleDriveIntegration(userId: string): Promise<boolean> {
  try {
    // First try to check if the table exists by doing a simple query
    const { error: tableError } = await supabase
      .from('user_drive_tokens')
      .select('id')
      .limit(1);
    
    // If the table doesn't exist, return false
    if (tableError && tableError.message.includes('does not exist')) {
      return false;
    }
    
    // If the table exists, check if this user has tokens
    const { data, error } = await supabase
      .from('user_drive_tokens')
      .select('id')
      .eq('id', userId)
      .single();
    
    // If there's no error or the error is just that no row was found,
    // the table exists and we can determine if the user has integration
    return !!data && !error;
  } catch (error) {
    console.error('Error checking Google Drive integration:', error);
    return false;
  }
}

/**
 * Stores a book file in the appropriate storage based on platform
 * @param file The book file to store
 * @param bookId The ID of the book to associate with the file
 * @param userId The ID of the user
 * @returns The storage reference (path or Google Drive ID)
 */
export async function storeBookFile(
  file: File | Blob,
  bookId: string,
  userId: string
): Promise<string | null> {
  try {
    // First check if user has Google Drive integration
    const hasGoogleDrive = await hasGoogleDriveIntegration(userId);
    
    if (hasGoogleDrive) {
      // User has Google Drive integration, store there
      const driveFileId = await uploadBookFile(file, `${bookId}.epub`);
      
      if (driveFileId) {
        // Store the Google Drive file ID in the DB
        await supabase
          .from('user_books')
          .update({
            local_file_path: `gdrive:${driveFileId}`,
            has_file: true
          })
          .eq('user_id', userId)
          .eq('book_id', bookId);
        
        return `gdrive:${driveFileId}`;
      }
    }
    
    // If no Google Drive integration or upload failed, use local storage
    if (isTauriAppPlatform()) {
      // TODO: Store locally using Tauri APIs
      // This would be implemented when supporting local files
      return null;
    } else {
      // For web, temporarily store in browser memory
      // (This is just for demo/development since browsers can't persist files)
      const memoryPath = `memory:${bookId}`;
      
      // Store in a browser cache or IndexedDB
      // For now, we'll use window.localStorage as a simple example (not good for large files)
      localStorage.setItem(`bookFile_${bookId}`, await fileToBase64(file));
      
      // Update the database
      await supabase
        .from('user_books')
        .update({
          local_file_path: memoryPath,
          has_file: true
        })
        .eq('user_id', userId)
        .eq('book_id', bookId);
      
      return memoryPath;
    }
  } catch (error) {
    console.error('Error storing book file:', error);
    return null;
  }
}

/**
 * Retrieves a book file from the appropriate storage
 * @param storagePath The storage path or reference (local path or Google Drive ID)
 * @returns The book file as a Blob
 */
export async function retrieveBookFile(storagePath: string): Promise<Blob | null> {
  try {
    if (storagePath.startsWith('gdrive:')) {
      // This is a Google Drive file
      const fileId = storagePath.replace('gdrive:', '');
      return await downloadBookFile(fileId);
    } else if (storagePath.startsWith('memory:')) {
      // This is a browser memory file
      const bookId = storagePath.replace('memory:', '');
      const base64Data = localStorage.getItem(`bookFile_${bookId}`);
      
      if (!base64Data) {
        return null;
      }
      
      return base64ToFile(base64Data);
    } else {
      // This is a local file path (Tauri platform)
      // TODO: Implement file retrieval using Tauri APIs
      return null;
    }
  } catch (error) {
    console.error('Error retrieving book file:', error);
    return null;
  }
}

/**
 * Helper to convert a File/Blob to base64 string
 */
async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Helper to convert base64 string to a Blob
 */
function base64ToFile(base64: string): Blob {
  const parts = base64.split(';base64,');
  const contentType = parts[0]?.split(':')[1] || 'application/epub+zip';
  const raw = window.atob(parts[1] || '');
  const rawLength = raw.length;
  const array = new Uint8Array(rawLength);
  
  for (let i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i);
  }
  
  return new Blob([array], { type: contentType });
} 