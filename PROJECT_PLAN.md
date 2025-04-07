# BookTalk: Project Plan & Context

**1. Vision & Goals:**

*   Create BookTalk: A multiplatform social media app for book readers.
*   Core features: Discovering books, managing personal libraries, reading ebooks, reviewing/rating, chatting with friends, and participating in real-time group reading sessions.
*   Leverage the 'Readest' ebook reader for core reading functionality and Supabase for backend services (Auth, Database, Realtime).

**2. Minimum Viable Product (MVP) Scope:**

The first functional version of BookTalk will focus on the core social reading group experience:

*   **Authentication:** User login/signup via Supabase Auth.
*   **Basic Social:** Ability to add/manage friends.
*   **Groups:**
    *   Create groups (similar to chat groups).
    *   Associate a single book (found via Google Books API) with a group.
    *   Invite friends to groups.
*   **Reading:**
    *   Ability to link a local ebook file to a book within a group context.
    *   Read the linked ebook using the integrated Readest viewer component.
*   **Real-time Interaction:**
    *   Chat within a group (real-time).
    *   View reading progress updates of friends within the same group (updates can be slightly delayed, e.g., every few minutes).
*   **Book Discovery:** Search for books using the Google Books API to add them to groups.

**3. Target Platforms (Initial):**

*   Desktop (via Tauri wrapper)
*   Web (React application)

*(Mobile support is a key future goal but will be addressed after the initial Web/Desktop versions).*

**4. Technology Stack:**

*   **Frontend:** React
*   **Desktop Wrapper:** Tauri
*   **Backend:** Supabase (Auth, PostgreSQL Database, Realtime Subscriptions/Broadcast, potentially Storage later)
*   **External APIs:** Google Books API
*   **Core Ebook Reader:** Based on the Readest project's viewer component.

**5. Architecture & Integration Strategy:**

*   **Foundation:** Start with a copy of the Readest codebase.
*   **Readest Analysis (Crucial First Step):** Thoroughly analyze the Readest codebase to understand its structure, particularly:
    *   The ebook viewer component(s).
    *   State management patterns used.
    *   How data (like book content, user settings) flows into the viewer.
    *   Identify how to isolate the viewer from Readest's original auth, library, and other features we intend to replace.
*   **Integration Approach:** Modify the copied Readest codebase. Replace non-viewer parts with BookTalk's custom components and logic. Integrate Supabase for data fetching, user state, and real-time communication. BookTalk components will need to interact with the retained Readest viewer component, likely passing book data and potentially configuration to it.
*   **Ebook File Handling (Initial):** Ebooks will initially be linked from the user's **local filesystem** using Tauri's APIs (desktop app). No cloud storage/sync in the MVP. The application will store the *path* to the local file. 
    *   *(Update):* A mechanism for loading ebook files directly via the **web browser's File API** has also been implemented for testing and potential web-only scenarios. This uses a temporary in-memory store to pass the file content to the reader, bypassing the need for filesystem paths in a pure web context.
*   **Real-time:**
    *   Chat: Use Supabase Realtime Broadcast or dedicated chat channels.
    *   Reading Progress: Users' clients will periodically send progress updates (e.g., percentage, location) for the group's book to Supabase. Other group members' clients will subscribe to updates for that group/book via Supabase Realtime Subscriptions.

**6. Core Data Models (MVP):**

*   `UserProfile`: `user_id` (maps to Supabase Auth), `username`, `friends_list` (array of user\_ids), `groups_list` (array of group\_ids).
*   `Book`: `book_id` (likely ISBN or Google Books ID), `title`, `authors`, `description`, `thumbnail_url`, etc. (from Google Books API).
*   `UserBookData`: `user_id`, `book_id`, `local_file_path` (nullable), `reading_status`, `rating` (nullable), `shelves` (nullable). *(Note: For MVP, only `local_file_path` linked within a group context is strictly needed).*
*   `Group`: `group_id`, `name`, `members` (array of user\_ids), `associated_book_id` (nullable).
*   `ChatMessage`: `message_id`, `group_id`, `sender_id`, `content`, `timestamp`.
*   `ReadingProgress`: `progress_id`, `user_id`, `group_id`, `book_id`, `progress_data` (e.g., percentage, CFI string), `last_updated_timestamp`.

