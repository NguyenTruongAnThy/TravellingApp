# WanderStay

App di động cho khách thuê tìm và đặt chỗ ở, làm bằng Expo + React Native
+ TypeScript + NativeWind, backend thật là Supabase.

App mobile chỉ làm UC001–UC014 cho khách, từ Đăng ký, Đăng nhập,
Tìm kiếm, Lọc, Xem chi tiết, Yêu thích, Đặt phòng, Thanh toán mô phỏng,
Tải PDF, Quản lý booking, Viết đánh giá, Inbox, Hồ sơ.
UC015–UC017 của Admin chỉ nằm trong tài liệu, không có màn Admin trong app.

## Chạy app

1. Copy `.env.example` thành `.env`, điền URL và anon key thật của project
   vào file `.env` trên máy mình, không commit file `.env`.
2. Chạy `npm ci`.
3. Chạy `npx expo start -c`.

## Dữ liệu mẫu

Chỉ seed bảng `places` trước, gồm Balian, Kuta, Ubud, bằng file
`supabase/seed.sql` chạy trong Supabase SQL Editor.
Các bảng còn lại để trống, dữ liệu chỉ tạo ra khi đăng ký, đặt phòng,
thanh toán, bấm yêu thích, viết đánh giá hay nhắn tin trong app.

## Quy tắc đã chốt

- Pay a part now: cọc 30% tổng tiền, một tỷ lệ duy nhất toàn hệ thống,
  deposit_amount = round(total * 0.30, 2), phần còn lại là
  total - deposit_amount, trả khi nhận phòng theo mô phỏng.
- Hủy: trước check-in từ 24 giờ trở lên thì miễn phí, trong vòng 24 giờ
  trước check-in thì mất 1 đêm bằng price_per_night, thời điểm check-in
  tính theo ngày check_in lúc 14:00. Không thêm cột cancellation_fee.
- places.rating và review_count chỉ do trigger trong Postgres tự tính lại
  từ bảng reviews, service chỉ insert review, không tự sửa 2 cột này.

## Admin làm thủ công trong Supabase Table Editor

- Tạo / ẩn chỗ ở: sửa bảng `places`, đổi `is_visible`.
- Trả lời Inbox: insert một dòng vào bảng `messages`, với `booking_id`
  là booking cần trả lời, `sender_id` là id của tài khoản Admin,
  `content` là nội dung trả lời, `is_read` lúc đầu là false.
