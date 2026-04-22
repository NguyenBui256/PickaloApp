/**
 * ============================================================
 * Booking Service — Gọi API Backend Bookings (User side)
 * ============================================================
 *
 * Backend source: backend/app/api/v1/endpoints/bookings.py
 * Router prefix: /bookings (đăng ký tại api/v1/api.py:L27)
 *
 * Mỗi hàm có 2 phần:
 *   1. API thật (commented) → bỏ comment khi BE sẵn sàng
 *   2. Mock fallback (active) → xóa khi dùng API thật
 */

// @ts-ignore — apiClient sẽ dùng khi bỏ comment API thật
import { apiClient } from './api-client';
import { MOCK_BOOKINGS } from '@constants/mock-data';
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

/**
 * Tính giá booking trước khi xác nhận.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: POST /bookings/price-calculation                │
 * │ File: bookings.py:L36 → calculate_booking_price()   │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (bookings.py:L36) =====
// export const calculateBookingPrice = async (
//   data: BookingPricePreviewRequest,
// ): Promise<BookingPriceResponse> => {
//   const response = await apiClient.post('/bookings/price-calculation', data);
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const calculateBookingPrice = async (
  data: BookingPricePreviewRequest,
): Promise<BookingPriceResponse> => {
  console.log('[MOCK] calculateBookingPrice:', data);

  let totalHours = 0;
  data.slots.forEach(slot => {
    const startH = parseInt(slot.start_time.split(':')[0]);
    const endH = parseInt(slot.end_time.split(':')[0]);
    totalHours += (endH - startH);
  });

  const basePrice = 150000;
  const subtotal = basePrice * totalHours;
  const serviceFee = Math.round(subtotal * 0.05);

  return {
    venue_pricing: { base_price: basePrice, duration_hours: totalHours, price_factor: 1.0, hourly_price: basePrice },
    services: [], services_total: 0,
    subtotal, service_fee: serviceFee,
    total: subtotal + serviceFee, currency: 'VND',
  };
};


/**
 * Tạo booking mới. Status ban đầu = PENDING, chờ merchant duyệt.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: POST /bookings                                  │
 * │ File: bookings.py:L69 → create_booking()            │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (bookings.py:L69) =====
// export const createBooking = async (data: BookingCreateRequest): Promise<BookingResponse> => {
//   const response = await apiClient.post('/bookings', data);
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const createBooking = async (data: BookingCreateRequest): Promise<BookingResponse> => {
  console.log('[MOCK] createBooking:', data);

  let totalMinutes = 0;
  const slotsResponse = data.slots.map((slot, idx) => {
    const startH = parseInt(slot.start_time.split(':')[0]);
    const endH = parseInt(slot.end_time.split(':')[0]);
    const duration = (endH - startH) * 60;
    totalMinutes += duration;

    return {
      id: `slot-${idx}`,
      court_id: slot.court_id,
      court_name: `Sân con ${idx + 1}`,
      start_time: slot.start_time,
      end_time: slot.end_time,
      price: (endH - startH) * 150000,
    };
  });

  const subtotal = (totalMinutes / 60) * 150000;
  const serviceFee = Math.round(subtotal * 0.05);

  return {
    id: `mock-booking-${Date.now()}`, user_id: 'mock-user-id', venue_id: data.venue_id,
    booking_date: data.booking_date, total_price: subtotal + serviceFee,
    status: 'PENDING', is_paid: false, is_cancelable: true,
    notes: data.notes || null,
    cancelled_at: null, cancelled_by: null,
    created_at: new Date().toISOString(),
    venue_name: 'Mock Venue',
    services: [],
    slots: slotsResponse,
  };
};


/**
 * Lấy danh sách bookings của user hiện tại.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: GET /bookings                                   │
 * │ File: bookings.py:L134 → list_my_bookings()         │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (bookings.py:L134) =====
// export const fetchMyBookings = async (
//   filters?: BookingListFilters,
// ): Promise<BookingListResponse> => {
//   const response = await apiClient.get('/bookings', { params: filters });
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const fetchMyBookings = async (
  filters?: BookingListFilters,
): Promise<BookingListResponse> => {
  let items = MOCK_BOOKINGS.map(b => ({
    id: b.id,
    venue_id: b.venue_id || '',
    venue_name: b.venue_name,
    venue_address: b.venue_address,
    booking_date: b.booking_date || '',
    start_time: b.start_time || '',
    end_time: b.end_time || '',
    total_price: typeof b.total_price === 'number' ? b.total_price : 0,
    status: _normalizeBookingStatus(b.status),
    is_paid: b.is_paid ?? false,
    is_cancelable: b.is_cancelable ?? false,
    created_at: b.created_at || new Date().toISOString(),
  }));

  if (filters?.status) {
    items = items.filter(b => b.status === filters.status);
  }

  return {
    items, total: items.length,
    page: filters?.page || 1, limit: filters?.limit || 20, pages: 1,
  };
};


/**
 * Lấy chi tiết 1 booking.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: GET /bookings/{booking_id}                      │
 * │ File: bookings.py:L186 → get_booking()              │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (bookings.py:L186) =====
// export const fetchBookingById = async (bookingId: string): Promise<BookingResponse> => {
//   const response = await apiClient.get(`/bookings/${bookingId}`);
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const fetchBookingById = async (bookingId: string): Promise<BookingResponse | null> => {
  const booking = MOCK_BOOKINGS.find(b => b.id === bookingId);
  if (!booking) return null;

  return {
    id: booking.id, user_id: 'mock-user-id', venue_id: booking.venue_id || '',
    booking_date: booking.booking_date || '',
    total_price: typeof booking.total_price === 'number' ? booking.total_price : 0,
    status: _normalizeBookingStatus(booking.status),
    is_paid: booking.is_paid ?? false, is_cancelable: booking.is_cancelable ?? false,
    notes: null,
    cancelled_at: null, cancelled_by: null,
    created_at: booking.created_at || new Date().toISOString(),
    venue_name: booking.venue_name,
    venue_address: booking.venue_address,
    services: [],
    slots: [],
  };
};


/**
 * Hủy booking.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: POST /bookings/{booking_id}/cancel              │
 * │ File: bookings.py:L225 → cancel_booking()           │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (bookings.py:L225) =====
// export const cancelBooking = async (
//   bookingId: string, data?: BookingCancelRequest,
// ): Promise<BookingResponse> => {
//   const response = await apiClient.post(`/bookings/${bookingId}/cancel`, data);
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const cancelBooking = async (
  bookingId: string, data?: BookingCancelRequest,
): Promise<BookingResponse> => {
  console.log('[MOCK] cancelBooking:', bookingId, data);
  const existing = await fetchBookingById(bookingId);
  return {
    ...existing!, status: 'CANCELLED', is_cancelable: false,
    cancelled_at: new Date().toISOString(), cancelled_by: 'USER',
  };
};





// ==========================================
// HELPER
// ==========================================
function _normalizeBookingStatus(status: string): 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED' {
  const map: Record<string, any> = {
    pending: 'PENDING', success: 'CONFIRMED', canceled: 'CANCELLED', cancelled: 'CANCELLED',
    completed: 'COMPLETED', expired: 'EXPIRED',
    PENDING: 'PENDING', CONFIRMED: 'CONFIRMED', CANCELLED: 'CANCELLED',
    COMPLETED: 'COMPLETED', EXPIRED: 'EXPIRED',
  };
  return map[status] || 'PENDING';
}
