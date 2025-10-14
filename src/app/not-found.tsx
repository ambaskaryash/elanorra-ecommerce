'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { HomeIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl"
        >
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-md shadow-xl">
            <div className="absolute inset-0 pointer-events-none" style={{
              background:
                'radial-gradient(600px circle at 0% 0%, rgba(244,63,94,0.06), transparent 40%), radial-gradient(600px circle at 100% 0%, rgba(79,70,229,0.05), transparent 40%)'
            }} />
            <div className="relative p-8 sm:p-12">
              <p className="text-sm font-semibold text-rose-600">404 Error</p>
              <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">Page not found</h1>
              <p className="mt-3 text-gray-600">The page you’re looking for doesn’t exist or was moved.</p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-rose-600 px-4 py-2.5 text-white font-medium hover:bg-rose-700"
                >
                  <HomeIcon className="h-5 w-5" />
                  Go to Home
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2.5 text-gray-800 font-medium hover:bg-gray-50"
                >
                  Browse Shop
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}