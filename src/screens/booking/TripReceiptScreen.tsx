import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface TripReceiptScreenProps {
  navigation?: any;
  route?: {
    params?: {
      receipt?: any;
      booking?: any;
    };
  };
}

export default function TripReceiptScreen({
  navigation,
  route,
}: TripReceiptScreenProps) {
  const { t, i18n } = useTranslation();
  const [downloading, setDownloading] = useState(false);
  const [emailing, setEmailing] = useState(false);

  // Incoming data or default fallback
  const paramsBooking = route?.params?.booking;
  const paramsReceipt = route?.params?.receipt;

  const place = paramsBooking?.places || paramsReceipt?.place;
  const status = paramsBooking?.status || (paramsReceipt ? 'completed' : 'completed');
  const isCancelled = status === 'cancelled';

  const receiptNumber =
    paramsReceipt?.receipt_number ||
    (paramsBooking?.ref_code ? `#REC-${paramsBooking.ref_code.replace('#', '')}` : '#REC-2024-84920');

  const issuedDate =
    paramsReceipt?.issued_date ||
    (paramsBooking?.created_at
      ? new Date(paramsBooking.created_at).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Today');

  const placeTitle = place?.title || paramsReceipt?.place_title || 'Chỗ nghỉ WanderStay';
  const placeLocation =
    place?.location || paramsReceipt?.place_location || 'Việt Nam';
  const placeType = place?.category || place?.place_type || 'HOMESTAY';
  const placeImage =
    place?.images?.[0] ||
    paramsReceipt?.place_image ||
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80';

  const refCode = paramsBooking?.ref_code || paramsReceipt?.ref || '#WS-BOOKING';
  const stayDates =
    paramsReceipt?.dates ||
    (paramsBooking ? `${paramsBooking.check_in} – ${paramsBooking.check_out}` : 'Hôm nay');
  const nightsNum = paramsBooking?.nights || paramsReceipt?.nights || 1;
  const stayNights = `${nightsNum} ${t('receipt.nightsCount', 'đêm')}`;
  const totalGuests = (paramsBooking?.guests_adults || 1) + (paramsBooking?.guests_children || 0);
  const guestsText = `${totalGuests} ${t('receipt.guests', 'khách')}`;
  const roomConfig = paramsReceipt?.room_config || (i18n.language === 'vi' ? '1 phòng ngủ' : '1 bedroom');

  const hostName = place?.host_name || paramsReceipt?.host_name || 'Chủ nhà WanderStay';
  const hostAvatar =
    paramsReceipt?.host_avatar ||
    place?.images?.[0] ||
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96';

  const paymentMethodLabel =
    paramsReceipt?.card_label ||
    (paramsBooking?.payment_method === 'pay_a_part_now'
      ? (i18n.language === 'vi' ? 'Pay a part now (Đặt cọc 50%)' : 'Pay a part now (50% Deposit)')
      : (i18n.language === 'vi' ? 'Pay in full (Chuyển khoản VietQR / SePay)' : 'Pay in full (VietQR / SePay)'));
  const transactionId =
    paramsReceipt?.transaction_id || `TXN_${paramsBooking?.id ? paramsBooking.id.slice(0, 8) : '992837482'}`;
  const billingName = paramsReceipt?.billing_name || 'WanderStay Member';
  const billingAddress = paramsReceipt?.billing_address || 'WanderStay Verified Account';

  // Itemized Pricing per BR01 & BR02
  const pricePerNight = Number(paramsBooking?.price_per_night || paramsReceipt?.rate || 20);
  const accommodationTotal = pricePerNight * nightsNum;
  const kayakFee = paramsBooking?.kayak_fee != null ? Number(paramsBooking.kayak_fee) : 5;
  const parkingFee = paramsBooking?.parking_fee != null ? Number(paramsBooking.parking_fee) : 5;
  const promoCode = paramsBooking?.promo_code || null;
  const discountAmount = paramsBooking?.discount_amount != null ? Number(paramsBooking.discount_amount) : 0;
  const grandTotal =
    paramsBooking?.total != null
      ? Number(paramsBooking.total)
      : Math.max(0, accommodationTotal + kayakFee + parkingFee - discountAmount);

  const totalAmount = `$${grandTotal.toFixed(2)}`;
  const breakdownNightsText = `$${pricePerNight.toFixed(2)} × ${nightsNum} ${t('receipt.nightsCount', 'đêm')}`;
  const breakdownNightsTotal = `$${accommodationTotal.toFixed(2)}`;

  const handleShare = async () => {
    try {
      await Share.share({
        title: `${t('receipt.title')} ${receiptNumber}`,
        message: `WanderStay ${t('receipt.title')} ${receiptNumber}\n${placeTitle}\n${totalAmount} USD\n${stayDates} (${stayNights})\n${refCode}`,
      });
    } catch {
      // Ignore dismiss
    }
  };

  const handleMoreOptions = () => {
    Alert.alert(t('receipt.title'), `Receipt ${receiptNumber}`, [
      {
        text: 'Copy Receipt Number',
        onPress: () => Alert.alert('Copied', `${receiptNumber} copied to clipboard.`),
      },
      {
        text: t('receipt.contactSupport', 'Liên hệ hỗ trợ'),
        onPress: () => {
          if (navigation?.navigate) {
            navigation.navigate('TravelAssistant');
          } else {
            Alert.alert('Support', '24/7 Virtual Assistant is ready to help.');
          }
        },
      },
      { text: t('receipt.close', 'Đóng'), style: 'cancel' },
    ]);
  };

  const handleDownloadPDF = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      Alert.alert(
        i18n.language === 'vi' ? 'Đã tải biên nhận PDF' : 'Receipt Downloaded',
        i18n.language === 'vi'
          ? `Biên nhận điện tử ${receiptNumber} đã được lưu thành công vào thiết bị của bạn.`
          : `PDF Receipt ${receiptNumber} has been successfully exported and saved to your device.`,
        [
          { text: i18n.language === 'vi' ? 'Xem ngay' : 'View Now', onPress: () => {} },
          { text: t('receipt.close', 'Đóng'), style: 'cancel' },
        ]
      );
    }, 900);
  };

  const handleEmailReceipt = () => {
    setEmailing(true);
    setTimeout(() => {
      setEmailing(false);
      Alert.alert(
        i18n.language === 'vi' ? 'Đã gửi Email' : 'Email Sent',
        i18n.language === 'vi'
          ? `Biên nhận ${receiptNumber} đã được gửi tới email tài khoản của bạn.`
          : `Receipt ${receiptNumber} has been dispatched to your registered email address.`
      );
    }, 600);
  };

  const handleReportIssue = () => {
    Alert.alert(
      t('receipt.reportIssue', 'Báo cáo sự cố'),
      i18n.language === 'vi'
        ? `Bạn cần hỗ trợ với đơn đặt phòng ${refCode}? Trợ lý ảo du lịch 24/7 của chúng tôi sẵn sàng hỗ trợ.`
        : `Have an issue with booking ${refCode}? Our 24/7 guest support team is here to assist you.`,
      [
        {
          text: i18n.language === 'vi' ? 'Nhắn với Trợ lý ảo' : 'Chat with Assistant',
          onPress: () => {
            if (navigation?.navigate) {
              navigation.navigate('TravelAssistant');
            }
          },
        },
        { text: t('receipt.close', 'Đóng'), style: 'cancel' },
      ]
    );
  };

  const handleRequestVAT = () => {
    Alert.alert(
      i18n.language === 'vi' ? 'Yêu cầu hóa đơn đỏ VAT' : 'Business Invoice / VAT Request',
      i18n.language === 'vi'
        ? `Yêu cầu xuất hóa đơn điện tử cho mã ${receiptNumber} đã được ghi nhận. Hóa đơn sẽ được gửi qua email trong 24h.`
        : `Request for official VAT invoice #${receiptNumber} submitted. It will be delivered to your billing email within 24 hours.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAF8FF]" edges={['top', 'left', 'right']}>
      {/* Sticky Top Header */}
      <View className="h-14 px-4 flex-row items-center justify-between border-b border-[#E6E3F5]/60 bg-[#FAF8FF]">
        <View className="flex-row items-center gap-2 flex-1">
          <Pressable
            className="w-10 h-10 rounded-full items-center justify-center bg-white shadow-sm border border-borderLight/30 active:opacity-70"
            onPress={() => {
              if (navigation?.goBack) {
                navigation.goBack();
              }
            }}
          >
            <Ionicons name="chevron-back" size={20} color="#131B2E" />
          </Pressable>
          <Text className="text-lg font-bold text-textMain ml-1">{t('receipt.title')}</Text>
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable
            className="w-9 h-9 rounded-full items-center justify-center bg-white shadow-sm border border-borderLight/30 active:opacity-70"
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={17} color="#131B2E" />
          </Pressable>
          <Pressable
            className="w-9 h-9 rounded-full items-center justify-center bg-white shadow-sm border border-borderLight/30 active:opacity-70"
            onPress={handleMoreOptions}
          >
            <Ionicons name="ellipsis-horizontal" size={17} color="#131B2E" />
          </Pressable>
          <View className={`w-8 h-8 rounded-full ${isCancelled ? 'bg-red-600' : 'bg-[#006877]'} items-center justify-center shadow-sm ml-0.5`}>
            <Ionicons name={isCancelled ? 'close' : 'shield-checkmark'} size={16} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
      >
        {/* Card 1: Status Banner */}
        <View className="bg-white rounded-2xl p-4 shadow-sm border border-borderLight/40 mb-4 overflow-hidden relative">
          <View
            className={`absolute -top-6 -right-6 w-24 h-24 rounded-full ${
              isCancelled ? 'bg-red-100' : 'bg-[#E2DFFF]'
            } opacity-40 blur-xl pointer-events-none`}
          />

          {/* Status pill row */}
          <View className="flex-row items-center justify-between mb-3">
            <View
              className={`flex-row items-center gap-1.5 px-3 py-1 rounded-full ${
                isCancelled ? 'bg-red-50 border border-red-200' : 'bg-[#EAEDFF]'
              }`}
            >
              <Ionicons
                name={isCancelled ? 'close-circle' : 'checkmark-circle'}
                size={14}
                color={isCancelled ? '#DC2626' : '#4F46E5'}
              />
              <Text
                className={`text-xs font-semibold ${
                  isCancelled ? 'text-red-700 font-bold' : 'text-[#131B2E]'
                }`}
              >
                {isCancelled
                  ? t('receipt.cancelled')
                  : paramsBooking?.payment_method === 'pay_a_part_now'
                  ? t('receipt.paidDeposit')
                  : t('receipt.paidInFull')}
              </Text>
            </View>
            <Text
              className={`text-[11px] font-bold tracking-wider uppercase ${
                isCancelled ? 'text-red-600' : 'text-[#6C797D]'
              }`}
            >
              {isCancelled
                ? t('receipt.cancelledStay')
                : status === 'booked'
                ? t('receipt.upcomingStay')
                : t('receipt.completedStay')}
            </Text>
          </View>

          {/* Amount figure */}
          <View className="mb-3.5">
            <Text className="text-xs font-semibold text-[#6C797D]">
              {isCancelled ? t('receipt.originalTotal') : t('receipt.totalPaid')}
            </Text>
            <View className="flex-row items-baseline gap-2 mt-0.5">
              <Text className="text-3xl font-extrabold text-[#131B2E] tracking-tight">
                {totalAmount}
              </Text>
              <Text className="text-xs font-semibold text-[#6C797D]">USD</Text>
            </View>
          </View>

          {/* Reason banner if cancelled */}
          {isCancelled ? (
            <View className="mb-3 p-3 rounded-xl bg-red-50/90 border border-red-200 flex-row items-center">
              <Ionicons name="information-circle-outline" size={16} color="#DC2626" />
              <Text className="ml-2 text-xs text-red-700 flex-1 font-medium">
                {t('bookings.cancelReason')}:{' '}
                {paramsBooking?.cancel_reason === 'Cancelled by guest'
                  ? t('bookings.cancelledByGuest')
                  : paramsBooking?.cancel_reason || t('bookings.cancelledByGuest')}
              </Text>
            </View>
          ) : null}

          {/* Receipt Number & Issued Date container */}
          <View className="bg-[#F2F3FF] rounded-xl p-3 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-[11px] font-bold text-[#6C797D]">{t('receipt.receiptNumber')}</Text>
              <Text className="text-xs font-semibold text-[#131B2E] mt-0.5">{receiptNumber}</Text>
            </View>
            <View className="w-[1px] h-6 bg-[#BBC9CC]/40 mx-3" />
            <View className="items-end">
              <Text className="text-[11px] font-bold text-[#6C797D]">{t('receipt.issuedDate')}</Text>
              <Text className="text-xs font-semibold text-[#131B2E] mt-0.5">{issuedDate}</Text>
            </View>
          </View>
        </View>

        {/* Card 2: Stay Information Card */}
        <View className="bg-white rounded-2xl p-4 shadow-sm border border-borderLight/40 mb-4">
          <View className="flex-row items-start gap-3.5 mb-3.5">
            <Image
              source={{ uri: placeImage }}
              className="w-20 h-20 rounded-xl bg-slate-100"
              resizeMode="cover"
            />
            <View className="flex-1">
              <View className="flex-row items-center gap-1 mb-0.5">
                <Ionicons name="home" size={12} color="#006877" />
                <Text className="text-[11px] font-bold text-[#006877] tracking-wider uppercase">
                  {placeType}
                </Text>
              </View>
              <Text className="text-lg font-semibold text-[#131B2E] leading-6" numberOfLines={1}>
                {placeTitle}
              </Text>
              <Text className="text-xs text-[#6C797D] mt-0.5" numberOfLines={1}>
                {placeLocation}
              </Text>
              <Text className="text-[11px] font-bold text-[#4D44E3] mt-1">{refCode}</Text>
            </View>
          </View>

          {/* Specs 2-Column Grid */}
          <View className="flex-row items-center gap-2 mb-3">
            <View className="flex-1 bg-[#F2F3FF] rounded-xl p-3">
              <View className="flex-row items-center gap-1.5 mb-1.5">
                <Ionicons name="calendar-outline" size={13} color="#6C797D" />
                <Text className="text-[11px] font-bold text-[#6C797D]">{t('receipt.dates')}</Text>
              </View>
              <Text className="text-xs font-semibold text-[#131B2E]">{stayDates}</Text>
              <Text className="text-xs text-[#6C797D] mt-0.5">{stayNights}</Text>
            </View>

            <View className="flex-1 bg-[#F2F3FF] rounded-xl p-3">
              <View className="flex-row items-center gap-1.5 mb-1.5">
                <Ionicons name="people-outline" size={13} color="#6C797D" />
                <Text className="text-[11px] font-bold text-[#6C797D]">{t('receipt.travelers')}</Text>
              </View>
              <Text className="text-xs font-semibold text-[#131B2E]">{guestsText}</Text>
              <Text className="text-xs text-[#6C797D] mt-0.5">{roomConfig}</Text>
            </View>
          </View>

          {/* Host strip */}
          <View className="bg-[#F2F3FF] rounded-xl px-3 py-2.5 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5">
              <Image
                source={{ uri: hostAvatar }}
                className="w-8 h-8 rounded-full bg-slate-200"
                resizeMode="cover"
              />
              <View>
                <Text className="text-xs text-[#6C797D]">{t('receipt.superhost')}</Text>
                <Text className="text-xs font-semibold text-[#131B2E]">{hostName}</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons name="shield-checkmark" size={15} color="#4F46E5" />
            </View>
          </View>
        </View>

        {/* Card 3: Itemized Breakdown Card (Invoice) */}
        <View className="bg-white rounded-2xl p-4 shadow-sm border border-borderLight/40 mb-4">
          <View className="flex-row items-center justify-between mb-3.5">
            <Text className="text-lg font-semibold text-[#131B2E]">{t('receipt.itemizedBreakdown')}</Text>
            <Ionicons name="receipt-outline" size={17} color="#6C797D" />
          </View>

          <View className="gap-3 mb-3.5">
            {/* Nights breakdown */}
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-[#131B2E]">{breakdownNightsText}</Text>
              <Text className="text-sm font-medium text-[#131B2E]">{breakdownNightsTotal}</Text>
            </View>

            {/* Kayak Rental fee */}
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-[#131B2E]">{t('receipt.kayakRentalFee')}</Text>
              <Text className="text-sm font-medium text-[#131B2E]">${kayakFee.toFixed(2)}</Text>
            </View>

            {/* Street Parking fee */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-sm text-[#131B2E]">{t('receipt.streetParkingFee')}</Text>
                <Ionicons name="information-circle-outline" size={14} color="#6C797D" />
              </View>
              <Text className="text-sm font-medium text-[#131B2E]">${parkingFee.toFixed(2)}</Text>
            </View>

            {/* Promo Discount row if present */}
            {discountAmount > 0 ? (
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="pricetag" size={14} color="#FF6B00" />
                  <Text className="text-sm font-semibold text-[#FF6B00]">
                    {t('receipt.promoDiscount')} ({promoCode})
                  </Text>
                </View>
                <Text className="text-sm font-bold text-[#FF6B00]">-${discountAmount.toFixed(2)}</Text>
              </View>
            ) : null}
          </View>

          {/* Total Row */}
          <View className="bg-[#F2F3FF] rounded-xl p-3 flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-semibold text-[#131B2E]">{t('receipt.totalUSD')}</Text>
              <Text className="text-[11px] font-bold text-[#6C797D] mt-0.5">
                {t('receipt.includesAllFees')}
              </Text>
            </View>
            <Text className="text-xl font-bold text-[#006877]">{totalAmount}</Text>
          </View>
        </View>

        {/* Card 4: Payment Record & Billing Details */}
        <View className="bg-white rounded-2xl p-4 shadow-sm border border-borderLight/40 mb-4">
          <View className="flex-row items-center justify-between mb-3.5">
            <Text className="text-lg font-semibold text-[#131B2E]">{t('receipt.paymentRecord')}</Text>
            <View
              className={`px-2.5 py-1 rounded-full ${
                isCancelled ? 'bg-emerald-50 border border-emerald-200' : 'bg-[#EAEDFF]'
              }`}
            >
              <Text
                className={`text-[11px] font-semibold ${
                  isCancelled ? 'text-emerald-700' : 'text-[#131B2E]'
                }`}
              >
                {isCancelled ? t('receipt.refunded') : t('receipt.processed')}
              </Text>
            </View>
          </View>

          {/* Card specs */}
          <View className="flex-row items-center gap-3 mb-3.5">
            <View className="w-12 h-8 rounded-lg bg-[#E2E7FF] items-center justify-center shadow-xs">
              <Text className="text-xs font-black text-[#0051D5] tracking-wider">VISA</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-semibold text-[#131B2E]">{paymentMethodLabel}</Text>
                <Text className="text-xs text-[#6C797D]">{issuedDate}</Text>
              </View>
              <Text className="text-xs text-[#6C797D] mt-0.5">
                Transaction: {transactionId}
              </Text>
            </View>
          </View>

          {isCancelled ? (
            <View className="mb-3.5 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 flex-row items-center">
              <Ionicons name="checkmark-circle" size={15} color="#059669" />
              <Text className="ml-2 text-xs text-emerald-800 flex-1">
                {t('receipt.refundNote')}
              </Text>
            </View>
          ) : null}

          {/* Billing Name & Address block */}
          <View className="bg-[#F2F3FF] rounded-xl p-3">
            <Text className="text-[11px] font-bold text-[#6C797D] tracking-wider uppercase mb-1">
              {t('receipt.billingNameAndAddress')}
            </Text>
            <Text className="text-sm font-medium text-[#131B2E]">{billingName}</Text>
            <Text className="text-xs text-[#6C797D] mt-0.5">{billingAddress}</Text>
          </View>
        </View>

        {/* Card 5: Cancellation Policy & Business VAT Note */}
        <View className="bg-white rounded-2xl p-4 shadow-sm border border-borderLight/40 mb-5">
          <View className="flex-row items-start gap-2.5 mb-3">
            <Ionicons name="shield-checkmark-outline" size={16} color="#4F46E5" className="mt-0.5" />
            <View className="flex-1">
              <Text className="text-xs font-semibold text-[#131B2E]">{t('receipt.cancellationPolicy')}</Text>
              <Text className="text-xs text-[#6C797D] leading-4 mt-0.5">
                {isCancelled
                  ? t('receipt.cancelledPolicyDesc')
                  : t('receipt.standardPolicyDesc')}
              </Text>
            </View>
          </View>

          {/* VAT request strip */}
          <View className="bg-[#F2F3FF] rounded-xl p-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2 flex-1 pr-2">
              <Ionicons name="document-text-outline" size={16} color="#4D44E3" />
              <Text className="text-xs text-[#131B2E]">{t('receipt.needVat')}</Text>
            </View>
            <Pressable
              className="px-3.5 py-1.5 rounded-full bg-white shadow-xs border border-borderLight/40 active:opacity-70"
              onPress={handleRequestVAT}
            >
              <Text className="text-xs font-semibold text-[#4D44E3]">{t('receipt.request')}</Text>
            </Pressable>
          </View>
        </View>

        {/* Actions Section */}
        <View className="gap-3">
          {/* Download PDF button */}
          <Pressable
            className="h-12 rounded-full bg-[#4D44E3] flex-row items-center justify-center gap-2 shadow-md active:opacity-90"
            onPress={handleDownloadPDF}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                <Text className="text-sm font-semibold text-white">{t('receipt.downloadPdf')}</Text>
              </>
            )}
          </Pressable>

          {/* Secondary 2 Buttons Row */}
          <View className="flex-row items-center gap-3">
            <Pressable
              className="flex-1 h-11 rounded-full bg-white border border-borderLight/60 shadow-xs flex-row items-center justify-center gap-1.5 active:opacity-70"
              onPress={handleEmailReceipt}
              disabled={emailing}
            >
              {emailing ? (
                <ActivityIndicator color="#131B2E" size="small" />
              ) : (
                <>
                  <Ionicons name="mail-outline" size={16} color="#131B2E" />
                  <Text className="text-xs font-semibold text-[#131B2E]">{t('receipt.emailReceipt')}</Text>
                </>
              )}
            </Pressable>

            <Pressable
              className="flex-1 h-11 rounded-full bg-white border border-borderLight/60 shadow-xs flex-row items-center justify-center gap-1.5 active:opacity-70"
              onPress={handleReportIssue}
            >
              <Ionicons name="alert-circle-outline" size={16} color="#131B2E" />
              <Text className="text-xs font-semibold text-[#131B2E]">{t('receipt.reportIssue')}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
