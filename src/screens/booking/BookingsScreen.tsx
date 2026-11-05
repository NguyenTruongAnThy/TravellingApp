import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getUserBookings, cancelBooking } from '../../services/bookingsService';
import type { Booking } from '../../types';

// Default mockup images from Builder.io Figma design
const BALIAN_HERO_IMG =
  'https://api.builder.io/api/v1/image/assets/TEMP/1a229af71b08865e2cefbedb30f9d138bb7a1052?width=716';
const OMAHA_IMG =
  'https://api.builder.io/api/v1/image/assets/TEMP/e01c6549e299c37035bca8f87c3677f7a18f0d0f?width=192';
const TUSCANY_IMG =
  'https://api.builder.io/api/v1/image/assets/TEMP/1c7041309bb3d879492122b6bb5a37fd94797a86?width=192';
const WAYAN_HOST_IMG =
  'https://api.builder.io/api/v1/image/assets/TEMP/f5e6fa912c1e1d9984ecf4bed13e50ac0683887c?width=72';

type TabType = 'Upcoming' | 'Completed' | 'Cancelled';

export default function BookingsScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [activeTab, setActiveTab] = useState<TabType>('Upcoming');
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Interactive Modals
  const [smartKeyModalVisible, setSmartKeyModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [directionsModalVisible, setDirectionsModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [bluetoothUnlocked, setBluetoothUnlocked] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([
    { id: '1', sender: 'Wayan Sutama', text: 'Om Swastyastu! Welcome to Balian Treehouse. What time do you land in Denpasar?', time: '10:15 AM', isHost: true },
    { id: '2', sender: 'You', text: 'Hi Wayan! We land at 12:30 PM. Would love to book the airport pickup ($35).', time: '10:22 AM', isHost: false },
    { id: '3', sender: 'Wayan Sutama', text: 'Perfect! Driver Ketut will wait for you at Arrival Gate with your name sign. See you soon!', time: '10:28 AM', isHost: true },
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const loadBookings = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await getUserBookings(userId);
    if (data && data.length > 0) {
      setBookings(data);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Tab counts
  const upcomingCount =
    bookings.filter((b) => b.status === 'booked').length > 0
      ? bookings.filter((b) => b.status === 'booked').length
      : 1; // Default 1 upcoming from Figma design
  const completedCount =
    bookings.filter((b) => b.status === 'completed').length > 0
      ? bookings.filter((b) => b.status === 'completed').length
      : 3; // Default 3 completed from Figma design
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;

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
    setSelectedReceipt(item);
    setReceiptModalVisible(true);
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
          accessibilityLabel="Filter bookings"
          onPress={() => Alert.alert('Filter', 'Filter reservations by year or destination.')}
          className="w-10 h-10 rounded-full bg-appBg items-center justify-center border border-borderLight shadow-sm"
        >
          <Ionicons name="options-outline" size={18} color="#4F46E5" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 bg-appBg"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
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

        {/* TAB 1: UPCOMING (Hero Active Reservation) */}
        {activeTab === 'Upcoming' ? (
          <View className="px-5 pt-5 gap-4">
            {/* Header above card */}
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold uppercase tracking-wider text-[#6C797D]">
                ACTIVE RESERVATION
              </Text>
              <View className="flex-row items-center gap-1.5">
                <View className="bg-[#E2E7FF] px-2.5 py-1 rounded-full flex-row items-center gap-1">
                  <View className="w-1.5 h-1.5 rounded-full bg-brand" />
                  <Text className="text-[11px] font-bold text-brand">Confirmed</Text>
                </View>
                <View className="bg-[#E2E7FF] px-2.5 py-1 rounded-full">
                  <Text className="text-[11px] font-bold text-brand">In 5 days</Text>
                </View>
              </View>
            </View>

            {/* Active Reservation Hero Card */}
            <View className="bg-white rounded-3xl p-4 border border-borderLight shadow-sm">
              {/* Place Hero Image */}
              <View className="h-44 rounded-2xl overflow-hidden relative justify-between p-3 bg-black/10">
                <Image
                  source={{ uri: BALIAN_HERO_IMG }}
                  className="absolute inset-0 w-full h-full"
                  resizeMode="cover"
                />
                {/* Gradient Contrast */}
                <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

                {/* Top-Left Rating Capsule */}
                <View className="self-start bg-white/95 px-2.5 py-1 rounded-full flex-row items-center gap-1 shadow-sm">
                  <Ionicons name="star" size={13} color="#F59E0B" />
                  <Text className="text-xs font-bold text-textMain">4.96</Text>
                  <Text className="text-[10px] text-[#6C797D]">(128)</Text>
                </View>

                {/* Bottom Title & Location */}
                <View className="gap-1">
                  <View className="self-start bg-[#283044]/70 px-2.5 py-0.5 rounded-full">
                    <Text className="text-[10px] font-bold text-[#E2E7FF] uppercase tracking-wider">
                      SECLUDED HAVEN
                    </Text>
                  </View>
                  <Text className="text-xl font-bold text-white tracking-tight">
                    Balian Treehouse
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="location-sharp" size={12} color="#E2E7FF" />
                    <Text className="text-xs text-[#E2E7FF]">Bali, Indonesia</Text>
                  </View>
                </View>
              </View>

              {/* Booking Info 2-Column Grid */}
              <View className="bg-[#F8F7FF] rounded-2xl p-3.5 mt-3 flex-row justify-between border border-borderLight/60">
                {/* Col 1: Dates */}
                <View className="flex-1 pr-2">
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="calendar-outline" size={13} color="#6C797D" />
                    <Text className="text-xs text-[#6C797D]">Dates</Text>
                  </View>
                  <Text className="text-sm font-bold text-textMain mt-1">
                    May 24 – 29, 2024
                  </Text>
                  <Text className="text-xs text-[#6C797D] mt-0.5">5 nights · 2 guests</Text>
                </View>

                {/* Col 2: Booking Reference */}
                <View className="flex-1 pl-2 border-l border-borderLight">
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="receipt-outline" size={13} color="#6C797D" />
                    <Text className="text-xs text-[#6C797D]">Booking Reference</Text>
                  </View>
                  <Text className="text-sm font-bold text-brand mt-1">#WS-84920</Text>
                  <Text className="text-xs font-bold text-textMain mt-0.5">
                    $450 <Text className="text-brand font-bold">(Paid)</Text>
                  </Text>
                </View>
              </View>

              {/* Host Row */}
              <View className="flex-row items-center gap-3 mt-3.5 pt-3.5 border-t border-borderLight">
                <Image
                  source={{ uri: WAYAN_HOST_IMG }}
                  className="w-10 h-10 rounded-full border border-borderLight bg-brand/10"
                />
                <View className="flex-1">
                  <Text className="text-xs font-bold text-textMain">Hosted by Wayan</Text>
                  <Text className="text-[11px] text-[#6C797D]">
                    Superhost · Typically replies in 5m
                  </Text>
                </View>
                <View className="bg-brand/10 px-2 py-1 rounded-full">
                  <Text className="text-[10px] font-bold text-brand">Verified Host</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="mt-4 gap-2.5">
                {/* Primary Button: View Details & Check-in */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="View Details and Check-in"
                  onPress={() => setSmartKeyModalVisible(true)}
                  className="bg-brand rounded-full py-3.5 items-center justify-center shadow-md shadow-brand/30 flex-row gap-2"
                >
                  <Ionicons name="key-outline" size={16} color="#FFF" />
                  <Text className="text-sm font-bold text-white">
                    View Details & Check-in
                  </Text>
                </Pressable>

                {/* Secondary 2-Button Row */}
                <View className="flex-row gap-2.5">
                  <Pressable
                    onPress={() => setChatModalVisible(true)}
                    className="flex-1 bg-white border border-borderLight rounded-full py-2.5 flex-row items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color="#131B2E" />
                    <Text className="text-xs font-bold text-textMain">Message Host</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setDirectionsModalVisible(true)}
                    className="flex-1 bg-white border border-borderLight rounded-full py-2.5 flex-row items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Ionicons name="navigate-outline" size={16} color="#131B2E" />
                    <Text className="text-xs font-bold text-textMain">Directions</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* TAB 2 or BELOW UPCOMING: PAST ADVENTURES */}
        {activeTab === 'Upcoming' || activeTab === 'Completed' ? (
          <View className="px-5 pt-6 gap-3.5">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold uppercase tracking-wider text-[#6C797D]">
                PAST ADVENTURES
              </Text>
              <Pressable onPress={() => setActiveTab('Completed')}>
                <Text className="text-xs font-bold text-brand">View All (3)</Text>
              </Pressable>
            </View>

            {/* Past Stay Item 1 */}
            <View className="bg-white rounded-2xl p-3 border border-borderLight shadow-sm flex-row gap-3">
              <View className="w-24 h-24 rounded-xl overflow-hidden relative bg-black/10">
                <Image source={{ uri: OMAHA_IMG }} className="w-full h-full" resizeMode="cover" />
                <View className="absolute top-1.5 left-1.5 bg-black/60 px-1.5 py-0.5 rounded-md">
                  <Text className="text-[9px] font-bold text-white">Completed</Text>
                </View>
              </View>

              <View className="flex-1 justify-between py-0.5">
                <View>
                  <View className="flex-row justify-between items-start">
                    <Text className="flex-1 text-sm font-bold text-textMain" numberOfLines={1}>
                      Modern Scandinavian Loft
                    </Text>
                    <View className="flex-row items-center gap-0.5 ml-1">
                      <Ionicons name="star" size={11} color="#F59E0B" />
                      <Text className="text-xs font-bold text-textMain">5.0</Text>
                    </View>
                  </View>
                  <Text className="text-xs text-[#6C797D] mt-0.5">Omaha, Nebraska</Text>
                  <Text className="text-xs text-[#3C494C] font-medium mt-1">
                    Mar 12 – 16, 2024 · 4 nights
                  </Text>
                </View>

                <View className="flex-row items-center justify-between pt-2 border-t border-borderLight/60">
                  <Pressable
                    onPress={() =>
                      handleOpenReceipt({
                        ref: '#WS-71932',
                        place: 'Modern Scandinavian Loft',
                        location: 'Omaha, Nebraska',
                        dates: 'Mar 12 – 16, 2024',
                        nights: 4,
                        rate: 120,
                        total: 480,
                      })
                    }
                    className="flex-row items-center gap-1"
                  >
                    <Ionicons name="receipt-outline" size={12} color="#131B2E" />
                    <Text className="text-xs font-bold text-textMain">View receipt</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => navigation.navigate('Search')}
                    className="flex-row items-center gap-1"
                  >
                    <Ionicons name="refresh-outline" size={12} color="#4F46E5" />
                    <Text className="text-xs font-bold text-brand">Rebook stay</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Past Stay Item 2 */}
            <View className="bg-white rounded-2xl p-3 border border-borderLight shadow-sm flex-row gap-3">
              <View className="w-24 h-24 rounded-xl overflow-hidden relative bg-black/10">
                <Image source={{ uri: TUSCANY_IMG }} className="w-full h-full" resizeMode="cover" />
                <View className="absolute top-1.5 left-1.5 bg-black/60 px-1.5 py-0.5 rounded-md">
                  <Text className="text-[9px] font-bold text-white">Completed</Text>
                </View>
              </View>

              <View className="flex-1 justify-between py-0.5">
                <View>
                  <View className="flex-row justify-between items-start">
                    <Text className="flex-1 text-sm font-bold text-textMain" numberOfLines={1}>
                      Villa di Montepulciano
                    </Text>
                    <View className="flex-row items-center gap-0.5 ml-1">
                      <Ionicons name="star" size={11} color="#F59E0B" />
                      <Text className="text-xs font-bold text-textMain">4.9</Text>
                    </View>
                  </View>
                  <Text className="text-xs text-[#6C797D] mt-0.5">Tuscany, Italy</Text>
                  <Text className="text-xs text-[#3C494C] font-medium mt-1">
                    Jan 04 – 11, 2024 · 7 nights
                  </Text>
                </View>

                <View className="flex-row items-center justify-between pt-2 border-t border-borderLight/60">
                  <Pressable
                    onPress={() =>
                      handleOpenReceipt({
                        ref: '#WS-62180',
                        place: 'Villa di Montepulciano',
                        location: 'Tuscany, Italy',
                        dates: 'Jan 04 – 11, 2024',
                        nights: 7,
                        rate: 180,
                        total: 1260,
                      })
                    }
                    className="flex-row items-center gap-1"
                  >
                    <Ionicons name="receipt-outline" size={12} color="#131B2E" />
                    <Text className="text-xs font-bold text-textMain">View receipt</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => navigation.navigate('Search')}
                    className="flex-row items-center gap-1"
                  >
                    <Ionicons name="refresh-outline" size={12} color="#4F46E5" />
                    <Text className="text-xs font-bold text-brand">Rebook stay</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* TAB 3: CANCELLED TAB CONTENT */}
        {activeTab === 'Cancelled' ? (
          <View className="px-5 pt-6 items-center justify-center py-12">
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
              onPress={() => navigation.navigate('Search')}
              className="mt-6 bg-brand px-6 py-3 rounded-full shadow-sm"
            >
              <Text className="text-xs font-bold text-white">Explore more stays</Text>
            </Pressable>
          </View>
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
              <Text className="text-xs text-textMuted mt-0.5">Balian Treehouse (#WS-84920)</Text>
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
                  4 8 2 1 #
                </Text>
              </View>
              <Text className="text-xs text-[#6C797D] text-center">
                Valid from 14:00 on May 24 until 12:00 on May 29, 2024
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

            {/* Wi-Fi & QR info */}
            <View className="bg-white rounded-2xl p-4 border border-borderLight shadow-sm mb-4 gap-3">
              <Text className="text-sm font-bold text-textMain">Wi-Fi & Connectivity</Text>
              <View className="flex-row justify-between items-center py-1 border-b border-borderLight/60">
                <Text className="text-xs text-textMuted">Network (SSID)</Text>
                <Text className="text-xs font-bold text-textMain">BalianTreehouse_5G</Text>
              </View>
              <View className="flex-row justify-between items-center py-1">
                <Text className="text-xs text-textMuted">Password</Text>
                <Text className="text-xs font-bold text-brand">jungleparadise</Text>
              </View>
            </View>

            {/* 3 Step Check-in Instructions */}
            <View className="bg-white rounded-2xl p-4 border border-borderLight shadow-sm">
              <Text className="text-sm font-bold text-textMain mb-3">Self Check-in Steps</Text>
              <View className="gap-3">
                <View className="flex-row items-start gap-2.5">
                  <View className="w-6 h-6 rounded-full bg-brand/10 items-center justify-center mt-0.5">
                    <Text className="text-xs font-bold text-brand">1</Text>
                  </View>
                  <Text className="flex-1 text-xs text-textMain leading-5">
                    Arrive at Balian Beach and enter via the marked bamboo sanctuary gate.
                  </Text>
                </View>
                <View className="flex-row items-start gap-2.5">
                  <View className="w-6 h-6 rounded-full bg-brand/10 items-center justify-center mt-0.5">
                    <Text className="text-xs font-bold text-brand">2</Text>
                  </View>
                  <Text className="flex-1 text-xs text-textMain leading-5">
                    Press <Text className="font-bold">4821#</Text> on the digital keypad or tap the Bluetooth unlock button above.
                  </Text>
                </View>
                <View className="flex-row items-start gap-2.5">
                  <View className="w-6 h-6 rounded-full bg-brand/10 items-center justify-center mt-0.5">
                    <Text className="text-xs font-bold text-brand">3</Text>
                  </View>
                  <Text className="flex-1 text-xs text-textMain leading-5">
                    Enjoy your stay! Host Wayan is available anytime via in-app chat.
                  </Text>
                </View>
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
            <View className="flex-row items-center gap-3">
              <Image source={{ uri: WAYAN_HOST_IMG }} className="w-10 h-10 rounded-full border border-borderLight" />
              <View>
                <Text className="text-base font-bold text-textMain">Wayan Sutama</Text>
                <Text className="text-xs text-brand font-medium">Balian Treehouse · #WS-84920</Text>
              </View>
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
              placeholder="Message Wayan..."
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

      {/* MODAL 3: Directions & Arrival (UC014) */}
      <Modal
        visible={directionsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDirectionsModalVisible(false)}
      >
        <View className="flex-1 bg-appBg">
          <View className="px-5 pt-6 pb-4 border-b border-borderLight bg-white flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-bold text-textMain">Directions & Arrival</Text>
              <Text className="text-xs text-textMuted mt-0.5">Balian Beach, Selemadeg Barat, Bali</Text>
            </View>
            <Pressable
              onPress={() => setDirectionsModalVisible(false)}
              className="w-9 h-9 rounded-full bg-appBg items-center justify-center border border-borderLight"
            >
              <Ionicons name="close" size={20} color="#131B2E" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-5 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
            {/* 3 Arrival Milestones */}
            <Text className="text-sm font-bold text-textMain mb-3">3 Arrival Milestones</Text>
            <View className="bg-white rounded-2xl p-4 border border-borderLight shadow-sm mb-4 gap-4">
              <View className="flex-row items-start gap-3">
                <View className="w-8 h-8 rounded-full bg-brand/10 items-center justify-center mt-0.5">
                  <Ionicons name="trail-sign-outline" size={16} color="#4F46E5" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-textMain">Milestone 1: Balian River Suspension Bridge</Text>
                  <Text className="text-xs text-[#6C797D] mt-0.5 leading-5">
                    Turn west off Denpasar-Gilimanuk road after Balian market. Cross the bridge.
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start gap-3">
                <View className="w-8 h-8 rounded-full bg-brand/10 items-center justify-center mt-0.5">
                  <Ionicons name="leaf-outline" size={16} color="#4F46E5" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-textMain">Milestone 2: Coconut Grove Stone Pathway</Text>
                  <Text className="text-xs text-[#6C797D] mt-0.5 leading-5">
                    Follow the lantern-lit cobblestone path 200m towards the ocean vista.
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start gap-3">
                <View className="w-8 h-8 rounded-full bg-brand/10 items-center justify-center mt-0.5">
                  <Ionicons name="key-outline" size={16} color="#4F46E5" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-textMain">Milestone 3: Bamboo Sanctuary Entrance</Text>
                  <Text className="text-xs text-[#6C797D] mt-0.5 leading-5">
                    Look for the WanderStay wooden sign and digital keypad (PIN 4821#).
                  </Text>
                </View>
              </View>
            </View>

            {/* Transport Options */}
            <Text className="text-sm font-bold text-textMain mb-3">Transport Options</Text>
            <View className="bg-white rounded-2xl p-4 border border-borderLight shadow-sm gap-3">
              <View className="flex-row justify-between items-center py-1 border-b border-borderLight/60">
                <Text className="text-xs font-semibold text-textMain">Airport Private Shuttle</Text>
                <Text className="text-xs font-bold text-brand">$35 (Coordinated with Wayan)</Text>
              </View>
              <View className="flex-row justify-between items-center py-1 border-b border-borderLight/60">
                <Text className="text-xs font-semibold text-textMain">Grab / Gojek Car</Text>
                <Text className="text-xs text-[#6C797D]">Set pin to "Balian Surf Break"</Text>
              </View>
              <View className="flex-row justify-between items-center py-1">
                <Text className="text-xs font-semibold text-textMain">Free On-Premises Parking</Text>
                <Text className="text-xs font-bold text-emerald-600">Included free for guests</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL 4: Trip Receipt (UC011) */}
      <Modal
        visible={receiptModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setReceiptModalVisible(false)}
      >
        <View className="flex-1 bg-appBg">
          <View className="px-5 pt-6 pb-4 border-b border-borderLight bg-white flex-row items-center justify-between">
            <Text className="text-xl font-bold text-textMain">Trip Receipt</Text>
            <Pressable
              onPress={() => setReceiptModalVisible(false)}
              className="w-9 h-9 rounded-full bg-appBg items-center justify-center border border-borderLight"
            >
              <Ionicons name="close" size={20} color="#131B2E" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-5 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
            {selectedReceipt ? (
              <View className="bg-white rounded-3xl p-5 border border-borderLight shadow-sm">
                <View className="flex-row justify-between items-center pb-4 border-b border-borderLight">
                  <View>
                    <Text className="text-xs text-[#6C797D]">Booking Reference</Text>
                    <Text className="text-base font-bold text-brand">{selectedReceipt.ref}</Text>
                  </View>
                  <View className="bg-emerald-100 px-3 py-1 rounded-full">
                    <Text className="text-xs font-bold text-emerald-700">PAID IN FULL</Text>
                  </View>
                </View>

                <View className="py-4 border-b border-borderLight gap-1">
                  <Text className="text-base font-bold text-textMain">{selectedReceipt.place}</Text>
                  <Text className="text-xs text-[#6C797D]">{selectedReceipt.location}</Text>
                  <Text className="text-xs text-[#3C494C] font-semibold mt-1">
                    {selectedReceipt.dates} · {selectedReceipt.nights} nights
                  </Text>
                </View>

                {/* Itemized Price Breakdown */}
                <View className="py-4 border-b border-borderLight gap-2.5">
                  <Text className="text-xs font-bold uppercase tracking-wider text-[#6C797D]">
                    PRICE BREAKDOWN
                  </Text>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs text-textMain">
                      Accommodation (${selectedReceipt.rate} x {selectedReceipt.nights} nights)
                    </Text>
                    <Text className="text-xs font-bold text-textMain">
                      ${selectedReceipt.rate * selectedReceipt.nights}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs text-textMain">Kayak Rental fee</Text>
                    <Text className="text-xs font-bold text-textMain">$5.00</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs text-textMain">Street Parking fee</Text>
                    <Text className="text-xs font-bold text-textMain">$5.00</Text>
                  </View>
                  <View className="flex-row justify-between items-center pt-2 border-t border-borderLight">
                    <Text className="text-sm font-bold text-textMain">Total Paid</Text>
                    <Text className="text-base font-black text-brand">
                      ${selectedReceipt.total}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => Alert.alert('Receipt Download', 'Official PDF receipt saved to your device.')}
                  className="mt-5 bg-brand py-3.5 rounded-full items-center justify-center flex-row gap-2 shadow-sm"
                >
                  <Ionicons name="download-outline" size={16} color="#FFF" />
                  <Text className="text-xs font-bold text-white">Download PDF Receipt</Text>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
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
              onPress={() => Alert.alert('AI Assistant', 'WanderStay 24/7 Travel Assistant connected.')}
              className="bg-brand py-3.5 rounded-full items-center justify-center flex-row gap-2"
            >
              <Ionicons name="chatbubbles-outline" size={16} color="#FFF" />
              <Text className="text-xs font-bold text-white">Chat with Travel Assistant</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
