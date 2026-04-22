/**
 * ============================================================
 * Merchant Service — Gọi API Backend Merchant Bookings
 * ============================================================
 *
 * Backend source: backend/app/api/v1/endpoints/merchant_bookings.py
 * Router prefix: /merchant/bookings (đăng ký tại api/v1/api.py:L28)
 *
 * ════════════════════════════════════════════════════════════
 * GAP ANALYSIS — FE cần mà BE chưa trả/chưa có:
 * ════════════════════════════════════════════════════════════
 * 🔴 GET /merchant/venues → BE chưa có (danh sách sân của chủ sân)
 * 🔴 BookingListItem thiếu `customerName` → BE cần join User.full_name
 * 🔴 BookingListItem thiếu `phone` → BE cần join User.phone
 * 🔴 BookingListItem thiếu `services[]` → BE cần include Services trong list view
 * 🔴 FE mock dùng `court` (sân con) → BE không có concept này (1 Venue = 1 sân)
 * 🟡 PATCH /venues/{id}/maintenance → ghim bảo trì cho slot
 * 🟡 OWNER_VENUES cần fields: total_bookings, revenue_mtd (BE cần aggregate)
 *
 * FE mock role "OWNER" → KHÔNG TỒN TẠI trong BE. Cần dùng "MERCHANT".
 * ════════════════════════════════════════════════════════════
 *
 * Mỗi hàm có 2 phần:
 *   1. API thật (commented) → bỏ comment khi BE sẵn sàng
 *   2. Mock fallback (active) → xóa khi dùng API thật
 */

// @ts-ignore — apiClient sẽ dùng khi bỏ comment API thật
import { apiClient } from './api-client';
import { OWNER_VENUES, OWNER_BOOKING_REQUESTS } from '@constants/mock-data';
import type {
  BookingResponse,
  BookingListResponse,
  BookingListItem,
  BookingApproveRejectRequest,
  BookingCancelRequest,
  MerchantStatsResponse,
} from '../types/api-types';

// ==========================================
// STATS
// ==========================================

/**
 * Lấy thống kê booking & doanh thu.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: GET /merchant/bookings/stats                    │
 * │ File: merchant_bookings.py:L30 → get_merchant_booking_stats()
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (merchant_bookings.py:L30) =====
// export const fetchMerchantStats = async (): Promise<MerchantStatsResponse> => {
//   const response = await apiClient.get('/merchant/bookings/stats');
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const fetchMerchantStats = async (): Promise<MerchantStatsResponse> => {
  return {
    venues: OWNER_VENUES.map(v => ({
      id: v.id,
      name: v.name,
      status: v.status,
      total_bookings: v.total_bookings,
      revenue_mtd: v.revenue_mtd,
      rating: v.rating,
    })),
    currency: 'VND',
  };
};

// ==========================================
// OWNER VENUE TYPE & LIST
// ==========================================

/** Type dùng cho danh sách sân của chủ sân */
export interface OwnerVenueItem {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PENDING';
  total_bookings: number;
  revenue_mtd: number;
  rating: number;
}

/**
 * Lấy danh sách sân của chủ sân hiện tại.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: GET /merchant/venues (chưa có — GAP)            │
 * └─────────────────────────────────────────────────────┘
 */
// ===== MOCK FALLBACK =====
export const fetchMyVenues = async (): Promise<OwnerVenueItem[]> => {
  return OWNER_VENUES.map(v => ({
    id: v.id,
    name: v.name,
    status: v.status as 'ACTIVE' | 'PENDING',
    total_bookings: v.total_bookings,
    revenue_mtd: v.revenue_mtd,
    rating: v.rating,
  }));
};

// ==========================================
// BOOKING MANAGEMENT
// ==========================================

