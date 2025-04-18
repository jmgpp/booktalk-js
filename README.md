# BookTalk

A multiplatform social media app for book readers.

## Overview

BookTalk aims to provide a feature-rich environment for book lovers to connect, discuss books, track reading progress in groups, and read ebooks.

This project is built upon the foundation of the excellent open-source ebook reader [Readest](https://github.com/readest/readest), leveraging its core viewer component.

## Technology Stack

*   **Frontend:** React (using Next.js App Router)
*   **Desktop Wrapper:** Tauri
*   **Backend & Realtime:** Supabase
*   **Ebook Viewer Core:** Based on Readest / Foliate.js
*   **Book Data API:** Google Books API

## Project Status

*   Initial setup complete: Readest codebase cloned.
*   Basic fixes applied to run both web and desktop versions locally.
*   Initial project plan and codebase analysis documents created.
*   Implemented web file loading via browser API for testing/prototyping (using temporary in-memory store).
*   Implemented profile page with Supabase data fetching, editing (name/username), and avatar upload/cropping/resizing.
*   Integrated Google Books API for searching books.
*   Implemented library page with UI for:
    * Searching and browsing books from Google Books API
    * Viewing book details
    * Adding books to personal library
    * Responsive grid layout for displaying user's book collection
    * Auto-saving book status and ratings

## Documentation

*   **Project Plan:** See [PROJECT_PLAN.md](PROJECT_PLAN.md)
*   **Readest Codebase Analysis:** See [READEST_ANALYSIS.md](READEST_ANALYSIS.md)

## Getting Started (Current State)

1.  Ensure Node.js (v22 recommended), pnpm, and Rust/Cargo are installed (see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)).
2.  Install dependencies: `pnpm install`
3.  Run PDF.js setup: `pnpm --filter @readest/readest-app setup-pdfjs`
4.  Set up a Supabase project and add environment variables
5.  Set up a Google Books API key
6.  Run Desktop Dev Server: `pnpm tauri dev`
7.  Run Web Dev Server: `pnpm dev-web`
