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
    if (error) {
      // Auto-heal: If foreign key 23503 failed because user profile row was missing in public.users
      if ((error as any).code === '23503') {
        try {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user) {
            await supabase.from('users').upsert({
              id: userId,
              email: authData.user.email || '',
              name: authData.user.user_metadata?.name || (authData.user.email ? authData.user.email.split('@')[0] : 'User'),
              role: 'user',
            });
            const { error: retryError } = await supabase.from('favorites').insert({ user_id: userId, place_id: placeId });
            if (retryError) throw retryError;
            return;
          }
        } catch {
          // If auto-heal fails, throw original error
          throw error;
        }
      }
      throw error;
    }
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
