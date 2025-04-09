import { isTauriAppPlatform } from './environment';

/**
 * Local storage key for device ID
 */
const DEVICE_ID_KEY = 'booktalk_device_id';

/**
 * Get a unique device ID that persists across sessions
 */
export async function getDeviceId(): Promise<string> {
  // Try to get stored ID first (works for both web and desktop)
  const storedId = localStorage.getItem(DEVICE_ID_KEY);
  if (storedId) {
    return storedId;
  }
  
  // Generate a new ID based on platform
  const deviceId = isTauriAppPlatform() 
    ? `tauri_${generateRandomId()}` 
    : `web_${getBrowserInfo()}_${generateRandomId()}`;
  
  // Store it for future use
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
  return deviceId;
}

/**
 * Determine if running in web browser
 */
export function isWebBrowser(): boolean {
  return !isTauriAppPlatform();
}

/**
 * Get simple browser info for identification
 */
function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  
  if (ua.match(/chrome|chromium|crios/i)) return 'chrome';
  if (ua.match(/firefox|fxios/i)) return 'firefox';
  if (ua.match(/safari/i)) return 'safari';
  if (ua.match(/opr\//i)) return 'opera';
  if (ua.match(/edg/i)) return 'edge';
  return 'unknown';
}

/**
 * Generate a random ID string
 */
function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 10) + 
         Date.now().toString(36);
}

// Type definitions for Tauri modules
interface TauriFsModule {
  exists: (path: string) => Promise<boolean>;
  readBinaryFile: (path: string) => Promise<{ buffer: ArrayBuffer }>;
  writeBinaryFile: (path: string, data: Uint8Array) => Promise<void>;
  createDir: (path: string, options?: { recursive: boolean }) => Promise<void>;
}

interface TauriPathModule {
  appDataDir: () => Promise<string>;
  join: (...paths: string[]) => Promise<string>;
}

/**
 * Safe wrapper for Tauri file system operations
 */
export const TauriFS = {
  /**
   * Check if a file exists (desktop only)
   */
  async fileExists(filePath: string): Promise<boolean> {
    if (!isTauriAppPlatform()) return false;
    
    try {
      const module = await safeImport<TauriFsModule>('@tauri-apps/api/fs');
      if (!module) return false;
      
      return await module.exists(filePath);
    } catch (error) {
      console.error('Error checking if file exists:', error);
      return false;
    }
  },
  
  /**
   * Read a binary file (desktop only)
   */
  async readBinaryFile(filePath: string): Promise<ArrayBuffer | null> {
    if (!isTauriAppPlatform()) return null;
    
    try {
      const module = await safeImport<TauriFsModule>('@tauri-apps/api/fs');
      if (!module) return null;
      
      const result = await module.readBinaryFile(filePath);
      return result.buffer;
    } catch (error) {
      console.error('Error reading binary file:', error);
      return null;
    }
  },
  
  /**
   * Write a binary file (desktop only)
   */
  async writeBinaryFile(filePath: string, data: Uint8Array): Promise<boolean> {
    if (!isTauriAppPlatform()) return false;
    
    try {
      const module = await safeImport<TauriFsModule>('@tauri-apps/api/fs');
      if (!module) return false;
      
      await module.writeBinaryFile(filePath, data);
      return true;
    } catch (error) {
      console.error('Error writing binary file:', error);
      return false;
    }
  },
  
  /**
   * Create a directory (desktop only)
   */
  async createDir(path: string, recursive = true): Promise<boolean> {
    if (!isTauriAppPlatform()) return false;
    
    try {
      const module = await safeImport<TauriFsModule>('@tauri-apps/api/fs');
      if (!module) return false;
      
      await module.createDir(path, { recursive });
      return true;
    } catch (error) {
      console.error('Error creating directory:', error);
      return false;
    }
  }
};

/**
 * Safe wrapper for Tauri path operations
 */
export const TauriPath = {
  /**
   * Get app data directory path (desktop only)
   */
  async appDataDir(): Promise<string | null> {
    if (!isTauriAppPlatform()) return null;
    
    try {
      const module = await safeImport<TauriPathModule>('@tauri-apps/api/path');
      if (!module) return null;
      
      return await module.appDataDir();
    } catch (error) {
      console.error('Error getting app data directory:', error);
      return null;
    }
  },
  
  /**
   * Join path segments (desktop only)
   */
  async join(...paths: string[]): Promise<string | null> {
    if (!isTauriAppPlatform()) return null;
    
    try {
      const module = await safeImport<TauriPathModule>('@tauri-apps/api/path');
      if (!module) return null;
      
      return await module.join(...paths);
    } catch (error) {
      console.error('Error joining paths:', error);
      return null;
    }
  }
};

/**
 * Get the app directory path for storing book files
 */
export async function getAppBookStoragePath(): Promise<string | null> {
  if (!isTauriAppPlatform()) return null;
  
  try {
    const appDirPath = await TauriPath.appDataDir();
    if (!appDirPath) return null;
    
    const bookStoragePath = await TauriPath.join(appDirPath, 'books');
    if (!bookStoragePath) return null;
    
    // Ensure directory exists
    await TauriFS.createDir(bookStoragePath, true);
    
    return bookStoragePath;
  } catch (error) {
    console.error('Failed to get app book storage path:', error);
    return null;
  }
}

/**
 * Safely import a Tauri module without crashing in web environment
 */
async function safeImport<T>(modulePath: string): Promise<T | null> {
  if (!isTauriAppPlatform()) return null;
  
  try {
    return await import(modulePath) as T;
  } catch (error) {
    console.error(`Error importing ${modulePath}:`, error);
    return null;
  }
} 