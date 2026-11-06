import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
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
  const [inputText, setInputText] = useState('');
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({
        title: 'WanderStay Support #SUP-84920',
        message:
          'WanderStay Support Case #SUP-84920\nLinked to Balian Treehouse (May 24–29)\nVAT Invoice: Invoice_REC-2024-84920.pdf',
      });
    } catch {
      // Dismissed
    }
  };

  const handleMoreOptions = () => {
    Alert.alert('Support Options', 'Case #SUP-84920', [
      {
        text: 'Download VAT Invoice',
        onPress: handleDownloadInvoice,
      },
      {
        text: 'Request Live Agent Handover',
        onPress: handleHandoverAgent,
      },
      { text: 'Close Case', style: 'destructive', onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleDownloadInvoice = () => {
    setDownloadingInvoice(true);
    setTimeout(() => {
      setDownloadingInvoice(false);
      Alert.alert(
        'Invoice Downloaded',
        'Invoice_REC-2024-84920.pdf (142 KB • VAT Compliant) has been saved to your downloads folder.',
        [{ text: 'OK' }]
      );
    }, 800);
  };

  const handleHandoverAgent = () => {
    Alert.alert(
      'Live Agent Connecting',
      'Support specialist Wayan S. is joining your session. You are connected via WanderStay Secure Gateway.',
      [{ text: 'Great' }]
    );
  };

  const handleQuickChipPress = (chipName: string) => {
    if (chipName === 'Tax Invoice') {
      handleDownloadInvoice();
    } else if (chipName === 'Speak to Agent') {
      handleHandoverAgent();
    } else {
      Alert.alert(chipName, `Inquiry for "${chipName}" sent to WanderStay 24/7 Travel Assistant.`);
    }
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    Alert.alert('Message Sent', `Your inquiry: "${inputText.trim()}" has been recorded for demo.`);
    setInputText('');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAF8FF]" edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View className="h-16 px-4 flex-row items-center justify-between border-b border-[#E6E3F5]/80 bg-[#FAF8FF]/95">
        <View className="flex-row items-center gap-2 flex-1">
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

          {/* Assistant Avatar with Online Dot */}
          <View className="relative">
            <View className="w-10 h-10 rounded-full bg-[#316BF3] items-center justify-center shadow-xs">
              <Ionicons name="headset" size={20} color="#FFFFFF" />
            </View>
            <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#00BDD6] border-2 border-[#FAF8FF]" />
          </View>

          {/* Titles */}
          <View className="ml-1">
            <Text className="text-base font-semibold text-[#131B2E]">Host Support Chat</Text>
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <View className="w-1.5 h-1.5 rounded-full bg-[#00BDD6]" />
              <Text className="text-[11px] font-bold text-[#3C494C]">Online • Host Support</Text>
            </View>
          </View>
        </View>

        {/* Right Header Buttons */}
        <View className="flex-row items-center gap-1">
          <Pressable
            className="w-9 h-9 rounded-full items-center justify-center active:opacity-70"
            onPress={() => Alert.alert('Voice Support', 'Voice call connecting to 24/7 priority line...')}
          >
            <Ionicons name="call-outline" size={18} color="#131B2E" />
          </Pressable>
          <Pressable
            className="w-9 h-9 rounded-full items-center justify-center active:opacity-70"
            onPress={handleMoreOptions}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color="#131B2E" />
          </Pressable>
          <View className="w-8 h-8 rounded-full bg-[#006877] items-center justify-center shadow-xs ml-0.5">
            <Ionicons name="shield-checkmark" size={15} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
        >
          {/* Pinned Case Card */}
          <View className="bg-white rounded-xl p-4 shadow-sm border border-borderLight/40 mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <View className="w-6 h-6 rounded-full bg-[#0051D5] items-center justify-center">
                  <Ionicons name="flash" size={12} color="#FFFFFF" />
                </View>
                <Text className="text-xs font-semibold text-[#131B2E]">WanderStay Support</Text>
                <View className="px-2 py-0.5 rounded-full bg-[#DBE1FF]">
                  <Text className="text-[11px] font-bold text-[#00174B]">24/7 Priority</Text>
                </View>
              </View>
              <Text className="text-[11px] font-bold text-[#3C494C]">#SUP-84920</Text>
            </View>

            {/* Associated Trip Snippet */}
            <View className="bg-[#F2F3FF] rounded-lg p-2.5 flex-row items-center gap-1.5">
              <Ionicons name="link-outline" size={14} color="#3C494C" />
              <Text className="text-xs text-[#3C494C]">
                Linked to <Text className="font-bold text-[#131B2E]">Balian Treehouse</Text> (May 24–29)
              </Text>
            </View>
          </View>

          {/* Time Separator */}
          <View className="items-center my-2">
            <View className="px-3 py-1 rounded-full bg-[#EAEDFF]">
              <Text className="text-[11px] font-bold text-[#6C797D]">Today, 11:00 AM</Text>
            </View>
          </View>

          {/* 1. Bot Welcome Message */}
          <View className="flex-row items-start gap-2 max-w-[90%] mb-3">
            <View className="w-8 h-8 rounded-full bg-[#316BF3] items-center justify-center shadow-xs mt-0.5">
              <Ionicons name="sparkles" size={14} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <View className="bg-white rounded-2xl rounded-tl-none p-4 shadow-xs border border-borderLight/30">
                <Text className="text-sm text-[#131B2E] leading-5">
                  Hello Alex! 👋 I'm your WanderStay Travel Assistant. How can I help you with your upcoming trip to Bali or your account today?
                </Text>
              </View>
              <Text className="text-[11px] font-bold text-[#6C797D] mt-1 ml-1">
                11:00 AM • Automated Assistant
              </Text>
            </View>
          </View>

          {/* Quick Action Chips Carousel */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 40, gap: 8 }}
            className="mb-4"
          >
            <Pressable
              className="bg-white rounded-full px-3 py-2 shadow-xs border border-borderLight/40 flex-row items-center gap-1.5 active:opacity-70"
              onPress={() => handleQuickChipPress('Cancellation & Refund')}
            >
              <Ionicons name="shield-outline" size={14} color="#131B2E" />
              <Text className="text-xs font-semibold text-[#131B2E]">Cancellation & Refund</Text>
            </Pressable>

            <Pressable
              className="bg-white rounded-full px-3 py-2 shadow-xs border border-borderLight/40 flex-row items-center gap-1.5 active:opacity-70"
              onPress={() => handleQuickChipPress('Tax Invoice')}
            >
              <Ionicons name="receipt-outline" size={14} color="#131B2E" />
              <Text className="text-xs font-semibold text-[#131B2E]">Tax Invoice</Text>
            </Pressable>

            <Pressable
              className="bg-white rounded-full px-3 py-2 shadow-xs border border-borderLight/40 flex-row items-center gap-1.5 active:opacity-70"
              onPress={() => handleQuickChipPress('Airport Transfer')}
            >
              <Ionicons name="car-outline" size={14} color="#131B2E" />
              <Text className="text-xs font-semibold text-[#131B2E]">Airport Transfer</Text>
            </Pressable>

            <Pressable
              className="bg-[#DBE1FF] rounded-full px-3 py-2 shadow-xs flex-row items-center gap-1.5 active:opacity-70"
              onPress={() => handleQuickChipPress('Speak to Agent')}
            >
              <Ionicons name="person-outline" size={14} color="#00174B" />
              <Text className="text-xs font-semibold text-[#00174B]">Speak to Agent</Text>
            </Pressable>
          </ScrollView>

          {/* 2. User Message Bubble */}
          <View className="items-end mb-4">
            <View className="max-w-[85%] bg-[#0051D5] rounded-2xl rounded-tr-none p-4 shadow-xs">
              <Text className="text-sm text-white leading-5">
                Can you confirm if my payment of $450 was fully received and send me the business VAT invoice?
              </Text>
            </View>
            <View className="flex-row items-center gap-1 mt-1 mr-1">
              <Text className="text-[11px] font-bold text-[#6C797D]">11:02 AM</Text>
              <Ionicons name="checkmark-done" size={13} color="#0051D5" />
            </View>
          </View>

          {/* 3. Assistant Detailed Response Card */}
          <View className="flex-row items-start gap-2 max-w-[92%] mb-4">
            <View className="w-8 h-8 rounded-full bg-[#316BF3] items-center justify-center shadow-xs mt-0.5">
              <Ionicons name="sparkles" size={14} color="#FFFFFF" />
            </View>

            <View className="flex-1">
              <View className="bg-white rounded-2xl rounded-tl-none p-4 shadow-xs border border-borderLight/30 gap-3">
                {/* Payment Verification Pill */}
                <View className="bg-[#F2F3FF] rounded-lg p-2.5 flex-row items-center gap-2">
                  <Ionicons name="checkmark-circle" size={18} color="#006877" />
                  <View>
                    <Text className="text-xs font-semibold text-[#131B2E]">Payment Confirmed</Text>
                    <Text className="text-xs text-[#3C494C] mt-0.5">
                      $450.00 USD via Visa ••4242
                    </Text>
                  </View>
                </View>

                {/* Document Attachment Card */}
                <View className="bg-[#EAEDFF] rounded-xl p-2.5 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                    <View className="w-10 h-10 rounded-lg bg-[#DAE2FD] items-center justify-center">
                      <Ionicons name="document-text" size={20} color="#0051D5" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-semibold text-[#131B2E]" numberOfLines={1}>
                        Invoice_REC-2024-84920.pdf
                      </Text>
                      <Text className="text-[11px] text-[#6C797D] mt-0.5">
                        142 KB • VAT Compliant
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    className="px-3 py-1.5 rounded-full bg-[#DBE1FF] flex-row items-center gap-1 active:opacity-70"
                    onPress={handleDownloadInvoice}
                  >
                    <Ionicons name="download-outline" size={12} color="#00174B" />
                    <Text className="text-[11px] font-bold text-[#00174B]">Download</Text>
                  </Pressable>
                </View>

                {/* Contextual Notice */}
                <Text className="text-xs text-[#3C494C] leading-4">
                  Need more help? Our live support specialist can join this chat in less than 2 minutes.
                </Text>
              </View>

              <Text className="text-[11px] font-bold text-[#6C797D] mt-1 ml-1">
                11:03 AM • Automated Assistant
              </Text>
            </View>
          </View>

          {/* Live Agent Availability Indicator */}
          <View className="bg-[#F2F3FF] rounded-full px-4 py-2 flex-row items-center gap-2 shadow-xs mb-2">
            <View className="w-2 h-2 rounded-full bg-[#00BDD6]" />
            <Text className="text-[11px] text-[#3C494C] flex-1">
              Support agent <Text className="font-extrabold text-[#131B2E]">Wayan S.</Text> is available. Estimated wait time &lt; 2 mins.
            </Text>
          </View>
        </ScrollView>

        {/* Sticky Bottom Composer Section */}
        <View className="px-4 pb-4 pt-2 bg-[#FAF8FF]/95 border-t border-[#E6E3F5]/80 gap-2">
          {/* Live Agent Presence Mini Bar */}
          <View className="flex-row items-center justify-between px-1">
            <View className="flex-row items-center gap-1.5">
              <View className="w-5 h-5 rounded-full bg-[#DBE1FF] items-center justify-center">
                <Ionicons name="shield-checkmark" size={11} color="#00174B" />
              </View>
              <Text className="text-[11px] font-bold text-[#6C797D]">
                Connected via WanderStay Secure Gateway
              </Text>
            </View>

            <Pressable
              className="flex-row items-center gap-1 active:opacity-70"
              onPress={handleHandoverAgent}
            >
              <Text className="text-[11px] font-bold text-[#0051D5]">Handover</Text>
              <Ionicons name="arrow-forward" size={11} color="#0051D5" />
            </Pressable>
          </View>

          {/* Input Form Bar */}
          <View className="h-12 rounded-full bg-white px-2 flex-row items-center gap-1.5 shadow-xs border border-borderLight/40">
            <Pressable
              className="w-9 h-9 rounded-full items-center justify-center active:opacity-70"
              onPress={() => Alert.alert('Attach File', 'Select document or image to send.')}
            >
              <Ionicons name="attach-outline" size={20} color="#6C797D" />
            </Pressable>

            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Describe your inquiry or question..."
              placeholderTextColor="#6C797D"
              className="flex-1 h-full text-sm text-[#131B2E]"
            />

            <Pressable
              className="w-9 h-9 rounded-full bg-[#0051D5] items-center justify-center shadow-xs active:opacity-80"
              onPress={handleSend}
            >
              <Ionicons name="paper-plane" size={15} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