**7. Key MVP User Workflows:**

*   **Onboarding:** Signup/Login -> Basic Profile Setup.
*   **Adding a Friend:** Search User -> Send Request -> Accept Request.
*   **Creating/Joining Group:** Create Group -> Add Book (via Search) -> Invite Friends -> Friend Accepts Invite.
*   **Group Reading:** Open Group -> See Associated Book -> Link Local File (if not done) -> Open Reader -> Read -> (App sends progress updates) -> See Friends' Progress Updates.
*   **Group Chat:** Open Group -> Send/Receive Messages.

**8. Development Roadmap (Phased):**

*   **Phase 0: Setup & Analysis**
    *   Clone Readest repository. (DONE)
    *   Get Readest running locally. (DONE - Requires `pnpm dev-web` for web, `pnpm tauri dev` for desktop)
    *   Initial browser/Tauri compatibility fixes applied. (DONE)
    *   **Analyze Readest codebase structure** (viewer, state, data flow). Document findings. (Initial analysis DONE - see READEST_ANALYSIS.md, further deep dive needed)
    *   Set up Supabase project. Integrate Supabase client into the codebase. (DONE)
*   **Phase 1: Authentication & Basic Structure**
    *   Implement Supabase Authentication (Login/Signup flows). (DONE)
    *   Replace/hide Readest's initial views. Create basic BookTalk navigation (e.g., placeholder pages for Home, Groups, Friends). (DONE - Home page created, basic nav exists)
    *   Implement basic Profile page UI, fetch/update profile data (name, username, avatar) from Supabase. (DONE - Includes avatar upload/cropping)
*   **Phase 2: Core Group & Book Functionality**
    *   Implement Google Books API search functionality. (DONE)
    *   Implement personal library management. (DONE)
        *   Create database tables for user books
        *   Implement UI for library page showing user's books
        *   Book search with Google Books API integration
        *   Add books to library functionality
        *   Book details view
        *   Update book status and ratings
    *   Implement Group creation. (IN PROGRESS)
    *   Allow associating a book (from search results) with a group.
*   **Phase 3: Friends & Invitations**
    *   Implement user search.
    *   Implement friend request/acceptance system.
    *   Implement inviting friends to existing groups.
*   **Phase 4: Reader Integration & Local Files**
    *   Integrate the isolated Readest viewer component into the Group view.
    *   Implement local file picking (using Tauri API) to link an ebook file to the `associated_book_id` within the group context.
    *   Pass the selected file path/content to the Readest viewer component.
    *   *(Update):* Successfully implemented and tested loading ebook files via the **browser's File API** (primarily for testing/web scenarios), passing the file via an in-memory store. Resolved related SSR and rendering issues.
*   **Phase 5: Real-time Features**
    *   Implement real-time chat within groups using Supabase Realtime.
    *   Implement sending reading progress updates from the client during reading.
    *   Implement receiving and displaying friend progress updates within the group view.
*   **Phase 6+:** Refinement, Broader Library Features, Custom UI, Mobile, etc.

**9. Future Considerations & Risks:**

*   **Readest Complexity:** The difficulty of cleanly extracting and integrating the Readest viewer is a primary risk.
*   **Mobile Development:** Requires separate effort/strategy.
*   **Cloud File Storage/Sync:** Adds significant complexity and cost.
*   **Offline Support:** Tauri enables offline capabilities, but state synchronization needs careful design.
*   **API Limitations:** Handling Google Books API rate limits or missing books.
*   **Scalability:** Designing Supabase interactions efficiently for many users/groups.

--- 