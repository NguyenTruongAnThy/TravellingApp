import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getUserBookings, cancelBooking } from '../../services/bookingsService';
import { convertUsdToVnd } from '../../services/sepayService';
import SepayQrModal from '../../components/SepayQrModal';
import type { Booking } from '../../types';

type TabType = 'Upcoming' | 'Completed' | 'Cancelled';

export default function BookingsScreen({ navigation: propNavigation }: { navigation?: any } = {}) {
  const hookNavigation = useNavigation<any>();
  const navigation = propNavigation || hookNavigation;
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [activeTab, setActiveTab] = useState<TabType>('Upcoming');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Interactive Modals for in-screen preview (or direct stack navigation)
  const [smartKeyModalVisible, setSmartKeyModalVisible] = useState(false);
  const [activeBookingForModal, setActiveBookingForModal] = useState<Booking | null>(null);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [directionsModalVisible, setDirectionsModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [bluetoothUnlocked, setBluetoothUnlocked] = useState(false);

  // SePay Modal State for Pending Bookings
  const [sepayModalVisible, setSepayModalVisible] = useState(false);
  const [pendingBookingForPay, setPendingBookingForPay] = useState<Booking | null>(null);

  // Chat state for modal
  const [messages, setMessages] = useState([
    { id: '1', sender: 'Host', text: 'Om Swastyastu! Welcome to your stay. What time do you land?', time: '10:15 AM', isHost: true },
    { id: '2', sender: 'You', text: 'Hi! We land at 12:30 PM. Would love to confirm directions.', time: '10:22 AM', isHost: false },
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const loadBookings = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    const { data } = await getUserBookings(userId);
    if (data) {
      setBookings(data);
    }
    setLoading(false);
    setRefreshing(false);
  }, [userId]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  // Tab counts dynamically from database
  const upcomingBookings = bookings.filter((b) => b.status === 'booked');
  const completedBookings = bookings.filter((b) => b.status === 'completed');
  // Chỉ những đơn đã thanh toán mới lưu và hiển thị trong tab Cancelled
  const cancelledBookings = bookings.filter(
    (b) => b.status === 'cancelled' && b.payment_status !== 'pending' && b.payment_status !== 'unpaid'
  );

  const upcomingCount = upcomingBookings.length;
  const completedCount = completedBookings.length;
  const cancelledCount = cancelledBookings.length;

  const handleSendMessage = () => {
    if (!inputMsg.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'You',
        text: inputMsg.trim(),
        time: 'Just now',
        isHost: false,
      },
    ]);
    setInputMsg('');
  };

  const handleOpenReceipt = (item: any) => {
    if (navigation?.navigate) {
      navigation.navigate('TripReceipt', { receipt: item, booking: item });
    } else {
      setSelectedReceipt(item);
      setReceiptModalVisible(true);
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    const target = bookings.find((b) => b.id === bookingId);
    const isPending = target?.payment_status === 'pending' || target?.payment_status === 'unpaid';

    Alert.alert(
      isPending ? 'Hủy giao dịch chờ thanh toán' : 'Cancel Reservation',
      isPending
        ? 'Bạn có chắc chắn muốn hủy giao dịch chưa thanh toán này không? Đơn phòng sẽ được xóa hoàn toàn và không lưu vào danh sách đã hủy.'
        : 'Are you sure you want to cancel this booking? Free 100% refund is available if cancelled at least 48 hours prior to check-in (BR05).',
      [
        { text: isPending ? 'Giữ lại' : 'Keep Booking', style: 'cancel' },
        {
          text: isPending ? 'Hủy & Xóa đơn' : 'Confirm Cancellation',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await cancelBooking(bookingId, 'Cancelled by guest');
              if (res.success) {
                Alert.alert(
                  'Đã hủy thành công',
                  isPending
                    ? 'Giao dịch chưa thanh toán đã được hủy bỏ và xóa hoàn toàn.'
                    : 'Your reservation has been successfully cancelled.'
                );
                loadBookings();
              } else {
                Alert.alert('Error', 'Could not cancel reservation. Please try again.');
              }
            } catch {
              Alert.alert('Error', 'Could not cancel reservation. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handlePayPendingBooking = (b: Booking) => {
    setActiveBookingForModal(b);
    setPendingBookingForPay(b);
    setSepayModalVisible(true);
  };

  const handleSepaySuccess = (updatedBooking: any) => {
    setSepayModalVisible(false);
    setPendingBookingForPay(null);
    loadBookings();
    Alert.alert(
      'Thanh toán thành công! 🎉',
      `Đơn đặt phòng #${updatedBooking.ref_code} đã được thanh toán thành công.`
    );
  };

  return (
    <View className="flex-1 bg-appBg">
      {/* Top Header Area */}
      <View
        style={{ paddingTop: Math.max(insets.top, 14) }}
        className="bg-white border-b border-borderLight px-5 pb-3.5 flex-row items-center justify-between shadow-sm z-10"
      >
        <View className="flex-1">
          <Text className="text-2xl font-black text-textMain tracking-tight">
            My Bookings
          </Text>
          <Text className="text-xs text-[#6C797D] mt-0.5 font-medium">
            Manage upcoming and past reservations
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh bookings"
          onPress={() => {
            setRefreshing(true);
            loadBookings();
          }}
          className="w-10 h-10 rounded-full bg-appBg items-center justify-center border border-borderLight shadow-sm"
        >
          <Ionicons name="refresh-outline" size={18} color="#4F46E5" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 bg-appBg"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
        }
      >
        {/* Segmented Tabs Bar */}
        <View className="px-5 pt-4">
          <View className="bg-[#EFEFF8] rounded-full p-1.5 flex-row items-center border border-borderLight/60">
            {/* Tab: Upcoming */}
            <Pressable
              onPress={() => setActiveTab('Upcoming')}
              className={`flex-1 flex-row items-center justify-center py-2 px-3 rounded-full gap-1.5 ${
                activeTab === 'Upcoming' ? 'bg-brand shadow-sm' : ''
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  activeTab === 'Upcoming' ? 'text-white' : 'text-[#3C494C]'
                }`}
              >
                Upcoming
              </Text>
              <View
                className={`w-4 h-4 rounded-full items-center justify-center ${
                  activeTab === 'Upcoming' ? 'bg-white/20' : 'bg-borderLight'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    activeTab === 'Upcoming' ? 'text-white' : 'text-[#6C797D]'
                  }`}
                >
                  {upcomingCount}
                </Text>
              </View>
            </Pressable>

            {/* Tab: Completed */}
            <Pressable
              onPress={() => setActiveTab('Completed')}
              className={`flex-1 flex-row items-center justify-center py-2 px-3 rounded-full gap-1.5 ${
                activeTab === 'Completed' ? 'bg-brand shadow-sm' : ''
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  activeTab === 'Completed' ? 'text-white' : 'text-[#3C494C]'
                }`}
              >
                Completed
              </Text>
              <View
                className={`w-4 h-4 rounded-full items-center justify-center ${
                  activeTab === 'Completed' ? 'bg-white/20' : 'bg-borderLight'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    activeTab === 'Completed' ? 'text-white' : 'text-[#6C797D]'
                  }`}
                >
                  {completedCount}
                </Text>
              </View>
            </Pressable>

            {/* Tab: Cancelled */}
            <Pressable
              onPress={() => setActiveTab('Cancelled')}
              className={`flex-1 flex-row items-center justify-center py-2 px-3 rounded-full gap-1.5 ${
                activeTab === 'Cancelled' ? 'bg-brand shadow-sm' : ''
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  activeTab === 'Cancelled' ? 'text-white' : 'text-[#3C494C]'
                }`}
              >
                Cancelled
              </Text>
              <View
                className={`w-4 h-4 rounded-full items-center justify-center ${
                  activeTab === 'Cancelled' ? 'bg-white/20' : 'bg-borderLight'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    activeTab === 'Cancelled' ? 'text-white' : 'text-[#6C797D]'
                  }`}
                >
                  {cancelledCount}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="text-xs text-textMuted mt-3 font-medium">Loading your bookings...</Text>
          </View>
        ) : null}

        {/* TAB 1: UPCOMING (Hero Active Reservation) */}
        {!loading && activeTab === 'Upcoming' ? (
          upcomingCount === 0 ? (
            <View className="px-5 pt-8 items-center justify-center py-12">
              <View className="w-16 h-16 rounded-full bg-brand/10 items-center justify-center mb-4">
                <Ionicons name="calendar-outline" size={32} color="#4F46E5" />
              </View>
              <Text className="text-lg font-bold text-textMain text-center">
                No upcoming reservations
              </Text>
              <Text className="text-xs text-[#6C797D] text-center mt-1.5 px-6 leading-5">
                When you book a stay, your active reservation, keyless smart key PIN, and arrival directions will appear right here.
              </Text>
              <Pressable
                onPress={() => navigation.navigate('MainTabs', { screen: 'Search' })}
                className="mt-6 bg-brand px-6 py-3 rounded-full shadow-sm"
              >
                <Text className="text-xs font-bold text-white">Explore Stays</Text>
              </Pressable>
            </View>
          ) : (
            <View className="px-5 pt-5 gap-5">
              {upcomingBookings.map((b, idx) => {
                const place = b.places;
                const heroImg =
                  place?.images?.[0] ||
                  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80';
                const placeTitle = place?.title || 'Stay';
                const placeLocation = place?.location || 'Indonesia';
                const hostName = place?.host_name || 'Host';

                return (
                  <View key={b.id} className="gap-3">
                    {/* Header above card */}
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-bold uppercase tracking-wider text-[#6C797D]">
                        {idx === 0 ? 'ACTIVE RESERVATION' : `UPCOMING STAY #${idx + 1}`}
                      </Text>
                      <View className="flex-row items-center gap-1.5">
                        {b.payment_status === 'pending' ? (
                          <Pressable
                            onPress={() => handlePayPendingBooking(b)}
                            className="bg-amber-100 px-3 py-1 rounded-full flex-row items-center gap-1.5 border border-amber-300 active:opacity-80"
                          >
                            <View className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            <Text className="text-[11px] font-bold text-amber-800">Chờ thanh toán (Bấm trả ngay)</Text>
                            <Ionicons name="chevron-forward" size={12} color="#92400E" />
                          </Pressable>
                        ) : (
                          <View className="bg-[#E2E7FF] px-2.5 py-1 rounded-full flex-row items-center gap-1">
                            <View className="w-1.5 h-1.5 rounded-full bg-brand" />
                            <Text className="text-[11px] font-bold text-brand">Confirmed</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Active Reservation Hero Card */}
                    <View className="bg-white rounded-3xl p-4 border border-borderLight shadow-sm">
                      {/* Place Hero Image */}
                      <Pressable
                        onPress={() => {
                          if (b.payment_status === 'pending') {
                            handlePayPendingBooking(b);
                          }
                        }}
                        className="h-44 rounded-2xl overflow-hidden relative justify-between p-3 bg-black/10"
                      >
                        <Image
                          source={{ uri: heroImg }}
                          className="absolute inset-0 w-full h-full"
                          resizeMode="cover"
                        />
                        <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

                        {/* Top-Left Rating Capsule */}
                        <View className="self-start bg-white/95 px-2.5 py-1 rounded-full flex-row items-center gap-1 shadow-sm">
                          <Ionicons name="star" size={13} color="#F59E0B" />
                          <Text className="text-xs font-bold text-textMain">
                            {place?.rating != null && Number(place.rating) > 0 && place.review_count && place.review_count > 0
                              ? Number(place.rating).toFixed(1)
                              : 'New'}
                          </Text>
                          {place?.review_count && place.review_count > 0 ? (
                            <Text className="text-[10px] text-[#6C797D]">
                              ({place.review_count})
                            </Text>
                          ) : null}
                        </View>

                        {/* Bottom Title & Location */}
                        <View className="gap-1">
                          <View className="self-start bg-[#283044]/70 px-2.5 py-0.5 rounded-full">
                            <Text className="text-[10px] font-bold text-[#E2E7FF] uppercase tracking-wider">
                              {place?.place_type || place?.category || 'STAY'}
                            </Text>
                          </View>
                          <Text className="text-xl font-bold text-white tracking-tight">
                            {placeTitle}
                          </Text>
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="location-sharp" size={12} color="#E2E7FF" />
                            <Text className="text-xs text-[#E2E7FF]">{placeLocation}</Text>
                          </View>
                        </View>
                      </Pressable>

                      {/* Booking Info 2-Column Grid */}
                      <View className="bg-[#F8F7FF] rounded-2xl p-3.5 mt-3 flex-row justify-between border border-borderLight/60">
                        {/* Col 1: Dates */}
                        <View className="flex-1 pr-2">
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="calendar-outline" size={13} color="#6C797D" />
                            <Text className="text-xs text-[#6C797D]">Dates</Text>
                          </View>
                          <Text className="text-sm font-bold text-textMain mt-1">
                            {b.check_in} – {b.check_out}
                          </Text>
                          <Text className="text-xs text-[#6C797D] mt-0.5">
                            {b.nights} nights · {(b.guests_adults || 1) + (b.guests_children || 0)} guests
                          </Text>
                        </View>

                        {/* Col 2: Booking Reference */}
                        <View className="flex-1 pl-2 border-l border-borderLight">
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="receipt-outline" size={13} color="#6C797D" />
                            <Text className="text-xs text-[#6C797D]">Booking Reference</Text>
                          </View>
                          <Text className="text-sm font-bold text-brand mt-1">{b.ref_code}</Text>
                          <View className="flex-row items-center gap-1 mt-0.5">
                            <Text className="text-xs font-bold text-textMain">
                              ${Number(b.total).toFixed(0)}
                            </Text>
                            {b.payment_status === 'pending' ? (
                              <Text className="text-[11px] font-bold text-amber-600">(Chờ thanh toán)</Text>
                            ) : (
                              <Text className="text-[11px] font-bold text-emerald-600">(Đã thanh toán)</Text>
                            )}
                          </View>
                          {b.promo_code ? (
                            <View className="flex-row items-center gap-1 mt-0.5">
                              <Ionicons name="pricetag" size={10} color="#FF6B00" />
                              <Text className="text-[10px] font-bold text-[#FF6B00]">
                                {b.promo_code} (-${Number(b.discount_amount || 0).toFixed(0)})
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>

                      {/* Host Row */}
                      <View className="flex-row items-center gap-3 mt-3.5 pt-3.5 border-t border-borderLight">
                        <View className="w-10 h-10 rounded-full bg-brand/10 items-center justify-center border border-borderLight">
                          <Ionicons name="person" size={20} color="#4F46E5" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs font-bold text-textMain">Hosted by {hostName}</Text>
                          <Text className="text-[11px] text-[#6C797D]">
                            Verified Host · Typically replies in 5m
                          </Text>
                        </View>
                        <View className="bg-brand/10 px-2 py-1 rounded-full">
                          <Text className="text-[10px] font-bold text-brand">Verified Stay</Text>
                        </View>
                      </View>

                      {/* Action Buttons */}
                      <View className="mt-4 gap-2.5">
                        {/* Primary Button */}
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={b.payment_status === 'pending' ? 'Thanh toán ngay' : 'View Details and Check-in'}
                          onPress={() => {
                            if (b.payment_status === 'pending') {
                              handlePayPendingBooking(b);
                              return;
                            }
                            if (navigation?.navigate) {
                              navigation.navigate('SmartKey', { booking: b });
                            } else {
                              setActiveBookingForModal(b);
                              setSmartKeyModalVisible(true);
                            }
                          }}
                          className={`${
                            b.payment_status === 'pending'
                              ? 'bg-[#FF6B00] shadow-[#FF6B00]/30'
                              : 'bg-brand shadow-brand/30'
                          } rounded-full py-3.5 items-center justify-center shadow-md flex-row gap-2 active:opacity-90`}
                        >
                          <Ionicons
                            name={b.payment_status === 'pending' ? 'qr-code-outline' : 'key-outline'}
                            size={16}
                            color="#FFF"
                          />
                          <Text className="text-sm font-bold text-white">
                            {b.payment_status === 'pending'
                              ? 'Thanh toán ngay (Quét VietQR)'
                              : 'View Details & Check-in'}
                          </Text>
                        </Pressable>

                        {/* Secondary 2-Button Row */}
                        <View className="flex-row gap-2.5">
                          <Pressable
                            onPress={() => {
                              if (navigation?.navigate) {
                                navigation.navigate('HostChat', {
                                  hostName: hostName,
                                  bookingRef: b.ref_code,
                                  propertyTitle: placeTitle,
                                  booking: b,
                                });
                              } else {
                                setChatModalVisible(true);
                              }
                            }}
                            className="flex-1 bg-white border border-borderLight rounded-full py-2.5 flex-row items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Ionicons name="chatbubble-ellipses-outline" size={16} color="#131B2E" />
                            <Text className="text-xs font-bold text-textMain">Message Host</Text>
                          </Pressable>

                          <Pressable
                            onPress={() => {
                              if (navigation?.navigate) {
                                navigation.navigate('Directions', { booking: b });
                              } else {
                                setDirectionsModalVisible(true);
                              }
                            }}
                            className="flex-1 bg-white border border-borderLight rounded-full py-2.5 flex-row items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Ionicons name="navigate-outline" size={16} color="#131B2E" />
                            <Text className="text-xs font-bold text-textMain">Directions</Text>
                          </Pressable>
                        </View>

                        {/* Quick actions row: View Receipt & Cancel */}
                        <View className="flex-row justify-between items-center pt-2 px-1">
                          <Pressable
                            onPress={() => handleOpenReceipt(b)}
                            className="flex-row items-center gap-1 py-1"
                          >
                            <Ionicons name="receipt-outline" size={14} color="#4F46E5" />
                            <Text className="text-xs font-bold text-brand">View Receipt</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => handleCancelBooking(b.id)}
                            className="flex-row items-center gap-1 py-1"
                          >
                            <Ionicons name="close-circle-outline" size={14} color="#EF4444" />
                            <Text className="text-xs font-bold text-red-500">Cancel Booking</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )
        ) : null}

        {/* TAB 2: COMPLETED TAB CONTENT */}
        {!loading && activeTab === 'Completed' ? (
          completedCount === 0 ? (
            <View className="px-5 pt-8 items-center justify-center py-12">
              <View className="w-16 h-16 rounded-full bg-brand/10 items-center justify-center mb-4">
                <Ionicons name="time-outline" size={32} color="#4F46E5" />
              </View>
              <Text className="text-lg font-bold text-textMain text-center">
                No past adventures yet
              </Text>
              <Text className="text-xs text-[#6C797D] text-center mt-1.5 px-6 leading-5">
                Completed stays and verified trip receipts will appear here after your holiday.
              </Text>
              <Pressable
                onPress={() => navigation.navigate('MainTabs', { screen: 'Search' })}
                className="mt-6 bg-brand px-6 py-3 rounded-full shadow-sm"
              >
                <Text className="text-xs font-bold text-white">Find your next stay</Text>
              </Pressable>
            </View>
          ) : (
            <View className="px-5 pt-6 gap-3.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold uppercase tracking-wider text-[#6C797D]">
                  PAST ADVENTURES ({completedCount})
                </Text>
              </View>

              {completedBookings.map((b) => {
                const place = b.places;
                const img =
                  place?.images?.[0] ||
                  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80';

                return (
                  <View
                    key={b.id}
                    className="bg-white rounded-2xl p-3 border border-borderLight shadow-sm flex-row gap-3"
                  >
                    <View className="w-24 h-24 rounded-xl overflow-hidden relative bg-black/10">
                      <Image source={{ uri: img }} className="w-full h-full" resizeMode="cover" />
                      <View className="absolute top-1.5 left-1.5 bg-black/60 px-1.5 py-0.5 rounded-md">
                        <Text className="text-[9px] font-bold text-white">Completed</Text>
                      </View>
                    </View>

                    <View className="flex-1 justify-between py-0.5">
                      <View>
                        <View className="flex-row justify-between items-start">
                          <Text className="flex-1 text-sm font-bold text-textMain" numberOfLines={1}>
                            {place?.title || 'Stay'}
                          </Text>
                          <View className="flex-row items-center gap-0.5 ml-1">
                            <Ionicons name="star" size={11} color="#F59E0B" />
                            <Text className="text-xs font-bold text-textMain">
                              {place?.rating != null && Number(place.rating) > 0 && place.review_count && place.review_count > 0
                                ? Number(place.rating).toFixed(1)
                                : 'New'}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-xs text-[#6C797D] mt-0.5">{place?.location || 'Indonesia'}</Text>
                        <Text className="text-xs text-[#3C494C] font-medium mt-1">
                          {b.check_in} – {b.check_out} · {b.nights} nights
                        </Text>
                        {b.promo_code ? (
                          <View className="flex-row items-center gap-1 mt-0.5">
                            <Ionicons name="pricetag" size={10} color="#FF6B00" />
                            <Text className="text-[10px] font-bold text-[#FF6B00]">
                              {b.promo_code} (-${Number(b.discount_amount || 0).toFixed(0)})
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <View className="flex-row items-center justify-between pt-2 border-t border-borderLight/60">
                        <Pressable
                          onPress={() => handleOpenReceipt(b)}
                          className="flex-row items-center gap-1"
                        >
                          <Ionicons name="receipt-outline" size={12} color="#131B2E" />
                          <Text className="text-xs font-bold text-textMain">View receipt</Text>
                        </Pressable>

                        <Pressable
                          onPress={() => {
                            if (place) {
                              navigation.navigate('Detail', { place });
                            } else {
                              navigation.navigate('Search');
                            }
                          }}
                          className="flex-row items-center gap-1"
                        >
                          <Ionicons name="refresh-outline" size={12} color="#4F46E5" />
                          <Text className="text-xs font-bold text-brand">Rebook stay</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )
        ) : null}

        {/* TAB 3: CANCELLED TAB CONTENT */}
        {!loading && activeTab === 'Cancelled' ? (
          cancelledCount > 0 ? (
            <View className="px-5 pt-6 gap-3.5">
              <Text className="text-xs font-bold uppercase tracking-wider text-[#6C797D]">
                CANCELLED RESERVATIONS ({cancelledCount})
              </Text>
              {cancelledBookings.map((b) => (
                <View key={b.id} className="bg-white rounded-2xl p-4 border border-borderLight shadow-sm">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 pr-2">
                      <Text className="text-sm font-bold text-textMain">{b.places?.title || 'Stay'}</Text>
                      <Text className="text-xs text-[#6C797D] mt-0.5">{b.places?.location || 'Indonesia'}</Text>
                    </View>
                    <View className="bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                      <Text className="text-[10px] font-bold text-red-600">Cancelled</Text>
                    </View>
                  </View>
                  {b.cancel_reason ? (
                    <View className="mt-2.5 px-3 py-1.5 rounded-xl bg-red-50/70 border border-red-100 flex-row items-center">
                      <Ionicons name="information-circle-outline" size={14} color="#DC2626" />
                      <Text className="ml-1.5 text-xs text-red-700 flex-1" numberOfLines={2}>
                        Lý do: {b.cancel_reason}
                      </Text>
                    </View>
                  ) : null}
                  <View className="mt-3 pt-3 border-t border-borderLight flex-row justify-between items-center">
                    <Text className="text-xs text-textMuted">
                      {b.check_in} – {b.check_out} · ${Number(b.total).toFixed(0)}
                    </Text>
                    <Pressable onPress={() => handleOpenReceipt(b)}>
                      <Text className="text-xs font-bold text-brand">View details</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="px-5 pt-8 items-center justify-center py-12">
              <View className="w-16 h-16 rounded-full bg-brand/10 items-center justify-center mb-4">
                <Ionicons name="checkmark-circle-outline" size={32} color="#4F46E5" />
              </View>
              <Text className="text-lg font-bold text-textMain text-center">
                No cancelled reservations
              </Text>
              <Text className="text-xs text-[#6C797D] text-center mt-1.5 px-6 leading-5">
                You have no cancelled bookings. Free cancellation is always available up to 48 hours prior to check-in per BR05.
              </Text>
              <Pressable
                onPress={() => navigation.navigate('MainTabs', { screen: 'Search' })}
                className="mt-6 bg-brand px-6 py-3 rounded-full shadow-sm"
              >
                <Text className="text-xs font-bold text-white">Explore more stays</Text>
              </Pressable>
            </View>
          )
        ) : null}

        {/* Need Assistance? Support Card */}
        <View className="px-5 pt-6">
          <View className="bg-gradient-to-r from-[#EAEDFF] to-[#E2E7FF] bg-[#F2F3FF] rounded-2xl p-4 flex-row items-center justify-between border border-borderLight shadow-sm">
            <View className="flex-row items-center gap-3 flex-1 pr-2">
              <View className="w-10 h-10 rounded-full bg-brand/10 items-center justify-center">
                <Ionicons name="headset-outline" size={20} color="#4F46E5" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-textMain">Need assistance?</Text>
                <Text className="text-xs text-[#6C797D] mt-0.5">
                  24/7 dedicated traveler support
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => setHelpModalVisible(true)}
              className="bg-white px-3.5 py-1.5 rounded-full shadow-sm border border-borderLight"
            >
              <Text className="text-xs font-bold text-brand">Help Hub</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* MODAL 1: Smart Key & Check-in (UC013) */}
      <Modal
        visible={smartKeyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSmartKeyModalVisible(false)}
      >
        <View className="flex-1 bg-appBg">
          <View className="px-5 pt-6 pb-4 border-b border-borderLight bg-white flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-bold text-textMain">Check-in & Smart Key</Text>
              <Text className="text-xs text-textMuted mt-0.5">
                {activeBookingForModal?.places?.title || 'Stay'} ({activeBookingForModal?.ref_code || ''})
              </Text>
            </View>
            <Pressable
              onPress={() => setSmartKeyModalVisible(false)}
              className="w-9 h-9 rounded-full bg-appBg items-center justify-center border border-borderLight"
            >
              <Ionicons name="close" size={20} color="#131B2E" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-5 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
            {/* PIN Card */}
            <View className="bg-white rounded-3xl p-5 border border-borderLight shadow-sm items-center mb-4">
              <Text className="text-xs font-bold uppercase tracking-wider text-textMuted">
                DOOR ACCESS PIN
              </Text>
              <View className="my-4 px-6 py-3 rounded-2xl bg-[#F2F3FF] border border-brand/20">
                <Text className="text-3xl font-black text-brand tracking-widest">
                  {activeBookingForModal?.pin_code || activeBookingForModal?.places?.smart_lock_pin || '4821#'}
                </Text>
              </View>
              <Text className="text-xs text-[#6C797D] text-center">
                Valid from 14:00 on {activeBookingForModal?.check_in || 'check-in day'} until 12:00 on {activeBookingForModal?.check_out || 'check-out day'}
              </Text>

              {/* Bluetooth One-Tap Unlock */}
              <Pressable
                onPress={() => {
                  setBluetoothUnlocked(true);
                  setTimeout(() => setBluetoothUnlocked(false), 3000);
                }}
                className={`w-full mt-4 py-3 rounded-full flex-row items-center justify-center gap-2 ${
                  bluetoothUnlocked ? 'bg-emerald-500' : 'bg-brand'
                }`}
              >
                <Ionicons
                  name={bluetoothUnlocked ? 'lock-open' : 'bluetooth'}
                  size={18}
                  color="#FFF"
                />
                <Text className="text-xs font-bold text-white">
                  {bluetoothUnlocked ? 'Door Unlocked via Bluetooth!' : 'Tap to Unlock Door (Bluetooth)'}
                </Text>
              </Pressable>
            </View>

            {/* Wi-Fi info */}
            <View className="bg-white rounded-2xl p-4 border border-borderLight shadow-sm mb-4 gap-3">
              <Text className="text-sm font-bold text-textMain">Wi-Fi & Connectivity</Text>
              <View className="flex-row justify-between items-center py-1 border-b border-borderLight/60">
                <Text className="text-xs text-textMuted">Network (SSID)</Text>
                <Text className="text-xs font-bold text-textMain">
                  {activeBookingForModal?.places?.wifi_ssid || 'WanderStay_Guest_5G'}
                </Text>
              </View>
              <View className="flex-row justify-between items-center py-1">
                <Text className="text-xs text-textMuted">Password</Text>
                <Text className="text-xs font-bold text-brand">
                  {activeBookingForModal?.places?.wifi_password || 'jungleparadise'}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL 2: Message Host Chat (UC015) */}
      <Modal
        visible={chatModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setChatModalVisible(false)}
      >
        <View className="flex-1 bg-appBg">
          <View className="px-5 pt-6 pb-4 border-b border-borderLight bg-white flex-row items-center justify-between">
            <View>
              <Text className="text-base font-bold text-textMain">Host Message</Text>
              <Text className="text-xs text-brand font-medium">Direct Chat</Text>
            </View>
            <Pressable
              onPress={() => setChatModalVisible(false)}
              className="w-9 h-9 rounded-full bg-appBg items-center justify-center border border-borderLight"
            >
              <Ionicons name="close" size={20} color="#131B2E" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-5 py-4" contentContainerStyle={{ paddingBottom: 20 }}>
            {messages.map((m) => (
              <View
                key={m.id}
                className={`mb-3.5 max-w-[80%] ${
                  m.isHost ? 'self-start' : 'self-end'
                }`}
              >
                <View
                  className={`rounded-2xl p-3.5 ${
                    m.isHost
                      ? 'bg-white border border-borderLight'
                      : 'bg-brand'
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      m.isHost ? 'text-textMain' : 'text-white'
                    } leading-5`}
                  >
                    {m.text}
                  </Text>
                </View>
                <Text className="text-[10px] text-[#6C797D] mt-1 px-1">
                  {m.time}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Chat Input Bar */}
          <View className="px-4 py-3 bg-white border-t border-borderLight flex-row items-center gap-2">
            <TextInput
              placeholder="Message host..."
              value={inputMsg}
              onChangeText={setInputMsg}
              className="flex-1 bg-appBg border border-borderLight rounded-full px-4 py-2.5 text-xs text-textMain"
            />
            <Pressable
              onPress={handleSendMessage}
              className="w-10 h-10 rounded-full bg-brand items-center justify-center shadow-sm"
            >
              <Ionicons name="send" size={16} color="#FFF" />
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* MODAL 5: Help Hub & Virtual Travel Assistant (UC016) */}
      <Modal
        visible={helpModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <View className="flex-1 bg-appBg">
          <View className="px-5 pt-6 pb-4 border-b border-borderLight bg-white flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-bold text-textMain">WanderStay Help Hub</Text>
              <Text className="text-xs text-textMuted mt-0.5">24/7 dedicated traveler assistant</Text>
            </View>
            <Pressable
              onPress={() => setHelpModalVisible(false)}
              className="w-9 h-9 rounded-full bg-appBg items-center justify-center border border-borderLight"
            >
              <Ionicons name="close" size={20} color="#131B2E" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-5 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
            <View className="bg-white rounded-2xl p-4 border border-borderLight shadow-sm mb-4 gap-3">
              <Text className="text-sm font-bold text-textMain">Frequently Asked Questions</Text>
              <View className="py-2 border-b border-borderLight/60">
                <Text className="text-xs font-bold text-textMain">How does Keyless Check-in work?</Text>
                <Text className="text-xs text-[#6C797D] mt-1 leading-5">
                  Your 4-digit PIN is automatically generated and activates at exactly 14:00 on check-in day.
                </Text>
              </View>
              <View className="py-2 border-b border-borderLight/60">
                <Text className="text-xs font-bold text-textMain">What is the cancellation policy?</Text>
                <Text className="text-xs text-[#6C797D] mt-1 leading-5">
                  100% full refund if cancelled 48+ hours before check-in. Within 48 hours, a 1-night penalty applies.
                </Text>
              </View>
              <View className="py-2">
                <Text className="text-xs font-bold text-textMain">How do I request early check-in?</Text>
                <Text className="text-xs text-[#6C797D] mt-1 leading-5">
                  Message your host directly using the Message Host button on your reservation card.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                setHelpModalVisible(false);
                if (navigation?.navigate) {
                  navigation.navigate('TravelAssistant');
                } else {
                  Alert.alert('AI Assistant', 'WanderStay 24/7 Travel Assistant connected.');
                }
              }}
              className="bg-brand py-3.5 rounded-full items-center justify-center flex-row gap-2"
            >
              <Ionicons name="chatbubbles-outline" size={16} color="#FFF" />
              <Text className="text-xs font-bold text-white">Chat with Travel Assistant</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      {/* SePay VietQR Modal for pending bookings */}
      {pendingBookingForPay && (
        <SepayQrModal
          visible={sepayModalVisible}
          onClose={() => {
            setSepayModalVisible(false);
            setPendingBookingForPay(null);
          }}
          booking={pendingBookingForPay}
          dueAmountUsd={Number(pendingBookingForPay.deposit_amount || pendingBookingForPay.total)}
          dueAmountVnd={convertUsdToVnd(Number(pendingBookingForPay.deposit_amount || pendingBookingForPay.total))}
          onPaymentSuccess={handleSepaySuccess}
        />
      )}
    </View>
  );
}
