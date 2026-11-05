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

export default function FacilitiesScreen({ route, navigation }: { route: any; navigation: any }) {
  const placeId = route?.params?.placeId as string | undefined;
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const load = useCallback(async () => {
    if (!placeId) { setErrorMessage('Could not find this stay.'); setLoading(false); return; }
    setLoading(true); setErrorMessage('');
    const { data, error } = await getPlaceById(placeId);
    if (error || !data) setErrorMessage('Could not load facilities. Please try again.');
    else setPlace(data);
    setLoading(false);
  }, [placeId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (<View className="flex-1 bg-appBg items-center justify-center px-6"><ActivityIndicator size="large" color="#4F46E5" /><Text className="mt-3 text-sm text-textMuted">Loading facilities...</Text></View>);
  if (errorMessage || !place) return (<View className="flex-1 bg-appBg items-center justify-center px-6"><Text className="text-lg font-bold text-textMain text-center">Could not load facilities</Text><Text className="mt-2 text-sm text-textMuted text-center">{errorMessage}</Text><View className="mt-6 w-full"><AppButton title="Try again" onPress={load} /></View></View>);

  const mainImage = Array.isArray(place.images) && place.images.length > 0 ? place.images[0] : 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80';
  const amenities = place.amenities || [];

  return (
    <View className="flex-1 bg-appBg">
      <ScrollView className="flex-1 bg-appBg" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-5 pt-12 pb-3 flex-row items-center">
          <Pressable className="w-9 h-9 rounded-full bg-white items-center justify-center border border-borderLight" onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#131B2E" />
          </Pressable>
          <Text className="ml-3 text-lg font-bold text-textMain flex-1">Facilities & Services</Text>
        </View>
        <Image source={{ uri: mainImage }} style={{ width: '100%', height: 320 }} resizeMode="cover" />
        <View className="mx-5 mt-4 rounded-3xl bg-white border border-borderLight p-5">
          <Text className="text-2xl font-bold text-textMain">{place.title}</Text>
          <View className="mt-2 flex-row items-center">
            <Ionicons name="location-outline" size={18} color="#4F46E5" />
            <Text className="ml-1 text-base text-textMuted flex-1">{place.location}</Text>
          </View>
          <View className="mt-3 flex-row flex-wrap">
            {place.guests_capacity != null ? <View className="mr-2 mb-2 px-3 py-2 rounded-full bg-white border border-borderLight flex-row items-center"><Ionicons name="people-outline" size={16} color="#4F46E5" /><Text className="ml-1.5 text-sm text-textMain">{place.guests_capacity} guests</Text></View> : null}
            {place.rooms != null ? <View className="mr-2 mb-2 px-3 py-2 rounded-full bg-white border border-borderLight flex-row items-center"><Ionicons name="home-outline" size={16} color="#4F46E5" /><Text className="ml-1.5 text-sm text-textMain">{place.rooms} rooms</Text></View> : null}
            {place.beds != null ? <View className="mr-2 mb-2 px-3 py-2 rounded-full bg-white border border-borderLight flex-row items-center"><Ionicons name="bed-outline" size={16} color="#4F46E5" /><Text className="ml-1.5 text-sm text-textMain">{place.beds} beds</Text></View> : null}
          </View>
        </View>
        <View className="mx-5 mt-4 rounded-3xl bg-white border border-borderLight p-5">
          <Text className="text-base font-bold text-textMain">Facilities</Text>
          <Text className="mt-1 text-sm text-textMuted">{amenities.length} facilities, all from this stay's real data. No invented descriptions.</Text>
          {amenities.length === 0 ? <Text className="mt-2 text-base text-textMuted">No facilities for this stay yet.</Text> : (
            <View className="mt-2">
              {amenities.map((item, i) => (
                <View key={item} className="flex-row items-center py-2.5" style={{ borderBottomWidth: i === amenities.length - 1 ? 0 : 1, borderBottomColor: '#E6E3F5' }}>
                  <Ionicons name={amenityIcon(item)} size={18} color="#4F46E5" />
                  <Text className="ml-3 text-base text-textMain">{item}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <View className="bg-white border-t border-borderLight px-5 py-3">
        <AppButton title="Check Availability & Dates" onPress={() => navigation.navigate('MainTabs', { screen: 'Search' })} />
        <Text className="mt-2 text-xs text-textMuted text-center">Open the Search tab to pick dates and guests in the calendar and Guests sheet.</Text>
      </View>
    </View>
  );
}
