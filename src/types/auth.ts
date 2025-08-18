import type { User } from '@prisma/client';

// Authentication types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  region: string;
  profileImage?: string | null;
  isActive: boolean;
  emailVerified: Date | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  region: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

export interface ResetPasswordCredentials {
  email: string;
}

export interface UpdatePasswordCredentials {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface VerifyEmailCredentials {
  token: string;
  email: string;
}

// Session types
export interface UserSession {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  isActive: boolean;
  lastActive: Date;
}

// JWT Payload types
export interface JWTPayload {
  sub: string; // user id
  email: string;
  name: string;
  iat: number;
  exp: number;
  type: 'access' | 'refresh';
}

export interface AccessTokenPayload extends JWTPayload {
  type: 'access';
  isActive: boolean;
  region: string;
}

export interface RefreshTokenPayload extends JWTPayload {
  type: 'refresh';
  version: number;
}

// Auth context types
export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (credentials: ResetPasswordCredentials) => Promise<void>;
  updatePassword: (credentials: UpdatePasswordCredentials) => Promise<void>;
  verifyEmail: (credentials: VerifyEmailCredentials) => Promise<void>;
  refreshSession: () => Promise<void>;
}

// Authentication response types
export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  accessToken?: string;
  refreshToken?: string;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface LoginResponse extends AuthResponse {
  requiresEmailVerification?: boolean;
}

export interface RegisterResponse extends AuthResponse {
  requiresEmailVerification: boolean;
}

// Error types
export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

export type AuthErrorCodes = 
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_VERIFIED'
  | 'EMAIL_ALREADY_EXISTS'
  | 'USER_NOT_FOUND'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'WEAK_PASSWORD'
  | 'RATE_LIMITED'
  | 'ACCOUNT_LOCKED'
  | 'INVALID_EMAIL_FORMAT'
  | 'PASSWORD_MISMATCH';

// Provider types (for future OAuth integration)
export type AuthProvider = 'email' | 'google' | 'apple';

export interface ProviderAccount {
  provider: AuthProvider;
  providerAccountId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
}

// Permission types
export type Permission = 
  | 'user:read'
  | 'user:write'
  | 'user:delete'
  | 'post:create'
  | 'post:edit'
  | 'post:delete'
  | 'chat:read'
  | 'chat:write'
  | 'appointment:create'
  | 'appointment:edit'
  | 'document:upload'
  | 'document:verify'
  | 'admin:users'
  | 'admin:posts'
  | 'admin:system';

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface UserWithRole extends User {
  role?: Role;
}

// Two-factor authentication types (for future implementation)
export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorCredentials {
  code: string;
  backupCode?: string;
}

// Password policy types
export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  preventCommonPasswords: boolean;
  preventReuse: number; // number of previous passwords to check
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
}

export interface LoginAttempt {
  ip: string;
  email: string;
  timestamp: Date;
  successful: boolean;
  userAgent?: string;
}