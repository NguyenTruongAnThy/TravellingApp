import './global.css';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Text,
  View,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getPlaces } from './src/services/placesService';
import type { Place } from './src/types';

export default function App() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPlacesData = useCallback(async () => {
    setErrorMessage(null);
    const { data, error } = await getPlaces();

    if (error) {
      console.error('Lỗi khi tải dữ liệu từ Supabase:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Không thể kết nối đến Supabase');
    } else {
      setPlaces(data || []);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchPlacesData();
  }, [fetchPlacesData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlacesData();
  };

  const renderItem = ({ item }: { item: Place }) => {
    const mainImage =
      Array.isArray(item.images) && item.images.length > 0
        ? item.images[0]
        : 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80';

    return (
      <View className="bg-cardBg rounded-2xl overflow-hidden mb-4">
        <Image source={{ uri: mainImage }} className="w-full h-[200px] bg-gray-200" />
        <View className="p-3.5">
          <View className="flex-row justify-between items-center">
            <Text className="flex-1 mr-2 text-base font-bold text-textMain">{item.title}</Text>
            <View className="bg-gray-100 px-2 py-1 rounded-md">
              <Text className="text-xs font-semibold text-textMain">★ {item.rating ?? 'New'}</Text>
            </View>
          </View>
          <Text className="text-[13px] text-textMuted mt-1" numberOfLines={1}>
            📍 {item.location}
          </Text>
          <Text className="text-xs text-inactive mt-1">
            {item.place_type || item.category || 'Stay'} • {item.guests_capacity ?? 1} khách
          </Text>
          <View className="flex-row items-baseline mt-2.5">
            <Text className="text-base font-bold text-textMain">${item.price_per_night}</Text>
            <Text className="text-[13px] text-textMuted"> / đêm</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-appBg">
      <StatusBar style="dark" />
      <View className="px-5 py-3.5 bg-white border-b border-gray-200">
        <View className="w-full max-w-[720px] self-center flex-row justify-between items-center">
          <View>
            <Text className="text-[22px] font-bold text-brand">WanderStay</Text>
            <Text className="text-xs text-textMuted mt-0.5">Kết nối Supabase</Text>
          </View>
          <View className={`w-3 h-3 rounded-full ${errorMessage ? 'bg-red-500' : 'bg-emerald-500'}`} />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center px-6">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="mt-3 text-sm text-textMuted">Đang tải dữ liệu từ Supabase...</Text>
        </View>
      ) : errorMessage ? (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-lg font-semibold text-red-500 mb-2">Lỗi kết nối</Text>
          <Text className="text-sm text-textMain text-center mb-4">{errorMessage}</Text>
          <Text className="text-[13px] text-textMuted text-center leading-5 mb-5">
            💡 Lưu ý: Hãy đảm bảo bạn đã tạo bảng `places` trong Supabase SQL Editor bằng file `supabase/schema.sql` và chèn dữ liệu bằng `supabase/seed.sql`.
          </Text>
          <TouchableOpacity className="bg-brand py-2.5 px-6 rounded-lg" onPress={fetchPlacesData}>
            <Text className="text-white font-semibold text-sm">Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : places.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-lg font-semibold text-textMain mb-2">Chưa có địa điểm nào</Text>
          <Text className="text-[13px] text-textMuted text-center leading-5 mb-5">
            Kết nối Supabase thành công nhưng bảng `places` đang trống. Hãy chạy file `supabase/seed.sql` trong SQL Editor của Supabase để nạp dữ liệu mẫu!
          </Text>
          <TouchableOpacity className="bg-brand py-2.5 px-6 rounded-lg" onPress={fetchPlacesData}>
            <Text className="text-white font-semibold text-sm">Làm mới</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, maxWidth: 720, width: '100%', alignSelf: 'center' }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
          }
        />
      )}
    </SafeAreaView>
  );
}
