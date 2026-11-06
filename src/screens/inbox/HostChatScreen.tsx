import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
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

const DEFAULT_MESSAGES: MessageItem[] = [
  {
    id: 'msg-1',
    sender: 'Wayan Sutama',
    text: 'Om Swastyastu! Welcome to Balian Treehouse. What time do you land in Denpasar?',
    time: '10:15 AM',
    isHost: true,
  },
  {
    id: 'msg-2',
    sender: 'You',
    text: 'Hi Wayan! We land at 12:30 PM. Would love to book the airport pickup ($35).',
    time: '10:22 AM',
    isHost: false,
    status: 'read',
  },
  {
    id: 'msg-3',
    sender: 'Wayan Sutama',
    text: 'Perfect! Driver Ketut will wait for you at Arrival Gate with your name sign. See you soon!',
    time: '10:28 AM',
    isHost: true,
  },
];

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

  const hostName = route?.params?.hostName || 'Wayan Sutama';
  const bookingRef = route?.params?.bookingRef || '#WS-84920';
  const propertyTitle = route?.params?.propertyTitle || 'Balian Treehouse';

  const [messages, setMessages] = useState<MessageItem[]>(DEFAULT_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

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

    // Optional Supabase message sync if active booking exists
    if (userId) {
      try {
        setSending(true);
        const bookingId = route?.params?.booking?.id;
        if (bookingId) {
          await supabase.from('messages').insert({
            booking_id: bookingId,
            sender_id: userId,
            content: textToSend.trim(),
            is_read: false,
          });
        }
      } catch {
        // Local UI state already updated
      } finally {
        setSending(false);
      }
    }

    // Auto simulated reply from Host Wayan after 1.5s
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: hostName,
          text: `Thank you! I received your message: "${textToSend.trim()}". Let me know if you need any fresh coconut or extra towels!`,
          time: 'Just now',
          isHost: true,
        },
      ]);
    }, 1500);
  };

  const handleCallHost = () => {
    Alert.alert('Call Host', `Call ${hostName} (+62 812 3456 7890)?`, [
      { text: 'Call', onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
