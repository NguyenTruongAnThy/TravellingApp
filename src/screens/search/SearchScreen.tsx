import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPlaces } from '../../services/placesService';
import type { Place } from '../../types';
import { normalizeText } from '../../utils/normalize';
import AppButton from '../../components/AppButton';
import PlaceCard from '../../components/PlaceCard';

const CATEGORIES = ['Tất cả', 'Beach', 'Nature', 'Countryside'];

export default function SearchScreen({ navigation }: { navigation: any }) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState('Tất cả');

  // Debounce 400ms: chỉ tìm khi người dùng ngừng gõ 400ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const loadPlaces = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage('');
    const categoryParam = category === 'Tất cả' ? null : category;
    const { data, error } = await getPlaces({ category: categoryParam });
    if (error) {
      setErrorMessage('Không tải được danh sách chỗ ở. Vui lòng thử lại.');
    } else {
      setPlaces(data || []);
    }
    setLoading(false);
    setRefreshing(false);
  }, [category]);

  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  const filteredPlaces = useMemo(() => {
    const q = normalizeText(debouncedQuery);
    if (!q) return places;
    return places.filter((place) => {
      const haystack = normalizeText(`${place.title} ${place.location}`);
      return haystack.includes(q);
    });
  }, [places, debouncedQuery]);

  if (loading) {
    return (
      <View className="flex-1 bg-appBg items-center justify-center px-6">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-3 text-sm text-textMuted">Đang tải danh sách chỗ ở...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View className="flex-1 bg-appBg items-center justify-center px-6">
        <Text className="text-lg font-bold text-textMain text-center">Không tải được dữ liệu</Text>
        <Text className="mt-2 text-sm text-textMuted text-center">{errorMessage}</Text>
        <View className="mt-6 w-full">
          <AppButton title="Thử lại" onPress={() => loadPlaces()} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-appBg">
      <View className="px-5 pt-12 pb-3 bg-white border-b border-borderLight">
        <Text className="text-2xl font-bold text-textMain">Tìm chỗ ở</Text>
        <Text className="mt-1 text-sm text-textMuted">Tìm theo tên hoặc địa điểm, không cần đăng nhập</Text>
        <View className="mt-4 flex-row items-center rounded-full border border-borderLight bg-appBg px-4">
          <Ionicons name="search-outline" size={20} color="#5A6478" />
          <TextInput
            className="flex-1 py-3 text-base text-textMain ml-2"
            placeholder="Tìm Balian, Kuta, Ubud..."
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle-outline" size={20} color="#5A6478" />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 py-3" style={{ maxHeight: 60 }}>
        {CATEGORIES.map((item) => {
          const active = category === item;
          return (
            <Pressable
              key={item}
              className={`mr-2 px-4 py-2 rounded-full border ${active ? 'bg-brand border-brand' : 'bg-white border-borderLight'}`}
              onPress={() => setCategory(item)}
            >
              <Text className={`text-sm font-bold ${active ? 'text-white' : 'text-textMain'}`}>{item}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {filteredPlaces.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-lg font-bold text-textMain text-center">Không tìm thấy địa điểm nào</Text>
          <Text className="mt-2 text-sm text-textMuted text-center">
            Thử từ khóa khác hoặc chọn danh mục khác. Màn Chi tiết sẽ được thêm ở patch tiếp theo.
          </Text>
          <View className="mt-6 w-full">
            <AppButton
              title="Xóa tìm kiếm"
              onPress={() => {
                setQuery('');
                setCategory('Tất cả');
              }}
            />
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredPlaces}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable onPress={() => navigation.navigate('Detail', { placeId: item.id })}>
              <PlaceCard place={item} />
            </Pressable>
          )}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadPlaces(true)} colors={['#4F46E5']} />
          }
        />
      )}
    </View>
  );
}
