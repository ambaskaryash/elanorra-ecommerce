'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">You’re offline</h1>
        <p className="mt-2 text-sm text-gray-600">
          It looks like you’ve lost your internet connection. You can browse cached pages, and new content will load once you’re back online.
        </p>
      </div>
    </div>
  );
}