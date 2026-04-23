# Audit: Merchant Service vs. Merchant API Spec

Bản đối soát giữa tài liệu Backend API ([merchant-service.yaml](../../docs/api-specs/merchant-service.yaml)) và triển khai thực tế tại Frontend ([merchant-service.ts](../../frontend/src/services/merchant-service.ts)).

## 1. Bảng so sánh API Endpoints

| Chức năng | Backend (Spec YAML) | Frontend (Service TS) | Trạng thái | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **Thống kê doanh thu** | `/merchant/bookings/stats` | `/merchant/bookings/stats` | ✅ Đã khớp | Đã sửa: Cấu trúc mảng `venues[]` khớp với BE. |
| **Danh sách Booking** | `/merchant/bookings` | `/merchant/bookings` | ✅ Khớp | |
| **Chi tiết Booking** | `/merchant/bookings/{id}` | `/merchant/bookings/{id}` | ✅ Khớp | |
| **Phê duyệt (Approve)** | `/merchant/bookings/{id}/approve` | `/merchant/bookings/{id}/approve` | ✅ Khớp | |
| **Từ chối (Reject)** | `/merchant/bookings/{id}/reject` | `/merchant/bookings/{id}/reject` | ✅ Khớp | |
| **Hoàn thành (Complete)**| `/merchant/bookings/{id}/complete`| ❌ Thiếu | **FE Thiếu** | Chủ sân cần nút xác nhận khách đã chơi xong. |
| **Hủy (Merchant Cancel)**| ❌ Thiếu | `/merchant/bookings/{id}/cancel` | **FE Thừa** | BE chưa định nghĩa endpoint hủy cho chủ sân. |
| **Booking theo sân** | `/bookings/venues/{id}/bookings` | `/bookings/venues/{id}/bookings` | ✅ Khớp | |
| **Sân của tôi** | ❌ Thiếu | `/merchant/venues` | **FE Thừa / BE Thiếu**| BE thiếu endpoint liệt kê sân thuộc sở hữu merchant. |

---

## 2. Phân tích chi tiết

### A. Xung đột cấu trúc Stats:
*   **Backend:** Trả về `{ venues: MerchantVenueStats[], currency: string }`. Cho phép xem doanh thu riêng từng sân.
*   **Frontend (Mock):** Đang dùng `{ total_bookings: number, total_revenue: number, ... }`.
*   **Giải pháp:** FE cần cập nhật Interface để map dữ liệu từ mảng `venues` lên Dashboard.

### B. Những gì BE "Thiếu" (nhưng cần thiết):
1.  **`GET /api/v1/merchant/venues`**: Đây là endpoint quan trọng nhất để chủ sân quản lý danh sách sân của mình (để xem trạng thái, chỉnh sửa thông tin).
2.  **`POST /api/v1/merchant/bookings/{id}/cancel`**: Trong trường hợp sân gặp sự cố đột xuất (mưa bão, bảo trì gấp), chủ sân cần quyền hủy các booking đã đặt.

### C. Những gì FE "Thiếu":
1.  **Hàm `completeBooking`**: BE đã có endpoint xác nhận hoàn tất session chơi, FE nên bổ sung nút "Hoàn thành" trong quản lý booking để cập nhật trạng thái chính xác.

---

## 3. Đề xuất hành động

1.  **Frontend**: Cập nhật `types/api-types.ts` cho `MerchantStatsResponse` để khớp với mảng `venues`.
2.  **Backend**: Bổ sung endpoint `/merchant/venues` vào spec và triển khai thực tế.
3.  **Frontend**: Triển khai hàm `completeBooking` gọi tới `/merchant/bookings/{id}/complete`.

---
*Ngày audit: 2026-04-22*
*Người thực hiện: Antigravity AI*
