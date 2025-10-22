'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Loading component
function CheckoutLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading Checkout...</h2>
      </div>
    </div>
  );
}

// Dynamically import the actual checkout component to prevent hydration issues
const CheckoutContent = dynamic(
  () => import('@/app/checkout/checkout-content'),
  {
    loading: () => <CheckoutLoading />,
    ssr: false
  }
);

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent />
    </Suspense>
  );
}