# API Specification (Frontend as Standard)

Tài liệu này định nghĩa chuẩn kết nối API lấy **Frontend là chuẩn (Source of Truth)**. Backend cần xây dựng các Endpoint trả về đúng cấu trúc này để Frontend có thể chạy thực tế mà không cần sửa đổi logic hiển thị.

---

## 1. Authentication (Xác thực)

### [X] 1.1 Đăng ký tài khoản
*   **API:** `POST /api/v1/auth/register`
*   **Request Payload:**
    ```json
    {
      "full_name": "Phạm Ngọc Long",
      "phone": "+84987654321",
      "password": "Password123!",
      "role": "USER"
    }
    ```
*   **Response (Expected):**
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "Bearer",
      "user": {
        "id": "u-999-123",
        "full_name": "Phạm Ngọc Long",
        "phone": "+84987654321",
        "email": "long.pn@example.com",
        "role": "USER",
        "avatar_url": "https://i.pravatar.cc/150?u=a042581f4e29026704d",
        "date_of_birth": "1998-05-15",
        "is_active": true,
        "is_verified": true
      }
    }
    ```

### [X] 1.2 Đăng nhập
*   **API:** `POST /api/v1/auth/login`
*   **Request (Form Data):**
    ```json
    {
      "phone": "+84987654321",
      "password": "Password123!"
    }
    ```
*   **Response (Expected):** Giống hệt API Register.

---

## 2. Venues (Sân bãi)

### [ ] 2.1 Danh mục thể thao
*   **API:** `GET /api/v1/venues/categories`
*   **Request:** `(No Body)`
*   **Response (Expected):**
    ```json
    [
      { "id": "1", "name": "Pickleball", "icon": "tennis-ball" },
      { "id": "2", "name": "Cầu lông", "icon": "badminton" },
      { "id": "3", "name": "Bóng đá", "icon": "soccer" },
      { "id": "4", "name": "Tennis", "icon": "tennis" }
    ]
    ```

### [ ] 2.2 Danh sách sân (Tìm kiếm xung quanh)
*   **API:** `GET /api/v1/venues/search/nearby`
*   **Request Params (Query):**
    ```json
    {
      "lat": 20.9845,
      "lng": 105.7925,
      "radius": 5000,
      "venue_type": "Pickleball"
    }
    ```
*   **Response (Expected Item):**
    ```json
    [
      {
        "id": "1",
        "name": "LVK Pickleball Club",
        "district": "Hà Đông",
        "address": "Sân Pickleball LVK, Hà Đông, Hà Nội",
        "images": ["https://images.unsplash.com/photo-1626224580174-3239b6267317?w=800"],
        "logo": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100",
        "operating_hours": { "open": "06:00", "close": "22:00" },
        "bookingLink": "https://datlich.alobo.vn/san/sport_lvk_pickleball_club",
        "fullAddress": "Vườn hoa trung tâm Làng Việt Kiều Châu Âu, Phường Hà Đông, Hà Nội",
        "category": "Pickleball",
        "venue_type": "Pickleball",
        "rating": 4.8,
        "is_verified": true,
        "base_price_per_hour": 150000,
        "lat": 20.9845,
        "lng": 105.7925
      }
    ]
    ```

### [ ] 2.3 Xem lịch trống của sân
*   **API:** `GET /api/v1/venues/{venue_id}/availability`
*   **Request Params (Query):**
    ```json
    {
      "date": "2026-04-25"
    }
    ```
*   **Response (Expected):**
    ```json
    {
      "venue_id": "1",
      "date": "2026-04-25",
      "open_time": "06:00",
      "close_time": "22:00",
      "slots": [
        { "start_time": "08:00", "end_time": "08:30", "available": true },
        { "start_time": "08:30", "end_time": "09:00", "available": false },
        { "start_time": "09:00", "end_time": "09:30", "available": true }
      ]
    }
    ```

---

## 3. Bookings (Đặt sân)

### [ ] 3.1 Xem trước giá (Price Preview)
*   **API:** `POST /api/v1/bookings/price-calculation`
*   **Request Payload:**
    ```json
    {
      "venue_id": "1",
      "booking_date": "2026-03-30",
      "start_time": "18:00",
      "end_time": "19:00",
      "services": []
    }
    ```
*   **Response (Expected):**
    ```json
    {
      "venue_pricing": {
        "base_price": 150000,
        "duration_hours": 1,
        "price_factor": 1.2,
        "total": 180000
      },
      "total": 190000,
      "currency": "VND"
    }
    ```

### [ ] 3.2 Tạo đơn đặt sân mới
*   **API:** `POST /api/v1/bookings`
*   **Request Payload:**
    ```json
    {
      "venue_id": "1",
      "booking_date": "2026-03-30",
      "start_time": "18:00",
      "end_time": "19:00",
      "notes": "Lấy thêm nước",
      "payment_method": "CASH"
    }
    ```
*   **Response (Expected):**
    ```json
    {
      "id": "1001",
      "status": "pending",
      "venue_name": "ALOBO CLUB - VINHOMES OCEAN PARK",
      "booking_date": "2026-03-30",
      "total_price": 190000,
      "is_paid": false
    }
    ```

### [ ] 3.3 Lịch sử đặt sân cá nhân
*   **API:** `GET /api/v1/bookings/me`
*   **Request:** `(Bearer Token in Header)`
*   **Response (Expected List):**
    ```json
    [
      {
        "id": "1",
        "clubName": "ALOBO CLUB - VINHOMES OCEAN PARK",
        "status": "canceled",
        "time": "18:00 - 19:00",
        "date": "30/03/2026",
        "price": "190.000",
        "address": "Phân khu Hải Âu, Vinhomes Ocean Park, Gia Lâm, Hà Nội"
      }
    ]
    ```

---

## 4. Merchant (Dành cho chủ sân)

### [ ] 4.1 Thống kê doanh thu
*   **API:** `GET /api/v1/merchant/stats`
*   **Response (Expected):**
    ```json
    {
      "total_bookings": 15,
      "pending_bookings": 3,
      "total_revenue": 2150000,
      "currency": "VND"
    }
    ```

### [ ] 4.2 Duyệt/Hủy đơn đặt sân
*   **API:** `POST /api/v1/merchant/bookings/{booking_id}/process`
*   **Request Payload:**
    ```json
    {
      "status": "confirmed",
      "reason": "OK"
    }
    ```
*   **Response (Expected):**
    ```json
    {
      "id": "1001",
      "status": "confirmed"
    }
    ```

---

## 5. Quy tắc chung cho Backend
1.  **Snake Case:** Dùng `full_name`, `booking_date`, `total_price`...
2.  **Naming cho UI:** FE cần một số trường render trực tiếp như `clubName`, `price` (chuỗi có dấu chấm), `date` (DD/MM/YYYY). BE nên trả về song song hoặc FE sẽ tự format từ chuẩn ISO.
3.  **Status:** Sử dụng tập giá trị: `pending`, `success`, `canceled`.

---

## 6. Additional Backend APIs (Pending Frontend Implementation)
*Các API này có trong Backend nhưng Frontend chưa triển khai giao diện tương ứng.*

### [ ] 6.1 Làm mới Token (Refresh Token)
*   **API:** `POST /api/v1/auth/refresh`
*   **Request Payload:**
    ```json
    {
      "refresh_token": "string"
    }
    ```
*   **Response:** `TokenResponse` (access_token mới).

### [ ] 6.2 Cập nhật hồ sơ (Update Profile)
*   **API:** `PATCH /api/v1/auth/me`
*   **Request Payload:**
    ```json
    {
      "full_name": "Phạm Ngọc Long Update",
      "email": "new.email@example.com",
      "avatar_url": "https://link-to-new-avatar.jpg"
    }
    ```

### [ ] 6.3 Quản lý sân (Merchant Only)
*   **API:** `POST /api/v1/venues/merchant` (Tạo sân mới)
*   **API:** `PUT /api/v1/venues/merchant/{venue_id}` (Cập nhật sân)
*   **API:** `DELETE /api/v1/venues/merchant/{venue_id}` (Ngừng hoạt động sân)

### [ ] 6.4 Dịch vụ đi kèm (Venue Services)
*   **API:** `POST /api/v1/venues/{venue_id}/services`
*   **Request Payload:**
    ```json
    {
      "name": "Cho thuê vợt",
      "price_per_unit": 50000,
      "description": "Vợt chuẩn thi đấu"
    }
    ```

### [ ] 6.5 Cấu hình giá linh hoạt (Pricing Slots)
*   **API:** `POST /api/v1/venues/{venue_id}/pricing`
*   **Request Payload:**
    ```json
    {
      "day_type": "WEEKEND",
      "start_time": "17:00",
      "end_time": "22:00",
      "price_factor": 1.5
    }
    ```

### [ ] 6.6 Quản trị (Admin)
*   **API:** `POST /api/v1/venues/{venue_id}/verify` (Xác thực sân chính chủ)
*   **API:** `GET /api/v1/users/merchants` (Danh sách các chủ sân)
