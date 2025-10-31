'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { AuthProvider } from '@/lib/contexts/auth-context';
import SessionManager from '@/components/auth/SessionManager';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
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
        <SessionManager>
          {children}
        </SessionManager>
      </AuthProvider>
    </ClerkProvider>
  );
}