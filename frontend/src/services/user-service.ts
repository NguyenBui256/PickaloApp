import { apiClient } from './api-client';

/**
 * Cập nhật Expo Push Token cho người dùng hiện tại.
 */
export const updatePushToken = async (token: string): Promise<any> => {
  return await apiClient.post('/users/me/push-token', { token });
};

/**
 * Lấy thông tin cá nhân.
 */
export const getMyProfile = async (): Promise<any> => {
  return await apiClient.get('/users/me');
};
