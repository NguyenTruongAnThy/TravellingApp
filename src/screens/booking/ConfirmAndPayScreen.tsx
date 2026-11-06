import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { calculatePricing } from '../../services/pricing';
import { createBooking } from '../../services/bookingsService';
import type { Place } from '../../types';

export default function ConfirmAndPayScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const place: Place = route.params?.place;

  // Defaults: 5 nights from next Friday, or dynamic
  const [checkIn, setCheckIn] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [checkOut, setCheckOut] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  });

  const [adults, setAdults] = useState<number>(1);
  const [children, setChildren] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'pay_in_full' | 'pay_a_part_now'>('pay_in_full');
  const [selectedCard, setSelectedCard] = useState<'visa' | 'wallet' | 'apple_pay'>('visa');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Nights calculation
  const nights = useMemo(() => {
    try {
      const inD = new Date(checkIn);
      const outD = new Date(checkOut);
      const diffTime = outD.getTime() - inD.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(1, diffDays);
    } catch {
      return 5;
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

  const handleAdjustNights = (delta: number) => {
    const newNights = Math.max(1, nights + delta);
    const inD = new Date(checkIn);
    inD.setDate(inD.getDate() + newNights);
    setCheckOut(inD.toISOString().split('T')[0]);
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

    setSubmitting(true);
    try {
      const res = await createBooking({
        userId,
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
        return;
      }

      // Success -> navigate to PaymentSuccessScreen
      navigation.replace('PaymentSuccess', {
        booking: res.booking,
        place,
        paidAmount: paymentMethod === 'pay_a_part_now' ? pricing.depositAmount : pricing.total,
      });
    } catch (err: any) {
      Alert.alert('Lỗi đặt phòng', err?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      setSubmitting(false);
    }
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
        contentContainerStyle={{ paddingBottom: 120 }}
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
            <View className="flex-row items-center gap-1 mt-1.5">
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text className="text-xs font-bold text-textMain">
                {place.rating != null ? place.rating.toFixed(1) : '4.9'}
              </Text>
              <Text className="text-xs text-textMuted">({place.review_count || 128})</Text>
            </View>
          </View>
        </View>

        {/* Section: Your trip details */}
        <View className="bg-white rounded-3xl p-5 border border-borderLight shadow-sm mb-5 gap-4">
          <Text className="text-base font-bold text-textMain">Your trip</Text>

          {/* Dates Row */}
          <View className="flex-row items-center justify-between pb-3 border-b border-borderLight/60">
            <View>
              <Text className="text-xs font-semibold text-textMuted">Dates</Text>
              <Text className="text-sm font-bold text-textMain mt-0.5">
                {checkIn} – {checkOut} ({nights} nights)
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => handleAdjustNights(-1)}
                disabled={nights <= 1}
                className={`w-8 h-8 rounded-full border items-center justify-center ${
                  nights <= 1 ? 'border-borderLight bg-gray-100' : 'border-brand bg-white'
                }`}
              >
                <Text className="font-bold text-brand">-</Text>
              </Pressable>
              <Pressable
                onPress={() => handleAdjustNights(1)}
                className="w-8 h-8 rounded-full border border-brand bg-white items-center justify-center"
              >
                <Text className="font-bold text-brand">+</Text>
              </Pressable>
            </View>
          </View>

          {/* Guests Row */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-semibold text-textMuted">Guests</Text>
              <Text className="text-sm font-bold text-textMain mt-0.5">
                {totalGuests} guest{totalGuests > 1 ? 's' : ''} (max {maxCapacity})
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
                Pay the total (${pricing.total.toFixed(2)}) now.
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
                Pay 50% deposit now, and the remaining ${pricing.remainingAmount.toFixed(2)} at check-in.
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
                <Text className="text-xs font-bold text-textMain">Visa / Mastercard</Text>
                <Text className="text-[11px] text-textMuted">•••• 4829</Text>
              </View>
            </View>
            <Ionicons
              name={selectedCard === 'visa' ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={selectedCard === 'visa' ? '#4F46E5' : '#D1D5DB'}
            />
          </Pressable>

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
              ${pricePerNight} x {nights} nights
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
            <Text className="text-sm font-bold text-textMain">Total (USD)</Text>
            <Text className="text-base font-black text-brand">${pricing.total.toFixed(2)}</Text>
          </View>

          {paymentMethod === 'pay_a_part_now' && (
            <View className="flex-row justify-between items-center pt-2 border-t border-dashed border-borderLight">
              <Text className="text-xs font-bold text-brand">Due now (50%)</Text>
              <Text className="text-sm font-black text-brand">
                ${pricing.depositAmount.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        {/* Section: Cancellation Policy (BR05) */}
        <View className="bg-[#F8F7FF] rounded-2xl p-4 border border-borderLight/80 mb-5 gap-1.5">
          <Text className="text-xs font-bold text-textMain">Cancellation policy (BR05)</Text>
          <Text className="text-xs text-textMuted leading-5">
            Free cancellation up to 48 hours before check-in. If cancelled within 48 hours, a 1-night penalty (${pricePerNight}) applies.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-borderLight px-5 py-4 flex-row items-center justify-between shadow-lg">
        <View>
          <Text className="text-[11px] text-textMuted font-medium uppercase">
            {paymentMethod === 'pay_a_part_now' ? 'Due today' : 'Total'}
          </Text>
          <Text className="text-xl font-black text-brand">
            ${(paymentMethod === 'pay_a_part_now' ? pricing.depositAmount : pricing.total).toFixed(2)}
          </Text>
        </View>

        <Pressable
          onPress={handleConfirmPay}
          disabled={submitting}
          className={`px-8 py-3.5 rounded-full flex-row items-center gap-2 ${
            submitting ? 'bg-brand/60' : 'bg-brand shadow-md shadow-brand/30'
          }`}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="lock-closed" size={15} color="#FFF" />
              <Text className="text-sm font-bold text-white">Confirm and Pay</Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
