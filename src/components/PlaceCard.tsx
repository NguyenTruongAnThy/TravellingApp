import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Place } from '../types';

export default function PlaceCard({ place, isFavorite = false, onToggleFavorite }: { place: Place; isFavorite?: boolean; onToggleFavorite?: () => void }) {
  const mainImage =
    Array.isArray(place.images) && place.images.length > 0
      ? place.images[0]
      : 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80';

  return (
    <View className="bg-cardBg rounded-3xl overflow-hidden mb-4 border border-borderLight">
      <View>
        {(place.rating ?? 0) >= 4.8 && (place.review_count ?? 0) >= 5 ? (
          <View className="flex-row items-center px-2.5 py-1 rounded-full" style={{ backgroundColor: "#FFB020", position: 'absolute', top: 12, left: 12, zIndex: 1 }}>
            <Text className="text-[11px] font-bold" style={{ color: "#131B2E" }}>Guest favourite</Text>
          </View>
        ) : null}
        {Array.isArray(place.images) && place.images.length > 1 ? (
          <View className="flex-row items-center justify-center" style={{ position: 'absolute', bottom: 10, left: 0, right: 0 }}>
            {place.images.slice(0, 5).map((_, i) => (
              <View key={i} style={{ width: i === 0 ? 16 : 6, height: 6, borderRadius: 3, marginHorizontal: 2, backgroundColor: i === 0 ? '#FFFFFF' : 'rgba(255,255,255,0.6)' }} />
            ))}
          </View>
        ) : null}
        <Image source={{ uri: mainImage }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
        {onToggleFavorite ? (
          <Pressable
            style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 999, padding: 8 }}
            onPress={onToggleFavorite}
          >
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color={isFavorite ? '#EF4444' : '#131B2E'} />
          </Pressable>
        ) : null}
      </View>
      <View className="p-3.5">
        <View className="flex-row justify-between items-center">
          <Text className="flex-1 mr-2 text-[15px] font-bold text-textMain">{place.title}</Text>
          <View className="flex-row items-center">
            <Ionicons name="star" size={13} color="#FFB020" /><Text className="ml-1 text-xs font-bold text-textMain">{place.rating != null ? place.rating.toFixed(1) : 'New'}</Text>
            {place.review_count ? <Text className="ml-1 text-[11px] text-textMuted">({place.review_count})</Text> : null}
          </View>
        </View>
        <View className="flex-row items-center mt-1">
          <Ionicons name="location-outline" size={14} color="#FFB020" />
          <Text className="ml-1 text-[13px] text-textMuted" numberOfLines={1}>
            {place.location}
          </Text>
        </View>
        <Text className="text-xs text-inactive mt-1">
          {place.place_type || place.category || 'Stay'}
          {place.rooms != null ? ` • ${place.rooms} rooms` : ''}
          {place.beds != null ? ` • ${place.beds} beds` : ''}
          {place.guests_capacity ? ` • ${place.guests_capacity} guests` : ''}
        </Text>
        <View className="flex-row items-baseline mt-2.5">
          <Text className="text-lg font-bold text-brand">${place.price_per_night}</Text>
          <Text className="text-[13px] text-textMuted"> / night</Text>
        </View>
      </View>
    </View>
  );
}
