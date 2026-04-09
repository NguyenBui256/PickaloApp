export const CATEGORIES = [
  { id: '1', name: 'Pickleball', icon: 'tennis-ball' },
  { id: '2', name: 'Cầu lông', icon: 'badminton' },
  { id: '3', name: 'Bóng đá', icon: 'soccer' },
  { id: '4', name: 'Tennis', icon: 'tennis' },
  { id: '5', name: 'B.Chuyền', icon: 'volleyball' },
  { id: '6', name: 'Bóng rổ', icon: 'basketball' },
];

export const VENUES = [
  {
    id: '1',
    name: 'LVK Pickleball Club',
    address: 'Sân Pickleball LVK, Hà Đông, Hà Nội',
    distance: '0.8 km',
    image: 'https://images.unsplash.com/photo-1626224580174-3239b6267317?w=800',
    logo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
    hours: '06:00 - 22:00',
    badges: ['Đơn ngày', 'Sự kiện'],
    isFavorite: false,
    fullAddress: 'Vườn hoa trung tâm Làng Việt Kiều Châu Âu, Phường Hà Đông, Hà Nội (SÂN NGOÀI TRỜI)',
    phone: '0987.654.321',
    bookingLink: 'https://datlich.alobo.vn/san/sport_lvk_pickleball_club',
    category: 'Pickleball',
    rating: 'Chưa có đánh giá',
    lat: 20.9845,
    lng: 105.7925,
  },
  {
    id: '2',
    name: 'Clb Pickleballs Cung Văn Quán',
    address: 'Văn Quán, Hà Đông, Hà Nội',
    distance: '1.2 km',
    image: 'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?w=800',
    logo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100',
    hours: '05:30 - 23:00',
    badges: ['Đơn ngày'],
    isFavorite: true,
    fullAddress: 'Khu đô thị Văn Quán, Hà Đông, Hà Nội',
    phone: '0123.456.789',
    bookingLink: 'https://datlich.alobo.vn/san/van_quan_pickleball',
    category: 'Pickleball',
    rating: '4.5 (12 đánh giá)',
    lat: 20.9785,
    lng: 105.7885,
  },
];

export const QUICK_FILTERS = [
  'Cầu lông gần tôi',
  'Pickleball gần tôi',
  'Xé vé gần tôi',
];

export const EXPLORE_FILTERS = [
  'Tất cả',
  'Gói hội viên',
  'Thông báo',
  'Ưu đãi',
];

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

export const BOOKING_COURTS = [
  'Pickleball 1',
  'Pickleball 2',
  'Pickleball 3',
  'Pickleball 4',
  'Pickleball 5',
  'Pickleball 6',
];

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

// Generate a randomized availability matrix for demo purposes
export const MOCK_AVAILABILITY: Record<string, string> = {}; 
// Key format: "courtName-time"
BOOKING_COURTS.forEach(court => {
  TIME_SLOTS.forEach(slot => {
    const rand = Math.random();
    let status = 'available';
    if (rand < 0.1) status = 'booked';
    else if (rand < 0.15) status = 'locked';
    else if (rand < 0.18) status = 'event';
    MOCK_AVAILABILITY[`${court}-${slot}`] = status;
  });
});

export const BANK_DETAILS = {
  bankName: 'MB BANK',
  accountHolder: 'NGUYEN VAN A',
  accountNumber: '1234567890',
  qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ALOBO-PAYMENT',
};

export interface Booking {
  id: string;
  type: string;
  clubName: string;
  status: 'canceled' | 'success' | 'pending';
  time: string;
  date: string;
  address: string;
  price: string;
}

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: '1',
    type: 'Đơn ngày',
    clubName: 'ALOBO CLUB - VINHOMES OCEAN PARK',
    status: 'canceled',
    time: '18:00 - 19:00',
    date: '30/03/2026',
    address: 'Sân Pickleball, Phân khu Hải Âu, Vinhomes Ocean Park, Gia Lâm, Hà Nội',
    price: '190.000',
  },
  {
    id: '2',
    type: 'Đơn ngày',
    clubName: 'SWIN PICKLEBALL - HAI BA TRUNG',
    status: 'success',
    time: '20:00 - 21:00',
    date: '28/03/2026',
    address: '458 Minh Khai, Vĩnh Tuy, Hai Bà Trưng, Hà Nội',
    price: '150.000',
  },
  {
    id: '3',
    type: 'Đơn ngày',
    clubName: 'COCO PICKLECLUB - TAN BINH',
    status: 'canceled',
    time: '08:00 - 10:00',
    date: '25/03/2026',
    address: '18E Cộng Hòa, Phường 4, Tân Bình, TP.HCM',
    price: '280.000',
  },
];
