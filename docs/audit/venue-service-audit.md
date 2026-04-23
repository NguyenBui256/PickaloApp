# Audit: Venue Service vs. Venue API Spec

Bản đối soát giữa tài liệu Backend API ([venue-service.yaml](../../docs/api-specs/venue-service.yaml)) và triển khai thực tế tại Frontend ([venue-service.ts](../../frontend/src/services/venue-service.ts)).

## 1. Bảng so sánh API Endpoints

| Chức năng | Backend (Spec YAML) | Frontend (Service TS) | Trạng thái | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **Liệt kê sân** | `/venues` | `/venues` | ✅ Khớp | |
| **Tìm sân gần đây** | `/venues/search/nearby` | `/venues/search/nearby` | ✅ Khớp | |
| **Chi tiết sân** | `/venues/{id}` | `/venues/{id}` | ✅ Khớp | |
| **Check lịch trống** | `/venues/{id}/availability` | `/venues/{id}/availability` | ✅ Đã khớp | Đã sửa: Cấu trúc mảng `courts[]` (multi-court) khớp với BE. |
| **Tạo sân (Merchant)**| `POST /venues` | `POST /venues` | ✅ Đã khớp | Đã sửa: Đồng bộ path `/venues` khớp với BE. |
| **Quản lý sân con** | `/venues/{id}/courts` | ❌ Thiếu | **FE Thiếu** | Cần hàm lấy/thêm sân con (Court 1, 2...). |
| **Quản lý Dịch vụ** | ❌ Thiếu | `/venues/{id}/services` | **FE Thừa** | BE chưa có endpoint quản lý dịch vụ đi kèm. |
| **Cập nhật/Xóa sân** | ❌ Thiếu | `/venues/merchant/{id}` | **FE Thừa** | BE spec chưa có endpoint Update/Delete. |
| **Bảng giá (Pricing)** | `/venues/{id}/pricing` | `/venues/{id}/pricing` | ✅ Khớp | |

---

## 2. Phân tích chi tiết

### A. Xung đột Availability (Nghiêm trọng):
*   **Backend:** Trả về mảng `courts: { court_id, court_name, slots: [] }[]`. Phù hợp với thực tế 1 địa điểm có nhiều sân.
*   **Frontend (Mock):** Đang trả về 1 mảng `slots[]` duy nhất cho toàn bộ Venue.
*   **Giải pháp:** Cần refactor `AvailabilityResponse` ở FE để map dữ liệu theo từng sân con.

### B. Những gì BE "Thiếu":
1.  **`PUT /api/v1/venues/{id}`**: Cho phép Merchant cập nhật thông tin sân (ảnh, mô tả, giờ mở cửa).
2.  **`DELETE /api/v1/venues/{id}`**: Cho phép Merchant tạm ngừng hoạt động sân.
3.  **`GET/POST /api/v1/venues/{id}/services`**: Quản lý các dịch vụ cộng thêm (Nước uống, thuê vợt, nhặt bóng).

### C. Những gì FE cần cập nhật:
1.  **Path**: Đổi `POST /venues/merchant` thành `POST /venues` (hoặc thống nhất lại prefix với BE).
2.  **Court Management**: Triển khai các hàm gọi tới `/courts` để Merchant có thể thêm/bớt số lượng sân con.

---

## 3. Đề xuất hành động

1.  **Frontend**: Cập nhật `AvailabilityResponse` trong `api-types.ts` để chứa mảng `courts`.
2.  **Frontend**: Cập nhật logic mock trong `fetchVenueAvailability` để tạo data theo từng sân con.
3.  **Backend**: Bổ sung endpoint Update/Delete và Services vào spec.

---
*Ngày audit: 2026-04-22*
*Người thực hiện: Antigravity AI*
