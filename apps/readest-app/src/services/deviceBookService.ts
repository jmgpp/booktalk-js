import { supabase } from '@/lib/supabase/client';
import { DeviceBookFile } from '@/types/deviceBook';
import { UserBook } from '@/types/userBook';
import { BookFormat } from '@/types/book';
import { getDeviceId, isWebBrowser, getAppBookStoragePath } from './deviceService';
import { isTauriAppPlatform } from './environment';
import { getFilename } from '@/utils/book';
import { webFileStore } from '@/store/webFileStore';
import { Database } from '@/db/database';

// Table name in the database
const TABLE_NAME = 'device_book_files';

/**
 * Check if a book has an associated file on the current device
 */
export async function hasBookFile(userBookId: string): Promise<boolean> {
  try {
    if (!isTauriAppPlatform()) {
      // Web check
      const webFileId = `webfile-${userBookId}`;
      return webFileStore.has(webFileId);
    }
    
    // Tauri check
    const filePath = await getBookFilePath(userBookId);
    if (!filePath) return false;
    
    try {
      const { exists } = await import('@tauri-apps/api/fs');
      return await exists(filePath);
    } catch (e) {
      console.error('[hasBookFile] Failed to import or use Tauri fs.exists:', e);
      return false; // Assume false if Tauri module fails
    }
    
  } catch (error) {
    console.error('Error checking if book has file:', error);
    return false;
  }
}

/**
 * Get the device book file record for a user book
 */
