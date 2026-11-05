import { supabase } from '../lib/supabase';

export type ProfileCounts = {
  trips: number;
  reviews: number;
  wishlists: number;
};

export async function getProfileCounts(userId: string): Promise<ProfileCounts> {
  const [bookings, reviews, favorites] = await Promise.all([
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('user_id', userId).neq('status', 'cancelled'),
    supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ]);

  if (bookings.error || reviews.error || favorites.error) {
    throw new Error('Failed to load profile counts.');
  }

  return {
    trips: bookings.count || 0,
    reviews: reviews.count || 0,
    wishlists: favorites.count || 0,
  };
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase.from('users').select('name, phone, email').eq('id', userId).single();
  if (error) return { data: null, error };
  return { data, error: null };
}

export async function saveProfile(userId: string, email: string, name: string, phone: string) {
  const { error } = await supabase
    .from('users')
    .upsert({ id: userId, email, name: name.trim(), phone: phone.trim() || null });
  if (error) throw error;
}
