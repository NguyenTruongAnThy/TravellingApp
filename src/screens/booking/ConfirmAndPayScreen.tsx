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
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { calculatePricing } from '../../services/pricing';
import { createBooking, checkBookingConflict } from '../../services/bookingsService';
import { validatePromoCode } from '../../services/promotionsService';
import {
  SEPAY_CONFIG,
  convertUsdToVnd,
} from '../../services/sepayService';
import SepayQrModal from '../../components/SepayQrModal';
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
  const [selectedCard, setSelectedCard] = useState<'sepay' | 'visa'>('sepay');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // SePay VietQR Modal states
  const [showSepayModal, setShowSepayModal] = useState<boolean>(false);
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Proactive date conflict state
  const [hasDateConflict, setHasDateConflict] = useState<boolean>(false);
  const [conflictRefCode, setConflictRefCode] = useState<string>('');

  // Automatically check conflict whenever place or dates change
  useEffect(() => {
    let isMounted = true;
    async function checkConflict() {
      if (!place?.id || !checkIn || !checkOut) return;
      const { hasConflict, conflictingBooking } = await checkBookingConflict(
        place.id,
        checkIn,
        checkOut
      );
      if (isMounted) {
        setHasDateConflict(hasConflict);
        setConflictRefCode(conflictingBooking?.ref_code || '');
      }
    }
    checkConflict();
    return () => {
      isMounted = false;
    };
  }, [place?.id, checkIn, checkOut]);

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

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');
  const [promoValidating, setPromoValidating] = useState(false);

  const pricing = useMemo(() => {
    return calculatePricing(pricePerNight, nights, kayakFee, parkingFee);
  }, [pricePerNight, nights, kayakFee, parkingFee]);

  const maxCapacity = place?.guests_capacity || 2;
  const totalGuests = adults + children;

  const subtotal = pricing.total;
  const finalTotal = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
  const depositAmount = Math.round(finalTotal * 0.5 * 100) / 100;
  const remainingAmount = Math.round((finalTotal - depositAmount) * 100) / 100;

  const dueAmountUsd = paymentMethod === 'pay_a_part_now' ? depositAmount : finalTotal;
  const dueAmountVnd = convertUsdToVnd(dueAmountUsd);

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setPromoValidating(true);
    setPromoMessage('');
    const res = await validatePromoCode(promoCodeInput, subtotal);
    setPromoValidating(false);
    if (res.valid && res.discountAmount > 0) {
      setAppliedPromo(res.promotion);
      setDiscountAmount(res.discountAmount);
      setPromoMessage(`Áp dụng thành công mã ${promoCodeInput.toUpperCase()}! Giảm $${res.discountAmount.toFixed(2)}`);
    } else {
      setPromoMessage(res.message || 'Mã ưu đãi không hợp lệ.');
      setDiscountAmount(0);
      setAppliedPromo(null);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setDiscountAmount(0);
    setPromoCodeInput('');
    setPromoMessage('');
  };

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
        total: finalTotal,
        paymentMethod,
        depositAmount: paymentMethod === 'pay_a_part_now' ? depositAmount : undefined,
        promoCode: appliedPromo?.code || undefined,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        pinCode: place.smart_lock_pin || '4821#',
      });

      if (!res.success || !res.booking) {
        Alert.alert('Không thể đặt phòng', res.error || 'Vui lòng thử lại sau.');
        setSubmitting(false);
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
    }
  };

  const handleSepaySuccess = (booking: any) => {
    setShowSepayModal(false);
    navigation.navigate('MainTabs', { screen: 'Booking' });
    Alert.alert(
      'Thanh toán SePay thành công! 🎉',
      `Đơn đặt phòng #${booking.ref_code} của bạn đã được xác nhận tự động qua BIDV và hiển thị trong danh sách chuyến đi.`
    );
  };

  const handleCloseSepayModal = () => {
    Alert.alert(
      'Đóng phiên thanh toán VietQR?',
      'Bạn có muốn đóng màn hình thanh toán VietQR không? Giao dịch chưa hoàn tất.',
      [
        { text: 'Quét tiếp', style: 'cancel' },
        {
          text: 'Đóng',
          onPress: () => {
            setShowSepayModal(false);
          },
        },
      ]
    );
  };

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

    // 1. KIỂM TRA TRÙNG NGÀY NGAY LẬP TỨC KHI BẤM NÚT THANH TOÁN (BR04 / UC010)
    setSubmitting(true);
    try {
      const { hasConflict, conflictingBooking } = await checkBookingConflict(
        place.id,
        checkIn,
        checkOut
      );

      if (hasConflict) {
        setSubmitting(false);
        setHasDateConflict(true);
        setConflictRefCode(conflictingBooking?.ref_code || '');
        Alert.alert(
          'Ngày đã có người đặt! ⚠️',
          `Khoảng thời gian từ ${checkIn} đến ${checkOut} đã được khách khác đặt trước${
            conflictingBooking?.ref_code ? ` (Mã đơn: ${conflictingBooking.ref_code})` : ''
          }. Vui lòng bấm "Đổi ngày trên lịch" để chọn ngày còn trống.`,
          [
            {
              text: 'Đổi ngày trên lịch',
              onPress: () => setShowDatePicker(true),
            },
            { text: 'Đóng', style: 'cancel' },
          ]
        );
        return;
      }
    } catch (err: any) {
      console.warn('Lỗi kiểm tra trùng lịch:', err);
    }

    // 2. SePay VietQR Flow
    if (selectedCard === 'sepay') {
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
          total: finalTotal,
          paymentMethod,
          depositAmount: paymentMethod === 'pay_a_part_now' ? depositAmount : undefined,
          promoCode: appliedPromo?.code || undefined,
          discountAmount: discountAmount > 0 ? discountAmount : undefined,
          pinCode: place.smart_lock_pin || '4821#',
          paymentStatus: 'pending',
        });

        setSubmitting(false);

        if (!res.success || !res.booking) {
          Alert.alert('Không thể tạo đơn đặt phòng', res.error || 'Vui lòng thử lại sau.');
          return;
        }

        setCreatedBooking(res.booking);
        setShowSepayModal(true);
      } catch (err: any) {
        setSubmitting(false);
        Alert.alert('Lỗi đặt phòng', err?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      }
      return;
    }

    // 3. Simulated Payment Flow (Visa/Wallet) -> Navigate to Orders
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
                  {place.rating != null && Number(place.rating) > 0 && place.review_count && place.review_count > 0
                    ? Number(place.rating).toFixed(1)
                    : 'New'}
                </Text>
                {place.review_count && place.review_count > 0 ? (
                  <Text className="text-xs text-textMuted">({place.review_count})</Text>
                ) : null}
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

            {/* Real-time date conflict warning banner */}
            {hasDateConflict && (
              <View className="mt-2.5 bg-red-50 border border-red-200 rounded-2xl p-3 flex-row items-center gap-2">
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <View className="flex-1">
                  <Text className="text-xs font-bold text-red-700">
                    Khoảng ngày này đã có khách đặt! {conflictRefCode ? `(${conflictRefCode})` : ''}
                  </Text>
                  <Text className="text-[11px] text-red-600 mt-0.5">
                    Vui lòng bấm "Đổi ngày trên lịch" để chọn ngày còn trống.
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  className="bg-red-600 px-3 py-1.5 rounded-full shadow-sm active:opacity-80"
                >
                  <Text className="text-[11px] font-bold text-white">Đổi ngày</Text>
                </Pressable>
              </View>
            )}
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
                Trả 100%: ${finalTotal.toFixed(2)} (~ {convertUsdToVnd(finalTotal).toLocaleString('vi-VN')} VND).
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
                Pay a part now (${depositAmount.toFixed(2)})
              </Text>
              <Text className="text-xs text-textMuted mt-0.5">
                Đặt cọc trước 50%: ${depositAmount.toFixed(2)} (~ {convertUsdToVnd(depositAmount).toLocaleString('vi-VN')} VND), còn lại ${remainingAmount.toFixed(2)} thanh toán khi nhận phòng.
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

          {/* SePay VietQR (BIDV) Option */}
          <Pressable
            onPress={() => setSelectedCard('sepay')}
            className={`flex-row items-center justify-between p-3.5 rounded-2xl border ${
              selectedCard === 'sepay' ? 'border-brand bg-[#F2F3FF]' : 'border-borderLight'
            }`}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 items-center justify-center">
                <Ionicons name="qr-code-outline" size={18} color="#006B68" />
              </View>
              <View>
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-xs font-bold text-textMain">Chuyển khoản VietQR (SePay)</Text>
                  <View className="bg-emerald-100 px-1.5 py-0.2 rounded">
                    <Text className="text-[9px] font-bold text-emerald-700">Tự động</Text>
                  </View>
                </View>
              </View>
            </View>
            <Ionicons
              name={selectedCard === 'sepay' ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={selectedCard === 'sepay' ? '#4F46E5' : '#D1D5DB'}
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
        </View>

        {/* Section: Promo Code / Voucher */}
        <View className="bg-white rounded-3xl p-5 border border-borderLight shadow-sm mb-5 gap-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Ionicons name="pricetag-outline" size={18} color="#FF6B00" />
              <Text className="text-base font-bold text-textMain">Mã ưu đãi / Khuyến mại</Text>
            </View>
            {appliedPromo ? (
              <Pressable onPress={handleRemovePromo}>
                <Text className="text-xs font-bold text-red-500">Gỡ bỏ</Text>
              </Pressable>
            ) : null}
          </View>

          {appliedPromo ? (
            <View className="bg-orange-50 border border-orange-200 p-3 rounded-2xl flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-xs font-bold text-[#FF6B00]">{appliedPromo.code}</Text>
                  <View className="bg-[#FF6B00] px-1.5 py-0.2 rounded">
                    <Text className="text-[9px] font-bold text-white">Đã áp dụng</Text>
                  </View>
                </View>
                <Text className="text-[11px] text-[#C2410C] mt-0.5" numberOfLines={1}>{appliedPromo.title}</Text>
              </View>
              <Text className="text-base font-black text-[#FF6B00]">-${discountAmount.toFixed(2)}</Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-2">
              <TextInput
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-borderLight bg-appBg text-xs font-bold text-textMain"
                placeholder="Nhập mã (VD: WANDER10, BALI50, WELCOME20)"
                placeholderTextColor="#8A90A6"
                autoCapitalize="characters"
                value={promoCodeInput}
                onChangeText={(t) => { setPromoCodeInput(t); setPromoMessage(''); }}
              />
              <Pressable
                className="px-4 py-2.5 rounded-xl bg-brand items-center justify-center"
                onPress={handleApplyPromo}
                disabled={promoValidating || !promoCodeInput.trim()}
              >
                {promoValidating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-xs font-bold text-white">Áp dụng</Text>
                )}
              </Pressable>
            </View>
          )}

          {promoMessage ? (
            <Text className={`text-[11px] font-medium ${appliedPromo ? 'text-emerald-600' : 'text-red-500'}`}>
              {promoMessage}
            </Text>
          ) : null}
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

          {discountAmount > 0 && (
            <View className="flex-row justify-between items-center py-1">
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="pricetag" size={13} color="#FF6B00" />
                <Text className="text-xs font-bold text-[#FF6B00]">Ưu đãi ({appliedPromo?.code})</Text>
              </View>
              <Text className="text-xs font-extrabold text-[#FF6B00]">-${discountAmount.toFixed(2)}</Text>
            </View>
          )}

          <View className="flex-row justify-between items-center pt-3 border-t border-borderLight">
            <View>
              <Text className="text-sm font-bold text-textMain">Tổng chi phí (USD)</Text>
              <Text className="text-[11px] text-textMuted">
                ~ {convertUsdToVnd(finalTotal).toLocaleString('vi-VN')} VND
              </Text>
            </View>
            <Text className="text-base font-black text-brand">${finalTotal.toFixed(2)}</Text>
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
                ${depositAmount.toFixed(2)}
              </Text>
            </View>
          )}

          {selectedCard === 'sepay' && (
            <View className="mt-2 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex-row justify-between items-center">
              <Text className="text-[11px] font-medium text-emerald-800">Số tiền chuyển khoản:</Text>
              <Text className="text-xs font-bold text-[#006B68]">
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
                Thanh toán ngay
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* SePay VietQR Modal */}
      {createdBooking && (
        <SepayQrModal
          visible={showSepayModal}
          onClose={handleCloseSepayModal}
          booking={createdBooking}
          dueAmountVnd={dueAmountVnd}
          dueAmountUsd={dueAmountUsd}
          onPaymentSuccess={handleSepaySuccess}
        />
      )}

      {/* Modern Visual Stay Date Picker Modal (Standard Airbnb / Booking.com) */}
      <StayDatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        initialCheckIn={checkIn}
        initialCheckOut={checkOut}
        placeId={place?.id}
        onApply={(newCheckIn, newCheckOut) => {
          setCheckIn(newCheckIn);
          setCheckOut(newCheckOut);
        }}
        minNights={1}
      />
    </SafeAreaView>
  );
}
