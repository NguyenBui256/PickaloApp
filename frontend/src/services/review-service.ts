/**
 * ============================================================
 * Review Service — Gọi API Backend Reviews
 * ============================================================
 * 
 * Backend spec: docs/api-specs/review-service.yaml
 * Port mặc định: 8088 (Local development)
 * 
 * Mỗi hàm có 2 phần:
 *   1. API thật (commented) → bỏ comment khi BE sẵn sàng
 *   2. Mock fallback (active) → xóa khi dùng API thật
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
// ===== API THẬT =====
// export const fetchVenueReviews = async (
//   venueId: string, page: number = 1, limit: number = 10
// ): Promise<ReviewListResponse> => {
//   const response = await apiClient.get(`/venues/${venueId}/reviews`, { params: { page, limit } });
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const fetchVenueReviews = async (
  venueId: string, page: number = 1, limit: number = 10
): Promise<ReviewListResponse> => {
  console.log('[MOCK] fetchVenueReviews:', venueId, page, limit);
  
  const mockReviews: ReviewResponse[] = [
    {
      id: 'r1', user_id: 'u1', venue_id: venueId,
      rating: 5, comment: 'Sân rất đẹp, nhân viên nhiệt tình!',
      user_name: 'Nguyễn Văn A', created_at: '2026-04-20T10:00:00Z'
    },
    {
      id: 'r2', user_id: 'u2', venue_id: venueId,
      rating: 4, comment: 'Hơi đông vào giờ cao điểm nhưng chất lượng tốt.',
      user_name: 'Trần Thị B', created_at: '2026-04-21T15:30:00Z'
    },
    {
      id: 'r3', user_id: 'u3', venue_id: venueId,
      rating: 3, comment: 'Giá hơi cao so với mặt bằng chung.',
      user_name: 'Lê Văn C', created_at: '2026-04-22T09:00:00Z'
    }
  ];

  return {
    items: mockReviews,
    total: mockReviews.length,
    page,
    pages: 1
  };
};

/**
 * Gửi đánh giá mới cho sân.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: POST /api/v1/venues/{venue_id}/reviews          │
 * │ Yêu cầu: User đã hoàn thành booking tại sân này.    │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT =====
// export const createReview = async (
//   venueId: string, data: ReviewCreateRequest
// ): Promise<ReviewResponse> => {
//   const response = await apiClient.post(`/venues/${venueId}/reviews`, data);
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const createReview = async (
  venueId: string, data: ReviewCreateRequest
): Promise<ReviewResponse> => {
  console.log('[MOCK] createReview:', venueId, data);
  return {
    id: `mock-r-${Date.now()}`,
    user_id: 'current-user-id',
    venue_id: venueId,
    rating: data.rating,
    comment: data.comment,
    user_name: 'Người dùng hiện tại',
    created_at: new Date().toISOString()
  };
};

/**
 * Cập nhật đánh giá của chính mình.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: PUT /api/v1/reviews/{review_id}                 │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT =====
// export const updateReview = async (
//   reviewId: string, data: ReviewUpdateRequest
// ): Promise<ReviewResponse> => {
//   const response = await apiClient.put(`/reviews/${reviewId}`, data);
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const updateReview = async (
  reviewId: string, data: ReviewUpdateRequest
): Promise<ReviewResponse> => {
  console.log('[MOCK] updateReview:', reviewId, data);
  return {
    id: reviewId,
    user_id: 'current-user-id',
    venue_id: 'some-venue-id',
    rating: data.rating || 5,
    comment: data.comment || '',
    user_name: 'Người dùng hiện tại',
    created_at: new Date().toISOString()
  };
};

/**
 * Xóa đánh giá.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: DELETE /api/v1/reviews/{review_id}              │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT =====
// export const deleteReview = async (reviewId: string): Promise<void> => {
//   await apiClient.delete(`/reviews/${reviewId}`);
// };

// ===== MOCK FALLBACK =====
export const deleteReview = async (reviewId: string): Promise<void> => {
  console.log('[MOCK] deleteReview:', reviewId);
};
