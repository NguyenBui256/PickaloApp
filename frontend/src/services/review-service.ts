/**
 * ============================================================
 * Review Service — Gọi API Backend Reviews
 * ============================================================
 * 
 * Backend spec: docs/api-specs/review-service.yaml
 * Port mặc định: 8088 (Local development)
 * 
 * ============================================================
 */

import { apiClient } from './api-client';
import type {
  ReviewResponse,
  ReviewListResponse,
  ReviewCreateRequest,
  ReviewUpdateRequest,
} from '../types/api-types';

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

/**
 * Lấy danh sách đánh giá của sân.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: GET /api/v1/venues/{venue_id}/reviews           │
 * └─────────────────────────────────────────────────────┘
 */
export const fetchVenueReviews = async (
  venueId: string, 
  page: number = 1, 
  limit: number = 10
): Promise<ReviewListResponse> => {
  return await apiClient.get(`/venues/${venueId}/reviews`, { 
    params: { page, limit } 
  });
};

/**
 * Gửi đánh giá mới cho sân.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: POST /api/v1/venues/{venue_id}/reviews          │
 * │ Yêu cầu: User đã hoàn thành booking tại sân này.    │
 * └─────────────────────────────────────────────────────┘
 */
export const createReview = async (
  venueId: string, 
  data: ReviewCreateRequest
): Promise<ReviewResponse> => {
  return await apiClient.post(`/venues/${venueId}/reviews`, data);
};

/**
 * Cập nhật đánh giá của chính mình.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: PUT /api/v1/reviews/{review_id}                 │
 * └─────────────────────────────────────────────────────┘
 */
export const updateReview = async (
  reviewId: string, 
  data: ReviewUpdateRequest
): Promise<ReviewResponse> => {
  return await apiClient.put(`/reviews/${reviewId}`, data);
};

/**
 * Xóa đánh giá.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: DELETE /api/v1/reviews/{review_id}              │
 * └─────────────────────────────────────────────────────┘
 */
export const deleteReview = async (reviewId: string): Promise<void> => {
  await apiClient.delete(`/reviews/${reviewId}`);
};
