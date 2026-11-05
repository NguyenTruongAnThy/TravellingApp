import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPlaceById } from '../../services/placesService';
import { getFavoritePlaceIds, toggleFavorite } from '../../services/favoritesService';
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
  const [isFavorite, setIsFavorite] = useState(false);
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

  useEffect(() => { loadPlace(); }, [loadPlace]);

  useEffect(() => {
    if (!placeId) return;
    getReviewsByPlace(placeId).then(({ data, error }) => {
      if (error) { setReviewsError(true); } else { setReviews(data || []); setReviewsError(false); }
    });
  }, [placeId]);

  useEffect(() => {
    if (!placeId || !session?.user?.id) { setIsFavorite(false); return; }
    getFavoritePlaceIds(session.user.id).then((ids) => setIsFavorite(ids.includes(placeId))).catch(() => {});
  }, [placeId, session]);

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
  const photoCount = Array.isArray(place.images) ? place.images.length : 0;

  const handleBook = () => {
    if (!session) { navigation.navigate('Login'); return; }
    navigation.navigate('MainTabs', { screen: 'Booking' });
  };

  const toggleFav = async () => {
    if (!session) { navigation.navigate('Login'); return; }
    await toggleFavorite(session.user.id, place.id, isFavorite);
    setIsFavorite(!isFavorite);
  };

  return (
    <View className="flex-1 bg-appBg">
      <ScrollView className="flex-1 bg-appBg" contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Figma Property details: anh hero tran vien, nut Back/Save noi tren anh, khong co thanh tieu de rieng phia tren */}
        <View>
          <Image source={{ uri: mainImage }} style={{ width: '100%', height: 320 }} resizeMode="cover" />
          <Pressable className="w-9 h-9 rounded-full bg-white items-center justify-center border border-borderLight" style={{ position: 'absolute', top: 48, left: 16 }} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#131B2E" />
          </Pressable>
          <Pressable className="w-10 h-10 rounded-full bg-white items-center justify-center border border-borderLight" style={{ position: 'absolute', top: 48, right: 16 }} onPress={toggleFav}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color={isFavorite ? '#EF4444' : '#131B2E'} />
          </Pressable>
          {photoCount > 0 ? (
            <View className="px-2.5 py-1 rounded-full bg-white" style={{ position: 'absolute', bottom: 16, right: 16 }}>
              <Text className="text-xs font-bold text-textMain">{photoCount} ảnh</Text>
            </View>
          ) : null}
          {photoCount > 1 ? (
            <View className="flex-row items-center justify-center" style={{ position: 'absolute', bottom: 16, left: 0, right: 0 }}>
              {place.images!.slice(0, 5).map((_, i) => (
                <View key={i} style={{ width: i === 0 ? 16 : 6, height: 6, borderRadius: 3, marginHorizontal: 2, backgroundColor: i === 0 ? '#FFFFFF' : 'rgba(255,255,255,0.6)' }} />
              ))}
            </View>
          ) : null}
        </View>

        {/* The tieu de noi len tren anh, chi chua thong tin co ban */}
        <View className="mx-5 -mt-6 rounded-3xl bg-white border border-borderLight p-5">
          <Text className="text-2xl font-bold text-textMain">{place.title}</Text>
          <Text className="mt-2 text-base text-textMuted">{place.location}</Text>
          <View className="mt-2 flex-row items-center">
            <Text className="text-base font-bold text-textMain">★ {place.rating != null ? place.rating.toFixed(1) : 'Mới'}{place.rating != null ? ' / 5' : ''}</Text>
            {place.rating != null && place.rating >= 4.5 ? <Text className="ml-2 text-sm font-bold text-brand">Exceptional</Text> : null}
            {place.review_count ? <Text className="ml-2 text-sm text-textMuted">({place.review_count} đánh giá)</Text> : null}
          </View>
          {/* Chi hien dung so lieu that tu DB. Khong co cot bathrooms trong DB nen khong hien so phong tam */}
          <View className="mt-3 flex-row flex-wrap">
            {place.guests_capacity != null ? <View className="mr-2 mb-2 px-3 py-2 rounded-full bg-appBg border border-borderLight"><Text className="text-sm text-textMain">{place.guests_capacity} khách</Text></View> : null}
            {place.rooms != null ? <View className="mr-2 mb-2 px-3 py-2 rounded-full bg-appBg border border-borderLight"><Text className="text-sm text-textMain">{place.rooms} phòng</Text></View> : null}
            {place.beds != null ? <View className="mr-2 mb-2 px-3 py-2 rounded-full bg-appBg border border-borderLight"><Text className="text-sm text-textMain">{place.beds} giường</Text></View> : null}
            {place.place_type || place.category ? <View className="mr-2 mb-2 px-3 py-2 rounded-full bg-appBg border border-borderLight"><Text className="text-sm text-textMain">{place.place_type || place.category}</Text></View> : null}
          </View>
          <View className="mt-2 flex-row items-baseline">
            <Text className="text-2xl font-bold text-textMain">${place.price_per_night}</Text>
            <Text className="text-base text-textMuted"> / đêm</Text>
          </View>
        </View>

        {/* Cac muc rieng biet, khong long the trang trong the trang */}
        {place.description ? (
          <View className="mx-5 mt-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold text-textMain">Mô tả</Text>
              <Pressable onPress={() => navigation.navigate('Description', { placeId: place.id })}><Text className="text-sm font-bold text-brand">View more ›</Text></Pressable>
            </View>
            <Text className="mt-2 text-base text-textMuted leading-6" numberOfLines={3}>{place.description}</Text>
          </View>
        ) : null}

        {Array.isArray(place.amenities) && place.amenities.length > 0 ? (
          <View className="mx-5 mt-5">
            <Text className="text-base font-bold text-textMain">Tiện nghi</Text>
            <View className="mt-2">
              {place.amenities.slice(0, 3).map((item, i) => (
                <View key={item} className="flex-row items-center py-2.5" style={{ borderBottomWidth: i === place.amenities!.length - 1 ? 0 : 1, borderBottomColor: '#E6E3F5' }}>
                  <Ionicons name={amenityIcon(item)} size={18} color="#4F46E5" />
                  <Text className="ml-3 text-base text-textMain">{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {Array.isArray(place.amenities) && place.amenities.length > 3 ? (
          <Pressable className="mx-5 mt-2" onPress={() => navigation.navigate('Facilities', { placeId: place.id })}><Text className="text-sm font-bold text-brand">Show all {place.amenities.length} facilities ›</Text></Pressable>
        ) : Array.isArray(place.amenities) && place.amenities.length > 0 ? (
          <Pressable className="mx-5 mt-2" onPress={() => navigation.navigate('Facilities', { placeId: place.id })}><Text className="text-sm font-bold text-brand">Show all facilities ›</Text></Pressable>
        ) : null}
        <View className="mx-5 mt-5">
          <Text className="text-base font-bold text-textMain">Chính sách</Text>
          <Text className="mt-2 text-base text-textMuted">Nhận phòng: từ {place.check_in_time || '14:00'}</Text>
          <Text className="mt-1 text-base text-textMuted">Trả phòng: đến {place.check_out_time || '12:00'}</Text>
          <Text className="mt-1 text-base text-textMuted">Không hút thuốc trong nhà</Text>
          <Text className="mt-1 text-base text-textMuted">Giờ yên tĩnh sau 22:00</Text>
          <Text className="mt-1 text-base text-textMuted">Thú cưng: theo yêu cầu</Text>
          {/* Quy tac chot 2026-11-05 theo Trong: 50%/48h, thay the 30%/24h cu */}
          <Text className="mt-1 text-base text-textMuted">Hủy miễn phí trước check-in từ 48 giờ trở lên. Hủy trong 48 giờ phạt 1 đêm, tiền hoàn = tổng tiền − giá 1 đêm. Hủy sau check-in hoặc không đến không hoàn tiền.</Text>
        </View>

        <View className="mx-5 mt-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-textMain">Đánh giá</Text>
            <Pressable onPress={() => navigation.navigate('Reviews', { placeId: place.id })}><Text className="text-sm font-bold text-brand">Show all reviews ›</Text></Pressable>
          </View>
          {reviewsError ? (
            <Text className="mt-2 text-base text-textMuted">Không tải được đánh giá. Vui lòng thử lại sau.</Text>
          ) : reviews.length === 0 ? (
            <Text className="mt-2 text-base text-textMuted">Chưa có đánh giá nào cho chỗ ở này.</Text>
          ) : (
            <View className="mt-2">
              {reviews.slice(0, 2).map((review, i) => (
                <View key={review.id} className="py-3" style={{ borderBottomWidth: i === reviews.length - 1 ? 0 : 1, borderBottomColor: '#E6E3F5' }}>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-base font-bold text-textMain">{review.users?.name || 'Khách đã ở'}</Text>
                    <Text className="text-sm font-bold text-textMain">★ {review.rating}/5</Text>
                  </View>
                  {review.created_at ? <Text className="mt-1 text-xs text-textMuted">{review.created_at.slice(0, 10)}</Text> : null}
                  <Text className="mt-2 text-base text-textMuted">{review.comment || '(Không có bình luận)'}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="mx-5 mt-5">
          <Text className="text-base font-bold text-textMain">Vị trí</Text>
          <Text className="mt-2 text-base text-textMuted">{place.location}</Text>
          <Text className="mt-2 text-sm text-textMuted">{session ? 'Bạn đã đăng nhập, bấm Đặt phòng ở thanh dưới cùng để tiếp tục.' : 'Bạn đang xem với tư cách khách vãng lai. Đăng nhập để đặt phòng.'}</Text>
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
