import { supabase } from '../lib/supabase';
import type { Place } from '../types';

// Explicit column list so latitude/longitude (added on Supabase for the
// interactive map) are always returned, instead of relying on select('*').
const PLACE_COLUMNS =
  'id, title, location, category, place_type, price_per_night, original_price, rooms, beds, guests_capacity, amenities, images, description, check_in_time, check_out_time, rating, review_count, is_visible, latitude, longitude';

export async function getPlaces({ place_type = null, limit = 100 }: { place_type?: string | null; limit?: number } = {}): Promise<{ data: Place[] | null; error: unknown }> {
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


export async function getRelatedPlaces(
  currentPlace: Place,
  limit = 6
): Promise<{ data: (Place & { matchReason?: string })[] | null; error: unknown }> {
  try {
    const { data: allPlaces, error } = await supabase
      .from('places')
      .select(PLACE_COLUMNS)
      .eq('is_visible', true)
      .neq('id', currentPlace.id)
      .limit(60);

    if (error || !allPlaces) return { data: [], error };

    const isVnCurrent =
      (currentPlace.location || '').toLowerCase().includes('việt nam') ||
      (currentPlace.location || '').toLowerCase().includes('vietnam');
    const currentType = (currentPlace.place_type || currentPlace.category || '').toLowerCase();
    const currentPrice = Number(currentPlace.price_per_night) || 50;
    const currentCity = (currentPlace.location || '').split(',')[0]?.trim().toLowerCase();

    const scored = (allPlaces as Place[]).map((item) => {
      let score = 0;
      const reasons: string[] = [];
      const itemLocation = (item.location || '').toLowerCase();
      const isVnItem =
        itemLocation.includes('việt nam') || itemLocation.includes('vietnam');

      // 1. Cùng quốc gia / khu vực
      if (isVnCurrent === isVnItem) {
        score += 4;
        reasons.push(isVnCurrent ? 'Cùng tại Việt Nam' : 'Cùng tại Bali');
      }

      // 2. Cùng tiểu vùng / thành phố
      if (currentCity && itemLocation.includes(currentCity)) {
        score += 3;
        reasons.push('Cùng khu vực');
      }

      // 3. Cùng loại phòng (place_type)
      const itemType = (item.place_type || item.category || '').toLowerCase();
      if (currentType && itemType === currentType) {
        score += 3;
        reasons.push(`Cùng kiểu ${currentPlace.place_type || 'chỗ nghỉ'}`);
      }

      // 4. Giá tương đồng (chênh lệch dưới 45%)
      const itemPrice = Number(item.price_per_night) || 50;
      if (Math.abs(itemPrice - currentPrice) / currentPrice <= 0.45) {
        score += 2;
        reasons.push('Khoảng giá tương đồng');
      }

      // 5. Điểm đánh giá cao
      if (item.rating != null && Number(item.rating) >= 4.8) {
        score += 1;
      }

      return {
        item: {
          ...item,
          matchReason: reasons.slice(0, 2).join(' • ') || 'Chỗ nghỉ gợi ý',
        },
        score,
      };
    });

    scored.sort(
      (a, b) =>
        b.score - a.score ||
        (Number(b.item.rating) || 0) - (Number(a.item.rating) || 0)
    );

    return { data: scored.slice(0, limit).map((s) => s.item), error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}
