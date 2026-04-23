/**
 * Review Service — API Backend Reviews
 *
 * Backend source: backend/app/api/v1/endpoints/reviews.py
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

/** List reviews for a venue. BE: GET /venues/{venue_id}/reviews */
export const fetchVenueReviews = async (
  venueId: string,
  page: number = 1,
  limit: number = 10
): Promise<ReviewListResponse> => {
  return apiClient.get(`/venues/${venueId}/reviews`, { params: { page, limit } });
};

/** Submit a review (requires completed booking). BE: POST /venues/{venue_id}/reviews */
export const createReview = async (
  venueId: string,
  data: ReviewCreateRequest
): Promise<ReviewResponse> => {
  return apiClient.post(`/venues/${venueId}/reviews`, data);
};

/** Update own review. BE: PUT /reviews/{review_id} */
export const updateReview = async (
  reviewId: string,
  data: ReviewUpdateRequest
): Promise<ReviewResponse> => {
  return apiClient.put(`/reviews/${reviewId}`, data);
};

/** Delete own review. BE: DELETE /reviews/{review_id} */
export const deleteReview = async (reviewId: string): Promise<void> => {
  await apiClient.delete(`/reviews/${reviewId}`);
};
