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
 * BE: GET /admin/dashboard/stats (Chưa có)
 */
export const getAdminStats = async (): Promise<AdminStatsResponse> => {
  // console.log('[API] getAdminStats');
  // const response = await apiClient.get('/admin/dashboard/stats');
  // return response.data;

  // Mock Fallback
  return new Promise((resolve) => {
    setTimeout(() => resolve(ADMIN_STATS), 500);
  });
};

// ==========================================
// USER MANAGEMENT
// ==========================================

/**
 * Danh sách người dùng theo vai trò.
 * BE: GET /admin/users (Chưa có)
 */
export const getAdminUsers = async (role: UserRole): Promise<AdminUserListItem[]> => {
  // const response = await apiClient.get('/admin/users', { params: { role } });
  // return response.data;

  // Mock Fallback
  return new Promise((resolve) => {
    const filtered = ADMIN_USERS.filter(u => u.role === role);
    setTimeout(() => resolve(filtered as AdminUserListItem[]), 500);
  });
};

/**
 * Khóa/Mở khóa người dùng.
 */
export const toggleUserStatus = async (userId: string, active: boolean): Promise<void> => {
  console.log(`[MOCK] toggleUserStatus: ${userId} -> ${active}`);
  return new Promise((resolve) => setTimeout(resolve, 500));
};

// ==========================================
// VENUE MANAGEMENT
// ==========================================

/**
 * Danh sách sân theo trạng thái.
 * BE: GET /admin/venues (Chưa có)
 */
export const getAdminVenues = async (status: 'ACTIVE' | 'PENDING' | 'DELETED'): Promise<AdminVenueListItem[]> => {
  // const response = await apiClient.get('/admin/venues', { params: { status } });
  // return response.data;

  // Mock Fallback
  return new Promise((resolve) => {
    const filtered = ADMIN_VENUES.filter(v => v.status === status);
    setTimeout(() => resolve(filtered as AdminVenueListItem[]), 500);
  });
};

/**
 * Duyệt sân.
 * BE: POST /venues/{id}/verify (Đã có logic, auth.py)
 */
export const verifyVenue = async (venueId: string): Promise<void> => {
  // await apiClient.post(`/venues/${venueId}/verify`);
  console.log(`[MOCK] verifyVenue: ${venueId}`);
  return new Promise((resolve) => setTimeout(resolve, 500));
};

/**
 * Xóa/Khôi phục sân.
 */
export const updateVenueStatus = async (venueId: string, status: 'ACTIVE' | 'DELETED'): Promise<void> => {
  console.log(`[MOCK] updateVenueStatus: ${venueId} -> ${status}`);
  return new Promise((resolve) => setTimeout(resolve, 500));
};

// ==========================================
// POST MANAGEMENT
// ==========================================

/**
 * Danh sách bài đăng bị báo cáo.
 */
export const getReportedPosts = async (): Promise<AdminReportedPostItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(ADMIN_REPORTED_POSTS), 500);
  });
};

/**
 * Xóa bài đăng.
 */
export const deletePost = async (postId: string): Promise<void> => {
  console.log(`[MOCK] deletePost: ${postId}`);
  return new Promise((resolve) => setTimeout(resolve, 500));
};

/**
 * Khóa người dùng đăng bài vi phạm.
 */
export const banUserByPost = async (userId: string): Promise<void> => {
  console.log(`[MOCK] banUserByPost: ${userId}`);
  return new Promise((resolve) => setTimeout(resolve, 500));
};
