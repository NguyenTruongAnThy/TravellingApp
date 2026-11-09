import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import AppButton from '../../components/AppButton';
import PlaceCard from '../../components/PlaceCard';
import BestSellersCarousel from '../../components/BestSellersCarousel';

// Pill loc theo LOAI CAN (place_type) da chuan hoa tren Supabase 2026-11-05: Apartment 1, Beachfront 1, Cabin 3, House 3, Treehouse 2, Villa 2. Khong loc theo category (vi tri thien nhien) nua.
const PLACE_TYPES = ['All', 'Treehouse', 'Villa', 'Cabin', 'Beachfront', 'House', 'Apartment'];
const placeTypeLabel = (item: string) => item;
const placeTypeIcon = (item: string): any => item === 'Treehouse' ? 'leaf-outline' : item === 'Villa' ? 'home-outline' : item === 'Cabin' ? 'bed-outline' : item === 'Beachfront' ? 'sunny-outline' : item === 'House' ? 'business-outline' : item === 'Apartment' ? 'layers-outline' : 'apps-outline';

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (<View className="flex-row items-center justify-between py-2.5"><Text className="text-base text-textMain">{label}</Text><View className="flex-row items-center"><Pressable className="w-9 h-9 rounded-full border border-brand bg-white items-center justify-center" onPress={() => onChange(Math.max(0, value - 1))}><Text className="text-lg font-bold text-brand">-</Text></Pressable><Text className={`w-16 text-center text-base font-bold ${value > 0 ? 'text-brand' : 'text-textMain'}`}>{value === 0 ? 'Any' : value}</Text><Pressable className="w-9 h-9 rounded-full border border-brand bg-white items-center justify-center" onPress={() => onChange(value + 1)}><Text className="text-lg font-bold text-brand">+</Text></Pressable></View></View>);
}

// Filters sheet section title: small brand icon in a lavender circle + bold title.
function FilterSectionTitle({ icon, title }: { icon: any; title: string }) {
  return (
    <View className="flex-row items-center">
      <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: '#EDE9FE' }}>
        <Ionicons name={icon} size={16} color="#4F46E5" />
      </View>
      <Text className="ml-2 text-base font-bold text-textMain">{title}</Text>
    </View>
  );
}

const FilterDivider = () => (<View className="mt-6" style={{ height: 1, backgroundColor: '#E6E3F5' }} />);

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    title: 'Chào mừng bạn đến với WanderStay! 🎉',
    message: 'Khám phá hàng ngàn chỗ nghỉ dưỡng độc đáo với chìa khóa số thông minh (Keyless Smart Key) và hướng dẫn lộ trình chi tiết.',
    time: 'Vừa xong',
    icon: 'sparkles',
    iconColor: '#4F46E5',
    bgColor: '#EEF2FF',
  },
  {
    id: '2',
    title: 'Ưu đãi dành cho thành viên mới 🎁',
    message: 'Nhập mã WANDER10 tại bước thanh toán để được giảm ngay 10% cho kỳ nghỉ đầu tiên của bạn.',
    time: '2 giờ trước',
    icon: 'pricetag',
    iconColor: '#FF6B00',
    bgColor: '#FFF7ED',
  },
  {
    id: '3',
    title: 'Thanh toán VietQR tự động qua SePay 💳',
    message: 'Giờ đây bạn có thể quét mã VietQR ngân hàng BIDV để tự động xác nhận đơn phòng 24/7 tức thì.',
    time: '5 giờ trước',
    icon: 'qr-code',
    iconColor: '#059669',
    bgColor: '#ECFDF5',
  },
  {
    id: '4',
    title: 'Nhắc nhở nhận phòng thông minh 🔑',
    message: 'Mã PIN mở khóa cửa sẽ tự động kích hoạt vào lúc 14:00 ngày nhận phòng và hết hạn lúc 12:00 ngày trả phòng.',
    time: '1 ngày trước',
    icon: 'key',
    iconColor: '#7C3AED',
    bgColor: '#F5F3FF',
  },
  {
    id: '5',
    title: 'Bảo mật tài khoản 2 lớp (2FA) 🛡️',
    message: 'Kiểm tra điểm sức khỏe bảo mật và kích hoạt xác thực 2 bước trong mục Hồ sơ để bảo vệ an toàn thông tin.',
    time: '2 ngày trước',
    icon: 'shield-checkmark',
    iconColor: '#2563EB',
    bgColor: '#EFF6FF',
  },
];

