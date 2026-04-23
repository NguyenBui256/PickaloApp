/**
 * Auth Service — API Backend Auth & User Profile
 *
 * Backend source:
 *   - backend/app/api/v1/endpoints/auth.py (prefix: /auth)
 *   - backend/app/api/v1/endpoints/users.py (prefix: /users)
 */

import { apiClient } from './api-client';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  TokenResponse,
  VerifyPhoneRequest,
  ChangePasswordRequest,
  UserResponse,
  UserUpdateRequest,
} from '../types/api-types';

// ==========================================
// AUTH ENDPOINTS
// ==========================================

/** Login with phone + password. BE: POST /auth/login */
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  return apiClient.post('/auth/login', data, { skipAuth: true });
};

/** Register new account. BE: POST /auth/register */
export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  return apiClient.post('/auth/register', data, { skipAuth: true });
};

/** Refresh access token. BE: POST /auth/refresh */
export const refreshToken = async (refreshTokenStr: string): Promise<TokenResponse> => {
  return apiClient.post('/auth/refresh', { refresh_token: refreshTokenStr });
};

/** Logout and invalidate refresh token. BE: POST /auth/logout */
export const logout = async (refreshTokenStr: string): Promise<{ message: string }> => {
  return apiClient.post('/auth/logout', { refresh_token: refreshTokenStr });
};

/** Verify phone via OTP. BE: POST /auth/verify-phone (test OTP = "123456") */
export const verifyPhone = async (data: VerifyPhoneRequest): Promise<{ message: string }> => {
  return apiClient.post('/auth/verify-phone', data);
};

// ==========================================
// USER PROFILE
// ==========================================

/** Get current user profile. BE: GET /auth/me */
export const getMyProfile = async (): Promise<UserResponse> => {
  return apiClient.get('/auth/me');
};

/** Update current user profile (partial). BE: PATCH /auth/me */
export const updateMyProfile = async (data: UserUpdateRequest): Promise<UserResponse> => {
  return apiClient.patch('/auth/me', data);
};

/** Change password. BE: POST /auth/me/change-password */
export const changePassword = async (data: ChangePasswordRequest): Promise<{ message: string }> => {
  return apiClient.post('/auth/me/change-password', data);
};

// ==========================================
// USER ASSETS
// ==========================================

/**
 * Upload avatar.
 * TODO: BE endpoint POST /auth/me/avatar not yet available.
 * Using mock until backend adds multipart upload endpoint.
 */
export const uploadAvatar = async (formData: FormData): Promise<{ avatar_url: string }> => {
  // TODO: Uncomment when BE endpoint is ready
  // return apiClient.post('/auth/me/avatar', formData, {
  //   headers: { 'Content-Type': 'multipart/form-data' },
  // });
  console.log('[MOCK] uploadAvatar:', formData);
  return { avatar_url: 'https://i.pravatar.cc/150?u=uploaded' };
};
