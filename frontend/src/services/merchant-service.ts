/**
 * Merchant Service — API Backend Merchant Bookings & Venues
 *
 * Backend sources:
 *   - backend/app/api/v1/endpoints/merchant_bookings.py (prefix: /merchant/bookings)
 *   - backend/app/api/v1/endpoints/merchant_venues.py (prefix: /merchant/venues)
 */

import { apiClient } from './api-client';
import type {
  BookingResponse,
  BookingListResponse,
  BookingListItem,
  BookingApproveRejectRequest,
  BookingCancelRequest,
  MerchantStatsResponse,
  RevenueTrendResponse,
} from '../types/api-types';

// ==========================================
// STATS
// ==========================================

/** Get merchant booking & revenue stats. BE: GET /merchant/bookings/stats */
export const fetchMerchantStats = async (): Promise<MerchantStatsResponse> => {
  return apiClient.get('/merchant/bookings/stats');
};

/** Get daily revenue trend for the last 7 days. BE: GET /merchant/bookings/revenue-trend */
export const fetchRevenueTrend = async (days: number = 7): Promise<RevenueTrendResponse> => {
  return apiClient.get('/merchant/bookings/revenue-trend', { params: { days } });
};

// ==========================================
// OWNER VENUE LIST
// ==========================================

/** Type used for merchant venue list items */
export interface OwnerVenueItem {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PENDING';
  total_bookings: number;
  revenue_mtd: number;
  rating: number;
}

/** Get merchant's venue list. BE: GET /merchant/venues */
export const fetchMyVenues = async (): Promise<OwnerVenueItem[]> => {
  try {
    console.log('Fetching merchant venues from /merchant/venues');
    const response = await apiClient.get<OwnerVenueItem[]>('/merchant/venues');
    console.log('Merchant venues response:', response);
    return response;
  } catch (error) {
    console.error('Error fetching merchant venues:', error);
    throw error;
  }
};

// ==========================================
// BOOKING MANAGEMENT
// ==========================================

/** List all bookings across merchant's venues. BE: GET /merchant/bookings */
export const fetchMerchantBookings = async (params?: {
  status?: string;
  venue_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}): Promise<BookingListResponse> => {
  return apiClient.get('/merchant/bookings', { params });
};

/** Get booking detail (merchant view). BE: GET /merchant/bookings/{booking_id} */
export const fetchMerchantBookingById = async (bookingId: string): Promise<BookingResponse> => {
  return apiClient.get(`/merchant/bookings/${bookingId}`);
};

/** Approve a booking. BE: POST /merchant/bookings/{booking_id}/approve */
export const approveBooking = async (
  bookingId: string,
  data?: BookingApproveRejectRequest
): Promise<BookingResponse> => {
  return apiClient.post(`/merchant/bookings/${bookingId}/approve`, data);
};

/** Reject a booking. BE: POST /merchant/bookings/{booking_id}/reject */
export const rejectBooking = async (
  bookingId: string,
  data: BookingApproveRejectRequest
): Promise<BookingResponse> => {
  return apiClient.post(`/merchant/bookings/${bookingId}/reject`, data);
};

/** Merchant cancels a booking. BE: POST /merchant/bookings/{booking_id}/cancel */
export const merchantCancelBooking = async (
  bookingId: string,
  data: BookingCancelRequest
): Promise<BookingResponse> => {
  return apiClient.post(`/merchant/bookings/${bookingId}/cancel`, data);
};

/** Get bookings for a specific venue. BE: GET /merchant/bookings/venues/{venue_id}/bookings */
export const fetchVenueBookings = async (
  venueId: string,
  params?: { booking_date?: string; status?: string }
): Promise<BookingListItem[]> => {
  return apiClient.get(`/merchant/bookings/venues/${venueId}/bookings`, { params });
};
