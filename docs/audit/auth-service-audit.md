# Audit: Auth Service vs. Identity Service API

Bản đối soát giữa tài liệu Backend API ([identity-service.yaml](../../docs/api-specs/identity-service.yaml)) và triển khai thực tế tại Frontend ([auth-service.ts](../../frontend/src/services/auth-service.ts)).

## 1. Bảng so sánh API Endpoints

| Chức năng | Backend (Spec YAML) | Frontend (Service TS) | Trạng thái | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **Đăng ký** | `POST /auth/register` | `POST /auth/register` | ✅ Khớp | |
| **Đăng nhập** | `POST /auth/login` | `POST /auth/login` | ✅ Khớp | |
| **Refresh Token** | `POST /auth/refresh` | `POST /auth/refresh` | ✅ Khớp | |
| **Đăng xuất** | `POST /auth/logout` | `POST /auth/logout` | ✅ Khớp | |
| **Xác thực OTP** | `POST /auth/verify-phone` | `POST /auth/verify-phone` | ✅ Khớp | |
| **Lấy Profile mình** | `GET /auth/me` | `GET /auth/me` | ✅ Khớp | |
| **Cập nhật Profile** | `PATCH /auth/me` | `PATCH /auth/me` | ✅ Khớp | |
| **Đổi mật khẩu** | `POST /auth/me/change-password` | `POST /auth/me/change-password` | ✅ Đã khớp | Đã sửa: Gửi qua **JSON Body** khớp với BE. |
| **Lấy Full Profile** | ❌ Thiếu | `GET /users/me` | ➕ **FE Thừa** | BE chỉ có `/auth/me`. Cần thống nhất 1 endpoint. |
| **Xem Profile khác** | ❌ Thiếu | `GET /users/{userId}` | ➕ **FE Thừa** | BE chưa định nghĩa xem profile công khai. |
| **Upload Avatar** | ❌ Thiếu | `POST /auth/me/avatar` | ➕ **FE Thừa** | BE chưa có endpoint upload file. |

---

## 2. Phân tích chi tiết

### A. Những gì FE "Thừa" so với BE Spec:
1.  **`/users/me` & `/users/{userId}`**:
    *   *Hiện tại:* FE đang dùng prefix `/users` cho các tác vụ liên quan đến dữ liệu người dùng mở rộng.
    *   *Đánh giá:* **Cần thiết**. App cần xem profile của Merchant hoặc User khác khi tìm kiếm. BE nên bổ sung các endpoint này vào spec.
2.  **`/auth/me/avatar`**:
    *   *Hiện tại:* FE đã chuẩn bị hàm upload ảnh.
    *   *Đánh giá:* **Bắt buộc**. Không có cái này thì user không bao giờ đổi được avatar. BE cần bổ sung xử lý `multipart/form-data`.

### B. Những gì BE "Thiếu" (nhưng cần thiết):
1.  **Endpoint xem profile công khai**: Như đã nói ở trên, `GET /api/v1/users/{user_id}` là cần thiết cho tính năng tìm kiếm và xem thông tin Merchant.
2.  **Endpoint Upload**: Cần spec rõ ràng cho việc upload ảnh (avatar, ảnh căn hộ, v.v.).

### C. Xung đột nghiêm trọng (Cần sửa ngay):
*   **`changePassword`**: 
    *   Spec BE yêu cầu Body: `{ "old_password": "...", "new_password": "..." }`.
    *   Code FE hiện tại gửi qua URL: `?old_password=...&new_password=...`. 
    *   **Hậu quả:** Sẽ bị lỗi 400 hoặc 422 khi gọi API thật.

---

## 3. Đề xuất hành động

1.  **Frontend**: Cập nhật hàm `changePassword` để gửi data trong request body.
2.  **Backend**: Bổ sung `GET /users/{user_id}` và `POST /auth/me/avatar` vào spec và triển khai thực tế.
3.  **Thống nhất**: Nếu `/auth/me` đã trả về đầy đủ `created_at`, `updated_at`, hãy loại bỏ hàm `getMyFullProfile` ở FE để tránh dư thừa.

---
*Ngày audit: 2026-04-22*
*Người thực hiện: Antigravity AI*
