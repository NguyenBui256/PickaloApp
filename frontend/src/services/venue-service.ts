/**
 * ============================================================
 * Venue Service — Gọi API Backend Venues
 * ============================================================
 *
 * Backend source: backend/app/api/v1/endpoints/venues.py
 * Router prefix: /venues (đăng ký tại api/v1/api.py:L26)
 *
 * Mỗi hàm có 2 phần:
 *   1. API thật (commented) → bỏ comment khi BE sẵn sàng
 *   2. Mock fallback (active) → xóa khi dùng API thật
 *
 * ════════════════════════════════════════════════════════════
 * GAP ANALYSIS — FE cần mà BE chưa có:
 * ════════════════════════════════════════════════════════════
 * 🔴 VenueType enum thiếu 'Pickleball' → cần thêm vào models/venue.py:L26
 * 🔴 Venue model thiếu field `phone` (SĐT liên hệ sân) → FE mock dùng, BE chưa có
 * 🔴 PUT  /venues/{id}/services/{serviceId} → cần bổ sung endpoint
 * 🔴 DELETE /venues/{id}/services/{serviceId} → cần bổ sung endpoint
 * 🔴 VenueService schema thiếu field `unit` (đơn vị: Chai/Lon/Cái/buổi)
 * 🟡 PATCH /venues/{id}/maintenance → ghim trạng thái bảo trì slots
 * 🟡 PUT/DELETE pricing slots → chưa có endpoint update/delete
 *
 * FE-only fields (derive, không cần BE trả):
 *   - `image` (single) → FE derive từ images[0]
 *   - `distance` → FE tự tính từ location + user GPS
 *   - `hours` → FE format từ operating_hours.open + operating_hours.close
 *   - `badges` → FE logic, không liên quan BE
 *   - `isFavorite` → cần API favorites hoặc lưu AsyncStorage
 * ════════════════════════════════════════════════════════════
 */

// @ts-ignore — apiClient sẽ dùng khi bỏ comment API thật
import { apiClient } from './api-client';
import { VENUES, OWNER_SERVICES } from '@constants/mock-data';
import type {
  VenueListResponse,
  VenueResponse,
  VenueCreateRequest,
  VenueUpdateRequest,
  VenueSearchParams,
  AvailabilityResponse,
  VenueServiceCreateRequest,
  VenueServiceResponse,
  PricingSlotCreateRequest,
  PricingSlotResponse,
} from '../types/api-types';

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

