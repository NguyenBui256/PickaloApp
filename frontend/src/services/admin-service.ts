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
  UserRole
} from '../types/api-types';

// ==========================================
// STATISTICS
// ==========================================

/**
 * Lấy thống kê tổng quan hệ thống.
 * BE: GET /admin/dashboard
 */
export const getAdminStats = async (): Promise<AdminStatsResponse> => {
  const response = await apiClient.get('/admin/dashboard');
  return response.data;
};

// ==========================================
// USER MANAGEMENT
// ==========================================

/**
 * Danh sách người dùng theo vai trò.
 * BE: GET /admin/users
 */
export const getAdminUsers = async (role?: UserRole): Promise<AdminUserListItem[]> => {
  const response = await apiClient.get('/admin/users', { params: { role } });
  return response.data.users;
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

// ==========================================
// VENUE MANAGEMENT
// ==========================================

/**
 * Danh sách sân.
 * BE: GET /admin/venues
 */
export const getAdminVenues = async (is_verified?: boolean): Promise<AdminVenueListItem[]> => {
  const response = await apiClient.get('/admin/venues', { params: { is_verified } });
  return response.data.venues;
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
export const getAdminPosts = async (): Promise<AdminReportedPostItem[]> => {
  const response = await apiClient.get('/admin/posts');
  return response.data.posts;
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
  const response = await apiClient.get('/admin/audit-log', { params });
  return response.data.actions;
};

/**
 * Danh sách đặt sân quản trị.
 */
export const getAdminBookings = async (params?: any): Promise<any> => {
  const response = await apiClient.get('/admin/bookings', { params });
  return response.data;
};

/**
 * Chi tiết đặt sân.
 */
export const getAdminBookingDetail = async (id: string): Promise<BookingAdminDetail> => {
  const response = await apiClient.get(`/admin/bookings/${id}`);
  return response.data;
};
