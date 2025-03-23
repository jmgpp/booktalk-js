"use client";

export default function TailwindTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden md:max-w-2xl">
        <div className="p-8">
          <div className="text-sm font-semibold text-indigo-500 tracking-wide">Tailwind CSS Test</div>
          <h1 className="mt-2 text-xl font-bold text-gray-800">Tailwind CSS is working!</h1>
          <p className="mt-2 text-gray-600">
            This component is styled using Tailwind CSS classes. If you can see the styles applied correctly,
            Tailwind CSS is properly set up in your project.
          </p>
          <div className="mt-4 flex space-x-3">
            <button className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md transition-colors">
              Primary Button
            </button>
            <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-md transition-colors">
              Secondary Button
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 