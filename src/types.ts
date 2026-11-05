export interface Place {
  id: string;
  title: string;
  location: string;
  category?: string | null;
  place_type?: string | null;
  price_per_night: number;
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
}

export interface Review {
  id: string;
  place_id?: string;
  booking_id?: string | null;
  user_id?: string;
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
  kayak_fee?: number;
  parking_fee?: number;
  total: number;
  payment_method?: 'pay_in_full' | 'pay_a_part_now';
  deposit_amount?: number | null;
  payment_status?: string;
  status: 'booked' | 'cancelled' | 'completed';
  cancelled_at?: string | null;
  cancel_reason?: string | null;
  created_at?: string;
  places?: Place | null;
}

export interface PaymentReceipt {
  id: string;
  booking_id: string;
  amount: number;
  payment_method?: string;
  paid_at?: string;
  receipt_number?: string;
  transaction_id?: string;
  billing_name?: string;
  billing_address?: string;
}

