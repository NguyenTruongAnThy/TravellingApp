import { File } from 'expo-file-system';
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

// BR07: lay cac don completed cua user cho place nay (moi nhat truoc, toi da 10)
// kem tap booking_id da co danh gia. Dung chung cho getCompletedBooking va
// getReviewEligibility de khoi query lap lai.
async function getCompletedBookingsWithReviewState(
  placeId: string,
  userId: string,
): Promise<{ bookings: { id: string }[]; reviewedIds: Set<string> }> {
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('place_id', placeId)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('check_out', { ascending: false })
    .limit(10);
  const list = (bookings as { id: string }[] | null) ?? [];
  if (list.length === 0) return { bookings: [], reviewedIds: new Set<string>() };
  const { data: reviewed } = await supabase
    .from('reviews')
    .select('booking_id')
    .in('booking_id', list.map((b) => b.id));
  const reviewedIds = new Set(
    ((reviewed as { booking_id: string | null }[] | null) ?? [])
      .map((r) => r.booking_id)
      .filter((id): id is string => id != null),
  );
  return { bookings: list, reviewedIds };
}

// Don completed DAU TIEN CHUA co danh gia (moi nhat truoc). Tra null khi khong co
// don completed nao, hoac tat ca don completed deu da co danh gia.
// Vi sao phai loc: reviews.booking_id la UNIQUE — gan danh gia moi vao 1 don da
// co danh gia thi insert loi 23505 (da gap that: booking b0000001-...-0002).
export async function getCompletedBooking(
  placeId: string,
  userId: string,
): Promise<{ id: string } | null> {
  const { bookings, reviewedIds } = await getCompletedBookingsWithReviewState(placeId, userId);
  return bookings.find((b) => !reviewedIds.has(b.id)) ?? null;
}

// Trang thai review cua user cho 1 place, de UI phan biet 2 truong hop khoa nut
// "Viet danh gia": 'none' = chua co don completed nao; 'reviewed' = co don
// completed nhung tat ca deu da co danh gia; 'can_review' = co don completed
// chua co danh gia.
export type ReviewEligibility = 'none' | 'reviewed' | 'can_review';

export async function getReviewEligibility(
  placeId: string,
  userId: string,
): Promise<ReviewEligibility> {
  const { bookings, reviewedIds } = await getCompletedBookingsWithReviewState(placeId, userId);
  if (bookings.length === 0) return 'none';
  return bookings.some((b) => !reviewedIds.has(b.id)) ? 'can_review' : 'reviewed';
}

// Chi true khi user da co don completed CHUA co danh gia cho place nay;
// loi mang thi mac dinh false (khoa).
export async function hasCompletedBooking(placeId: string, userId: string): Promise<boolean> {
  try {
    return (await getCompletedBooking(placeId, userId)) != null;
  } catch {
    return false;
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
      // Doc file thanh nhi phan bang API File moi cua expo-file-system.
      // API cu FileSystem.readAsStringAsync (import tu 'expo-file-system') chi
      // con la stub deprecated tren SDK 58 — goi la throw ngay tai runtime
      // ("Method readAsStringAsync ... is deprecated") nen upload luon loi
      // du bucket/policy da dung. File moi doc duoc ca content:// (Android,
      // image-picker tra dang nay) lan file:// (iOS).
      const bytes = new Uint8Array(await new File(uri).arrayBuffer());
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
      // Phan biet 2 truong hop: chua co don completed nao, hay tat ca don
      // completed deu da co danh gia — de UI hien dung thong bao.
      const eligibility = await getReviewEligibility(placeId, userId);
      if (eligibility === 'reviewed') {
        return { data: null, error: new Error('already_reviewed') };
      }
      return {
        data: null,
        error: new Error('Chỉ khách hàng đã hoàn thành kỳ nghỉ (Completed) mới có thể gửi đánh giá nhận xét.'),
      };
    }

    const reviewSelect = 'id, rating, comment, photos, helpful_count, created_at, user_id, reviewer_name, users(name)';
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
      .select(reviewSelect)
      .single();
    if (error && (error as { code?: unknown }).code === '23505') {
      // Don nay da co danh gia roi (vd mo lai form tu 1 don da danh gia, hoac 2
      // lan gui trung nhau) — cap nhat danh gia cu thay vi bao loi, de nut
      // "Danh gia" tro thanh "sua lai danh gia". Chi doi rating/comment/photos/
      // reviewer_name, KHONG doi helpful_count (giu nguyen so like cu).
      const { data: updated, error: updateError } = await supabase
        .from('reviews')
        .update({ rating, comment, photos, reviewer_name: reviewerName })
        .eq('booking_id', completedBooking.id)
        .select(reviewSelect)
        .single();
      return { data: (updated as Review | null) ?? null, error: updateError };
    }
    return { data: (data as Review | null) ?? null, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

