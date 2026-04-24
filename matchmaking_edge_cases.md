# Matchmaking (Ghép Kèo) - Phân tích các trường hợp biên (Edge Cases)

Tài liệu này liệt kê các tình huống thực tế và logic xử lý đề xuất cho chức năng Ghép kèo (Matchmaking) trong ứng dụng Alobo.

---

## I. Nhóm Quyền hạn & Quan hệ người dùng
| STT | Trường hợp (Case) | Mô tả tình huống | Logic xử lý đề xuất |
| :-- | :--- | :--- | :--- |
| 1 | **Chủ kèo tự xem kèo mình** | Host truy cập bản đồ "Tìm kèo" và thấy chính sân mình đang mở ghép. | Đổi màu Marker. Click vào sẽ hiện nút "Quản lý kèo" thay vì "Xin tham gia". |
| 2 | **Xin lại kèo đã bị từ chối** | Người chơi bị Host từ chối cố tình bấm xin lại vào chính kèo đó. | Disable nút bấm. Hiện text "Yêu cầu bị từ chối". Chặn gọi API ở Backend. |
| 3 | **Người chơi quen (Loyalty)** | Người tham gia đã từng tham gia và hoàn thành tốt các kèo trước đó của cùng một Host. | Hiển thị Badge "Người quen" hoặc số lần đã chơi cùng để Host dễ tin tưởng duyệt. |
| 4 | **Chủ kèo không thể tự xin** | Người dùng cố tình dùng API để xin tham gia vào kèo do chính mình tạo. | Backend chặn lỗi 403. Giao diện ẩn hoàn toàn các tương tác kịch bản này. |

---

## II. Nhóm Vòng đời & Hủy bỏ (Cancellations)
| STT | Trường hợp (Case) | Mô tả tình huống | Logic xử lý đề xuất |
| :-- | :--- | :--- | :--- |
| 5 | **Hủy Booking chủ thể** | Host hủy lịch đặt sân gốc (Booking). | Hệ thống tự động chuyển trạng thái Match sang `CANCELLED`. Notify FCM cho tất cả member liên quan. |
| 6 | **Chủ kèo chủ động hủy kèo** | Lịch đặt sân vẫn giữ, nhưng Host không muốn ghép thêm người nữa. | Chuyển Match sang `CmuốnANCELLED`. Giải phóng tất cả người đã được duyệt. |
| 7 | **Rút lui (Trạng thái Chờ)** | Người chơi hủy yêu cầu khi Host chưa bấm duyệt. | Xóa yêu cầu khỏi danh sách chờ của Host. Không thông báo cho Host để tránh phiền. |
| 8 | **Rút lui (Trạng thái Đã Duyệt)** | Người chơi đã được chấp nhận nhưng đột ngột bận không đi được. | Cập nhật `slots_filled -= 1`. Thông báo ngay cho Host để tìm người thay thế. |
| 9 | **Đuổi thành viên (Kick)** | Host  loại bỏ một người đã duyệt trước đó (do phát hiện lịch sử xấu). | Xóa quan hệ Participant. Slot trống lại. Thông báo lý do cho người bị loại. |

---

## III. Nhóm Xung đột lịch trình (Conflicts)
| STT | Trường hợp (Case) | Mô tả tình huống | Logic xử lý đề xuất |
| :-- | :--- | :--- | :--- |
| 10 | **Trùng lịch thi đấu** | Người dùng xin tham gia 2 kèo có khung giờ chồng lấn (ví dụ Kèo A: 18h-20h, Kèo B: 19h-21h). | Cảnh báo: "Bạn đã có yêu cầu/lịch thi đấu khác trong khung giờ này". |
| 11 | **Kèo quá hạn (Expired)** | Kèo vẫn còn trống slot nhưng giờ thi đấu đã trôi qua. | Tự động ẩn khỏi bản đồ. Chuyển Match sang trạng thái `COMPLETED` hoặc `ARCHIVED`. |

---

## IV. Nhóm Kỹ thuật & Hệ thống
| STT | Trường hợp (Case) | Mô tả tình huống | Logic xử lý đề xuất |
| :-- | :--- | :--- | :--- |
| 12 | **Nhiều yêu cầu giữa 2 người** | Người chơi A xin tham gia Kèo 1 (Bị từ chối), sau đó xin tham gia Kèo 2 của cùng Host B. | Gộp chung vào 1 hội thoại duy nhất. Yêu cầu mới hiện ra như một "Card" thông tin trong luồng chat. |

---

## V. Quy tắc Gộp hội thoại (Persistent Chat Logic)
Để tránh làm rác danh sách tin nhắn khi người dùng tương tác nhiều lần, hệ thống áp dụng quy tắc sau:

1. **Duy nhất một ChatRoom**: Kiểm tra sự tồn tại của ChatRoom giữa User A và User B trước khi tạo mới. Nếu đã có, dùng lại ID cũ.
2. **Context theo MatchRequest**: Mỗi tin nhắn xin tham gia kèo mới sẽ được gửi vào ChatRoom dưới dạng **System Content**.
3. **Hiển thị Priority**: Trong danh sách tin nhắn, hội thoại sẽ được đẩy lên đầu nếu có **bất kỳ** yêu cầu nào đang ở trạng thái `PENDING`.
4. **Hết hạn & Đóng**: Hội thoại sẽ tự động bị ẩn khỏi danh sách "Hoạt động" nếu tất cả các yêu cầu bên trong đã kết thúc (Hoàn thành/Từ chối) quá 7 ngày.
