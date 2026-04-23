# Audit Review Service: Frontend vs. Backend

Tài liệu này đánh giá mức độ tương thích giữa tính năng Đánh giá (Review) đã triển khai ở Frontend và Đặc tả API (Review Service OpenAPI) từ Backend.

## 1. Bản đồ ánh xạ API (Endpoint Mapping)

| Chức năng | Phương thức | Endpoint (Backend Spec) | Trạng thái Frontend |
| :--- | :---: | :--- | :--- |
| Lấy danh sách đánh giá sân | GET | `/venues/{venue_id}/reviews` | ✅ Hoàn thành (`fetchVenueReviews`) |
| Gửi đánh giá mới | POST | `/venues/{venue_id}/reviews` | ✅ Hoàn thành (`createReview`) |
| Lấy chi tiết 1 đánh giá | GET | `/reviews/{review_id}` | ❌ Chưa code (Hiện dùng Mock local) |
| Cập nhật đánh giá | PUT | `/reviews/{review_id}` | ✅ Hoàn thành (`updateReview`) |
| Xóa đánh giá | DELETE | `/reviews/{review_id}` | ✅ Hoàn thành (`deleteReview`) |

## 2. Đối soát dữ liệu (Data Schema Audit)

### ReviewResponse (Dữ liệu trả về từ BE)
| Field | Type | Backend Spec | Frontend (api-types.ts) | Note |
| :--- | :---: | :---: | :---: | :--- |
| `id` | string | ✅ | ✅ | |
| `user_id` | string | ✅ | ✅ | |
| `venue_id` | string | ✅ | ✅ | |
| `rating` | float | ✅ | ✅ | BE dùng float, FE hiện dùng number |
| `comment` | string | ✅ | ✅ | |
| `images` | string[] | ✅ | ❌ Thiếu | Frontend cần bổ sung để hiển thị ảnh |
| `user_name` | string | ✅ | ✅ | |
| `user_avatar`| string | ✅ | ❌ Thiếu | Cần để hiển thị ảnh đại diện người review |
| `created_at` | string | ✅ | ✅ | |
| `updated_at` | string | ✅ | ❌ Thiếu | |

### ReviewCreate/Update (Dữ liệu gửi lên BE)
*   **Frontend:** Đã gửi `rating` và `comment`.
*   **Thừa/Thiếu:** Backend spec có trường `images` (array string) để upload ảnh, Frontend hiện chưa thực hiện logic upload ảnh thực tế, mới chỉ để UI placeholder.

## 3. Các vấn đề cần lưu ý & Đề xuất (Audit Findings)

### ⚠️ Khoảng cách Logic (Logic Gaps)
1.  **Booking reviewed state:**
    *   **FE:** Đang dùng field `review_id` trong `BookingListItem` để biết đơn hàng đã đánh giá chưa.
    *   **BE:** Schema `BookingListItem` (trong Booking Service) hiện **chưa có** field này. Cần đề xuất Backend bổ sung hoặc FE phải tự gọi API Review để check (tốn tài nguyên hơn).
2.  **Xác thực người dùng:**
    *   API Backend yêu cầu Token cho các tác vụ POST/PUT/DELETE. FE đã sẵn sàng logic `apiClient` nhưng cần đảm bảo Review Service chạy cùng domain/port hoặc được config CORS đúng.
3.  **Xử lý hình ảnh:**
    *   Backend spec yêu cầu mảng URL ảnh. FE cần một quy trình: `Upload ảnh lên S3/Cloudinary` -> `Lấy URL` -> `Gửi URL kèm Review`. Hiện tại bước upload chưa có.

### 💡 Đề xuất hành động (Action Plan)
1.  **Backend (Review Service):**
    *   Bổ sung field `user_avatar` vào `ReviewResponse` để FE hiển thị đẹp hơn.
2.  **Backend (Booking Service):**
    *   Bổ sung `review_id` vào `BookingListItem` để FE hiển thị nút "Xem đánh giá" thay vì "Đánh giá" một cách nhanh chóng.
3.  **Frontend:**
    *   Cập nhật `ReviewResponse` trong `api-types.ts` để bao gồm `images` và `user_avatar`.
    *   Triển khai thêm hàm `fetchReviewById` trong `review-service.ts`.
    *   Nâng cấp `ReviewSubmissionScreen` để hỗ trợ chọn và upload ảnh (khi có API upload).

---
*Người thực hiện: Antigravity*
*Ngày audit: 23/04/2026*
