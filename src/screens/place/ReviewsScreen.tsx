import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
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
    if (!placeId) { setErrorMessage('Could not find this stay.'); setLoading(false); return; }
    setLoading(true); setErrorMessage('');
    const [p, r] = await Promise.all([getPlaceById(placeId), getReviewsByPlace(placeId)]);
    if (p.error || !p.data) setErrorMessage('Could not load reviews. Please try again.');
    else { setPlace(p.data); setReviews(r.data || []); }
    setLoading(false);
  }, [placeId]);

  useEffect(() => { load(); }, [load]);

  const dist = useMemo(() => {
    const c = [0, 0, 0, 0, 0, 0];
    reviews.forEach((r) => { if (r.rating >= 1 && r.rating <= 5) c[r.rating] += 1; });
    return c;
  }, [reviews]);

  if (loading) return (<View className="flex-1 bg-appBg items-center justify-center px-6"><ActivityIndicator size="large" color="#4F46E5" /><Text className="mt-3 text-sm text-textMuted">Loading reviews...</Text></View>);
  if (errorMessage || !place) return (<View className="flex-1 bg-appBg items-center justify-center px-6"><Text className="text-lg font-bold text-textMain text-center">Could not load reviews</Text><Text className="mt-2 text-sm text-textMuted text-center">{errorMessage}</Text><View className="mt-6 w-full"><AppButton title="Try again" onPress={load} /></View></View>);

  const onHelpful = async (review: Review) => {
    const current = review.helpful_count || 0;
    setReviews((prev) => prev.map((r) => r.id === review.id ? { ...r, helpful_count: current + 1 } : r));
    setHelpfulError('');
    const { error } = await incrementHelpful(review.id, current);
    if (error) {
      setReviews((prev) => prev.map((r) => r.id === review.id ? { ...r, helpful_count: current } : r));
      setHelpfulError('Could not save Helpful. Check that the helpful_count column has been run on Supabase, then try again.');
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
        <View className="mt-2 flex-row items-center"><Ionicons name="star" size={28} color="#FFB020" /><Text className="ml-2 text-4xl font-bold text-textMain">{place.rating != null ? place.rating.toFixed(1) : 'New'}{place.rating != null ? ' / 5' : ''}</Text></View>
        <View className="mt-2 flex-row">{[1, 2, 3, 4, 5].map((i) => (<Ionicons key={i} name={place.rating != null && i <= Math.round(place.rating) ? 'star' : 'star-outline'} size={18} color={place.rating != null && i <= Math.round(place.rating) ? '#FFB020' : '#D9D4F0'} />))}</View>
        <Text className="mt-1 text-base text-textMuted">{place.review_count || reviews.length} reviews</Text>
      </View>
      <View className="mx-5 mt-5">
        <Text className="text-base font-bold text-textMain">Star distribution</Text>
        <Text className="mt-1 text-sm text-textMuted">Calculated from {reviews.length} reviews loaded from the reviews table, not Figma sample numbers.</Text>
        {reviews.length === 0 ? <Text className="mt-2 text-base text-textMuted">No detailed reviews yet to calculate the distribution.</Text> : [5, 4, 3, 2, 1].map((star) => {
          const pct = Math.round((dist[star] / reviews.length) * 100);
          return (
            <View key={star} className="flex-row items-center mt-2">
              <Text className="w-10 text-sm text-textMain">{star} stars</Text>
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
        {reviews.length === 0 ? <Text className="mt-2 text-base text-textMuted">No reviews for this stay yet.</Text> : reviews.map((review) => (
          <View key={review.id} className="mt-3 py-3" style={{ borderBottomWidth: 1, borderBottomColor: '#E6E3F5' }}>
            <View className="flex-row justify-between items-center">
              <Text className="text-base font-bold text-textMain">{review.users?.name || 'Guest'}</Text>
              <View className="flex-row items-center"><Ionicons name="star" size={13} color="#FFB020" /><Text className="ml-1 text-sm font-bold text-textMain">{review.rating}/5</Text></View>
            </View>
            {review.created_at ? <Text className="mt-1 text-xs text-textMuted">{review.created_at.slice(0, 10)}</Text> : null}
            <Text className="mt-2 text-base text-textMuted">{review.comment || '(No comment)'}</Text>
            {Array.isArray(review.photos) && review.photos.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
                {review.photos.map((photo, i) => (
                  <Image key={`${review.id}-photo-${i}`} source={{ uri: photo }} style={{ width: 96, height: 96, borderRadius: 12, marginRight: 8 }} resizeMode="cover" />
                ))}
              </ScrollView>
            ) : null}
            <View className="mt-3 flex-row">
              <Pressable className="flex-row items-center px-3 py-2 rounded-full border border-borderLight bg-white" onPress={() => onHelpful(review)}>
                <Ionicons name="thumbs-up-outline" size={16} color="#4F46E5" />
                <Text className="ml-1 text-sm font-bold text-textMain">Helpful ({review.helpful_count || 0})</Text>
              </Pressable>
              <Pressable className="ml-2 px-3 py-2 rounded-full border border-borderLight bg-white" onPress={() => navigation.navigate('MainTabs', { screen: 'Inbox' })}>
                <Text className="text-sm font-bold text-textMain">Report</Text>
              </Pressable>
            </View>
            <Text className="mt-1 text-xs text-textMuted">Report opens the Inbox tab to message Admin, not a separate ticket system.</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
