import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPlaceById } from '../../services/placesService';
import type { Place } from '../../types';
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

export default function DescriptionScreen({ route, navigation }: { route: any; navigation: any }) {
  const placeId = route?.params?.placeId as string | undefined;
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const load = useCallback(async () => {
    if (!placeId) { setErrorMessage('Could not find this stay.'); setLoading(false); return; }
    setLoading(true); setErrorMessage('');
    const { data, error } = await getPlaceById(placeId);
    if (error || !data) setErrorMessage('Could not load the description. Please try again.');
    else setPlace(data);
    setLoading(false);
  }, [placeId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (<View className="flex-1 bg-appBg items-center justify-center px-6"><ActivityIndicator size="large" color="#4F46E5" /><Text className="mt-3 text-sm text-textMuted">Loading description...</Text></View>);
  if (errorMessage || !place) return (<View className="flex-1 bg-appBg items-center justify-center px-6"><Text className="text-lg font-bold text-textMain text-center">Could not load description</Text><Text className="mt-2 text-sm text-textMuted text-center">{errorMessage}</Text><View className="mt-6 w-full"><AppButton title="Try again" onPress={load} /></View></View>);

  const mainImage = Array.isArray(place.images) && place.images.length > 0 ? place.images[0] : 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80';

  return (
    <ScrollView className="flex-1 bg-appBg" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="px-5 pt-12 pb-3 flex-row items-center">
        <Pressable className="w-9 h-9 rounded-full bg-white items-center justify-center border border-borderLight" onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#131B2E" />
        </Pressable>
        <Text className="ml-3 text-lg font-bold text-textMain flex-1">Description</Text>
      </View>
      <Image source={{ uri: mainImage }} style={{ width: '100%', height: 320 }} resizeMode="cover" />
      <View className="mx-5 mt-5">
        <Text className="text-2xl font-bold text-textMain">{place.title}</Text>
        <View className="mt-2 flex-row items-center">
          <Ionicons name="location-outline" size={18} color="#4F46E5" />
          <Text className="ml-1 text-base text-textMuted flex-1">{place.location}</Text>
        </View>
        <View className="mt-2 flex-row items-center"><Ionicons name="star" size={16} color="#FFB020" /><Text className="ml-1 text-base font-bold text-textMain">{place.rating != null ? place.rating.toFixed(1) : 'New'}{place.rating != null ? ' / 5' : ''}{place.review_count ? ` (${place.review_count} reviews)` : ''}</Text></View>
      </View>
      <View className="mx-5 mt-4 rounded-3xl bg-white border border-borderLight p-5">
        <Text className="text-base font-bold text-textMain">About this place</Text>
        <Text className="mt-2 text-base text-textMuted leading-6">{place.description || 'No description for this stay yet.'}</Text>
      </View>
      {Array.isArray(place.amenities) && place.amenities.length > 0 ? (
        <View className="mx-5 mt-4 rounded-3xl bg-white border border-borderLight p-5">
          <Text className="text-base font-bold text-textMain">Key Highlights</Text>
          <Text className="mt-1 text-sm text-textMuted">Highlights come from this stay's real amenities, nothing invented.</Text>
          <View className="mt-2">
            {place.amenities.map((item) => (
              <View key={item} className="flex-row items-center py-2">
                <Ionicons name={amenityIcon(item)} size={18} color="#4F46E5" />
                <Text className="ml-3 text-base text-textMain">{item}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
      <View className="mx-5 mt-4 rounded-3xl bg-white border border-borderLight p-5">
        <Text className="text-base font-bold text-textMain">Location</Text>
        <View className="mt-2 flex-row items-center">
          <Ionicons name="location-outline" size={18} color="#4F46E5" />
          <Text className="ml-1 text-base font-bold text-textMain flex-1">{place.location}</Text>
        </View>
        <Pressable
          className="mt-3 rounded-3xl bg-appBg border border-borderLight p-4 flex-row items-center"
          onPress={() => navigation.navigate('Map', { placeId: place.id })}
        >
          <View className="w-11 h-11 rounded-2xl bg-appBg items-center justify-center">
            <Ionicons name="map-outline" size={22} color="#4F46E5" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-base font-bold text-textMain">Open map</Text>
            <Text className="mt-1 text-sm text-textMuted">
              {place.latitude != null && place.longitude != null
                ? 'See this stay on an interactive map.'
                : 'Map location is not available for this stay.'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#5A6478" />
        </Pressable>
      </View>
    </ScrollView>
  );
}
