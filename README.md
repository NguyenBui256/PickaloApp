# PickaloApp - Pickleball Venue Booking System

PickaloApp là một nền tảng quản lý và đặt sân Pickleball trực quan, hỗ trợ người chơi tìm kiếm sân, đặt lịch và ghép sân nhanh chóng, đồng thời giúp chủ sân quản lý doanh thu và lịch đặt hiệu quả.

## 🚀 Tính năng chính

### Dành cho Người chơi (User)
- **Tìm kiếm sân thông minh**: Tìm sân theo khu vực, trực tiếp trên map.
- **Đặt sân trực quan**: Chọn khung giờ trống trên lưới thời gian thực.
- **Giữ chỗ tạm thời**: Tự động khóa sân trong 10 phút khi đang tiến hành thanh toán.
- **Thanh toán linh hoạt**: Tải minh chứng thanh toán.
- **Lịch sử đặt sân**: Quản lý các đơn đặt, trạng thái và đánh giá sân sau khi chơi.
- **Tạo kèo ghép trận**: Tạo kèo ghép trận public đối với booking, tìm kiếm kèo, liên hệ qua chat.

### Dành cho Chủ sân (Merchant)
- **Dashboard quản lý**: Xem biểu đồ doanh thu, lượt đặt sân và thống kê theo tháng.
- **Quản lý sân con (Courts)**: Thêm, sửa, xóa các sân con trong cơ sở.
- **Cấu hình giá linh hoạt**: Thiết lập giá khác nhau theo khung giờ và ngày (thứ 7, CN, ngày lễ).
- **Phê duyệt đặt sân**: Duyệt hoặc từ chối các yêu cầu đặt sân dựa trên minh chứng thanh toán.


## 🛠 Công nghệ sử dụng

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **Database**: PostgreSQL với extension **PostGIS** (hỗ trợ tìm kiếm theo vị trí địa lý).
- **ORM**: SQLAlchemy 2.0 (Async)
- **Storage**: MinIO (Tương thích S3) để lưu trữ hình ảnh sân và minh chứng thanh toán.
- **Migration**: Alembic

### Frontend
- **Framework**: [React Native](https://reactnative.dev/) (Expo SDK)
- **Language**: TypeScript
- **State Management**: Zustand / Auth Store
- **Navigation**: React Navigation
- **Styling**: Vanilla CSS-in-JS

## 📦 Hướng dẫn cài đặt

### Yêu cầu hệ thống
- Docker & Docker Compose
- Node.js & npm (để chạy frontend)

### Chạy Backend (Docker)
1. Di chuyển vào thư mục backend: `cd backend`
2. Tạo file `.env` từ `.env.example` và cấu hình các thông số.
3. Chạy hệ thống:
   ```bash
   docker-compose up -d --build
   ```
4. Thực hiện migration database:
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

### Chạy Frontend (Expo)
1. Di chuyển vào thư mục frontend: `cd frontend`
2. Cài đặt dependencies:
   ```bash
   npm install
   ```
3. Chạy ứng dụng:
   ```bash
   npx expo start
   ```

## 📝 Lưu ý phát triển
- Ứng dụng sử dụng **ngrok** để expose backend cho điện thoại/emulator thật có thể kết nối được trong môi trường development.
- Mặc định, các đơn đặt sân PENDING chưa thanh toán sẽ tự động bị hủy sau 10 phút để nhả chỗ cho người khác.

## 👥 Thành viên thực hiện - Nhóm 15
- **Bùi Thế Vĩnh Nguyên** - B22DCCN588
- **Vũ Trọng Khôi** - B22DCCN468
- **Phạm Ngọc Long** - B22DCCN504
  
[TaskSheet]()

**Lớp 08 - Môn Lập Trình Thiết Bị Di Động (PTIT)**

---
© 2026 PickaloApp Team.
