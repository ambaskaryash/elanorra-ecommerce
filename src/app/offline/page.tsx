import { Metadata } from 'next';
import Link from 'next/link';
import { WifiIcon } from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Offline - ElanorraLiving',
  description: 'You are currently offline. Please check your internet connection.',
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mb-6">
            <WifiIcon className="w-12 h-12 text-rose-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            You're Offline
          </h1>
          <p className="text-gray-600 mb-8">
            It looks like you've lost your internet connection. Don't worry, you can still browse some of our cached content.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-rose-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-rose-600 transition-colors"
          >
            Try Again
          </button>
          
          <Link
            href="/"
            className="block w-full bg-white text-rose-500 py-3 px-6 rounded-lg font-medium border border-rose-500 hover:bg-rose-50 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>

        <div className="mt-8 p-4 bg-white rounded-lg shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-2">While you're offline:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Browse cached products</li>
            <li>• View your wishlist</li>
            <li>• Check your account details</li>
            <li>• Read our about page</li>
          </ul>
        </div>
      </div>
    </div>
  );
}