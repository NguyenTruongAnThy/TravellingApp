-- WanderStay - Supabase schema, đủ 7 bảng
-- Chạy lại trên cloud cũng an toàn vì có IF NOT EXISTS,
-- chỉ tạo bảng còn thiếu, không xóa bảng và dữ liệu đã có.

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT,
  place_type TEXT,
  price_per_night NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price_per_night BETWEEN 10 AND 250),
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
  admin_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
  status TEXT DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled', 'completed')),
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id),
  amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  place_id UUID REFERENCES public.places(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, place_id)
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID REFERENCES public.places(id),
  booking_id UUID REFERENCES public.bookings(id),
  user_id UUID REFERENCES public.users(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id),
  sender_id UUID REFERENCES public.users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_places_category ON public.places(category);
CREATE INDEX IF NOT EXISTS idx_places_is_visible ON public.places(is_visible);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_place ON public.bookings(place_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_place ON public.reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_messages_booking ON public.messages(booking_id);

ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cho phep doc danh sach places" ON public.places;
CREATE POLICY "Cho phep doc danh sach places"
ON public.places FOR SELECT TO anon, authenticated
USING (is_visible = true);

create or replace function public.update_place_rating()
returns trigger as $$
begin
  if tg_op = 'UPDATE' and old.place_id is distinct from new.place_id then
    update public.places
    set rating = coalesce((select round(avg(rating), 1) from public.reviews where place_id = old.place_id), 0),
        review_count = (select count(*) from public.reviews where place_id = old.place_id),
        updated_at = now()
    where id = old.place_id;
  end if;
  update public.places
  set rating = coalesce((select round(avg(rating), 1) from public.reviews where place_id = coalesce(new.place_id, old.place_id)), 0),
      review_count = (select count(*) from public.reviews where place_id = coalesce(new.place_id, old.place_id)),
      updated_at = now()
  where id = coalesce(new.place_id, old.place_id);
  return coalesce(new, old);
end;
$$ language plpgsql;

drop trigger if exists trg_update_place_rating on public.reviews;
create trigger trg_update_place_rating
after insert or update or delete on public.reviews
for each row execute function public.update_place_rating();
