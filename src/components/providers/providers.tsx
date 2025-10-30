'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { AuthProvider } from '@/lib/contexts/auth-context';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ClerkProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ClerkProvider>
  );
}