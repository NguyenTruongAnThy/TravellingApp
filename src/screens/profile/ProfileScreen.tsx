import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getProfile, getProfileCounts, saveProfile, type ProfileCounts } from '../../services/profileService';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';

export default function ProfileScreen({ navigation }: { navigation?: any } = {}) {
  const { session, signOut } = useAuth();
  const userId = session?.user?.id || '';
  const sessionEmail = session?.user?.email || '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [counts, setCounts] = useState<ProfileCounts>({ trips: 0, reviews: 0, wishlists: 0 });
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savedName, setSavedName] = useState('');
  const [savedPhone, setSavedPhone] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [touched, setTouched] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const [profile, profileCounts] = await Promise.all([getProfile(userId), getProfileCounts(userId)]);
      const profileName = profile.data?.name || '';
      const profilePhone = profile.data?.phone || '';
      setName(profileName);
      setPhone(profilePhone);
      setSavedName(profileName);
      setSavedPhone(profilePhone);
      setCounts(profileCounts);
    } catch (err) {
      setErrorMessage('Unable to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const nameError = !name.trim() ? 'Please enter your full name.' : '';
  const isValid = !nameError;
  const hasChanged = name !== savedName || phone !== savedPhone;

  const handleSave = async () => {
    setTouched(true);
    setSaveMessage('');
    if (!isValid) return;
    setSaving(true);
    try {
      await saveProfile(userId, sessionEmail, name, phone);
      setSavedName(name);
      setSavedPhone(phone);
      setIsEditing(false);
      setSaveMessage('Profile saved successfully.');
    } catch (err) {
      setSaveMessage('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(savedName);
    setPhone(savedPhone);
    setTouched(false);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-appBg items-center justify-center px-6">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-3 text-sm text-textMuted">Loading profile...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View className="flex-1 bg-appBg items-center justify-center px-6">
        <Text className="text-lg font-bold text-textMain text-center">Unable to load profile</Text>
        <Text className="mt-2 text-sm text-textMuted text-center">{errorMessage}</Text>
        <View className="mt-6 w-full">
          <AppButton title="Try Again" onPress={loadProfile} />
        </View>
      </View>
    );
  }

  const initial = (savedName || sessionEmail || 'W').charAt(0).toUpperCase();

  return (
    <ScrollView className="flex-1 bg-appBg" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 48, paddingBottom: 24 }}>
      <Text className="text-2xl font-bold text-textMain">Profile</Text>
      <Text className="mt-1 text-sm text-textMuted">Your profile details from Supabase</Text>

      {/* Figma Profile: 1 the trang duy nhat gom avatar/ten/email/Verified + hang so lieu co gach doc */}
      <View className="mt-6 rounded-3xl bg-white border border-borderLight p-5 items-center">
        <View className="w-20 h-20 rounded-full bg-brand items-center justify-center">
          <Text className="text-3xl font-bold text-white">{initial}</Text>
        </View>
        <Text className="mt-3 text-xl font-bold text-textMain">{savedName || 'Unnamed User'}</Text>
        <Text className="mt-1 text-sm text-textMuted">{sessionEmail}</Text>
      </View>

      <View className="mt-6 flex-row justify-between">
        <View className="flex-1 mx-1 rounded-2xl bg-white border border-borderLight py-4 items-center">
          <Text className="text-2xl font-bold text-textMain">{counts.trips}</Text>
          <Text className="mt-1 text-xs font-bold text-textMuted">TRIPS</Text>
        </View>
        <View className="flex-1 mx-1 rounded-2xl bg-white border border-borderLight py-4 items-center">
          <Text className="text-2xl font-bold text-textMain">{counts.reviews}</Text>
          <Text className="mt-1 text-xs font-bold text-textMuted">REVIEWS</Text>
        </View>
        <View className="flex-1 mx-1 rounded-2xl bg-white border border-borderLight py-4 items-center">
          <Text className="text-2xl font-bold text-textMain">{counts.wishlists}</Text>
          <Text className="mt-1 text-xs font-bold text-textMuted">WISHLISTS</Text>
        </View>
      </View>
      <Text className="mt-3 text-xs text-textMuted text-center">
        Trips = active bookings • Reviews = your reviews • Wishlists = saved places
      </Text>

      <View className="mt-6 rounded-3xl bg-white p-5">
        <Text className="text-xs font-bold tracking-wide text-textMain">EMAIL (CANNOT BE CHANGED)</Text>
        <View className="mt-2 rounded-xl border border-borderLight bg-appBg px-4 py-3">
          <Text className="text-base text-textMuted">{sessionEmail}</Text>
        </View>

        {isEditing ? (
          <>
            <View className="mt-5">
              <AppInput
                label="FULL NAME"
                icon="person-outline"
                placeholder="John Doe"
                value={name}
                onChangeText={setName}
                error={nameError}
                touched={touched}
              />
            </View>
            <View className="mt-5">
              <AppInput
                label="PHONE NUMBER"
                icon="call-outline"
                placeholder="+1 (555) 012-3456"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
            {saveMessage ? <Text className="mt-3 text-sm text-textMuted">{saveMessage}</Text> : null}
            <View className="mt-6">
              <AppButton title="Save Profile" onPress={handleSave} disabled={!isValid || !hasChanged} loading={saving} />
            </View>
            <Pressable className="mt-3 items-center" onPress={handleCancel}>
              <Text className="text-base font-bold text-brand">Cancel</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View className="mt-5">
              <Text className="text-xs font-bold tracking-wide text-textMain">FULL NAME</Text>
              <Text className="mt-2 text-base text-textMain">{savedName || 'Unnamed User'}</Text>
            </View>
            <View className="mt-5">
              <Text className="text-xs font-bold tracking-wide text-textMain">PHONE NUMBER</Text>
              <Text className="mt-2 text-base text-textMain">{savedPhone || 'No phone number provided'}</Text>
            </View>
            {saveMessage ? <Text className="mt-3 text-sm text-textMuted">{saveMessage}</Text> : null}
            <View className="mt-6">
              <AppButton title="Edit Profile" onPress={() => setIsEditing(true)} />
            </View>
          </>
        )}
      </View>

      {/* Chi Personal Information la that (mo form sua o tren). Cac dong con lai chi hien thi, khong phai tinh nang that o MVP, khong bam duoc */}
      <View className="mt-6 rounded-3xl bg-white border border-borderLight px-5">
        <Pressable
          className="flex-row items-center justify-between py-4"
          style={{ borderBottomWidth: 1, borderBottomColor: '#E6E3F5' }}
          onPress={() => {
            if (navigation?.navigate) {
              navigation.navigate('PersonalInfo');
            } else {
              setIsEditing(true);
            }
          }}
        >
          <Text className="text-base text-textMain">Personal Information</Text>
          <Text className="text-base text-textMuted">›</Text>
        </Pressable>
        <View className="flex-row items-center justify-between py-4" style={{ borderBottomWidth: 1, borderBottomColor: '#E6E3F5' }}>
          <Text className="text-base text-textMain">Login & Security</Text>
          <Text className="text-sm text-textMuted">Email is locked</Text>
        </View>
        <View className="flex-row items-center justify-between py-4" style={{ borderBottomWidth: 1, borderBottomColor: '#E6E3F5' }}>
          <Text className="text-base text-textMain">Currency & Language</Text>
          <Text className="text-sm text-textMuted">USD ($) • English</Text>
        </View>
        <View className="flex-row items-center justify-between py-4" style={{ borderBottomWidth: 1, borderBottomColor: '#E6E3F5' }}>
          <Text className="text-base text-textMain">Notifications</Text>
          <Text className="text-sm text-textMuted">ON</Text>
        </View>
        <View className="flex-row items-center justify-between py-4" style={{ borderBottomWidth: 1, borderBottomColor: '#E6E3F5' }}>
          <Text className="text-base text-textMain">Dark Appearance</Text>
          <Text className="text-sm text-textMuted">OFF</Text>
        </View>
        <View className="flex-row items-center justify-between py-4" style={{ borderBottomWidth: 1, borderBottomColor: '#E6E3F5' }}>
          <Text className="text-base text-textMain">Help Center & Safety</Text>
          <Text className="text-base text-textMuted">›</Text>
        </View>
        <View className="flex-row items-center justify-between py-4">
          <Text className="text-base text-textMain">Terms & Privacy</Text>
          <Text className="text-base text-textMuted">›</Text>
        </View>
      </View>

      <Pressable className="mt-8 items-center" onPress={() => signOut()}>
        <Text className="text-base font-bold text-red-500">Log Out</Text>
      </Pressable>
    </ScrollView>
  );
}