/**
 * Lấy tất cả bookings của các sân thuộc chủ sân.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: GET /merchant/bookings                          │
 * │ File: merchant_bookings.py:L42 → list_merchant_bookings()
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (merchant_bookings.py:L42) =====
// export const fetchMerchantBookings = async (params?: {
//   status?: string; venue_id?: string; date_from?: string;
//   date_to?: string; page?: number; limit?: number;
// }): Promise<BookingListResponse> => {
//   const response = await apiClient.get('/merchant/bookings', { params });
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const fetchMerchantBookings = async (params?: {
  status?: string; venue_id?: string; date_from?: string;
  date_to?: string; page?: number; limit?: number;
}): Promise<BookingListResponse> => {
  let items = OWNER_BOOKING_REQUESTS.map(req => ({
    id: req.id, venue_id: 'ov-1', venue_name: req.venueName, venue_address: null,
    booking_date: req.date, start_time: req.time.split(' - ')[0],
    end_time: req.time.split(' - ')[1] || '', total_price: req.totalPrice,
    status: req.status as any, is_paid: false, is_cancelable: req.status === 'PENDING',
    created_at: new Date().toISOString(),
  }));

  if (params?.status) items = items.filter(b => b.status === params.status);

  return {
    items, total: items.length,
    page: params?.page || 1, limit: params?.limit || 20, pages: 1,
  };
};


/**
 * Chi tiết 1 booking (merchant view).
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: GET /merchant/bookings/{booking_id}             │
 * │ File: merchant_bookings.py:L97 → get_merchant_booking()
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (merchant_bookings.py:L97) =====
// export const fetchMerchantBookingById = async (bookingId: string): Promise<BookingResponse> => {
//   const response = await apiClient.get(`/merchant/bookings/${bookingId}`);
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const fetchMerchantBookingById = async (bookingId: string): Promise<BookingResponse | null> => {
  const req = OWNER_BOOKING_REQUESTS.find(r => r.id === bookingId);
  if (!req) return null;
  return {
    id: req.id, user_id: 'mock-customer-id', venue_id: 'ov-1',
    booking_date: req.date,
    total_price: req.totalPrice, status: req.status as any,
    is_paid: false, is_cancelable: req.status === 'PENDING',
    notes: null, cancelled_at: null, cancelled_by: null,
    created_at: new Date().toISOString(),
    venue_name: req.venueName, venue_address: null, services: [],
    slots: [],
  };
};


/**
 * Chủ sân duyệt booking.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: POST /merchant/bookings/{booking_id}/approve    │
 * │ File: merchant_bookings.py:L137 → approve_booking() │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (merchant_bookings.py:L137) =====
// export const approveBooking = async (
//   bookingId: string, data?: BookingApproveRejectRequest,
// ): Promise<BookingResponse> => {
//   const response = await apiClient.post(`/merchant/bookings/${bookingId}/approve`, data);
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const approveBooking = async (
  bookingId: string, data?: BookingApproveRejectRequest,
): Promise<BookingResponse> => {
  console.log('[MOCK] approveBooking:', bookingId, data);
  const existing = await fetchMerchantBookingById(bookingId);
  return { ...existing!, status: 'CONFIRMED', is_cancelable: true };
};


/**
 * Chủ sân từ chối booking.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: POST /merchant/bookings/{booking_id}/reject     │
 * │ File: merchant_bookings.py:L161 → reject_booking()  │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (merchant_bookings.py:L161) =====
// export const rejectBooking = async (
//   bookingId: string, data: BookingApproveRejectRequest,
// ): Promise<BookingResponse> => {
//   const response = await apiClient.post(`/merchant/bookings/${bookingId}/reject`, data);
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const rejectBooking = async (
  bookingId: string, data: BookingApproveRejectRequest,
): Promise<BookingResponse> => {
  console.log('[MOCK] rejectBooking:', bookingId, data);
  const existing = await fetchMerchantBookingById(bookingId);
  return { ...existing!, status: 'CANCELLED', is_cancelable: false };
};


/**
 * Chủ sân hủy booking.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: POST /merchant/bookings/{booking_id}/cancel     │
 * │ File: merchant_bookings.py:L186 → merchant_cancel_booking()
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (merchant_bookings.py:L186) =====
// export const merchantCancelBooking = async (
//   bookingId: string, data: BookingCancelRequest,
// ): Promise<BookingResponse> => {
//   const response = await apiClient.post(`/merchant/bookings/${bookingId}/cancel`, data);
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const merchantCancelBooking = async (
  bookingId: string, data: BookingCancelRequest,
): Promise<BookingResponse> => {
  console.log('[MOCK] merchantCancelBooking:', bookingId, data);
  const existing = await fetchMerchantBookingById(bookingId);
  return {
    ...existing!, status: 'CANCELLED', is_cancelable: false,
    cancelled_at: new Date().toISOString(), cancelled_by: 'MERCHANT',
  };
};


/**
 * Lấy bookings của 1 sân cụ thể (merchant view).
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: GET /merchant/bookings/venues/{venue_id}/bookings
 * │ File: merchant_bookings.py:L213 → get_venue_bookings()
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (merchant_bookings.py:L213) =====
// export const fetchVenueBookings = async (
//   venueId: string, params?: { booking_date?: string; status?: string },
// ): Promise<BookingListItem[]> => {
//   const response = await apiClient.get(`/merchant/bookings/venues/${venueId}/bookings`, { params });
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const fetchVenueBookings = async (
  venueId: string, params?: { booking_date?: string; status?: string },
): Promise<BookingListItem[]> => {
  console.log('[MOCK] fetchVenueBookings:', venueId, params);
  let items = OWNER_BOOKING_REQUESTS.map(req => ({
    id: req.id, venue_id: venueId, venue_name: req.venueName, venue_address: null,
    booking_date: req.date, start_time: req.time.split(' - ')[0],
    end_time: req.time.split(' - ')[1] || '', total_price: req.totalPrice,
    status: req.status as any, is_paid: false, is_cancelable: req.status === 'PENDING',
    created_at: new Date().toISOString(),
  }));
  if (params?.status) items = items.filter(b => b.status === params.status);
  if (params?.booking_date) items = items.filter(b => b.booking_date === params.booking_date);
  return items;
};



