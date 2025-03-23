import { supabase } from './supabase';
import { BookStatus } from './database.types';
import { PostgrestError } from '@supabase/supabase-js';

interface BookStatusCount {
  status: BookStatus;
  count: number;
}

interface BookPageStats {
  status: BookStatus;
  current_page: number;
  total_pages: number | null;
}

interface BookFinishedStats {
  finished_at: string | null;
  started_at: string | null;
  total_pages: number | null;
}

export interface ReadingStats {
  totalBooks: number;
  booksRead: number;
  booksReading: number;
  booksWantToRead: number;
  totalPages: number;
  pagesRead: number;
  readingHabits: {
    averageDaysToFinish: number;
    booksLastMonth: number;
    pagesLastMonth: number;
  };
}

export interface RecentBook {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  status: BookStatus;
  progress: number;
}

export async function getUserReadingStats(userId: string): Promise<ReadingStats> {
  try {
    // Get book counts by status - using a simpler approach with multiple queries
    let booksRead = 0;
    let booksReading = 0;
    let booksWantToRead = 0;
    
    // Get count of read books
    const { count: readCount, error: readError } = await supabase
      .from('user_books')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'finished');
      
    if (!readError && readCount !== null) {
      booksRead = readCount;
    }
    
    // Get count of reading books
    const { count: readingCount, error: readingError } = await supabase
      .from('user_books')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'reading');
      
    if (!readingError && readingCount !== null) {
      booksReading = readingCount;
    }
    
    // Get count of want to read books
    const { count: wantCount, error: wantError } = await supabase
      .from('user_books')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'want_to_read');
      
    if (!wantError && wantCount !== null) {
      booksWantToRead = wantCount;
    }
    
    const totalBooks = booksRead + booksReading + booksWantToRead;
    
    // Get total and read pages
    const { data: pageStats, error: pageError } = await supabase
      .from('user_books')
      .select('status, current_page, total_pages')
      .eq('user_id', userId) as { data: BookPageStats[] | null, error: PostgrestError | null };
      
    if (pageError) throw pageError;
    
    // Get reading habit stats (books finished in the last month)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const { data: recentlyFinished, error: finishedError } = await supabase
      .from('user_books')
      .select('finished_at, started_at, total_pages')
      .eq('user_id', userId)
      .eq('status', 'finished')
      .gte('finished_at', oneMonthAgo.toISOString()) as { data: BookFinishedStats[] | null, error: PostgrestError | null };
      
    if (finishedError) throw finishedError;
    
    const totalPages = pageStats?.reduce((sum, book) => sum + (book.total_pages || 0), 0) || 0;
    const pagesRead = pageStats?.reduce((sum, book) => {
      if (book.status === 'finished') {
        return sum + (book.total_pages || 0);
      }
      return sum + (book.current_page || 0);
    }, 0) || 0;
    
    // Calculate average days to finish
    let averageDaysToFinish = 0;
    if (recentlyFinished && recentlyFinished.length > 0) {
      const totalDays = recentlyFinished.reduce((sum, book) => {
        if (book.started_at && book.finished_at) {
          const start = new Date(book.started_at);
          const end = new Date(book.finished_at);
          const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
          return sum + days;
        }
        return sum;
      }, 0);
      
      averageDaysToFinish = Math.round(totalDays / recentlyFinished.length);
    }
    
    const booksLastMonth = recentlyFinished?.length || 0;
    const pagesLastMonth = recentlyFinished?.reduce((sum, book) => sum + (book.total_pages || 0), 0) || 0;
    
    return {
      totalBooks,
      booksRead,
      booksReading,
      booksWantToRead,
      totalPages,
      pagesRead,
      readingHabits: {
        averageDaysToFinish: averageDaysToFinish || 0,
        booksLastMonth,
        pagesLastMonth
      }
    };
  } catch (error) {
    console.error('Error fetching reading stats:', error);
    return {
      totalBooks: 0,
      booksRead: 0,
      booksReading: 0,
      booksWantToRead: 0,
      totalPages: 0,
      pagesRead: 0,
      readingHabits: {
        averageDaysToFinish: 0,
        booksLastMonth: 0,
        pagesLastMonth: 0
      }
    };
  }
}

interface UserBookWithBook {
  id: string;
  status: BookStatus;
  current_page: number;
  total_pages: number | null;
  books: {
    id: string;
    title: string;
    author: string;
    cover_url: string | null;
  };
}

export async function getUserRecentBooks(userId: string, limit = 5): Promise<RecentBook[]> {
  try {
    const { data, error } = await supabase
      .from('user_books')
      .select(`
        id,
        status,
        current_page,
        total_pages,
        books (
          id,
          title,
          author,
          cover_url
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit) as { data: UserBookWithBook[] | null, error: PostgrestError | null };
    
    if (error) throw error;
    
    return (data || []).map(item => {
      const book = item.books;
      const progress = (item.total_pages && item.total_pages > 0)
        ? Math.min(100, Math.round((item.current_page / item.total_pages) * 100))
        : 0;
        
      return {
        id: item.id,
        title: book.title,
        author: book.author,
        cover_url: book.cover_url,
        status: item.status,
        progress
      };
    });
  } catch (error) {
    console.error('Error fetching recent books:', error);
    return [];
  }
} 