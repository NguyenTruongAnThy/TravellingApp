import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getPlaces } from '../../services/placesService';
import { getFavoritePlaceIds, toggleFavorite } from '../../services/favoritesService';
import { useAuth } from '../../context/AuthContext';
import type { Place } from '../../types';
import { normalizeText } from '../../utils/normalize';
import AppButton from '../../components/AppButton';
import PlaceCard from '../../components/PlaceCard';

// Pill loc theo LOAI CAN (place_type) da chuan hoa tren Supabase 2026-11-05: Apartment 1, Beachfront 1, Cabin 3, House 3, Treehouse 2, Villa 2. Khong loc theo category (vi tri thien nhien) nua.
const PLACE_TYPES = ['Tất cả', 'Treehouse', 'Villa', 'Cabin', 'Beachfront', 'House', 'Apartment'];
const placeTypeLabel = (item: string) => item === 'Treehouse' ? 'Nhà cây' : item === 'Villa' ? 'Biệt thự' : item === 'Cabin' ? 'Cabin gỗ' : item === 'Beachfront' ? 'Sát biển' : item === 'House' ? 'Nhà nguyên căn' : item === 'Apartment' ? 'Căn hộ' : item;
const placeTypeIcon = (item: string): any => item === 'Treehouse' ? 'leaf-outline' : item === 'Villa' ? 'home-outline' : item === 'Cabin' ? 'bed-outline' : item === 'Beachfront' ? 'sunny-outline' : item === 'House' ? 'business-outline' : item === 'Apartment' ? 'layers-outline' : 'apps-outline';

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
  const [placeType, setPlaceType] = useState('Tất cả');
  const [showWhere, setShowWhere] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showGuests, setShowGuests] = useState(false);
  const [adults, setAdults] = useState(0);
  const [children, setChildren] = useState(0);
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [showFilter, setShowFilter] = useState(false);
  const [minPrice, setMinPrice] = useState('10');
  const [maxPrice, setMaxPrice] = useState('250');
  // guests cu da tach thanh adults + children, khong con Infants/Pets (chot 2026-11-05)
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
    const placeTypeParam = placeType === 'Tất cả' ? null : placeType;
    const { data, error } = await getPlaces({ place_type: placeTypeParam });
    if (error) {
      setErrorMessage('Không tải được danh sách chỗ ở. Vui lòng thử lại.');
    } else {
      setPlaces(data || []);
    }
    setLoading(false);
    setRefreshing(false);
  }, [placeType]);

  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  useEffect(() => {
    if (!session?.user?.id) { setFavoriteIds([]); return; }
    getFavoritePlaceIds(session.user.id).then(setFavoriteIds).catch(() => {});
  }, [session]);

  const guests = adults + children;
  const availableLocations = useMemo(() => {
    const s = new Set<string>();
    places.forEach((pl) => { if (pl.location) s.add(pl.location); });
    return Array.from(s).sort();
  }, [places]);
  const whereSuggestions = useMemo(() => {
    const q = normalizeText(query);
    if (!q) return places;
    return places.filter((pl) => normalizeText(`${pl.title} ${pl.location}`).includes(q));
  }, [places, query]);
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
    if (guests > 0) c += 1; if (placeType !== 'Tất cả') c += 1; if (minRooms > 0) c += 1; if (minBeds > 0) c += 1;
    if (selectedAmenities.length > 0) c += 1; if (checkIn || checkOut) c += 1;
    return c;
  }, [minPrice, maxPrice, guests, placeType, minRooms, minBeds, selectedAmenities, checkIn, checkOut]);
  const clearFilters = () => { setMinPrice('10'); setMaxPrice('250'); setAdults(0); setChildren(0); setMinRooms(0); setMinBeds(0); setSelectedAmenities([]); setCheckIn(''); setCheckOut(''); };
  const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const calDays = useMemo(() => {
    const first = new Date(calYear, calMonth, 1);
    const startOffset = (first.getDay() + 6) % 7; // Thu 2 = 0
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [calYear, calMonth]);
  const onCalDay = (day: number) => {
    const ds = fmtDate(new Date(calYear, calMonth, day));
    if (!checkIn || (checkIn && checkOut)) { setCheckIn(ds); setCheckOut(''); }
    else if (ds > checkIn) { setCheckOut(ds); }
    else { setCheckIn(ds); setCheckOut(''); }
  };
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
      {/* Figma index: header tim DAI, gradient #4F46E5 -> #7C5CFC, gom Top Brand Row + vien thuoc tim kiem. Can chay: npx expo install expo-linear-gradient */}
      <LinearGradient colors={['#4F46E5', '#7C5CFC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View className="px-5 pt-12 pb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-xl items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <Text className="text-lg font-bold text-white">W</Text>
              </View>
              <Text className="ml-2 text-xl font-bold text-white">WanderStay</Text>
            </View>
            <View className="flex-row items-center">
              <View className="px-2.5 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}>
                <Text className="text-[11px] font-bold text-white">USD $</Text>
              </View>
              <Pressable className="ml-2.5 w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }} onPress={() => { if (!session) { navigation.navigate('Login'); return; } navigation.navigate('MainTabs', { screen: 'Inbox' }); }}>
                <Ionicons name="notifications-outline" size={16} color="#FFFFFF" />
                <View style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' }} />
              </Pressable>
            </View>
          </View>
          <View className="mt-3 flex-row items-center rounded-full border border-borderLight bg-white pl-2 pr-2 py-2">
            <Pressable className="flex-1 flex-row items-center" onPress={() => setShowWhere(true)}>
              <View className="w-9 h-9 rounded-full bg-appBg items-center justify-center">
                <Ionicons name="search-outline" size={18} color="#5A6478" />
              </View>
              <View className="flex-1 ml-2">
                <Text className="text-base text-textMain" numberOfLines={1}>{query || 'Where to?'}</Text>
                <Text className="text-xs text-textMuted" numberOfLines={1}>{checkIn || checkOut ? `${checkIn || '...'} - ${checkOut || '...'}` : 'Chọn ngày'} • {guests > 0 ? `${guests} khách` : 'Thêm khách'}</Text>
              </View>
            </Pressable>
            {query ? (
              <Pressable onPress={() => setQuery('')}>
                <Ionicons name="close-circle-outline" size={20} color="#5A6478" />
              </Pressable>
            ) : null}
            <Pressable className="ml-2 w-9 h-9 rounded-full bg-white border border-borderLight items-center justify-center" onPress={() => setShowFilter(true)}>
              <Ionicons name="options-outline" size={16} color="#131B2E" />
            </Pressable>
          </View>
          {activeFilterCount > 0 ? (<Text className="mt-2 text-xs font-bold text-white">Đang lọc: {activeFilterCount} điều kiện</Text>) : null}
        </View>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 52 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 6, alignItems: 'center' }}>
        {PLACE_TYPES.map((item) => {
          const active = placeType === item;
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
              onPress={() => setPlaceType(item)}
            >
              <Ionicons name={placeTypeIcon(item)} size={14} color={active ? '#FFFFFF' : '#131B2E'} />
              <Text style={{ marginLeft: 6, fontSize: 12, fontWeight: active ? '700' : '500', color: active ? '#FFFFFF' : '#131B2E' }}>{placeTypeLabel(item)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {activeFilterCount > 0 ? (<View className="px-5 pb-3 flex-row items-center"><Pressable onPress={() => { clearFilters(); setQuery(''); setPlaceType('Tất cả'); }}><Text className="text-sm font-bold text-brand">Xóa lọc</Text></Pressable></View>) : null}
      {/* Figma where: bottom sheet, khong phai trang rieng */}
      <Modal visible={showWhere} transparent animationType="slide" onRequestClose={() => setShowWhere(false)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setShowWhere(false)}>
          <Pressable className="bg-white rounded-t-3xl" style={{ maxHeight: '85%' }} onPress={() => {}}>
            <View className="items-center pt-3"><View className="w-10 h-1 rounded-full bg-borderLight" /></View>
            <ScrollView>
              <View className="p-5">
                <View className="flex-row items-center justify-between"><Text className="text-lg font-bold text-textMain">Where to?</Text><Pressable onPress={() => setShowWhere(false)}><Ionicons name="close" size={22} color="#131B2E" /></Pressable></View>
                <View className="mt-3 flex-row items-center rounded-full border border-borderLight bg-appBg px-4">
                  <Ionicons name="search-outline" size={18} color="#5A6478" />
                  <TextInput className="flex-1 py-3 text-base text-textMain ml-2" placeholder="Search destinations" value={query} onChangeText={setQuery} autoCapitalize="none" onSubmitEditing={() => { if (whereSuggestions.length === 0) return; setShowWhere(false); setShowSchedule(true); }} returnKeyType="search" />
                  {query ? (<Pressable onPress={() => setQuery('')}><Ionicons name="close-circle-outline" size={20} color="#5A6478" /></Pressable>) : null}
                </View>
                <Text className="mt-4 text-base font-bold text-textMain">{query ? 'Gợi ý' : 'Địa điểm phổ biến'}</Text>
                <Text className="mt-1 text-sm text-textMuted">{query ? 'Gõ để lọc, bấm vào 1 gợi ý để chọn chỗ đó.' : 'Bấm vào 1 chỗ để chọn, không cần nhớ chính xác tên.'}</Text>
                {whereSuggestions.length === 0 ? (
                  <Text className="mt-3 text-base text-textMuted">Không có địa điểm này. WanderStay hiện chỉ có chỗ ở ở Bali, cậu thử từ khóa khác như Balian, Kuta hoặc Ubud.</Text>
                ) : whereSuggestions.map((pl) => (<Pressable key={pl.id} className="flex-row items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: '#E6E3F5' }} onPress={() => { setQuery(pl.title); setShowWhere(false); setShowSchedule(true); }}><Ionicons name="search-outline" size={18} color="#5A6478" /><View className="ml-3 flex-1"><Text className="text-base font-bold text-textMain">{pl.title}</Text><Text className="text-sm text-textMuted">{pl.location}</Text></View></Pressable>))}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
      {/* Figma Schaduel: lich that, khong copy luoi thang 2/2022 mau */}
      <Modal visible={showSchedule} transparent animationType="slide" onRequestClose={() => setShowSchedule(false)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setShowSchedule(false)}>
          <Pressable className="bg-white rounded-t-3xl" style={{ maxHeight: '85%' }} onPress={() => {}}>
            <View className="items-center pt-3"><View className="w-10 h-1 rounded-full bg-borderLight" /></View>
            <ScrollView>
              <View className="p-5">
                <View className="flex-row items-center justify-between"><Text className="text-lg font-bold text-textMain">When's your trip?</Text><Pressable onPress={() => setShowSchedule(false)}><Ionicons name="close" size={22} color="#131B2E" /></Pressable></View>
                <View className="mt-3 flex-row"><View className="flex-1 border border-borderLight rounded-xl px-3 py-2 mr-2"><Text className="text-xs text-textMuted">Check-in</Text><Text className="text-base text-textMain">{checkIn || 'Add date'}</Text></View><View className="flex-1 border border-borderLight rounded-xl px-3 py-2"><Text className="text-xs text-textMuted">Check-out</Text><Text className="text-base text-textMain">{checkOut || 'Add date'}</Text></View></View>
                <View className="mt-4 flex-row items-center justify-between">
                  <Pressable onPress={() => { const d = new Date(calYear, calMonth - 1, 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }}><Text className="text-xl text-textMain">‹</Text></Pressable>
                  <Text className="text-base font-bold text-textMain">Tháng {calMonth + 1}/{calYear}</Text>
                  <Pressable onPress={() => { const d = new Date(calYear, calMonth + 1, 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }}><Text className="text-xl text-textMain">›</Text></Pressable>
                </View>
                <View className="mt-2 flex-row">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (<Text key={d} className="flex-1 text-center text-xs text-textMuted">{d}</Text>))}</View>
                <View className="flex-row flex-wrap">
                  {calDays.map((day, i) => {
                    if (day === null) return (<View key={i} style={{ width: '14.28%', aspectRatio: 1 }} />);
                    const ds = fmtDate(new Date(calYear, calMonth, day));
                    const sel = ds === checkIn || ds === checkOut;
                    const between = checkIn && checkOut && ds > checkIn && ds < checkOut;
                    return (<Pressable key={i} style={{ width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: sel ? '#4F46E5' : between ? '#E6E3F5' : 'transparent', borderRadius: 999 }} onPress={() => onCalDay(day)}><Text style={{ color: sel ? '#FFFFFF' : '#131B2E', fontWeight: sel ? '700' : '400' }}>{day}</Text></Pressable>);
                  })}
                </View>
                {dateError ? <Text className="mt-2 text-sm text-red-500">{dateError}</Text> : null}
                <View className="mt-4 flex-row items-center"><Pressable className="mr-4" onPress={() => { setCheckIn(''); setCheckOut(''); }}><Text className="text-base font-bold text-brand">Clear all</Text></Pressable><View className="flex-1"><AppButton title="Save" onPress={() => { setShowSchedule(false); setShowGuests(true); }} disabled={!!dateError} /></View></View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
      {/* Figma guest: chi Adults + Children, khong Infants, khong Pets */}
      <Modal visible={showGuests} transparent animationType="slide" onRequestClose={() => setShowGuests(false)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setShowGuests(false)}>
          <Pressable className="bg-white rounded-t-3xl" style={{ maxHeight: '85%' }} onPress={() => {}}>
            <View className="items-center pt-3"><View className="w-10 h-1 rounded-full bg-borderLight" /></View>
            <View className="p-5">
              <View className="flex-row items-center justify-between"><Text className="text-lg font-bold text-textMain">Who's coming?</Text><Pressable onPress={() => setShowGuests(false)}><Ionicons name="close" size={22} color="#131B2E" /></Pressable></View>
              <Stepper label="Adults — Ages 13 or above" value={adults} onChange={setAdults} />
              <Stepper label="Children — Ages 2 - 12" value={children} onChange={setChildren} />
              <Text className="mt-2 text-sm text-textMuted">Số khách không vượt quá sức chứa của chỗ ở, bộ lọc sẽ loại chỗ không đủ chỗ.</Text>
              <View className="mt-4 flex-row items-center"><Pressable className="mr-4" onPress={() => { setAdults(0); setChildren(0); }}><Text className="text-base font-bold text-brand">Clear all</Text></Pressable><View className="flex-1"><AppButton title="Search" onPress={() => setShowGuests(false)} /></View></View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal visible={showFilter} transparent animationType="slide" onRequestClose={() => setShowFilter(false)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setShowFilter(false)}>
          <Pressable className="bg-white rounded-t-3xl" style={{ maxHeight: '85%' }} onPress={() => {}}>
            <View className="items-center pt-3"><View className="w-10 h-1 rounded-full bg-borderLight" /></View>
            <ScrollView>
          <View className="p-5">
            <Text className="text-base font-bold text-textMain">Price range — Giá một đêm ($)</Text>
            <Text className="mt-1 text-xs text-textMuted">Price range là 1 mục trong tấm Filters này, không phải màn riêng. Giá từ $10 đến $250.</Text>
            <View className="mt-2 flex-row items-center">
              <TextInput className="flex-1 border border-borderLight rounded-xl px-3 py-2 text-base text-textMain" keyboardType="number-pad" placeholder="10" value={minPrice} onChangeText={setMinPrice} />
              <Text className="mx-2 text-textMuted">đến</Text>
              <TextInput className="flex-1 border border-borderLight rounded-xl px-3 py-2 text-base text-textMain" keyboardType="number-pad" placeholder="250" value={maxPrice} onChangeText={setMaxPrice} />
            </View>
            {priceError ? <Text className="mt-2 text-sm text-red-500">{priceError}</Text> : null}
            <Text className="mt-4 text-base font-bold text-textMain">Type of place — Loại căn</Text>
            <View className="mt-2 flex-row flex-wrap">{PLACE_TYPES.filter((x) => x !== 'Tất cả').map((item) => { const act = placeType === item; return (<Pressable key={item} className={`mr-2 mb-2 px-3 py-2 rounded-full border ${act ? 'bg-brand border-brand' : 'bg-white border-borderLight'}`} onPress={() => setPlaceType(item)}><Text className={`text-sm font-bold ${act ? 'text-white' : 'text-textMain'}`}>{placeTypeLabel(item)}</Text></Pressable>); })}</View>
            <Text className="mt-4 text-base font-bold text-textMain">Số khách và phòng</Text>
            <Stepper label="Người lớn (13 tuổi trở lên)" value={adults} onChange={setAdults} />
            <Stepper label="Trẻ em (2-12 tuổi)" value={children} onChange={setChildren} />
            <Stepper label="Số phòng tối thiểu" value={minRooms} onChange={setMinRooms} />
            <Stepper label="Số giường tối thiểu" value={minBeds} onChange={setMinBeds} />
            {availableAmenities.length > 0 ? (<><Text className="mt-4 text-base font-bold text-textMain">Tiện ích</Text><View className="mt-2 flex-row flex-wrap">{availableAmenities.map((item) => { const act = selectedAmenities.includes(item); return (<Pressable key={item} className={`mr-2 mb-2 px-3 py-2 rounded-full border ${act ? 'bg-brand border-brand' : 'bg-white border-borderLight'}`} onPress={() => setSelectedAmenities((prev) => act ? prev.filter((x) => x !== item) : [...prev, item])}><Text className={`text-sm font-bold ${act ? 'text-white' : 'text-textMain'}`}>{placeTypeLabel(item)}</Text></Pressable>); })}</View></>) : null}
            <Text className="mt-4 text-base font-bold text-textMain">Khi nào (chọn trước cho bước đặt phòng)</Text>
            <Pressable className="mt-2 border border-borderLight rounded-xl px-3 py-3" onPress={() => { setShowFilter(false); setShowSchedule(true); }}>
              <Text className="text-base text-textMain">{checkIn ? `${checkIn} → ${checkOut || 'Chưa chọn ngày trả'}` : 'Chọn ngày trên lịch'}</Text>
            </Pressable>
            {dateError ? <Text className="mt-2 text-sm text-red-500">{dateError}</Text> : null}
            <Text className="mt-2 text-xs text-textMuted">Ngày không loại chỗ ở ra, vì places không có lịch trống riêng.</Text>
            <View className="mt-4"><AppButton title="Áp dụng bộ lọc" onPress={() => setShowFilter(false)} disabled={!!priceError || !!dateError} /></View>
            <Pressable className="mt-3 items-center" onPress={() => { clearFilters(); setShowFilter(false); }}><Text className="text-sm font-bold text-brand">Xóa tất cả bộ lọc</Text></Pressable>
          </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
                setPlaceType('Tất cả');
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
