import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getFavoritePlaces, toggleFavorite } from '../../services/favoritesService';
import type { Place } from '../../types';
import AppButton from '../../components/AppButton';
import PlaceCard from '../../components/PlaceCard';

export default function MyListsScreen({ navigation }: { navigation: any }) {
  const { session } = useAuth();
  const userId = session?.user?.id || '';
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadFavorites = useCallback(async (isRefresh = false) => {
    if (!userId) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setErrorMessage('');
    try {
      setPlaces(await getFavoritePlaces(userId));
    } catch {
      setErrorMessage('Unable to load favorites. Please try again.');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { loadFavorites(); }, [loadFavorites]);

  if (loading) {
    return (
      <View className="flex-1 bg-appBg items-center justify-center px-6">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-3 text-sm text-textMuted">Loading favorites...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View className="flex-1 bg-appBg items-center justify-center px-6">
        <Text className="text-lg font-bold text-textMain text-center">Unable to load data</Text>
        <Text className="mt-2 text-sm text-textMuted text-center">{errorMessage}</Text>
        <View className="mt-6 w-full"><AppButton title="Try again" onPress={() => loadFavorites()} /></View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-appBg">
      <View className="px-5 pt-12 pb-3 bg-white border-b border-borderLight">
        <Text className="text-2xl font-bold text-textMain">Favorites</Text>
        <Text className="mt-1 text-sm text-textMuted">Places you've saved with a heart</Text>
      </View>
      {places.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-lg font-bold text-textMain text-center">No favorites saved yet</Text>
          <Text className="mt-2 text-sm text-textMuted text-center">Tap the heart on any property image to save it here.</Text>
          <View className="mt-6 w-full"><AppButton title="Explore stays" onPress={() => navigation.navigate('Search')} /></View>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable onPress={() => navigation.navigate('Detail', { placeId: item.id })}>
              <PlaceCard
                place={item}
                isFavorite
                onToggleFavorite={async () => {
                  await toggleFavorite(userId, item.id, true);
                  setPlaces((prev) => prev.filter((x) => x.id !== item.id));
                }}
              />
            </Pressable>
          )}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadFavorites(true)} colors={['#4F46E5']} />}
        />
      )}
    </View>
  );
}
