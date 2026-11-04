import { Image, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Place } from '../types';

export default function PlaceCard({ place }: { place: Place }) {
  const mainImage =
    Array.isArray(place.images) && place.images.length > 0
      ? place.images[0]
      : 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80';

  return (
    <View className="bg-cardBg rounded-3xl overflow-hidden mb-4 border border-borderLight">
      <Image source={{ uri: mainImage }} style={{ width: '100%', height: 200 }} resizeMode="cover" />
      <View className="p-3.5">
        <View className="flex-row justify-between items-center">
          <Text className="flex-1 mr-2 text-base font-bold text-textMain">{place.title}</Text>
          <View className="bg-dealAmber px-2 py-1 rounded-md">
            <Text className="text-xs font-semibold text-textMain">
              ★ {place.rating != null ? place.rating.toFixed(1) : 'New'}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center mt-1">
          <Ionicons name="location-outline" size={14} color="#5A6478" />
          <Text className="ml-1 text-[13px] text-textMuted" numberOfLines={1}>
            {place.location}
          </Text>
        </View>
        <Text className="text-xs text-inactive mt-1">
          {place.place_type || place.category || 'Stay'}
          {place.guests_capacity ? ` • ${place.guests_capacity} khách` : ''}
          {place.review_count ? ` • ${place.review_count} đánh giá` : ''}
        </Text>
        <View className="flex-row items-baseline mt-2.5">
          <Text className="text-lg font-bold text-brand">${place.price_per_night}</Text>
          <Text className="text-[13px] text-textMuted"> / đêm</Text>
        </View>
      </View>
    </View>
  );
}
