import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface DirectionsScreenProps {
  navigation?: any;
  route?: {
    params?: {
      booking?: any;
    };
  };
}

export default function DirectionsScreen({ navigation, route }: DirectionsScreenProps) {
  const [sharingLocation, setSharingLocation] = useState(false);

  const booking = route?.params?.booking;
  const place = booking?.places;
  const placeTitle = place?.title || 'Balian Treehouse Escape';
  const placeLocation = place?.location || 'Tabanan Regency, West Bali';
  const address = place?.address || place?.location || 'Jl. Pantai Balian No. 18, Banjar Pengembungan, Tabanan, Bali 82162, Indonesia';
  const hostName = place?.host_name || 'Wayan Sutama';
  const hostPhone = place?.host_phone || '+62 812 3456 7890';
  const pinCode = booking?.pin_code || place?.smart_lock_pin || '4821#';
  const gpsCoords = '-8.5029° S, 114.9684° E';
  const latitude = -8.5029;
  const longitude = 114.9684;

  const handleShare = async () => {
    try {
      await Share.share({
        title: `Directions to ${placeTitle}`,
        message:
          `WanderStay Directions & Arrival Guide for ${placeTitle}\n` +
          `Address: ${address}\n` +
          `GPS: ${gpsCoords}\n` +
          `Google Maps: https://maps.google.com/?q=${latitude},${longitude}\n` +
          `Landmark Gate Code: ${pinCode}`,
      });
    } catch {
      // Dismissed
    }
  };

  const handleMoreOptions = () => {
    Alert.alert('Directions Options', placeTitle, [
      {
        text: 'Copy Full Address',
        onPress: () => Alert.alert('Copied', 'Address copied to clipboard.'),
      },
      {
        text: 'Copy GPS Coordinates',
        onPress: () => Alert.alert('Copied', `${gpsCoords} copied to clipboard.`),
      },
      {
        text: `Message Host ${hostName}`,
        onPress: handleBookTransfer,
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleCopy = (label: string, text: string) => {
    Alert.alert('Copied', `${label} copied to clipboard:\n${text}`);
  };

  const handleOpenGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Maps', `Navigating to ${latitude}, ${longitude}`);
    });
  };

  const handleOpenAppleMaps = () => {
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}`,
      default: `https://maps.apple.com/?daddr=${latitude},${longitude}`,
    });
    Linking.openURL(url!).catch(() => {
      Alert.alert('Maps', `Navigating to ${latitude}, ${longitude}`);
    });
  };

  const handleBookTransfer = () => {
    if (navigation?.navigate) {
      navigation.navigate('HostChat', {
        booking,
        initialMessage: `Hi ${hostName}, I would like to request the $35 USD private airport SUV transfer from DPS airport.`,
      });
    } else {
      Alert.alert('Book Transfer', 'Transfer request dispatched to host Wayan via inbox message.');
    }
  };

  const handleShareLocationWithHost = () => {
    setSharingLocation(true);
    setTimeout(() => {
      setSharingLocation(false);
      Alert.alert(
        `Location Shared with ${hostName}`,
        `Your live GPS tracking coordinates and estimated arrival time have been shared with ${hostName}. They will be ready to greet you at the entrance.`,
        [{ text: 'OK' }]
      );
    }, 1000);
  };

  const handleCallHost = () => {
    Alert.alert('Call Host', `Calling ${hostName} / Assigned Driver (${hostPhone})...`, [
      { text: 'Call Now', onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);
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
          <Text className="text-lg font-bold text-textMain ml-1">Directions</Text>
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
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Immersive Stay Visual Banner */}
        <View className="h-56 w-full bg-[#EAEDFF] relative overflow-hidden justify-end">
          <Image
            source={{
              uri: 'https://api.builder.io/api/v1/image/assets/TEMP/67842cbb68b4febc84144b9a690ffa79b8bd2e2e?width=780',
            }}
            className="absolute inset-0 w-full h-full"
            resizeMode="cover"
          />

          {/* Gradient Overlay for bottom text legibility */}
          <View className="absolute inset-0 bg-gradient-to-t from-[#FAF8FF] via-[#FAF8FF]/40 to-transparent" />

          {/* Banner bottom details */}
          <View className="px-4 pb-4 flex-row items-end justify-between">
            <View className="gap-1 flex-1 pr-2">
              <View className="self-start px-2.5 py-0.5 rounded-full bg-[#4D44E3]/90 backdrop-blur-md flex-row items-center gap-1">
                <Ionicons name="leaf" size={11} color="#FFFFFF" />
                <Text className="text-[11px] font-bold text-white">Eco Sanctuary</Text>
              </View>
              <Text className="text-2xl font-bold text-[#131B2E] tracking-tight">{placeTitle}</Text>
              <View className="flex-row items-center gap-1">
                <Ionicons name="location-outline" size={13} color="#3C494C" />
                <Text className="text-xs text-[#3C494C]">{placeLocation}</Text>
              </View>
            </View>

            {/* Rating badge */}
            <View className="px-2.5 py-1.5 rounded-xl bg-white/90 backdrop-blur-md flex-row items-center gap-1 shadow-sm border border-borderLight/30">
              <Ionicons name="star" size={13} color="#FFB020" />
              <Text className="text-xs font-semibold text-[#131B2E]">4.98</Text>
            </View>
          </View>
        </View>

        {/* Content Container */}
        <View className="px-4 pt-4 gap-6">
          {/* 1. Destination Location Card */}
          <View className="bg-white rounded-xl p-4 shadow-sm border border-borderLight/40 gap-2">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-2">
                <Text className="text-[11px] font-bold text-[#4D44E3] tracking-wider uppercase mb-0.5">
                  PROPERTY ADDRESS
                </Text>
                <Text className="text-sm font-semibold text-[#131B2E] leading-5">
                  {address}
                </Text>
              </View>
              <Pressable
                className="w-10 h-10 rounded-full bg-[#EAEDFF] items-center justify-center shadow-xs active:opacity-70"
                onPress={() => handleCopy('Address', address)}
              >
                <Ionicons name="copy-outline" size={16} color="#4D44E3" />
              </Pressable>
            </View>

            {/* GPS coordinates strip */}
            <View className="bg-[#F2F3FF] rounded-lg px-3 py-2 flex-row items-center justify-between mt-1">
              <View className="flex-row items-center gap-2">
                <Ionicons name="navigate-circle-outline" size={16} color="#3C494C" />
                <Text className="text-[11px] font-bold font-mono text-[#3C494C]">
                  GPS: {gpsCoords}
                </Text>
              </View>
              <Pressable onPress={() => handleCopy('GPS Coordinates', gpsCoords)}>
                <Text className="text-[11px] font-bold text-[#4D44E3]">Copy</Text>
              </Pressable>
            </View>
          </View>

          {/* 2. Interactive Map / Visual Route Mockup Card */}
          <View className="bg-white rounded-xl p-4 shadow-sm border border-borderLight/40 gap-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-full bg-blue-500/20 items-center justify-center">
                  <Ionicons name="map-outline" size={16} color="#2563EB" />
                </View>
                <Text className="text-lg font-semibold text-[#131B2E]">Arrival Route</Text>
              </View>
              <View className="px-2.5 py-0.5 rounded-full bg-[#A2EEFF]/30">
                <Text className="text-[11px] font-bold text-[#006877]">Fastest Path</Text>
              </View>
            </View>

            {/* Visual Route Mockup Box */}
            <View className="h-48 rounded-xl bg-slate-200 overflow-hidden relative justify-end p-3">
              <Image
                source={{
                  uri: 'https://api.builder.io/api/v1/image/assets/TEMP/67842cbb68b4febc84144b9a690ffa79b8bd2e2e?width=780',
                }}
                className="absolute inset-0 w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-[#283044]/30" />

              {/* ETA Badge */}
              <View className="self-start px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur-md flex-row items-center gap-2 shadow-sm">
                <Ionicons name="car-outline" size={15} color="#131B2E" />
                <Text className="text-xs font-semibold text-[#131B2E]">
                  1h 45m from Ngurah Rai (DPS)
                </Text>
              </View>
            </View>

            {/* Quick Nav Buttons */}
            <View className="flex-row items-center gap-2">
              <Pressable
                className="flex-1 py-3 rounded-full bg-[#EAEDFF] shadow-xs flex-row items-center justify-center gap-2 active:opacity-70"
                onPress={handleOpenGoogleMaps}
              >
                <Ionicons name="logo-google" size={15} color="#4D44E3" />
                <Text className="text-xs font-semibold text-[#4D44E3]">Google Maps</Text>
              </Pressable>

              <Pressable
                className="flex-1 py-3 rounded-full bg-[#EAEDFF] shadow-xs flex-row items-center justify-center gap-2 active:opacity-70"
                onPress={handleOpenAppleMaps}
              >
                <Ionicons name="compass-outline" size={15} color="#4D44E3" />
                <Text className="text-xs font-semibold text-[#4D44E3]">Apple Maps</Text>
              </Pressable>
            </View>
          </View>

          {/* 3. Transportation Options */}
          <View className="gap-2">
            <View className="flex-row items-center gap-2 px-1">
              <Ionicons name="car-sport-outline" size={18} color="#131B2E" />
              <Text className="text-lg font-semibold text-[#131B2E]">Transport Options</Text>
            </View>

            <View className="gap-3">
              {/* Option 1: Private Transfer */}
              <View className="bg-white rounded-xl p-4 shadow-sm border border-borderLight/40 flex-row items-start gap-3.5">
                <View className="w-10 h-10 rounded-full bg-[#A2EEFF]/40 items-center justify-center mt-0.5">
                  <Ionicons name="car" size={18} color="#006877" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-lg font-semibold text-[#131B2E]">Private Transfer</Text>
                    <View className="px-2 py-0.5 rounded-full bg-[#A2EEFF]/30">
                      <Text className="text-xs font-semibold text-[#006877]">$35 USD</Text>
                    </View>
                  </View>
                  <Text className="text-sm text-[#3C494C] leading-5 mt-1">
                    Host Wayan arranges air-conditioned private SUV pickup directly from international arrivals holding your custom name board.
                  </Text>
                  <Pressable
                    className="flex-row items-center gap-1 mt-2 self-start active:opacity-70"
                    onPress={handleBookTransfer}
                  >
                    <Text className="text-[11px] font-bold text-[#006877]">Book via host message</Text>
                    <Ionicons name="arrow-forward" size={12} color="#006877" />
                  </Pressable>
                </View>
              </View>

              {/* Option 2: Grab & Gojek Drop-off */}
              <View className="bg-white rounded-xl p-4 shadow-sm border border-borderLight/40 flex-row items-start gap-3.5">
                <View className="w-10 h-10 rounded-full bg-blue-500/20 items-center justify-center mt-0.5">
                  <Ionicons name="navigate-outline" size={18} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-[#131B2E]">Grab & Gojek Drop-off</Text>
                  <Text className="text-sm text-[#3C494C] leading-5 mt-1">
                    Set drop-off point to{' '}
                    <Text className="font-semibold text-[#131B2E]">Surf Cafe Balian Entrance</Text>
                    . The narrow final lane has scooter-only access; walk 90m down the cobblestones to the gate.
                  </Text>
                </View>
              </View>

              {/* Option 3: Driving & Scooter Parking */}
              <View className="bg-white rounded-xl p-4 shadow-sm border border-borderLight/40 flex-row items-start gap-3.5">
                <View className="w-10 h-10 rounded-full bg-[#DAE2FD] items-center justify-center mt-0.5">
                  <Ionicons name="bicycle-outline" size={18} color="#4D44E3" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-lg font-semibold text-[#131B2E]">
                      Driving & Scooter Parking
                    </Text>
                    <Text className="text-[11px] font-bold text-[#4D44E3]">Complimentary</Text>
                  </View>
                  <Text className="text-sm text-[#3C494C] leading-5 mt-1">
                    Dedicated covered parking directly fronting the private bamboo gate. Safe & monitored 24/7 with CCTV.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 4. Step-by-Step Arrival Photos & Landmarks */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between px-1">
              <View className="flex-row items-center gap-2">
                <Ionicons name="trail-sign-outline" size={18} color="#131B2E" />
                <Text className="text-lg font-semibold text-[#131B2E]">Arrival Landmarks</Text>
              </View>
              <Text className="text-[11px] font-bold text-[#3C494C]">Step 1 to 3</Text>
            </View>

            <View className="gap-4">
              {/* Landmark 1 */}
              <View className="bg-white rounded-xl shadow-sm border border-borderLight/40 overflow-hidden">
                <View className="h-36 bg-[#EAEDFF] relative">
                  <Image
                    source={{
                      uri: 'https://api.builder.io/api/v1/image/assets/TEMP/b1c1048b59e50d32b278d55334d5ab8f5761f63b?width=716',
                    }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <View className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md shadow-xs">
                    <Text className="text-[11px] font-bold text-[#131B2E]">01 • Coastal Turn</Text>
                  </View>
                </View>
                <View className="p-4 gap-1">
                  <Text className="text-lg font-semibold text-[#131B2E]">
                    Turn Right at Balian Surfer Bar
                  </Text>
                  <Text className="text-sm text-[#3C494C] leading-5">
                    Veer right from the main asphalt road onto the paved stone alleyway right after the surfboard rack.
                  </Text>
                </View>
              </View>

              {/* Landmark 2 */}
              <View className="bg-white rounded-xl shadow-sm border border-borderLight/40 overflow-hidden">
                <View className="h-36 bg-[#EAEDFF] relative">
                  <Image
                    source={{
                      uri: 'https://api.builder.io/api/v1/image/assets/TEMP/da17325d3c4e503a9b1c3c2a8ce71594c6b929a7?width=716',
                    }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <View className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md shadow-xs">
                    <Text className="text-[11px] font-bold text-[#131B2E]">02 • Trail Marker</Text>
                  </View>
                </View>
                <View className="p-4 gap-1">
                  <Text className="text-lg font-semibold text-[#131B2E]">
                    Spot the Carved Wooden Sign
                  </Text>
                  <Text className="text-sm text-[#3C494C] leading-5">
                    Look for the engraved sign{' '}
                    <Text className="font-semibold text-[#4D44E3]">"WanderStay — Balian Haven"</Text>
                    {' '}affixed to the mossy stone pillar under the frangipani tree.
                  </Text>
                </View>
              </View>

              {/* Landmark 3 */}
              <View className="bg-white rounded-xl shadow-sm border border-borderLight/40 overflow-hidden">
                <View className="h-36 bg-[#EAEDFF] relative">
                  <Image
                    source={{
                      uri: 'https://api.builder.io/api/v1/image/assets/TEMP/dcbac9c31411b2f18796462c0c13460b5bfd7fd1?width=716',
                    }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <View className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md shadow-xs">
                    <Text className="text-[11px] font-bold text-[#131B2E]">03 • Gate Entry</Text>
                  </View>
                </View>
                <View className="p-4 gap-1">
                  <Text className="text-lg font-semibold text-[#131B2E]">
                    Bamboo Gate & Keypad
                  </Text>
                  <View className="flex-row items-center flex-wrap gap-1">
                    <Text className="text-sm text-[#3C494C] leading-5">
                      Locate the digital keybox mounted on the left bamboo post. Code:
                    </Text>
                    <View className="px-1.5 py-0.5 rounded bg-[#EAEDFF]">
                      <Text className="text-sm font-bold font-mono text-[#131B2E]">{pinCode}</Text>
                    </View>
                    <Text className="text-sm text-[#3C494C]">.</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* 5. Host Contact for Arrival Assistance */}
          <View className="bg-white rounded-xl p-4 shadow-md border border-borderLight/40 gap-4">
            <View className="flex-row items-center gap-3.5">
              <View className="relative">
                <Image
                  source={{
                    uri: 'https://api.builder.io/api/v1/image/assets/TEMP/14c4dc4d168a75a153fb184fe7fde82bc7ee2b3c?width=112',
                  }}
                  className="w-14 h-14 rounded-full bg-slate-200"
                  resizeMode="cover"
                />
                <View className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#A2EEFF] border-2 border-white items-center justify-center">
                  <View className="w-2 h-2 rounded-full bg-[#006877]" />
                </View>
              </View>

              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-lg font-semibold text-[#131B2E]">{hostName}</Text>
                  <Ionicons name="checkmark-circle" size={16} color="#006877" />
                </View>
                <Text className="text-xs text-[#3C494C]">Your On-Site Concierge & Host</Text>
                <Text className="text-[11px] font-bold text-[#006877] mt-0.5">
                  Will meet in person or guide remotely
                </Text>
              </View>
            </View>

            {/* Contact Actions */}
            <View className="gap-2.5">
              <Pressable
                className="h-12 rounded-full bg-[#4D44E3] flex-row items-center justify-center gap-2 shadow-sm active:opacity-90"
                onPress={handleShareLocationWithHost}
                disabled={sharingLocation}
              >
                {sharingLocation ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="paper-plane-outline" size={17} color="#FFFFFF" />
                    <Text className="text-sm font-semibold text-white">
                      Share Location with Wayan
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                className="h-12 rounded-full bg-[#EAEDFF] flex-row items-center justify-center gap-2 active:opacity-80"
                onPress={handleCallHost}
              >
                <Ionicons name="call-outline" size={17} color="#131B2E" />
                <Text className="text-sm font-semibold text-[#131B2E]">
                  Call Host / Assigned Driver
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Helpful Arrival Tip Pill */}
          <View className="bg-[#F2F3FF] rounded-xl p-4 flex-row items-start gap-3 border border-borderLight/40">
            <Ionicons name="bulb-outline" size={18} color="#4D44E3" className="mt-0.5" />
            <Text className="text-xs text-[#3C494C] leading-5 flex-1">
              <Text className="font-bold text-[#131B2E]">Offline Tip: </Text>
              Cell reception can get spotty around the river valley. Save these landmarks offline and take a screenshot of your lockbox passcode before departure.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
