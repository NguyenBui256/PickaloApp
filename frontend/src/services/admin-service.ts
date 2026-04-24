/**
 * ============================================================
 * Admin Service — Quản trị hệ thống (Stats, Users, Venues, Posts)
 * ============================================================
 * 
 * Chứa các API dành riêng cho vai trò ADMIN.
 * Hiện tại chủ yếu sử dụng Mock Fallback để demo tính năng.
 */

import { apiClient } from './api-client';
import {
  ADMIN_STATS,
  ADMIN_USERS,
  ADMIN_VENUES,
  ADMIN_REPORTED_POSTS
} from '@constants/mock-data';
import type {
  AdminStatsResponse,
  AdminUserListItem,
  AdminVenueListItem,
  AdminReportedPostItem,
  UserRole,
  AuditLogItem
} from '@api-types/api-types';

// ==========================================
// STATISTICS
// ==========================================

/**
 * Lấy thống kê tổng quan hệ thống.
 * BE: GET /admin/dashboard
 */
export const getAdminStats = async (): Promise<AdminStatsResponse> => {
  return await apiClient.get('/admin/dashboard');
};

// ==========================================
// USER MANAGEMENT
// ==========================================

/**
 * Danh sách người dùng theo vai trò.
 * BE: GET /admin/users
 */
export const getAdminUsers = async (role?: UserRole): Promise<AdminUserListItem[]> => {
  const data = await apiClient.get<any>('/admin/users', { params: { role } });
  return data.users;
};

/**
 * Tạo người dùng mới.
 */
export const createUser = async (userData: any): Promise<AdminUserListItem> => {
  return await apiClient.post('/admin/users', userData);
};

/**
 * Khóa người dùng.
 */
export const banUser = async (userId: string, reason: string): Promise<void> => {
  await apiClient.patch(`/admin/users/${userId}/ban`, { reason });
};

/**
 * Mở khóa người dùng.
 */
export const unbanUser = async (userId: string, reason: string): Promise<void> => {
  await apiClient.patch(`/admin/users/${userId}/unban`, { reason });
};

/**
 * Bật/Tắt trạng thái hoạt động của người dùng.
 */
export const toggleUserStatus = async (userId: string, isActive: boolean): Promise<void> => {
  if (isActive) {
    return await unbanUser(userId, 'Mở khóa bởi Admin');
  } else {
    return await banUser(userId, 'Khóa bởi Admin');
  }
};

// ==========================================
// VENUE MANAGEMENT
// ==========================================

/**
 * Danh sách sân.
 * BE: GET /admin/venues
 */
export const getAdminVenues = async (is_verified?: boolean): Promise<AdminVenueListItem[]> => {
  const data = await apiClient.get<any>('/admin/venues', { params: { is_verified } });
  return data.venues;
};

/**
 * Duyệt sân.
 */
export const verifyVenue = async (venue_id: string, verified: boolean, reason: string): Promise<void> => {
  await apiClient.patch(`/admin/venues/${venue_id}/verify`, { verified, reason });
};

/**
 * Cập nhật trạng thái sân.
 */
export const updateVenueStatus = async (venueId: string, is_active: boolean, reason: string): Promise<void> => {
  await apiClient.patch(`/admin/venues/${venueId}/status`, { is_active, reason });
};

// ==========================================
// POST MANAGEMENT
// ==========================================

/**
 * Danh sách bài đăng quản trị.
 */
export const getReportedPosts = async (): Promise<AdminReportedPostItem[]> => {
  const data = await apiClient.get<any>('/admin/posts');
  return data.posts;
};

/**
 * Xóa bài đăng.
 */
export const deletePost = async (postId: string): Promise<void> => {
  await apiClient.delete(`/admin/posts/${postId}`);
};

/**
 * Lấy nhật ký hệ thống.
 */
export const getAuditLog = async (params?: any): Promise<AuditLogItem[]> => {
  const data = await apiClient.get<any>('/admin/audit-log', { params });
  return data.actions;
};

/**
 * Danh sách đặt sân quản trị.
 */
export const getAdminBookings = async (params?: any): Promise<any> => {
  return await apiClient.get('/admin/bookings', { params });
};

/**
 * Chi tiết đặt sân.
 */
export const getAdminBookingDetail = async (id: string): Promise<any> => {
  return await apiClient.get(`/admin/bookings/${id}`);
};

/**
 * Khóa người dùng thông qua bài đăng bị báo cáo.
 */
export const banUserByPost = async (userId: string): Promise<void> => {
  return await banUser(userId, 'Vi phạm chính sách nội dung qua bài đăng bị báo cáo');
};
