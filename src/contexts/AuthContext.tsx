'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  region: string;
  postalCode?: string;
  isActive: boolean;
  emailVerified: boolean;
  lastActive?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  authError: 'expired' | 'invalid' | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, remember?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<{ success: boolean; error?: string }>;
  refreshAuth: () => Promise<boolean>;
  clearAuth: () => void;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    authError: null,
  });

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const userStr = localStorage.getItem('user');

        if (accessToken && refreshToken && userStr) {
          const user = JSON.parse(userStr);
          
          // Sync cookies with localStorage on load
          document.cookie = `accessToken=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; secure=${location.protocol === 'https:'}; samesite=lax`;
          document.cookie = `refreshToken=${refreshToken}; path=/; max-age=${30 * 24 * 60 * 60}; secure=${location.protocol === 'https:'}; samesite=lax`;
          
          setState({
            user,
            isLoading: false,
            isAuthenticated: true,
            accessToken,
            refreshToken,
            authError: null,
          });
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
        }));
      }
    };

    loadAuthState();
  }, []);

  // Save auth state to localStorage and cookies
  const saveAuthState = useCallback((user: User, accessToken: string, refreshToken: string) => {
    try {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Also set cookies for server-side access
      document.cookie = `accessToken=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; secure=${location.protocol === 'https:'}; samesite=lax`;
      document.cookie = `refreshToken=${refreshToken}; path=/; max-age=${30 * 24 * 60 * 60}; secure=${location.protocol === 'https:'}; samesite=lax`;
      
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
        accessToken,
        refreshToken,
        authError: null,
      });
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  }, []);

  // Clear auth state from localStorage and cookies
  const clearAuth = useCallback(() => {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Also clear cookies
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        authError: null,
      });
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  }, []);

  // Clear auth error
  const clearAuthError = useCallback(() => {
    setState(prev => ({ ...prev, authError: null }));
  }, []);

  // Set auth error
  const setAuthError = useCallback((error: 'expired' | 'invalid') => {
    setState(prev => ({ 
      ...prev, 
      authError: error,
      isAuthenticated: false,
      user: null,
      accessToken: null 
    }));
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string, remember: boolean = false) => {
    // Set loading state
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, remember }),
      });

      const data = await response.json();

      if (!response.ok) {
        setState(prev => ({ ...prev, isLoading: false }));
        return {
          success: false,
          error: data.message || 'Login failed',
        };
      }

      const { user, accessToken, refreshToken } = data.data;
      saveAuthState(user, accessToken, refreshToken);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }, [saveAuthState]);

  // Register function
  const register = useCallback(async (userData: any) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Registration failed',
        };
      }

      const { user, accessToken, refreshToken } = data.data;
      saveAuthState(user, accessToken, refreshToken);

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }, [saveAuthState]);

  // Refresh authentication
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    if (!state.refreshToken) {
      setAuthError('expired');
      return false;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: state.refreshToken }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 401 || data.message?.includes('expired')) {
          setAuthError('expired');
        } else {
          setAuthError('invalid');
        }
        return false;
      }

      const data = await response.json();
      const { user, accessToken, refreshToken } = data.data;
      saveAuthState(user, accessToken, refreshToken);

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      setAuthError('expired');
      return false;
    }
  }, [state.refreshToken, setAuthError, saveAuthState]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to invalidate tokens
      if (state.accessToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${state.accessToken}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      router.push('/');
    }
  }, [state.accessToken, clearAuth, router]);

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    register,
    refreshAuth,
    clearAuth,
    clearAuthError,
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