export default function SearchScreen({ navigation: propNavigation }: { navigation?: any } = {}) {
  const hookNavigation = useNavigation<any>();
  const navigation = propNavigation || hookNavigation;
  const { session } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [placeType, setPlaceType] = useState('All');
  const [showWhere, setShowWhere] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showGuests, setShowGuests] = useState(false);
  const [adults, setAdults] = useState(0);
  const [children, setChildren] = useState(0);
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [showFilter, setShowFilter] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [minPrice, setMinPrice] = useState('10');
  const [maxPrice, setMaxPrice] = useState('250');
  // guests cu da tach thanh adults + children, khong con Infants/Pets (chot 2026-11-05)
  const [minRooms, setMinRooms] = useState(0);
  const [minBeds, setMinBeds] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;
  const listRef = useRef<any>(null);

  // Debounce 400ms: search only after the user stops typing for 400ms
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
    const placeTypeParam = placeType === 'All' ? null : placeType;
    const { data, error } = await getPlaces({ place_type: placeTypeParam });
    if (error) {
      setErrorMessage('Could not load the stay list. Please try again.');
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
    if (minPrice === '' || maxPrice === '' || Number.isNaN(mn) || Number.isNaN(mx)) return 'Please enter a minimum and maximum price.';
    if (mn < 10 || mx > 250) return 'Filter price is only $10 to $250 per night.';
    if (mn > mx) return 'Minimum price cannot be greater than maximum price.';
    return '';
  }, [minPrice, maxPrice]);
  const dateError = useMemo(() => {
    const pat = /^\d{4}-\d{2}-\d{2}$/;
    if (checkIn && !pat.test(checkIn)) return 'Enter the check-in date as YYYY-MM-DD.';
    if (checkOut && !pat.test(checkOut)) return 'Enter the check-out date as YYYY-MM-DD.';
    if (checkIn && checkOut && checkOut <= checkIn) return 'Check-out must be after check-in.';
    return '';
  }, [checkIn, checkOut]);
  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (minPrice !== '10' || maxPrice !== '250') c += 1;
    if (guests > 0) c += 1; if (placeType !== 'All') c += 1; if (minRooms > 0) c += 1; if (minBeds > 0) c += 1;
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
  const totalPages = Math.max(1, Math.ceil(filteredPlaces.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagePlaces = filteredPlaces.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [debouncedQuery, placeType, minPrice, maxPrice, guests, minRooms, minBeds, selectedAmenities, checkIn, checkOut]);
  const goToPage = (n: number) => { setPage(Math.min(Math.max(1, n), totalPages)); listRef.current?.scrollToOffset({ offset: 0, animated: false }); };

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
              <Pressable
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}
                onPress={() => setShowNotifications(true)}
              >
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
                <Text className="text-xs text-textMuted" numberOfLines={1}>{checkIn || checkOut ? `${checkIn || '...'} - ${checkOut || '...'}` : 'Pick dates'} • {guests > 0 ? `${guests} guests` : 'Add guests'}</Text>
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
          {activeFilterCount > 0 ? (<Text className="mt-2 text-xs font-bold text-white">Filtering: {activeFilterCount} conditions</Text>) : null}
        </View>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 48, flexGrow: 0, flexShrink: 0 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 6, alignItems: 'center' }}>
        {PLACE_TYPES.map((item) => {
          const active = placeType === item;
          return (
            <Pressable
              key={item}
              style={{
                marginRight: 8,
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: active ? '#4F46E5' : '#E6E3F5',
                height: 36,
                flexDirection: 'row',
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

      {activeFilterCount > 0 ? (<View className="px-5 pb-3 flex-row items-center"><Pressable onPress={() => { clearFilters(); setQuery(''); setPlaceType('All'); }}><Text className="text-sm font-bold text-brand">Clear filters</Text></Pressable></View>) : null}
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
                <Text className="mt-4 text-base font-bold text-textMain">{query ? 'Suggestions' : 'Popular places'}</Text>
                <Text className="mt-1 text-sm text-textMuted">{query ? 'Type to filter, tap a suggestion to pick that stay.' : 'Tap a stay to pick it, no need to remember the exact name.'}</Text>
                {whereSuggestions.length === 0 ? (
                  <Text className="mt-3 text-base text-textMuted">No such place. Try searching for destinations like Bãi Cháy, Đà Lạt, Phú Quốc, Sa Pa, or Bali (Balian, Ubud, Kuta)...</Text>
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
                  <Text className="text-base font-bold text-textMain">{['January','February','March','April','May','June','July','August','September','October','November','December'][calMonth]} {calYear}</Text>
                  <Pressable onPress={() => { const d = new Date(calYear, calMonth + 1, 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }}><Text className="text-xl text-textMain">›</Text></Pressable>
                </View>
                <View className="mt-2 flex-row">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (<Text key={d} className="flex-1 text-center text-xs text-textMuted">{d}</Text>))}</View>
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
              <Text className="mt-2 text-sm text-textMuted">Guests cannot exceed a stay's capacity, the filter removes stays that do not fit.</Text>
              <View className="mt-4 flex-row items-center"><Pressable className="mr-4" onPress={() => { setAdults(0); setChildren(0); }}><Text className="text-base font-bold text-brand">Clear all</Text></Pressable><View className="flex-1"><AppButton title="Search" onPress={() => setShowGuests(false)} /></View></View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal visible={showFilter} transparent animationType="slide" onRequestClose={() => setShowFilter(false)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setShowFilter(false)}>
          <Pressable className="bg-white rounded-t-3xl" style={{ maxHeight: '88%' }} onPress={() => {}}>
            <View className="items-center pt-3"><View className="w-10 h-1 rounded-full bg-borderLight" /></View>
            <View className="px-5 pt-2 pb-3 flex-row items-center">
              <View className="flex-1" />
              <Text className="text-lg font-bold text-textMain">Filters</Text>
              <View className="flex-1 items-end">
                <Pressable className="w-8 h-8 rounded-full bg-appBg items-center justify-center" onPress={() => setShowFilter(false)}>
                  <Ionicons name="close" size={20} color="#5A6478" />
                </Pressable>
              </View>
            </View>
            <View style={{ height: 1, backgroundColor: '#E6E3F5' }} />
            <ScrollView>
          <View className="p-5">
            <FilterSectionTitle icon="pricetag-outline" title="Price range — Price per night ($)" />
            <Text className="mt-2 text-xs text-textMuted">Price range is one section inside this Filters sheet, not a separate screen. Price from $10 to $250.</Text>
            <View className="mt-3 flex-row items-center">
              <TextInput className="flex-1 rounded-xl px-3 py-3 text-base font-bold text-textMain" style={{ backgroundColor: '#F8F7FF', borderWidth: 1, borderColor: priceError ? '#EF4444' : '#4F46E5' }} keyboardType="number-pad" placeholder="10" placeholderTextColor="#8A90A6" value={minPrice} onChangeText={setMinPrice} />
              <Text className="mx-2 text-textMuted">to</Text>
              <TextInput className="flex-1 rounded-xl px-3 py-3 text-base font-bold text-textMain" style={{ backgroundColor: '#F8F7FF', borderWidth: 1, borderColor: priceError ? '#EF4444' : '#4F46E5' }} keyboardType="number-pad" placeholder="250" placeholderTextColor="#8A90A6" value={maxPrice} onChangeText={setMaxPrice} />
            </View>
            {priceError ? <Text className="mt-2 text-sm text-red-500">{priceError}</Text> : null}
            <FilterDivider />
            <View className="mt-6"><FilterSectionTitle icon="home-outline" title="Type of place" /></View>
            <View className="mt-3 flex-row flex-wrap">{PLACE_TYPES.filter((x) => x !== 'All').map((item) => { const act = placeType === item; return (<Pressable key={item} className={`mr-2 mb-2 px-4 py-2.5 rounded-full border ${act ? 'bg-brand border-brand' : 'bg-white border-borderLight'}`} style={act ? { shadowColor: '#4F46E5', shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 } : undefined} onPress={() => setPlaceType(item)}><View className="flex-row items-center"><Ionicons name={placeTypeIcon(item)} size={14} color={act ? '#FFFFFF' : '#4F46E5'} /><Text className={`ml-1.5 text-sm font-bold ${act ? 'text-white' : 'text-textMain'}`}>{placeTypeLabel(item)}</Text></View></Pressable>); })}</View>
            <FilterDivider />
            <View className="mt-6"><FilterSectionTitle icon="people-outline" title="Guests and rooms" /></View>
            <Stepper label="Adults (13 or above)" value={adults} onChange={setAdults} />
            <Stepper label="Children (2-12)" value={children} onChange={setChildren} />
            <Stepper label="Minimum rooms" value={minRooms} onChange={setMinRooms} />
            <Stepper label="Minimum beds" value={minBeds} onChange={setMinBeds} />
            {availableAmenities.length > 0 ? (<><FilterDivider /><View className="mt-6"><FilterSectionTitle icon="checkmark-circle-outline" title="Facilities" /></View><View className="mt-3 flex-row flex-wrap">{availableAmenities.map((item) => { const act = selectedAmenities.includes(item); return (<Pressable key={item} className={`mr-2 mb-2 px-4 py-2.5 rounded-full border ${act ? 'bg-brand border-brand' : 'bg-white border-borderLight'}`} style={act ? { shadowColor: '#4F46E5', shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 } : undefined} onPress={() => setSelectedAmenities((prev) => act ? prev.filter((x) => x !== item) : [...prev, item])}><View className="flex-row items-center">{act ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}<Text className={`text-sm font-bold ${act ? 'text-white ml-1' : 'text-textMain'}`}>{placeTypeLabel(item)}</Text></View></Pressable>); })}</View></>) : null}
            <FilterDivider />
            <View className="mt-6"><FilterSectionTitle icon="calendar-outline" title="When (pick ahead for booking)" /></View>
            <Pressable className="mt-3 rounded-xl px-3 py-3 flex-row items-center" style={{ backgroundColor: '#F8F7FF', borderWidth: 1, borderColor: '#E6E3F5' }} onPress={() => { setShowFilter(false); setShowSchedule(true); }}>
              <Ionicons name="calendar-outline" size={18} color="#4F46E5" />
              <Text className="ml-2 text-base text-textMain">{checkIn ? `${checkIn} → ${checkOut || 'No check-out date yet'}` : 'Pick dates on the calendar'}</Text>
            </Pressable>
            {dateError ? <Text className="mt-2 text-sm text-red-500">{dateError}</Text> : null}
            <Text className="mt-2 text-xs text-textMuted">Dates do not filter stays out, because places have no separate availability calendar.</Text>
          </View>
            </ScrollView>
            <View className="px-5 py-4 flex-row items-center" style={{ borderTopWidth: 1, borderTopColor: '#E6E3F5' }}>
              <Pressable onPress={() => { clearFilters(); setShowFilter(false); }}><Text className="text-sm font-bold text-textMuted" style={{ textDecorationLine: 'underline' }}>Clear all filters</Text></Pressable>
              <View className="flex-1 ml-4"><AppButton title="Apply filters" onPress={() => setShowFilter(false)} disabled={!!priceError || !!dateError} /></View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      {loading ? (
        <View className="flex-1 items-center justify-center px-6 py-16">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="mt-3 text-sm text-textMuted">Loading stays...</Text>
        </View>
      ) : errorMessage ? (
        <View className="flex-1 items-center justify-center px-6 py-16">
          <Text className="text-lg font-bold text-textMain text-center">Could not load data</Text>
          <Text className="mt-2 text-sm text-textMuted text-center">{errorMessage}</Text>
          <View className="mt-6 w-full max-w-xs">
            <AppButton title="Try again" onPress={() => loadPlaces()} />
          </View>
        </View>
      ) : (
        <>
          {filteredPlaces.length === 0 ? (
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-lg font-bold text-textMain text-center">No places found</Text>
              <Text className="mt-2 text-sm text-textMuted text-center">
                Try another keyword, pick another category, or loosen the filters.
              </Text>
              <View className="mt-6 w-full">
                <AppButton
                  title="Clear search and filters"
                  onPress={() => {
                    setQuery('');
                    setPlaceType('All');
                    clearFilters();
                  }}
                />
              </View>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              style={{ flex: 1 }}
              data={pagePlaces}
              keyExtractor={(item) => item.id}
              ListHeaderComponent={
                !debouncedQuery && safePage === 1 ? (
                  <View className="pt-2 mb-2">
                    <BestSellersCarousel
                      places={places}
                      favoriteIds={favoriteIds}
                      onToggleFavorite={async (placeId, isFav) => {
                        if (!session) {
                          navigation.navigate('Login');
                          return;
                        }
                        try {
                          await toggleFavorite(session.user.id, placeId, isFav);
                          setFavoriteIds((prev) =>
                            isFav ? prev.filter((x) => x !== placeId) : [...prev, placeId]
                          );
                        } catch (err) {
                          console.warn('Could not toggle favorite:', err);
                        }
                      }}
                      onSelectPlace={(placeId) => {
                        navigation.navigate('Detail', {
                          placeId,
                          checkIn: checkIn || undefined,
                          checkOut: checkOut || undefined,
                        });
                      }}
                    />
                    <View className="flex-row items-center justify-between pb-3 pt-2 border-t border-borderLight">
                      <View>
                        <Text className="text-base font-bold text-textMain">
                          Tất Cả Chỗ Nghỉ Khám Phá
                        </Text>
                        <Text className="text-xs text-textMuted mt-0.5">
                          {filteredPlaces.length} chỗ nghỉ tuyệt vời cho kỳ nghỉ của bạn
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <Text className="pb-2 text-sm text-textMuted">
                    {filteredPlaces.length} matching stays
                  </Text>
                )
              }
              renderItem={({ item }) => {
                const isFavorite = favoriteIds.includes(item.id);
                return (
                  <Pressable
                    onPress={() =>
                      navigation.navigate('Detail', {
                        placeId: item.id,
                        checkIn: checkIn || undefined,
                        checkOut: checkOut || undefined,
                      })
                    }
                  >
                    <PlaceCard
                      place={item}
                      isFavorite={isFavorite}
                      onToggleFavorite={async () => {
                        if (!session) { navigation.navigate('Login'); return; }
                        try {
                          await toggleFavorite(session.user.id, item.id, isFavorite);
                          setFavoriteIds((prev) => isFavorite ? prev.filter((x) => x !== item.id) : [...prev, item.id]);
                        } catch (err) {
                          console.warn('Could not toggle favorite:', err);
                        }
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
              ListFooterComponent={
                <View>
                  <View className="pt-3 pb-2 flex-row items-center justify-between">
                    <Pressable className={`px-3 py-2 rounded-full border ${safePage <= 1 ? 'border-borderLight' : 'border-brand'}`} disabled={safePage <= 1} onPress={() => goToPage(safePage - 1)}>
                      <Text className={`text-sm font-bold ${safePage <= 1 ? 'text-textMuted' : 'text-brand'}`}>‹ Prev</Text>
                    </Pressable>
                    <View className="flex-row items-center">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                        <Pressable key={n} className={`w-9 h-9 mx-1 rounded-full items-center justify-center ${n === safePage ? 'bg-brand' : 'bg-white border border-borderLight'}`} onPress={() => goToPage(n)}>
                          <Text className={`text-sm font-bold ${n === safePage ? 'text-white' : 'text-textMain'}`}>{n}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <Pressable className={`px-3 py-2 rounded-full border ${safePage >= totalPages ? 'border-borderLight' : 'border-brand'}`} disabled={safePage >= totalPages} onPress={() => goToPage(safePage + 1)}>
                      <Text className={`text-sm font-bold ${safePage >= totalPages ? 'text-textMuted' : 'text-brand'}`}>Next ›</Text>
                    </Pressable>
                  </View>
                  <Text className="pb-2 text-center text-xs text-textMuted">Page {safePage} of {totalPages} • {filteredPlaces.length} matching stays</Text>
                </View>
              }
            />
          )}
        </>
      )}

      {/* Modal: Notifications with Default Mock Data */}
      <Modal
        visible={showNotifications}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotifications(false)}
      >
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          onPress={() => setShowNotifications(false)}
        >
          <Pressable
            className="bg-white rounded-t-3xl overflow-hidden"
            style={{ maxHeight: '80%' }}
            onPress={() => {}}
          >
            <View className="items-center pt-3 pb-1">
              <View className="w-10 h-1 rounded-full bg-borderLight" />
            </View>

            {/* Header */}
            <View className="px-5 py-3 border-b border-borderLight flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-full bg-brand/10 items-center justify-center">
                  <Ionicons name="notifications" size={17} color="#4F46E5" />
                </View>
                <Text className="text-lg font-bold text-textMain">Thông báo</Text>
                <View className="bg-red-500 px-2 py-0.5 rounded-full ml-1">
                  <Text className="text-[10px] font-bold text-white">Mới</Text>
                </View>
              </View>

              <Pressable
                onPress={() => setShowNotifications(false)}
                className="w-8 h-8 rounded-full bg-appBg items-center justify-center border border-borderLight active:opacity-80"
              >
                <Ionicons name="close" size={18} color="#131B2E" />
              </Pressable>
            </View>

            {/* Notifications List */}
            <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
              {MOCK_NOTIFICATIONS.map((item) => (
                <View
                  key={item.id}
                  className="bg-appBg rounded-2xl p-3.5 mb-3 border border-borderLight/80 flex-row items-start gap-3"
                >
                  <View
                    className="w-10 h-10 rounded-2xl items-center justify-center mt-0.5"
                    style={{ backgroundColor: item.bgColor }}
                  >
                    <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-bold text-textMain flex-1 mr-2" numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text className="text-[10px] text-textMuted font-medium">
                        {item.time}
                      </Text>
                    </View>
                    <Text className="text-[11px] text-textMuted mt-1 leading-4">
                      {item.message}
                    </Text>
                  </View>
                </View>
              ))}
              <View className="h-6" />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
