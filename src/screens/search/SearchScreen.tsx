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
import { getFavoritePlaceIds, toggleFavorite } from '../../services/favoritesService';
import { useAuth } from '../../context/AuthContext';
import type { Place } from '../../types';
import { normalizeText } from '../../utils/normalize';
import AppButton from '../../components/AppButton';
import PlaceCard from '../../components/PlaceCard';

const CATEGORIES = ['Tất cả', 'Beach', 'Nature', 'Countryside'];
const categoryLabel = (item: string) => item === 'Beach' ? 'Biển' : item === 'Nature' ? 'Thiên nhiên' : item === 'Countryside' ? 'Nông thôn' : item;

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (<View className="flex-row items-center justify-between py-2"><Text className="text-base text-textMain">{label}</Text><View className="flex-row items-center"><Pressable className="w-9 h-9 rounded-full border border-borderLight bg-white items-center justify-center" onPress={() => onChange(Math.max(0, value - 1))}><Text className="text-lg font-bold text-textMain">-</Text></Pressable><Text className="w-16 text-center text-base font-bold text-textMain">{value === 0 ? 'Bất kỳ' : value}</Text><Pressable className="w-9 h-9 rounded-full border border-borderLight bg-white items-center justify-center" onPress={() => onChange(value + 1)}><Text className="text-lg font-bold text-textMain">+</Text></Pressable></View></View>);
}

