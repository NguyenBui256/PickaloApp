/**
 * Image Service — Upload images to MinIO storage
 *
 * Backend source:
 *   - backend/app/api/v1/endpoints/images.py (prefix: /images)
 */

import { apiClient } from './api-client';

// ==========================================
// IMAGE UPLOAD ENDPOINTS
// ==========================================

/**
 * Upload venue images.
 * BE endpoint: POST /images/venues/{venue_id}
 */
export const uploadVenueImages = async (
  venueId: string,
  formData: FormData
): Promise<{ urls: string[]; count: number; message: string }> => {
  return apiClient.upload<{ urls: string[]; count: number; message: string }>(
    `/images/venues/${venueId}`,
    formData
  );
};

/**
 * Upload court images.
 * BE endpoint: POST /images/courts/{court_id}
 */
export const uploadCourtImages = async (
  courtId: string,
  formData: FormData
): Promise<{ urls: string[]; count: number; message: string }> => {
  return apiClient.upload<{ urls: string[]; count: number; message: string }>(
    `/images/courts/${courtId}`,
    formData
  );
};

/**
 * Upload payment proof image.
 * BE endpoint: POST /images/payment-proof
 */
export const uploadPaymentProof = async (
    formData: FormData
): Promise<{ url: string; filename: string; message: string }> => {
    return apiClient.upload<{ url: string; filename: string; message: string }>(
        '/images/payment-proof',
        formData
    );
};

/**
 * Delete image from storage.
 * BE endpoint: DELETE /images/{image_url}
 */
export const deleteImage = async (imageUrl: string): Promise<{ message: string }> => {
  return apiClient.delete<{ message: string }>(`/images/${encodeURIComponent(imageUrl)}`);
};