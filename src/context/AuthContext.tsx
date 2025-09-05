'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthState, AuthUser, LoginCredentials, RegisterData } from '@/types';
import apiClient from '@/lib/api';
import { toast } from 'react-hot-toast';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (roles: string | string[]) => boolean;
  hasLibraryAccess: (libraryId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          // Verify token by fetching user profile
          const response = await apiClient.getProfile();
          if (response.success && response.data?.user) {
            setAuthState({
              user: response.data.user,
              accessToken: token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('accessToken');
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('accessToken');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await apiClient.login(credentials);
      
      if (response.success && response.data) {
        setAuthState({
          user: response.data.user,
          accessToken: response.data.accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
        
        toast.success('Login successful!');
        return true;
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        toast.error(response.error || 'Login failed');
        return false;
      }
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      toast.error(error.response?.data?.error || 'Login failed');
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await apiClient.register(data);
      
      if (response.success && response.data) {
        setAuthState({
          user: response.data.user,
          accessToken: response.data.accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
        
        const message = data.role === 'guest' 
          ? 'Account created successfully!' 
          : 'Account created successfully. Please wait for admin approval.';
        toast.success(message);
        return true;
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        toast.error(response.error || 'Registration failed');
        return false;
      }
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      toast.error(error.response?.data?.error || 'Registration failed');
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthState({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
      toast.success('Logged out successfully');
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await apiClient.getProfile();
      if (response.success && response.data?.user) {
        setAuthState(prev => ({
          ...prev,
          user: response.data.user,
        }));
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const hasRole = (roles: string | string[]): boolean => {
    if (!authState.user) return false;
    
    const userRoles = Array.isArray(roles) ? roles : [roles];
    return userRoles.includes(authState.user.role);
  };

  const hasLibraryAccess = (libraryId: string): boolean => {
    if (!authState.user) return false;
    
    // Super admin has access to all libraries
    if (authState.user.role === 'superadmin') return true;
    
    // Admin needs to have access to the specific library
    if (authState.user.role === 'admin') {
      return authState.user.libraries?.includes(libraryId) || false;
    }
    
    // Students and guests can access any library for browsing
    return true;
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    refreshUser,
    hasRole,
    hasLibraryAccess,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
