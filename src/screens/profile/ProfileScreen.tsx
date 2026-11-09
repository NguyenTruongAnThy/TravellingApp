import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  getProfile,
  getProfileCounts,
  saveProfile,
  updateUserPersonalInfo,
  type ProfileCounts,
} from '../../services/profileService';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import { changeAppLanguage } from '../../i18n';

export default function ProfileScreen({ navigation: propNavigation }: { navigation?: any } = {}) {
  const { t, i18n } = useTranslation();
  const hookNavigation = useNavigation<any>();
  const navigation = propNavigation || hookNavigation;
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
  const [avatarUrl, setAvatarUrl] = useState('');
  const [savedName, setSavedName] = useState('');
  const [savedPhone, setSavedPhone] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [touched, setTouched] = useState(false);

  // Language modal state
  const [langModalVisible, setLangModalVisible] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const [profile, profileCounts] = await Promise.all([getProfile(userId), getProfileCounts(userId)]);
      const profileName = profile.data?.name || '';
      const profilePhone = profile.data?.phone || '';
      const profileAvatar = profile.data?.avatar_url || '';
      setName(profileName);
      setPhone(profilePhone);
      setSavedName(profileName);
      setSavedPhone(profilePhone);
      setAvatarUrl(profileAvatar);
      setCounts(profileCounts);
    } catch (err) {
      setErrorMessage(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const nameError = !name.trim() ? (i18n.language === 'vi' ? 'Vui lòng nhập họ và tên.' : 'Please enter your full name.') : '';
  const isValid = !nameError;
  const hasChanged = name !== savedName || phone !== savedPhone;

  const handleSave = async () => {
    setTouched(true);
    setSaveMessage('');
    if (!isValid) return;
    setSaving(true);
    try {
      await saveProfile(userId, sessionEmail, name, phone, avatarUrl);
      setSavedName(name);
      setSavedPhone(phone);
      setIsEditing(false);
      setSaveMessage(i18n.language === 'vi' ? 'Đã lưu thông tin hồ sơ.' : 'Profile saved.');
    } catch (err) {
      setSaveMessage(i18n.language === 'vi' ? 'Không thể lưu hồ sơ. Vui lòng thử lại.' : 'Could not save your profile. Please try again.');
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

  // Direct avatar photo picker
  const handlePickAvatar = () => {
    Alert.alert(
      t('profile.changeAvatar'),
      i18n.language === 'vi' ? 'Chọn phương thức cập nhật ảnh hồ sơ cá nhân:' : 'Choose photo source:',
      [
        {
          text: i18n.language === 'vi' ? 'Chọn từ Thư viện ảnh' : 'Choose from Library',
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled && result.assets[0]?.uri) {
                const newUri = result.assets[0].uri;
                setAvatarUrl(newUri);
                if (userId) {
                  await updateUserPersonalInfo(userId, { avatar: newUri });
                }
              }
            } catch (err: any) {
              Alert.alert(t('common.error'), err?.message || 'Could not open image library');
            }
          },
        },
        {
          text: i18n.language === 'vi' ? 'Chụp ảnh mới' : 'Take a Photo',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(
                  t('common.error'),
                  i18n.language === 'vi' ? 'Vui lòng cấp quyền truy cập Camera.' : 'Please grant camera access.'
                );
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled && result.assets[0]?.uri) {
                const newUri = result.assets[0].uri;
                setAvatarUrl(newUri);
                if (userId) {
                  await updateUserPersonalInfo(userId, { avatar: newUri });
                }
              }
            } catch (err: any) {
              Alert.alert(t('common.error'), err?.message || 'Could not open camera');
            }
          },
        },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const handleSelectLanguage = async (lang: 'vi' | 'en') => {
    await changeAppLanguage(lang);
    setLangModalVisible(false);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-appBg items-center justify-center px-6">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-3 text-sm text-textMuted">{t('common.loading')}</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View className="flex-1 bg-appBg items-center justify-center px-6">
        <Text className="text-lg font-bold text-textMain text-center">{t('common.error')}</Text>
        <Text className="mt-2 text-sm text-textMuted text-center">{errorMessage}</Text>
        <View className="mt-6 w-full">
          <AppButton title={i18n.language === 'vi' ? 'Thử lại' : 'Try again'} onPress={loadProfile} />
        </View>
      </View>
    );
  }

  const initial = (savedName || sessionEmail || 'W').charAt(0).toUpperCase();

  return (
    <ScrollView className="flex-1 bg-appBg" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 48, paddingBottom: 24 }}>
      <Text className="text-2xl font-bold text-textMain">{t('profile.title')}</Text>
      <Text className="mt-1 text-sm text-textMuted">{t('profile.subtitle')}</Text>

      {/* Profile Card */}
      <View className="mt-6 rounded-3xl bg-white border border-borderLight p-5 items-center shadow-sm">
        <Pressable
          className="relative active:opacity-90"
          onPress={handlePickAvatar}
        >
          <View className="w-20 h-20 rounded-full bg-brand items-center justify-center overflow-hidden border border-borderLight shadow-sm">
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <Text className="text-3xl font-bold text-white">{initial}</Text>
            )}
          </View>
          <View className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-brand items-center justify-center border-2 border-white shadow-sm">
            <Ionicons name="camera" size={12} color="#FFFFFF" />
          </View>
        </Pressable>
        <Text className="mt-3 text-xl font-bold text-textMain">{savedName || t('profile.noName')}</Text>
        <Text className="mt-1 text-sm text-textMuted">{sessionEmail}</Text>
        <View className="mt-3 px-3 py-1 rounded-full bg-brand">
          <Text className="text-xs font-bold text-white">{t('profile.verifiedTraveler')}</Text>
        </View>
        <View className="mt-4 flex-row w-full">
          <View className="flex-1 items-center">
            <Text className="text-xl font-bold text-textMain">{counts.trips}</Text>
            <Text className="mt-1 text-xs text-textMuted">{t('profile.trips')}</Text>
          </View>
          <View style={{ width: 1, backgroundColor: '#E6E3F5' }} />
          <View className="flex-1 items-center">
            <Text className="text-xl font-bold text-textMain">{counts.reviews}</Text>
            <Text className="mt-1 text-xs text-textMuted">{t('profile.reviews')}</Text>
          </View>
          <View style={{ width: 1, backgroundColor: '#E6E3F5' }} />
          <View className="flex-1 items-center">
            <Text className="text-xl font-bold text-textMain">{counts.wishlists}</Text>
            <Text className="mt-1 text-xs text-textMuted">{t('profile.favorites')}</Text>
          </View>
        </View>
      </View>

      <View className="mt-6 rounded-3xl bg-white p-5 border border-borderLight shadow-sm">
        <Text className="text-xs font-bold tracking-wide text-textMain">{t('profile.emailLabel')}</Text>
        <View className="mt-2 rounded-xl border border-borderLight bg-appBg px-4 py-3">
          <Text className="text-base text-textMuted">{sessionEmail}</Text>
        </View>

        {isEditing ? (
          <>
            <View className="mt-5">
              <AppInput
                label={t('profile.fullName')}
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
                label={t('profile.phoneNumber')}
                icon="call-outline"
                placeholder="0912 345 678"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
            {saveMessage ? <Text className="mt-3 text-sm text-textMuted">{saveMessage}</Text> : null}
            <View className="mt-6">
              <AppButton title={t('profile.saveProfile')} onPress={handleSave} disabled={!isValid || !hasChanged} loading={saving} />
            </View>
            <Pressable className="mt-3 items-center py-2" onPress={handleCancel}>
              <Text className="text-base font-bold text-brand">{t('common.cancel')}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View className="mt-5">
              <Text className="text-xs font-bold tracking-wide text-textMain">{t('profile.fullName')}</Text>
              <Text className="mt-2 text-base text-textMain">{savedName || t('profile.noName')}</Text>
            </View>
            <View className="mt-5">
              <Text className="text-xs font-bold tracking-wide text-textMain">{t('profile.phoneNumber')}</Text>
              <Text className="mt-2 text-base text-textMain">{savedPhone || t('profile.noPhone')}</Text>
            </View>
            {saveMessage ? <Text className="mt-3 text-sm text-textMuted">{saveMessage}</Text> : null}
            <View className="mt-6">
              <AppButton title={t('profile.editProfile')} onPress={() => setIsEditing(true)} />
            </View>
          </>
        )}
      </View>

      {/* Menu Settings */}
      <View className="mt-6 rounded-3xl bg-white border border-borderLight px-5 shadow-sm">
        <Pressable
          className="flex-row items-center justify-between py-4"
          style={{ borderBottomWidth: 1, borderBottomColor: '#E6E3F5' }}
          onPress={() => (navigation?.navigate ? navigation.navigate('PersonalInfo') : setIsEditing(true))}
        >
          <Text className="text-base text-textMain">{t('profile.personalInfo')}</Text>
          <Text className="text-base text-textMuted">›</Text>
        </Pressable>
        <Pressable
          className="flex-row items-center justify-between py-4"
          style={{ borderBottomWidth: 1, borderBottomColor: '#E6E3F5' }}
          onPress={() => navigation?.navigate && navigation.navigate('Security')}
        >
          <Text className="text-base text-textMain">{t('profile.loginAndSecurity')}</Text>
          <Text className="text-base text-textMuted">›</Text>
        </Pressable>

        {/* Currency & Language Row - Triggers Language Picker */}
        <Pressable
          className="flex-row items-center justify-between py-4"
          style={{ borderBottomWidth: 1, borderBottomColor: '#E6E3F5' }}
          onPress={() => setLangModalVisible(true)}
        >
          <Text className="text-base text-textMain">{t('profile.currencyAndLanguage')}</Text>
          <View className="flex-row items-center gap-1.5">
            <Text className="text-sm font-semibold text-brand">
              USD ($) • {i18n.language === 'vi' ? 'Tiếng Việt 🇻🇳' : 'English 🇬🇧'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#4F46E5" />
          </View>
        </Pressable>

        <View className="flex-row items-center justify-between py-4" style={{ borderBottomWidth: 1, borderBottomColor: '#E6E3F5' }}>
          <Text className="text-base text-textMain">
            {i18n.language === 'vi' ? 'Thông báo ứng dụng' : 'Notifications'}
          </Text>
          <Text className="text-sm text-textMuted">ON</Text>
        </View>
        <View className="flex-row items-center justify-between py-4" style={{ borderBottomWidth: 1, borderBottomColor: '#E6E3F5' }}>
          <Text className="text-base text-textMain">
            {i18n.language === 'vi' ? 'Giao diện tối' : 'Dark Appearance'}
          </Text>
          <Text className="text-sm text-textMuted">OFF</Text>
        </View>
        <Pressable
          className="flex-row items-center justify-between py-4"
          style={{ borderBottomWidth: 1, borderBottomColor: '#E6E3F5' }}
          onPress={() => navigation?.navigate && navigation.navigate('TravelAssistant')}
        >
          <Text className="text-base text-textMain">{t('profile.helpCenter')}</Text>
          <Text className="text-base text-textMuted">›</Text>
        </Pressable>
        <View className="flex-row items-center justify-between py-4">
          <Text className="text-base text-textMain">
            {i18n.language === 'vi' ? 'Điều khoản & Quyền riêng tư' : 'Terms & Privacy'}
          </Text>
          <Text className="text-base text-textMuted">›</Text>
        </View>
      </View>

      <Pressable className="mt-8 mb-6 items-center" onPress={() => signOut()}>
        <Text className="text-base font-bold text-red-500">{t('profile.logOut')}</Text>
      </Pressable>

      {/* Language Selector Bottom Sheet Modal */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setLangModalVisible(false)}
        >
          <Pressable
            className="bg-white rounded-t-3xl p-6 shadow-xl"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View className="items-center pb-2">
              <View className="w-12 h-1.5 rounded-full bg-gray-300 mb-4" />
              <Text className="text-lg font-bold text-textMain">{t('profile.selectLanguage')}</Text>
              <Text className="text-xs text-textMuted text-center mt-1">
                {t('profile.selectLanguageDesc')}
              </Text>
            </View>

            {/* Options */}
            <View className="mt-4 gap-3">
              {/* Vietnamese Option */}
              <Pressable
                onPress={() => handleSelectLanguage('vi')}
                className={`flex-row items-center justify-between p-4 rounded-2xl border-2 ${
                  i18n.language === 'vi'
                    ? 'border-brand bg-brand/5'
                    : 'border-borderLight bg-white'
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <Text className="text-2xl">🇻🇳</Text>
                  <View>
                    <Text className="text-base font-bold text-textMain">Tiếng Việt</Text>
                    <Text className="text-xs text-textMuted">Mặc định (Việt Nam)</Text>
                  </View>
                </View>
                {i18n.language === 'vi' ? (
                  <View className="w-6 h-6 rounded-full bg-brand items-center justify-center">
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                ) : (
                  <View className="w-6 h-6 rounded-full border-2 border-gray-300" />
                )}
              </Pressable>

              {/* English Option */}
              <Pressable
                onPress={() => handleSelectLanguage('en')}
                className={`flex-row items-center justify-between p-4 rounded-2xl border-2 ${
                  i18n.language === 'en'
                    ? 'border-brand bg-brand/5'
                    : 'border-borderLight bg-white'
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <Text className="text-2xl">🇬🇧</Text>
                  <View>
                    <Text className="text-base font-bold text-textMain">English</Text>
                    <Text className="text-xs text-textMuted">International (US/UK)</Text>
                  </View>
                </View>
                {i18n.language === 'en' ? (
                  <View className="w-6 h-6 rounded-full bg-brand items-center justify-center">
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                ) : (
                  <View className="w-6 h-6 rounded-full border-2 border-gray-300" />
                )}
              </Pressable>
            </View>

            {/* Close Button */}
            <Pressable
              onPress={() => setLangModalVisible(false)}
              className="mt-6 py-3.5 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-sm font-semibold text-textMain">{t('common.close')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
