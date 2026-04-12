'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Loading component
function CheckoutLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center">
        <div className="animate-spin h-10 w-10 border border-gray-900 border-t-transparent rounded-full mx-auto mb-6"></div>
        <h2 className="text-sm font-serif uppercase tracking-[0.2em] text-gray-900">Preparing Checkout</h2>
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
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect_url=/checkout');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return <CheckoutLoading />;
  }

  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent />
    </Suspense>
  );
}