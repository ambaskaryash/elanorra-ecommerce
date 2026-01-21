'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ResendVerificationPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/sign-in');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
