/**
 * Booking Service — API Backend Bookings (User side)
 *
 * Backend source: backend/app/api/v1/endpoints/bookings.py
 * Router prefix: /bookings
 */

import { apiClient } from './api-client';
import type {
  BookingCreateRequest,
  BookingResponse,
  BookingListResponse,
  BookingListFilters,
  BookingPricePreviewRequest,
  BookingPriceResponse,
  BookingCancelRequest,
} from '../types/api-types';

// ==========================================
// BOOKING CRUD
// ==========================================

/** Calculate booking price before confirming. BE: POST /bookings/price-calculation */
export const calculateBookingPrice = async (
  data: BookingPricePreviewRequest
): Promise<BookingPriceResponse> => {
  return apiClient.post('/bookings/price-calculation', data);
};

/** Create new booking (status = PENDING). BE: POST /bookings */
export const createBooking = async (data: BookingCreateRequest): Promise<BookingResponse> => {
  return apiClient.post('/bookings', data);
};

/** List current user's bookings. BE: GET /bookings */
export const fetchMyBookings = async (
  filters?: BookingListFilters
): Promise<BookingListResponse> => {
  return apiClient.get('/bookings', { params: filters });
};

/** Get booking detail. BE: GET /bookings/{booking_id} */
export const fetchBookingById = async (bookingId: string): Promise<BookingResponse> => {
  return apiClient.get(`/bookings/${bookingId}`);
};

/** Update payment proof for an existing booking. BE: POST /bookings/{booking_id}/payment-proof */
export const updateBookingProof = async (
  bookingId: string,
  paymentProof: string
): Promise<BookingResponse> => {
  return apiClient.post(`/bookings/${bookingId}/payment-proof`, { payment_proof: paymentProof });
};

/** Cancel a booking. BE: POST /bookings/{booking_id}/cancel */
export const cancelBooking = async (
  bookingId: string,
  data?: BookingCancelRequest
): Promise<BookingResponse> => {
  return apiClient.post(`/bookings/${bookingId}/cancel`, data);
};
