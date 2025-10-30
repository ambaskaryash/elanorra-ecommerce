'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import UserManagement from '@/components/admin/UserManagement';
import { checkAdminAccess } from '@/lib/actions/rbac-actions';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function AdminUsersPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userCapabilities, setUserCapabilities] = useState<any>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check admin status using RBAC system
  const checkAdminAccessStatus = async () => {
    try {
      const response = await fetch('/api/user/capabilities');
      if (!response.ok) {
        throw new Error('Failed to fetch user capabilities');
      }
      
      const capabilities = await response.json();
      setUserCapabilities(capabilities);
      
      // Check if user has admin-level access and can manage users
      const hasAdminAccess = capabilities.userLevel <= 2 && capabilities.canManageUsers;
      
      if (!hasAdminAccess) {
        setAccessDenied(true);
        return false;
      }
      
      setIsAdmin(true);
      setAccessDenied(false);
      return true;
    } catch (error) {
      console.error('Error checking admin access:', error);
      setAccessDenied(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!user) {
      router.push('/sign-in?redirect_url=/admin/users');
      return;
    }

    const initializeAdmin = async () => {
      const hasAccess = await checkAdminAccessStatus();
      if (!hasAccess) {
        // Redirect users without proper permissions
        setTimeout(() => {
          router.push('/admin?error=insufficient_permissions');
        }, 2000);
        return;
      }
    };

    initializeAdmin();
  }, [isLoaded, user, router]);

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // Show access denied for users without proper permissions
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to manage users. 
            {userCapabilities?.userRole && (
              <span className="block mt-2 text-sm">
                Current role: <span className="font-semibold">{userCapabilities.userRole}</span>
              </span>
            )}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/admin')}
              className="w-full bg-rose-600 text-white px-4 py-2 rounded-md hover:bg-rose-700 transition-colors"
            >
              Back to Admin Dashboard
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Go to Home
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            If you believe this is an error, please contact a super administrator.
          </p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">
            Manage user accounts, roles, and permissions for the platform.
          </p>
        </div>
        
        <UserManagement userCapabilities={userCapabilities} />
      </div>
    </div>
  );
}