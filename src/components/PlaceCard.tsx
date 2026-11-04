import { Image, Text, View } from 'react-native';
import type { Place } from '../types';

export default function PlaceCard({ place }: { place: Place }) {
  const mainImage =
    Array.isArray(place.images) && place.images.length > 0
      ? place.images[0]
      : 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80';

  return (
    <View className="bg-cardBg rounded-2xl overflow-hidden mb-4">
      <Image source={{ uri: mainImage }} style={{ width: '100%', height: 200 }} resizeMode="cover" />
      <View className="p-3.5">
        <View className="flex-row justify-between items-center">
          <Text className="flex-1 mr-2 text-base font-bold text-textMain">{place.title}</Text>
          <View className="bg-appBg px-2 py-1 rounded-md">
            <Text className="text-xs font-semibold text-textMain">
              ★ {place.rating != null ? place.rating.toFixed(1) : 'New'}
            </Text>
          </View>
        </View>
        <Text className="text-[13px] text-textMuted mt-1" numberOfLines={1}>
          {place.location}
        </Text>
        <Text className="text-xs text-inactive mt-1">
          {place.place_type || place.category || 'Stay'}
          {place.guests_capacity ? ` • ${place.guests_capacity} khách` : ''}
          {place.review_count ? ` • ${place.review_count} đánh giá` : ''}
        </Text>
        <View className="flex-row items-baseline mt-2.5">
          <Text className="text-base font-bold text-textMain">${place.price_per_night}</Text>
          <Text className="text-[13px] text-textMuted"> / đêm</Text>
        </View>
      </View>
    </View>
  );
}
