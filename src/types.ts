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
  reviewer_name?: string | null;
  rating: number;
  comment?: string | null;
  photos?: string[];
  helpful_count?: number;
  created_at?: string;
  users?: { name?: string | null } | null;
}
