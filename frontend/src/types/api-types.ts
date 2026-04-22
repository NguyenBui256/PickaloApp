/**
 * ============================================================
 * TypeScript Interfaces khớp 1:1 với Backend Pydantic Schemas
 * ============================================================
 * 
 * File này chứa tất cả types được map từ Backend schemas.
 * Khi Backend thay đổi schema, cập nhật file này cho đồng bộ.
 * 
 * Backend source files:
 *   - app/schemas/venue.py
 *   - app/schemas/booking.py
 *   - app/schemas/auth.py
 *   - app/schemas/user.py
 *   - app/models/venue.py   (Enums)
 *   - app/models/booking.py (Enums)
 */

// ==========================================
// ENUMS (từ Backend models)
// ==========================================

/** Backend: app/models/venue.py → VenueType
 * ⚠️ BE THIẾU 'Pickleball' — cần thêm PICKLEBALL = "Pickleball" vào venue.py:L26
 */
export type VenueType =
  | 'Pickleball'     // ⚠️ CHƯA CÓ trong BE enum — cần bổ sung
  | 'Football 5'
  | 'Football 7'
  | 'Tennis'
  | 'Badminton'
  | 'Basketball'
  | 'Volleyball'
  | 'Swimming'
  | 'Table Tennis';

/** Backend: app/models/venue.py → DayType */
export type DayType = 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY';

/** Backend: app/models/booking.py → BookingStatus */
export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'EXPIRED';

/** Backend: app/models/user.py → UserRole */
export type UserRole = 'USER' | 'MERCHANT' | 'ADMIN';

// ==========================================
// COMMON SCHEMAS
// ==========================================

/** API Error Response structure */
export interface ApiError {
  detail: string;
  status?: number;
  code?: string;
}

/** Backend: app/schemas/venue.py → Coordinates */
export interface Coordinates {
  lat: number;
  lng: number;
}

/** Backend: app/schemas/venue.py → OperatingHours */
export interface OperatingHours {
  open: string; // HH:MM
  close: string; // HH:MM
}

// ==========================================
// VENUE SCHEMAS (app/schemas/venue.py)
// ==========================================

/** Backend: VenueCreate — POST /venues/merchant */
export interface VenueCreateRequest {
  name: string;
  address: string;
  district?: string | null;
  description?: string | null;
  coordinates: Coordinates;
  venue_type: VenueType;
  images?: string[] | null;
  operating_hours?: OperatingHours | null;
  amenities?: string[] | null;
  base_price_per_hour: number;
}

/** Backend: VenueUpdate — PUT /venues/merchant/{id} */
export interface VenueUpdateRequest {
  name?: string | null;
  address?: string | null;
  district?: string | null;
  coordinates?: Coordinates | null;
  description?: string | null;
  images?: string[] | null;
  operating_hours?: OperatingHours | null;
  amenities?: string[] | null;
  base_price_per_hour?: number | null;
  is_active?: boolean | null;
}

