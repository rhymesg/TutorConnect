'use client';

import { useState, useEffect, useCallback } from 'react';
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
}

interface UseAuthReturn extends AuthState {
  login: (email: string, password: string, remember?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<{ success: boolean; error?: string }>;
  refreshAuth: () => Promise<boolean>;
  clearAuth: () => void;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
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
          setState({
            user,
            isLoading: false,
            isAuthenticated: true,
            accessToken,
            refreshToken,
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

  // Save auth state to localStorage
  const saveAuthState = useCallback((user: User, accessToken: string, refreshToken: string) => {
    try {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  }, []);

  // Clear auth state
  const clearAuth = useCallback(() => {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
      });
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string, remember: boolean = false) => {
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
      clearAuth();
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
        clearAuth();
        return false;
      }

      const data = await response.json();
      const { user, accessToken, refreshToken } = data.data;
      saveAuthState(user, accessToken, refreshToken);

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      clearAuth();
      return false;
    }
  }, [state.refreshToken, clearAuth, saveAuthState]);

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

  return {
    ...state,
    login,
    logout,
    register,
    refreshAuth,
    clearAuth,
  };
}