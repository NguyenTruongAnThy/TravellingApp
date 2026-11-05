import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { getPlaceById } from '../../services/placesService';
import type { Place } from '../../types';
import AppButton from '../../components/AppButton';

// Interactive map, real data only. OpenStreetMap + Leaflet via CDN: no API
// key, works in Expo Go. The map is interactive (pin, pan, zoom) — it is not
// a static image. Requires: npx expo install react-native-webview


function mapHtml(lat: number, lng: number, title: string): string {
  const q = encodeURIComponent(`${lat},${lng} (${title})`);
  return `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
<style>html,body{height:100%;width:100%;margin:0;padding:0;} iframe{border:0;width:100%;height:100%;}</style>
</head><body><iframe src="https://maps.google.com/maps?q=${q}&z=15&output=embed" allowfullscreen loading="lazy"></iframe></body></html>`;
}

export default function MapScreen({ route, navigation }: { route: any; navigation: any }) {
  const params = route?.params || {};
  const placeId = params.placeId as string | undefined;
  const directLat = params.latitude as number | undefined;
  const directLng = params.longitude as number | undefined;
  const directTitle = params.title as string | undefined;
  const directLocation = params.location as string | undefined;

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(!!placeId);
  const [errorMessage, setErrorMessage] = useState('');

  const load = useCallback(async () => {
    if (!placeId) return;
    setLoading(true);
    setErrorMessage('');
    const { data, error } = await getPlaceById(placeId);
    if (error || !data) setErrorMessage('Could not load the map location. Please try again.');
    else setPlace(data);
    setLoading(false);
  }, [placeId]);

  useEffect(() => { load(); }, [load]);

  const title = place?.title || directTitle || 'Stay location';
  const location = place?.location || directLocation || '';
  const lat = place ? place.latitude : directLat;
  const lng = place ? place.longitude : directLng;
  const latNum: number | null = typeof lat === 'number' && Number.isFinite(lat) ? lat : null;
  const lngNum: number | null = typeof lng === 'number' && Number.isFinite(lng) ? lng : null;
  const coordsOk = latNum !== null && lngNum !== null;

  if (loading) {
    return (
      <View className="flex-1 bg-appBg items-center justify-center px-6">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-3 text-sm text-textMuted">Loading map...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View className="flex-1 bg-appBg items-center justify-center px-6">
        <Text className="text-lg font-bold text-textMain text-center">Could not load map</Text>
        <Text className="mt-2 text-sm text-textMuted text-center">{errorMessage}</Text>
        <View className="mt-6 w-full">
          <AppButton title="Try again" onPress={load} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-appBg">
      <View className="px-5 pt-12 pb-3 flex-row items-center bg-white border-b border-borderLight">
        <Pressable className="w-9 h-9 rounded-full bg-white items-center justify-center border border-borderLight" onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#131B2E" />
        </Pressable>
        <Text className="ml-3 text-lg font-bold text-textMain flex-1">Map</Text>
      </View>
      <View className="px-5 pt-4 pb-3">
        <Text className="text-xl font-bold text-textMain">{title}</Text>
        {location ? <Text className="mt-1 text-base text-textMuted">{location}</Text> : null}
      </View>
      {!coordsOk ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="map-outline" size={40} color="#5A6478" />
          <Text className="mt-3 text-base font-bold text-textMain text-center">Map location is not available for this stay.</Text>
          <Text className="mt-2 text-sm text-textMuted text-center">This stay does not have coordinates saved yet, so no pin can be shown.</Text>
        </View>
      ) : (
        <View className="flex-1 mx-5 mb-5 rounded-3xl overflow-hidden border border-borderLight">
          <WebView
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            source={{ html: mapHtml(latNum as number, lngNum as number, title) }}
          />
        </View>
      )}
      {coordsOk ? (
        <Text className="px-5 pb-5 text-xs text-textMuted text-center">Pin: {latNum!.toFixed(3)}, {lngNum!.toFixed(3)} — pan and pinch to explore.</Text>
      ) : null}
    </View>
  );
}
