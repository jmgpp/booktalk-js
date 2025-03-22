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
- React for web application
- React Native for mobile applications
- Shared component library and business logic where possible
- Monorepo structure to maximize code reuse while allowing platform-specific optimizations

### Backend
- Next.js for API routes and server-side rendering
- Supabase for authentication, database, and storage
- Real-time capabilities for notifications and live updates

### EPUB Integration
- Using JavaScript EPUB libraries (epub.js or similar)
- Custom React wrapper with enhanced UI
- Integration with backend for social reading features

## Development Approach
- Solo developer with AI assistance
- Monorepo architecture prioritizing web first, then expanding to mobile
- Incremental development starting with core features
- Building a functional prototype that can be iterated upon

## Database Schema (Preliminary)
- Users (profile information, preferences)
- Books (metadata, possibly from external APIs)
- UserBooks (relationship between users and books, including reading status)
- Highlights (user annotations and highlights)
- BookClubs (group information and membership)
- Discussions (threads and comments)
- ReadingProgress (tracking reading completion)

## Implementation Priorities
1. Core authentication and user profiles
2. Basic EPUB reader integration
3. Personal libraries and reading tracking
4. Social connections and activity feeds
5. Book clubs and discussions
6. Enhanced reading features
7. Mobile app development
8. Cross-platform synchronization

## Current Status
Planning phase - establishing architecture and technology choices before beginning implementation.
