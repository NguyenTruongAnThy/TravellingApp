import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  SEPAY_CONFIG,
  buildSepayQrUrl,
  checkBookingPaymentStatus,
  formatVnd,
  getDemoPaymentAmountVnd,
  simulateConfirmPayment,
} from '../services/sepayService';
import { supabase } from '../lib/supabase';

interface SepayQrModalProps {
  visible: boolean;
  onClose: () => void;
  booking: any;
  dueAmountVnd: number;
  dueAmountUsd: number;
  onPaymentSuccess: (booking: any) => void;
  onBookingExpired?: (bookingId: string) => void;
}

export default function SepayQrModal({
  visible,
  onClose,
  booking,
  dueAmountVnd,
  dueAmountUsd,
  onPaymentSuccess,
  onBookingExpired,
}: SepayQrModalProps) {
  const { t } = useTranslation();
  const [checking, setChecking] = useState(false);
  const [countdown, setCountdown] = useState(600); // Đếm ngược thời gian từ lúc tạo giao dịch
  const timerRef = useRef<any>(null);
  const hasExpiredRef = useRef(false);

  const cleanRefCode = booking?.ref_code
    ? String(booking.ref_code).replace(/[^a-zA-Z0-9]/g, '')
    : `WS${Date.now().toString().slice(-6)}`;

  // Thuật toán giảm giá khi quét mã QR demo (ví dụ: 1.500.000 VNĐ -> 1.500 VNĐ)
  const demoAmountVnd = getDemoPaymentAmountVnd(dueAmountVnd);
  const qrUrl = buildSepayQrUrl(demoAmountVnd, cleanRefCode);

  const handleExpired = async () => {
    if (hasExpiredRef.current) return;
    hasExpiredRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    if (booking?.id) {
      try {
        await supabase.from('bookings').delete().eq('id', booking.id);
      } catch (err) {
        console.warn('Could not auto-delete expired booking from database:', err);
      }
      onBookingExpired?.(booking.id);
    }

    Alert.alert(
      t('bookings.expiredTitle', { defaultValue: 'Hết thời gian thanh toán' }),
      t('bookings.expiredDesc', {
        defaultValue: 'Giao dịch chưa thanh toán đã hết hạn (10 phút) và tự động bị hủy khỏi hệ thống.',
      })
    );
    onClose();
  };

  // Đếm ngược chính xác kể từ thời điểm tạo giao dịch (booking.created_at)
  useEffect(() => {
    if (!visible) return;
    hasExpiredRef.current = false;

    const calcRemainingSeconds = () => {
      const TOTAL_TIMEOUT = 600; // 10 phút đếm ngược (600 giây)
      if (!booking?.created_at) return TOTAL_TIMEOUT;
      const createdAtMs = new Date(booking.created_at).getTime();
      const nowMs = Date.now();
      const elapsedSec = Math.max(0, Math.floor((nowMs - createdAtMs) / 1000));
      const remaining = TOTAL_TIMEOUT - elapsedSec;
      return remaining > 0 ? remaining : 0;
    };

    const initialRem = calcRemainingSeconds();
    if (initialRem <= 0) {
      handleExpired();
      return;
    }

    setCountdown(initialRem);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, booking?.created_at, booking?.id]);

  // Lắng nghe Supabase Realtime khi Webhook cập nhật đơn hàng thành "paid"
  useEffect(() => {
    if (!visible || !booking?.id) return;

    console.log(`Bắt đầu lắng nghe Realtime cho booking ID: ${booking.id}`);
    const channel = supabase
      .channel(`sepay-payment-${booking.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${booking.id}`,
        },
        (payload) => {
          console.log('Realtime nhận được sự kiện cập nhật booking:', payload);
          if (payload.new && payload.new.payment_status === 'paid') {
            console.log('Đã phát hiện thanh toán thành công qua Webhook Realtime!');
            onPaymentSuccess({ ...booking, ...payload.new });
          }
        }
      )
      .subscribe();

    // Polling dự phòng mỗi 4 giây phòng khi Realtime bị chặn mạng
    const pollInterval = setInterval(async () => {
      const isPaid = await checkBookingPaymentStatus(booking.id);
      if (isPaid) {
        clearInterval(pollInterval);
        channel.unsubscribe();
        onPaymentSuccess({ ...booking, payment_status: 'paid', status: 'booked' });
      }
    }, 4000);

    return () => {
      channel.unsubscribe();
      clearInterval(pollInterval);
    };
  }, [visible, booking?.id, onPaymentSuccess]);

  const handleCopy = (label: string, textToCopy: string) => {
    Alert.alert('Đã sao chép', `${label}: ${textToCopy} đã được sao chép vào bộ nhớ tạm.`);
  };

  const handleCheckNow = async () => {
    if (!booking?.id) return;
    setChecking(true);
    const isPaid = await checkBookingPaymentStatus(booking.id);
    setChecking(false);

    if (isPaid) {
      onPaymentSuccess({ ...booking, payment_status: 'paid', status: 'booked' });
      return;
    }

    // Nếu webhook chưa kịp về hoặc đang thử nghiệm
    Alert.alert(
      'Kiểm tra giao dịch SePay',
      `Hệ thống chưa nhận được thông báo từ ngân hàng BIDV cho mã "${cleanRefCode}".\n\nNếu bạn đã chuyển khoản thành công trên app ngân hàng, bạn có muốn xác nhận ngay bây giờ không?`,
      [
        {
          text: 'Chờ thêm chút',
          style: 'cancel',
        },
        {
          text: 'Xác nhận ngay',
          onPress: async () => {
            setChecking(true);
            const res = await simulateConfirmPayment(booking.id);
            setChecking(false);
            if (res.success) {
              onPaymentSuccess({ ...booking, payment_status: 'paid', status: 'booked' });
            } else {
              Alert.alert('Lỗi', 'Không thể cập nhật trạng thái đơn đặt phòng.');
            }
          },
        },
      ]
    );
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-[#F8F7FF]" edges={['top', 'left', 'right', 'bottom']}>
        {/* Header Modal */}
        <View className="h-14 px-4 flex-row items-center justify-between border-b border-borderLight bg-white">
          <View className="flex-row items-center">
            <View
              className="w-8 h-8 rounded-xl items-center justify-center mr-2"
              style={{ backgroundColor: '#EEF2FF' }}
            >
              <Ionicons name="qr-code" size={18} color="#4F46E5" />
            </View>
            <View>
              <Text className="text-base font-bold text-textMain">Thanh toán VietQR SePay</Text>
              <Text className="text-[11px] text-textMuted">Tự động xác nhận 100% qua Ngân hàng</Text>
            </View>
          </View>

          <Pressable
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
          >
            <Ionicons name="close" size={20} color="#131B2E" />
          </Pressable>
        </View>

        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          {/* Thẻ thông tin Ngân hàng BIDV */}
          <View className="bg-white rounded-3xl p-4 border border-borderLight shadow-sm mb-4">
            <View className="flex-row items-center justify-between pb-3 border-b border-borderLight">
              <View className="flex-row items-center">
                <View
                  className="w-9 h-9 rounded-2xl items-center justify-center mr-2.5"
                  style={{ backgroundColor: '#006B68' }}
                >
                  <Text className="text-xs font-black text-white">BIDV</Text>
                </View>
                <View>
                  <Text className="text-sm font-extrabold text-[#006B68]">BIDV</Text>
                  <Text className="text-[11px] text-textMuted">
                    {SEPAY_CONFIG.BANK_NAME}
                  </Text>
                </View>
              </View>
            </View>

            {/* Chủ tài khoản & STK */}
            <View className="pt-3">
              <Text className="text-[11px] text-textMuted uppercase font-medium">
                Chủ tài khoản
              </Text>
              <Text className="text-sm font-bold text-textMain mt-0.5">
                {SEPAY_CONFIG.ACCOUNT_NAME}
              </Text>

              <View className="flex-row items-center justify-between mt-2.5 bg-appBg p-3 rounded-2xl border border-borderLight">
                <View>
                  <Text className="text-[10px] text-textMuted uppercase font-semibold">
                    Số tài khoản BIDV
                  </Text>
                  <Text className="text-base font-black text-brand tracking-wider">
                    {SEPAY_CONFIG.ACCOUNT_NUMBER}
                  </Text>
                </View>

                <Pressable
                  onPress={() => handleCopy('Số tài khoản', SEPAY_CONFIG.ACCOUNT_NUMBER)}
                  className="flex-row items-center px-3 py-1.5 rounded-full bg-white border border-brand/30 shadow-xs"
                >
                  <Ionicons name="copy-outline" size={13} color="#4F46E5" />
                  <Text className="ml-1 text-xs font-bold text-brand">Sao chép</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Khung quét mã VietQR */}
          <View className="bg-white rounded-3xl p-5 border border-borderLight shadow-sm items-center mb-4">
            <Text className="text-sm font-bold text-textMain">Quét mã QR để thanh toán</Text>
            <Text className="text-xs text-textMuted mt-0.5 text-center">
              Mở ứng dụng Ngân hàng bất kỳ (BIDV, VCB, MB, Techcombank...) để quét mã
            </Text>

            {/* Mã VietQR SePay */}
            <View
              className="p-3 bg-white rounded-2xl border-2 border-brand/20 my-3.5 items-center justify-center shadow-md"
              style={{ width: 230, height: 230 }}
            >
              <Image
                source={{ uri: qrUrl }}
                style={{ width: 206, height: 206 }}
                resizeMode="contain"
              />
            </View>

            {/* Trạng thái chờ và đồng hồ đếm ngược */}
            <View className="flex-row items-center bg-indigo-50 px-3.5 py-1.5 rounded-full">
              <ActivityIndicator size="small" color="#4F46E5" style={{ marginRight: 6 }} />
              <Text className="text-xs font-bold text-brand">
                Đang chờ chuyển khoản • {formatTimer(countdown)}
              </Text>
            </View>
          </View>

          {/* Chi tiết chuyển khoản chính xác */}
          <View className="bg-white rounded-3xl p-4 border border-borderLight shadow-sm mb-5">
            <Text className="text-sm font-bold text-textMain mb-2.5">
              Thông tin giao dịch chính xác
            </Text>

            {/* Số tiền cần chuyển */}
            <View className="flex-row items-center justify-between py-2 border-b border-borderLight">
              <View>
                <Text className="text-xs text-textMuted">Số tiền cần chuyển:</Text>
                <Text className="text-lg font-black text-[#FF6B00]">
                  {formatVnd(demoAmountVnd)}
                </Text>
              </View>

              <Pressable
                onPress={() => handleCopy('Số tiền', String(demoAmountVnd))}
                className="flex-row items-center px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200"
              >
                <Ionicons name="copy-outline" size={13} color="#FF6B00" />
                <Text className="ml-1 text-xs font-bold text-[#FF6B00]">Sao chép</Text>
              </Pressable>
            </View>

            {/* Nội dung chuyển khoản */}
            <View className="flex-row items-center justify-between pt-2.5">
              <View className="flex-1 mr-2">
                <Text className="text-xs text-textMuted">Nội dung chuyển khoản (bắt buộc):</Text>
                <Text className="text-base font-black text-brand tracking-wider">
                  {cleanRefCode}
                </Text>
              </View>

              <Pressable
                onPress={() => handleCopy('Nội dung chuyển khoản', cleanRefCode)}
                className="flex-row items-center px-3 py-1.5 rounded-full bg-brand/10 border border-brand/30"
              >
                <Ionicons name="copy-outline" size={13} color="#4F46E5" />
                <Text className="ml-1 text-xs font-bold text-brand">Sao chép</Text>
              </Pressable>
            </View>

            {/* Lưu ý quan trọng */}
            <View className="mt-3.5 p-3 rounded-2xl bg-amber-50 border border-amber-200 flex-row items-start">
              <Ionicons name="warning" size={16} color="#D97706" style={{ marginTop: 2 }} />
              <Text className="ml-2 flex-1 text-[11px] text-amber-800 leading-4">
                <Text className="font-bold">Lưu ý quan trọng:</Text> Vui lòng giữ nguyên nội dung{' '}
                <Text className="font-black text-amber-900">{cleanRefCode}</Text> khi quét QR để
                SePay tự động kích hoạt đơn đặt phòng ngay khi nhận được tiền.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Thanh tác vụ dưới chân màn hình */}
        <View className="p-4 bg-white border-t border-borderLight flex-row items-center justify-between gap-3 shadow-lg">
          <Pressable
            onPress={onClose}
            className="flex-1 py-3 rounded-full bg-gray-100 items-center justify-center active:opacity-80"
          >
            <Text className="text-sm font-bold text-textMuted">Hủy / Để sau</Text>
          </Pressable>

          <Pressable
            onPress={handleCheckNow}
            disabled={checking}
            className="flex-1 py-3 rounded-full bg-brand flex-row items-center justify-center gap-1.5 shadow-md shadow-brand/30 active:opacity-90"
          >
            {checking ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                <Text className="text-sm font-bold text-white">Kiểm tra ngay</Text>
              </>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
