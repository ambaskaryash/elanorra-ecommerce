'use client';

import { ClerkProvider, useUser } from '@clerk/nextjs';
import { AuthProvider } from '@/lib/contexts/auth-context';
import SessionManager from '@/components/auth/SessionManager';
import { useEffect } from 'react';
import { useCartStore } from '@/lib/store/cart-store';

function CartInitializer() {
  const initializeCart = useCartStore((state) => state.initializeCart);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded) {
      const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress;
      initializeCart(email);
    }
  }, [initializeCart, user, isLoaded]);

  return null;
}

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  // Use default Clerk JS URL derived from publishableKey/tenant; no override

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#f43f5e',
        },
      }}
      // Configure fallback redirect URLs
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <AuthProvider>
        <CartInitializer />
        <SessionManager>
          {children}
        </SessionManager>
      </AuthProvider>
    </ClerkProvider>
  );
}