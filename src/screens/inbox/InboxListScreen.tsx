import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  ConversationItem,
  DEFAULT_CONVERSATIONS,
  markConversationAsRead,
} from '../../services/inboxService';
import { useAuth } from '../../context/AuthContext';

type FilterType = 'All' | 'Hosts' | 'Support' | 'Unread';

export default function InboxListScreen({ navigation: propNavigation }: { navigation?: any } = {}) {
  const hookNavigation = useNavigation<any>();
  const navigation = propNavigation || hookNavigation;
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [conversations, setConversations] = useState<ConversationItem[]>(DEFAULT_CONVERSATIONS);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [composeModalVisible, setComposeModalVisible] = useState(false);
  const [composeRecipient, setComposeRecipient] = useState('');
  const [composeMessage, setComposeMessage] = useState('');

  // Counts for filter pills
  const allCount = conversations.length;
  const hostsCount = conversations.filter((c) => c.type === 'host').length;
  const supportCount = conversations.filter((c) => c.type === 'support').length;
  const unreadCount = conversations.filter((c) => c.unreadCount > 0).length;

  const filteredConversations = conversations.filter((item) => {
    // Filter tab
    if (activeFilter === 'Hosts' && item.type !== 'host') return false;
    if (activeFilter === 'Support' && item.type !== 'support') return false;
    if (activeFilter === 'Unread' && item.unreadCount === 0) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchMsg = item.lastMessage.toLowerCase().includes(q);
      const matchTag = item.propertyTag.toLowerCase().includes(q);
      return matchName || matchMsg || matchTag;
    }

    return true;
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 700);
  };

  const handleSelectConversation = (item: ConversationItem) => {
    // Mark as read immediately per BR08
    if (item.unreadCount > 0) {
      setConversations((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, unreadCount: 0 } : c))
      );
      markConversationAsRead(item.id, userId);
    }

    if (item.type === 'support') {
      if (navigation?.navigate) {
        navigation.navigate('TravelAssistant', { conversation: item });
      } else {
        Alert.alert('WanderStay Support', 'Connecting to 24/7 Virtual Assistant...');
      }
    } else {
      if (navigation?.navigate) {
        navigation.navigate('HostChat', {
          conversation: item,
          hostName: item.name,
          bookingRef: item.bookingRef,
        });
      } else {
        Alert.alert(`Chat with ${item.name}`, `Opening direct message thread (${item.propertyTag})`);
      }
    }
  };

  const handleSendNewMessage = () => {
    if (!composeRecipient.trim() || !composeMessage.trim()) {
      Alert.alert('Required Fields', 'Please select a recipient and enter a message.');
      return;
    }

    const newConv: ConversationItem = {
      id: `conv-${Date.now()}`,
      name: composeRecipient.trim(),
      avatar:
        'https://api.builder.io/api/v1/image/assets/TEMP/3609d0e5bb55d47906b2d08687cf8c498c359da1?width=96',
      isOnline: true,
      type: 'host',
      propertyTag: 'Active Inquiry',
      lastMessage: composeMessage.trim(),
      lastMessageTime: 'Just now',
      unreadCount: 0,
    };

    setConversations((prev) => [newConv, ...prev]);
    setComposeModalVisible(false);
    setComposeRecipient('');
    setComposeMessage('');
    Alert.alert('Message Sent', `Your message to ${composeRecipient} has been sent.`);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FF]" edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View className="h-14 px-4 flex-row items-center justify-between border-b border-[#E6E3F5]/80 bg-[#F8F7FF]/90">
        <Pressable
          className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
          onPress={() => {
            if (navigation?.goBack) {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="chevron-back" size={20} color="#131B2E" />
        </Pressable>

        <Text className="text-lg font-bold text-textMain">Messages</Text>

        <View className="flex-row items-center gap-1.5">
          <Pressable
            className="w-9 h-9 rounded-full items-center justify-center active:opacity-70"
            onPress={() => {
              Alert.alert('Message Settings', 'Manage notifications and message archiving.', [
                {
                  text: 'Mark all as read',
                  onPress: () =>
                    setConversations((prev) => prev.map((c) => ({ ...c, unreadCount: 0 }))),
                },
                { text: 'Close', style: 'cancel' },
              ]);
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color="#131B2E" />
          </Pressable>

          <Pressable
            className="w-8 h-8 rounded-full bg-[#4F46E5] items-center justify-center shadow-xs active:opacity-80"
            onPress={() => setComposeModalVisible(true)}
          >
            <Ionicons name="create-outline" size={15} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 110 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
        }
        ListHeaderComponent={
          <View className="gap-4 mb-4">
            {/* Title & Action Buttons Row */}
            <View className="flex-row items-center justify-between pt-1">
              <View>
                <Text className="text-2xl font-bold text-textMain tracking-tight">Messages</Text>
                <Text className="text-xs text-[#3C494C] mt-0.5">
                  Chat with your hosts and support
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Pressable
                  className="w-10 h-10 rounded-full bg-white shadow-xs border border-borderLight/40 items-center justify-center active:opacity-70"
                  onPress={() => {
                    Alert.alert('Filter', 'Filter messages by date or booking reference.');
                  }}
                >
                  <Ionicons name="options-outline" size={18} color="#131B2E" />
                </Pressable>

                <Pressable
                  className="w-10 h-10 rounded-full bg-[#4D44E3] shadow-sm items-center justify-center active:opacity-90"
                  onPress={() => setComposeModalVisible(true)}
                >
                  <Ionicons name="pencil" size={17} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>

            {/* Search Input Bar */}
            <View className="relative justify-center">
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search messages or hosts..."
                placeholderTextColor="#6C797D"
                className="h-11 rounded-full bg-white px-10 text-sm text-[#131B2E] shadow-xs border border-borderLight/40"
              />
              <View className="absolute left-3.5">
                <Ionicons name="search-outline" size={16} color="#6C797D" />
              </View>
              {searchQuery.length > 0 ? (
                <Pressable className="absolute right-3.5" onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="#6C797D" />
                </Pressable>
              ) : null}
            </View>

            {/* Pill Filters */}
            <View className="flex-row items-center gap-2 py-0.5">
              {/* All */}
              <Pressable
                className={`px-3.5 py-1.5 rounded-full shadow-xs active:opacity-80 ${
                  activeFilter === 'All' ? 'bg-[#4D44E3]' : 'bg-white border border-borderLight/40'
                }`}
                onPress={() => setActiveFilter('All')}
              >
                <Text
                  className={`text-xs font-semibold ${
                    activeFilter === 'All' ? 'text-white' : 'text-[#3C494C]'
                  }`}
                >
                  All ({allCount})
                </Text>
              </Pressable>

              {/* Hosts */}
              <Pressable
                className={`px-3.5 py-1.5 rounded-full shadow-xs active:opacity-80 ${
                  activeFilter === 'Hosts' ? 'bg-[#4D44E3]' : 'bg-white border border-borderLight/40'
                }`}
                onPress={() => setActiveFilter('Hosts')}
              >
                <Text
                  className={`text-xs font-semibold ${
                    activeFilter === 'Hosts' ? 'text-white' : 'text-[#3C494C]'
                  }`}
                >
                  Hosts ({hostsCount})
                </Text>
              </Pressable>

              {/* Support */}
              <Pressable
                className={`px-3.5 py-1.5 rounded-full shadow-xs active:opacity-80 ${
                  activeFilter === 'Support'
                    ? 'bg-[#4D44E3]'
                    : 'bg-white border border-borderLight/40'
                }`}
                onPress={() => setActiveFilter('Support')}
              >
                <Text
                  className={`text-xs font-semibold ${
                    activeFilter === 'Support' ? 'text-white' : 'text-[#3C494C]'
                  }`}
                >
                  Support ({supportCount})
                </Text>
              </Pressable>

              {/* Unread */}
              <Pressable
                className={`px-3.5 py-1.5 rounded-full shadow-xs flex-row items-center gap-1.5 active:opacity-80 ${
                  activeFilter === 'Unread'
                    ? 'bg-[#4D44E3]'
                    : 'bg-white border border-borderLight/40'
                }`}
                onPress={() => setActiveFilter('Unread')}
              >
                <Text
                  className={`text-xs font-semibold ${
                    activeFilter === 'Unread' ? 'text-white' : 'text-[#3C494C]'
                  }`}
                >
                  Unread ({unreadCount})
                </Text>
                {unreadCount > 0 ? (
                  <View
                    className={`w-1.5 h-1.5 rounded-full ${
                      activeFilter === 'Unread' ? 'bg-white' : 'bg-[#4D44E3]'
                    }`}
                  />
                ) : null}
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const isUnread = item.unreadCount > 0;
          return (
            <Pressable
              className="bg-white rounded-xl p-4 shadow-sm border border-borderLight/40 mb-2.5 flex-row items-start gap-3 active:bg-slate-50"
              onPress={() => handleSelectConversation(item)}
            >
              {/* Avatar + Online Indicator */}
              <View className="relative">
                {item.type === 'support' ? (
                  <View className="w-12 h-12 rounded-full bg-[#4D44E3] items-center justify-center shadow-xs">
                    <Ionicons name="headset-outline" size={24} color="#FFFFFF" />
                  </View>
                ) : (
                  <Image
                    source={{ uri: item.avatar }}
                    className="w-12 h-12 rounded-full bg-slate-200"
                    resizeMode="cover"
                  />
                )}

                {item.isOnline ? (
                  <View className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                ) : null}
              </View>

              {/* Content Column */}
              <View className="flex-1">
                {/* Header Row: Name & Time */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1">
                    <Text className="text-base font-semibold text-[#131B2E]" numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.isVerified ? (
                      <Ionicons name="checkmark-circle" size={14} color="#006877" />
                    ) : null}
                  </View>
                  <Text
                    className={`text-[11px] font-bold ${
                      isUnread ? 'text-[#4D44E3]' : 'text-[#6C797D]'
                    }`}
                  >
                    {item.lastMessageTime}
                  </Text>
                </View>

                {/* Property Tag */}
                <View className="flex-row items-center mt-1 mb-1">
                  <View
                    className={`px-2 py-0.5 rounded-full flex-row items-center gap-1 ${
                      item.type === 'support' ? 'bg-[#DBE1FF]' : 'bg-[#EAEDFF]'
                    }`}
                  >
                    <Ionicons
                      name={item.type === 'support' ? 'shield-checkmark' : 'home-outline'}
                      size={10}
                      color={item.type === 'support' ? '#00174B' : '#3C494C'}
                    />
                    <Text
                      className={`text-[11px] font-bold ${
                        item.type === 'support' ? 'text-[#00174B]' : 'text-[#3C494C]'
                      }`}
                    >
                      {item.propertyTag}
                    </Text>
                  </View>
                </View>

                {/* Message preview snippet */}
                <Text
                  className={`text-sm ${
                    isUnread ? 'font-semibold text-[#131B2E]' : 'font-normal text-[#3C494C]'
                  }`}
                  numberOfLines={1}
                >
                  {item.lastMessage}
                </Text>
              </View>

              {/* Right Side: Unread Badge or Chevron */}
              <View className="items-center justify-center self-center pl-1">
                {isUnread ? (
                  <View className="w-5 h-5 rounded-full bg-[#4D44E3] items-center justify-center shadow-xs">
                    <Text className="text-[11px] font-bold text-white">{item.unreadCount}</Text>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={16} color="#BBC9CC" />
                )}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View className="items-center justify-center py-12 px-6">
            <View className="w-16 h-16 rounded-full bg-[#EAEDFF] items-center justify-center mb-3">
              <Ionicons name="chatbubbles-outline" size={28} color="#4F46E5" />
            </View>
            <Text className="text-base font-bold text-textMain text-center">No messages found</Text>
            <Text className="text-xs text-[#6C797D] text-center mt-1">
              Try adjusting your search query or switching between filter tabs.
            </Text>
          </View>
        }
      />

      {/* Compose Message Modal */}
      <Modal visible={composeModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 shadow-2xl">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-textMain">New Message</Text>
              <Pressable
                className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                onPress={() => setComposeModalVisible(false)}
              >
                <Ionicons name="close" size={18} color="#131B2E" />
              </Pressable>
            </View>

            <View className="gap-3.5 mb-6">
              <View>
                <Text className="text-xs font-semibold text-[#6C797D] mb-1">To Host or Contact</Text>
                <TextInput
                  value={composeRecipient}
                  onChangeText={setComposeRecipient}
                  placeholder="e.g. Wayan Sutama"
                  placeholderTextColor="#8A90A6"
                  className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-[#6C797D] mb-1">Message</Text>
                <TextInput
                  value={composeMessage}
                  onChangeText={setComposeMessage}
                  placeholder="Write your inquiry or question..."
                  placeholderTextColor="#8A90A6"
                  multiline
                  numberOfLines={4}
                  style={{ textAlignVertical: 'top' }}
                  className="h-28 rounded-xl bg-[#F8F7FF] p-3.5 border border-borderLight text-sm text-[#131B2E]"
                />
              </View>
            </View>

            <Pressable
              className="h-12 rounded-full bg-[#4D44E3] items-center justify-center shadow-sm active:opacity-90"
              onPress={handleSendNewMessage}
            >
              <Text className="text-sm font-semibold text-white">Send Message</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
