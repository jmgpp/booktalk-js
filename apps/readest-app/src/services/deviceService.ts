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
    ? await generateTauriDeviceId() 
    : `web_${getBrowserInfo()}_${generateRandomId()}`;
  
  // Store it for future use
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
  return deviceId;
}

/**
 * Generate a device ID for Tauri platform
 */
async function generateTauriDeviceId(): Promise<string> {
  try {
    const osModule = isTauriAppPlatform() ? await import('@tauri-apps/api/os') : null;
    
    if (osModule) {
      // Get platform-specific info when available
      const platform = await osModule.platform().catch(() => 'unknown');
      return `tauri_${platform}_${generateRandomId()}`;
    }
  } catch (error) {
    console.error('Error generating Tauri device ID:', error);
  }
  
  // Fallback to generic ID if OS info not available
  return `tauri_${generateRandomId()}`;
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

/**
 * Get the app directory path for storing book files
 */
export async function getAppBookStoragePath(): Promise<string | null> {
  if (!isTauriAppPlatform()) return null;
  
  try {
    const pathModule = await import('@tauri-apps/api/path');
    const fsModule = await import('@tauri-apps/api/fs');
    
    if (!pathModule || !fsModule) return null;
    
    const appDirPath = await pathModule.appDataDir();
    const bookStoragePath = await pathModule.join(appDirPath, 'books');
    
    // Ensure directory exists
    await fsModule.createDir(bookStoragePath, { recursive: true });
    
    return bookStoragePath;
  } catch (error) {
    console.error('Failed to get app book storage path:', error);
    return null;
  }
} 