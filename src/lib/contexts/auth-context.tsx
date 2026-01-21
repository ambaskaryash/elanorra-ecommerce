'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser as useClerkUser } from '@clerk/nextjs';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { isSignedIn, user: clerkUser, isLoaded } = useClerkUser();

  // Sync with Clerk
  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn && clerkUser) {
        const mappedUser: User = {
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || '',
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
          phone: clerkUser.primaryPhoneNumber?.phoneNumber,
          addresses: [],
        };
        setUser(mappedUser);
      } else {
        setUser(null);
      }
    }
  }, [isSignedIn, clerkUser, isLoaded]);

  const value: AuthContextType = {
    user,
    isLoading: !isLoaded,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}