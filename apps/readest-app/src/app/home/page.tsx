'use client';

import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  // TODO: Fetch user-specific data (e.g., recent groups, friend activity)

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">Home</h1>
      <p>Welcome to BookTalk! (Homepage Content Placeholder)</p>

      <div className="mt-6 space-y-4">
        <h2 className="text-xl">Navigation</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Link href="/library" className="text-blue-600 hover:underline">
              Go to My Library (Readest View)
            </Link>
          </li>
          <li>
            <Link href="/profile" className="text-blue-600 hover:underline">
              Go to My Profile
            </Link>
          </li>
          <li>
            <Link href="/test-reader" className="text-blue-600 hover:underline">
              Go to Test Reader Page
            </Link>
          </li>
           {/* Add links to other areas like Groups, Friends later */}
        </ul>
      </div>

      {/* Placeholder sections for future content */}
      <div className="mt-8">
        <h2 className="text-xl">Recent Activity (Placeholder)</h2>
        <p>Your recent groups and friend updates will appear here.</p>
      </div>
    </div>
  );
} 