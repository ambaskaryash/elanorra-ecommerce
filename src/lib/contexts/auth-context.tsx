'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate checking for existing session on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('Elanorraa_user');
        const storedToken = localStorage.getItem('Elanorraa_token');
        
        if (storedUser && storedToken) {
          // In a real app, you'd validate the token with your backend
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        localStorage.removeItem('Elanorraa_user');
        localStorage.removeItem('Elanorraa_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call - replace with real authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock validation - in real app, send to backend
      if (email === 'demo@Elanorraaliving.com' && password === 'demo123') {
        const mockUser: User = {
          id: '1',
          email,
          firstName: 'Demo',
          lastName: 'User',
          phone: '+91 9876543210',
          addresses: [
            {
              id: '1',
              firstName: 'Demo',
              lastName: 'User',
              company: 'Demo Company',
              address1: '123 Demo Street',
              address2: 'Apt 4B',
              city: 'Mumbai',
              country: 'India',
              province: 'Maharashtra',
              zip: '400001',
              phone: '+91 9876543210',
              isDefault: true,
            },
          ],
        };

        const mockToken = 'mock_jwt_token_' + Date.now();
        
        localStorage.setItem('Elanorraa_user', JSON.stringify(mockUser));
        localStorage.setItem('Elanorraa_token', mockToken);
        
        setUser(mockUser);
        return { success: true };
      } else {
        return { success: false, error: 'Invalid email or password' };
      }
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock registration - in real app, send to backend
      const mockUser: User = {
        id: Date.now().toString(),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        addresses: [],
      };

      const mockToken = 'mock_jwt_token_' + Date.now();
      
      localStorage.setItem('Elanorraa_user', JSON.stringify(mockUser));
      localStorage.setItem('Elanorraa_token', mockToken);
      
      setUser(mockUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Registration failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('Elanorraa_user');
    localStorage.removeItem('Elanorraa_token');
    setUser(null);
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedUser = { ...user, ...userData };
      localStorage.setItem('Elanorraa_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Update failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would send a password reset email
      console.log('Password reset email sent to:', email);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to send reset email. Please try again.' };
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
    resetPassword,
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