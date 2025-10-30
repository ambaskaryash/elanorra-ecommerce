'use client';

import { ClerkProvider } from '@clerk/nextjs';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  );
}