export default function SearchScreen({ navigation }: { navigation: any }) {
  const { session } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const [showFilter, setShowFilter] = useState(false);
  const [minPrice, setMinPrice] = useState('10');
  const [maxPrice, setMaxPrice] = useState('250');
  const [guests, setGuests] = useState(0);
  const [minRooms, setMinRooms] = useState(0);
  const [minBeds, setMinBeds] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

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

  useEffect(() => {
    if (!session?.user?.id) { setFavoriteIds([]); return; }
    getFavoritePlaceIds(session.user.id).then(setFavoriteIds).catch(() => {});
  }, [session]);

  const availableAmenities = useMemo(() => {
    const s = new Set<string>();
    places.forEach((pl) => (pl.amenities || []).forEach((a) => s.add(a)));
    return Array.from(s).sort();
  }, [places]);
  const priceError = useMemo(() => {
    const mn = Number(minPrice); const mx = Number(maxPrice);
    if (minPrice === '' || maxPrice === '' || Number.isNaN(mn) || Number.isNaN(mx)) return 'Vui lòng nhập giá tối thiểu và tối đa.';
    if (mn < 10 || mx > 250) return 'Giá lọc chỉ từ $10 đến $250 một đêm.';
    if (mn > mx) return 'Giá tối thiểu không được lớn hơn giá tối đa.';
    return '';
  }, [minPrice, maxPrice]);
  const dateError = useMemo(() => {
    const pat = /^\d{4}-\d{2}-\d{2}$/;
    if (checkIn && !pat.test(checkIn)) return 'Ngày check-in nhập dạng YYYY-MM-DD.';
    if (checkOut && !pat.test(checkOut)) return 'Ngày check-out nhập dạng YYYY-MM-DD.';
    if (checkIn && checkOut && checkOut <= checkIn) return 'Ngày check-out phải sau ngày check-in.';
    return '';
  }, [checkIn, checkOut]);
  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (minPrice !== '10' || maxPrice !== '250') c += 1;
    if (guests > 0) c += 1; if (minRooms > 0) c += 1; if (minBeds > 0) c += 1;
    if (selectedAmenities.length > 0) c += 1; if (checkIn || checkOut) c += 1;
    return c;
  }, [minPrice, maxPrice, guests, minRooms, minBeds, selectedAmenities, checkIn, checkOut]);
  const clearFilters = () => { setMinPrice('10'); setMaxPrice('250'); setGuests(0); setMinRooms(0); setMinBeds(0); setSelectedAmenities([]); setCheckIn(''); setCheckOut(''); };
  const filteredPlaces = useMemo(() => {
    const q = normalizeText(debouncedQuery);
    const mn = Number(minPrice); const mx = Number(maxPrice);
    return places.filter((place) => {
      if (q) { const h = normalizeText(`${place.title} ${place.location}`); if (!h.includes(q)) return false; }
      if (!Number.isNaN(mn) && place.price_per_night < mn) return false;
      if (!Number.isNaN(mx) && place.price_per_night > mx) return false;
      if (guests > 0 && (place.guests_capacity || 0) < guests) return false;
      if (minRooms > 0 && (place.rooms || 0) < minRooms) return false;
      if (minBeds > 0 && (place.beds || 0) < minBeds) return false;
      if (selectedAmenities.length > 0) { const am = place.amenities || []; if (!selectedAmenities.every((a) => am.includes(a))) return false; }
      return true;
    });
  }, [places, debouncedQuery, minPrice, maxPrice, guests, minRooms, minBeds, selectedAmenities]);

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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 52 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 6, alignItems: 'center' }}>
        {CATEGORIES.map((item) => {
          const active = category === item;
          return (
            <Pressable
              key={item}
              style={{
                marginRight: 8,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: active ? '#4F46E5' : '#E6E3F5',
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: active ? '#4F46E5' : '#FFFFFF',
              }}
              onPress={() => setCategory(item)}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: active ? '#FFFFFF' : '#131B2E' }}>{categoryLabel(item)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View className="px-5 pb-3 flex-row items-center">
        <Pressable className="flex-row items-center px-4 py-2 rounded-full border border-borderLight bg-white" onPress={() => setShowFilter(!showFilter)}>
          <Ionicons name="options-outline" size={18} color="#4F46E5" />
          <Text className="ml-2 text-sm font-bold text-textMain">Lọc{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</Text>
        </Pressable>
        {activeFilterCount > 0 ? (<Pressable className="ml-3" onPress={() => { clearFilters(); setQuery(''); setCategory('Tất cả'); }}><Text className="text-sm font-bold text-brand">Xóa lọc</Text></Pressable>) : null}
      </View>
      {showFilter ? (
        <ScrollView className="mx-5 mb-3 rounded-2xl bg-white border border-borderLight" style={{ maxHeight: 360 }}>
          <View className="p-4">
            <Text className="text-base font-bold text-textMain">Giá một đêm ($)</Text>
            <View className="mt-2 flex-row items-center">
              <TextInput className="flex-1 border border-borderLight rounded-xl px-3 py-2 text-base text-textMain" keyboardType="number-pad" placeholder="10" value={minPrice} onChangeText={setMinPrice} />
              <Text className="mx-2 text-textMuted">đến</Text>
              <TextInput className="flex-1 border border-borderLight rounded-xl px-3 py-2 text-base text-textMain" keyboardType="number-pad" placeholder="250" value={maxPrice} onChangeText={setMaxPrice} />
            </View>
            {priceError ? <Text className="mt-2 text-sm text-red-500">{priceError}</Text> : null}
            <Text className="mt-4 text-base font-bold text-textMain">Số khách và phòng</Text>
            <Stepper label="Số khách" value={guests} onChange={setGuests} />
            <Stepper label="Số phòng tối thiểu" value={minRooms} onChange={setMinRooms} />
            <Stepper label="Số giường tối thiểu" value={minBeds} onChange={setMinBeds} />
            {availableAmenities.length > 0 ? (<><Text className="mt-4 text-base font-bold text-textMain">Tiện ích</Text><View className="mt-2 flex-row flex-wrap">{availableAmenities.map((item) => { const act = selectedAmenities.includes(item); return (<Pressable key={item} className={`mr-2 mb-2 px-3 py-2 rounded-full border ${act ? 'bg-brand border-brand' : 'bg-white border-borderLight'}`} onPress={() => setSelectedAmenities((prev) => act ? prev.filter((x) => x !== item) : [...prev, item])}><Text className={`text-sm font-bold ${act ? 'text-white' : 'text-textMain'}`}>{categoryLabel(item)}</Text></Pressable>); })}</View></>) : null}
            <Text className="mt-4 text-base font-bold text-textMain">Khi nào (chọn trước cho bước đặt phòng)</Text>
            <View className="mt-2 flex-row items-center">
              <TextInput className="flex-1 border border-borderLight rounded-xl px-3 py-2 text-base text-textMain" placeholder="YYYY-MM-DD" autoCapitalize="none" value={checkIn} onChangeText={setCheckIn} />
              <Text className="mx-2 text-textMuted">đến</Text>
              <TextInput className="flex-1 border border-borderLight rounded-xl px-3 py-2 text-base text-textMain" placeholder="YYYY-MM-DD" autoCapitalize="none" value={checkOut} onChangeText={setCheckOut} />
            </View>
            {dateError ? <Text className="mt-2 text-sm text-red-500">{dateError}</Text> : null}
            <Text className="mt-2 text-xs text-textMuted">Ngày không loại chỗ ở ra, vì places không có lịch trống riêng.</Text>
            <View className="mt-4"><AppButton title="Áp dụng bộ lọc" onPress={() => setShowFilter(false)} disabled={!!priceError || !!dateError} /></View>
            <Pressable className="mt-3 items-center" onPress={() => { clearFilters(); setShowFilter(false); }}><Text className="text-sm font-bold text-brand">Xóa tất cả bộ lọc</Text></Pressable>
          </View>
        </ScrollView>
      ) : null}
      <Text className="px-5 pb-2 text-sm text-textMuted">{filteredPlaces.length} chỗ ở phù hợp</Text>
      {filteredPlaces.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-lg font-bold text-textMain text-center">Không tìm thấy địa điểm nào</Text>
          <Text className="mt-2 text-sm text-textMuted text-center">
            Thử từ khóa khác, chọn danh mục khác hoặc nới bộ lọc ra.
          </Text>
          <View className="mt-6 w-full">
            <AppButton
              title="Xóa tìm kiếm và bộ lọc"
              onPress={() => {
                setQuery('');
                setCategory('Tất cả');
                clearFilters();
              }}
            />
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredPlaces}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isFavorite = favoriteIds.includes(item.id);
            return (
              <Pressable onPress={() => navigation.navigate('Detail', { placeId: item.id })}>
                <PlaceCard
                  place={item}
                  isFavorite={isFavorite}
                  onToggleFavorite={async () => {
                    if (!session) { navigation.navigate('Login'); return; }
                    await toggleFavorite(session.user.id, item.id, isFavorite);
                    setFavoriteIds((prev) => isFavorite ? prev.filter((x) => x !== item.id) : [...prev, item.id]);
                  }}
                />
              </Pressable>
            );
          }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadPlaces(true)} colors={['#4F46E5']} />
          }
        />
      )}
    </View>
  );
}
