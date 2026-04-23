/**
 * ============================================================
 * Auth Service — Gọi API Backend Auth & User Profile
 * ============================================================
 *
 * Backend source:
 *   - backend/app/api/v1/endpoints/auth.py (prefix: /auth, api.py:L24)
 *   - backend/app/api/v1/endpoints/users.py (prefix: /users, api.py:L25)
 *
 * ⚠️ CÁC YÊU CẦU KHÁC:
 *   1. Phone format: +84xxxxxxxxx (BE validate)
 *   2. Password: 8-16 chars, uppercase + lowercase + digit
 *   3. OTP verification: placeholder, test code = 123456
 *   4. Sau login/register → lưu tokens vào AsyncStorage (APP_CONFIG.STORAGE_KEYS)
 *   5. BE CHƯA CÓ API upload avatar
 *   6. change-password: BE nhận query params, cần xác nhận lại
 *
 * Mỗi hàm có 2 phần:
 *   1. API thật (commented) → bỏ comment khi BE sẵn sàng
 *   2. Mock fallback (active) → xóa khi dùng API thật
 */

// @ts-ignore — apiClient sẽ dùng khi bỏ comment API thật
import { apiClient } from './api-client';
import { MOCK_USER, MOCK_OWNER, MOCK_ADMIN } from '@constants/mock-data';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  TokenResponse,
  // RefreshTokenRequest, // Dùng khi bỏ comment API thật
  VerifyPhoneRequest,
  ChangePasswordRequest,
  UserResponse,
  UserProfileResponse,
  UserUpdateRequest,
  UserRole,
} from '../types/api-types';

// ==========================================
// AUTH ENDPOINTS
// ==========================================

