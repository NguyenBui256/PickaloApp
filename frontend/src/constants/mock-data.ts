// ==========================================
// STATIC UI CONSTANTS
// (Mock data for UI elements not yet backed by API endpoints)
// ==========================================

// Chưa có API danh sách Categories riêng (Backend hiện tại sử dụng enum VenueType)
export const CATEGORIES = [
  { id: '1', name: 'Pickleball', icon: 'tennis-ball' as const },
];

// Chưa có API filters
export const QUICK_FILTERS = ['Cầu lông gần tôi', 'Pickleball gần tôi', 'Xé vé gần tôi'];

// Chưa có API filters
export const EXPLORE_FILTERS = ['Tất cả', 'Gói hội viên', 'Thông báo', 'Ưu đãi'];

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

// Chưa có API GET payment gateway/settings của từng merchant hay hệ thống
export const BANK_DETAILS = {
  bankName: 'MB BANK',
  accountHolder: 'NGUYEN VAN A',
  accountNumber: '1234567890',
  qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ALOBO-PAYMENT',
};