/** Backend: VenueResponse — GET /venues/{id}, POST /venues/merchant */
export interface VenueResponse {
  id: string;
  merchant_id: string;
  name: string;
  address: string;
  district?: string | null;
  description?: string | null;
  fullAddress?: string | null;
  location: Coordinates;
  venue_type: VenueType;
  category?: string | null;
  logo?: string | null;
  rating?: number | null;
  bookingLink?: string | null;
  images?: string[] | null;
  operating_hours?: OperatingHours | null;
  amenities?: string[] | null;
  base_price_per_hour: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

/** Backend: VenueListItem — item trong VenueListResponse */
export interface VenueListItem {
  id: string;
  name: string;
  district?: string | null;
  address?: string | null;
  fullAddress?: string | null;
  venue_type: VenueType;
  location: Coordinates;
  base_price_per_hour: number;
  is_verified: boolean;
  images?: string[] | null;
  amenities?: string[] | null;
  logo?: string | null;
  bookingLink?: string | null;
  category?: string | null;
  rating?: number | null;
}

/** Backend: VenueListResponse — GET /venues, GET /venues/search/nearby */
export interface VenueListResponse {
  items: VenueListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Backend: VenueSearchParams — Query params cho tìm kiếm */
export interface VenueSearchParams {
  district?: string;
  venue_type?: VenueType;
  lat?: number;
  lng?: number;
  radius?: number; // meters, 100-50000
  min_price?: number;
  max_price?: number;
  has_parking?: boolean;
  has_lights?: boolean;
  page?: number;
  limit?: number;
}

/** Backend: VenueServiceCreate — POST /venues/{id}/services */
export interface VenueServiceCreateRequest {
  name: string;
  description?: string | null;
  price_per_unit: number;
}

/** Backend: VenueServiceUpdate — (Chưa có PUT endpoint, cần bổ sung BE) */
export interface VenueServiceUpdateRequest {
  name?: string | null;
  description?: string | null;
  price_per_unit?: number | null;
  is_available?: boolean | null;
}

/** Backend: VenueServiceResponse — GET/POST /venues/{id}/services */
export interface VenueServiceResponse {
  id: string;
  venue_id: string;
  name: string;
  description: string | null;
  price_per_unit: number;
  is_available: boolean;
  created_at: string;
}

/** Backend: PricingSlotCreate — POST /venues/{id}/pricing */
export interface PricingSlotCreateRequest {
  day_type: DayType;
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  price_factor?: number; // 0.1 - 3.0, default 1.0
}

/** Backend: PricingSlotResponse — GET/POST /venues/{id}/pricing */
export interface PricingSlotResponse {
  id: number;
  venue_id: string;
  day_type: DayType;
  start_time: string;
  end_time: string;
  price_factor: number;
}

/** Backend: TimeSlot (venue availability) — trong AvailabilityResponse */
export interface VenueTimeSlot {
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  available: boolean;
}

/** Backend: CourtAvailability — lịch trống của một sân con */
export interface CourtAvailability {
  court_id: string;
  court_name: string;
  slots: VenueTimeSlot[];
}

/** Backend: AvailabilityResponse — GET /venues/{id}/availability */
export interface AvailabilityResponse {
  venue_id: string;
  date: string;
  courts: CourtAvailability[];
  open_time: string;
  close_time: string;
}

// ==========================================
// BOOKING SCHEMAS (app/schemas/booking.py)
// ==========================================

/** Backend: BookingServiceRequest — dịch vụ kèm theo booking */
export interface BookingServiceRequest {
  service_id: string;
  quantity: number; // 1-100
}

/** Backend: BookingSlotInfo — thông tin sân con và giờ đặt */
export interface BookingSlotInfo {
  court_id: string;
  start_time: string;
  end_time: string;
}

/** Backend: BookingCreate — POST /bookings */
export interface BookingCreateRequest {
  venue_id: string;
  booking_date: string; // YYYY-MM-DD
  slots: BookingSlotInfo[];
  services?: BookingServiceRequest[] | null;
  notes?: string | null; // max 1000 chars
}

/** Backend: BookingPricePreview — POST /bookings/price-calculation */
export interface BookingPricePreviewRequest {
  venue_id: string;
  booking_date: string;
  slots: BookingSlotInfo[];
  services?: BookingServiceRequest[] | null;
}

/** Backend: PriceBreakdown — phần chi tiết giá */
export interface PriceBreakdown {
  base_price: number;
  duration_hours: number;
  price_factor: number;
  hourly_price: number;
}

export interface BookingSlotResponse {
  id: string;
  court_id: string;
  court_name: string;
  start_time: string;
  end_time: string;
  price: number;
}

/** Backend: BookingServiceItem — dịch vụ trong response booking */
export interface BookingServiceItem {
  service_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

/** Backend: BookingPriceResponse — POST /bookings/price-calculation */
export interface BookingPriceResponse {
  venue_pricing: PriceBreakdown;
  services: BookingServiceItem[];
  services_total: number;
  subtotal: number;
  service_fee: number;
  total: number;
  currency: string; // "VND"
}

/** Backend: BookingResponse — GET /bookings/{id} hoặc POST /bookings */
export interface BookingResponse {
  id: string;
  user_id: string;
  venue_id: string;
  booking_date: string;
  total_price: number;
  status: BookingStatus;
  is_paid: boolean;
  is_cancelable: boolean;
  notes: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  created_at: string;
  venue_name?: string | null;
  venue_address?: string | null;
  services: BookingServiceItem[];
  slots: BookingSlotResponse[];
}

/** Backend: BookingListItem — item trong BookingListResponse */
export interface BookingListItem {
  id: string;
  venue_id: string;
  venue_name: string | null;
  venue_address: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: BookingStatus;
  is_paid: boolean;
  is_cancelable: boolean;
  created_at: string;
}

/** Backend: BookingListResponse — GET /bookings */
export interface BookingListResponse {
  items: BookingListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Backend: BookingCancel — POST /bookings/{id}/cancel */
export interface BookingCancelRequest {
  reason?: string | null; // max 500 chars
}

/** Backend: BookingApproveReject — POST /merchant/bookings/{id}/approve|reject */
export interface BookingApproveRejectRequest {
  reason?: string | null;
}

/** Backend: BookingListFilters — Query params cho lọc bookings */
export interface BookingListFilters {
  status?: BookingStatus;
  date_from?: string; // YYYY-MM-DD
  date_to?: string;   // YYYY-MM-DD
  venue_id?: string;
  page?: number;
  limit?: number;
}

/** Backend: TimeSlot (booking timeline) — trong BookingTimelineResponse */
export interface BookingTimeSlot {
  hour: number; // 5-23
  available: boolean;
  booking_id?: string | null;
  status?: string | null; // "PENDING" | "CONFIRMED"
}

/** Backend: BookingTimelineResponse — GET /bookings/venues/{id}/timeline */
export interface BookingTimelineResponse {
  venue_id: string;
  date: string;
  open_time: string; // HH:MM
  close_time: string;
  slots: BookingTimeSlot[];
}

/** Backend: MerchantVenueStats — item trong MerchantStatsResponse */
export interface MerchantVenueStats {
  id: string;
  name: string;
  status: string;
  total_bookings: number;
  revenue_mtd: number;
  rating: number;
}

/** Backend: MerchantStatsResponse — GET /merchant/bookings/stats */
export interface MerchantStatsResponse {
  venues: MerchantVenueStats[];
  currency: string;
}

// ==========================================
// AUTH SCHEMAS (app/schemas/auth.py)
// ==========================================

/** Backend: LoginRequest — POST /auth/login */
export interface LoginRequest {
  phone: string;    // +84xxxxxxxxx
  password: string;
}

/** Backend: RegisterRequest — POST /auth/register */
export interface RegisterRequest {
  phone: string;
  password: string; // 8-16 chars, uppercase + lowercase + digit
  full_name: string;
  email?: string | null;
  role?: UserRole;  // default: USER
}

/** Backend: RefreshTokenRequest — POST /auth/refresh, POST /auth/logout */
export interface RefreshTokenRequest {
  refresh_token: string;
}

/** Backend: TokenResponse — POST /auth/refresh */
export interface TokenResponse {
  access_token: string;
  token_type: string; // "Bearer"
  expires_in: number; // seconds
}

/** Backend: AuthResponse — POST /auth/login, POST /auth/register */
export interface AuthResponse extends TokenResponse {
  refresh_token: string;
  user: UserResponse;
}

/** Backend: VerifyPhoneRequest — POST /auth/verify-phone */
export interface VerifyPhoneRequest {
  phone: string;
  otp: string; // 6 digits
}

/** Backend: ChangePasswordRequest — POST /auth/me/change-password */
export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

// ==========================================
// USER SCHEMAS (app/schemas/user.py)
// ==========================================

/** Backend: UserResponse — GET /auth/me, login/register response */
export interface UserResponse {
  id: string;
  phone: string;
  full_name: string;
  email?: string | null;
  avatar_url?: string | null;
  date_of_birth?: string | null; // YYYY-MM-DD
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
}

/** Backend: UserProfileResponse — GET /users/me */
export interface UserProfileResponse extends UserResponse {
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/** Backend: UserUpdate — PATCH /auth/me */
export interface UserUpdateRequest {
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  date_of_birth?: string | null;
}
