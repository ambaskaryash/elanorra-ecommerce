'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from './theme-provider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ClerkProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </ClerkProvider>
  );
}