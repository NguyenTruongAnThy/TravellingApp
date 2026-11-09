-- WanderStay - Supabase Schema Definition (Đầy đủ 9 bảng)
-- Kiến trúc đồng bộ chuẩn 100% với cơ sở dữ liệu thực tế trên Supabase Cloud.
-- Sử dụng IF NOT EXISTS và ADD COLUMN IF NOT EXISTS để đảm bảo tính an toàn (idempotent),
-- có thể chạy nhiều lần mà không làm mất dữ liệu hiện có.

-- 1. BẢNG USERS (Quản lý tài khoản & hồ sơ cá nhân)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url TEXT,
  preferred_name TEXT,
  gender TEXT,
  date_of_birth TEXT,
  emergency_contact_name TEXT,
  emergency_contact_relation TEXT,
  emergency_contact_phone TEXT,
  address TEXT,
  nationality TEXT,
  gov_id_status TEXT DEFAULT 'not_submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Đảm bảo bổ sung các cột mới nếu bảng users đã tồn tại từ trước
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferred_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS date_of_birth TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gov_id_status TEXT DEFAULT 'not_submitted';

-- 2. BẢNG PLACES (Danh mục phòng & chỗ ở nghỉ dưỡng)
CREATE TABLE IF NOT EXISTS public.places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT,
  place_type TEXT,
  price_per_night NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price_per_night BETWEEN 10 AND 250),
  original_price NUMERIC(10, 2),
  rooms INTEGER DEFAULT 1,
  beds INTEGER DEFAULT 1,
  guests_capacity INTEGER DEFAULT 1,
  amenities TEXT[] DEFAULT '{}'::TEXT[],
  images TEXT[] DEFAULT '{}'::TEXT[],
  description TEXT,
  check_in_time TEXT DEFAULT '14:00',
  check_out_time TEXT DEFAULT '12:00',
  rating NUMERIC(3, 1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  address TEXT,
  wifi_ssid TEXT,
  wifi_password TEXT,
  smart_lock_pin TEXT,
  host_name TEXT,
  host_phone TEXT,
  kayak_fee NUMERIC(10, 2) DEFAULT 0,
  parking_fee NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Đảm bảo bổ sung các cột mới nếu bảng places đã tồn tại từ trước
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2);
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS latitude NUMERIC(9, 6);
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS longitude NUMERIC(9, 6);
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS wifi_ssid TEXT;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS wifi_password TEXT;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS smart_lock_pin TEXT;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS host_name TEXT;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS host_phone TEXT;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS kayak_fee NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS parking_fee NUMERIC(10, 2) DEFAULT 0;

-- 3. BẢNG BOOKINGS (Đơn đặt phòng)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.users(id),
  place_id UUID REFERENCES public.places(id),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INTEGER NOT NULL,
  guests_adults INTEGER DEFAULT 1,
  guests_children INTEGER DEFAULT 0,
  price_per_night NUMERIC(10, 2) NOT NULL,
  kayak_fee NUMERIC(10, 2) DEFAULT 0,
  parking_fee NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('pay_in_full', 'pay_a_part_now')),
  deposit_amount NUMERIC(10, 2),
  payment_status TEXT DEFAULT 'simulated',
  promo_code TEXT,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled', 'completed')),
  pin_code TEXT,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pin_code TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0;

-- 4. BẢNG PAYMENT_RECEIPTS (Hóa đơn & Biên nhận thanh toán)
CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id),
  amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. BẢNG FAVORITES (Danh sách chỗ ở yêu thích - Thả tim)
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  place_id UUID REFERENCES public.places(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, place_id)
);

-- 6. BẢNG REVIEWS (Đánh giá nhận xét & chấm điểm)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID REFERENCES public.places(id),
  booking_id UUID REFERENCES public.bookings(id),
  user_id UUID REFERENCES public.users(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  helpful_count INTEGER DEFAULT 0,
  photos TEXT[] DEFAULT '{}'::TEXT[],
  reviewer_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reviewer_name TEXT;

-- 7. BẢNG MESSAGES (Tin nhắn trao đổi theo booking)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id),
  sender_id UUID REFERENCES public.users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. BẢNG COLLECTIONS (Bộ sưu tập phòng tùy chỉnh của người dùng)
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. BẢNG COLLECTION_ITEMS (Quan hệ nhiều-nhiều giữa Collection và Place)
CREATE TABLE IF NOT EXISTS public.collection_items (
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
  place_id UUID REFERENCES public.places(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, place_id)
);

