// ==========================================
// MOCK DATA BASED ON BACKEND API SCHEMAS
// ==========================================

// Chưa có API danh sách Categories riêng (Backend hiện tại sử dụng enum VenueType)
export const CATEGORIES = [
  { id: '1', name: 'Pickleball', icon: 'tennis-ball' as const },
  { id: '2', name: 'Cầu lông', icon: 'badminton' as const },
  { id: '3', name: 'Bóng đá', icon: 'soccer' as const },
  { id: '4', name: 'Tennis', icon: 'tennis' as const },
  { id: '5', name: 'B.Chuyền', icon: 'volleyball' as const },
  { id: '6', name: 'Bóng rổ', icon: 'basketball' as const },
];

// Map với Schema: VenueListItem
// Các properties backend trả về: id, name, district, venue_type, location (lat/lng), base_price_per_hour, is_verified, images, amenities, rating
// Các properties frontend cần thêm/xử lý: logo, distance, hours, badges, isFavorite, bookingLink, category, fullAddress, phone
export const VENUES = [
  {
    id: '1',
    name: 'LVK Pickleball Club',
    district: 'Hà Đông', // Từ backend (VenueListItem)
    address: 'Sân Pickleball LVK, Hà Đông, Hà Nội',
    distance: '0.8 km', // Front end tự tính toán theo location
    images: ['https://images.unsplash.com/photo-1626224580174-3239b6267317?w=800'], // Từ backend
    image: 'https://images.unsplash.com/photo-1626224580174-3239b6267317?w=800', // FE field (fallback)
    logo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100', // FE field
    hours: '06:00 - 22:00', // Frontend field
    operating_hours: { open: '06:00', close: '22:00' }, // Backend dict
    badges: ['Đơn ngày', 'Sự kiện'], // Chưa có API trả về badges
    isFavorite: false, // Chưa có API (lưu offline hoặc chưa implement)
    fullAddress: 'Vườn hoa trung tâm Làng Việt Kiều Châu Âu, Phường Hà Đông, Hà Nội (SÂN NGOÀI TRỜI)', // FE field
    phone: '0987.654.321', // Chờ update model backend
    bookingLink: 'https://datlich.alobo.vn/san/sport_lvk_pickleball_club',
    category: 'Pickleball', // Map với venue_type Backend
    venue_type: 'Pickleball', // Backend Enum
    rating: 0, // Backend là float
    is_verified: true, // Backend boolean
    base_price_per_hour: 150000, // Backend Decimal
    lat: 20.9845,   // Backend từ location (Coordinates schema)
    lng: 105.7925,
  },
  {
    id: '2',
    name: 'Clb Pickleballs Cung Văn Quán',
    district: 'Hà Đông',
    address: 'Văn Quán, Hà Đông, Hà Nội',
    distance: '1.2 km',
    images: ['https://images.unsplash.com/photo-1599586120429-48281b6f0ece?w=800'],
    image: 'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?w=800',
    logo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100',
    hours: '05:30 - 23:00',
    operating_hours: { open: '05:30', close: '23:00' },
    badges: ['Đơn ngày'],
    isFavorite: true,
    fullAddress: 'Khu đô thị Văn Quán, Hà Đông, Hà Nội',
    phone: '0123.456.789',
    bookingLink: 'https://datlich.alobo.vn/san/van_quan_pickleball',
    category: 'Pickleball',
    venue_type: 'Pickleball',
    rating: 4.5,
    is_verified: false,
    base_price_per_hour: 100000,
    lat: 20.9785,
    lng: 105.7885,
  },
];

// Chưa có API filters
export const QUICK_FILTERS = [
  'Cầu lông gần tôi',
  'Pickleball gần tôi',
  'Xé vé gần tôi',
];

// Chưa có API filters
export const EXPLORE_FILTERS = [
  'Tất cả',
  'Gói hội viên',
  'Thông báo',
  'Ưu đãi',
];

