import { supabase } from '../lib/supabase';
import type { Review } from '../types';

export async function getReviewsByPlace(
  placeId: string,
): Promise<{ data: Review[] | null; error: unknown }> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, rating, comment, photos, helpful_count, created_at, user_id, reviewer_name, users(name)')
      .eq('place_id', placeId)
      .order('created_at', { ascending: false })
      .limit(50);
    return { data: (data as Review[] | null) ?? null, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function incrementHelpful(reviewId: string, currentCount: number): Promise<{ error: unknown }> {
  try {
    const { error } = await supabase
      .from('reviews')
      .update({ helpful_count: currentCount + 1 })
      .eq('id', reviewId);
    return { error };
  } catch (err) {
    return { error: err };
  }
}

export async function uploadReviewPhotos(
  placeId: string,
  userId: string,
  photoUris: string[],
): Promise<{ urls: string[]; error: unknown }> {
  try {
    const urls: string[] = [];
    for (let i = 0; i < photoUris.length; i += 1) {
      const uri = photoUris[i];
      const response = await fetch(uri);
      const blob = await response.blob();
      const path = `${placeId}/${userId}/${Date.now()}-${i}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('review-photos')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: false });
      if (uploadError) return { urls: [], error: uploadError };
      const { data: publicUrl } = supabase.storage.from('review-photos').getPublicUrl(path);
      if (publicUrl?.publicUrl) urls.push(publicUrl.publicUrl);
    }
    return { urls, error: null };
  } catch (err) {
    return { urls: [], error: err };
  }
}

export async function createReview(
  placeId: string,
  userId: string,
  rating: number,
  comment: string,
  photos: string[] = [],
): Promise<{ data: Review | null; error: unknown }> {
  try {
    // Reviewer display name comes from the signed-in user's profile row, if it exists.
    let reviewerName: string | null = null;
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .maybeSingle();
      reviewerName = profile?.name ?? null;
    } catch {
      reviewerName = null;
    }
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        place_id: placeId,
        user_id: userId,
        rating,
        comment,
        helpful_count: 0,
        photos,
        reviewer_name: reviewerName,
      })
      .select('id, rating, comment, photos, helpful_count, created_at, user_id, reviewer_name, users(name)')
      .single();
    return { data: (data as Review | null) ?? null, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

