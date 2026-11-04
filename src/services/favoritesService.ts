import { supabase } from '../lib/supabase';
import type { Place } from '../types';

export async function getFavoritePlaceIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('favorites').select('place_id').eq('user_id', userId);
  if (error) throw error;
  return (data || []).map((row: any) => row.place_id as string);
}

export async function toggleFavorite(userId: string, placeId: string, isFavorite: boolean): Promise<void> {
  if (isFavorite) {
    const { error } = await supabase.from('favorites').delete().eq('user_id', userId).eq('place_id', placeId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('favorites').insert({ user_id: userId, place_id: placeId });
    if (error) throw error;
  }
}

export async function getFavoritePlaces(userId: string): Promise<Place[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('place_id, places(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const places: Place[] = [];
  (data || []).forEach((row: any) => {
    if (row.places) places.push(row.places as Place);
  });
  return places;
}
