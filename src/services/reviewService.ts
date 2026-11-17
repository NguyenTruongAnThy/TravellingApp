import * as FileSystem from 'expo-file-system';
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

// BR07: tim don completed cua user cho place nay. Dung chung cho gate o UI
// (ReviewsScreen / DetailScreen) va cho createReview, de khoi viet lap lai query.
export async function getCompletedBooking(
  placeId: string,
  userId: string,
): Promise<{ id: string } | null> {
  const { data } = await supabase
    .from('bookings')
    .select('id')
    .eq('place_id', placeId)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .limit(1)
    .maybeSingle();
  return (data as { id: string } | null) ?? null;
}

// Chi true khi user da co don completed cho place nay; loi mang thi mac dinh false (khoa).
export async function hasCompletedBooking(placeId: string, userId: string): Promise<boolean> {
  try {
    return (await getCompletedBooking(placeId, userId)) != null;
  } catch {
    return false;
  }
}

// Giai ma base64 thanh byte (thuan JS, khong them dependency).
const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    if (ch === '=') break;
    const value = BASE64_ALPHABET.indexOf(ch);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
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
      // Doc file thanh base64 roi upload dang nhi phan: FileSystem doc duoc ca
      // content:// (Android, image-picker tra dang nay) lan file:// (iOS).
      // Cach cu dung fetch(uri) -> blob() khong doc duoc content:// nen tren
      // Android luon loi "Network request failed" va khong dang anh duoc.
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const bytes = base64ToUint8Array(base64);
      const path = `${placeId}/${userId}/${Date.now()}-${i}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('review-photos')
        .upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
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
  bookingId?: string | null,
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

    // BR07: Chỉ cho phép review khi người dùng đã có booking ở trạng thái completed.
    // Ưu tiên bookingId từ params (mở từ đơn đã hoàn thành) để review gắn đúng đơn đó;
    // nếu bookingId không hợp lệ thì rơi về getCompletedBooking như cũ.
    let completedBooking: { id: string } | null = null;
    if (bookingId) {
      const { data: verified } = await supabase
        .from('bookings')
        .select('id')
        .eq('id', bookingId)
        .eq('place_id', placeId)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .maybeSingle();
      completedBooking = (verified as { id: string } | null) ?? null;
    }
    if (!completedBooking) {
      completedBooking = await getCompletedBooking(placeId, userId);
    }

    if (!completedBooking) {
      return {
        data: null,
        error: new Error('Chỉ khách hàng đã hoàn thành kỳ nghỉ (Completed) mới có thể gửi đánh giá nhận xét.'),
      };
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        place_id: placeId,
        user_id: userId,
        booking_id: completedBooking.id,
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

