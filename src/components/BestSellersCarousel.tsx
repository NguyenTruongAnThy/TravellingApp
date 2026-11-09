import React from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Place } from '../types';

interface BestSellersCarouselProps {
  places: Place[];
  favoriteIds: string[];
  onToggleFavorite: (placeId: string, isFav: boolean) => void;
  onSelectPlace: (placeId: string) => void;
}

export default function BestSellersCarousel({
  places,
  favoriteIds,
  onToggleFavorite,
  onSelectPlace,
}: BestSellersCarouselProps) {
  // Lọc và xếp hạng Best Sellers: sao >= 4.5, có review, ưu tiên lượt review nhiều nhất
  const bestSellers = React.useMemo(() => {
    return places
      .filter((p) => p.rating != null && Number(p.rating) >= 4.5 && (p.review_count ?? 0) > 0)
      .sort((a, b) => {
        const countDiff = (b.review_count ?? 0) - (a.review_count ?? 0);
        if (countDiff !== 0) return countDiff;
        return Number(b.rating ?? 0) - Number(a.rating ?? 0);
      })
      .slice(0, 6);
  }, [places]);

  if (bestSellers.length === 0) return null;

  return (
    <View className="mb-6">
      {/* Header của Section Best Sellers */}
      <View className="flex-row items-center justify-between mb-3 px-1">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center">
            <View
              className="w-7 h-7 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: '#FEE2E2' }}
            >
              <Ionicons name="flame" size={16} color="#EF4444" />
            </View>
            <Text className="text-lg font-black text-textMain tracking-tight">
              Chỗ Ở Bán Chạy Nhất
            </Text>
          </View>
        </View>

        <View
          className="px-2.5 py-1 rounded-full flex-row items-center"
          style={{ backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' }}
        >
          <Ionicons name="trophy" size={11} color="#D97706" />
          <Text className="ml-1 text-[11px] font-extrabold text-[#B45309]">
            Top {bestSellers.length} Hot
          </Text>
        </View>
      </View>

      {/* Dải trượt ngang Horizontal Carousel */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={bestSellers}
        keyExtractor={(item) => `best-seller-${item.id}`}
        contentContainerStyle={{ paddingRight: 8 }}
        renderItem={({ item, index }) => {
          const isFavorite = favoriteIds.includes(item.id);
          const rank = index + 1;
          const mainImage =
            Array.isArray(item.images) && item.images.length > 0
              ? item.images[0]
              : 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80';

          const destination =
            item.location?.split(',')[0]?.trim() || item.location || 'Điểm đến';

          // Tính toán giảm giá nếu có
          const originalPrice = item.original_price ? Number(item.original_price) : null;
          const currentPrice = Number(item.price_per_night);
          const hasDiscount = originalPrice != null && originalPrice > currentPrice;
          const discountPercent = hasDiscount
            ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
            : 0;

          // Cấu hình huy hiệu theo thứ hạng
          const rankBadgeBg =
            rank === 1
              ? '#FF5A5F' // Đỏ san hô rực rỡ Top 1
              : rank === 2
              ? '#D97706' // Vàng kim Top 2
              : rank === 3
              ? '#0284C7' // Xanh đại dương Top 3
              : '#4F46E5'; // Indigo Top 4-6

          const rankBadgeLabel =
            rank === 1
              ? '🥇 #1 BEST SELLER'
              : rank === 2
              ? '🥈 #2 TOP CHOICE'
              : rank === 3
              ? '🥉 #3 POPULAR'
              : `🔥 TOP #${rank}`;

          return (
            <Pressable
              key={item.id}
              className="bg-cardBg rounded-3xl overflow-hidden mr-4 border border-borderLight"
              style={{
                width: 275,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 4,
              }}
              onPress={() => onSelectPlace(item.id)}
            >
              {/* Phần ảnh bìa */}
              <View style={{ height: 165, position: 'relative' }}>
                <Image
                  source={{ uri: mainImage }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />

                {/* Huy hiệu thứ hạng Best Seller (Góc trên bên trái) */}
                <View
                  className="flex-row items-center px-3 py-1.5"
                  style={{
                    backgroundColor: rankBadgeBg,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    borderTopLeftRadius: 24,
                    borderBottomRightRadius: 14,
                    zIndex: 2,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3,
                    elevation: 4,
                  }}
                >
                  <Ionicons
                    name={rank === 1 ? 'flame' : rank <= 3 ? 'trophy' : 'star'}
                    size={12}
                    color="#FFFFFF"
                  />
                  <Text className="ml-1 text-[11px] font-black text-white tracking-wider">
                    {rankBadgeLabel}
                  </Text>
                </View>

                {/* Nút yêu thích (Góc trên bên phải) */}
                <Pressable
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    backgroundColor: 'rgba(255,255,255,0.92)',
                    borderRadius: 999,
                    padding: 6,
                    zIndex: 3,
                  }}
                  onPress={() => onToggleFavorite(item.id, isFavorite)}
                >
                  <Ionicons
                    name={isFavorite ? 'heart' : 'heart-outline'}
                    size={18}
                    color={isFavorite ? '#EF4444' : '#131B2E'}
                  />
                </Pressable>

                {/* Tag giảm giá ruy băng 3D nếu có (Mép phải dưới của ảnh) */}
                {hasDiscount ? (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 12,
                      right: 0,
                      zIndex: 2,
                    }}
                  >
                    <View
                      className="flex-row items-center px-2.5 py-0.5"
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
                      <Text className="text-[11px] font-extrabold text-white tracking-tight">
                        Tiết kiệm {discountPercent}%
                      </Text>
                    </View>
                    <View
                      style={{
                        position: 'absolute',
                        right: 0,
                        bottom: -5,
                        width: 0,
                        height: 0,
                        borderTopWidth: 5,
                        borderTopColor: '#C2410C',
                        borderRightWidth: 5,
                        borderRightColor: 'transparent',
                      }}
                    />
                  </View>
                ) : null}

                {/* Dải Social proof: số lượt đánh giá / khách hài lòng */}
                <View
                  className="flex-row items-center px-2.5 py-1 rounded-full"
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    left: 10,
                    backgroundColor: 'rgba(19, 27, 46, 0.72)',
                    zIndex: 2,
                  }}
                >
                  <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                  <Text className="ml-1 text-[10px] font-bold text-white">
                    {item.review_count} khách đã ở
                  </Text>
                </View>
              </View>

              {/* Phần nội dung chi tiết của Card */}
              <View className="p-3.5">
                {/* Địa điểm & Đánh giá sao */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1 mr-2">
                    <Ionicons name="location-sharp" size={13} color="#EF4444" />
                    <Text className="ml-0.5 text-xs font-bold text-textMuted" numberOfLines={1}>
                      {destination}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="star" size={13} color="#FFB020" />
                    <Text className="ml-1 text-xs font-bold text-textMain">
                      {Number(item.rating).toFixed(1)}
                    </Text>
                    <Text className="ml-0.5 text-[11px] text-textMuted">
                      ({item.review_count})
                    </Text>
                  </View>
                </View>

                {/* Tiêu đề chỗ ở */}
                <Text
                  className="mt-1 text-[14px] font-bold text-textMain"
                  numberOfLines={1}
                >
                  {item.title}
                </Text>

                {/* Thông tin phòng & sức chứa */}
                <Text className="text-[11px] text-inactive mt-0.5" numberOfLines={1}>
                  {item.place_type || 'Stay'}
                  {item.rooms != null ? ` • ${item.rooms} phòng` : ''}
                  {item.guests_capacity ? ` • ${item.guests_capacity} khách` : ''}
                </Text>

                {/* Giá tiền */}
                {hasDiscount ? (
                  <View className="mt-2 flex-row items-baseline justify-between">
                    <View>
                      <Text className="text-[11px] text-[#8A90A6] line-through font-medium">
                        ${originalPrice}
                      </Text>
                      <View className="flex-row items-baseline">
                        <Text className="text-lg font-black text-[#FF6B00]">
                          ${currentPrice}
                        </Text>
                        <Text className="text-[11px] text-textMuted font-medium ml-1">
                          / đêm
                        </Text>
                      </View>
                    </View>
                    <View
                      className="px-2 py-1 rounded-lg"
                      style={{ backgroundColor: '#EFF6FF' }}
                    >
                      <Text className="text-[10px] font-bold text-brand">Đặt ngay ›</Text>
                    </View>
                  </View>
                ) : (
                  <View className="mt-2.5 flex-row items-baseline justify-between">
                    <View className="flex-row items-baseline">
                      <Text className="text-base font-bold text-brand">
                        ${currentPrice}
                      </Text>
                      <Text className="text-[11px] text-textMuted font-medium ml-1">
                        / đêm
                      </Text>
                    </View>
                    <View
                      className="px-2 py-1 rounded-lg"
                      style={{ backgroundColor: '#EFF6FF' }}
                    >
                      <Text className="text-[10px] font-bold text-brand">Đặt ngay ›</Text>
                    </View>
                  </View>
                )}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
