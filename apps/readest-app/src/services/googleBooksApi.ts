import { GoogleBookVolume } from '@/types/googleBooks';

const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';

/**
 * Search for books using the Google Books API
 */
export async function searchGoogleBooks(query: string): Promise<GoogleBookVolume[]> {
  if (!query.trim()) return [];
  
  try {
    const response = await fetch(`${GOOGLE_BOOKS_API_URL}?q=${encodeURIComponent(query)}&maxResults=20`);
    
    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error searching Google Books:', error);
    throw error;
  }
}

/**
 * Get a book by its Google Books ID
 */
export async function getGoogleBookById(id: string): Promise<GoogleBookVolume | null> {
  if (!id) return null;
  
  try {
    const response = await fetch(`${GOOGLE_BOOKS_API_URL}/${id}`);
    
    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Google Book details:', error);
    throw error;
  }
} 