// Chưa có API Memberships/Packages riêng hiện hành trong BE, đang mượn VenueServices
export const MEMBERSHIPS = [
  {
    id: '1',
    title: 'Chương trình combo vé sự kiện DUPR',
    packageName: 'Gói 10 vé - 1 tháng',
    duration: '1 Tháng',
    freeTickets: '10',
    courtType: 'Pickleball',
    price: '900.000 đ',
    badgeNumber: 1,
  },
  {
    id: '2',
    title: 'Gói ưu đãi thành viên mới',
    packageName: 'Gói 5 vé - 15 ngày',
    duration: '15 Ngày',
    freeTickets: '5',
    courtType: 'Pickleball',
    price: '450.000 đ',
    badgeNumber: 2,
  },
];

// Chưa có API Highlights/Banners
export const HIGHLIGHT_BANNERS = [
  {
    id: '1',
    type: 'swin',
    title: 'SWIN PICKLEBALL',
    location: 'Hà Nội - Mỹ Đình',
    price: '100K/giờ',
    image: 'https://images.unsplash.com/photo-1626224580174-3239b6267317?w=800',
    logo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
  },
  {
    id: '2',
    type: 'swin',
    title: 'SWIN PICKLEBALL',
    location: 'Quận 10 - TP.HCM',
    price: '135K/giờ',
    image: 'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?w=800',
    logo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
  },
  {
    id: '3',
    type: 'coco',
    title: 'NĂM MỚI SÂN MỚI',
    subtitle: 'COCO PICKLECLUB',
    price: 'Chỉ từ 140K',
    image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800',
  },
  {
    id: '4',
    type: 'university',
    title: 'THÀNH ĐÔNG IVINCI',
    subtitle: 'Sân tập chuẩn quốc tế',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
  },
];

// Trong Backend, chia court không là 1 model tĩnh ở model venue (không có field courts, Venue thay cho Sân)
export const BOOKING_COURTS = [
  'Pickleball 1',
  'Pickleball 2',
  'Pickleball 3',
  'Pickleball 4',
  'Pickleball 5',
  'Pickleball 6',
];


// Backend dùng AvailabilityResponse & BookingTimelineResponse
export const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    const h = hour < 10 ? `0${hour}` : `${hour}`;
    slots.push(`${h}:00`);
    slots.push(`${h}:30`);
  }
  slots.push('24:00');
  return slots;
};

export const TIME_SLOTS = generateTimeSlots();

// ==========================================
// CÓ API ĐÃ ĐỊNH NGHĨA BookingTimelineResponse nhưng THIẾU API THIẾT LẬP BẢO TRÌ (OWNER)
// Theo backend BookingTimelineResponse -> có slots (array TimeSlot {hour, available, status})
// Với Owner, cần thêm endpoint PATCH/PUT để ghim trạng thái "maintenance" cho 1 loạt slot.
// ==========================================
export const MOCK_AVAILABILITY: Record<string, string> = {};
BOOKING_COURTS.forEach(court => {
  TIME_SLOTS.forEach(slot => {
    const rand = Math.random();
    let status = 'available'; // backend "available" (available=true)
    if (rand < 0.1) status = 'booked'; // backend status = "CONFIRMED"
    else if (rand < 0.15) status = 'locked';
    else if (rand < 0.18) status = 'event';
    MOCK_AVAILABILITY[`${court}-${slot}`] = status;
  });
});

// Chưa có API GET payment gateway/settings của từng merchant hay hệ thống
export const BANK_DETAILS = {
  bankName: 'MB BANK',
  accountHolder: 'NGUYEN VAN A',
  accountNumber: '1234567890',
  qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ALOBO-PAYMENT',
};

// Map với Schema: BookingListItem / BookingResponse
// ⚠️ Chỉ dùng fields từ BE schema. Legacy fields đã xoá.
export interface Booking {
  // --- Backend BookingListItem fields ---
  id: string;
  venue_id: string;
  venue_name: string;
  venue_address: string;
  booking_date: string;   // YYYY-MM-DD (ISO)
  start_time: string;     // HH:MM
  end_time: string;       // HH:MM
  total_price: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED'; // BE enum chuẩn
  is_paid: boolean;
  is_cancelable: boolean;
  created_at: string;

