import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getPlaceById } from '../../services/placesService';
import { getFavoritePlaceIds, toggleFavorite } from '../../services/favoritesService';
import { getReviewsByPlace } from '../../services/reviewService';
import type { Place, Review } from '../../types';
import { useAuth } from '../../context/AuthContext';

// Default mock values directly from the Figma design
const DEFAULT_HERO_IMAGE =
  'https://api.builder.io/api/v1/image/assets/TEMP/bd03d5ecd1899353f14938c377e42cb663cd9fde?width=780';
const DEFAULT_INTERIOR_IMAGE =
  'https://api.builder.io/api/v1/image/assets/TEMP/a1cb3b7b5c638c9687231d009e21d41f09130456?width=652';
const DEFAULT_MAP_IMAGE =
  'https://api.builder.io/api/v1/image/assets/TEMP/30ea2286406486f1ee2e0807d3258a2887acbb68?width=652';

const DEFAULT_DESCRIPTION =
  'Escape to an idyllic bohemian sanctuary nestled high in the jungle canopy of Balian. Experience an authentic bamboo treehouse with 360-degree rainforest vistas, gentle ocean breezes, handcrafted artisan furnishings, and an open-air plunge pool suspended amidst tropical greenery.';

// 28 Facilities categorized per WanderStay specifications
const ALL_28_FACILITIES = [
  {
    category: 'Connectivity & Workspace',
    items: [
      { name: 'Fast 100 Mbps internet', desc: 'Dedicated fiber WiFi coverage throughout property', icon: 'wifi' },
      { name: 'Dedicated workspace', desc: 'Ergonomic teak desk & comfortable seating', icon: 'laptop-outline' },
      { name: 'Universal power outlets', desc: 'International sockets & USB charging points', icon: 'flash-outline' },
      { name: 'Pocket WiFi hotspot', desc: 'Portable 4G device available upon request', icon: 'radio-outline' },
    ],
  },
  {
    category: 'Kitchen & Dining',
    items: [
      { name: 'Fully equipped kitchen', desc: 'Full culinary set for home cooking', icon: 'restaurant-outline' },
      { name: 'Modern refrigerator & freezer', desc: 'Spacious food & beverage preservation', icon: 'cube-outline' },
      { name: 'Gas stove & hood', desc: 'Two-burner cooking station with exhaust', icon: 'flame-outline' },
      { name: 'Artisan tableware & glassware', desc: 'Handmade Balinese ceramic plates & mugs', icon: 'wine-outline' },
      { name: 'Espresso coffee maker & kettle', desc: 'Fresh local Balinese beans & organic teas', icon: 'cafe-outline' },
      { name: 'Cooking essentials & spices', desc: 'Virgin coconut oil, Himalayan salt, black pepper', icon: 'nutrition-outline' },
    ],
  },
  {
    category: 'Bathroom & Wellness',
    items: [
      { name: 'Private plunge pool', desc: 'Infinity freshwater pool suspended above the jungle', icon: 'water-outline' },
      { name: 'Rainforest outdoor shower', desc: 'Continuous hot water with natural stone finishes', icon: 'rainy-outline' },
      { name: 'Organic luxury toiletries', desc: 'Chemical-free shampoo, conditioner & shower gel', icon: 'leaf-outline' },
      { name: 'Plush bathrobes & slippers', desc: '100% organic cotton loungewear', icon: 'shirt-outline' },
      { name: 'Ionic hair dryer', desc: 'High-power styling dryer', icon: 'sparkles-outline' },
    ],
  },
  {
    category: 'Bedroom & Comfort',
    items: [
      { name: 'King-size pillowtop bed', desc: 'Orthopedic natural latex mattress', icon: 'bed-outline' },
      { name: 'Egyptian cotton linens', desc: '400 thread-count hypoallergenic bedding', icon: 'layers-outline' },
      { name: 'Room-darkening bamboo blinds', desc: 'Full morning sunlight privacy controls', icon: 'sunny-outline' },
      { name: 'Dual air conditioning & fan', desc: 'Whisper-quiet climate control', icon: 'snow-outline' },
      { name: 'Open bamboo wardrobe', desc: 'Custom velvet hangers & luggage rack', icon: 'file-tray-stacked-outline' },
    ],
  },
  {
    category: 'Outdoor & Living',
    items: [
      { name: 'Tropical garden terrace', desc: 'Lush flora, private veranda & daybed loungers', icon: 'flower-outline' },
      { name: 'Hanging bohemian hammock', desc: 'Double-woven cotton relaxation nest', icon: 'infinite-outline' },
      { name: 'Free parking on premises', desc: 'Designated secure private vehicle bay', icon: 'car-outline' },
      { name: 'Kayak rentals available', desc: 'Complimentary river kayaks & life vests ($5/day)', icon: 'boat-outline' },
      { name: 'Outdoor dining gazebo', desc: 'Shaded alfresco table for morning brunch', icon: 'business-outline' },
    ],
  },
  {
    category: 'Safety & Convenience',
    items: [
      { name: 'Keyless Smart Key access', desc: '4-digit door PIN (4821#) & Bluetooth unlock', icon: 'key-outline' },
      { name: 'First aid & fire kit', desc: 'Certified emergency supplies on site', icon: 'medkit-outline' },
      { name: 'Daily housekeeping', desc: 'Complimentary room refresh upon request', icon: 'brush-outline' },
    ],
  },
];

