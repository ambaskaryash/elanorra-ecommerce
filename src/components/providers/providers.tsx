'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { AuthProvider } from '@/lib/contexts/auth-context';

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const clerkProps: Record<string, unknown> = {};
  if (publishableKey) {
    clerkProps.publishableKey = publishableKey;
  }
  // Use default Clerk JS URL derived from publishableKey/tenant; no override

  return (
    <ClerkProvider {...clerkProps}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ClerkProvider>
  );
}