  // --- FE-only fields (không có trong BE, cần comment) ---
  type: string;           // ⚠️ FE-only: "Đơn ngày" / "Sự kiện" — BE chưa có field này
  review_id?: string | null; // ⚠️ FE-only: ID của đánh giá (nếu đã đánh giá)
}

// Helper: derive legacy display values từ BE fields
export const formatBookingTime = (b: Booking) => `${b.start_time} - ${b.end_time}`;
export const formatBookingDate = (b: Booking) =>
  new Date(b.booking_date).toLocaleDateString('vi-VN');
export const formatBookingPrice = (b: Booking) =>
  `${Number(b.total_price).toLocaleString('vi-VN')} đ`;

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: '1',
    venue_id: 'v-1234',
    venue_name: 'ALOBO CLUB - VINHOMES OCEAN PARK',
    venue_address: 'Sân Pickleball, Phân khu Hải Âu, Vinhomes Ocean Park, Gia Lâm, Hà Nội',
    booking_date: '2026-03-30',
    start_time: '18:00',
    end_time: '19:00',
    total_price: 190000,
    status: 'CANCELLED',  // BE enum chuẩn
    is_paid: false,
    is_cancelable: false,
    created_at: '2026-03-20T10:00:00Z',
    type: 'Đơn ngày',     // FE-only
  },
  {
    id: '2',
    venue_id: 'v-1235',
    venue_name: 'SWIN PICKLEBALL - HAI BA TRUNG',
    venue_address: '458 Minh Khai, Vĩnh Tuy, Hai Bà Trưng, Hà Nội',
    booking_date: '2026-03-28',
    start_time: '20:00',
    end_time: '21:00',
    total_price: 150000,
    status: 'COMPLETED',  // BE enum chuẩn
    is_paid: true,
    is_cancelable: true,
    created_at: '2026-03-21T14:30:00Z',
    type: 'Đơn ngày',
    review_id: 'r-mock-123', // Giả lập đã đánh giá
  },
  {
    id: '3',
    venue_id: 'v-1236',
    venue_name: 'COCO PICKLECLUB - TAN BINH',
    venue_address: '18E Cộng Hòa, Phường 4, Tân Bình, TP.HCM',
    booking_date: '2026-03-25',
    start_time: '08:00',
    end_time: '10:00',
    total_price: 280000,
    status: 'COMPLETED',  // BE enum chuẩn
    is_paid: true,
    is_cancelable: false,
    created_at: '2026-03-22T09:15:00Z',
    type: 'Đơn ngày',
    review_id: 'r-mock-456', // Giả lập đã đánh giá
  },
];

