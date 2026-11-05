import { supabase } from '../lib/supabase';
import type { Place } from '../types';

// Explicit column list so latitude/longitude (added on Supabase for the
// interactive map) are always returned, instead of relying on select('*').
const PLACE_COLUMNS =
  'id, title, location, category, place_type, price_per_night, rooms, beds, guests_capacity, amenities, images, description, check_in_time, check_out_time, rating, review_count, is_visible, latitude, longitude';

export async function getPlaces({ place_type = null, limit = 50 }: { place_type?: string | null; limit?: number } = {}): Promise<{ data: Place[] | null; error: unknown }> {
  try {
    let query = supabase
      .from('places')
      .select(PLACE_COLUMNS)
      .eq('is_visible', true)
      .order('rating', { ascending: false })
      .limit(limit);

    if (place_type) {
      query = query.eq('place_type', place_type);
    }

    const { data, error } = await query;
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function getPlaceById(id: string): Promise<{ data: Place | null; error: unknown }> {
  try {
    const { data, error } = await supabase
      .from('places')
      .select(PLACE_COLUMNS)
      .eq('id', id)
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}
