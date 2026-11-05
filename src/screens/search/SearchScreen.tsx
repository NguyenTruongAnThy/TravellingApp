import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { getPlaces } from '../../services/placesService';
import { getFavoritePlaceIds, toggleFavorite } from '../../services/favoritesService';
import { useAuth } from '../../context/AuthContext';
import type { Place } from '../../types';
import { normalizeText } from '../../utils/normalize';
import PlaceCard from '../../components/PlaceCard';
import {
  BeachIcon,
  BrandLogoPin,
  CampingIcon,
  CitiesIcon,
  CountrysideIcon,
  FilterSlidersIcon,
  LakefrontIcon,
  MountainIcon,
  NotificationBellIcon,
} from '../../components/CategoryIcons';

// Categories matching Figma index design
const CATEGORIES: { id: string; label: string; icon: React.ComponentType<{ color?: string; size?: number }> }[] = [
  { id: 'Beach', label: 'Beach', icon: BeachIcon },
  { id: 'Mountain', label: 'Mountain', icon: MountainIcon },
  { id: 'Camping', label: 'Camping', icon: CampingIcon },
  { id: 'Countryside', label: 'Countryside', icon: CountrysideIcon },
  { id: 'Cities', label: 'Cities', icon: CitiesIcon },
  { id: 'Lakefront', label: 'Lakefront', icon: LakefrontIcon },
  { id: 'All', label: 'All Stays', icon: BeachIcon },
];

// Fallback sample places matching Figma index design & project SRS
const FALLBACK_PLACES: Place[] = [
  {
    id: 'sample-omaha-beach',
    title: 'Luxury Resort in Omaha Beach',
    location: 'Omaha Beach, New Zealand',
    category: 'Beach',
    place_type: 'Beachfront villa · 2 king beds',
    price_per_night: 20,
    rooms: 2,
    beds: 2,
    guests_capacity: 4,
    rating: 5.0,
    review_count: 128,
    images: ['https://api.builder.io/api/v1/image/assets/TEMP/26b30ee1b36d2458bbcd318ebde728a80a72b956?width=660'],
    amenities: ['Wifi', 'Kitchen', 'Pool', 'Parking', 'Beach access'],
    description: 'Luxury beachfront resort in Omaha Beach with infinity pool and private garden grounds.',
    is_visible: true,
  },
  {
    id: 'sample-san-jose',
    title: 'Designer Apartment in San Jose',
    location: 'San Jose, Costa Rica',
    category: 'Cities',
    place_type: 'Coastal retreat · 1 king bed',
    price_per_night: 28,
    rooms: 1,
    beds: 1,
    guests_capacity: 2,
    rating: 5.0,
    review_count: 94,
    images: ['https://api.builder.io/api/v1/image/assets/TEMP/3fd912e673e33157680499f8e38bc4180f7e5a8f?width=660'],
    amenities: ['Wifi', 'Kitchen', 'Gym', 'Internet access'],
    description: 'Modern designer apartment in central San Jose with bohemian style interior.',
    is_visible: true,
  },
  {
    id: 'sample-balian-treehouse',
    title: 'Balian Treehouse',
    location: 'Selemadeg Barat, Bali, Indonesia',
    category: 'Beach',
    place_type: 'Treehouse · 1 king bed',
    price_per_night: 20,
    rooms: 1,
    beds: 1,
    guests_capacity: 2,
    rating: 4.8,
    review_count: 262,
    images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80'],
    amenities: ['Wifi', 'Kitchen', 'Pool', 'Kayak', 'Parking'],
    description: 'Balian Treehouse set amidst tropical coconut groves, just a 3-minute walk to the beach.',
    is_visible: true,
  },
];

