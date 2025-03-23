# Book Reader Social Network Project Context

## Project Overview
A social network for book readers with integrated EPUB reading capabilities accessible via both web and mobile (iOS/Android) platforms. The app allows users to read EPUBs directly in the application while connecting with friends and participating in book clubs.

## Core Features
1. **Social Features**
   - User profiles and friend connections
   - Personal reading libraries (read, want to read, currently reading, favorites)
   - Reading statistics and progress tracking
   - Reviews, comments, and sharing quotes
   - Book clubs with discussion threads
   - Finding groups based on genres, locations, authors

2. **EPUB Reader Functionality**
   - Full EPUB rendering with customizable reading experience
   - Highlighting and annotations
   - Progress tracking (personal and shared)
   - Synchronization across devices
   - Social reading features (seeing friends' highlights, notes, progress)

3. **User Experience**
   - Designed for book club readers primarily
   - Also supporting casual/solo readers
   - Intuitive UI for both reading and social interaction

## Technical Architecture

### Frontend
- Next.js 14 app router with React for web application 
- React Native for mobile applications (future)
- Tailwind CSS for styling with custom color palette
- Shadcn/UI component library

### Backend
- Next.js API routes for server-side logic
- Supabase for authentication, database, storage, and row-level security
- Real-time capabilities for notifications and live updates (planned)

### EPUB Integration
- Using JavaScript EPUB libraries (epub.js or similar) - pending implementation
- Custom React wrapper with enhanced UI - pending implementation
- Integration with backend for social reading features - pending implementation

## Development Approach
- Solo developer with AI assistance
- Monorepo architecture prioritizing web first, then expanding to mobile
- Incremental development starting with core features
- Building a functional prototype that can be iterated upon

## Database Schema (Implemented)
- Users (Supabase Auth)
- Profiles (profile information, preferences)
- Books (metadata, pending implementation)
- UserBooks (relationship between users and books, pending implementation)
- Highlights (user annotations and highlights, pending implementation)
- BookClubs (group information and membership, pending implementation)
- Discussions (threads and comments, pending implementation)
- ReadingProgress (tracking reading completion, pending implementation)

## Implementation Progress
1. ✅ Core authentication with Supabase Auth
2. ✅ User profiles with avatar upload capabilities
3. ✅ User profile page with reading stats UI
4. ✅ Homepage with responsive design
5. ⏳ Personal libraries and reading tracking (partial UI implemented)
6. ⏳ Social connections and activity feeds
7. ⏳ Book clubs and discussions
8. ⏳ EPUB reader integration
9. ⏳ Enhanced reading features
10. ⏳ Mobile app development
11. ⏳ Cross-platform synchronization

## Current Status
Initial implementation phase - Core user functionality is in place with authentication and profiles. The UI framework has been established with a custom color palette and responsive design. Next steps include implementing book management, social features, and the EPUB reader integration.
