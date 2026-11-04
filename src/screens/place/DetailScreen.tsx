import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPlaceById } from '../../services/placesService';
import { getReviewsByPlace } from '../../services/reviewService';
import type { Place, Review } from '../../types';
import { useAuth } from '../../context/AuthContext';
import AppButton from '../../components/AppButton';

function amenityIcon(name: string): any {
  const n = name.toLowerCase();
  if (n.includes('wifi')) return 'wifi-outline';
  if (n.includes('kitchen') || n.includes('bếp')) return 'restaurant-outline';
  if (n.includes('pool') || n.includes('hồ bơi')) return 'water-outline';
  if (n.includes('parking') || n.includes('đỗ xe')) return 'car-outline';
  if (n.includes('kayak')) return 'boat-outline';
  return 'checkmark-circle-outline';
}

export default function DetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const { session } = useAuth();
  const placeId = route?.params?.placeId as string | undefined;
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsError, setReviewsError] = useState(false);

  const loadPlace = useCallback(async () => {
    if (!placeId) {
      setErrorMessage('Không tìm thấy địa điểm này.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMessage('');
    const { data, error } = await getPlaceById(placeId);
    if (error || !data) {
      setErrorMessage('Không tải được chi tiết chỗ ở. Vui lòng thử lại.');
    } else {
      setPlace(data);
    }
    setLoading(false);
  }, [placeId]);

  useEffect(() => {
    loadPlace();
  }, [loadPlace]);

  useEffect(() => {
    if (!placeId) return;
    getReviewsByPlace(placeId).then(({ data, error }) => {
      if (error) {
        setReviewsError(true);
      } else {
        setReviews(data || []);
        setReviewsError(false);
      }
    });
  }, [placeId]);

  if (loading) {
    return (
      <View className="flex-1 bg-appBg items-center justify-center px-6">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-3 text-sm text-textMuted">Đang tải chi tiết chỗ ở...</Text>
      </View>
    );
  }

  if (errorMessage || !place) {
    return (
      <View className="flex-1 bg-appBg items-center justify-center px-6">
        <Text className="text-lg font-bold text-textMain text-center">Không tải được chi tiết</Text>
        <Text className="mt-2 text-sm text-textMuted text-center">{errorMessage}</Text>
        <View className="mt-6 w-full">
          <AppButton title="Thử lại" onPress={loadPlace} />
        </View>
      </View>
    );
  }

  const mainImage =
    Array.isArray(place.images) && place.images.length > 0
      ? place.images[0]
      : 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80';

  const handleBook = () => {
    if (!session) {
      navigation.navigate('Login');
      return;
    }
    navigation.navigate('MainTabs', { screen: 'Booking' });
  };

  return (
    <View className="flex-1 bg-appBg">
    <ScrollView className="flex-1 bg-appBg" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="px-5 pt-12 pb-3 flex-row items-center">
        <Pressable
          className="w-9 h-9 rounded-full bg-white items-center justify-center border border-borderLight"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#131B2E" />
        </Pressable>
        <Text className="ml-3 text-lg font-bold text-textMain flex-1" numberOfLines={1}>
          Chi tiết chỗ ở
        </Text>
      </View>

      <Image source={{ uri: mainImage }} style={{ width: '100%', height: 260 }} resizeMode="cover" />

      <View className="mx-5 -mt-6 rounded-3xl bg-white border border-borderLight p-5">
        <View className="flex-row justify-between items-start">
          <Text className="flex-1 mr-2 text-2xl font-bold text-textMain">{place.title}</Text>
          <View className="bg-dealAmber px-2 py-1 rounded-md">
            <Text className="text-sm font-bold text-textMain">
              ★ {place.rating != null ? place.rating.toFixed(1) : 'New'}
              {place.review_count ? ` (${place.review_count})` : ''}
            </Text>
          </View>
        </View>
        <Text className="mt-2 text-base text-textMuted">{place.location}</Text>
        <Text className="mt-1 text-sm text-textMuted">
          {place.place_type || place.category || 'Stay'}
          {place.rooms != null ? ` • ${place.rooms} phòng` : ''}
          {place.beds != null ? ` • ${place.beds} giường` : ''}
          {place.guests_capacity != null ? ` • ${place.guests_capacity} khách` : ''}
        </Text>

        <View className="mt-4 flex-row items-baseline">
          <Text className="text-2xl font-bold text-textMain">${place.price_per_night}</Text>
          <Text className="text-base text-textMuted"> / đêm</Text>
        </View>

        {place.description ? (
          <View className="mt-4 rounded-3xl bg-white border border-borderLight p-5">
            <Text className="text-base font-bold text-textMain">Mô tả</Text>
            <Text className="mt-2 text-base text-textMuted leading-6">{place.description}</Text>
          </View>
        ) : null}

        {Array.isArray(place.amenities) && place.amenities.length > 0 ? (
          <View className="mt-4 rounded-3xl bg-white border border-borderLight p-5">
            <Text className="text-base font-bold text-textMain">Tiện nghi</Text>
            <View className="mt-2 flex-row flex-wrap">
              {place.amenities.map((item) => (
                <View key={item} className="mr-2 mb-2 px-3 py-2 rounded-full bg-appBg border border-borderLight flex-row items-center">
                  <Ionicons name={amenityIcon(item)} size={16} color="#4F46E5" />
                  <Text className="ml-1 text-sm text-textMain">{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View className="mt-4 rounded-3xl bg-white border border-borderLight p-5">
        <Text className="text-base font-bold text-textMain">Đánh giá</Text>
        {reviewsError ? (
          <View className="mt-2">
            <Text className="text-sm text-textMuted">Không tải được đánh giá. Vui lòng kéo xuống và thử lại sau.</Text>
          </View>
        ) : reviews.length === 0 ? (
          <Text className="mt-2 text-base text-textMuted">Chưa có đánh giá nào cho chỗ ở này.</Text>
        ) : (
          <View className="mt-2">
            {reviews.map((review) => (
              <View key={review.id} className="mb-3 rounded-2xl bg-white border border-borderLight p-4">
                <View className="flex-row justify-between items-center">
                  <Text className="text-base font-bold text-textMain">
                    {review.users?.name || 'Khách đã ở'}
                  </Text>
                  <Text className="text-sm font-bold text-textMain">★ {review.rating}/5</Text>
                </View>
                {review.created_at ? (
                  <Text className="mt-1 text-xs text-textMuted">{review.created_at.slice(0, 10)}</Text>
                ) : null}
                <Text className="mt-2 text-base text-textMuted">
                  {review.comment || '(Không có bình luận)'}
                </Text>
              </View>
            ))}
          </View>
        )}

        </View>

        <Text className="mt-4 text-sm text-textMuted">
          Nhận phòng: {place.check_in_time || '14:00'} • Trả phòng: {place.check_out_time || '12:00'}
        </Text>
        <Text className="mt-1 text-sm text-textMuted">
          {session
            ? 'Bạn đã đăng nhập, bấm Đặt phòng ở thanh dưới cùng để tiếp tục.'
            : 'Bạn đang xem với tư cách khách vãng lai. Đăng nhập để đặt phòng.'}
        </Text>

      </View>
    </ScrollView>
    <View className="bg-white border-t border-borderLight px-5 py-3 flex-row items-center">
      <View>
        <Text className="text-lg font-bold text-brand">${place.price_per_night}</Text>
        <Text className="text-xs text-textMuted">/ đêm</Text>
      </View>
      <View className="flex-1 ml-4">
        <AppButton title="Đặt phòng" onPress={handleBook} />
      </View>
    </View>
    </View>
  );
}
