import React from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { Place } from '../types';

interface RelatedPlacesSectionProps {
  relatedPlaces: (Place & { matchReason?: string })[];
  onSelectPlace: (placeId: string) => void;
  currentLocation?: string | null;
  currentPlaceType?: string | null;
}

export default function RelatedPlacesSection({
  relatedPlaces,
  onSelectPlace,
  currentLocation,
  currentPlaceType,
}: RelatedPlacesSectionProps) {
  const { t, i18n } = useTranslation();
  if (!relatedPlaces || relatedPlaces.length === 0) return null;

  const areaName =
    currentLocation?.split(',')[0]?.trim() || currentLocation || 'khu vực này';

  return (
    <View className="mx-5 mt-4 mb-2 rounded-3xl bg-white border border-borderLight p-5">
      {/* Header section */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center">
            <View
              className="w-7 h-7 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: '#EDE9FE' }}
            >
              <Ionicons name="sparkles" size={15} color="#4F46E5" />
            </View>
            <Text className="text-base font-bold text-textMain">
              {i18n.language === 'vi' ? 'Chỗ Nghỉ Tương Tự' : 'Similar Stays'}
            </Text>
          </View>
          <Text className="mt-0.5 text-xs text-textMuted ml-9">
            {i18n.language === 'vi'
              ? `Gợi ý cùng tại ${areaName} ${currentPlaceType ? `& kiểu ${currentPlaceType}` : ''}`
              : `Recommended stays in ${areaName}`}
          </Text>
        </View>

        <View
          className="px-2.5 py-1 rounded-full flex-row items-center"
          style={{ backgroundColor: '#F3F4F6' }}
        >
          <Text className="text-[11px] font-bold text-textMuted">
            {relatedPlaces.length} {i18n.language === 'vi' ? 'gợi ý' : 'stays'}
          </Text>
        </View>
      </View>

      {/* Dải trượt ngang các thẻ chỗ nghỉ gợi ý */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={relatedPlaces}
        keyExtractor={(item) => `related-${item.id}`}
        contentContainerStyle={{ paddingRight: 4, paddingTop: 4, paddingBottom: 4 }}
        renderItem={({ item }) => {
          const mainImage =
            Array.isArray(item.images) && item.images.length > 0
              ? item.images[0]
              : 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80';

          const destination =
            item.location?.split(',')[0]?.trim() || item.location || 'Điểm đến';

          const originalPrice = item.original_price ? Number(item.original_price) : null;
          const currentPrice = Number(item.price_per_night);
          const hasDiscount = originalPrice != null && originalPrice > currentPrice;
          const discountPercent = hasDiscount
            ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
            : 0;

          return (
            <Pressable
              key={item.id}
              className="bg-cardBg rounded-2xl overflow-hidden mr-3.5 border border-borderLight"
              style={{
                width: 230,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 3,
              }}
              onPress={() => onSelectPlace(item.id)}
            >
              {/* Ảnh bìa */}
              <View style={{ height: 130, position: 'relative' }}>
                <Image
                  source={{ uri: mainImage }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />

                {/* Tag lý do phù hợp / khu vực */}
                <View
                  className="flex-row items-center px-2 py-1"
                  style={{
                    backgroundColor: '#4F46E5',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    borderTopLeftRadius: 16,
                    borderBottomRightRadius: 10,
                    zIndex: 2,
                    maxWidth: 160,
                  }}
                >
                  <Ionicons name="sparkles" size={10} color="#FFFFFF" />
                  <Text
                    className="ml-1 text-[10px] font-bold text-white tracking-wide"
                    numberOfLines={1}
                  >
                    {item.matchReason || destination}
                  </Text>
                </View>

                {/* Rating badge */}
                <View
                  className="flex-row items-center px-2 py-0.5 rounded-full"
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(255,255,255,0.92)',
                    zIndex: 2,
                  }}
                >
                  <Ionicons name="star" size={11} color="#FFB020" />
                  <Text className="ml-1 text-[10px] font-bold text-textMain">
                    {item.rating != null && Number(item.rating) > 0
                      ? Number(item.rating).toFixed(1)
                      : 'New'}
                  </Text>
                </View>

                {/* Tag giảm giá nếu có */}
                {hasDiscount ? (
                  <View
                    className="flex-row items-center px-2 py-0.5 rounded-md"
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      backgroundColor: '#FF6B00',
                      zIndex: 2,
                    }}
                  >
                    <Text className="text-[10px] font-extrabold text-white">
                      -{discountPercent}%
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Thông tin phòng */}
              <View className="p-3">
                <Text
                  className="text-xs font-bold text-textMain"
                  numberOfLines={1}
                >
                  {item.title}
                </Text>

                <View className="flex-row items-center mt-1">
                  <Ionicons name="location-outline" size={12} color="#8A90A6" />
                  <Text className="ml-0.5 text-[11px] text-textMuted flex-1" numberOfLines={1}>
                    {destination} • {item.place_type || 'Stay'}
                  </Text>
                </View>

                {/* Giá tiền */}
                <View className="mt-2 flex-row items-baseline justify-between">
                  <View className="flex-row items-baseline">
                    {hasDiscount ? (
                      <Text className="text-[10px] text-[#8A90A6] line-through mr-1">
                        ${originalPrice}
                      </Text>
                    ) : null}
                    <Text
                      className={`text-sm font-black ${
                        hasDiscount ? 'text-[#FF6B00]' : 'text-brand'
                      }`}
                    >
                      ${currentPrice}
                    </Text>
                    <Text className="text-[10px] text-textMuted ml-0.5">{t('common.perNight')}</Text>
                  </View>

                  <View className="flex-row items-center">
                    <Text className="text-[10px] font-bold text-brand">
                      {i18n.language === 'vi' ? 'Xem phòng ›' : 'View stay ›'}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
