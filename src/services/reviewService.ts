import { supabase } from '../lib/supabase';
import type { Review } from '../types';

export async function getReviewsByPlace(
  placeId: string,
): Promise<{ data: Review[] | null; error: unknown }> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, user_id, users(name)')
      .eq('place_id', placeId)
      .order('created_at', { ascending: false })
      .limit(50);
    return { data: (data as Review[] | null) ?? null, error };
  } catch (err) {
    return { data: null, error: err };
  }
}
