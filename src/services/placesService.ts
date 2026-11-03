import { supabase } from '../lib/supabase';
import type { Place } from '../types';

export async function getPlaces({ category = null, limit = 50 }: { category?: string | null; limit?: number } = {}): Promise<{ data: Place[] | null; error: unknown }> {
  try {
    let query = supabase
      .from('places')
      .select('*')
      .eq('is_visible', true)
      .order('rating', { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
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
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}