/**
 * Lấy danh sách sân (có filter).
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: GET /venues                                     │
 * │ File: venues.py:L48 → list_venues()                 │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (venues.py:L48) =====
// export const fetchVenues = async (params?: VenueSearchParams): Promise<VenueListResponse> => {
//   const response = await apiClient.get('/venues', { params });
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const fetchVenues = async (params?: VenueSearchParams): Promise<VenueListResponse> => {
  let filtered = [...VENUES];

  if (params?.district) {
    filtered = filtered.filter(v => v.district === params.district);
  }
  if (params?.venue_type) {
    filtered = filtered.filter(v => v.venue_type === params.venue_type);
  }

  return {
    items: filtered.map(v => ({
      id: v.id,
      name: v.name,
      district: v.district,
      address: v.address,
      fullAddress: v.fullAddress,
      venue_type: v.venue_type as any,
      location: { lat: v.lat, lng: v.lng },
      base_price_per_hour: v.base_price_per_hour,
      is_verified: v.is_verified,
      images: v.images,
      amenities: [],
      logo: v.logo,
      bookingLink: v.bookingLink,
      category: v.category,
      rating: v.rating,
    })),
    total: filtered.length,
    page: params?.page || 1,
    limit: params?.limit || 20,
    pages: 1,
  };
};


/**
 * Tìm sân gần vị trí hiện tại.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: GET /venues/search/nearby                       │
 * │ File: venues.py:L107 → search_nearby()              │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (venues.py:L107) =====
// export const searchVenuesNearby = async (params: {
//   lat: number; lng: number; radius?: number;
//   venue_type?: string; min_price?: number; max_price?: number;
//   page?: number; limit?: number;
// }): Promise<VenueListResponse> => {
//   const response = await apiClient.get('/venues/search/nearby', { params });
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const searchVenuesNearby = async (params: {
  lat: number;
  lng: number;
  radius?: number;
  page?: number;
  limit?: number;
}): Promise<VenueListResponse> => {
  console.log('[MOCK] searchVenuesNearby:', params);
  return fetchVenues({ page: params.page, limit: params.limit });
};


/**
 * Lấy chi tiết 1 sân.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: GET /venues/{venue_id}                          │
 * │ File: venues.py:L170 → get_venue()                  │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (venues.py:L170) =====
// export const fetchVenueById = async (venueId: string): Promise<VenueResponse> => {
//   const response = await apiClient.get(`/venues/${venueId}`);
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const fetchVenueById = async (venueId: string): Promise<VenueResponse | null> => {
  const venue = VENUES.find(v => v.id === venueId);
  if (!venue) return null;
  return {
    id: venue.id,
    merchant_id: 'mock-merchant-id',
    name: venue.name,
    address: venue.address,
    district: venue.district,
    description: null,
    fullAddress: venue.fullAddress,
    location: { lat: venue.lat, lng: venue.lng },
    venue_type: venue.venue_type as any,
    category: venue.category,
    logo: venue.logo,
    rating: venue.rating,
    bookingLink: venue.bookingLink,
    images: venue.images,
    operating_hours: venue.operating_hours,
    amenities: [],
    base_price_per_hour: venue.base_price_per_hour,
    is_active: true,
    is_verified: venue.is_verified,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};


/**
 * Kiểm tra slot trống của sân theo ngày.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: GET /venues/{venue_id}/availability?date=...    │
 * │ File: venues.py:L215 → get_venue_availability()     │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (venues.py:L215) =====
// export const fetchVenueAvailability = async (
//   venueId: string, date: string,
// ): Promise<AvailabilityResponse> => {
//   const response = await apiClient.get(`/venues/${venueId}/availability`, { params: { date } });
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const fetchVenueAvailability = async (
  venueId: string,
  date: string,
): Promise<AvailabilityResponse> => {
  console.log('[MOCK] fetchVenueAvailability:', venueId, date);
  const slots = [];
  for (let h = 5; h < 23; h++) {
    const start = `${h.toString().padStart(2, '0')}:00`;
    const end = `${(h + 1).toString().padStart(2, '0')}:00`;
    slots.push({ start_time: start, end_time: end, available: Math.random() > 0.2 });
  }
  return { venue_id: venueId, date, slots, open_time: '05:00', close_time: '23:00' };
};


/**
 * Danh sách quận/huyện.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: GET /venues/districts/list                      │
 * │ File: venues.py:L238 → list_districts()             │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (venues.py:L238) =====
// export const fetchDistrictsList = async (): Promise<{ districts: string[] }> => {
//   const response = await apiClient.get('/venues/districts/list');
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const fetchDistrictsList = async (): Promise<{ districts: string[] }> => {
  return {
    districts: [
      'Ba Đình', 'Hoàn Kiếm', 'Hai Bà Trưng', 'Đống Đa',
      'Tây Hồ', 'Cầu Giấy', 'Thanh Xuân', 'Hoàng Mai',
      'Long Biên', 'Hà Đông', 'Nam Từ Liêm', 'Bắc Từ Liêm',
    ],
  };
};


// ==========================================
// MERCHANT ENDPOINTS (Chủ sân)
// ==========================================

/**
 * Chủ sân tạo sân mới.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: POST /venues/merchant                           │
 * │ File: venues.py:L253 → create_venue()               │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (venues.py:L253) =====
// export const createVenue = async (data: VenueCreateRequest): Promise<VenueResponse> => {
//   const response = await apiClient.post('/venues/merchant', data);
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const createVenue = async (data: VenueCreateRequest): Promise<VenueResponse> => {
  console.log('[MOCK] createVenue:', data);
  return {
    id: `mock-${Date.now()}`, merchant_id: 'mock-merchant-id',
    name: data.name, address: data.address, district: data.district || null,
    description: data.description || null, fullAddress: data.address,
    location: data.coordinates, venue_type: data.venue_type,
    category: data.venue_type, logo: null, rating: null, bookingLink: null,
    images: data.images || null, operating_hours: data.operating_hours || null,
    amenities: data.amenities || null, base_price_per_hour: data.base_price_per_hour,
    is_active: true, is_verified: false,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  };
};


/**
 * Chủ sân cập nhật sân.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: PUT /venues/merchant/{venue_id}                 │
 * │ File: venues.py:L307 → update_venue()               │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (venues.py:L307) =====
// export const updateVenue = async (venueId: string, data: VenueUpdateRequest): Promise<VenueResponse> => {
//   const response = await apiClient.put(`/venues/merchant/${venueId}`, data);
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const updateVenue = async (venueId: string, data: VenueUpdateRequest): Promise<VenueResponse> => {
  console.log('[MOCK] updateVenue:', venueId, data);
  const existing = await fetchVenueById(venueId);
  return { ...existing!, ...data, updated_at: new Date().toISOString() } as VenueResponse;
};


/**
 * Chủ sân ngừng hoạt động sân (soft delete).
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: DELETE /venues/merchant/{venue_id}               │
 * │ File: venues.py:L358 → deactivate_venue()           │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (venues.py:L358) =====
// export const deactivateVenue = async (venueId: string): Promise<void> => {
//   await apiClient.delete(`/venues/merchant/${venueId}`);
// };

// ===== MOCK FALLBACK =====
export const deactivateVenue = async (venueId: string): Promise<void> => {
  console.log('[MOCK] deactivateVenue:', venueId);
};


// ==========================================
// VENUE SERVICES (Dịch vụ sân)
// ==========================================

/**
 * Lấy danh sách dịch vụ của sân.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: GET /venues/{venue_id}/services                 │
 * │ File: venues.py:L384 → list_venue_services()        │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (venues.py:L384) =====
// export const fetchVenueServices = async (venueId: string): Promise<VenueServiceResponse[]> => {
//   const response = await apiClient.get(`/venues/${venueId}/services`);
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const fetchVenueServices = async (venueId: string): Promise<VenueServiceResponse[]> => {
  console.log('[MOCK] fetchVenueServices:', venueId);
  return OWNER_SERVICES.map(s => ({
    id: s.id, venue_id: venueId, name: s.name, description: null,
    price_per_unit: s.price, is_available: true, created_at: new Date().toISOString(),
  }));
};


/**
 * Thêm dịch vụ cho sân.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: POST /venues/{venue_id}/services                │
 * │ File: venues.py:L411 → create_venue_service()       │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (venues.py:L411) =====
// export const createVenueService = async (
//   venueId: string, data: VenueServiceCreateRequest,
// ): Promise<VenueServiceResponse> => {
//   const response = await apiClient.post(`/venues/${venueId}/services`, data);
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const createVenueService = async (
  venueId: string, data: VenueServiceCreateRequest,
): Promise<VenueServiceResponse> => {
  console.log('[MOCK] createVenueService:', venueId, data);
  return {
    id: `mock-svc-${Date.now()}`, venue_id: venueId, name: data.name,
    description: data.description || null, price_per_unit: data.price_per_unit,
    is_available: true, created_at: new Date().toISOString(),
  };
};


/**
 * Cập nhật dịch vụ.
 * ┌─────────────────────────────────────────────────────┐
 * │ ⚠️ BE CHƯA CÓ endpoint PUT /venues/{id}/services/{serviceId}
 * │ Cần bổ sung backend để hỗ trợ cập nhật dịch vụ.    │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (⚠️ CHƯA CÓ BE — cần tạo endpoint) =====
// export const updateVenueService = async (
//   venueId: string, serviceId: string, data: Partial<VenueServiceCreateRequest>,
// ): Promise<VenueServiceResponse> => {
//   const response = await apiClient.put(`/venues/${venueId}/services/${serviceId}`, data);
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const updateVenueService = async (
  venueId: string, serviceId: string, data: Partial<VenueServiceCreateRequest>,
): Promise<VenueServiceResponse> => {
  console.log('[MOCK] updateVenueService:', venueId, serviceId, data);
  return {
    id: serviceId, venue_id: venueId, name: data.name || 'Updated Service',
    description: data.description || null, price_per_unit: data.price_per_unit || 0,
    is_available: true, created_at: new Date().toISOString(),
  };
};


/**
 * Xóa dịch vụ.
 * ┌─────────────────────────────────────────────────────┐
 * │ ⚠️ BE CHƯA CÓ endpoint DELETE /venues/{id}/services/{serviceId}
 * │ Cần bổ sung backend.                                │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (⚠️ CHƯA CÓ BE — cần tạo endpoint) =====
// export const deleteVenueService = async (venueId: string, serviceId: string): Promise<void> => {
//   await apiClient.delete(`/venues/${venueId}/services/${serviceId}`);
// };

// ===== MOCK FALLBACK =====
export const deleteVenueService = async (venueId: string, serviceId: string): Promise<void> => {
  console.log('[MOCK] deleteVenueService:', venueId, serviceId);
};


// ==========================================
// PRICING SLOTS (Bảng giá)
// ==========================================

/**
 * Lấy bảng giá theo ngày/giờ.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: GET /venues/{venue_id}/pricing                  │
 * │ File: venues.py:L443 → list_pricing_slots()         │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (venues.py:L443) =====
// export const fetchPricingSlots = async (venueId: string): Promise<PricingSlotResponse[]> => {
//   const response = await apiClient.get(`/venues/${venueId}/pricing`);
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const fetchPricingSlots = async (venueId: string): Promise<PricingSlotResponse[]> => {
  console.log('[MOCK] fetchPricingSlots:', venueId);
  return [
    { id: 1, venue_id: venueId, day_type: 'WEEKDAY', start_time: '05:00', end_time: '17:00', price_factor: 1.0 },
    { id: 2, venue_id: venueId, day_type: 'WEEKDAY', start_time: '17:00', end_time: '23:00', price_factor: 1.5 },
    { id: 3, venue_id: venueId, day_type: 'WEEKEND', start_time: '05:00', end_time: '23:00', price_factor: 1.3 },
  ];
};


/**
 * Chủ sân thêm pricing slot.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: POST /venues/{venue_id}/pricing                 │
 * │ File: venues.py:L469 → create_pricing_slot()        │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (venues.py:L469) =====
// export const createPricingSlot = async (
//   venueId: string, data: PricingSlotCreateRequest,
// ): Promise<PricingSlotResponse> => {
//   const response = await apiClient.post(`/venues/${venueId}/pricing`, data);
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const createPricingSlot = async (
  venueId: string, data: PricingSlotCreateRequest,
): Promise<PricingSlotResponse> => {
  console.log('[MOCK] createPricingSlot:', venueId, data);
  return {
    id: Date.now(), venue_id: venueId, day_type: data.day_type,
    start_time: data.start_time, end_time: data.end_time,
    price_factor: data.price_factor || 1.0,
  };
};


/**
 * Admin duyệt sân.
 * ┌─────────────────────────────────────────────────────┐
 * │ BE: POST /venues/{venue_id}/verify                  │
 * │ File: venues.py:L503 → verify_venue()               │
 * │ (Chỉ ADMIN mới gọi được)                           │
 * └─────────────────────────────────────────────────────┘
 */
// ===== API THẬT (venues.py:L503) =====
// export const verifyVenue = async (venueId: string): Promise<{ message: string }> => {
//   const response = await apiClient.post(`/venues/${venueId}/verify`);
//   return response.data;
// };

// ===== MOCK FALLBACK =====
export const verifyVenue = async (venueId: string): Promise<{ message: string }> => {
  console.log('[MOCK] verifyVenue:', venueId);
  return { message: 'Venue verified successfully' };
};
