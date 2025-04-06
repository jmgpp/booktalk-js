// A simple in-memory store for web-loaded files
// Key: Temporary file ID (string)
// Value: File object (File)

export const webFileStore = new Map<string, File>(); 