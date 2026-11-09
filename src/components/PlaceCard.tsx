import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { Place } from '../types';

export default function PlaceCard({
  place,
  isFavorite = false,
  onToggleFavorite,
}: {
  place: Place;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}) {
  const { t } = useTranslation();
  const mainImage =
    Array.isArray(place.images) && place.images.length > 0
      ? place.images[0]
      : 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80';

  // Lấy tên địa điểm du lịch chính (VD: "Balian Beach", "Ubud", "Kuta", "Nusa Penida")
  const destination = place.location?.split(',')[0]?.trim() || place.location || 'Bali';

  // Tính toán phần trăm tiết kiệm nếu có giá gốc (original_price)
  const originalPrice = place.original_price ? Number(place.original_price) : null;
  const currentPrice = Number(place.price_per_night);
  const hasDiscount = originalPrice != null && originalPrice > currentPrice;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  return (
    <View className="bg-cardBg rounded-3xl overflow-hidden mb-4 border border-borderLight">
      <View>
        {/* Tag địa điểm du lịch (Ảnh 3: Ghim đỏ san hô 📍 Bãi Cháy ôm góc trên bên trái) */}
        <View
          className="flex-row items-center px-3 py-1.5"
          style={{
            backgroundColor: '#FF5A5F',
            position: 'absolute',
            top: 0,
            left: 0,
            borderTopLeftRadius: 24,
            borderBottomRightRadius: 14,
            zIndex: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
            elevation: 4,
          }}
        >
          <Ionicons name="location-sharp" size={13} color="#FFFFFF" />
          <Text className="ml-1 text-xs font-bold text-white tracking-wide">{destination}</Text>
        </View>

        {/* Tag giảm giá (Ảnh 2: Tiết kiệm 33% tag màu cam nổi bật với nếp gấp ruy băng ở mép phải) */}
        {hasDiscount ? (
          <View
            style={{
              position: 'absolute',
              bottom: 14,
              right: 0,
              zIndex: 2,
            }}
          >
            <View
              className="flex-row items-center px-3 py-1"
              style={{
                backgroundColor: '#FF6B00',
                borderTopLeftRadius: 6,
                borderBottomLeftRadius: 6,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3,
                elevation: 4,
              }}
            >
              <Text className="text-xs font-extrabold text-white tracking-tight">
                {t('common.saveDiscount')} {discountPercent}%
              </Text>
            </View>
            {/* Vạt gập 3D ruy băng ở mép phải dưới */}
            <View
              style={{
                position: 'absolute',
                right: 0,
                bottom: -6,
                width: 0,
                height: 0,
                borderTopWidth: 6,
                borderTopColor: '#C2410C',
                borderRightWidth: 6,
                borderRightColor: 'transparent',
              }}
            />
          </View>
        ) : null}

        {/* Chấm phân trang ảnh */}
        {Array.isArray(place.images) && place.images.length > 1 ? (
          <View
            className="flex-row items-center justify-center"
            style={{ position: 'absolute', bottom: 10, left: 0, right: 0 }}
          >
            {place.images.slice(0, 5).map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === 0 ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  marginHorizontal: 2,
                  backgroundColor: i === 0 ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                }}
              />
            ))}
          </View>
        ) : null}

        <Image source={{ uri: mainImage }} style={{ width: '100%', height: 220 }} resizeMode="cover" />

        {/* Nút yêu thích */}
        {onToggleFavorite ? (
          <Pressable
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderRadius: 999,
              padding: 8,
              zIndex: 1,
            }}
            onPress={onToggleFavorite}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? '#EF4444' : '#131B2E'}
            />
          </Pressable>
        ) : null}
      </View>

      <View className="p-3.5">
        <View className="flex-row justify-between items-center">
          <Text className="flex-1 mr-2 text-[15px] font-bold text-textMain">{place.title}</Text>
          <View className="flex-row items-center">
            <Ionicons name="star" size={13} color="#FFB020" />
            <Text className="ml-1 text-xs font-bold text-textMain">
              {place.rating != null && Number(place.rating) > 0 && (place.review_count ?? 0) > 0
                ? Number(place.rating).toFixed(1)
                : t('common.newBadge')}
            </Text>
            {place.review_count && place.review_count > 0 ? (
              <Text className="ml-1 text-[11px] text-textMuted">({place.review_count})</Text>
            ) : null}
          </View>
        </View>

        <View className="flex-row items-center mt-1">
          <Ionicons name="location-outline" size={14} color="#FFB020" />
          <Text className="ml-1 text-[13px] text-textMuted" numberOfLines={1}>
            {place.location}
          </Text>
        </View>

        <Text className="text-xs text-inactive mt-1">
          {place.place_type ? t(`place_types.${place.place_type}`, { defaultValue: place.place_type }) : (place.category || 'Stay')}
          {place.rooms != null ? ` • ${place.rooms} ${t('common.rooms')}` : ''}
          {place.beds != null ? ` • ${place.beds} ${t('common.beds')}` : ''}
          {place.guests_capacity ? ` • ${place.guests_capacity} ${t('common.guests')}` : ''}
        </Text>

        {/* Giá tiền */}
        {hasDiscount ? (
          <View className="mt-2">
            <Text className="text-xs text-[#8A90A6] line-through font-medium">
              ${originalPrice}
            </Text>
            <View className="flex-row items-baseline">
              <Text className="text-xl font-extrabold text-[#FF6B00]">${currentPrice}</Text>
              <Text className="text-[13px] text-textMuted font-medium ml-1">{t('common.perNight')}</Text>
            </View>
          </View>
        ) : (
          <View className="flex-row items-baseline mt-2.5">
            <Text className="text-lg font-bold text-brand">${currentPrice}</Text>
            <Text className="text-[13px] text-textMuted font-medium ml-1">{t('common.perNight')}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
