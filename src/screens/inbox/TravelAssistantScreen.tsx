import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { cancelBooking } from '../../services/bookingsService';
import { exportVatInvoicePDF } from '../../services/pdfService';

export interface ActionCardData {
  type: 'cancellation_confirm' | 'booking_card' | 'place_card';
  data: any;
}

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user' | 'agent';
  senderName: string;
  time: string;
  text: string;
  hasAttachment?: boolean;
  attachmentName?: string;
  attachmentSize?: string;
  paymentConfirmed?: {
    amount: string;
    method: string;
  };
  actionCard?: ActionCardData | null;
  executedTools?: string[];
}


interface TravelAssistantScreenProps {
  navigation?: any;
  route?: {
    params?: {
      conversation?: any;
      booking?: any;
    };
  };
}

export default function TravelAssistantScreen({
  navigation,
  route,
}: TravelAssistantScreenProps) {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const userName = session?.user?.user_metadata?.name || 'Bạn';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'bot',
      senderName: 'WanderStay AI',
      time: '11:00 AM',
      text: t('support.welcomeMessage'),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollViewRef = useRef<any>(null);

  const canGoBack = navigation?.canGoBack && navigation.canGoBack();

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      if (Platform.OS === 'ios') {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      if (Platform.OS === 'ios') {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        title: 'WanderStay AI Support',
        message: t('support.shareMessage'),
      });
    } catch {
      // Dismissed
    }
  };

  const handleMoreOptions = () => {
    Alert.alert(t('support.moreOptionsTitle'), t('support.moreOptionsDesc'), [
      {
        text: t('support.downloadVatInvoice'),
        onPress: handleDownloadInvoice,
      },
      {
        text: t('support.switchToAgent'),
        onPress: handleHandoverAgent,
      },
      {
        text: t('support.shareSession'),
        onPress: handleShare,
      },
      { text: t('common.close'), style: 'cancel' },
    ]);
  };

  const handleDownloadInvoice = () => {
    Alert.alert(
      t('support.vatGuideTitle'),
      t('support.vatGuideBody'),
      [
        {
          text: t('support.continueExport'),
          onPress: async () => {
            try {
              setDownloadingInvoice(true);
              const res = await exportVatInvoicePDF(
                route?.params?.booking || {
                  ref_code: '#WS-84920',
                  total: 110,
                  nights: 5,
                  places: { title: 'Balian Treehouse Retreat' },
                },
                i18n.language === 'vi'
              );
              setDownloadingInvoice(false);
              if (!res.success && res.error && !res.error.includes('canceled') && !res.error.includes('dismissed')) {
                Alert.alert(t('common.notice'), res.error);
              }
            } catch {
              setDownloadingInvoice(false);
            }
          },
        },
        { text: t('common.close'), style: 'cancel' },
      ]
    );
  };

  const handleHandoverAgent = () => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const agentMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'agent',
        senderName: t('support.agentName'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: t('support.agentGreeting', { name: userName }),
      };
      setMessages((prev) => [...prev, agentMsg]);
      scrollToBottom();
    }, 800);
  };

  // Xử lý HỦY PHÒNG THẬT từ Action Card của AI
  const handleConfirmCancelBooking = (bookingData: any) => {
    Alert.alert(
      t('support.cancelConfirmTitle'),
      t('support.cancelConfirmDesc', {
        ref: bookingData.refCode,
        place: bookingData.placeTitle,
        fee: bookingData.cancellationFee,
        refund: bookingData.refundAmount,
        policy: bookingData.policy,
      }),
      [
        { text: t('support.thinkAgain'), style: 'cancel' },
        {
          text: t('support.confirmCancel'),
          style: 'destructive',
          onPress: async () => {
            try {
              setCancellingBookingId(bookingData.bookingId);
              const { success, error } = await cancelBooking(
                bookingData.bookingId,
                'Khách hàng hủy qua WanderStay AI Assistant'
              );

              if (success) {
                Alert.alert(
                  t('support.cancelSuccessTitle'),
                  t('support.cancelSuccessDesc', { ref: bookingData.refCode, refund: bookingData.refundAmount })
                );

                // Cập nhật thẻ trên chat sang trạng thái đã hủy
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `msg-${Date.now()}`,
                    sender: 'bot',
                    senderName: 'WanderStay AI',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    text: t('support.cancelSuccessMessage', { ref: bookingData.refCode, refund: bookingData.refundAmount }),
                  },
                ]);
                scrollToBottom();
              } else {
                Alert.alert(t('support.cancelFailedTitle'), t('support.cancelFailedDesc'));
              }
            } catch (err: any) {
              Alert.alert(t('common.error'), err?.message || t('support.cancelErrorDesc'));
            } finally {
              setCancellingBookingId(null);
            }
          },
        },
      ]
    );
  };

  // Gửi tin nhắn và gọi Supabase Edge Function AI Chat với Tool Calling
  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      senderName: t('support.you'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: trimmed,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputText('');
    scrollToBottom();
    setIsTyping(true);

    try {
      // Chuẩn bị lịch sử tin nhắn dạng compact cho AI
      const historyPayload = nextMessages.slice(-6).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      // Gọi Supabase Edge Function ai-chat (Tool Calling server-side)
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          prompt: trimmed,
          userId: userId || undefined,
          messages: historyPayload,
        },
      });

      if (error) {
        throw error;
      }

      const replyText = data?.reply || t('support.defaultReply');
      const actionCard = data?.actionCard || null;
      const executedTools = data?.executedTools || [];

      // Kiểm tra xem có cần đính kèm file hóa đơn nếu user hỏi về VAT invoice
      const lower = trimmed.toLowerCase();
      const isAskingInvoice = lower.includes('hóa đơn') || lower.includes('invoice') || lower.includes('vat');

      const botReply: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        senderName: 'WanderStay AI',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: replyText,
        actionCard,
        executedTools,
        hasAttachment: isAskingInvoice,
        attachmentName: isAskingInvoice ? t('support.vatAttachmentName') : undefined,
        attachmentSize: isAskingInvoice ? '142 KB • VAT Compliant' : undefined,
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err: any) {
      console.warn('Lỗi gọi Supabase Edge Function ai-chat:', err);
      // Fallback thông minh nếu mất kết nối
      const fallbackReply: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        senderName: 'WanderStay AI',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: t('support.fallbackBr05'),
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  };

  const handleQuickChipPress = (chipType: string) => {
    if (chipType === t('support.quickTrip') || chipType === 'Chuyến đi của tôi' || chipType === 'My Bookings') {
      sendMessage(i18n.language === 'vi' ? 'Kiểm tra các chuyến đi tôi đã đặt' : 'Check my booked reservations');
    } else if (chipType === t('support.quickCancel') || chipType === 'Hủy & Hoàn tiền' || chipType === 'Cancel & Refund') {
      sendMessage(i18n.language === 'vi' ? 'Tôi muốn kiểm tra chính sách hủy phòng và số tiền hoàn lại nếu hủy đơn' : 'I want to check the cancellation policy and refund amount');
    } else if (chipType === t('support.quickInvoice') || chipType === 'Hóa đơn VAT' || chipType === 'VAT Invoice') {
      sendMessage(i18n.language === 'vi' ? 'Tôi muốn xuất hóa đơn VAT điện tử cho chuyến đi' : 'I want to request an electronic VAT invoice for my trip');
    } else if (chipType === t('support.quickTransfer') || chipType === 'Xe đón $35' || chipType === 'Xe đưa đón' || chipType === 'Airport Shuttle') {
      sendMessage(i18n.language === 'vi' ? 'Dịch vụ xe riêng đón sân bay $35 USD của Balian Treehouse có tiện ích gì?' : 'What does the $35 USD private airport shuttle include?');
    } else if (chipType === t('support.quickAgent') || chipType === 'Gặp Chuyên viên' || chipType === 'Human Agent') {
      handleHandoverAgent();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FF]" edges={['top', 'left', 'right']}>
        {/* Top Header */}
        <View className="h-16 px-4 flex-row items-center justify-between border-b border-[#E6E3F5] bg-white">
          <View className="flex-row items-center gap-2 flex-1">
            {canGoBack ? (
              <Pressable
                className="w-10 h-10 rounded-full items-center justify-center active:opacity-70 bg-[#F8F7FF] border border-[#E6E3F5]"
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="chevron-back" size={20} color="#131B2E" />
              </Pressable>
            ) : null}

            {/* AI Avatar with Glow & Online Status */}
            <View className="relative">
              <View className="w-10 h-10 rounded-full bg-[#4F46E5] items-center justify-center shadow-xs">
                <Ionicons name="sparkles" size={20} color="#FFFFFF" />
              </View>
              <View className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
            </View>

            {/* Titles */}
            <View className="ml-1 flex-1">
              <Text className="text-base font-bold text-[#131B2E]" numberOfLines={1}>
                {t('support.title')}
              </Text>
              <View className="flex-row items-center gap-1 mt-0.5">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <Text className="text-[11px] font-semibold text-emerald-600">
                  {t('support.onlineStatus')}
                </Text>
              </View>
            </View>
          </View>

          {/* Right Action Icons */}
          <View className="flex-row items-center gap-1.5">
            <Pressable
              className="w-9 h-9 rounded-full bg-[#F8F7FF] border border-[#E6E3F5] items-center justify-center active:opacity-70"
              onPress={() =>
                Alert.alert(
                  i18n.language === 'vi' ? 'Tổng đài 24/7' : '24/7 Hotline',
                  i18n.language === 'vi'
                    ? 'Kết nối đường dây nóng ưu tiên WanderStay Hotline: +84 1900 6868 (Miễn phí cước gọi).'
                    : 'Connect to priority WanderStay Hotline: +84 1900 6868 (Toll-free).'
                )
              }
            >
              <Ionicons name="call-outline" size={17} color="#4F46E5" />
            </Pressable>
            <Pressable
              className="w-9 h-9 rounded-full bg-[#F8F7FF] border border-[#E6E3F5] items-center justify-center active:opacity-70"
              onPress={handleMoreOptions}
            >
              <Ionicons name="ellipsis-horizontal" size={17} color="#131B2E" />
            </Pressable>
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 }}
          onContentSizeChange={scrollToBottom}
        >
          {/* Quick Action Chips Carousel */}
          <View className="mb-3">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              <Pressable
                className="bg-white rounded-full px-3.5 py-2 shadow-xs border border-[#E6E3F5] flex-row items-center gap-1.5 active:opacity-70"
                onPress={() => handleQuickChipPress(t('support.quickTrip'))}
              >
                <Ionicons name="calendar-outline" size={14} color="#4F46E5" />
                <Text className="text-xs font-bold text-[#131B2E]">{t('support.quickTrip')}</Text>
              </Pressable>

              <Pressable
                className="bg-white rounded-full px-3.5 py-2 shadow-xs border border-[#E6E3F5] flex-row items-center gap-1.5 active:opacity-70"
                onPress={() => handleQuickChipPress(t('support.quickCancel'))}
              >
                <Ionicons name="shield-outline" size={14} color="#EF4444" />
                <Text className="text-xs font-bold text-[#131B2E]">{t('support.quickCancel')}</Text>
              </Pressable>

              <Pressable
                className="bg-white rounded-full px-3.5 py-2 shadow-xs border border-[#E6E3F5] flex-row items-center gap-1.5 active:opacity-70"
                onPress={() => handleQuickChipPress(t('support.quickTransfer'))}
              >
                <Ionicons name="car-outline" size={14} color="#4F46E5" />
                <Text className="text-xs font-bold text-[#131B2E]">{t('support.quickTransfer')}</Text>
              </Pressable>

              <Pressable
                className="bg-white rounded-full px-3.5 py-2 shadow-xs border border-[#E6E3F5] flex-row items-center gap-1.5 active:opacity-70"
                onPress={() => handleQuickChipPress(t('support.quickInvoice'))}
              >
                <Ionicons name="receipt-outline" size={14} color="#4F46E5" />
                <Text className="text-xs font-bold text-[#131B2E]">{t('support.quickInvoice')}</Text>
              </Pressable>

              <Pressable
                className="bg-indigo-50 border border-indigo-200 rounded-full px-3.5 py-2 shadow-xs flex-row items-center gap-1.5 active:opacity-70"
                onPress={() => handleQuickChipPress(t('support.quickAgent'))}
              >
                <Ionicons name="person-outline" size={14} color="#4F46E5" />
                <Text className="text-xs font-bold text-[#4F46E5]">{t('support.quickAgent')}</Text>
              </Pressable>
            </ScrollView>
          </View>

          {/* Messages Display */}
          {messages.map((item) => {
            const isUser = item.sender === 'user';
            const isAgent = item.sender === 'agent';
            const actionCard = item.actionCard;

            return (
              <View
                key={item.id}
                className={`mb-4 ${isUser ? 'items-end' : 'items-start'}`}
              >
                <View className={`flex-row items-start gap-2 max-w-[90%] ${isUser ? 'flex-row-reverse' : ''}`}>
                  {/* Sender Avatar */}
                  {!isUser ? (
                    <View
                      className={`w-8 h-8 rounded-full items-center justify-center mt-0.5 shadow-xs ${
                        isAgent ? 'bg-amber-500' : 'bg-[#4F46E5]'
                      }`}
                    >
                      <Ionicons
                        name={isAgent ? 'person' : 'sparkles'}
                        size={14}
                        color="#FFFFFF"
                      />
                    </View>
                  ) : null}

                  <View className="flex-1">
                    {/* Message Bubble */}
                    <View
                      className={`p-3.5 rounded-2xl shadow-xs ${
                        isUser
                          ? 'bg-[#4F46E5] rounded-tr-none'
                          : isAgent
                          ? 'bg-amber-50 border border-amber-200 rounded-tl-none'
                          : 'bg-white border border-[#E6E3F5] rounded-tl-none'
                      }`}
                    >
                      <Text
                        className={`text-sm leading-5 ${
                          isUser ? 'text-white' : 'text-[#131B2E]'
                        }`}
                      >
                        {item.text}
                      </Text>

                      {/* --- RICH UI CARD 1: CANCELLATION & REFUND CARD (Xác nhận hủy phòng) --- */}
                      {actionCard?.type === 'cancellation_confirm' && actionCard.data ? (
                        <View className="mt-3 bg-red-50/80 rounded-2xl p-3 border border-red-200 gap-2">
                          <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center gap-1.5">
                              <Ionicons name="warning-outline" size={16} color="#DC2626" />
                              <Text className="text-xs font-black text-red-700">
                                {t('support.confirmCancelCard', { ref: actionCard.data.refCode })}
                              </Text>
                            </View>
                            <View className="px-2 py-0.5 rounded-full bg-red-100">
                              <Text className="text-[10px] font-extrabold text-red-800">BR05</Text>
                            </View>
                          </View>

                          <Text className="text-xs font-bold text-[#131B2E]">
                            {actionCard.data.placeTitle}
                          </Text>
                          <Text className="text-[11px] text-[#5A6478]">
                            Check-in: {actionCard.data.checkIn} (14:00)
                          </Text>

                          {/* Bảng kê số tiền hoàn & phạt */}
                          <View className="bg-white rounded-xl p-2.5 border border-red-100 gap-1.5 my-1">
                            <View className="flex-row justify-between">
                              <Text className="text-xs text-[#5A6478]">{t('support.originalTotal')}</Text>
                              <Text className="text-xs font-bold text-[#131B2E]">
                                ${actionCard.data.totalAmount} USD
                              </Text>
                            </View>
                            <View className="flex-row justify-between">
                              <Text className="text-xs text-[#5A6478]">{t('support.cancellationFee')}</Text>
                              <Text className="text-xs font-bold text-red-600">
                                -${actionCard.data.cancellationFee} USD
                              </Text>
                            </View>
                            <View className="h-[1px] bg-[#E6E3F5] my-0.5" />
                            <View className="flex-row justify-between items-center">
                              <Text className="text-xs font-bold text-[#131B2E]">{t('support.refundAmount')}</Text>
                              <Text className="text-sm font-black text-emerald-600">
                                +${actionCard.data.refundAmount} USD
                              </Text>
                            </View>
                          </View>

                          <Text className="text-[10px] text-red-700 italic">
                            * {actionCard.data.policy}
                          </Text>

                          {/* Nút bấm hủy phòng */}
                          <Pressable
                            className="mt-1 py-2.5 px-4 rounded-xl bg-red-600 items-center justify-center flex-row gap-2 active:opacity-80"
                            disabled={cancellingBookingId === actionCard.data.bookingId}
                            onPress={() => handleConfirmCancelBooking(actionCard.data)}
                          >
                            {cancellingBookingId === actionCard.data.bookingId ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <>
                                <Ionicons name="trash-outline" size={15} color="#FFFFFF" />
                                <Text className="text-xs font-bold text-white">
                                  {t('support.confirmCancelBooking', { ref: actionCard.data.refCode })}
                                </Text>
                              </>
                            )}
                          </Pressable>
                        </View>
                      ) : null}

                      {/* --- RICH UI CARD 2: BOOKING CARD --- */}
                      {actionCard?.type === 'booking_card' && actionCard.data ? (
                        <View className="mt-3 bg-[#F8F7FF] rounded-2xl p-3 border border-[#E6E3F5] gap-2">
                          <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center gap-1.5">
                              <Ionicons name="checkmark-circle" size={16} color="#059669" />
                              <Text className="text-xs font-black text-brand">
                                {t('support.bookingRef', { ref: actionCard.data.refCode })}
                              </Text>
                            </View>
                            <View className="px-2 py-0.5 rounded-full bg-emerald-100">
                              <Text className="text-[10px] font-bold text-emerald-800 uppercase">
                                {actionCard.data.status}
                              </Text>
                            </View>
                          </View>

                          <View className="flex-row gap-2.5 items-center mt-1">
                            {actionCard.data.image ? (
                              <Image
                                source={{ uri: actionCard.data.image }}
                                className="w-14 h-14 rounded-xl bg-black/10"
                                resizeMode="cover"
                              />
                            ) : null}
                            <View className="flex-1">
                              <Text className="text-xs font-bold text-[#131B2E]" numberOfLines={1}>
                                {actionCard.data.placeTitle}
                              </Text>
                              <Text className="text-[11px] text-[#5A6478] mt-0.5">
                                {actionCard.data.dates} {t('support.bookingNights', { nights: actionCard.data.nights })}
                              </Text>
                              <Text className="text-xs font-black text-brand mt-1">
                                {t('support.bookingTotal', { total: actionCard.data.total })}
                              </Text>
                            </View>
                          </View>

                          <View className="mt-1 bg-white rounded-xl p-2.5 border border-[#E6E3F5] flex-row justify-between items-center">
                            <View className="flex-row items-center gap-1.5">
                              <Ionicons name="key-outline" size={15} color="#4F46E5" />
                              <Text className="text-xs font-semibold text-[#131B2E]">{t('support.smartKeyPin')}</Text>
                            </View>
                            <Text className="text-xs font-black text-brand tracking-widest">
                              {actionCard.data.pinCode}
                            </Text>
                          </View>

                          <Pressable
                            className="mt-1 py-2 px-3 rounded-xl bg-[#4F46E5] items-center justify-center flex-row gap-1.5 active:opacity-80"
                            onPress={() => {
                              if (navigation?.navigate) {
                                navigation.navigate('SmartKey', { booking: actionCard.data });
                              }
                            }}
                          >
                            <Ionicons name="key" size={13} color="#FFFFFF" />
                            <Text className="text-xs font-bold text-white">{t('support.viewSmartKey')}</Text>
                          </Pressable>
                        </View>
                      ) : null}

                      {/* --- RICH UI CARD 3: ATTACHMENT CARD (VAT Invoice) --- */}
                      {item.hasAttachment ? (
                        <View className="mt-2.5 bg-[#F8F7FF] rounded-xl p-2.5 flex-row items-center justify-between border border-[#E6E3F5]">
                          <View className="flex-row items-center gap-2 flex-1 pr-2">
                            <View className="w-9 h-9 rounded-lg bg-indigo-100 items-center justify-center">
                              <Ionicons name="document-text" size={18} color="#4F46E5" />
                            </View>
                            <View className="flex-1">
                              <Text className="text-xs font-bold text-[#131B2E]" numberOfLines={1}>
                                {item.attachmentName}
                              </Text>
                              <Text className="text-[10px] text-[#5A6478] mt-0.5">
                                {item.attachmentSize}
                              </Text>
                            </View>
                          </View>

                          <Pressable
                            className="px-3 py-1.5 rounded-full bg-[#4F46E5] flex-row items-center gap-1 active:opacity-70"
                            onPress={handleDownloadInvoice}
                          >
                            {downloadingInvoice ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <>
                                <Ionicons name="download-outline" size={12} color="#FFFFFF" />
                                <Text className="text-[11px] font-bold text-white">{t('support.download')}</Text>
                              </>
                            )}
                          </Pressable>
                        </View>
                      ) : null}
                    </View>

                    {/* Timestamp & Status */}
                    <View
                      className={`flex-row items-center gap-1 mt-1 ${
                        isUser ? 'justify-end pr-1' : 'pl-1'
                      }`}
                    >
                      <Text className="text-[10px] font-medium text-[#8A90A6]">
                        {item.time} • {item.senderName}
                      </Text>
                      {isUser ? (
                        <Ionicons name="checkmark-done" size={13} color="#4F46E5" />
                      ) : null}
                    </View>
                  </View>
                </View>
              </View>
            );
          })}

          {/* Typing Indicator */}
          {isTyping ? (
            <View className="flex-row items-center gap-2 mb-3 pl-1">
              <View className="w-8 h-8 rounded-full bg-[#4F46E5] items-center justify-center">
                <Ionicons name="sparkles" size={13} color="#FFFFFF" />
              </View>
              <View className="bg-white rounded-2xl rounded-tl-none px-3.5 py-2.5 border border-[#E6E3F5] flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#4F46E5" />
                <Text className="text-xs text-[#5A6478]">{t('support.typing')}</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        {/* Bottom Input Composer */}
        <View className="px-3 pt-2.5 pb-3 bg-white border-t border-[#E6E3F5]">
          {/* Input Bar */}
          <View className="h-12 rounded-full bg-[#F8F7FF] px-2 flex-row items-center gap-1 border border-[#E6E3F5]">
            <Pressable
              className="w-8 h-8 rounded-full items-center justify-center active:opacity-70"
              onPress={() => Alert.alert(t('support.attachTitle'), t('support.attachDesc'))}
            >
              <Ionicons name="attach-outline" size={20} color="#5A6478" />
            </Pressable>

            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={t('support.inputPlaceholder')}
              placeholderTextColor="#8A90A6"
              className="flex-1 h-full text-sm text-[#131B2E]"
              onSubmitEditing={() => sendMessage(inputText)}
              returnKeyType="send"
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 200);
              }}
            />

            <Pressable
              className={`w-9 h-9 rounded-full items-center justify-center shadow-xs active:opacity-80 ${
                inputText.trim() && !isTyping ? 'bg-[#4F46E5]' : 'bg-[#E6E3F5]'
              }`}
              disabled={!inputText.trim() || isTyping}
              onPress={() => sendMessage(inputText)}
            >
              <Ionicons
                name="arrow-up"
                size={18}
                color={inputText.trim() && !isTyping ? '#FFFFFF' : '#8A90A6'}
              />
            </Pressable>
          </View>
        </View>

        {/* Dynamic Keyboard Spacer — Pushes input bar directly on top of keyboard with comfortable margin */}
        {keyboardHeight > 0 ? (
          <View style={{ height: keyboardHeight + 10 }} />
        ) : null}
      </SafeAreaView>
  );
}