export async function getDeviceBookFile(userBookId: string): Promise<DeviceBookFile | null> {
  try {
    const db = await Database.getInstance();
    const deviceId = localStorage.getItem('booktalk_device_id') || 'unknown';
    
    const result = await db.executeSql(
      `SELECT * FROM device_book_files 
       WHERE user_book_id = ? AND device_id = ?
       LIMIT 1`,
      [userBookId, deviceId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0] as DeviceBookFile;
  } catch (error) {
    console.error('Error getting device book file:', error);
    return null;
  }
}

/**
 * Check if a book exists in the web file store
 */
async function checkWebFileStore(userBookId: string): Promise<boolean> {
  // This would need more sophisticated implementation for persistence
  // Currently just checks if there's a temporary web file with a matching key pattern
  for (const key of webFileStore.keys()) {
    if (key.includes(userBookId)) {
      return true;
    }
  }
  return false;
}

/**
 * Import a file for a user book on the current device
 * 
 * For desktop: Creates a copy in the app directory
 * For web: Stores in the webFileStore and records metadata
 */
export async function importBookFile(
  userBook: UserBook,
  file: File
): Promise<boolean> {
  try {
    const fileData = await file.arrayBuffer();
    
    if (isTauriAppPlatform()) {
      // For desktop environment, save to app directory
      return await importDesktopFile(userBook.id, fileData, file.name);
    } else {
      // For web environment, store in memory
      return await importWebFile(userBook.id, fileData, file.name);
    }
  } catch (error) {
    console.error('Error importing book file:', error);
    return false;
  }
}

/**
 * Import a file in desktop environment
 */
async function importDesktopFile(
  userBookId: string,
  fileData: ArrayBuffer,
  originalFileName: string
): Promise<boolean> {
  // No need for isTauri check here, as this is only called for desktop
  try {
    console.log(`Importing desktop file for book ${userBookId}: ${originalFileName}`);
    
    const bookStoragePath = await getAppBookStoragePath();
    if (!bookStoragePath) {
      console.error('Could not get app book storage path');
      return false;
    }
    console.log(`Got book storage path: ${bookStoragePath}`);
    
    // Use direct imports for Tauri APIs
    const { join } = await import('@tauri-apps/api/path');
    const { createDir, writeBinaryFile, exists } = await import('@tauri-apps/api/fs');
    
    const cleanFileName = originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const destFilePath = await join(
      bookStoragePath, 
      `${userBookId}_${timestamp}_${cleanFileName}`
    );
    console.log(`Created destination file path: ${destFilePath}`);
    
    // Create directory if it doesn't exist
    // Check existence first to avoid potential warnings/errors if it already exists
    if (!(await exists(bookStoragePath))) {
        console.log(`Directory ${bookStoragePath} does not exist. Creating...`);
        await createDir(bookStoragePath, { recursive: true });
    } else {
        console.log(`Directory ${bookStoragePath} already exists.`);
    }
    
    console.log(`Writing ${fileData.byteLength} bytes to destination`);
    await writeBinaryFile(destFilePath, new Uint8Array(fileData));
    console.log(`File written successfully, saving to database`);
    
    await saveDeviceBookFile(
      userBookId,
      destFilePath,
      originalFileName,
      fileData.byteLength
    );
    console.log(`Book file imported successfully`);
    return true;

  } catch (error) {
    console.error('Error importing desktop file:', error);
    // Added check for specific error type from Tauri file operations
    if (error instanceof Error && error.message.includes("path\": \"/\"")) {
        console.error('>>> Potential Root Directory Write Error! Check permissions and storage path calculation. <<<');
    }
    return false;
  }
}

/**
 * Import a file in web environment
 */
async function importWebFile(
  userBookId: string,
  fileData: ArrayBuffer,
  originalFileName: string
): Promise<boolean> {
  try {
    // Use the shared webFileStore
    // Key needs to match what ensureBookData expects
    const webFileId = `webfile-${userBookId}`;
    const fileObject = new File([fileData], originalFileName); // Reconstruct File object
    
    webFileStore.set(webFileId, fileObject);
    console.log(`[importWebFile] Stored file in webFileStore with ID: ${webFileId}`);
    
    // Save metadata to database (using a placeholder path)
    await saveDeviceBookFile(
      userBookId,
      `webfile:${userBookId}`, // Keep placeholder path distinct
      originalFileName,
      fileData.byteLength
    );
    
    return true;
  } catch (error) {
    console.error('Error importing web file:', error);
    return false;
  }
}

/**
 * Save device book file info to database
 */
async function saveDeviceBookFile(
  userBookId: string,
  filePath: string,
  originalFileName: string,
  fileSize: number
): Promise<void> {
  try {
    console.log(`Saving device book file for book ${userBookId} at path ${filePath}`);
    
    const db = await Database.getInstance();
    const deviceId = localStorage.getItem('booktalk_device_id') || 'unknown';
    const fileFormat = getFileFormat(originalFileName);
    
    console.log(`Device ID: ${deviceId}, File format: ${fileFormat}`);
    
    // Check if record exists
    const existingFile = await getDeviceBookFile(userBookId);
    
    if (existingFile) {
      console.log(`Updating existing device book file record for ${userBookId}`);
      try {
        await db.executeSql(
          `UPDATE device_book_files 
           SET file_path = ?, original_file_name = ?, file_size = ?, 
               file_format = ?, updated_at = NOW()
           WHERE user_book_id = ? AND device_id = ?`,
          [filePath, originalFileName, fileSize, fileFormat, userBookId, deviceId]
        );
        console.log(`Updated device book file record successfully`);
      } catch (updateError) {
        console.error(`SQL error updating device_book_files:`, updateError);
        throw updateError;
      }
    } else {
      console.log(`Creating new device book file record for ${userBookId}`);
      try {
        await db.executeSql(
          `INSERT INTO device_book_files
           (user_book_id, device_id, file_path, original_file_name, 
            file_size, file_format, created_at, updated_at, last_accessed_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
          [userBookId, deviceId, filePath, originalFileName, fileSize, fileFormat]
        );
        console.log(`Created device book file record successfully`);
      } catch (insertError) {
        console.error(`SQL error inserting into device_book_files:`, insertError);
        throw insertError;
      }
    }
    
    // Update user_books hasfile flag
    console.log(`Updating hasfile flag for user_book ${userBookId}`);
    try {
      await db.executeSql(
        `UPDATE user_books SET hasfile = true WHERE id = ?`,
        [userBookId]
      );
      console.log(`Updated hasfile flag successfully`);
    } catch (updateBookError) {
      console.error(`SQL error updating user_books.hasfile:`, updateBookError);
      throw updateBookError;
    }
  } catch (error) {
    console.error('Error saving device book file:', error);
    // Re-throw so we can see the error in importBookFile
    throw error;
  }
}

/**
 * Get the format from a filename (basic implementation)
 */
function getFormatFromFilename(filename: string): BookFormat | null {
  const ext = filename.split('.').pop()?.toUpperCase();
  switch (ext) {
    case 'EPUB': return 'EPUB';
    case 'PDF': return 'PDF';
    case 'MOBI': return 'MOBI';
    case 'AZW3': return 'MOBI'; // Treat AZW3 as MOBI for simplicity?
    case 'CBZ': return 'CBZ';
    case 'FB2': return 'FB2';
    default: return null;
  }
}

/**
 * Get the file object for a book on the current device
 */
export async function getBookFile(userBookId: string): Promise<File | null> {
    try {
      if (!isTauriAppPlatform()) {
        // Web check
        const webFileId = `webfile-${userBookId}`;
        const file = webFileStore.get(webFileId);
        console.log(`[getBookFile] Web check for ${webFileId}: ${file ? 'Found' : 'Not Found'}`);
        return file || null;
      }
      
      // Tauri check
      const filePath = await getBookFilePath(userBookId);
      if (!filePath) {
          console.log(`[getBookFile] No file path found for book ID: ${userBookId}`);
          return null;
      }
      
      try {
        const { readBinaryFile } = await import('@tauri-apps/api/fs');
        const { basename } = await import('@tauri-apps/api/path');
        
        console.log(`[getBookFile] Reading Tauri file from path: ${filePath}`);
        const fileDataResult = await readBinaryFile(filePath);
        const fileName = await basename(filePath);
        
        return new File([fileDataResult.buffer], fileName);
      } catch(e) {
        console.error('[getBookFile] Failed to import/use Tauri fs/path modules:', e);
        return null;
      }
      
    } catch (error) {
      console.error(`[getBookFile] Error getting book file for ID ${userBookId}:`, error);
      return null;
    }
  }

/**
 * Open a book on the current device
 * For desktop, reads the file directly
 * For web, returns null if the file isn't in memory
 */
export async function openBookFile(userBookId: string): Promise<boolean> {
  try {
    if (!isTauriAppPlatform()) return false;
    
    const filePath = await getBookFilePath(userBookId);
    if (!filePath) return false;
    
    const shellModule = await import('@tauri-apps/api/shell');
    if (!shellModule) return false;
    
    await shellModule.open(filePath);
    await updateLastAccess(userBookId);
    
    return true;
  } catch (error) {
    console.error('Error opening book file:', error);
    return false;
  }
}

/**
 * Update the last accessed timestamp for a book file
 */
async function updateLastAccess(userBookId: string): Promise<void> {
  try {
    const db = await Database.getInstance();
    const deviceId = localStorage.getItem('booktalk_device_id') || 'unknown';
    
    await db.executeSql(
      `UPDATE device_book_files 
       SET last_accessed_at = NOW()
       WHERE user_book_id = ? AND device_id = ?`,
      [userBookId, deviceId]
    );
  } catch (error) {
    console.error('Error updating last access time:', error);
  }
}

/**
 * Get the file path for a book on the current device (Tauri only)
 */
async function getBookFilePath(userBookId: string): Promise<string | null> {
    if (!isTauriAppPlatform()) {
      console.warn("[getBookFilePath] Attempted to get file path in non-Tauri environment.");
      return null; // Only relevant for Tauri
    }
    
    try {
      const db = await Database.getInstance();
      // Ensure deviceId is fetched reliably, maybe fallback if localStorage fails
      const deviceId = localStorage.getItem('booktalk_device_id');
      if (!deviceId) {
          console.error("[getBookFilePath] Failed to retrieve device_id from localStorage.");
          // Maybe try getDeviceId() service function as fallback?
          // const fallbackDeviceId = await getDeviceId(); 
          return null; // Cannot proceed without device ID
      }
      
      const result = await db.executeSql(
        `SELECT file_path FROM device_book_files 
         WHERE user_book_id = ? AND device_id = ?
         LIMIT 1`,
        [userBookId, deviceId]
      );
      
      if (result.rows.length > 0 && result.rows[0].file_path) {
          return result.rows[0].file_path;
      } else {
          console.log(`[getBookFilePath] No file path found in DB for book ${userBookId} on device ${deviceId}`);
          return null;
      }
    } catch (error) {
      console.error(`[getBookFilePath] Error getting book file path for ${userBookId}:`, error);
      return null;
    }
  }

// Helper to extract file format
function getFileFormat(fileName: string): BookFormat | null {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    // Validate against known BookFormat types
    if (['epub', 'pdf', 'mobi', 'cbz', 'fb2', 'azw3'].includes(ext)) {
        return ext as BookFormat;
    }
    console.warn(`[getFileFormat] Unknown file extension: ${ext} for file: ${fileName}`);
    return null; // Return null if extension is not a valid BookFormat
} 