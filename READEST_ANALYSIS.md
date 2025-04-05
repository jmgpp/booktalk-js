# Readest App Structure Analysis (Initial)

This document summarizes the initial findings from analyzing the codebase structure of the Readest application, primarily within the `apps/readest-app` directory. The goal is to identify key components, especially the ebook reader functionality, to facilitate integration into BookTalk.

**Key Findings:**

1.  **Framework:** The application uses **React** with the **Next.js App Router** (`src/app/` directory structure).
2.  **Platform Distinction:** The app differentiates between **Tauri** (desktop/native) and **Web** environments using the `NEXT_PUBLIC_APP_PLATFORM` environment variable (`'tauri'` vs `'web'`) loaded via `.env.tauri` or `.env.web` respectively. This is checked using `isTauriAppPlatform()` in `src/services/environment.ts`.
3.  **Platform-Specific Services:**
    *   `src/services/environment.ts` conditionally loads either:
        *   `src/services/nativeAppService.ts`: For Tauri, utilizes Tauri-specific APIs (filesystem, OS, windowing, etc.).
        *   `src/services/webAppService.ts`: For the standard web environment.
    *   **Important:** Incorrectly running the web server with the Tauri environment (`pnpm dev` instead of `pnpm dev-web`) causes errors because Tauri APIs are called outside their context.
4.  **Main Application Structure (`src/app/`)**:
    *   `layout.tsx`: Root layout for all pages.
    *   `page.tsx`: Root page component (`/`).
    *   `library/page.tsx`: Handles the book library view (`/library`).
    *   `auth/page.tsx`: Handles authentication (`/auth`).
    *   **`reader/page.tsx`**: **Entry point for the core ebook reader view (`/reader`)**.

5.  **Reader Component Flow**:
    *   The `/reader` route is handled by `src/app/reader/page.tsx`.
    *   This `page.tsx` is a simple client component.
    *   Its primary function is to render the `<Reader />` component imported from **`src/app/reader/components/Reader.tsx`**.

6.  **Core Reader Location**:
    *   The main logic and UI for the ebook reader functionality are expected to be encapsulated within **`src/app/reader/components/Reader.tsx`** and its child components/hooks located within `src/app/reader/`.

7.  **Other Key Directories**:
    *   `src/components/`: Global reusable UI components.
    *   `src/store/`: State management (likely Zustand).
    *   `src/hooks/`: Reusable custom React hooks.
    *   `src/services/`: Platform services and API interactions.
    *   `src/utils/`: General utility functions.

**Next Steps for Analysis:**

*   Deep dive into **`src/app/reader/components/Reader.tsx`**:
    *   Analyze its props, state, and sub-components.
    *   Understand how it uses the underlying ebook rendering engine (likely `foliate-js`).
*   Analyze state management (`src/store/`) related to the reader (e.g., reading progress, settings, current book).
*   Identify how book data (file path, content, metadata) is passed to the reader component. 