# WanderStay

App di động React Native + Expo cho khách thuê tìm và đặt chỗ ở.
Backend là Supabase (Postgres + Auth + Storage).
Thanh toán chỉ mô phỏng, không giao dịch thẻ thật.

## Tác nhân và Use Case

App mobile chỉ làm UC001–UC014.
UC015–UC017 chỉ nằm trong tài liệu, không viết màn Admin trong app,
không thêm tab Admin.
Tạo / ẩn chỗ ở làm thủ công trong Supabase Table Editor ở bảng places,
đổi is_visible.

UC001 Đăng ký, UC002 Đăng nhập / Đăng xuất, UC003 Tìm kiếm,
UC004 Lọc (extend UC003), UC005 Xem chi tiết, UC006 Xem đánh giá (extend UC005),
UC007 Hồ sơ, UC008 Yêu thích, UC009 Đặt phòng,
UC010 Chọn hình thức thanh toán (include UC009),
UC011 Tải PDF (extend UC009), UC012 Quản lý booking,
UC013 Viết đánh giá (extend UC012), UC014 Inbox với Admin theo booking,
UC015 Admin tạo / sửa / xóa chỗ ở, UC016 Admin quản lý người dùng,
UC017 Admin quản lý booking.

Sau này: AI chat, đa ngôn ngữ, Dark mode, bản đồ chi tiết, gợi ý tương tự.
Chưa chốt: tỷ lệ / số tiền cọc của Pay a part now, thời hạn / phí hủy.
Để trống, không tự bịa số.

## Cấu trúc

Mọi file code đều nằm trong `src/`.
Thư mục `supabase/` nằm ở gốc, không nằm trong `src/`.

src/
lib/supabase.ts
services/placesService.ts, authService.ts, bookingsService.ts,
favoritesService.ts, reviewsService.ts, inboxService.ts, pricing.ts
context/AuthContext.tsx
navigation/AppNavigator.tsx
screens/ (auth, search, place, booking, favorites, inbox, profile)
components/ (Button, Card, PriceDetails, PlaceCard, EmptyState)
theme/colors.ts
utils/format.ts, errors.ts
types.ts
supabase/migrations/20261102000000_wanderstay.sql
supabase/seed.sql




## Điều hướng

Dự án này dùng React Navigation qua AppNavigator, không dùng Expo Router
trong project này, vì nhóm đã chốt React Navigation từ đầu và đổi sang
Router lúc này phải làm lại toàn bộ điều hướng, không kịp deadline.
Bottom nav: Search, My lists, Booking, Inbox, Profile.
`App.tsx` bọc `AuthProvider` quanh `AppNavigator`.
`index.ts` giữ nguyên `registerRootComponent(App)`.

## Styling

Styling của dự án này là NativeWind, không thêm Tamagui hay thư viện
styling khác, để tránh trộn nhiều hệ thống styling trong một app.
NativeWind 4.2.7 + tailwindcss 3.4.19.
`App.tsx` import `./global.css` ở dòng đầu tiên.
Bảng màu: brand #4F46E5, brandPurple #7C5CFC, dealAmber #FFB020,
appBg #F8F7FF, cardBg #FFFFFF, textMain #131B2E, textMuted #5A6478,
borderLight #E6E3F5, inactive #8A90A6.
Màn mới viết bằng `className`.
Chỉ giữ `style` cho `contentContainerStyle` của FlatList.
`babel.config.js` có `babel-preset-expo`.

## Supabase

- users: id, email, phone, name, role (user / admin), avatar_url, created_at
- places: id, title, location, category, place_type, price_per_night,
  rooms, beds, guests_capacity, amenities, images, description,
  check_in_time (14:00), check_out_time (12:00), rating, review_count,
  is_visible, admin_id, created_at, updated_at
- bookings: id, ref_code, user_id, place_id, check_in, check_out, nights,
  guests_adults, guests_children, price_per_night, kayak_fee, parking_fee,
  total, payment_method (pay_in_full / pay_a_part_now), deposit_amount,
  payment_status, status (booked / cancelled / completed),
  cancelled_at, cancel_reason, created_at
- payment_receipts: id, booking_id, amount, payment_method, paid_at
- favorites: id, user_id, place_id, created_at
- reviews: id, place_id, booking_id, user_id, rating, comment, created_at
- messages: id, booking_id, sender_id, content, is_read, created_at

Màn hình không gọi Supabase trực tiếp, chỉ gọi qua `src/services/`.
Giá: total = price_per_night * nights + kayak_fee + parking_fee.
Ví dụ Balian: $20 x 1 đêm + $5 Kayak + $5 Street parking = $30.
Lọc giá $10–$250. Chỗ ở chỉ HIỆN / ẨN (is_visible).
Trùng lịch trước khi tạo booking thì báo 409.
Mã lỗi: 401, 403, 404, 409.
DB chỉ lưu link ảnh, file ảnh lưu ở Supabase Storage, bucket places-images.
Review và Inbox chỉ chữ, không ảnh.
Chỉ dùng anon key qua EXPO_PUBLIC_SUPABASE_URL và EXPO_PUBLIC_SUPABASE_ANON_KEY.
File `.env` thật không commit, chỉ commit `.env.example` dạng placeholder.

## Checklist trước khi báo xong

1. Có đủ `src/`, không có `src/app/`, không có import từ `expo-router`.
2. `App.tsx` đã nối AuthProvider và AppNavigator, đã import `global.css`.
3. Mọi service chỉ dùng đúng field ở trên.
4. `supabase/migrations/` có file SQL thật, đủ 7 bảng.
5. Mọi import đều trỏ tới file có thật trong project.
6. Không có số tiền cọc hay chính sách hủy tự bịa.
7. Chạy `npx tsc --noEmit` sạch rồi mới báo xong.