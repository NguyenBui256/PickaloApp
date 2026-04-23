# Audit: Booking Service vs. Booking API Spec

Bản đối soát giữa tài liệu Backend API ([booking-service.yaml](../../docs/api-specs/booking-service.yaml)) và triển khai thực tế tại Frontend ([booking-service.ts](../../frontend/src/services/booking-service.ts)).

## 1. Bảng so sánh API Endpoints

| Chức năng | Backend (Spec YAML) | Frontend (Service TS) | Trạng thái | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **Tạo Booking** | `POST /bookings` | `POST /bookings` | ✅ Đã khớp | Đã sửa: Cấu trúc mảng `slots[]` (multi-court) khớp với BE. |
| **Tính giá trước** | `/bookings/price-calculation` | `/bookings/price-calculation` | ✅ Đã khớp | Đã sửa: Tính giá dựa trên danh sách `slots[]`. |
| **Danh sách của tôi** | `GET /bookings` | `GET /bookings` | ✅ Khớp | |
| **Chi tiết Booking** | `GET /bookings/{id}` | `GET /bookings/{id}` | ✅ Khớp | |
| **Hủy Booking** | `POST /bookings/{id}/cancel` | `POST /bookings/{id}/cancel` | ✅ Khớp | |
| **Lịch sân (Timeline)**| ❌ Thiếu | `/bookings/venues/{id}/timeline` | **FE Thừa / BE Thiếu**| BE thiếu endpoint trả về các khung giờ trống/bận. |

---

## 2. Phân tích chi tiết

### A. Xung đột cấu trúc Slots (Nghiêm trọng):
*   **Backend Spec:** Một Booking có thể bao gồm nhiều sân con (Court). Do đó BE yêu cầu truyền mảng `slots: { court_id, start_time, end_time }[]`.
*   **Frontend (Hiện tại):** `BookingCreateRequest` đang truyền `start_time` và `end_time` trực tiếp vào object cha, không có `court_id`.
*   **Hậu quả:** Không thể đặt được sân cụ thể nếu Venue có nhiều sân con. Cần refactor lại Types và Service.

### B. Những gì BE "Thiếu":
1.  **`GET /api/v1/bookings/venues/{venue_id}/timeline`**: Đây là endpoint sống còn để User biết giờ nào còn trống mà đặt. BE cần bổ sung gấp.

### C. Những gì FE cần cập nhật:
1.  **Response Handling**: `BookingResponse` cần hiển thị thông tin các sân con đã đặt (`slots[]`) thay vì chỉ hiện tên Venue chung chung.

### C. Những gì FE đã cập nhật (2026-04-23):
1.  **Date Selection Logic:** Đã triển khai bộ chọn ngày (Date Picker) 14 ngày kể từ ngày hiện tại.
2.  **Validation Thời gian:** Tự động khóa (disable) các khung giờ đã trôi qua trong ngày hiện tại dựa trên giờ hệ thống (`now()`).
3.  **Maintenance Support:** Đã thêm trạng thái `MAINTENANCE` (Màu cam) để hiển thị các sân đang bảo trì, không cho phép đặt.

---

## 3. Đề xuất hành động

1.  **Frontend**: Cập nhật `BookingCreateRequest` và `BookingPricePreviewRequest` trong `api-types.ts` để sử dụng cấu trúc mảng `slots`.
2.  **Frontend**: Cập nhật hàm `createBooking` và `calculateBookingPrice` để truyền data đúng format mới.
3.  **Backend**: Bổ sung endpoint `/availability` hoặc `/timeline` vào spec. Cần trả về đầy đủ các trạng thái: `AVAILABLE`, `BOOKED`, `MAINTENANCE`, `EVENT`.

---
*Ngày audit: 2026-04-23 (Cập nhật logic Date/Time)*
*Người thực hiện: Antigravity AI*
