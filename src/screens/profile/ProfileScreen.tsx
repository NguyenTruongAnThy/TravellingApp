import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getProfile, getProfileCounts, saveProfile, type ProfileCounts } from '../../services/profileService';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';

export default function ProfileScreen() {
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
      setErrorMessage('Không tải được hồ sơ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const nameError = !name.trim() ? 'Vui lòng nhập họ tên.' : '';
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
      setSaveMessage('Đã lưu hồ sơ.');
    } catch (err) {
      setSaveMessage('Không lưu được hồ sơ. Vui lòng thử lại.');
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
        <Text className="mt-3 text-sm text-textMuted">Đang tải hồ sơ...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View className="flex-1 bg-appBg items-center justify-center px-6">
        <Text className="text-lg font-bold text-textMain text-center">Không tải được hồ sơ</Text>
        <Text className="mt-2 text-sm text-textMuted text-center">{errorMessage}</Text>
        <View className="mt-6 w-full">
          <AppButton title="Thử lại" onPress={loadProfile} />
        </View>
      </View>
    );
  }

  const initial = (savedName || sessionEmail || 'W').charAt(0).toUpperCase();

  return (
    <ScrollView className="flex-1 bg-appBg" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 48, paddingBottom: 24 }}>
      <Text className="text-2xl font-bold text-textMain">Profile</Text>
      <Text className="mt-1 text-sm text-textMuted">Hồ sơ của bạn, dữ liệu thật từ Supabase</Text>

      <View className="mt-6 items-center">
        <View className="w-20 h-20 rounded-full bg-brand items-center justify-center border-4 border-white">
          <Text className="text-3xl font-bold text-white">{initial}</Text>
        </View>
        <Text className="mt-3 text-xl font-bold text-textMain">{savedName || 'Chưa đặt tên'}</Text>
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
        Trips = booking chưa hủy • Reviews = đánh giá của bạn • Wishlists = chỗ ở đã lưu
      </Text>

      <View className="mt-6 rounded-3xl bg-white p-5">
        <Text className="text-xs font-bold tracking-wide text-textMain">EMAIL (KHÔNG ĐỔI ĐƯỢC)</Text>
        <View className="mt-2 rounded-xl border border-borderLight bg-appBg px-4 py-3">
          <Text className="text-base text-textMuted">{sessionEmail}</Text>
        </View>

        {isEditing ? (
          <>
            <View className="mt-5">
              <AppInput
                label="YOUR NAME"
                icon="person-outline"
                placeholder="Nguyễn Văn A"
                value={name}
                onChangeText={setName}
                error={nameError}
                touched={touched}
              />
            </View>
            <View className="mt-5">
              <AppInput
                label="PHONE"
                icon="call-outline"
                placeholder="0912 345 678"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
            {saveMessage ? <Text className="mt-3 text-sm text-textMuted">{saveMessage}</Text> : null}
            <View className="mt-6">
              <AppButton title="Lưu hồ sơ" onPress={handleSave} disabled={!isValid || !hasChanged} loading={saving} />
            </View>
            <Pressable className="mt-3 items-center" onPress={handleCancel}>
              <Text className="text-base font-bold text-brand">Hủy</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View className="mt-5">
              <Text className="text-xs font-bold tracking-wide text-textMain">YOUR NAME</Text>
              <Text className="mt-2 text-base text-textMain">{savedName || 'Chưa đặt tên'}</Text>
            </View>
            <View className="mt-5">
              <Text className="text-xs font-bold tracking-wide text-textMain">PHONE</Text>
              <Text className="mt-2 text-base text-textMain">{savedPhone || 'Chưa có số điện thoại'}</Text>
            </View>
            {saveMessage ? <Text className="mt-3 text-sm text-textMuted">{saveMessage}</Text> : null}
            <View className="mt-6">
              <AppButton title="Chỉnh sửa hồ sơ" onPress={() => setIsEditing(true)} />
            </View>
          </>
        )}
      </View>

      <Pressable className="mt-8 items-center" onPress={() => signOut()}>
        <Text className="text-base font-bold text-red-500">Log out</Text>
      </Pressable>
    </ScrollView>
  );
}
