'use client';

import { ClerkProvider } from '@clerk/nextjs';

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const clerkJSUrl = process.env.NEXT_PUBLIC_CLERK_JS_URL || 'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const clerkProps: Record<string, unknown> = {};
  if (publishableKey) {
    clerkProps.publishableKey = publishableKey;
  }
  // Always set a safe Clerk JS URL for development
  clerkProps.clerkJSUrl = clerkJSUrl;

  return (
    <ClerkProvider {...clerkProps}>
      {children}
    </ClerkProvider>
  );
}