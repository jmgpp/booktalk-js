# BookTalk

A beautiful social platform for book lovers to share and discuss their favorite books, track reading progress, and join book clubs.

![BookTalk](https://via.placeholder.com/1200x630/383150/ED4B86?text=BookTalk)

## Features

- **User Authentication**: Secure login and registration with Supabase Auth
- **Profile Management**: Personalized user profiles with reading stats
- **Book Tracking**: Track books you've read, are currently reading, or want to read
- **Book Clubs**: Join groups of like-minded readers to discuss books together
- **Modern UI**: Responsive, accessible, and stylish interface built with Tailwind CSS

## Recent Improvements

- **Enhanced Authentication Flow**: Optimized login/logout transitions with multi-layer redirect reliability
- **Improved Contrast**: Better text contrast for improved accessibility
- **Loading States**: Clear feedback during authentication and data loading processes
- **Error Handling**: Robust error handling throughout the authentication process
- **Responsive Design**: Fully responsive layout that works on mobile and desktop

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication & Database**: Supabase
- **UI Components**: Custom components built with shadcn/ui system
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn
- Supabase account (free tier works great)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/booktalk.git
   cd booktalk
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
booktalk/
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── auth/           # Auth routes
│   │   ├── api/            # API routes
│   │   └── page.tsx        # Homepage
│   ├── components/         # Reusable UI components
│   │   ├── auth/           # Authentication components
│   │   └── ui/             # Core UI components
│   ├── lib/                # Utility functions and shared code
│   │   ├── auth-context.tsx  # Authentication context provider
│   │   └── supabase.ts     # Supabase client configuration
│   └── utils/              # Helper functions
└── public/                 # Static assets
```

## Styling With Tailwind CSS

This project uses Tailwind CSS for styling with a custom color palette. The design system follows these principles:

- **Color Variables**: Custom palette defined in CSS variables
- **Component Consistency**: Shared styling patterns across components
- **Responsive Design**: Mobile-first approach with responsive utilities
- **Dark/Light Mode**: Support for theme switching

### Custom Palette

The application uses a custom color palette with these main colors:
- **Dark Purple**: Primary background (`bg-palette-darkPurple`)
- **Pink**: Primary accent color (`text-palette-pink`)
- **Yellow/Orange**: Secondary accents
- **Teal/Blue**: Supporting colors

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Supabase](https://supabase.io/) for authentication and database
- [Next.js](https://nextjs.org/) for the React framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [shadcn/ui](https://ui.shadcn.com/) for UI component inspiration
