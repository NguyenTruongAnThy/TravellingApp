import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { useAuth } from '../../context/AuthContext';
import { calculatePricing } from '../../services/pricing';
import { createBooking } from '../../services/bookingsService';
import {
  buildVnpayPaymentUrl,
  verifyVnpayReturnUrl,
  USD_TO_VND_RATE,
} from '../../services/vnpayService';
import StayDatePickerModal from '../../components/StayDatePickerModal';
import type { Place } from '../../types';

export default function ConfirmAndPayScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const place: Place = route.params?.place;

  // Defaults: 1 night starting tomorrow per BR02 (unless provided in route params)
  const [checkIn, setCheckIn] = useState<string>(() => {
    if (route.params?.checkIn) return route.params.checkIn;
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [checkOut, setCheckOut] = useState<string>(() => {
    if (route.params?.checkOut) return route.params.checkOut;
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });

  const [adults, setAdults] = useState<number>(1);
  const [children, setChildren] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'pay_in_full' | 'pay_a_part_now'>('pay_in_full');
  const [selectedCard, setSelectedCard] = useState<'vnpay' | 'visa' | 'wallet' | 'apple_pay'>('vnpay');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // VNPAY Modal & URL states
  const [vnpayUrl, setVnpayUrl] = useState<string | null>(null);
  const [showVnpayModal, setShowVnpayModal] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const isProcessingVnpayRef = useRef<boolean>(false);

  // Friendly date formatting helper
  const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const dw = weekdays[dt.getDay()];
      return `${dw}, ${parts[2]}/${parts[1]}`;
    } catch {
      return dateStr;
    }
  };

  // Nights calculation
  const nights = useMemo(() => {
    try {
      const inD = new Date(checkIn);
      const outD = new Date(checkOut);
      const diffTime = outD.getTime() - inD.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(1, diffDays);
    } catch {
      return 1;
    }
  }, [checkIn, checkOut]);

  // Pricing calculation per BR01 & BR06
  const pricePerNight = place?.price_per_night || 20;
  const kayakFee = place?.kayak_fee != null ? Number(place.kayak_fee) : 5;
  const parkingFee = place?.parking_fee != null ? Number(place.parking_fee) : 5;

  const pricing = useMemo(() => {
    return calculatePricing(pricePerNight, nights, kayakFee, parkingFee);
  }, [pricePerNight, nights, kayakFee, parkingFee]);

  const maxCapacity = place?.guests_capacity || 2;
  const totalGuests = adults + children;

  const dueAmountUsd = paymentMethod === 'pay_a_part_now' ? pricing.depositAmount : pricing.total;
  const dueAmountVnd = Math.round(dueAmountUsd * USD_TO_VND_RATE);

  const handleAdjustNights = (delta: number) => {
    const newNights = Math.max(1, nights + delta);
    const inD = new Date(checkIn);
    inD.setDate(inD.getDate() + newNights);
    setCheckOut(inD.toISOString().split('T')[0]);
  };

  /**
   * Finalizes booking in Supabase and navigates straight to My Bookings ("màn hình đơn hàng")
   */
  const finalizeBookingAndGoToOrders = async (paidAmount: number) => {
    if (isProcessingVnpayRef.current) return;
    isProcessingVnpayRef.current = true;

    setShowVnpayModal(false);
    setSubmitting(true);

    try {
      const res = await createBooking({
        userId: userId!,
        placeId: place.id,
        checkIn,
        checkOut,
        nights,
        guestsAdults: adults,
        guestsChildren: children,
        pricePerNight,
        kayakFee,
        parkingFee,
        total: pricing.total,
        paymentMethod,
        depositAmount: pricing.depositAmount,
        pinCode: place.smart_lock_pin || '4821#',
      });

      if (!res.success || !res.booking) {
        Alert.alert('Không thể đặt phòng', res.error || 'Vui lòng thử lại sau.');
        setSubmitting(false);
        isProcessingVnpayRef.current = false;
        return;
      }

      // Success -> Navigate directly to "màn hình đơn hàng" (Tab Bookings)
      navigation.navigate('MainTabs', { screen: 'Booking' });
      Alert.alert(
        'Đặt phòng thành công! 🎉',
        `Đơn đặt phòng #${res.booking.ref_code} của bạn đã được xác nhận và hiển thị trong danh sách chuyến đi.`
      );
    } catch (err: any) {
      Alert.alert('Lỗi đặt phòng', err?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
      isProcessingVnpayRef.current = false;
    }
  };

  // Callback to finalize booking after VNPAY completes (deep link or webview)
  const handleVnpayCallback = (returnUrl: string) => {
    const result = verifyVnpayReturnUrl(returnUrl);
    if (!result.isSuccess) {
      Alert.alert('Thanh toán VNPAY không thành công', result.message);
      setShowVnpayModal(false);
      setSubmitting(false);
      isProcessingVnpayRef.current = false;
      return;
    }

    finalizeBookingAndGoToOrders(dueAmountUsd);
  };

  // Deep Link Listener for wanderstay://vnpay-return
  useEffect(() => {
    const handleUrlEvent = (event: { url: string }) => {
      if (
        event.url &&
        (event.url.startsWith('wanderstay://') || event.url.includes('vnpay-return'))
      ) {
        handleVnpayCallback(event.url);
      }
    };

    const subscription = Linking.addEventListener('url', handleUrlEvent);

    Linking.getInitialURL().then((url) => {
      if (url && (url.startsWith('wanderstay://') || url.includes('vnpay-return'))) {
        handleVnpayCallback(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [userId, place, checkIn, checkOut, nights, adults, children, paymentMethod, pricing, dueAmountUsd]);

  const handleConfirmPay = async () => {
    if (!session || !userId) {
      navigation.navigate('Login');
      return;
    }

    if (totalGuests > maxCapacity) {
      Alert.alert(
        'Vượt quá sức chứa',
        `Chỗ ở này chỉ chứa tối đa ${maxCapacity} khách. Vui lòng giảm số lượng khách.`
      );
      return;
    }

    // 1. VNPAY Flow (Method: Deep Link / In-app WebView)
    if (selectedCard === 'vnpay') {
      const orderId = `WS${Date.now().toString().slice(-8)}`;
      const url = buildVnpayPaymentUrl({
        orderId,
        amountUsd: dueAmountUsd,
        orderInfo: `WanderStay ${place.title?.slice(0, 20) || 'Booking'}`,
      });

      isProcessingVnpayRef.current = false;
      setVnpayUrl(url);
      setShowVnpayModal(true);
      return;
    }

    // 2. Simulated Payment Flow (Visa/Wallet) -> Navigate to Orders
    await finalizeBookingAndGoToOrders(dueAmountUsd);
  };

  if (!place) {
    return (
      <SafeAreaView className="flex-1 bg-appBg items-center justify-center px-6">
        <Text className="text-base text-textMuted">Không tìm thấy thông tin phòng.</Text>
        <Pressable
          onPress={() => navigation.goBack()}
          className="mt-4 bg-brand px-6 py-2.5 rounded-full"
        >
          <Text className="text-sm font-bold text-white">Quay lại</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const heroImage =
    Array.isArray(place.images) && place.images.length > 0
      ? place.images[0]
      : 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80';

  return (
    <SafeAreaView className="flex-1 bg-appBg" edges={['top', 'left', 'right']}>
      {/* Sticky Top Header */}
      <View className="h-14 px-4 flex-row items-center border-b border-borderLight bg-white">
        <Pressable
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full items-center justify-center bg-appBg border border-borderLight"
        >
          <Ionicons name="chevron-back" size={20} color="#131B2E" />
        </Pressable>
        <Text className="flex-1 text-center text-lg font-bold text-textMain mr-10">
          Confirm and pay
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Place Summary Card */}
        <View className="bg-white rounded-3xl p-4 border border-borderLight shadow-sm flex-row gap-3.5 mb-5">
          <Image
            source={{ uri: heroImage }}
            className="w-24 h-24 rounded-2xl bg-black/10"
            resizeMode="cover"
          />
          <View className="flex-1 justify-center">
            <View className="bg-brand/10 self-start px-2 py-0.5 rounded-full mb-1">
              <Text className="text-[10px] font-bold text-brand uppercase">
                {place.place_type || place.category || 'RESORT'}
              </Text>
            </View>
            <Text className="text-base font-bold text-textMain" numberOfLines={1}>
              {place.title}
            </Text>
            <Text className="text-xs text-textMuted mt-0.5" numberOfLines={1}>
              {place.location}
            </Text>
            <View className="flex-row items-center justify-between mt-1.5">
              <View className="flex-row items-center gap-1">
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text className="text-xs font-bold text-textMain">
                  {place.rating != null ? place.rating.toFixed(1) : '4.9'}
                </Text>
                <Text className="text-xs text-textMuted">({place.review_count || 128})</Text>
              </View>
              <Text className="text-xs font-bold text-brand">
                ${pricePerNight}/đêm
              </Text>
            </View>
          </View>
        </View>

        {/* Section: Your trip details */}
        <View className="bg-white rounded-3xl p-5 border border-borderLight shadow-sm mb-5 gap-4">
          <Text className="text-base font-bold text-textMain">Your trip</Text>

          {/* Dates Row - Modern Interactive Stay Dates Card */}
          <View className="pb-3 border-b border-borderLight/60">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-bold text-textMuted uppercase tracking-wider">
                Lịch lưu trú
              </Text>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                className="flex-row items-center gap-1 bg-brand/10 px-2.5 py-1 rounded-full active:opacity-70"
              >
                <Ionicons name="calendar-outline" size={13} color="#4F46E5" />
                <Text className="text-xs font-bold text-brand">Đổi ngày trên lịch</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setShowDatePicker(true)}
              className="p-3 bg-appBg rounded-2xl border border-borderLight flex-row items-center justify-between active:opacity-85"
            >
              <View className="flex-1 flex-row items-center gap-2.5">
                <View className="w-10 h-10 rounded-xl bg-brand/10 items-center justify-center">
                  <Ionicons name="calendar" size={20} color="#4F46E5" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5 flex-wrap">
                    <Text className="text-sm font-bold text-textMain">
                      {formatFriendlyDate(checkIn)}
                    </Text>
                    <Ionicons name="arrow-forward" size={13} color="#8A90A6" />
                    <Text className="text-sm font-bold text-textMain">
                      {formatFriendlyDate(checkOut)}
                    </Text>
                  </View>
                  <Text className="text-[11px] text-textMuted mt-0.5">
                    {checkIn} đến {checkOut}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-2 pl-2">
                <View className="bg-brand px-2.5 py-1 rounded-full shadow-sm">
                  <Text className="text-xs font-bold text-white">{nights} đêm</Text>
                </View>
                {/* Stepper for quick fine-tuning */}
                <View className="flex-row items-center gap-1 bg-white rounded-full border border-borderLight p-0.5">
                  <Pressable
                    onPress={() => handleAdjustNights(-1)}
                    disabled={nights <= 1}
                    className={`w-6 h-6 rounded-full items-center justify-center ${
                      nights <= 1 ? 'bg-gray-100 opacity-40' : 'bg-brand/10'
                    }`}
                  >
                    <Text className="font-bold text-brand text-xs">-</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleAdjustNights(1)}
                    className="w-6 h-6 rounded-full bg-brand/10 items-center justify-center"
                  >
                    <Text className="font-bold text-brand text-xs">+</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </View>

          {/* Guests Row */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-semibold text-textMuted">Guests</Text>
              <Text className="text-sm font-bold text-textMain mt-0.5">
                {totalGuests} khách (tối đa {maxCapacity})
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => setAdults(Math.max(1, adults - 1))}
                disabled={adults <= 1}
                className={`w-8 h-8 rounded-full border items-center justify-center ${
                  adults <= 1 ? 'border-borderLight bg-gray-100' : 'border-brand bg-white'
                }`}
              >
                <Text className="font-bold text-brand">-</Text>
              </Pressable>
              <Text className="text-xs font-bold text-textMain px-1">{adults}</Text>
              <Pressable
                onPress={() => {
                  if (totalGuests < maxCapacity) {
                    setAdults(adults + 1);
                  } else {
                    Alert.alert('Tối đa', `Chỗ ở chỉ nhận tối đa ${maxCapacity} khách.`);
                  }
                }}
                className="w-8 h-8 rounded-full border border-brand bg-white items-center justify-center"
              >
                <Text className="font-bold text-brand">+</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Section: Payment options (BR06) */}
        <View className="bg-white rounded-3xl p-5 border border-borderLight shadow-sm mb-5 gap-3.5">
          <Text className="text-base font-bold text-textMain">Choose how to pay</Text>

          {/* Radio 1: Pay in full */}
          <Pressable
            onPress={() => setPaymentMethod('pay_in_full')}
            className={`p-4 rounded-2xl border flex-row items-center justify-between ${
              paymentMethod === 'pay_in_full'
                ? 'border-brand bg-[#F2F3FF]'
                : 'border-borderLight bg-white'
            }`}
          >
            <View className="flex-1 pr-3">
              <Text className="text-sm font-bold text-textMain">Pay in full</Text>
              <Text className="text-xs text-textMuted mt-0.5">
                Trả 100%: ${pricing.total.toFixed(2)} (~ {(Math.round(pricing.total * USD_TO_VND_RATE)).toLocaleString('vi-VN')} VND).
              </Text>
            </View>
            <View
              className={`w-5 h-5 rounded-full border items-center justify-center ${
                paymentMethod === 'pay_in_full' ? 'border-brand bg-brand' : 'border-gray-300'
              }`}
            >
              {paymentMethod === 'pay_in_full' && (
                <View className="w-2 h-2 rounded-full bg-white" />
              )}
            </View>
          </Pressable>

          {/* Radio 2: Pay a part now */}
          <Pressable
            onPress={() => setPaymentMethod('pay_a_part_now')}
            className={`p-4 rounded-2xl border flex-row items-center justify-between ${
              paymentMethod === 'pay_a_part_now'
                ? 'border-brand bg-[#F2F3FF]'
                : 'border-borderLight bg-white'
            }`}
          >
            <View className="flex-1 pr-3">
              <Text className="text-sm font-bold text-textMain">
                Pay a part now (${pricing.depositAmount.toFixed(2)})
              </Text>
              <Text className="text-xs text-textMuted mt-0.5">
                Đặt cọc trước 50%: ${pricing.depositAmount.toFixed(2)} (~ {(Math.round(pricing.depositAmount * USD_TO_VND_RATE)).toLocaleString('vi-VN')} VND), còn lại ${pricing.remainingAmount.toFixed(2)} thanh toán khi nhận phòng.
              </Text>
            </View>
            <View
              className={`w-5 h-5 rounded-full border items-center justify-center ${
                paymentMethod === 'pay_a_part_now' ? 'border-brand bg-brand' : 'border-gray-300'
              }`}
            >
              {paymentMethod === 'pay_a_part_now' && (
                <View className="w-2 h-2 rounded-full bg-white" />
              )}
            </View>
          </Pressable>
        </View>

        {/* Section: Payment Method Selection */}
        <View className="bg-white rounded-3xl p-5 border border-borderLight shadow-sm mb-5 gap-3">
          <Text className="text-base font-bold text-textMain">Payment method</Text>

          {/* VNPAY Payment Gateway Option */}
          <Pressable
            onPress={() => setSelectedCard('vnpay')}
            className={`flex-row items-center justify-between p-3.5 rounded-2xl border ${
              selectedCard === 'vnpay' ? 'border-brand bg-[#F2F3FF]' : 'border-borderLight'
            }`}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 items-center justify-center">
                <Ionicons name="qr-code-outline" size={18} color="#DC2626" />
              </View>
              <View>
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-xs font-bold text-textMain">Cổng VNPAY (Sandbox)</Text>
                  <View className="bg-emerald-100 px-1.5 py-0.2 rounded">
                    <Text className="text-[9px] font-bold text-emerald-700">Online</Text>
                  </View>
                </View>
                <Text className="text-[11px] text-textMuted">
                  VNPAY-QR, Thẻ ATM NCB, Visa/Master
                </Text>
              </View>
            </View>
            <Ionicons
              name={selectedCard === 'vnpay' ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={selectedCard === 'vnpay' ? '#4F46E5' : '#D1D5DB'}
            />
          </Pressable>

          {/* Visa Option */}
          <Pressable
            onPress={() => setSelectedCard('visa')}
            className={`flex-row items-center justify-between p-3.5 rounded-2xl border ${
              selectedCard === 'visa' ? 'border-brand bg-[#F2F3FF]' : 'border-borderLight'
            }`}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 items-center justify-center">
                <Ionicons name="card-outline" size={18} color="#2563EB" />
              </View>
              <View>
                <Text className="text-xs font-bold text-textMain">Visa / Mastercard (Mô phỏng)</Text>
                <Text className="text-[11px] text-textMuted">•••• 4829</Text>
              </View>
            </View>
            <Ionicons
              name={selectedCard === 'visa' ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={selectedCard === 'visa' ? '#4F46E5' : '#D1D5DB'}
            />
          </Pressable>

          {/* Wallet Option */}
          <Pressable
            onPress={() => setSelectedCard('wallet')}
            className={`flex-row items-center justify-between p-3.5 rounded-2xl border ${
              selectedCard === 'wallet' ? 'border-brand bg-[#F2F3FF]' : 'border-borderLight'
            }`}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 items-center justify-center">
                <Ionicons name="wallet-outline" size={18} color="#059669" />
              </View>
              <View>
                <Text className="text-xs font-bold text-textMain">WanderStay Wallet</Text>
                <Text className="text-[11px] text-textMuted">Balance: $120.00</Text>
              </View>
            </View>
            <Ionicons
              name={selectedCard === 'wallet' ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={selectedCard === 'wallet' ? '#4F46E5' : '#D1D5DB'}
            />
          </Pressable>
        </View>

        {/* Section: Price Details (BR01 Transparent Pricing) */}
        <View className="bg-white rounded-3xl p-5 border border-borderLight shadow-sm mb-5 gap-3">
          <Text className="text-base font-bold text-textMain">Price details</Text>

          <View className="flex-row justify-between items-center py-1">
            <Text className="text-xs text-textMuted">
              ${pricePerNight} x {nights} đêm
            </Text>
            <Text className="text-xs font-bold text-textMain">
              ${pricing.accommodationTotal.toFixed(2)}
            </Text>
          </View>

          <View className="flex-row justify-between items-center py-1">
            <Text className="text-xs text-textMuted">Kayak Rental fee</Text>
            <Text className="text-xs font-bold text-textMain">${kayakFee.toFixed(2)}</Text>
          </View>

          <View className="flex-row justify-between items-center py-1">
            <Text className="text-xs text-textMuted">Street Parking fee</Text>
            <Text className="text-xs font-bold text-textMain">${parkingFee.toFixed(2)}</Text>
          </View>

          <View className="flex-row justify-between items-center pt-3 border-t border-borderLight">
            <View>
              <Text className="text-sm font-bold text-textMain">Tổng chi phí (USD)</Text>
              <Text className="text-[11px] text-textMuted">
                ~ {(Math.round(pricing.total * USD_TO_VND_RATE)).toLocaleString('vi-VN')} VND
              </Text>
            </View>
            <Text className="text-base font-black text-brand">${pricing.total.toFixed(2)}</Text>
          </View>

          {paymentMethod === 'pay_a_part_now' && (
            <View className="flex-row justify-between items-center pt-2 border-t border-dashed border-borderLight">
              <View>
                <Text className="text-xs font-bold text-brand">Cần thanh toán hôm nay (50%)</Text>
                <Text className="text-[11px] text-brand/80">
                  ~ {dueAmountVnd.toLocaleString('vi-VN')} VND
                </Text>
              </View>
              <Text className="text-sm font-black text-brand">
                ${pricing.depositAmount.toFixed(2)}
              </Text>
            </View>
          )}

          {selectedCard === 'vnpay' && (
            <View className="mt-2 bg-[#F8F7FF] p-2.5 rounded-xl border border-brand/20 flex-row justify-between items-center">
              <Text className="text-[11px] font-medium text-textMuted">Số tiền VNPAY thu:</Text>
              <Text className="text-xs font-bold text-brand">
                {dueAmountVnd.toLocaleString('vi-VN')} VND (${dueAmountUsd.toFixed(2)})
              </Text>
            </View>
          )}
        </View>

        {/* Section: Cancellation Policy (BR05) */}
        <View className="bg-[#F8F7FF] rounded-2xl p-4 border border-borderLight/80 mb-5 gap-1.5">
          <Text className="text-xs font-bold text-textMain">Cancellation policy (BR05)</Text>
          <Text className="text-xs text-textMuted leading-5">
            Miễn phí hủy phòng trước 48 giờ. Hủy trong vòng 48 giờ sẽ phạt 1 đêm (${pricePerNight}).
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-borderLight px-5 py-4 flex-row items-center justify-between shadow-lg">
        <View>
          <Text className="text-[11px] text-textMuted font-medium uppercase">
            {paymentMethod === 'pay_a_part_now' ? 'Due today (50%)' : 'Total'}
          </Text>
          <Text className="text-xl font-black text-brand">
            ${dueAmountUsd.toFixed(2)}
          </Text>
          <Text className="text-[10px] text-textMuted">
            ~ {dueAmountVnd.toLocaleString('vi-VN')} VND
          </Text>
        </View>

        <Pressable
          onPress={handleConfirmPay}
          disabled={submitting}
          className={`px-6 py-3.5 rounded-full flex-row items-center gap-2 ${
            submitting ? 'bg-brand/60' : 'bg-brand shadow-md shadow-brand/30'
          }`}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="lock-closed" size={15} color="#FFF" />
              <Text className="text-sm font-bold text-white">
                {selectedCard === 'vnpay' ? 'Thanh toán qua VNPAY' : 'Confirm and Pay'}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* VNPAY In-App WebView Modal & External Browser fallback */}
      <Modal
        visible={showVnpayModal}
        animationType="slide"
        onRequestClose={() => setShowVnpayModal(false)}
      >
        <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right', 'bottom']}>
          {/* Modal Header */}
          <View className="h-14 px-4 flex-row items-center justify-between border-b border-borderLight bg-white">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-xl bg-red-50 border border-red-200 items-center justify-center">
                <Ionicons name="qr-code-outline" size={16} color="#DC2626" />
              </View>
              <View>
                <Text className="text-base font-bold text-textMain">Cổng thanh toán VNPAY</Text>
                <Text className="text-[10px] text-brand font-semibold">
                  Số tiền: {dueAmountVnd.toLocaleString('vi-VN')} VND
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => {
                  if (vnpayUrl) {
                    Linking.openURL(vnpayUrl);
                  }
                }}
                className="px-2.5 py-1.5 bg-brand/10 rounded-lg flex-row items-center gap-1"
              >
                <Ionicons name="open-outline" size={13} color="#4F46E5" />
                <Text className="text-[11px] font-bold text-brand">Mở trình duyệt</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowVnpayModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#131B2E" />
              </Pressable>
            </View>
          </View>

          {/* WebView Container */}
          {vnpayUrl && (
            <WebView
              source={{ uri: vnpayUrl }}
              style={{ flex: 1 }}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={['*']}
              startInLoadingState
              renderLoading={() => (
                <View className="absolute inset-0 bg-white items-center justify-center">
                  <ActivityIndicator size="large" color="#4F46E5" />
                  <Text className="mt-3 text-xs text-textMuted">
                    Đang kết nối tới cổng thanh toán VNPAY Sandbox...
                  </Text>
                </View>
              )}
              onShouldStartLoadWithRequest={(request) => {
                if (
                  request.url.startsWith('wanderstay://') ||
                  request.url.includes('vnpay-return') ||
                  request.url.includes('vnp_ResponseCode=')
                ) {
                  handleVnpayCallback(request.url);
                  return false;
                }
                return true;
              }}
              onNavigationStateChange={(navState) => {
                if (
                  navState.url.startsWith('wanderstay://') ||
                  navState.url.includes('vnpay-return') ||
                  navState.url.includes('vnp_ResponseCode=')
                ) {
                  handleVnpayCallback(navState.url);
                }
              }}
            />
          )}

          {/* Bottom Confirmation Bar */}
          <View className="p-3.5 bg-white border-t border-borderLight flex-row items-center justify-between gap-3 shadow-lg">
            <View className="flex-1">
              <Text className="text-xs font-bold text-textMain">Đã thanh toán OTP thành công?</Text>
              <Text className="text-[10px] text-textMuted">
                Nhấn nút bên phải để lưu đơn đặt phòng vào hệ thống
              </Text>
            </View>
            <Pressable
              onPress={() => finalizeBookingAndGoToOrders(dueAmountUsd)}
              className="bg-emerald-600 px-4 py-2.5 rounded-full flex-row items-center gap-1.5 shadow-sm active:opacity-80"
            >
              <Ionicons name="checkmark-circle" size={16} color="#FFF" />
              <Text className="text-xs font-bold text-white">Xác nhận xong</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modern Visual Stay Date Picker Modal (Standard Airbnb / Booking.com) */}
      <StayDatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        initialCheckIn={checkIn}
        initialCheckOut={checkOut}
        onApply={(newCheckIn, newCheckOut) => {
          setCheckIn(newCheckIn);
          setCheckOut(newCheckOut);
        }}
        minNights={1}
      />
    </SafeAreaView>
  );
}
