import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getSmartKeyDetails, SmartKeyInfo } from '../../services/smartKeyService';
import { exportSmartKeyGuidePDF } from '../../services/pdfService';

interface SmartKeyScreenProps {
  navigation?: any;
  route?: {
    params?: {
      booking?: any;
    };
  };
}

export default function SmartKeyScreen({ navigation, route }: SmartKeyScreenProps) {
  const data: SmartKeyInfo = getSmartKeyDetails(route?.params?.booking);

  const [unlocking, setUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [downloadingGuide, setDownloadingGuide] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({
        title: `Check-in & Smart Key - ${data.placeTitle}`,
        message: `WanderStay Check-In Details for ${data.placeTitle} (${data.refCode})\n` +
          `Door PIN: ${data.pinCode}\n` +
          `WiFi: ${data.wifiSSID} | Password: ${data.wifiPassword}\n` +
          `Address: ${data.address}\n` +
          `Check-in: ${data.checkInDate} (${data.checkInTime})`,
      });
    } catch {
      // Dismissed
    }
  };

  const handleMoreOptions = () => {
    Alert.alert('Smart Key Options', `Booking ${data.refCode}`, [
      {
        text: 'Copy Door PIN',
        onPress: () => Alert.alert('Copied', `Door PIN ${data.pinCode} copied to clipboard.`),
      },
      {
        text: 'Copy WiFi Credentials',
        onPress: () =>
          Alert.alert(
            'Copied',
            `WiFi: ${data.wifiSSID}\nPassword: ${data.wifiPassword} copied to clipboard.`
          ),
      },
      {
        text: `Liên hệ chủ nhà ${data.hostName}`,
        onPress: handleMessageHost,
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleCopyPIN = () => {
    Alert.alert('PIN Copied', `Keypad code ${data.pinCode} copied to clipboard.`);
  };

  const handleCopyWiFi = (type: 'SSID' | 'Password', value: string) => {
    Alert.alert('Copied', `${type}: "${value}" copied to clipboard.`);
  };

  const handleBluetoothUnlock = () => {
    if (unlocked) {
      Alert.alert('Unlocked', 'Main Bamboo Gate is already unlocked.');
      return;
    }

    setUnlocking(true);
    setTimeout(() => {
      setUnlocking(false);
      setUnlocked(true);
      Alert.alert(
        'Door Unlocked! 🔓',
        'Smart lock verified via Bluetooth LE. The Main Bamboo Gate latch is now open for 30 seconds.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset unlock after 30s
              setTimeout(() => setUnlocked(false), 30000);
            },
          },
        ]
      );
    }, 1200);
  };

  const handleCallHost = () => {
    Alert.alert(
      'Call Host',
      `Would you like to call ${data.hostName} at ${data.hostPhone || '+62 812 3456 7890'}?`,
      [
        { text: 'Call Now', onPress: () => {} },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleMessageHost = () => {
    if (navigation?.navigate) {
      navigation.navigate('HostChat', { booking: route?.params?.booking });
    } else {
      Alert.alert('Message Host', `Open chat session with ${data.hostName}.`);
    }
  };

  const handleOpenMaps = () => {
    Alert.alert(
      'Open in Maps',
      `Launching navigation to ${data.placeTitle} at ${data.address}...`,
      [{ text: 'Open' }, { text: 'Cancel', style: 'cancel' }]
    );
  };

  const handleDownloadOfflineGuide = async () => {
    try {
      setDownloadingGuide(true);
      const res = await exportSmartKeyGuidePDF(data, true);
      setDownloadingGuide(false);
      if (!res.success && res.error && !res.error.includes('canceled') && !res.error.includes('dismissed')) {
        Alert.alert('Thông báo', res.error);
      }
    } catch {
      setDownloadingGuide(false);
    }
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
          <Text className="text-lg font-bold text-textMain ml-1">Check In Details</Text>
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
          <View className="w-8 h-8 rounded-full bg-[#006877] items-center justify-center shadow-sm ml-0.5">
            <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 }}
      >
        {/* Reservation Badge & Host Header */}
        <View className="flex-row items-center justify-between mb-3.5 px-0.5">
          <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-[#E2E7FF]">
            <View className="w-2 h-2 rounded-full bg-[#006877]" />
            <Text className="text-[11px] font-bold text-[#131B2E] tracking-wider uppercase">
              BOOKING {data.refCode}
            </Text>
          </View>

          <View className="flex-row items-center gap-1 px-3 py-1 rounded-full bg-[#A2EEFF]">
            <Ionicons name="time-outline" size={12} color="#001F25" />
            <Text className="text-[11px] font-bold text-[#001F25]">In 5 Days</Text>
          </View>
        </View>

        {/* Card 1: Top Reservation Banner Card */}
        <View className="bg-white rounded-xl p-4 shadow-sm border border-borderLight/40 mb-4">
          <View className="flex-row items-start gap-3.5 mb-3.5">
            <View className="w-24 h-24 rounded-lg bg-[#EAEDFF] overflow-hidden relative">
              <Image
                source={{ uri: data.image }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-white/90">
                <Text className="text-[9px] font-bold text-[#131B2E]">VERIFIED</Text>
              </View>
            </View>

            <View className="flex-1 justify-center">
              <View className="flex-row items-center gap-1 mb-0.5">
                <Ionicons name="leaf" size={12} color="#006877" />
                <Text className="text-[11px] font-bold text-[#006877] tracking-wider uppercase">
                  {data.category}
                </Text>
              </View>
              <Text className="text-lg font-semibold text-[#131B2E] leading-6" numberOfLines={1}>
                {data.placeTitle}
              </Text>
              <View className="flex-row items-center gap-1 mt-0.5">
                <Ionicons name="location-outline" size={12} color="#3C494C" />
                <Text className="text-xs text-[#3C494C]" numberOfLines={1}>
                  {data.placeLocation}
                </Text>
              </View>
              <View className="mt-2 flex-row items-center">
                <View className="px-2 py-0.5 rounded bg-[#EAEDFF]">
                  <Text className="text-[11px] font-bold text-[#3C494C]">Superhost Stay</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Schedule Timetable Segment */}
          <View className="bg-[#F2F3FF] rounded-lg p-2.5 flex-row items-center justify-between">
            {/* Check-In */}
            <View className="flex-1 pr-2">
              <View className="flex-row items-center gap-1 mb-0.5">
                <Ionicons name="log-in-outline" size={13} color="#3C494C" />
                <Text className="text-[11px] font-bold text-[#3C494C] uppercase">CHECK-IN</Text>
              </View>
              <Text className="text-sm font-semibold text-[#131B2E]">{data.checkInDate}</Text>
              <Text className="text-xs text-[#3C494C] mt-0.5">{data.checkInTime}</Text>
            </View>

            <View className="w-[1px] h-10 bg-[#BBC9CC]/30 mx-2" />

            {/* Check-Out */}
            <View className="flex-1 pl-2">
              <View className="flex-row items-center gap-1 mb-0.5">
                <Ionicons name="log-out-outline" size={13} color="#3C494C" />
                <Text className="text-[11px] font-bold text-[#3C494C] uppercase">CHECK-OUT</Text>
              </View>
              <Text className="text-sm font-semibold text-[#131B2E]">{data.checkOutDate}</Text>
              <Text className="text-xs text-[#3C494C] mt-0.5">{data.checkOutTime}</Text>
            </View>
          </View>
        </View>

        {/* Card 2: Digital Smart Key & Passcode Card (Hero Deck) */}
        <View className="bg-white rounded-xl p-4 shadow-md border border-borderLight/40 mb-4 overflow-hidden relative">
          {/* Ambient Glow */}
          <View className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#A2EEFF]/30 blur-2xl pointer-events-none" />

          {/* Keyless header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-[#00BDD6]/20 items-center justify-center">
                <Ionicons name="key" size={15} color="#006877" />
              </View>
              <Text className="text-sm font-semibold text-[#131B2E]">Keyless Smart Access</Text>
            </View>

            <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-[#EAEDFF]">
              <View className={`w-1.5 h-1.5 rounded-full ${unlocked ? 'bg-emerald-500' : 'bg-[#006877]'}`} />
              <Text className="text-[11px] font-bold text-[#3C494C]">
                {unlocked ? 'Unlocked' : 'Sync Ready'}
              </Text>
            </View>
          </View>

          {/* PIN Display Section */}
          <View className="bg-[#F2F3FF] rounded-lg p-4 items-center mb-3">
            <Text className="text-[11px] font-bold text-[#3C494C] tracking-widest uppercase mb-2">
              ENTRY DOOR PIN CODE
            </Text>

            {/* 5 Distinct PIN Blocks */}
            <View className="flex-row items-center gap-2 pb-2">
              {data.pinCode.replace('#', '').split('').map((digit, idx) => (
                <View
                  key={idx}
                  className="w-12 h-14 rounded-lg bg-white shadow-xs items-center justify-center border border-borderLight/30"
                >
                  <Text className="text-3xl font-bold text-[#131B2E]">{digit}</Text>
                </View>
              ))}
              <View className="w-12 h-14 rounded-lg bg-white shadow-xs items-center justify-center border border-borderLight/30">
                <Text className="text-3xl font-bold text-[#006877]">#</Text>
              </View>
            </View>

            {/* Copy Keypad PIN */}
            <Pressable
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#DAE2FD] active:opacity-70 mt-1"
              onPress={handleCopyPIN}
            >
              <Ionicons name="copy-outline" size={13} color="#131B2E" />
              <Text className="text-[11px] font-bold text-[#131B2E]">Copy Keypad PIN</Text>
            </Pressable>
          </View>

          {/* Timing Note strip */}
          <View className="bg-[#E2E7FF]/60 rounded-lg p-2.5 flex-row items-center gap-2 mb-3.5">
            <Ionicons name="time-outline" size={15} color="#006877" />
            <Text className="text-xs text-[#131B2E] flex-1">
              {data.activeStatusMessage}
            </Text>
          </View>

          {/* Quick Action Buttons */}
          <View className="gap-2">
            <Pressable
              className={`h-12 rounded-full flex-row items-center justify-center gap-2 shadow-sm active:opacity-90 ${
                unlocked ? 'bg-emerald-600' : 'bg-[#006877]'
              }`}
              onPress={handleBluetoothUnlock}
              disabled={unlocking}
            >
              {unlocking ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons
                    name={unlocked ? 'lock-open-outline' : 'bluetooth-outline'}
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text className="text-sm font-semibold text-white">
                    {unlocked ? 'Door Unlocked (Tap to Lock)' : 'Tap to Unlock via Bluetooth'}
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              className="h-12 rounded-full bg-[#E2E7FF] flex-row items-center justify-center gap-2 active:opacity-80"
              onPress={() => setQrModalVisible(true)}
            >
              <Ionicons name="qr-code-outline" size={18} color="#131B2E" />
              <Text className="text-sm font-semibold text-[#131B2E]">Show Gate QR Pass</Text>
            </Pressable>
          </View>
        </View>

        {/* Card 3: WiFi & Amenities Quick Connect Card */}
        <View className="bg-white rounded-xl p-4 shadow-sm border border-borderLight/40 mb-4">
          <View className="flex-row items-center justify-between mb-3.5">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-blue-500/20 items-center justify-center">
                <Ionicons name="wifi" size={16} color="#2563EB" />
              </View>
              <Text className="text-lg font-semibold text-[#131B2E]">Sanctuary WiFi</Text>
            </View>

            <View className="flex-row items-center gap-1">
              <Ionicons name="cellular-outline" size={14} color="#006877" />
              <Text className="text-[11px] font-bold text-[#006877]">Ultra 5G</Text>
            </View>
          </View>

          {/* WiFi credentials strip */}
          <View className="bg-[#F2F3FF] rounded-lg p-2.5 mb-3.5">
            {/* SSID row */}
            <View className="flex-row items-center justify-between pb-2">
              <View>
                <Text className="text-[11px] font-bold text-[#3C494C]">Network Name (SSID)</Text>
                <Text className="text-sm font-semibold text-[#131B2E] mt-0.5">{data.wifiSSID}</Text>
              </View>
              <Pressable
                className="w-9 h-9 rounded-full bg-[#EAEDFF] items-center justify-center active:opacity-70"
                onPress={() => handleCopyWiFi('SSID', data.wifiSSID)}
              >
                <Ionicons name="copy-outline" size={15} color="#131B2E" />
              </Pressable>
            </View>

            <View className="h-[1px] bg-[#E2E7FF] my-1" />

            {/* Password row */}
            <View className="flex-row items-center justify-between pt-2">
              <View>
                <Text className="text-[11px] font-bold text-[#3C494C]">Password</Text>
                <Text className="text-sm font-semibold text-[#131B2E] mt-0.5 font-mono">
                  {data.wifiPassword}
                </Text>
              </View>
              <Pressable
                className="w-9 h-9 rounded-full bg-[#EAEDFF] items-center justify-center active:opacity-70"
                onPress={() => handleCopyWiFi('Password', data.wifiPassword)}
              >
                <Ionicons name="copy-outline" size={15} color="#131B2E" />
              </Pressable>
            </View>
          </View>

          {/* Host contact module */}
          <View className="flex-row items-center justify-between pt-1">
            <View className="flex-row items-center gap-2.5">
              <Image
                source={{ uri: data.hostAvatar }}
                className="w-12 h-12 rounded-full bg-slate-200"
                resizeMode="cover"
              />
              <View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-sm font-semibold text-[#131B2E]">
                    Hosted by {data.hostName}
                  </Text>
                  <Ionicons name="checkmark-circle" size={14} color="#006877" />
                </View>
                <Text className="text-xs text-[#3C494C] mt-0.5">{data.hostReplyTime}</Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              <Pressable
                className="w-10 h-10 rounded-full bg-[#EAEDFF] items-center justify-center active:opacity-70"
                onPress={handleCallHost}
              >
                <Ionicons name="call-outline" size={18} color="#131B2E" />
              </Pressable>
              <Pressable
                className="w-10 h-10 rounded-full bg-[#006877] items-center justify-center shadow-xs active:opacity-70"
                onPress={handleMessageHost}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Card 4: Essential Check-in Instructions */}
        <View className="bg-white rounded-xl p-4 shadow-sm border border-borderLight/40 mb-4">
          <View className="flex-row items-center gap-2 mb-3.5">
            <View className="w-8 h-8 rounded-full bg-[#00BDD6]/20 items-center justify-center">
              <Ionicons name="list" size={16} color="#006877" />
            </View>
            <Text className="text-lg font-semibold text-[#131B2E]">Check-in Steps</Text>
          </View>

          {/* Steps List */}
          <View className="gap-3.5 mb-4">
            {data.checkInSteps.map((s) => (
              <View key={s.step} className="flex-row items-start gap-3">
                <View className="w-6 h-6 rounded-full bg-[#EAEDFF] items-center justify-center mt-0.5">
                  <Text className="text-[11px] font-bold text-[#131B2E]">{s.step}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-[#131B2E]">{s.title}</Text>
                  <Text className="text-xs text-[#3C494C] leading-4 mt-0.5">
                    {s.step === 2 ? (
                      <>
                        Enter PIN{' '}
                        <Text className="font-bold font-mono text-[#131B2E]">{data.pinCode}</Text>
                        {' '}on the keypad handle or use the Bluetooth unlock trigger above.
                      </>
                    ) : (
                      s.description
                    )}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Sanctuary Etiquette */}
          <View className="pt-2 border-t border-borderLight/40">
            <Text className="text-xs font-semibold text-[#3C494C] tracking-wider uppercase mb-2">
              SANCTUARY ETIQUETTE
            </Text>
            <View className="gap-2">
              {data.etiquetteRules.map((rule) => (
                <View
                  key={rule.id}
                  className="bg-[#F2F3FF] rounded-lg p-2.5 flex-row items-center gap-2.5"
                >
                  <Ionicons name={rule.icon as any} size={15} color="#006877" />
                  <Text className="text-xs text-[#131B2E] flex-1 leading-4">{rule.text}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Card 5: Location Map Preview Card */}
        <View className="bg-white rounded-xl p-4 shadow-sm border border-borderLight/40 mb-4">
          <View className="flex-row items-center justify-between mb-2.5">
            <Text className="text-sm font-semibold text-[#131B2E]">Getting There</Text>
            <Pressable
              className="flex-row items-center gap-1 active:opacity-70"
              onPress={handleOpenMaps}
            >
              <Text className="text-[11px] font-bold text-[#006877]">Open in Maps</Text>
              <Ionicons name="open-outline" size={13} color="#006877" />
            </Pressable>
          </View>

          {/* Map Preview image */}
          <View className="h-36 rounded-lg overflow-hidden bg-slate-200 relative mb-2 justify-center items-center">
            <Image
              source={{
                uri: 'https://api.builder.io/api/v1/image/assets/TEMP/f5436b9129dfd139a55180494d30e76e93b4d16e?width=652',
              }}
              className="w-full h-full"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-[#131B2E]/10" />

            {/* Place Pin Badge */}
            <View className="px-3 py-1 rounded-full bg-white shadow-md flex-row items-center gap-1.5 border border-borderLight/40">
              <View className="w-2 h-2 rounded-full bg-[#006877]" />
              <Text className="text-[11px] font-bold text-[#131B2E]">{data.placeTitle}</Text>
            </View>
          </View>

          <Text className="text-xs text-[#3C494C] leading-4">{data.address}</Text>
        </View>

        {/* Primary Bottom Actions */}
        <View className="gap-2.5">
          <Pressable
            className="h-12 rounded-full bg-[#E2E7FF] flex-row items-center justify-center gap-2 active:opacity-80"
            onPress={handleDownloadOfflineGuide}
            disabled={downloadingGuide}
          >
            {downloadingGuide ? (
              <ActivityIndicator color="#131B2E" size="small" />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color="#131B2E" />
                <Text className="text-sm font-semibold text-[#131B2E]">
                  Download Offline Guide (PDF)
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            className="h-12 rounded-full bg-[#006877] flex-row items-center justify-center gap-2 shadow-sm active:opacity-90"
            onPress={handleMessageHost}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
            <Text className="text-sm font-semibold text-white">
              Message Host {data.hostName}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Gate QR Pass Modal */}
      <Modal visible={qrModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl items-center">
            <View className="w-12 h-12 rounded-full bg-[#E2E7FF] items-center justify-center mb-3">
              <Ionicons name="qr-code" size={24} color="#006877" />
            </View>

            <Text className="text-xl font-bold text-textMain text-center">Gate Access Pass</Text>
            <Text className="text-xs text-[#6C797D] text-center mt-1">
              Hold this QR code 10cm away from the Bamboo Gate optical sensor to unlock.
            </Text>

            {/* QR Mockup */}
            <View className="my-6 p-4 bg-[#F8F7FF] rounded-2xl border-2 border-dashed border-[#006877]/30 items-center">
              <View className="w-48 h-48 bg-white rounded-xl items-center justify-center shadow-inner border border-borderLight/60">
                <Ionicons name="qr-code" size={150} color="#131B2E" />
              </View>
              <Text className="text-xs font-mono font-bold text-[#131B2E] mt-3">
                {data.refCode} • PIN {data.pinCode}
              </Text>
            </View>

            <Pressable
              className="w-full h-11 rounded-full bg-[#006877] items-center justify-center active:opacity-90"
              onPress={() => setQrModalVisible(false)}
            >
              <Text className="text-sm font-bold text-white">Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
