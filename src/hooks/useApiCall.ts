'use client';

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

interface ApiCallOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  requireAuth?: boolean;
}

interface ApiCallState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

interface UseApiCallReturn<T> extends ApiCallState<T> {
  execute: (url: string, options?: ApiCallOptions) => Promise<T | null>;
  reset: () => void;
}

export function useApiCall<T = any>(): UseApiCallReturn<T> {
  const { accessToken, refreshAuth } = useAuth();
  
  const [state, setState] = useState<ApiCallState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
    });
  }, []);

  const execute = useCallback(async (
    url: string,
    options: ApiCallOptions = {}
  ): Promise<T | null> => {
    const {
      method = 'GET',
      body,
      headers = {},
      requireAuth = false,
    } = options;

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      // Prepare headers
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
      };

      // Add authorization header if required
      if (requireAuth && accessToken) {
        requestHeaders['Authorization'] = `Bearer ${accessToken}`;
      }

      // Make the request
      let response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      // Handle token refresh if unauthorized
      if (response.status === 401 && requireAuth) {
        const refreshed = await refreshAuth();
        
        if (refreshed) {
          // Retry with new token
          const newToken = localStorage.getItem('accessToken');
          if (newToken) {
            requestHeaders['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(url, {
              method,
              headers: requestHeaders,
              body: body ? JSON.stringify(body) : undefined,
            });
          }
        }
      }

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || `HTTP error! status: ${response.status}`;
        setState({
          data: null,
          error: errorMessage,
          isLoading: false,
        });
        return null;
      }

      setState({
        data: data.data || data,
        error: null,
        isLoading: false,
      });

      return data.data || data;

    } catch (error) {
      console.error('API call error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      
      setState({
        data: null,
        error: errorMessage,
        isLoading: false,
      });

      return null;
    }
  }, [accessToken, refreshAuth]);

  return {
    ...state,
    execute,
    reset,
  };
}