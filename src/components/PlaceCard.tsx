import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { Place } from '../types';

interface PlaceCardProps {
  place: Place;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onPress?: () => void;
}

export default function PlaceCard({
  place,
  isFavorite = false,
  onToggleFavorite,
  onPress,
}: PlaceCardProps) {
  const mainImage =
    Array.isArray(place.images) && place.images.length > 0
      ? place.images[0]
      : 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80';

  const isGuestFavourite = (place.rating ?? 0) >= 4.5;
  const ratingText = place.rating != null ? place.rating.toFixed(1) : '5.0';
  const reviewsCount = place.review_count ?? 128;

  // Secondary subtitle: e.g. "Beachfront villa · 2 king beds"
  const secondarySubtitle =
    place.place_type ||
    `${place.category || 'Villa'} · ${place.beds ? `${place.beds} beds` : '2 king beds'}`;

  // Third line: location or stay date
  const locationOrDate = place.location ? `📍 ${place.location}` : 'Jan 15 – 20';

  return (
    <Pressable
      className="bg-cardBg rounded-[24px] border border-borderLight p-3 mb-6 shadow-sm overflow-hidden"
      onPress={onPress}
    >
      {/* Image Carousel Container */}
      <View className="aspect-[4/3] w-full rounded-[16px] overflow-hidden relative bg-[#F1F5F9]">
        <Image
          source={{ uri: mainImage }}
          className="w-full h-full"
          resizeMode="cover"
        />

        {/* Top-Left: Guest Favourite Badge */}
        {isGuestFavourite ? (
          <View className="absolute left-3 top-3 bg-white rounded-full px-2.5 py-1 flex-row items-center shadow-sm z-10">
            <View className="w-1.5 h-1.5 rounded-full bg-brand mr-1.5" />
            <Text className="text-[11px] font-bold text-brand">Guest favourite</Text>
          </View>
        ) : null}

        {/* Top-Right: Favorite Button */}
        {onToggleFavorite ? (
          <Pressable
            className="absolute right-3 top-3 w-8 h-8 rounded-full bg-white/90 items-center justify-center shadow-sm z-10"
            onPress={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          >
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <Path
                d="M2.87869 4.21201C2.31608 4.77462 2 5.53768 2 6.33334C2 7.12899 2.31608 7.89206 2.87869 8.45467L8.00003 13.576L13.1214 8.45467C14.2922 7.28388 14.2922 5.3828 13.1214 4.21201C11.9506 3.04121 10.0495 3.04121 8.87869 4.21201L8.00003 5.09067L7.12136 4.21201C6.55875 3.64939 5.79568 3.33331 5.00003 3.33331C4.20437 3.33331 3.4413 3.64939 2.87869 4.21201V4.21201"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke={isFavorite ? '#EF4444' : '#131B2E'}
                fill={isFavorite ? '#EF4444' : 'none'}
              />
            </Svg>
          </Pressable>
        ) : null}

        {/* Bottom Carousel Dots Indicator */}
        <View className="absolute bottom-3 left-0 right-0 flex-row justify-center items-center gap-1.5 z-10">
          <View className="w-4 h-1.5 rounded-full bg-white shadow-sm" />
          <View className="w-1.5 h-1.5 rounded-full bg-white/60" />
          <View className="w-1.5 h-1.5 rounded-full bg-white/60" />
          <View className="w-1.5 h-1.5 rounded-full bg-white/60" />
        </View>
      </View>

      {/* Listing Details */}
      <View className="px-1 pt-3">
        {/* Title & Rating */}
        <View className="flex-row justify-between items-start">
          <Text
            className="flex-1 mr-2 text-[15px] font-bold text-textMain"
            numberOfLines={1}
          >
            {place.title}
          </Text>
          <View className="flex-row items-center gap-1">
            <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
              <Path
                d="M6.33431 2.04889C6.54431 1.40419 7.45641 1.40419 7.66571 2.04889L8.41471 4.35329C8.50857 4.64118 8.7769 4.83607 9.07971 4.83629H11.5031C12.1814 4.83629 12.4628 5.70429 11.9147 6.10329L9.95471 7.52709C9.70919 7.7052 9.60631 8.02117 9.69991 8.30969L10.4489 10.6141C10.6589 11.2588 9.92041 11.7957 9.37091 11.3967L7.41091 9.97289C7.16565 9.79484 6.83366 9.79484 6.58841 9.97289L4.62841 11.3967C4.07961 11.7957 3.34181 11.2588 3.55111 10.6141L4.30011 8.30969C4.3937 8.02117 4.29083 7.7052 4.04531 7.52709L2.08601 6.10399C1.53791 5.70499 1.82001 4.83699 2.49761 4.83699H4.92031C5.22337 4.83707 5.49206 4.64212 5.58601 4.35399L6.33501 2.04959L6.33431 2.04889"
                fill="#FFB020"
              />
            </Svg>
            <Text className="text-[12px] font-bold text-textMain">{ratingText}</Text>
            <Text className="text-[11px] font-medium text-textMuted">({reviewsCount})</Text>
          </View>
        </View>

        {/* Secondary Subtitle Info */}
        <Text className="text-[12px] font-medium text-textMuted mt-0.5" numberOfLines={1}>
          {secondarySubtitle}
        </Text>

        {/* Third Subtitle: Location / Dates */}
        <Text className="text-[12px] text-textMuted mt-0.5" numberOfLines={1}>
          {locationOrDate}
        </Text>

        {/* Price Row */}
        <View className="flex-row items-baseline gap-1 mt-1.5">
          <Text className="text-[15px] font-extrabold text-textMain">
            ${place.price_per_night}
          </Text>
          <Text className="text-[12px] font-medium text-textMuted">/ night</Text>
        </View>
      </View>
    </Pressable>
  );
}
