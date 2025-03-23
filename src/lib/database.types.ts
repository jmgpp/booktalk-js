export type BookStatus = 'want_to_read' | 'reading' | 'finished';
export type MembershipRole = 'member' | 'moderator' | 'admin';

export interface Profile {
  id: string;
  username: string;
  email?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string | null;
  cover_url?: string | null;
  description?: string | null;
  publication_year?: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserBook {
  id: string;
  user_id: string;
  book_id: string;
  status: BookStatus;
  current_page: number;
  total_pages?: number | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookClub {
  id: string;
  name: string;
  description?: string | null;
  cover_url?: string | null;
  created_by?: string | null;
  current_book_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClubMembership {
  id: string;
  club_id: string;
  user_id: string;
  role: MembershipRole;
  joined_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; username: string };
        Update: Partial<Profile>;
      };
      books: {
        Row: Book;
        Insert: Omit<Book, 'id' | 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Omit<Book, 'id' | 'created_at' | 'updated_at'> & { updated_at?: string }>;
      };
      user_books: {
        Row: UserBook;
        Insert: Omit<UserBook, 'id' | 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Omit<UserBook, 'id' | 'created_at' | 'updated_at'> & { updated_at?: string }>;
      };
      book_clubs: {
        Row: BookClub;
        Insert: Omit<BookClub, 'id' | 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Omit<BookClub, 'id' | 'created_at' | 'updated_at'> & { updated_at?: string }>;
      };
      club_memberships: {
        Row: ClubMembership;
        Insert: Omit<ClubMembership, 'id' | 'joined_at'> & { joined_at?: string };
        Update: Partial<Omit<ClubMembership, 'id' | 'joined_at'>>;
      };
    };
  };
} 