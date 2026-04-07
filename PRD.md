PRODUCT REQUIREMENTS DOCUMENT (PRD) - PickAlo
1. Giới thiệu dự án
PickAlo là nền tảng kết nối chủ sân thể thao và người chơi, giúp đơn giản hóa quy trình tìm kiếm, đặt lịch và thanh toán trực tuyến, đồng thời tạo không gian giao lưu cho cộng đồng thể thao.
2. Đối tượng người dùng (User Personas)
Người dùng (Khách hàng): Tìm kiếm sân, đặt lịch, thanh toán và tìm đối thủ/đồng đội.
Chủ sân (Merchant): Đăng ký kinh doanh, quản lý lịch trình, dịch vụ và doanh thu.
Quản trị viên (Admin): Kiểm soát toàn bộ hệ thống, người dùng và giải quyết tranh chấp.

3. Tính năng chi tiết
3.1. Bản đồ & Dữ liệu sân (Maps & Data)
Tích hợp Map: Sử dụng OpenSource Leaflet kết hợp với dữ liệu bản đồ từ OpenStreetMap (OSM) để hiển thị vị trí sân tại Hà Nội.
Dữ liệu sân:
Tên sân, địa chỉ, loại sân (5 người, 7 người, tennis, cầu lông...).
Tọa độ (Lat/Lng) để hiển thị trên Map.
Hình ảnh thực tế.
3.2. Chức năng dành cho Người dùng
Tìm kiếm & Lọc: Theo khu vực, loại sân, khung giờ còn trống và mức giá.
Đặt sân (Booking):
Chọn ngày/giờ trên giao diện Timeline.
Tính giá linh hoạt: Hệ thống tự động tính giá dựa trên khung giờ (Ví dụ: Giờ vàng 17h-21h giá cao hơn giờ hành chính).
Thanh toán: Tích hợp cổng thanh toán (VNPay/Momo hoặc chuyển khoản QR chuyển trạng thái tự động).
Quản lý lịch đặt: Xem lại lịch sử, trạng thái đơn hàng (Chờ duyệt/Đã xác nhận/Đã hủy).
3.3. Chức năng dành cho Chủ sân
Đăng ký địa điểm: Cung cấp thông tin sân, định vị trên bản đồ và tải lên giấy phép (nếu cần).
Quản lý lịch trình: * Duyệt hoặc Hủy yêu cầu đặt sân từ khách hàng.
Đánh dấu sân bảo trì/nghỉ.
Quản lý dịch vụ đi kèm: * Thêm/Sửa/Xóa dịch vụ (Nước uống, thuê áo bib, thuê giày).
Duyệt/Hủy yêu cầu dịch vụ trong đơn đặt của khách.
3.4. Chức năng Newsfeed (Cộng đồng)
Đăng bài: Người dùng đăng tin "Tuyển đối", "Giao lưu" kèm thời gian và địa điểm.
Tương tác: Comment dưới bài đăng để trao đổi.
Bộ lọc (Filter): Lọc bài viết theo môn thể thao hoặc khu vực quận/huyện tại Hà Nội.
3.5. Chức năng Quản trị viên (Admin)
Dashboard: Thống kê tổng số sân, người dùng và doanh thu toàn hệ thống.
Quản lý thực thể: Có quyền khóa tài khoản vi phạm, gỡ bài đăng Newsfeed không phù hợp hoặc xóa các sân ảo.

4. Luồng tính giá tiền (Pricing Logic)
Giá tiền được tính theo công thức:
$$Total = (BasePrice \times TimeSlotFactor) + ServiceFee$$
Khung giờ
Hệ số (Factor)
Ghi chú
05:00 - 16:00
1.0
Giờ thấp điểm
16:00 - 22:00
1.5
Giờ cao điểm
Cuối tuần
+20%
Phụ phí ngày lễ/nghỉ


5. Công nghệ đề xuất (Tech Stack)
Frontend: ReactNative cho Android (Giao diện sẽ được thiết kế bằng Pencil.dev và sử dụng MCP để lấy thông tin cài đặt ở các phase sau)
Backend: Python FastAPI với kiến trúc Monolithic
Database: PostgreSQL (Lưu dữ liệu quan hệ) + PostGIS (Hỗ trợ truy vấn tọa độ bản đồ).
Map: Leaflet JS + OpenStreetMap API.

6. Gợi ý nguồn dữ liệu sân (HN Data)
Vì bạn có thể "thêm chay", mình gợi ý cấu trúc JSON cơ bản để bạn import vào Database:
JSON
{
  "id": "sân-01",
  "name": "Sân bóng cỏ nhân tạo PTIT",
  "address": "Km10, Đường Nguyễn Trãi, Hà Đông, Hà Nội",
  "coordinates": [20.980, 105.787],
  "type": "Football",
  "price_per_hour": 300000
}

Bản PRD này đã bao quát đủ các yêu cầu "xương sống" cho dự án của bạn. Bạn có muốn mình đi sâu hơn vào thiết kế Database cho phần Tính giá theo khung giờ không?

Yêu cầu:
Lên kế hoạch thiết kế cơ sở dữ liệu database phù hợp với dự án