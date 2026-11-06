import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { Booking, Place } from '../../types';

export default function PaymentSuccessScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const booking: Booking = route.params?.booking;
  const place: Place = route.params?.place || booking?.places;
  const paidAmount = route.params?.paidAmount || booking?.total || 0;

  const refCode = booking?.ref_code || '#WS-84920';
  const placeTitle = place?.title || booking?.places?.title || 'Stay';
  const placeLocation = place?.location || booking?.places?.location || 'Indonesia';
  const heroImage =
    place?.images?.[0] ||
    booking?.places?.images?.[0] ||
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80';

  return (
    <SafeAreaView className="flex-1 bg-[#FAF8FF]" edges={['top', 'left', 'right']}>
      <ScrollView
        className="flex-1 px-5 pt-8"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon Badge */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center border-4 border-emerald-200 mb-4 shadow-sm">
            <Ionicons name="checkmark-circle" size={48} color="#059669" />
          </View>
          <Text className="text-2xl font-black text-textMain text-center">
            Booking Confirmed!
          </Text>
          <Text className="text-xs text-textMuted text-center mt-1">
            Your simulated payment has been securely processed.
          </Text>

          {/* Booking Ref Code Capsule */}
          <View className="mt-4 bg-[#F2F3FF] border border-brand/20 px-4 py-1.5 rounded-full flex-row items-center gap-1.5">
            <Text className="text-xs font-semibold text-textMuted">Booking Reference:</Text>
            <Text className="text-xs font-black text-brand">{refCode}</Text>
          </View>
        </View>

        {/* Place Card Summary */}
        <View className="bg-white rounded-3xl p-4 border border-borderLight shadow-sm mb-5 flex-row gap-3.5">
          <Image
            source={{ uri: heroImage }}
            className="w-20 h-20 rounded-2xl bg-black/10"
            resizeMode="cover"
          />
          <View className="flex-1 justify-center">
            <Text className="text-base font-bold text-textMain" numberOfLines={1}>
              {placeTitle}
            </Text>
            <Text className="text-xs text-textMuted mt-0.5" numberOfLines={1}>
              {placeLocation}
            </Text>
            <Text className="text-xs font-semibold text-brand mt-1.5">
              {booking?.check_in} – {booking?.check_out} ({booking?.nights || 1} nights)
            </Text>
          </View>
        </View>

        {/* Quick Smart Key Card */}
        <View className="bg-white rounded-3xl p-5 border border-borderLight shadow-sm mb-5 gap-2">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-full bg-brand/10 items-center justify-center">
              <Ionicons name="key-outline" size={16} color="#4F46E5" />
            </View>
            <Text className="text-sm font-bold text-textMain">Keyless Smart Key Ready</Text>
          </View>
          <Text className="text-xs text-textMuted leading-5">
            Your door access PIN <Text className="font-bold text-brand">4821#</Text> and Bluetooth unlock have been linked to this reservation. They will activate automatically at 14:00 on check-in day.
          </Text>
        </View>

        {/* Payment Summary */}
        <View className="bg-white rounded-3xl p-5 border border-borderLight shadow-sm mb-8 gap-2.5">
          <Text className="text-xs font-bold uppercase tracking-wider text-textMuted">
            PAYMENT SUMMARY
          </Text>
          <View className="flex-row justify-between items-center py-1">
            <Text className="text-xs text-textMuted">Payment Method</Text>
            <Text className="text-xs font-bold text-textMain uppercase">
              {booking?.payment_method?.replace(/_/g, ' ') || 'Simulated'}
            </Text>
          </View>
          <View className="flex-row justify-between items-center py-1">
            <Text className="text-xs text-textMuted">Amount Paid Today</Text>
            <Text className="text-base font-black text-brand">
              ${Number(paidAmount).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="gap-3">
          <Pressable
            onPress={() =>
              navigation.navigate('TripReceipt', {
                booking,
                receipt: {
                  ref: refCode,
                  place: placeTitle,
                  location: placeLocation,
                  dates: `${booking?.check_in} – ${booking?.check_out}`,
                  nights: booking?.nights,
                  rate: booking?.price_per_night,
                  total: booking?.total,
                },
              })
            }
            className="bg-brand py-4 rounded-full items-center justify-center flex-row gap-2 shadow-md shadow-brand/30"
          >
            <Ionicons name="receipt-outline" size={16} color="#FFF" />
            <Text className="text-sm font-bold text-white">View Trip Receipt & PDF</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('MainTabs', { screen: 'Booking' })}
            className="bg-white border border-borderLight py-4 rounded-full items-center justify-center shadow-sm"
          >
            <Text className="text-sm font-bold text-textMain">Go to My Bookings</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
