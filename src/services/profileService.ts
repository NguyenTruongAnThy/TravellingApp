import { supabase } from '../lib/supabase';

export type ProfileCounts = {
  trips: number;
  reviews: number;
  wishlists: number;
};

export interface UserPersonalInfo {
  legalName: string;
  preferredName: string;
  gender: string;
  dob: string;
  email: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  address: string;
  nationality: string;
  avatar: string;
  isVerified: boolean;
  idApprovalDate: string;
}

export const DEFAULT_PERSONAL_INFO: UserPersonalInfo = {
  legalName: 'Alex Morgan',
  preferredName: 'Alex',
  gender: 'Prefer not to say',
  dob: 'May 14, 1992',
  email: 'alex.morgan@example.com',
  phone: '+1 (555) 234-5678',
  emergencyContactName: 'Sarah Morgan',
  emergencyContactRelation: 'Sister',
  emergencyContactPhone: '+1 (555) 876-5432',
  address: '742 Evergreen Terrace, Springfield, OR 97477, United States',
  nationality: 'United States',
  avatar:
    'https://api.builder.io/api/v1/image/assets/TEMP/3dee90d991ac09d4bdf61b1c226089b93db99a99?width=192',
  isVerified: true,
  idApprovalDate: 'April 12, 2024',
};

export async function getProfileCounts(userId: string): Promise<ProfileCounts> {
  const [bookings, reviews, favorites] = await Promise.all([
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .neq('status', 'cancelled'),
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
  const { data, error } = await supabase
    .from('users')
    .select('name, phone, email')
    .eq('id', userId)
    .single();
  if (error) return { data: null, error };
  return { data, error: null };
}

export async function saveProfile(
  userId: string,
  email: string,
  name: string,
  phone: string
) {
  const { error } = await supabase
    .from('users')
    .upsert({ id: userId, email, name: name.trim(), phone: phone.trim() || null });
  if (error) throw error;
}
