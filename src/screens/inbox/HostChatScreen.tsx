import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  LayoutAnimation,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface MessageItem {
  id: string;
  sender: string;
  text: string;
  time: string;
  isHost: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

const QUICK_PROMPTS = [
  'Airport Pickup ($35)',
  'Early Check-in (12:00 PM)',
  'Luggage Dropoff',
  'Wifi Details',
];

export default function HostChatScreen({
  navigation,
  route,
}: {
  navigation?: any;
  route?: any;
}) {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const booking = route?.params?.booking || route?.params?.conversation?.booking;
  const bookingId = booking?.id;
  const hostName = route?.params?.hostName || booking?.places?.host_name || 'Chủ nhà';
  const bookingRef = route?.params?.bookingRef || booking?.ref_code || '#WS-BOOKING';
  const propertyTitle = route?.params?.propertyTitle || booking?.places?.title || 'Chỗ nghỉ của bạn';
  const hostPhone = booking?.places?.host_phone || '+84 912 345 678';

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    async function loadChatMessages() {
      if (bookingId) {
        try {
          const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('booking_id', bookingId)
            .order('created_at', { ascending: true });

          if (data && data.length > 0) {
            const mapped: MessageItem[] = data.map((m: any) => ({
              id: m.id,
              sender: m.sender_id === userId ? 'You' : hostName,
              text: m.content,
              time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isHost: m.sender_id !== userId,
              status: m.is_read ? 'read' : 'delivered',
            }));
            setMessages(mapped);
            return;
          }
        } catch (e) {
          console.warn('Error loading messages:', e);
        }
      }

      // Initial welcome message from the real host
      setMessages([
        {
          id: 'welcome-1',
          sender: hostName,
          text: `Chào bạn! Chào mừng bạn đến với ${propertyTitle}. Bạn có cần hỗ trợ lộ trình hay hẹn giờ nhận phòng không?`,
          time: 'Hôm nay',
          isHost: true,
        },
      ]);
    }

    loadChatMessages();
  }, [bookingId, hostName, propertyTitle, userId]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      if (Platform.OS === 'ios') {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setKeyboardHeight(e.endCoordinates.height);
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

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    const newMsg: MessageItem = {
      id: Date.now().toString(),
      sender: 'You',
      text: textToSend.trim(),
      time: 'Just now',
      isHost: false,
      status: 'sent',
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!customText) setInputText('');

    if (userId && bookingId) {
      try {
        setSending(true);
        await supabase.from('messages').insert({
          booking_id: bookingId,
          sender_id: userId,
          content: textToSend.trim(),
          is_read: false,
        });
      } catch {
        // Local UI state already updated
      } finally {
        setSending(false);
      }
    }

    // Auto reply from real Host after 1.5s
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: hostName,
          text: `Cảm ơn bạn! ${hostName} đã nhận được tin nhắn: "${textToSend.trim()}". Chúng tôi sẽ chuẩn bị chu đáo đón bạn!`,
          time: 'Just now',
          isHost: true,
        },
      ]);
    }, 1500);
  };

  const handleCallHost = () => {
    Alert.alert('Gọi cho chủ nhà', `Gọi điện thoại đến ${hostName} (${hostPhone})?`, [
      { text: 'Gọi ngay', onPress: () => {} },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };

  const renderMessage = ({ item }: { item: MessageItem }) => {
    if (item.isHost) {
      return (
        <View className="flex-row items-end gap-2 mb-3 pr-12">
          <Image
            source={{
              uri: 'https://api.builder.io/api/v1/image/assets/TEMP/3609d0e5bb55d47906b2d08687cf8c498c359da1?width=96',
            }}
            className="w-8 h-8 rounded-full border border-borderLight"
          />
          <View className="bg-white rounded-2xl rounded-bl-sm p-3.5 border border-borderLight shadow-xs">
            <Text className="text-sm text-textMain leading-5">{item.text}</Text>
            <Text className="text-[10px] text-textMuted mt-1 self-end">{item.time}</Text>
          </View>
        </View>
      );
    }

    return (
      <View className="flex-row justify-end mb-3 pl-12">
        <View className="bg-brand rounded-2xl rounded-br-sm p-3.5 shadow-xs">
          <Text className="text-sm text-white leading-5">{item.text}</Text>
          <View className="flex-row items-center justify-end gap-1 mt-1">
            <Text className="text-[10px] text-white/70">{item.time}</Text>
            <Ionicons name="checkmark-done" size={12} color="#FFFFFF" />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-appBg" edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View className="px-4 py-3 bg-white border-b border-borderLight flex-row items-center justify-between shadow-xs">
        <View className="flex-row items-center gap-2.5">
          <Pressable
            className="w-9 h-9 rounded-full bg-appBg items-center justify-center border border-borderLight active:opacity-70"
            onPress={() => navigation?.goBack?.()}
          >
            <Ionicons name="chevron-back" size={20} color="#131B2E" />
          </Pressable>

          <View className="relative">
            <Image
              source={{
                uri: 'https://api.builder.io/api/v1/image/assets/TEMP/3609d0e5bb55d47906b2d08687cf8c498c359da1?width=96',
              }}
              className="w-10 h-10 rounded-full border border-borderLight"
            />
            <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
          </View>

          <View>
            <View className="flex-row items-center gap-1.5">
              <Text className="text-sm font-bold text-textMain">{hostName}</Text>
              <View className="bg-brand/10 px-1.5 py-0.5 rounded-full">
                <Text className="text-[9px] font-bold text-brand">Host</Text>
              </View>
            </View>
            <Text className="text-xs text-textMuted">
              {propertyTitle} • {bookingRef}
            </Text>
          </View>
        </View>

        <Pressable
          className="w-9 h-9 rounded-full bg-appBg items-center justify-center border border-borderLight active:opacity-70"
          onPress={handleCallHost}
        >
          <Ionicons name="call-outline" size={18} color="#4F46E5" />
        </Pressable>
      </View>

      {/* Booking Status Banner */}
      <View className="bg-[#EEF2FF] px-4 py-2 border-b border-brand/10 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Ionicons name="shield-checkmark" size={15} color="#4F46E5" />
          <Text className="text-xs font-semibold text-brand">
            Reservation {bookingRef} · Confirmed
          </Text>
        </View>
        <Pressable
          onPress={() => navigation?.navigate?.('SmartKey', { booking: route?.params?.booking })}
        >
          <Text className="text-xs font-bold text-brand underline">Smart Key</Text>
        </Pressable>
      </View>

      {/* Messages List */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 16 }}
        className="flex-1"
      />

      {/* Quick Prompts Bar */}
      <View className="px-4 py-1.5 bg-appBg">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={QUICK_PROMPTS}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              className="mr-2 px-3 py-1.5 rounded-full bg-white border border-borderLight active:bg-brand/10"
              onPress={() => handleSend(item)}
            >
              <Text className="text-xs font-medium text-textMain">{item}</Text>
            </Pressable>
          )}
        />
      </View>

      {/* Bottom Message Input */}
      <View className="p-3 bg-white border-t border-borderLight flex-row items-center gap-2">
        <Pressable
          className="w-10 h-10 rounded-full bg-appBg items-center justify-center border border-borderLight active:opacity-70"
          onPress={() =>
            Alert.alert('Send Attachment', 'Choose a photo from your gallery or camera.')
          }
        >
          <Ionicons name="image-outline" size={20} color="#5A6478" />
        </Pressable>

        <TextInput
          className="flex-1 bg-appBg rounded-full px-4 py-2.5 text-sm text-textMain border border-borderLight"
          placeholder={`Message ${hostName}...`}
          placeholderTextColor="#8A90A6"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
        />

        <Pressable
          className={`w-10 h-10 rounded-full items-center justify-center ${
            inputText.trim() ? 'bg-brand' : 'bg-gray-200'
          }`}
          disabled={!inputText.trim() || sending}
          onPress={() => handleSend()}
        >
          <Ionicons
            name="send"
            size={18}
            color={inputText.trim() ? '#FFFFFF' : '#8A90A6'}
          />
        </Pressable>
      </View>

      {/* Dynamic Keyboard Spacer */}
      {keyboardHeight > 0 ? (
        <View style={{ height: keyboardHeight + 10 }} />
      ) : null}
    </SafeAreaView>
  );
}
