import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import {
  getProfile,
  getProfileCounts,
  type ProfileCounts,
} from '../../services/profileService';

interface ProfileScreenProps {
  navigation?: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { session, signOut } = useAuth();
  const userId = session?.user?.id || '';
  const sessionEmail = session?.user?.email || 'alex.morgan@wanderstay.com';

  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<ProfileCounts>({ trips: 8, reviews: 12, wishlists: 2 });
  const [userName, setUserName] = useState('Alex Morgan');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkAppearanceEnabled, setDarkAppearanceEnabled] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const [profile, profileCounts] = await Promise.all([
        getProfile(userId),
        getProfileCounts(userId),
      ]);
      if (profile.data?.name) {
        setUserName(profile.data.name);
      }
      if (profileCounts) {
        setCounts({
          trips: profileCounts.trips || 8,
          reviews: profileCounts.reviews || 12,
          wishlists: profileCounts.wishlists || 2,
        });
      }
    } catch {
      // Keep sensible fallback defaults from Figma design
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleEditPhoto = () => {
    Alert.alert('Change Profile Photo', 'Upload a new avatar or take a photo.', [
      { text: 'Choose from Library', onPress: () => {} },
      { text: 'Take Photo', onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleLearnMoreHost = () => {
    Alert.alert(
      'Switch to Hosting',
      'Become a WanderStay host and share your retreat with travelers worldwide. Host earnings average $1,200/month.',
      [
        { text: 'Get Started', onPress: () => {} },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  const handleCurrencyLanguage = () => {
    Alert.alert('Currency & Language', 'Select your preferred settings:', [
      { text: 'USD ($) • English (US)', onPress: () => {} },
      { text: 'EUR (€) • Français', onPress: () => {} },
      { text: 'VND (₫) • Tiếng Việt', onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleHelpCenter = () => {
    if (navigation?.navigate) {
      navigation.navigate('TravelAssistant');
    } else {
      Alert.alert('Help Center & Safety', 'WanderStay 24/7 Support Assistant is ready to help you.');
    }
  };

  const handleTermsPrivacy = () => {
    Alert.alert('Terms & Privacy', 'WanderStay Terms of Service and Privacy Policy (v2.4.1). All user data is encrypted and protected under GDPR & CCPA.');
  };

  const handleSignOutConfirm = () => {
    Alert.alert('Log Out', 'Are you sure you want to sign out of WanderStay?', [
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => signOut(),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleMoreOptions = () => {
    Alert.alert('Profile Settings', 'Account Options', [
      {
        text: 'Personal Information',
        onPress: () => navigation?.navigate && navigation.navigate('PersonalInfo'),
      },
      {
        text: 'Login & Security',
        onPress: () => navigation?.navigate && navigation.navigate('Security'),
      },
      {
        text: 'Payments & Payouts',
        onPress: () => navigation?.navigate && navigation.navigate('PaymentsWallet'),
      },
      { text: 'Close', style: 'cancel' },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-appBg items-center justify-center px-6">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-3 text-sm text-textMuted">Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FAF8FF]" edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View className="h-16 px-4 flex-row items-center justify-between border-b border-[#E6E3F5]/80 bg-[#FAF8FF]">
        <Text className="text-xl font-bold text-textMain tracking-tight">Profile</Text>

        <View className="flex-row items-center gap-2">
          <Pressable
            className="w-9 h-9 rounded-full items-center justify-center bg-white shadow-sm border border-borderLight/30 active:opacity-70"
            onPress={handleMoreOptions}
          >
            <Ionicons name="ellipsis-horizontal" size={17} color="#131B2E" />
          </Pressable>
          <View className="w-8 h-8 rounded-full bg-[#006877] items-center justify-center shadow-sm ml-0.5">
            <Ionicons name="person" size={15} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
      >
        {/* Section - Profile Header Card */}
        <View className="bg-white rounded-2xl p-4 shadow-sm border border-borderLight/40 mb-4">
          <View className="flex-row items-center gap-4">
            {/* Avatar with Edit Badge */}
            <View className="relative">
              <Image
                source={{
                  uri: 'https://api.builder.io/api/v1/image/assets/TEMP/bb535bedcd6b86803e7de3fa7f0d2faf6e797005?width=160',
                }}
                className="w-20 h-20 rounded-full bg-slate-200 border-2 border-white shadow-sm"
                resizeMode="cover"
              />
              <Pressable
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#4D44E3] border-2 border-white items-center justify-center shadow-md active:opacity-80"
                onPress={handleEditPhoto}
              >
                <Ionicons name="camera" size={13} color="#FFFFFF" />
              </Pressable>
            </View>

            {/* User Identity & Verified Badge */}
            <View className="flex-1">
              <Text className="text-lg font-bold text-[#131B2E] tracking-tight">{userName}</Text>
              <Text className="text-xs text-[#6C797D] mt-0.5 mb-2" numberOfLines={1}>
                {sessionEmail}
              </Text>

              {/* Verified Traveler Pill */}
              <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F2F3FF] self-start border border-[#0051D5]/20">
                <Ionicons name="checkmark-circle" size={13} color="#0051D5" />
                <Text className="text-[11px] font-bold text-[#0051D5]">Verified Traveler</Text>
              </View>
            </View>
          </View>

          <View className="h-[1px] bg-[#E2E7FF] my-4" />

          {/* Quick Stats Metric Row */}
          <View className="flex-row items-center justify-around py-1">
            <View className="items-center flex-1">
              <Text className="text-xl font-bold text-[#131B2E]">{counts.trips}</Text>
              <Text className="text-xs text-[#6C797D] mt-0.5">Trips taken</Text>
            </View>

            <View className="w-[1px] h-8 bg-[#E2E7FF]" />

            <View className="items-center flex-1">
              <Text className="text-xl font-bold text-[#131B2E]">{counts.reviews}</Text>
              <Text className="text-xs text-[#6C797D] mt-0.5">Reviews</Text>
            </View>

            <View className="w-[1px] h-8 bg-[#E2E7FF]" />

            <View className="items-center flex-1">
              <Text className="text-xl font-bold text-[#131B2E]">{counts.wishlists}</Text>
              <Text className="text-xs text-[#6C797D] mt-0.5">Wishlists</Text>
            </View>
          </View>
        </View>

        {/* Section - Host Mode Promo Banner */}
        <LinearGradient
          colors={['#4D44E3', '#316BF3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="rounded-2xl p-4 shadow-md mb-4 relative overflow-hidden"
        >
          {/* Subtle background circle effect */}
          <View className="absolute -right-6 -bottom-8 w-32 h-32 rounded-full bg-white/10" />

          {/* Host Mode Tag */}
          <View className="flex-row items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 self-start mb-2 backdrop-blur-md">
            <Ionicons name="home" size={11} color="#FFFFFF" />
            <Text className="text-[10px] font-bold text-white uppercase tracking-wider">
              HOST MODE
            </Text>
          </View>

          {/* Title & Description */}
          <Text className="text-base font-bold text-white mb-1 leading-5">
            Switch to Hosting — Earn by sharing your space
          </Text>
          <Text className="text-xs text-white/90 leading-4 mb-3">
            Open your doors to fellow mindful travelers and start earning on your own terms.
          </Text>

          {/* Learn More Button */}
          <Pressable
            className="bg-white px-4 py-2 rounded-full self-start shadow-sm active:opacity-90"
            onPress={handleLearnMoreHost}
          >
            <Text className="text-xs font-bold text-[#4D44E3]">Learn More</Text>
          </Pressable>
        </LinearGradient>

        {/* Section 1: ACCOUNT & SECURITY */}
        <View className="mb-4">
          <Text className="text-xs font-bold text-[#6C797D] uppercase tracking-wider px-1 mb-2">
            ACCOUNT & SECURITY
          </Text>

          <View className="bg-white rounded-2xl shadow-sm border border-borderLight/40 overflow-hidden">
            {/* Personal Information */}
            <Pressable
              className="flex-row items-center justify-between p-4 active:bg-slate-50"
              onPress={() => {
                if (navigation?.navigate) {
                  navigation.navigate('PersonalInfo');
                }
              }}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-full bg-[#E2E7FF] items-center justify-center">
                  <Ionicons name="person-outline" size={17} color="#4D44E3" />
                </View>
                <Text className="text-base font-semibold text-[#131B2E]">
                  Personal Information
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8A90A6" />
            </Pressable>

            <View className="h-[1px] bg-[#E2E7FF] mx-4" />

            {/* Payments & Payouts */}
            <Pressable
              className="flex-row items-center justify-between p-4 active:bg-slate-50"
              onPress={() => {
                if (navigation?.navigate) {
                  navigation.navigate('PaymentsWallet');
                }
              }}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-full bg-[#E2E7FF] items-center justify-center">
                  <Ionicons name="card-outline" size={17} color="#4D44E3" />
                </View>
                <Text className="text-base font-semibold text-[#131B2E]">
                  Payments & Payouts
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8A90A6" />
            </Pressable>

            <View className="h-[1px] bg-[#E2E7FF] mx-4" />

            {/* Login & Security */}
            <Pressable
              className="flex-row items-center justify-between p-4 active:bg-slate-50"
              onPress={() => {
                if (navigation?.navigate) {
                  navigation.navigate('Security');
                }
              }}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-full bg-[#E2E7FF] items-center justify-center">
                  <Ionicons name="shield-checkmark-outline" size={17} color="#4D44E3" />
                </View>
                <Text className="text-base font-semibold text-[#131B2E]">
                  Login & Security
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8A90A6" />
            </Pressable>
          </View>
        </View>

        {/* Section 2: PREFERENCES */}
        <View className="mb-4">
          <Text className="text-xs font-bold text-[#6C797D] uppercase tracking-wider px-1 mb-2">
            PREFERENCES
          </Text>

          <View className="bg-white rounded-2xl shadow-sm border border-borderLight/40 overflow-hidden">
            {/* Currency & Language */}
            <Pressable
              className="flex-row items-center justify-between p-4 active:bg-slate-50"
              onPress={handleCurrencyLanguage}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-full bg-[#E2E7FF] items-center justify-center">
                  <Ionicons name="globe-outline" size={17} color="#4D44E3" />
                </View>
                <Text className="text-base font-semibold text-[#131B2E]">
                  Currency & Language
                </Text>
              </View>

              <View className="flex-row items-center gap-1.5">
                <Text className="text-xs font-medium text-[#6C797D]">USD ($) • English</Text>
                <Ionicons name="chevron-forward" size={18} color="#8A90A6" />
              </View>
            </Pressable>

            <View className="h-[1px] bg-[#E2E7FF] mx-4" />

            {/* Notifications */}
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-full bg-[#E2E7FF] items-center justify-center">
                  <Ionicons name="notifications-outline" size={17} color="#4D44E3" />
                </View>
                <Text className="text-base font-semibold text-[#131B2E]">Notifications</Text>
              </View>

              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#E2E7FF', true: '#4D44E3' }}
                thumbColor="#FFFFFF"
                style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
              />
            </View>

            <View className="h-[1px] bg-[#E2E7FF] mx-4" />

            {/* Dark Appearance */}
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-full bg-[#E2E7FF] items-center justify-center">
                  <Ionicons name="moon-outline" size={17} color="#4D44E3" />
                </View>
                <Text className="text-base font-semibold text-[#131B2E]">Dark Appearance</Text>
              </View>

              <Switch
                value={darkAppearanceEnabled}
                onValueChange={setDarkAppearanceEnabled}
                trackColor={{ false: '#E2E7FF', true: '#4D44E3' }}
                thumbColor="#FFFFFF"
                style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
              />
            </View>
          </View>
        </View>

        {/* Section 3: SUPPORT & LEGAL */}
        <View className="mb-5">
          <Text className="text-xs font-bold text-[#6C797D] uppercase tracking-wider px-1 mb-2">
            SUPPORT & LEGAL
          </Text>

          <View className="bg-white rounded-2xl shadow-sm border border-borderLight/40 overflow-hidden">
            {/* Help Center & Safety */}
            <Pressable
              className="flex-row items-center justify-between p-4 active:bg-slate-50"
              onPress={handleHelpCenter}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-full bg-[#E2E7FF] items-center justify-center">
                  <Ionicons name="help-buoy-outline" size={17} color="#4D44E3" />
                </View>
                <Text className="text-base font-semibold text-[#131B2E]">
                  Help Center & Safety
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8A90A6" />
            </Pressable>

            <View className="h-[1px] bg-[#E2E7FF] mx-4" />

            {/* Terms of Service & Privacy */}
            <Pressable
              className="flex-row items-center justify-between p-4 active:bg-slate-50"
              onPress={handleTermsPrivacy}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-full bg-[#E2E7FF] items-center justify-center">
                  <Ionicons name="document-text-outline" size={17} color="#4D44E3" />
                </View>
                <Text className="text-base font-semibold text-[#131B2E]">
                  Terms of Service & Privacy
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8A90A6" />
            </Pressable>
          </View>
        </View>

        {/* Log Out Action Button */}
        <Pressable
          className="w-full py-3.5 rounded-2xl bg-white border border-borderLight shadow-sm flex-row items-center justify-center gap-2 active:opacity-80"
          onPress={handleSignOutConfirm}
        >
          <Ionicons name="log-out-outline" size={18} color="#BA1A1A" />
          <Text className="text-sm font-semibold text-[#BA1A1A]">Log out</Text>
        </Pressable>

        {/* Version Info */}
        <Text className="text-xs text-[#8A90A6] text-center mt-3 mb-2">
          WanderStay App v2.4.1 (Build 842)
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
