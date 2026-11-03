-- ===================================================
-- WANDERSTAY - SUPABASE SCHEMA DEFINITION
-- Bảng public.places lưu thông tin các địa điểm lưu trú
-- ===================================================

CREATE TABLE IF NOT EXISTS public.places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT,
  place_type TEXT,
  price_per_night NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  rooms INTEGER DEFAULT 1,
  beds INTEGER DEFAULT 1,
  guests_capacity INTEGER DEFAULT 1,
  amenities TEXT[] DEFAULT '{}'::TEXT[],
  images TEXT[] DEFAULT '{}'::TEXT[],
  description TEXT,
  check_in_time TEXT DEFAULT '14:00',
  check_out_time TEXT DEFAULT '12:00',
  rating NUMERIC(3, 1) DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

-- Bật Row Level Security (RLS) để bảo mật
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

-- Tạo chính sách cho phép người dùng (cả khách ẩn danh) đọc danh sách phòng
DROP POLICY IF EXISTS "Cho phep doc danh sach places" ON public.places;
CREATE POLICY "Cho phep doc danh sach places"
ON public.places
FOR SELECT
TO anon, authenticated
USING (is_visible = true);

-- Index tối ưu tìm kiếm theo danh mục và vị trí
CREATE INDEX IF NOT EXISTS idx_places_category ON public.places(category);
CREATE INDEX IF NOT EXISTS idx_places_is_visible ON public.places(is_visible);

