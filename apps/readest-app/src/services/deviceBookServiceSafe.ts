import { DeviceBookFile, UserBook } from '@/types/books';
import { Database } from '@/db/database';
import { isTauriAppPlatform } from './environment';
import { TauriFS, TauriPath, getAppBookStoragePath } from './deviceServiceSafe';

// In-memory cache for web environment
const webBookCache = new Map<string, { data: ArrayBuffer; fileName: string }>();

/**
 * Check if a book has a file on the current device
 */
export async function hasBookFile(userBookId: string): Promise<boolean> {
  try {
    if (isTauriAppPlatform()) {
      // For Tauri, check if file exists in app directory
      const filePath = await getBookFilePath(userBookId);
      return !!filePath && await TauriFS.fileExists(filePath);
    } else {
      // For web, check if we have it in memory
      return webBookCache.has(userBookId);
    }
  } catch (error) {
    console.error('Error checking if book file exists:', error);
    return false;
  }
}

/**
 * Import a file for a book on desktop platform
 */
export async function importBookFile(
  userBookId: string, 
  sourceFilePath: string | null,
  fileData: ArrayBuffer | null,
  originalFileName: string
): Promise<boolean> {
  try {
    if (isTauriAppPlatform() && sourceFilePath) {
      return await importDesktopFile(userBookId, sourceFilePath, originalFileName);
    } else if (fileData) {
      return await importWebFile(userBookId, fileData, originalFileName);
    }
    return false;
  } catch (error) {
    console.error('Error importing book file:', error);
    return false;
  }
}

/**
 * Import a desktop file (copy to app directory)
 */
async function importDesktopFile(
  userBookId: string,
  sourceFilePath: string,
  originalFileName: string
): Promise<boolean> {
  try {
    // Get the destination path in app directory
    const bookStoragePath = await getAppBookStoragePath();
    if (!bookStoragePath) return false;

    // Create a unique filename for the book
    const destFilePath = await TauriPath.join(bookStoragePath, `${userBookId}_${originalFileName}`);
    if (!destFilePath) return false;

    // Read the source file
    const fileData = await TauriFS.readBinaryFile(sourceFilePath);
    if (!fileData) return false;

    // Write to destination
    const success = await TauriFS.writeBinaryFile(destFilePath, new Uint8Array(fileData));
    if (!success) return false;

    // Track in database
    await saveDeviceBookFile(userBookId, destFilePath, originalFileName, fileData.byteLength);
    return true;
  } catch (error) {
    console.error('Error importing desktop file:', error);
    return false;
  }
}

/**
 * Import a web file (store in memory)
 */
async function importWebFile(
  userBookId: string,
  fileData: ArrayBuffer,
  originalFileName: string
): Promise<boolean> {
  try {
    // Store in memory cache
    webBookCache.set(userBookId, { 
      data: fileData,
      fileName: originalFileName
    });

    // Track in database
    await saveDeviceBookFile(
      userBookId, 
      `memory:${userBookId}`, 
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
 * Get a book file as ArrayBuffer
 */
export async function getBookFile(userBookId: string): Promise<{ data: ArrayBuffer; fileName: string } | null> {
  try {
    if (isTauriAppPlatform()) {
      // For Tauri, read from file system
      const filePath = await getBookFilePath(userBookId);
      if (!filePath) return null;

      const fileData = await TauriFS.readBinaryFile(filePath);
      if (!fileData) return null;

      const dbFile = await getDeviceBookFile(userBookId);
      if (!dbFile) return null;

      return {
        data: fileData,
        fileName: dbFile.originalFileName
      };
    } else {
      // For web, get from memory
      const cachedFile = webBookCache.get(userBookId);
      if (!cachedFile) return null;
      
      // Update last access time
      await updateLastAccessTime(userBookId);
      
      return cachedFile;
    }
  } catch (error) {
    console.error('Error getting book file:', error);
    return null;
  }
}

/**
 * Open a book file on desktop platform
 */
export async function openBookFile(userBookId: string): Promise<boolean> {
  try {
    if (!isTauriAppPlatform()) return false;

    const filePath = await getBookFilePath(userBookId);
    if (!filePath) return false;

    // Try to use Tauri shell open, if available
    try {
      const { open } = await import('@tauri-apps/api/shell');
      await open(filePath);
      await updateLastAccessTime(userBookId);
      return true;
    } catch (error) {
      console.error('Failed to open file with Tauri shell:', error);
      return false;
    }
  } catch (error) {
    console.error('Error opening book file:', error);
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
    const db = await Database.getInstance();
    const deviceId = localStorage.getItem('booktalk_device_id') || 'unknown';
    const fileFormat = getFileFormat(originalFileName);

    // Check if record exists
    const existingFile = await getDeviceBookFile(userBookId);
    
    if (existingFile) {
      // Update existing record
      await db.executeSql(
        `UPDATE device_book_files 
         SET file_path = ?, original_file_name = ?, file_size = ?, 
             file_format = ?, updated_at = NOW()
         WHERE user_book_id = ? AND device_id = ?`,
        [filePath, originalFileName, fileSize, fileFormat, userBookId, deviceId]
      );
    } else {
      // Insert new record
      await db.executeSql(
        `INSERT INTO device_book_files
         (user_book_id, device_id, file_path, original_file_name, 
          file_size, file_format, created_at, updated_at, last_accessed_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
        [userBookId, deviceId, filePath, originalFileName, fileSize, fileFormat]
      );
    }
    
    // Update user_books has_file flag
    await db.executeSql(
      `UPDATE user_books SET has_file = true WHERE id = ?`,
      [userBookId]
    );
  } catch (error) {
    console.error('Error saving device book file:', error);
  }
}

/**
 * Get device book file from database
 */
async function getDeviceBookFile(userBookId: string): Promise<DeviceBookFile | null> {
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
 * Get file path for a book
 */
async function getBookFilePath(userBookId: string): Promise<string | null> {
  try {
    const dbFile = await getDeviceBookFile(userBookId);
    return dbFile ? dbFile.filePath : null;
  } catch (error) {
    console.error('Error getting book file path:', error);
    return null;
  }
}

/**
 * Update last access time for a book file
 */
async function updateLastAccessTime(userBookId: string): Promise<void> {
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
 * Extract file format from filename
 */
function getFileFormat(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return ext;
}

/**
 * Get list of user books with file info
 */
export async function getUserBooksWithFileInfo(): Promise<UserBook[]> {
  try {
    const db = await Database.getInstance();
    const deviceId = localStorage.getItem('booktalk_device_id') || 'unknown';
    
    const result = await db.executeSql(
      `SELECT ub.*, 
              CASE WHEN dbf.id IS NOT NULL THEN true ELSE false END as has_device_file
       FROM user_books ub
       LEFT JOIN device_book_files dbf ON ub.id = dbf.user_book_id AND dbf.device_id = ?
       ORDER BY ub.created_at DESC`,
      [deviceId]
    );
    
    return result.rows as UserBook[];
  } catch (error) {
    console.error('Error getting user books with file info:', error);
    return [];
  }
} 