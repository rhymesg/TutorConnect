import { renderHook, act, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
};

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('initial state', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth());
      
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(result.current.refreshToken).toBeNull();
    });

    it('should load auth state from localStorage if available', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        region: 'oslo',
        isActive: true,
        emailVerified: true,
      };

      mockLocalStorage.getItem
        .mockImplementationOnce((key) => key === 'accessToken' ? 'access-token' : null)
        .mockImplementationOnce((key) => key === 'refreshToken' ? 'refresh-token' : null)
        .mockImplementationOnce((key) => key === 'user' ? JSON.stringify(mockUser) : null);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.accessToken).toBe('access-token');
      expect(result.current.refreshToken).toBe('refresh-token');
    });

    it('should handle error when loading from localStorage', async () => {
      mockLocalStorage.getItem
        .mockImplementationOnce(() => 'access-token')
        .mockImplementationOnce(() => 'refresh-token')
        .mockImplementationOnce(() => 'invalid-json');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading auth state:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('login', () => {
    it('should successfully login and save auth state', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        region: 'oslo',
        isActive: true,
        emailVerified: true,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: mockUser,
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
        }),
      });

      const { result } = renderHook(() => useAuth());

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123', true);
      });

      expect(loginResult).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          remember: true,
        }),
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('accessToken', 'new-access-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'new-refresh-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should handle login failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          message: 'Invalid credentials',
        }),
      });

      const { result } = renderHook(() => useAuth());

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'wrongpassword');
      });

      expect(loginResult).toEqual({
        success: false,
        error: 'Invalid credentials',
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle network error during login', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useAuth());

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123');
      });

      expect(loginResult).toEqual({
        success: false,
        error: 'Network error occurred',
      });

      expect(consoleSpy).toHaveBeenCalledWith('Login error:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('register', () => {
    it('should successfully register and save auth state', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        region: 'oslo',
        isActive: true,
        emailVerified: false,
      };

      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        region: 'oslo',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: mockUser,
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
        }),
      });

      const { result } = renderHook(() => useAuth());

      let registerResult;
      await act(async () => {
        registerResult = await result.current.register(userData);
      });

      expect(registerResult).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should handle registration failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          message: 'Email already exists',
        }),
      });

      const { result } = renderHook(() => useAuth());

      let registerResult;
      await act(async () => {
        registerResult = await result.current.register({ email: 'test@example.com' });
      });

      expect(registerResult).toEqual({
        success: false,
        error: 'Email already exists',
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('refreshAuth', () => {
    it('should successfully refresh authentication', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        region: 'oslo',
        isActive: true,
        emailVerified: true,
      };

      // Setup initial auth state
      mockLocalStorage.getItem
        .mockImplementationOnce(() => 'old-access-token')
        .mockImplementationOnce(() => 'old-refresh-token')
        .mockImplementationOnce(() => JSON.stringify(mockUser));

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: mockUser,
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
        }),
      });

      const { result } = renderHook(() => useAuth());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let refreshResult;
      await act(async () => {
        refreshResult = await result.current.refreshAuth();
      });

      expect(refreshResult).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'old-refresh-token' }),
      });
    });

    it('should clear auth state if refresh token is missing', async () => {
      const { result } = renderHook(() => useAuth());

      let refreshResult;
      await act(async () => {
        refreshResult = await result.current.refreshAuth();
      });

      expect(refreshResult).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
    });

    it('should clear auth state if refresh fails', async () => {
      // Setup initial auth state with refresh token
      mockLocalStorage.getItem
        .mockImplementationOnce(() => 'access-token')
        .mockImplementationOnce(() => 'refresh-token')
        .mockImplementationOnce(() => JSON.stringify({ id: 'user-123' }));

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => useAuth());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      let refreshResult;
      await act(async () => {
        refreshResult = await result.current.refreshAuth();
      });

      expect(refreshResult).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle network error during refresh', async () => {
      // Setup initial auth state
      mockLocalStorage.getItem
        .mockImplementationOnce(() => 'access-token')
        .mockImplementationOnce(() => 'refresh-token')
        .mockImplementationOnce(() => JSON.stringify({ id: 'user-123' }));

      mockFetch.mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useAuth());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      let refreshResult;
      await act(async () => {
        refreshResult = await result.current.refreshAuth();
      });

      expect(refreshResult).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Token refresh error:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('logout', () => {
    it('should logout and clear auth state', async () => {
      // Setup initial authenticated state
      mockLocalStorage.getItem
        .mockImplementationOnce(() => 'access-token')
        .mockImplementationOnce(() => 'refresh-token')
        .mockImplementationOnce(() => JSON.stringify({ id: 'user-123' }));

      mockFetch.mockResolvedValue({ ok: true });

      const { result } = renderHook(() => useAuth());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer access-token',
          'Content-Type': 'application/json',
        },
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('should clear auth state even if logout API call fails', async () => {
      // Setup initial authenticated state
      mockLocalStorage.getItem
        .mockImplementationOnce(() => 'access-token')
        .mockImplementationOnce(() => 'refresh-token')
        .mockImplementationOnce(() => JSON.stringify({ id: 'user-123' }));

      mockFetch.mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useAuth());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(mockPush).toHaveBeenCalledWith('/');
      expect(consoleSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should skip API call if no access token exists', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('clearAuth', () => {
    it('should clear all auth state and localStorage', async () => {
      // Setup initial authenticated state
      mockLocalStorage.getItem
        .mockImplementationOnce(() => 'access-token')
        .mockImplementationOnce(() => 'refresh-token')
        .mockImplementationOnce(() => JSON.stringify({ id: 'user-123' }));

      const { result } = renderHook(() => useAuth());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      act(() => {
        result.current.clearAuth();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.accessToken).toBeNull();
      expect(result.current.refreshToken).toBeNull();
    });

    it('should handle localStorage errors gracefully', async () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.clearAuth();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error clearing auth state:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('saveAuthState', () => {
    it('should handle localStorage errors when saving', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage full');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        region: 'oslo',
        isActive: true,
        emailVerified: true,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: mockUser,
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
          },
        }),
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error saving auth state:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});