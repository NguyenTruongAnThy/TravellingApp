import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPlaceById } from '../../services/placesService';
import { getReviewsByPlace, incrementHelpful } from '../../services/reviewService';
import type { Place, Review } from '../../types';
import AppButton from '../../components/AppButton';

export default function ReviewsScreen({ route, navigation }: { route: any; navigation: any }) {
  const placeId = route?.params?.placeId as string | undefined;
  const [place, setPlace] = useState<Place | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [helpfulError, setHelpfulError] = useState('');

  const load = useCallback(async () => {
    if (!placeId) { setErrorMessage('Không tìm thấy địa điểm này.'); setLoading(false); return; }
    setLoading(true); setErrorMessage('');
    const [p, r] = await Promise.all([getPlaceById(placeId), getReviewsByPlace(placeId)]);
    if (p.error || !p.data) setErrorMessage('Không tải được đánh giá. Vui lòng thử lại.');
    else { setPlace(p.data); setReviews(r.data || []); }
    setLoading(false);
  }, [placeId]);

  useEffect(() => { load(); }, [load]);

  const dist = useMemo(() => {
    const c = [0, 0, 0, 0, 0, 0];
    reviews.forEach((r) => { if (r.rating >= 1 && r.rating <= 5) c[r.rating] += 1; });
    return c;
  }, [reviews]);

  if (loading) return (<View className="flex-1 bg-appBg items-center justify-center px-6"><ActivityIndicator size="large" color="#4F46E5" /><Text className="mt-3 text-sm text-textMuted">Đang tải đánh giá...</Text></View>);
  if (errorMessage || !place) return (<View className="flex-1 bg-appBg items-center justify-center px-6"><Text className="text-lg font-bold text-textMain text-center">Không tải được đánh giá</Text><Text className="mt-2 text-sm text-textMuted text-center">{errorMessage}</Text><View className="mt-6 w-full"><AppButton title="Thử lại" onPress={load} /></View></View>);

  const onHelpful = async (review: Review) => {
    const current = review.helpful_count || 0;
    setReviews((prev) => prev.map((r) => r.id === review.id ? { ...r, helpful_count: current + 1 } : r));
    setHelpfulError('');
    const { error } = await incrementHelpful(review.id, current);
    if (error) {
      setReviews((prev) => prev.map((r) => r.id === review.id ? { ...r, helpful_count: current } : r));
      setHelpfulError('Không lưu được Helpful. Kiểm tra cột helpful_count đã chạy trên Supabase chưa, rồi thử lại.');
    }
  };

  return (
    <ScrollView className="flex-1 bg-appBg" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="px-5 pt-12 pb-3 flex-row items-center">
        <Pressable className="w-9 h-9 rounded-full bg-white items-center justify-center border border-borderLight" onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#131B2E" />
        </Pressable>
        <Text className="ml-3 text-lg font-bold text-textMain flex-1">Reviews</Text>
      </View>
      <View className="mx-5 mt-2">
        <Text className="text-2xl font-bold text-textMain">{place.title}</Text>
        <Text className="mt-2 text-4xl font-bold text-textMain">★ {place.rating != null ? place.rating.toFixed(1) : 'Mới'}{place.rating != null ? ' / 5' : ''}</Text>
        <Text className="mt-1 text-base text-textMuted">{place.review_count || reviews.length} đánh giá</Text>
      </View>
      <View className="mx-5 mt-5">
        <Text className="text-base font-bold text-textMain">Phân phối sao</Text>
        <Text className="mt-1 text-sm text-textMuted">Tính từ {reviews.length} đánh giá đã tải từ bảng reviews, không phải số mẫu của Figma.</Text>
        {reviews.length === 0 ? <Text className="mt-2 text-base text-textMuted">Chưa có đánh giá chi tiết nào để tính phân phối.</Text> : [5, 4, 3, 2, 1].map((star) => {
          const pct = Math.round((dist[star] / reviews.length) * 100);
          return (
            <View key={star} className="flex-row items-center mt-2">
              <Text className="w-10 text-sm text-textMain">{star} sao</Text>
              <View className="flex-1 h-2 rounded-full bg-borderLight overflow-hidden">
                <View style={{ width: `${pct}%`, height: 8, backgroundColor: '#4F46E5', borderRadius: 999 }} />
              </View>
              <Text className="ml-2 w-12 text-sm text-textMuted">{pct}%</Text>
            </View>
          );
        })}
      </View>
      <View className="mx-5 mt-5">
        <Text className="text-base font-bold text-textMain">Guest reviews</Text>
        {helpfulError ? <Text className="mt-2 text-sm text-red-500">{helpfulError}</Text> : null}
        {reviews.length === 0 ? <Text className="mt-2 text-base text-textMuted">Chưa có đánh giá nào cho chỗ ở này.</Text> : reviews.map((review) => (
          <View key={review.id} className="mt-3 py-3" style={{ borderBottomWidth: 1, borderBottomColor: '#E6E3F5' }}>
            <View className="flex-row justify-between items-center">
              <Text className="text-base font-bold text-textMain">{review.users?.name || 'Khách đã ở'}</Text>
              <Text className="text-sm font-bold text-textMain">★ {review.rating}/5</Text>
            </View>
            {review.created_at ? <Text className="mt-1 text-xs text-textMuted">{review.created_at.slice(0, 10)}</Text> : null}
            <Text className="mt-2 text-base text-textMuted">{review.comment || '(Không có bình luận)'}</Text>
            <View className="mt-3 flex-row">
              <Pressable className="flex-row items-center px-3 py-2 rounded-full border border-borderLight bg-white" onPress={() => onHelpful(review)}>
                <Ionicons name="thumbs-up-outline" size={16} color="#4F46E5" />
                <Text className="ml-1 text-sm font-bold text-textMain">Helpful ({review.helpful_count || 0})</Text>
              </Pressable>
              <Pressable className="ml-2 px-3 py-2 rounded-full border border-borderLight bg-white" onPress={() => navigation.navigate('MainTabs', { screen: 'Inbox' })}>
                <Text className="text-sm font-bold text-textMain">Report</Text>
              </Pressable>
            </View>
            <Text className="mt-1 text-xs text-textMuted">Report sẽ mở tab Inbox để nhắn cho Admin, không phải hệ thống ticket riêng.</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
