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
Admin trả lời Inbox bằng cách insert một dòng vào bảng messages trong
Table Editor, với booking_id là booking cần trả lời, sender_id là id
của tài khoản Admin, content là nội dung trả lời, is_read = false lúc đầu.

UC001 Đăng ký, UC002 Đăng nhập / Đăng xuất, UC003 Tìm kiếm,
UC004 Lọc (extend UC003), UC005 Xem chi tiết, UC006 Xem đánh giá (extend UC005),
UC007 Hồ sơ, UC008 Yêu thích, UC009 Đặt phòng,
UC010 Chọn hình thức thanh toán (include UC009),
UC011 Tải PDF (extend UC009), UC012 Quản lý booking (của tôi),
UC013 Viết đánh giá (extend UC012), UC014 Inbox với Admin theo booking,
UC015 Admin tạo / sửa / xóa chỗ ở, UC016 Admin quản lý người dùng,
UC017 Admin kiểm tra booking.

Admin là tác nhân độc lập, không kế thừa quyền của Guest và Member,
không sử dụng UC001–UC014 trong app mobile.

Sau này: AI chat, đa ngôn ngữ, Dark mode, bản đồ chi tiết, gợi ý tương tự.

Pay a part now: cọc 30% tổng tiền, một tỷ lệ duy nhất toàn hệ thống,
deposit_amount = round(total * 0.30, 2), phần còn lại là total - deposit_amount.

Hủy: trước check-in từ 24 giờ trở lên thì miễn phí, trong vòng 24 giờ
trước check-in thì mất 1 đêm bằng price_per_night, thời điểm check-in
tính theo ngày check_in lúc 14:00. Không thêm cột cancellation_fee,
phí hủy tính lại khi cần hiển thị.


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
supabase/schema.sql
supabase/seed.sql

## Điều hướng

Dự án này dùng React Navigation qua AppNavigator, không dùng Expo Router
trong project này, vì nhóm đã chốt React Navigation từ đầu và đổi sang
Router lúc này phải làm lại toàn bộ điều hướng, không kịp deadline.
Bottom nav: Search, My lists, Booking, Inbox, Profile.
`App.tsx` bọc `AuthProvider` quanh `AppNavigator`.
`index.ts` giữ nguyên `registerRootComponent(App)`.
`App.tsx` là default export.

AuthProvider phải có `loading`, để màn Login không nháy lên trước khi
khôi phục session. Khi `loading` còn true thì hiện màn chờ,
hết `loading` mới chọn MainTabs hay AuthStack theo session.

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
`babel.config.js` có cả `babel-preset-expo` và `nativewind/babel`.

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
Lọc giá $10–$250, giá 10 và 250 được lấy, giá 9 và 251 bị loại.
Chỗ ở chỉ HIỆN / ẨN (is_visible).
Trùng lịch trước khi tạo booking thì báo 409.
Mã lỗi: 401, 403, 404, 409.
DB chỉ lưu link ảnh, file ảnh lưu ở Supabase Storage, bucket places-images.
Review và Inbox chỉ chữ, không ảnh.
Chỉ dùng anon key qua EXPO_PUBLIC_SUPABASE_URL và EXPO_PUBLIC_SUPABASE_ANON_KEY.
File `.env` thật không commit, chỉ commit `.env.example` dạng placeholder.

amenities và images là text[], không phải jsonb.
Supabase JS trả về mảng JS sẵn, không cần parse.

places.rating và review_count chỉ do trigger trong Postgres tự tính lại
từ bảng reviews, service chỉ insert review, không tự sửa rating và
review_count trong bảng places.

is_read là người nhận đã đọc hay chưa. Tin nhắn khách gửi Admin bắt đầu
là false, Admin đọc trong Table Editor rồi tự đổi thành true.
Tin nhắn Admin gửi khách bắt đầu là false, khi khách mở Inbox của đúng
booking đó trong app thì app đổi các tin nhắn từ người gửi khác mà
is_read = false thành true.

Chỉ seed bảng places trước, gồm Balian, Kuta, Ubud.
Các bảng users, bookings, payment_receipts, favorites, reviews, messages
chỉ tạo cột, để trống, dòng chỉ hình thành khi app thao tác thật.

Lưu ý: file schema trên repo có bật RLS, nhưng bảng trên cloud hiện tại
vẫn đang RLS disabled, nên chưa được nói là cloud đã khớp với repo,
cần kiểm tra lại trước khi demo phần bảo mật.

## Thứ tự code và chia việc

Thy: AuthContext, AppNavigator, Đăng nhập, Đăng ký,
Tìm kiếm, Lọc, Xem chi tiết.
Trọng làm trên nhánh riêng, không làm trên main: Yêu thích, Đặt phòng, Chọn thanh toán, Tải PDF, Quản lý booking, Viết đánh giá, Inbox.

Không tự merge pull request, không dùng git push --force trên repo nhóm.

## Checklist trước khi báo xong

1. Có đủ `src/`, không có `src/app/`, không có import từ `expo-router`.
2. `App.tsx` đã nối AuthProvider và AppNavigator, đã import `global.css` ở dòng đầu.
3. `index.ts` giữ `registerRootComponent(App)`, `App.tsx` là default export.
4. `babel.config.js` có cả `babel-preset-expo` và `nativewind/babel`.
5. `.env.example` có đủ 2 biến, file `.env` thật không được commit, kiểm tra `.gitignore`.
6. `supabase/schema.sql` có đủ 7 bảng và trigger tính rating.
7. Mọi service chỉ dùng đúng field ở trên, mọi import đều trỏ tới file có thật.
8. AuthProvider có `loading`, không để màn Login nháy lên trước khi khôi phục session.
9. Search debounce 400ms, lọc giá $10–$250, test biên 10 và 250 được lấy, 9 và 251 bị loại.
10. `ref_code` là duy nhất, dạng WS-ngày-4 ký tự, nếu Postgres báo trùng mã 23505 thì tạo lại và thử lại 1–2 lần.
11. Không có số tiền cọc hay chính sách hủy tự bịa.
12. Chạy `npx tsc --noEmit` sạch và `npx expo-doctor` rồi mới báo xong.