// Mock Data cho User Registration (Map với UserResponse / UserProfileResponse)
export const MOCK_USER = {
  id: "u-999-123",
  full_name: "Phạm Ngọc Long", // Từ Auth UI
  email: "long.pn@example.com",
  phone: "+84987654321",
  role: "USER",
  avatar_url: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
  date_of_birth: "1998-05-15",
  is_active: true,
  is_verified: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const MOCK_OWNER = {
  id: "o-111-456",
  full_name: "Chủ Sân ALOBO",
  email: "owner@alobo.vn",
  phone: "+84123456789",       // ✅ Unified with MOCK_OWNER_REGISTER_PAYLOAD
  role: "MERCHANT",            // ✅ Fixed: BE enum = USER | MERCHANT | ADMIN (không có OWNER)
  avatar_url: "https://i.pravatar.cc/150?u=owner",
  is_active: true,
  is_verified: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Theo backend schema, mật khẩu chỉ xuất hiện lúc GỬI request đi (UserCreate Payload)
// Tuyệt đối KHÔNG BAO GIỜ được trả về từ API Response sau khi đăng ký/đăng nhập.
export const MOCK_REGISTER_PAYLOAD = {
  full_name: "Phạm Ngọc Long",
  phone: "+84987654321",
  password: "Password123!", // Frontend chỉ dùng ở Form
  role: "USER"
};

export const MOCK_OWNER_REGISTER_PAYLOAD = {
  full_name: "Chủ Sân ALOBO",
  phone: "+84123456789",
  password: "Owner1234!",      // ✅ Fixed: BE yêu cầu 8-16 chars + uppercase + lowercase + digit
  role: "MERCHANT"             // ✅ Fixed: BE enum = MERCHANT (không phải OWNER)
};

// ==========================================
// THIẾU API: Chủ sân quản lý thống kê & danh sách sân của mình (Owner Venue List & Stats API)
// BE Backend cần bổ sung GET /api/v1/owner/venues trả về mảng các sân thuộc quyền quản lý của user ID (role OWNER).
// Schema cần thiết (Front-end mong muốn):
// { id, name, status (ACTIVE/PENDING), total_bookings (tính trong tháng), revenue_mtd (doanh thu tháng), rating }
// ==========================================
// Owner Side: Venue stats and management
export const OWNER_VENUES = [
  {
    id: 'ov-1',
    name: 'Sân Pickleball LVK Hà Đông',
    status: 'ACTIVE',
    total_bookings: 156,
    revenue_mtd: 12500000,
    rating: 4.8,
  },
  {
    id: 'ov-2',
    name: 'Sân Pickleball LVK Vạn Phúc (Mới)',
    status: 'PENDING',
    total_bookings: 0,
    revenue_mtd: 0,
    rating: 0,
  }
];

// ==========================================
// THIẾU API: Quản lý yêu cầu đặt lịch của hệ thống Chủ sân (Owner Booking Management API)
// BE Backend cần API: GET /api/v1/owner/bookings (kèm filter trạng thái: Đợi xếp lịch, Đã duyệt, Hủy)
// BE Schema cần bổ sung các fields liên quan đến dịch vụ đi kèm:
// { id, customerName, phone, venueName, court, time, date, status (PENDING/CONFIRMED/CANCELLED), services: string[], totalPrice: number }
// ==========================================
export const OWNER_BOOKING_REQUESTS = [
  {
    id: 'req-1',
    customerName: 'Nguyễn Văn A',
    phone: '0912345678',
    venueName: 'Sân Pickleball LVK Hà Đông',
    court: 'Pickleball 1',
    time: '18:00 - 19:30',
    date: '2026-04-22',
    status: 'PENDING',
    services: ['Nước suối x2', 'Thuê vợt x1'],
    totalPrice: 245000,
  },
  {
    id: 'req-2',
    customerName: 'Trần Thị B',
    phone: '0988777666',
    venueName: 'Sân Pickleball LVK Hà Đông',
    court: 'Pickleball 2',
    time: '20:00 - 21:00',
    date: '2026-04-22',
    status: 'PENDING',
    services: [],
    totalPrice: 150000,
  }
];

// ==========================================
// CHƯA RÕ API: Cần API quản lý (CRUD) dành cho Owner với VenueServices
// BE Backend cần API CRUD: GET/POST/PUT/DELETE /api/v1/owner/venues/{venueId}/services
// Frontend cần dữ liệu: { id, name, price, unit (Đơn vị tính: Chai/Lon...) }
// ==========================================
export const OWNER_SERVICES = [
  { id: 's1', name: 'Nước suối', price: 10000, unit: 'Chai' },
  { id: 's2', name: 'Nước tăng lực', price: 15000, unit: 'Lon' },
  { id: 's3', name: 'Thuê vợt Pickleball', price: 30000, unit: 'Cái/buổi' },
  { id: 's4', name: 'Thuê giày thể thao', price: 20000, unit: 'Đôi/buổi' },
  { id: 's5', name: 'Thuê áo Bib', price: 10000, unit: 'Cái/buổi' },
];