-- TẠO CHỈ MỤC (INDEXES) TỐI ƯU HIỆU NĂNG TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_places_category ON public.places(category);
CREATE INDEX IF NOT EXISTS idx_places_place_type ON public.places(place_type);
CREATE INDEX IF NOT EXISTS idx_places_is_visible ON public.places(is_visible);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_place ON public.bookings(place_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_booking ON public.payment_receipts(booking_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_place ON public.reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_messages_booking ON public.messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_collections_user ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON public.collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_place ON public.collection_items(place_id);

-- CẤU HÌNH ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- POLICIES CHO PHÉP TRUY VẤN CƠ BẢN
DROP POLICY IF EXISTS "Cho phep doc danh sach places" ON public.places;
CREATE POLICY "Cho phep doc danh sach places"
ON public.places FOR SELECT TO anon, authenticated
USING (is_visible = true);

DROP POLICY IF EXISTS "Cho phep doc thong tin user" ON public.users;
CREATE POLICY "Cho phep doc thong tin user"
ON public.users FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Cho phep them/sua user profile" ON public.users;
CREATE POLICY "Cho phep them/sua user profile"
ON public.users FOR ALL TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Cho phep doc review cong khai" ON public.reviews;
CREATE POLICY "Cho phep doc review cong khai"
ON public.reviews FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Cho phep thanh vien viet review" ON public.reviews;
CREATE POLICY "Cho phep thanh vien viet review"
ON public.reviews FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Cho phep quan ly favorites ca nhan" ON public.favorites;
CREATE POLICY "Cho phep quan ly favorites ca nhan"
ON public.favorites FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Cho phep quan ly bookings ca nhan" ON public.bookings;
CREATE POLICY "Cho phep quan ly bookings ca nhan"
ON public.bookings FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Cho phep quan ly collections ca nhan" ON public.collections;
CREATE POLICY "Cho phep quan ly collections ca nhan"
ON public.collections FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Cho phep quan ly collection_items ca nhan" ON public.collection_items;
CREATE POLICY "Cho phep quan ly collection_items ca nhan"
ON public.collection_items FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.collections c
    WHERE c.id = collection_items.collection_id AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.collections c
    WHERE c.id = collection_items.collection_id AND c.user_id = auth.uid()
  )
);

-- 10. BẢNG PROMOTIONS (Mã khuyến mại & Voucher)
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL,
  min_order_amount NUMERIC(10, 2) DEFAULT 0,
  max_discount_amount NUMERIC(10, 2),
  valid_until TIMESTAMPTZ,
  usage_limit INTEGER DEFAULT 100,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cho phep doc ma khuyen mai" ON public.promotions;
CREATE POLICY "Cho phep doc ma khuyen mai"
ON public.promotions FOR SELECT TO anon, authenticated
USING (is_active = true);

-- Chèn dữ liệu mẫu các mã khuyến mại
INSERT INTO public.promotions (code, title, description, discount_type, discount_value, min_order_amount, max_discount_amount, is_active)
VALUES
  ('WANDER10', 'Giảm 10% thành viên mới', 'Giảm 10% cho mọi đơn đặt phòng (tối đa $30 USD)', 'percentage', 10, 0, 30, true),
  ('WELCOME20', 'Ưu đãi chào mừng', 'Giảm ngay $20 USD cho đơn đặt phòng từ $40 USD trở lên', 'fixed', 20, 40, NULL, true),
  ('BALI50', 'Khám phá Bali', 'Giảm trực tiếp $50 USD cho kỳ nghỉ tuyệt vời từ $100 USD', 'fixed', 50, 100, NULL, true),
  ('SUMMER2026', 'Mùa hè rực rỡ', 'Giảm 15% tổng chi phí cho kỳ nghỉ hè (tối đa $50 USD)', 'percentage', 15, 0, 50, true)
ON CONFLICT (code) DO UPDATE 
SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  min_order_amount = EXCLUDED.min_order_amount,
  max_discount_amount = EXCLUDED.max_discount_amount,
  is_active = EXCLUDED.is_active;

-- TRIGGER TỰ ĐỘNG TÍNH LẠI RATING VÀ REVIEW_COUNT TRÊN BẢNG PLACES (BR07)
CREATE OR REPLACE FUNCTION public.update_place_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.place_id IS DISTINCT FROM NEW.place_id THEN
    UPDATE public.places
    SET rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM public.reviews WHERE place_id = OLD.place_id), 0),
        review_count = (SELECT COUNT(*) FROM public.reviews WHERE place_id = OLD.place_id),
        updated_at = now()
    WHERE id = OLD.place_id;
  END IF;

  UPDATE public.places
  SET rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM public.reviews WHERE place_id = COALESCE(NEW.place_id, OLD.place_id)), 0),
      review_count = (SELECT COUNT(*) FROM public.reviews WHERE place_id = COALESCE(NEW.place_id, OLD.place_id)),
      updated_at = now()
  WHERE id = COALESCE(NEW.place_id, OLD.place_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_place_rating ON public.reviews;
CREATE TRIGGER trg_update_place_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_place_rating();
