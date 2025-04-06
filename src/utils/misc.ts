// Helper to check if the app is running on iOS
export const getOSPlatform = () => {
  // Check if running in a browser environment
  if (typeof window === 'undefined' || typeof window.navigator === 'undefined') {
    // We are on the server or in an environment without navigator
    return null; // Or 'unknown'
  }
  
  // We are definitely in a browser context now
  const userAgent = window.navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  if (userAgent.includes('android')) return 'android';
  // Add other checks if needed (e.g., macos, windows)
  return 'other'; // Default for other browsers/platforms
}; 