function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <View className="flex-row items-center justify-between py-2.5 border-b border-borderLight/60">
      <Text className="text-[14px] font-medium text-textMain">{label}</Text>
      <View className="flex-row items-center">
        <Pressable
          className="w-8 h-8 rounded-full border border-borderLight bg-white items-center justify-center"
          onPress={() => onChange(Math.max(0, value - 1))}
        >
          <Text className="text-base font-bold text-textMain">-</Text>
        </Pressable>
        <Text className="w-12 text-center text-sm font-bold text-textMain">
          {value}
        </Text>
        <Pressable
          className="w-8 h-8 rounded-full border border-borderLight bg-white items-center justify-center"
          onPress={() => onChange(value + 1)}
        >
          <Text className="text-base font-bold text-textMain">+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function SearchScreen({ navigation }: { navigation: any }) {
  const { session } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Search & Filter States
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Beach');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Advanced Filters
  const [minPrice, setMinPrice] = useState('10');
  const [maxPrice, setMaxPrice] = useState('250');
  const [guests, setGuests] = useState(0);
  const [minRooms, setMinRooms] = useState(0);
  const [minBeds, setMinBeds] = useState(0);
  const [placeType, setPlaceType] = useState('All');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Debounce 400ms per specifications
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Load places from Supabase with fallback
  const loadPlaces = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage('');

    const categoryParam = selectedCategory === 'All' ? null : selectedCategory;
    const { data, error } = await getPlaces({ category: categoryParam });

    if (error) {
      // Use fallback sample places if Supabase encounters a network issue
      setPlaces(FALLBACK_PLACES);
    } else if (data && data.length > 0) {
      setPlaces(data);
    } else {
      // When database is empty, use sample places to keep the UI rich and functional
      setPlaces(FALLBACK_PLACES);
    }

    setLoading(false);
    setRefreshing(false);
  }, [selectedCategory]);

  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  // Load favorite IDs
  useEffect(() => {
    if (!session?.user?.id) {
      setFavoriteIds([]);
      return;
    }
    getFavoritePlaceIds(session.user.id)
      .then(setFavoriteIds)
      .catch(() => {});
  }, [session]);

  const handleToggleFavorite = async (placeId: string) => {
    if (!session?.user?.id) {
      navigation.navigate('Login');
      return;
    }
    const isFav = favoriteIds.includes(placeId);
    setFavoriteIds((prev) =>
      isFav ? prev.filter((id) => id !== placeId) : [...prev, placeId]
    );
    try {
      await toggleFavorite(session.user.id, placeId, isFav);
    } catch {
      // Revert if error
      setFavoriteIds((prev) =>
        isFav ? [...prev, placeId] : prev.filter((id) => id !== placeId)
      );
    }
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (minPrice !== '10' || maxPrice !== '250') count += 1;
    if (guests > 0) count += 1;
    if (minRooms > 0) count += 1;
    if (minBeds > 0) count += 1;
    if (placeType !== 'All') count += 1;
    if (selectedAmenities.length > 0) count += 1;
    return count;
  }, [minPrice, maxPrice, guests, minRooms, minBeds, placeType, selectedAmenities]);

  const clearFilters = () => {
    setMinPrice('10');
    setMaxPrice('250');
    setGuests(0);
    setMinRooms(0);
    setMinBeds(0);
    setPlaceType('All');
    setSelectedAmenities([]);
  };

  // Filter logic: Price filter $10-$250
  const filteredPlaces = useMemo(() => {
    const q = normalizeText(debouncedQuery);
    const mn = Number(minPrice) || 10;
    const mx = Number(maxPrice) || 250;

    return places.filter((place) => {
      // Category filter (if not 'All')
      if (
        selectedCategory !== 'All' &&
        place.category &&
        place.category.toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        return false;
      }

      // Query filter
      if (q) {
        const hay = normalizeText(
          `${place.title} ${place.location} ${place.category || ''} ${place.description || ''}`
        );
        if (!hay.includes(q)) return false;
      }

      // Strict price boundaries
      if (place.price_per_night < mn || place.price_per_night > mx) return false;

      // Guests capacity
      if (guests > 0 && (place.guests_capacity || 0) < guests) return false;

      // Min rooms & beds
      if (minRooms > 0 && (place.rooms || 0) < minRooms) return false;
      if (minBeds > 0 && (place.beds || 0) < minBeds) return false;

      // Place type filter
      if (placeType !== 'All' && place.place_type) {
        if (!place.place_type.toLowerCase().includes(placeType.toLowerCase())) {
          return false;
        }
      }

      // Amenities filter
      if (selectedAmenities.length > 0) {
        const ams = place.amenities || [];
        if (!selectedAmenities.every((a) => ams.includes(a))) return false;
      }

      return true;
    });
  }, [
    places,
    selectedCategory,
    debouncedQuery,
    minPrice,
    maxPrice,
    guests,
    minRooms,
    minBeds,
    placeType,
    selectedAmenities,
  ]);

  const availableAmenities = ['Kitchen', 'Pool', 'Gym', 'Wifi', 'Parking', 'Beach access'];

  return (
    <View className="flex-1 bg-appBg">
      <StatusBar style="light" />

      {/* STICKY BLUE HEADER CONTAINER */}
      <View className="pt-12 pb-3.5 bg-[#5449E8] shadow-md z-20">
        {/* Top Brand Row */}
        <View className="px-5 pb-3 flex-row items-center justify-between">
          {/* Logo & Brandmark */}
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-2xl bg-white/20 items-center justify-center">
              <BrandLogoPin size={22} color="#FFFFFF" />
            </View>
            <Text className="text-[24px] font-bold text-white tracking-tight">
              WanderStay
            </Text>
          </View>

          {/* Quick Actions: Currency & Notifications */}
          <View className="flex-row items-center gap-2.5">
            <View className="px-3.5 py-1.5 rounded-full bg-white/20 items-center justify-center">
              <Text className="text-[12px] font-bold text-white">USD $</Text>
            </View>
            <Pressable
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center relative"
              onPress={() => navigation.navigate('Inbox')}
            >
              <NotificationBellIcon size={18} color="#FFFFFF" />
              <View className="w-2.5 h-2.5 rounded-full bg-white absolute top-2 right-2 border border-[#5449E8]" />
            </Pressable>
          </View>
        </View>

        {/* Floating Modern Search Pill */}
        <View className="mx-4 mt-1 mb-3 px-3.5 py-2 rounded-full bg-white flex-row items-center justify-between shadow-md">
          {/* Left: Search Icon & TextInput */}
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-10 h-10 rounded-full bg-[#F0EFFF] items-center justify-center mr-3">
              <Ionicons name="search" size={20} color="#4F46E5" />
            </View>
            <View className="flex-1">
              <TextInput
                className="text-[14px] font-bold text-textMain py-0.5"
                placeholder="Where do you want to stay?"
                placeholderTextColor="#131B2E"
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
              />
              <Text className="text-[11px] font-medium text-textMuted" numberOfLines={1}>
                {query ? 'Tap to search' : 'Anywhere · Any week · Add guests'}
              </Text>
            </View>
            {query ? (
              <Pressable onPress={() => setQuery('')} className="p-1">
                <Ionicons name="close-circle" size={18} color="#8A90A6" />
              </Pressable>
            ) : null}
          </View>

          {/* Right: Filter Button */}
          <Pressable
            className="w-10 h-10 rounded-full border border-[#E6E3F5] bg-white items-center justify-center relative shadow-sm"
            onPress={() => setShowFilterModal(true)}
          >
            <FilterSlidersIcon size={18} color={activeFilterCount > 0 ? '#4F46E5' : '#131B2E'} />
            {activeFilterCount > 0 ? (
              <View className="w-4 h-4 rounded-full bg-brand absolute -top-1 -right-1 items-center justify-center">
                <Text className="text-[9px] font-bold text-white">{activeFilterCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {/* Categories Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="pt-1 pb-1"
          contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center' }}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const IconComponent = cat.icon;
            return (
              <Pressable
                key={cat.id}
                className={`mr-2.5 px-4 py-2 rounded-full flex-row items-center gap-2 shadow-sm ${
                  isSelected
                    ? 'bg-white/25 border border-white/40'
                    : 'bg-white'
                }`}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <IconComponent
                  size={16}
                  color={isSelected ? '#FFFFFF' : '#131B2E'}
                />
                <Text
                  className={`text-[13px] font-bold ${
                    isSelected ? 'text-white' : 'text-textMain'
                  }`}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Active Filters bar (shown when filters are applied) */}
      {activeFilterCount > 0 ? (
        <View className="px-5 pt-3 pb-1 flex-row items-center justify-between">
          <Text className="text-[12px] font-medium text-textMuted">
            {filteredPlaces.length} places available
          </Text>
          <Pressable onPress={clearFilters}>
            <Text className="text-[12px] font-bold text-brand">Reset filters</Text>
          </Pressable>
        </View>
      ) : null}

      {/* LISTINGS STREAM */}
      {loading ? (
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="mt-3 text-sm text-textMuted font-medium">
            Loading stays...
          </Text>
        </View>
      ) : filteredPlaces.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="search-outline" size={48} color="#8A90A6" />
          <Text className="mt-3 text-base font-bold text-textMain text-center">
            No matching stays found
          </Text>
          <Text className="mt-1 text-xs text-textMuted text-center">
            Try adjusting your price filter ($10–$250) or choosing another category.
          </Text>
          <Pressable
            className="mt-5 px-5 py-2.5 rounded-full bg-brand"
            onPress={() => {
              clearFilters();
              setQuery('');
              setSelectedCategory('Beach');
            }}
          >
            <Text className="text-sm font-bold text-white">View all stays</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredPlaces}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PlaceCard
              place={item}
              isFavorite={favoriteIds.includes(item.id)}
              onToggleFavorite={() => handleToggleFavorite(item.id)}
              onPress={() => navigation.navigate('Detail', { placeId: item.id })}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: activeFilterCount > 0 ? 8 : 16,
            paddingBottom: 96,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadPlaces(true)}
              colors={['#4F46E5']}
            />
          }
        />
      )}

      {/* ADVANCED FILTER MODAL (UC006 - $10 to $250) */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-[28px] max-h-[85%] overflow-hidden">
            {/* Header */}
            <View className="px-5 py-4 border-b border-borderLight flex-row items-center justify-between">
              <Pressable onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#131B2E" />
              </Pressable>
              <Text className="text-base font-bold text-textMain">Filters</Text>
              <Pressable onPress={clearFilters}>
                <Text className="text-sm font-bold text-brand">Clear all</Text>
              </Pressable>
            </View>

            <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
              {/* Price Range: $10 – $250 */}
              <View className="mb-6">
                <Text className="text-base font-bold text-textMain">Price range</Text>
                <Text className="text-xs text-textMuted mt-0.5">
                  Per night price, excluding taxes & fees ($10 – $250 supported)
                </Text>
                <View className="flex-row items-center justify-between mt-3 gap-3">
                  <View className="flex-1 p-3 rounded-2xl border border-borderLight bg-appBg">
                    <Text className="text-[11px] text-textMuted font-medium">Minimum</Text>
                    <View className="flex-row items-center mt-1">
                      <Text className="text-sm font-bold text-textMain mr-1">$</Text>
                      <TextInput
                        className="text-base font-bold text-textMain flex-1 py-0"
                        keyboardType="numeric"
                        value={minPrice}
                        onChangeText={setMinPrice}
                      />
                    </View>
                  </View>
                  <Text className="text-base font-bold text-textMuted">-</Text>
                  <View className="flex-1 p-3 rounded-2xl border border-borderLight bg-appBg">
                    <Text className="text-[11px] text-textMuted font-medium">Maximum</Text>
                    <View className="flex-row items-center mt-1">
                      <Text className="text-sm font-bold text-textMain mr-1">$</Text>
                      <TextInput
                        className="text-base font-bold text-textMain flex-1 py-0"
                        keyboardType="numeric"
                        value={maxPrice}
                        onChangeText={setMaxPrice}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Type of place */}
              <View className="mb-6">
                <Text className="text-base font-bold text-textMain">Type of place</Text>
                <View className="flex-row gap-2 mt-3">
                  {['All', 'Entire place', 'Private room', 'Dormitories'].map((type) => {
                    const sel = placeType === type;
                    return (
                      <Pressable
                        key={type}
                        className={`px-3 py-2 rounded-full border ${
                          sel
                            ? 'border-brand bg-brand'
                            : 'border-borderLight bg-white'
                        }`}
                        onPress={() => setPlaceType(type)}
                      >
                        <Text
                          className={`text-xs ${
                            sel ? 'font-bold text-white' : 'font-medium text-textMain'
                          }`}
                        >
                          {type}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Rooms and beds */}
              <View className="mb-6">
                <Text className="text-base font-bold text-textMain mb-1">
                  Rooms and beds
                </Text>
                <Stepper label="Guests capacity" value={guests} onChange={setGuests} />
                <Stepper label="Bedrooms" value={minRooms} onChange={setMinRooms} />
                <Stepper label="Beds" value={minBeds} onChange={setMinBeds} />
              </View>

              {/* Amenities */}
              <View className="mb-8">
                <Text className="text-base font-bold text-textMain mb-2">Amenities</Text>
                <View className="flex-row flex-wrap gap-2">
                  {availableAmenities.map((amenity) => {
                    const active = selectedAmenities.includes(amenity);
                    return (
                      <Pressable
                        key={amenity}
                        className={`px-3.5 py-2 rounded-full border ${
                          active
                            ? 'border-brand bg-brand'
                            : 'border-borderLight bg-white'
                        }`}
                        onPress={() => {
                          setSelectedAmenities((prev) =>
                            active
                              ? prev.filter((a) => a !== amenity)
                              : [...prev, amenity]
                          );
                        }}
                      >
                        <Text
                          className={`text-xs ${
                            active ? 'font-bold text-white' : 'font-medium text-textMain'
                          }`}
                        >
                          {amenity}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Bottom Button */}
            <View className="p-5 border-t border-borderLight bg-white">
              <Pressable
                className="w-full py-3.5 rounded-full bg-brand items-center justify-center shadow-sm"
                onPress={() => setShowFilterModal(false)}
              >
                <Text className="text-base font-bold text-white">
                  Show {filteredPlaces.length} places
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
