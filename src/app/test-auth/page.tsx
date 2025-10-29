'use client';

import { useUser, useAuth } from '@clerk/nextjs';
import { useState } from 'react';

export default function TestAuth() {
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();
      setUserProfile(data);
      console.log('User profile:', data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      alert('Error fetching user profile: ' + error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      alert('Signed out successfully!');
    } catch (error) {
      console.error('Sign out error:', error);
      alert('Sign out error: ' + error);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Clerk Authentication Test</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Authentication Status</h2>
            <p className="text-sm text-gray-600">
              Status: {user ? 'Authenticated' : 'Not authenticated'}
            </p>
            <p className="text-sm text-gray-600">
              Loaded: {isLoaded ? 'Yes' : 'No'}
            </p>
          </div>

          {user && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800">User Information</h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p>ID: {user.id}</p>
                <p>Email: {user.emailAddresses?.[0]?.emailAddress}</p>
                <p>First Name: {user.firstName}</p>
                <p>Last Name: {user.lastName}</p>
                <p>Created: {user.createdAt?.toLocaleDateString()}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {user ? (
              <>
                <button
                  onClick={fetchUserProfile}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Fetch User Profile from API
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 mb-4">You are not signed in.</p>
                <a
                  href="/sign-in"
                  className="inline-block bg-rose-600 text-white py-2 px-4 rounded-md hover:bg-rose-700 transition-colors"
                >
                  Sign In
                </a>
              </div>
            )}
          </div>

          {userProfile && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800">API Profile Data</h2>
              <pre className="text-xs bg-gray-100 p-2 rounded-md overflow-auto">
                {JSON.stringify(userProfile, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}