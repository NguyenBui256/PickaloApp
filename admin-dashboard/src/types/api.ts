// API Types matching backend schemas

export interface DashboardMetrics {
  total_users: number
  total_merchants: number
  total_venues: number
  total_bookings: number
  active_users: number
  verified_venues: number
  pending_verifications: number
  total_revenue: number | null
}

export interface User {
  id: string
  phone: string
  full_name: string
  email: string | null
  role: 'USER' | 'MERCHANT' | 'ADMIN'
  is_active: boolean
  is_verified: boolean
  created_at: string
  venues_count: number
  bookings_count: number
}

export interface UserListResponse {
  users: User[]
  total: number
  page: number
  limit: number
}

export interface Venue {
  id: string
  name: string
  merchant_id: string
  merchant_name: string
  address: string
  is_verified: boolean
  is_active: boolean
  created_at: string
  bookings_count: number
}

export interface VenueListResponse {
  venues: Venue[]
  total: number
  page: number
  limit: number
}

export interface Booking {
  id: string
  user_id: string
  user_name: string
  venue_id: string
  venue_name: string
  booking_date: string
  start_time: string
  end_time: string
  total_price: number
  status: string
  created_at: string
}

export interface BookingListResponse {
  bookings: Booking[]
  total: number
  page: number
  limit: number
}

export interface Post {
  id: string
  author_id: string
  author_name: string
  content: string
  post_type: string
  status: string
  created_at: string
  comments_count: number
}

export interface PostListResponse {
  posts: Post[]
  total: number
  page: number
  limit: number
}

export interface AuditLogItem {
  id: string
  admin_id: string
  admin_name: string
  action_type: string
  target_type: string | null
  target_id: string | null
  reason: string | null
  created_at: string
}

export interface AuditLogResponse {
  actions: AuditLogItem[]
  total: number
  page: number
  limit: number
}

export interface LoginRequest {
  phone: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: User
}