export default function DetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const placeId = route?.params?.placeId as string | undefined;

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Modals state
  const [facilitiesVisible, setFacilitiesVisible] = useState(false);
  const [descriptionVisible, setDescriptionVisible] = useState(false);
  const [houseRulesVisible, setHouseRulesVisible] = useState(false);
  const [neighborhoodVisible, setNeighborhoodVisible] = useState(false);
  const [reviewsVisible, setReviewsVisible] = useState(false);

  const loadPlace = useCallback(async () => {
    if (!placeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await getPlaceById(placeId);
    if (data) {
      setPlace(data);
    }
    setLoading(false);
  }, [placeId]);

  useEffect(() => { loadPlace(); }, [loadPlace]);

  useEffect(() => {
    if (!placeId) return;
    getReviewsByPlace(placeId).then(({ data }) => {
      if (data && data.length > 0) {
        setReviews(data);
      }
    });
  }, [placeId]);

  useEffect(() => {
    if (!placeId || !session?.user?.id) {
      setIsFavorite(false);
      return;
    }
    getFavoritePlaceIds(session.user.id)
      .then((ids) => setIsFavorite(ids.includes(placeId)))
      .catch(() => {});
  }, [placeId, session]);

  const handleShare = async () => {
    try {
      await Share.share({
        title: place?.title || 'Balian treehouse',
        message: `Check out ${place?.title || 'Balian treehouse'} in ${
          place?.location || 'Bali, Indonesia'
        } on WanderStay!`,
      });
    } catch (err) {
      // User dismissed share dialog
    }
  };

  const handleToggleFavorite = async () => {
    if (!session) {
      navigation.navigate('Login');
      return;
    }
    const targetId = place?.id || placeId || 'balian-treehouse';
    const nextState = !isFavorite;
    setIsFavorite(nextState);
    await toggleFavorite(session.user.id, targetId, isFavorite);
  };

  const handleReserve = () => {
    if (!session) {
      navigation.navigate('Login');
      return;
    }
    // Navigate to bookings / reservation checkout
    navigation.navigate('MainTabs', { screen: 'Booking' });
  };

  const handleOpenMap = () => {
    if (place?.id) {
      navigation.navigate('Map', {
        placeId: place.id,
        latitude: (place as any).latitude,
        longitude: (place as any).longitude,
        title: place.title,
        location: place.location,
      });
    } else {
      setNeighborhoodVisible(true);
    }
  };

  // Resolved dynamic values with Figma design defaults
  const title = place?.title || 'Balian treehouse';
  const location = place?.location || 'Bali, Indonesia';
  const price = place?.price_per_night ?? 320;
  const rating = place?.rating != null ? place.rating.toFixed(1) : '4.5';
  const reviewCount = place?.review_count ?? 262;
  const heroImage =
    Array.isArray(place?.images) && place.images.length > 0
      ? place.images[0]
      : DEFAULT_HERO_IMAGE;
  const interiorImage =
    Array.isArray(place?.images) && place.images.length > 1
      ? place.images[1]
      : DEFAULT_INTERIOR_IMAGE;
  const guestsCapacity = place?.guests_capacity ?? 2;
  const bedroomsCount = place?.rooms ?? 1;
  const bedsCount = place?.beds ?? 1;
  const checkIn = place?.check_in_time ? `From ${place.check_in_time}` : 'From 14:00';
  const checkOut = place?.check_out_time ? `Until ${place.check_out_time}` : 'Until 12:00';
  const descriptionText = place?.description || DEFAULT_DESCRIPTION;

  if (loading) {
    return (
      <View className="flex-1 bg-appBg items-center justify-center px-6">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-3 text-sm text-textMuted">Loading property details...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-appBg">
      {/* Sticky Top Header Bar */}
      <View
        style={{ paddingTop: Math.max(insets.top, 12) }}
        className="bg-white/95 border-b border-borderLight px-4 pb-3 flex-row items-center justify-between z-20 shadow-sm"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="w-10 h-10 rounded-full bg-appBg items-center justify-center border border-borderLight"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#131B2E" />
        </Pressable>

        <Text className="text-lg font-bold text-textMain text-center flex-1 mx-2" numberOfLines={1}>
          Property Details
        </Text>

        <View className="flex-row items-center gap-1.5">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share listing"
            className="w-10 h-10 rounded-full bg-appBg items-center justify-center border border-borderLight"
            onPress={handleShare}
          >
            <Ionicons name="share-social-outline" size={18} color="#131B2E" />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save listing"
            className="w-10 h-10 rounded-full bg-appBg items-center justify-center border border-borderLight"
            onPress={handleToggleFavorite}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? '#EF4444' : '#131B2E'}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1 bg-appBg"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* 1. Top Hero Gallery Section */}
        <View className="relative bg-[#F2F3FF] overflow-hidden rounded-b-[32px] shadow-sm">
          <View className="aspect-[4/3] w-full max-h-[340px] relative overflow-hidden bg-black/5">
            <Image
              source={{ uri: heroImage }}
              className="w-full h-full"
              resizeMode="cover"
            />
            {/* Gradient contrast simulation overlay */}
            <View className="absolute inset-0 bg-black/15 pointer-events-none" />

            {/* Bottom Controls over Hero */}
            <View className="absolute bottom-4 left-4 right-4 flex-row items-center justify-between">
              {/* Carousel Pagination Dots */}
              <View className="flex-row items-center gap-1.5 bg-[#131B2E]/60 px-3 py-1.5 rounded-full backdrop-blur-md">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Pressable
                    key={i}
                    onPress={() => setActivePhotoIndex(i)}
                    className={`rounded-full ${
                      activePhotoIndex === i ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-white/60'
                    }`}
                  />
                ))}
              </View>

              {/* Photo Count Badge */}
              <View className="flex-row items-center gap-1.5 bg-[#131B2E]/70 px-3 py-1 rounded-full backdrop-blur-md">
                <Ionicons name="images-outline" size={13} color="#FFF" />
                <Text className="text-white text-xs font-semibold">24</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content Stream Container */}
        <View className="px-4 pt-4 gap-4">
          {/* Section 2: Title & Location Header Card */}
          <View className="bg-white rounded-2xl p-4 border border-borderLight shadow-sm">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-2">
                <Text className="text-2xl font-bold text-textMain tracking-tight">
                  {title}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Ionicons name="location-sharp" size={14} color="#4F46E5" />
                  <Text className="ml-1 text-sm text-[#3C494C]">{location}</Text>
                </View>
              </View>

              <Pressable
                className="py-1 px-2"
                onPress={handleOpenMap}
              >
                <Text className="text-sm font-semibold text-brand">View map</Text>
              </Pressable>
            </View>

            {/* Rating Capsule Summary Banner */}
            <Pressable
              onPress={() => setReviewsVisible(true)}
              className="mt-3 bg-[#F2F3FF] rounded-xl px-4 py-2.5 flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <Ionicons name="star" size={15} color="#F59E0B" />
                <Text className="ml-1.5 text-base font-bold text-textMain">{rating}</Text>
                <Text className="ml-1 text-xs text-[#3C494C]">/ 5</Text>
                <View className="mx-2 w-1 h-1 rounded-full bg-[#BBC9CC]" />
                <Text className="text-xs font-semibold text-brand">Exceptional</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Text className="text-xs font-semibold text-brand">{reviewCount} reviews</Text>
                <Ionicons name="chevron-forward" size={12} color="#4F46E5" />
              </View>
            </Pressable>
          </View>

          {/* Section 3: Capacity & Facilities Card */}
          <View className="bg-white rounded-2xl p-4 border border-borderLight shadow-sm">
            {/* Capacity Chips */}
            <View className="flex-row flex-wrap gap-2">
              <View className="bg-brand/10 px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
                <Ionicons name="people-outline" size={14} color="#4F46E5" />
                <Text className="text-xs font-semibold text-textMain">
                  {guestsCapacity} {guestsCapacity === 1 ? 'Guest' : 'Guests'}
                </Text>
              </View>

              <View className="bg-brand/10 px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
                <Ionicons name="home-outline" size={14} color="#4F46E5" />
                <Text className="text-xs font-semibold text-textMain">
                  {bedroomsCount} {bedroomsCount === 1 ? 'bedroom' : 'bedrooms'}
                </Text>
              </View>

              <View className="bg-brand/10 px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
                <Ionicons name="bed-outline" size={14} color="#4F46E5" />
                <Text className="text-xs font-semibold text-textMain">
                  {bedsCount} {bedsCount === 1 ? 'bed' : 'beds'}
                </Text>
              </View>

              <View className="bg-brand/10 px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
                <Ionicons name="water-outline" size={14} color="#4F46E5" />
                <Text className="text-xs font-semibold text-textMain">1 bath</Text>
              </View>
            </View>

            {/* Highlighted Amenities List */}
            <View className="mt-4 gap-3.5">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-brand/10 items-center justify-center mr-3">
                  <Ionicons name="wifi" size={18} color="#4F46E5" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-textMain">
                    Fast 100 Mbps internet
                  </Text>
                  <Text className="text-xs text-[#3C494C]">
                    Seamless remote work in tropical sanctuary
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-brand/10 items-center justify-center mr-3">
                  <Ionicons name="restaurant-outline" size={18} color="#4F46E5" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-textMain">
                    Fully equipped kitchen
                  </Text>
                  <Text className="text-xs text-[#3C494C]">
                    Modern refrigerator, gas stove, artisan tableware
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-brand/10 items-center justify-center mr-3">
                  <Ionicons name="water" size={18} color="#4F46E5" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-textMain">
                    Private plunge pool
                  </Text>
                  <Text className="text-xs text-[#3C494C]">
                    Infinity freshwater pool suspended above the jungle
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-brand/10 items-center justify-center mr-3">
                  <Ionicons name="leaf-outline" size={18} color="#4F46E5" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-textMain">
                    Tropical garden terrace
                  </Text>
                  <Text className="text-xs text-[#3C494C]">
                    Lush flora, private veranda & daybed loungers
                  </Text>
                </View>
              </View>
            </View>

            {/* Show all 28 facilities Button */}
            <Pressable
              onPress={() => setFacilitiesVisible(true)}
              className="mt-4 py-3 rounded-xl bg-brand/5 border border-brand/20 flex-row items-center justify-center gap-1.5"
            >
              <Text className="text-sm font-semibold text-brand">Show all 28 facilities</Text>
              <Ionicons name="arrow-forward" size={14} color="#4F46E5" />
            </Pressable>
          </View>

          {/* Section 4: Description Section Card */}
          <View className="bg-white rounded-2xl p-4 border border-borderLight shadow-sm">
            <Text className="text-xl font-bold text-textMain">Description</Text>

            <View className="mt-3 h-52 rounded-2xl overflow-hidden bg-black/5">
              <Image
                source={{ uri: interiorImage }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>

            <Text
              className="mt-3 text-sm text-[#3C494C] leading-6"
              numberOfLines={4}
            >
              {descriptionText}
            </Text>

            <Pressable
              onPress={() => setDescriptionVisible(true)}
              className="mt-2 flex-row items-center gap-1 py-1"
            >
              <Text className="text-sm font-semibold text-brand">View more</Text>
              <Ionicons name="chevron-down" size={14} color="#4F46E5" />
            </Pressable>
          </View>

          {/* Section 5: Policies & House Rules Card */}
          <View className="bg-white rounded-2xl p-4 border border-borderLight shadow-sm">
            <Text className="text-xl font-bold text-textMain">Policies</Text>

            <View className="mt-3 bg-[#F2F3FF] rounded-xl p-4 gap-3">
              {/* Check-in / Check-out 2-column row */}
              <View className="flex-row items-center justify-between">
                <View className="flex-1 flex-row items-center gap-2">
                  <Ionicons name="time-outline" size={18} color="#4F46E5" />
                  <View>
                    <Text className="text-[11px] font-bold text-[#3C494C] tracking-wider uppercase">
                      CHECK-IN
                    </Text>
                    <Text className="text-sm font-semibold text-textMain">{checkIn}</Text>
                  </View>
                </View>

                <View className="flex-1 flex-row items-center gap-2">
                  <Ionicons name="log-out-outline" size={18} color="#4F46E5" />
                  <View>
                    <Text className="text-[11px] font-bold text-[#3C494C] tracking-wider uppercase">
                      CHECK-OUT
                    </Text>
                    <Text className="text-sm font-semibold text-textMain">{checkOut}</Text>
                  </View>
                </View>
              </View>

              {/* Rules list */}
              <View className="pt-2 border-t border-borderLight/60 gap-2">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="ban-outline" size={14} color="#6C797D" />
                  <Text className="text-xs text-textMain">No smoking inside</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Ionicons name="moon-outline" size={14} color="#6C797D" />
                  <Text className="text-xs text-textMain">Quiet hours after 22:00</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Ionicons name="paw-outline" size={14} color="#6C797D" />
                  <Text className="text-xs text-textMain">Pets allowed upon request</Text>
                </View>
              </View>
            </View>

            <Pressable
              onPress={() => setHouseRulesVisible(true)}
              className="mt-3 flex-row items-center gap-1 py-1"
            >
              <Text className="text-sm font-semibold text-brand">View house rules</Text>
              <Ionicons name="chevron-forward" size={13} color="#4F46E5" />
            </Pressable>
          </View>

          {/* Section 6: Reviews Section Card */}
          <View className="bg-white rounded-2xl p-4 border border-borderLight shadow-sm">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-baseline gap-2">
                <Text className="text-xl font-bold text-textMain">Reviews</Text>
                <Text className="text-sm text-[#3C494C]">★ {rating}/5</Text>
              </View>
              <Pressable onPress={() => setReviewsVisible(true)}>
                <Text className="text-sm font-semibold text-brand">
                  See all ({reviewCount}) &gt;
                </Text>
              </Pressable>
            </View>

            <View className="mt-3 gap-3">
              {/* Testimonial Card 1 */}
              <View className="bg-[#F2F3FF] rounded-xl p-4 gap-2">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-2.5">
                    <View className="w-10 h-10 rounded-full bg-brand/15 items-center justify-center">
                      <Text className="text-base font-bold text-brand">SJ</Text>
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-textMain">Sarah Jenkins</Text>
                      <Text className="text-xs text-[#3C494C]">Stayed May 2024</Text>
                    </View>
                  </View>
                  <View className="flex-row">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons key={s} name="star" size={13} color="#F59E0B" />
                    ))}
                  </View>
                </View>
                <Text className="text-sm text-textMain leading-5">
                  “The most magical treehouse experience! Waking up to the sunrise above the jungle canopy was truly unforgettable.”
                </Text>
              </View>

              {/* Testimonial Card 2 */}
              <View className="bg-[#F2F3FF] rounded-xl p-4 gap-2">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-2.5">
                    <View className="w-10 h-10 rounded-full bg-[#7C5CFC]/15 items-center justify-center">
                      <Text className="text-base font-bold text-[#7C5CFC]">LC</Text>
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-textMain">Liam Carter</Text>
                      <Text className="text-xs text-[#3C494C]">Stayed April 2024</Text>
                    </View>
                  </View>
                  <View className="flex-row">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons key={s} name="star" size={13} color="#F59E0B" />
                    ))}
                  </View>
                </View>
                <Text className="text-sm text-textMain leading-5">
                  “Incredible attention to detail, super peaceful, and the host was wonderfully attentive. Will definitely book again!”
                </Text>
              </View>
            </View>
          </View>

          {/* Section 7: Location & Exploration Map preview anchor */}
          <View className="bg-white rounded-2xl p-4 border border-borderLight shadow-sm">
            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-bold text-textMain">Location</Text>
              <Text className="text-xs font-semibold text-[#3C494C]">Sebayu, Bali</Text>
            </View>

            <View className="mt-3 h-44 rounded-xl overflow-hidden relative justify-center items-center bg-[#EAEDFF]">
              <Image
                source={{ uri: DEFAULT_MAP_IMAGE }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-brand/10" />

              <Pressable
                onPress={handleOpenMap}
                className="bg-white px-4 py-2 rounded-full flex-row items-center gap-1.5 shadow-md border border-borderLight"
              >
                <Ionicons name="navigate" size={14} color="#4F46E5" />
                <Text className="text-xs font-semibold text-textMain">
                  Explore neighborhood
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Fixed Booking Bar */}
      <View
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        className="absolute bottom-0 left-0 right-0 bg-[#FAF8FF]/95 border-t border-borderLight px-5 pt-3.5 flex-row items-center justify-between shadow-lg"
      >
        <View>
          <View className="flex-row items-baseline gap-1">
            <Text className="text-2xl font-bold text-textMain">${price}</Text>
            <Text className="text-xs text-[#3C494C]">/ night</Text>
          </View>
          <Pressable onPress={() => Alert.alert('Booking Dates', 'Selected stay: Oct 12 – 17')}>
            <Text className="text-xs font-bold text-brand underline mt-0.5">
              Oct 12 – 17
            </Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reserve Now"
          onPress={handleReserve}
          className="rounded-full bg-brand py-3.5 px-8 shadow-md shadow-brand/40"
        >
          <Text className="text-base font-bold text-white text-center">Reserve Now</Text>
        </Pressable>
      </View>

      {/* MODAL 1: Show all 28 facilities */}
      <Modal
        visible={facilitiesVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFacilitiesVisible(false)}
      >
        <View className="flex-1 bg-appBg">
          <View className="px-5 pt-6 pb-4 border-b border-borderLight bg-white flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-bold text-textMain">All 28 Facilities</Text>
              <Text className="text-xs text-textMuted mt-0.5">
                Everything offered at {title}
              </Text>
            </View>
            <Pressable
              onPress={() => setFacilitiesVisible(false)}
              className="w-9 h-9 rounded-full bg-appBg items-center justify-center border border-borderLight"
            >
              <Ionicons name="close" size={20} color="#131B2E" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-5 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
            {ALL_28_FACILITIES.map((group) => (
              <View key={group.category} className="mb-6 bg-white rounded-2xl p-4 border border-borderLight shadow-sm">
                <Text className="text-base font-bold text-brand mb-3">{group.category}</Text>
                <View className="gap-3">
                  {group.items.map((item) => (
                    <View key={item.name} className="flex-row items-center">
                      <View className="w-9 h-9 rounded-xl bg-brand/10 items-center justify-center mr-3">
                        <Ionicons name={item.icon as any} size={18} color="#4F46E5" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-textMain">{item.name}</Text>
                        <Text className="text-xs text-textMuted">{item.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL 2: Full Description */}
      <Modal
        visible={descriptionVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDescriptionVisible(false)}
      >
        <View className="flex-1 bg-appBg">
          <View className="px-5 pt-6 pb-4 border-b border-borderLight bg-white flex-row items-center justify-between">
            <Text className="text-xl font-bold text-textMain">About this space</Text>
            <Pressable
              onPress={() => setDescriptionVisible(false)}
              className="w-9 h-9 rounded-full bg-appBg items-center justify-center border border-borderLight"
            >
              <Ionicons name="close" size={20} color="#131B2E" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-5 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
            <View className="h-56 rounded-2xl overflow-hidden bg-black/5 mb-4">
              <Image source={{ uri: interiorImage }} className="w-full h-full" resizeMode="cover" />
            </View>
            <Text className="text-base text-textMain leading-7 font-normal">
              {descriptionText}
            </Text>
            <Text className="mt-4 text-base text-textMain leading-7 font-normal">
              The treehouse is crafted almost entirely from treated giant petung bamboo and local teakwood, featuring an open layout that invites tropical breezes while keeping out insects with automated mesh screening.
            </Text>
            <Text className="mt-4 text-base text-textMain leading-7 font-normal">
              Guests enjoy uninterrupted ocean panoramas from the upper observation tier, a fully equipped gourmet kitchen, and fiber-optic gigabit wireless connectivity that makes remote work feel like a secluded retreat.
            </Text>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL 3: House Rules & Policies */}
      <Modal
        visible={houseRulesVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setHouseRulesVisible(false)}
      >
        <View className="flex-1 bg-appBg">
          <View className="px-5 pt-6 pb-4 border-b border-borderLight bg-white flex-row items-center justify-between">
            <Text className="text-xl font-bold text-textMain">Policies & House Rules</Text>
            <Pressable
              onPress={() => setHouseRulesVisible(false)}
              className="w-9 h-9 rounded-full bg-appBg items-center justify-center border border-borderLight"
            >
              <Ionicons name="close" size={20} color="#131B2E" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-5 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
            <View className="bg-white rounded-2xl p-4 border border-borderLight shadow-sm mb-4">
              <Text className="text-base font-bold text-brand mb-2">Check-in & Check-out</Text>
              <Text className="text-sm text-textMain mb-1">
                • <Text className="font-semibold">Check-in:</Text> {checkIn} (Keyless Smart Key PIN 4821#)
              </Text>
              <Text className="text-sm text-textMain">
                • <Text className="font-semibold">Check-out:</Text> {checkOut}
              </Text>
            </View>

            <View className="bg-white rounded-2xl p-4 border border-borderLight shadow-sm mb-4">
              <Text className="text-base font-bold text-brand mb-2">House Rules</Text>
              <Text className="text-sm text-textMain mb-2">• No smoking or vaping inside the treehouse.</Text>
              <Text className="text-sm text-textMain mb-2">• Quiet hours from 22:00 to 07:00 out of respect for nature.</Text>
              <Text className="text-sm text-textMain mb-2">• Maximum occupancy: 2 adults.</Text>
              <Text className="text-sm text-textMain mb-2">• Pets are welcome upon advance notification.</Text>
              <Text className="text-sm text-textMain">• No commercial filming without written consent.</Text>
            </View>

            <View className="bg-white rounded-2xl p-4 border border-borderLight shadow-sm">
              <Text className="text-base font-bold text-brand mb-2">Cancellation Policy (BR05)</Text>
              <Text className="text-sm text-textMain mb-2">
                • <Text className="font-semibold">48+ hours before check-in:</Text> 100% full refund with zero fees.
              </Text>
              <Text className="text-sm text-textMain mb-2">
                • <Text className="font-semibold">Within 48 hours of check-in:</Text> Penalty of 1 night at room rate (${price}). Remaining balance refunded immediately.
              </Text>
              <Text className="text-sm text-textMain">
                • <Text className="font-semibold">After check-in or No-show:</Text> Non-refundable.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL 4: Explore Neighborhood & Location */}
      <Modal
        visible={neighborhoodVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setNeighborhoodVisible(false)}
      >
        <View className="flex-1 bg-appBg">
          <View className="px-5 pt-6 pb-4 border-b border-borderLight bg-white flex-row items-center justify-between">
            <Text className="text-xl font-bold text-textMain">Explore Sebayu, Bali</Text>
            <Pressable
              onPress={() => setNeighborhoodVisible(false)}
              className="w-9 h-9 rounded-full bg-appBg items-center justify-center border border-borderLight"
            >
              <Ionicons name="close" size={20} color="#131B2E" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-5 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
            <View className="h-60 rounded-2xl overflow-hidden bg-black/5 mb-4 border border-borderLight">
              <Image source={{ uri: DEFAULT_MAP_IMAGE }} className="w-full h-full" resizeMode="cover" />
            </View>
            <Text className="text-base font-bold text-textMain mb-2">Neighborhood Highlights</Text>
            <Text className="text-sm text-textMuted leading-6 mb-4">
              Nestled near the quiet surf haven of Balian Beach on Bali's West Coast, Sebayu is famed for its authentic village vibes, serene river estuaries, and black sand coastline away from tourist crowds.
            </Text>
            <View className="bg-white rounded-2xl p-4 border border-borderLight shadow-sm gap-3">
              <View className="flex-row items-center gap-3">
                <Ionicons name="water-outline" size={20} color="#4F46E5" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-textMain">Balian Surf Break</Text>
                  <Text className="text-xs text-textMuted">5 mins walk • Consistent A-frame wave</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-3">
                <Ionicons name="cafe-outline" size={20} color="#4F46E5" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-textMain">Tekor Bali Organic Cafe</Text>
                  <Text className="text-xs text-textMuted">8 mins walk • Farm-to-table smoothie bowls</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-3">
                <Ionicons name="car-outline" size={20} color="#4F46E5" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-textMain">Ngurah Rai International Airport</Text>
                  <Text className="text-xs text-textMuted">90 mins drive • Airport shuttle available ($35)</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL 5: All Reviews */}
      <Modal
        visible={reviewsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setReviewsVisible(false)}
      >
        <View className="flex-1 bg-appBg">
          <View className="px-5 pt-6 pb-4 border-b border-borderLight bg-white flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-bold text-textMain">Verified Reviews</Text>
              <Text className="text-xs text-textMuted mt-0.5">
                ★ {rating} / 5 • {reviewCount} guest reviews
              </Text>
            </View>
            <Pressable
              onPress={() => setReviewsVisible(false)}
              className="w-9 h-9 rounded-full bg-appBg items-center justify-center border border-borderLight"
            >
              <Ionicons name="close" size={20} color="#131B2E" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-5 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Show loaded Supabase reviews or design defaults */}
            {(reviews.length > 0
              ? reviews
              : [
                  {
                    id: 'rev-1',
                    author: 'Sarah Jenkins',
                    initials: 'SJ',
                    date: 'Stayed May 2024',
                    rating: 5,
                    comment:
                      '“The most magical treehouse experience! Waking up to the sunrise above the jungle canopy was truly unforgettable.”',
                  },
                  {
                    id: 'rev-2',
                    author: 'Liam Carter',
                    initials: 'LC',
                    date: 'Stayed April 2024',
                    rating: 5,
                    comment:
                      '“Incredible attention to detail, super peaceful, and the host was wonderfully attentive. Will definitely book again!”',
                  },
                  {
                    id: 'rev-3',
                    author: 'Elena Rostova',
                    initials: 'ER',
                    date: 'Stayed March 2024',
                    rating: 5,
                    comment:
                      '“The high-speed internet was a lifesaver for remote meetings, and dipping into the private plunge pool at sunset was pure bliss.”',
                  },
                ]
            ).map((rev: any) => (
              <View
                key={rev.id}
                className="mb-3.5 bg-white rounded-2xl p-4 border border-borderLight shadow-sm"
              >
                <View className="flex-row justify-between items-center mb-2">
                  <View className="flex-row items-center gap-2.5">
                    <View className="w-10 h-10 rounded-full bg-brand/15 items-center justify-center">
                      <Text className="text-base font-bold text-brand">
                        {rev.initials || rev.users?.name?.slice(0, 2).toUpperCase() || 'VG'}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-textMain">
                        {rev.author || rev.users?.name || 'Verified Guest'}
                      </Text>
                      <Text className="text-xs text-[#3C494C]">
                        {rev.date || rev.created_at?.slice(0, 10) || 'Recent stay'}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons
                        key={s}
                        name="star"
                        size={13}
                        color={s <= (rev.rating || 5) ? '#F59E0B' : '#E6E3F5'}
                      />
                    ))}
                  </View>
                </View>
                <Text className="text-sm text-textMain leading-5">
                  {rev.comment || '(No review comment provided)'}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
