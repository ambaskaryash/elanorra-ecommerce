'use client';

import { SignIn } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get('session_expired');

  useEffect(() => {
    if (sessionExpired === 'true') {
      toast.error('Your session has expired. Please sign in again.', {
        duration: 5000,
      });
    }
  }, [sessionExpired]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back to ElanorraLiving
          </p>
          {sessionExpired === 'true' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                Your session has expired for security reasons. Please sign in again.
              </p>
            </div>
          )}
        </div>
        <div className="mt-8">
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: 
                  "bg-rose-500 hover:bg-rose-600 text-sm normal-case",
                card: "shadow-lg",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
              },
            }}
            routing="path"
            path="/sign-in"
            afterSignInUrl="/account"
            signUpUrl="/sign-up"
          />
        </div>
      </div>
    </div>
  );
}