/**
 * Đăng nhập bằng SĐT + mật khẩu.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: POST /auth/login                                │
 * │ File: auth.py:L73 → login()                         │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (auth.py:L73) =====
// export const login = async (data: LoginRequest): Promise<AuthResponse> => {
//   const response = await apiClient.post('/auth/login', data);
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  console.log('[MOCK] login:', data.phone);

  // Admin Login Bypass
  if (data.phone.endsWith('66668888') && data.password === '123456') {
    return {
      access_token: 'mock-admin-token-' + Date.now(),
      refresh_token: 'mock-admin-refresh-token-' + Date.now(),
      token_type: 'Bearer',
      expires_in: 3600,
      user: {
        id: MOCK_ADMIN.id,
        phone: MOCK_ADMIN.phone,
        full_name: MOCK_ADMIN.full_name,
        email: MOCK_ADMIN.email,
        avatar_url: MOCK_ADMIN.avatar_url,
        date_of_birth: null,
        role: MOCK_ADMIN.role as UserRole,
        is_active: MOCK_ADMIN.is_active,
        is_verified: MOCK_ADMIN.is_verified,
      },
    };
  }

  const isOwner = data.phone.includes('123456789');
  const user = isOwner ? MOCK_OWNER : MOCK_USER;

  return {
    access_token: 'mock-access-token-' + Date.now(),
    refresh_token: 'mock-refresh-token-' + Date.now(),
    token_type: 'Bearer', expires_in: 900,
    user: {
      id: user.id, phone: user.phone, full_name: user.full_name,
      email: user.email || null, avatar_url: user.avatar_url || null,
      date_of_birth: null, role: user.role as UserRole,
      is_active: user.is_active, is_verified: user.is_verified,
    },
  };
};


/**
 * Đăng ký tài khoản mới.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: POST /auth/register                             │
 * │ File: auth.py:L31 → register()                      │
 * │ Validation: phone +84xxx, password 8-16 chars       │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (auth.py:L31) =====
// export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
//   const response = await apiClient.post('/auth/register', data);
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  console.log('[MOCK] register:', data);
  return {
    access_token: 'mock-access-token-' + Date.now(),
    refresh_token: 'mock-refresh-token-' + Date.now(),
    token_type: 'Bearer', expires_in: 900,
    user: {
      id: 'mock-new-user-' + Date.now(), phone: data.phone,
      full_name: data.full_name, email: data.email || null,
      avatar_url: null, date_of_birth: null,
      role: data.role || 'USER', is_active: true, is_verified: false,
    },
  };
};


/**
 * Refresh access token.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: POST /auth/refresh                              │
 * │ File: auth.py:L109 → refresh_token()                │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (auth.py:L109) =====
// export const refreshToken = async (refreshTokenStr: string): Promise<TokenResponse> => {
//   const response = await apiClient.post('/auth/refresh', { refresh_token: refreshTokenStr });
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const refreshToken = async (refreshTokenStr: string): Promise<TokenResponse> => {
  console.log('[MOCK] refreshToken:', refreshTokenStr);
  return { access_token: 'mock-refreshed-token-' + Date.now(), token_type: 'Bearer', expires_in: 900 };
};


/**
 * Đăng xuất và vô hiệu hóa refresh token.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: POST /auth/logout                               │
 * │ File: auth.py:L135 → logout()                       │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (auth.py:L135) =====
// export const logout = async (refreshTokenStr: string): Promise<{ message: string }> => {
//   const response = await apiClient.post('/auth/logout', { refresh_token: refreshTokenStr });
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const logout = async (refreshTokenStr: string): Promise<{ message: string }> => {
  console.log('[MOCK] logout:', refreshTokenStr);
  return { message: 'Successfully logged out' };
};


/**
 * Xác thực SĐT bằng OTP.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: POST /auth/verify-phone                         │
 * │ File: auth.py:L156 → verify_phone()                 │
 * │ ⚠️ Placeholder — test OTP = "123456"                │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (auth.py:L156) =====
// export const verifyPhone = async (data: VerifyPhoneRequest): Promise<{ message: string }> => {
//   const response = await apiClient.post('/auth/verify-phone', data);
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const verifyPhone = async (data: VerifyPhoneRequest): Promise<{ message: string }> => {
  console.log('[MOCK] verifyPhone:', data);
  if (data.otp === '123456') return { message: 'Phone verified successfully' };
  throw new Error('Invalid OTP code');
};


// ==========================================
// USER PROFILE
// ==========================================

/**
 * Lấy profile user đang đăng nhập.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: GET /auth/me                                    │
 * │ File: auth.py:L185 → get_current_user_profile()     │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (auth.py:L185) =====
// export const getMyProfile = async (): Promise<UserResponse> => {
//   const response = await apiClient.get('/auth/me');
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const getMyProfile = async (): Promise<UserResponse> => {
  return {
    id: MOCK_USER.id, phone: MOCK_USER.phone, full_name: MOCK_USER.full_name,
    email: MOCK_USER.email, avatar_url: MOCK_USER.avatar_url,
    date_of_birth: MOCK_USER.date_of_birth || null,
    role: MOCK_USER.role as UserRole, is_active: MOCK_USER.is_active,
    is_verified: MOCK_USER.is_verified,
  };
};


/**
 * Cập nhật profile (partial update).
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: PATCH /auth/me                                  │
 * │ File: auth.py:L197 → update_current_user_profile()  │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (auth.py:L197) =====
// export const updateMyProfile = async (data: UserUpdateRequest): Promise<UserResponse> => {
//   const response = await apiClient.patch('/auth/me', data);
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const updateMyProfile = async (data: UserUpdateRequest): Promise<UserResponse> => {
  console.log('[MOCK] updateMyProfile:', data);
  const current = await getMyProfile();
  return { ...current, ...data } as UserResponse;
};


/**
 * Đổi mật khẩu.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: POST /auth/me/change-password                   │
 * │ File: auth.py:L218 → change_password()              │
 * │ ⚠️ BE nhận query params, không phải body            │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (auth.py:L218) =====
// export const changePassword = async (data: ChangePasswordRequest): Promise<{ message: string }> => {
//   const response = await apiClient.post('/auth/me/change-password', data);
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const changePassword = async (data: ChangePasswordRequest): Promise<{ message: string }> => {
  console.log('[MOCK] changePassword:', data);
  return { message: 'Password changed successfully' };
};


// ==========================================
// USER ASSETS
// ==========================================


/**
 * Upload avatar.
 * ┌─────────────────────────────────────────────────────┐
 * │ ⚠️ BE CHƯA CÓ endpoint POST /auth/me/avatar        │
 * │ Cần bổ sung: upload multipart/form-data             │
 * │ Response: { avatar_url: string }                    │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (⚠️ CHƯA CÓ BE — cần tạo endpoint) =====
// export const uploadAvatar = async (formData: FormData): Promise<{ avatar_url: string }> => {
//   const response = await apiClient.post('/auth/me/avatar', formData, {
//     headers: { 'Content-Type': 'multipart/form-data' },
//   });
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const uploadAvatar = async (formData: FormData): Promise<{ avatar_url: string }> => {
  console.log('[MOCK] uploadAvatar:', formData);
  return { avatar_url: 'https://i.pravatar.cc/150?u=uploaded' };
};
