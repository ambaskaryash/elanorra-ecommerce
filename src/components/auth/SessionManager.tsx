'use client';

import { useAuth, useClerk } from '@clerk/nextjs';
import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface SessionManagerProps {
  children: React.ReactNode;
}

const SESSION_TIMEOUTS = {
  DEFAULT: 2 * 60 * 60 * 1000,      // 2 hours for regular browsing
  CHECKOUT: 15 * 60 * 1000,         // 15 minutes for checkout pages
  ADMIN: 30 * 60 * 1000,            // 30 minutes for admin panel
  CART: 60 * 60 * 1000,             // 1 hour for cart pages
} as const;

const WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before logout
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check activity every minute

export default function SessionManager({ children }: SessionManagerProps) {
  const { isSignedIn, userId } = useAuth();
  const { signOut } = useClerk();
  const lastActivityRef = useRef<number>(Date.now());
  const warningShownRef = useRef<boolean>(false);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // Determine current session timeout based on page context
  const getCurrentTimeout = useCallback(() => {
    if (typeof window === 'undefined') return SESSION_TIMEOUTS.DEFAULT;
    
    const pathname = window.location.pathname;
    
    if (pathname.startsWith('/checkout')) {
      return SESSION_TIMEOUTS.CHECKOUT;
    }
    if (pathname.startsWith('/admin')) {
      return SESSION_TIMEOUTS.ADMIN;
    }
    if (pathname.includes('/cart') || pathname.includes('/account/orders')) {
      return SESSION_TIMEOUTS.CART;
    }
    
    return SESSION_TIMEOUTS.DEFAULT;
  }, []);

  // Update last activity time
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;
  }, []);

  // Handle automatic logout
  const handleAutoLogout = useCallback(async () => {
    try {
      await signOut();
      toast.error('You have been automatically logged out due to inactivity.');
    } catch (error) {
      console.error('Error during auto logout:', error);
    }
  }, [signOut]);

  // Show warning before logout
  const showLogoutWarning = useCallback((timeoutType: string) => {
    if (!warningShownRef.current) {
      warningShownRef.current = true;
      const timeoutMinutes = timeoutType === 'checkout' ? '15 minutes' : 
                           timeoutType === 'admin' ? '30 minutes' : 
                           timeoutType === 'cart' ? '1 hour' : '2 hours';
      
      toast.warning(`You will be logged out in 5 minutes due to inactivity (${timeoutMinutes} session). Click anywhere to stay logged in.`, {
        duration: 10000,
        action: {
          label: 'Stay logged in',
          onClick: updateActivity,
        },
      });
    }
  }, [updateActivity]);

  // Check session validity
  const checkSession = useCallback(() => {
    if (!isSignedIn || !userId) return;

    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    const currentTimeout = getCurrentTimeout();

    // If session has exceeded timeout, logout immediately
    if (timeSinceLastActivity >= currentTimeout) {
      handleAutoLogout();
      return;
    }

    // If approaching timeout, show warning
    if (timeSinceLastActivity >= currentTimeout - WARNING_TIME && !warningShownRef.current) {
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      const timeoutType = pathname.startsWith('/checkout') ? 'checkout' :
                         pathname.startsWith('/admin') ? 'admin' :
                         pathname.includes('/cart') ? 'cart' : 'default';
      
      showLogoutWarning(timeoutType);
      return;
    }
  }, [isSignedIn, userId, handleAutoLogout, showLogoutWarning, getCurrentTimeout]);

  // Set up activity listeners
  useEffect(() => {
    if (!isSignedIn) return;

    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Add event listeners for user activity
    const handleActivity = () => updateActivity();
    
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Set up periodic session checking
    intervalIdRef.current = setInterval(checkSession, ACTIVITY_CHECK_INTERVAL);

    // Initial activity update
    updateActivity();

    return () => {
      // Clean up event listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });

      // Clear intervals and timeouts
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [isSignedIn, updateActivity, checkSession]);

  // Handle page visibility changes
  useEffect(() => {
    if (!isSignedIn) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // User returned to the page, check session validity
        checkSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSignedIn, checkSession]);

  // Handle storage events (for multi-tab logout)
  useEffect(() => {
    if (!isSignedIn) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'clerk-logout' && e.newValue === 'true') {
        // Another tab logged out, logout this tab too
        handleAutoLogout();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isSignedIn, handleAutoLogout]);

  // Set logout flag in localStorage when signing out
  useEffect(() => {
    if (!isSignedIn && userId) {
      // User just signed out
      localStorage.setItem('clerk-logout', 'true');
      setTimeout(() => {
        localStorage.removeItem('clerk-logout');
      }, 1000);
    }
  }, [isSignedIn, userId]);

  return <>{children}</>;
}