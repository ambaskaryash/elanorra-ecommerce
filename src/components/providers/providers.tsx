'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { AuthProvider } from '@/lib/contexts/auth-context';
import SessionManager from '@/components/auth/SessionManager';

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
        <SessionManager>
          {children}
        </SessionManager>
      </AuthProvider>
    </ClerkProvider>
  );
}