export interface Place {
  id: string;
  title: string;
  location: string;
  category?: string | null;
  place_type?: string | null;
  price_per_night: number;
  original_price?: number | null;
  rooms?: number;
  beds?: number;
  guests_capacity?: number;
  amenities?: string[];
  images?: string[];
  description?: string | null;
  check_in_time?: string;
  check_out_time?: string;
  rating?: number;
  review_count?: number;
  is_visible?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  wifi_ssid?: string | null;
  wifi_password?: string | null;
  smart_lock_pin?: string | null;
  host_name?: string | null;
  host_phone?: string | null;
  kayak_fee?: number | null;
  parking_fee?: number | null;
}

export interface Collection {
  id: string;
  user_id?: string;
  name: string;
  created_at?: string;
}

export interface Review {
  id: string;
  place_id?: string;
  booking_id?: string | null;
  user_id?: string;
  reviewer_name?: string | null;
  rating: number;
  comment?: string | null;
  photos?: string[];
  helpful_count?: number;
  created_at?: string;
  users?: { name?: string | null } | null;
}


export interface Booking {
  id: string;
  ref_code: string;
  user_id?: string;
  place_id: string;
  check_in: string;
  check_out: string;
  nights: number;
  guests_adults?: number;
  guests_children?: number;
  price_per_night: number;
  original_price?: number | null;
  kayak_fee?: number;
  parking_fee?: number;
  total: number;
  payment_method?: 'pay_in_full' | 'pay_a_part_now';
  deposit_amount?: number | null;
  payment_status?: string;
  promo_code?: string | null;
  discount_amount?: number;
  status: 'booked' | 'cancelled' | 'completed';
  pin_code?: string | null;
  cancelled_at?: string | null;
  cancel_reason?: string | null;
  created_at?: string;
  places?: Place | null;
}

export interface Promotion {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number | null;
  valid_until?: string | null;
  usage_limit?: number;
  used_count?: number;
  is_active: boolean;
  /** Phạm vi áp dụng (vd 'Bali'): null/rỗng = áp cho mọi nơi */
  applicable_location?: string | null;
  created_at?: string;
}
