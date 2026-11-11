import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  DEFAULT_PERSONAL_INFO,
  getUserPersonalInfo,
  updateUserPersonalInfo,
  UserPersonalInfo,
} from '../../services/profileService';

interface PersonalInfoScreenProps {
  navigation?: any;
}

export default function PersonalInfoScreen({ navigation }: PersonalInfoScreenProps) {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const sessionEmail = session?.user?.email || '';

  const [profile, setProfile] = useState<UserPersonalInfo>(DEFAULT_PERSONAL_INFO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editSection, setEditSection] = useState<'basic' | 'contact' | 'address'>('basic');
  const [modalSaving, setModalSaving] = useState(false);

  // Form edit fields
  const [legalName, setLegalName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [gender, setGender] = useState('Prefer not to say');
  const [dob, setDob] = useState('');

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const [address, setAddress] = useState('');
  const [nationality, setNationality] = useState('');

  // Load real profile from Supabase
  const loadProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getUserPersonalInfo(userId);
      setProfile(data);
      setLegalName(data.legalName);
      setPreferredName(data.preferredName);
      setGender(data.gender);
      setDob(data.dob);
      setEmail(data.email || sessionEmail);
      setPhone(data.phone);
      setEmergencyName(data.emergencyContactName);
      setEmergencyRelation(data.emergencyContactRelation);
      setEmergencyPhone(data.emergencyContactPhone);
      setAddress(data.address);
      setNationality(data.nationality);
    } catch (err: any) {
      console.warn('Could not load user personal info from Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, sessionEmail]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleOpenEdit = (section: 'basic' | 'contact' | 'address') => {
    setLegalName(profile.legalName);
    setPreferredName(profile.preferredName);
    setGender(profile.gender);
    setDob(profile.dob);
    setEmail(profile.email || sessionEmail);
    setPhone(profile.phone);
    setEmergencyName(profile.emergencyContactName);
    setEmergencyRelation(profile.emergencyContactRelation);
    setEmergencyPhone(profile.emergencyContactPhone);
    setAddress(profile.address);
    setNationality(profile.nationality);
    setEditSection(section);
    setEditModalVisible(true);
  };

  const handleSaveModal = async () => {
    if (!userId) {
      setEditModalVisible(false);
      return;
    }
    setModalSaving(true);
    const updatedProfile: UserPersonalInfo = {
      ...profile,
      legalName,
      preferredName,
      gender,
      dob,
      email: email || sessionEmail,
      phone,
      emergencyContactName: emergencyName,
      emergencyContactRelation: emergencyRelation,
      emergencyContactPhone: emergencyPhone,
      address,
      nationality,
    };

    try {
      await updateUserPersonalInfo(userId, updatedProfile);
      setProfile(updatedProfile);
      setEditModalVisible(false);
      Alert.alert(t('personalInfo.updateSuccess'), t('personalInfo.updateSuccessDesc'));
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.message || 'Error updating profile');
    } finally {
      setModalSaving(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!userId) {
      Alert.alert(t('auth.needSignInTitle'), t('auth.needSignInDesc', { title: t('personalInfo.title') }));
      return;
    }
    setSaving(true);
    try {
      await updateUserPersonalInfo(userId, profile);
      Alert.alert(
        t('personalInfo.updateSuccess'),
        t('personalInfo.updateSuccessDesc')
      );
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.message || 'Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePhoto = () => {
    Alert.alert(t('personalInfo.photoTitle'), t('personalInfo.photoChoose'), [
      {
        text: t('personalInfo.pickLibrary'),
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
              setProfile((prev) => ({ ...prev, avatar: newUri }));
              if (userId) {
                await updateUserPersonalInfo(userId, { avatar: newUri });
              }
              Alert.alert(t('common.success'), t('personalInfo.updateSuccessDesc'));
            }
          } catch (err: any) {
            Alert.alert(t('common.error'), err?.message || 'Error opening library');
          }
        },
      },
      {
        text: t('personalInfo.takePhoto'),
        onPress: async () => {
          try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(t('common.error'), t('personalInfo.cameraPerm'));
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]?.uri) {
              const newUri = result.assets[0].uri;
              setProfile((prev) => ({ ...prev, avatar: newUri }));
              if (userId) {
                await updateUserPersonalInfo(userId, { avatar: newUri });
              }
              Alert.alert(t('common.success'), t('personalInfo.updateSuccessDesc'));
            }
          } catch (err: any) {
            Alert.alert(t('common.error'), err?.message || 'Error opening camera');
          }
        },
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const handleMoreOptions = () => {
    Alert.alert(t('personalInfo.accountOptions'), t('personalInfo.accountOptions'), [
      {
        text: t('personalInfo.downloadArchive'),
        onPress: () =>
          Alert.alert(
            t('personalInfo.downloadArchive'),
            t('personalInfo.downloadArchiveDesc')
          ),
      },
      {
        text: t('personalInfo.reloadData'),
        onPress: loadProfile,
      },
      { text: t('common.close'), style: 'cancel' },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAF8FF] items-center justify-center" edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-3 text-sm text-[#5A6478]">{t('personalInfo.loading')}</Text>
      </SafeAreaView>
    );
  }

  const displayName = profile.legalName || profile.preferredName || (i18n.language === 'vi' ? 'Thành viên WanderStay' : 'WanderStay Member');

  return (
    <SafeAreaView className="flex-1 bg-[#FAF8FF]" edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View className="h-14 px-4 flex-row items-center justify-between border-b border-[#E6E3F5]/80 bg-[#FAF8FF]">
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
          <Text className="text-lg font-bold text-textMain ml-1">{t('personalInfo.title')}</Text>
        </View>

        <View className="flex-row items-center gap-2">
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
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
      >
        {/* Top Profile Summary Card */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-borderLight/40 items-center mb-6">
          {/* Avatar with Camera Overlay Button */}
          <View className="relative mb-3">
            <Image
              source={{ uri: profile.avatar }}
              className="w-24 h-24 rounded-full bg-slate-200 border-2 border-white shadow-sm"
              resizeMode="cover"
            />
            <Pressable
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#4D44E3] border-2 border-white items-center justify-center shadow-md active:opacity-80"
              onPress={handleChangePhoto}
            >
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* User Name */}
          <Text className="text-xl font-bold text-[#131B2E] tracking-tight mb-1">
            {displayName}
          </Text>

          {/* Verified Traveler Pill */}
          <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-[#F2F3FF] mb-4">
            <Ionicons name="checkmark-circle" size={13} color="#0051D5" />
            <Text className="text-xs font-semibold text-[#0051D5]">{t('personalInfo.verifiedTraveler')}</Text>
          </View>

          {/* Identity Verified Status Container */}
          <View className="bg-[#F2F3FF] rounded-xl p-3.5 w-full flex-row items-start gap-3 border border-borderLight/40">
            <View className="w-8 h-8 rounded-full bg-[#0051D5]/10 items-center justify-center mt-0.5">
              <Ionicons name="shield-checkmark" size={16} color="#0051D5" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-[#131B2E]">{t('personalInfo.identityVerified')}</Text>
                <Text className="text-[11px] font-bold text-[#0051D5]">
                  {profile.isVerified ? t('personalInfo.active') : t('personalInfo.standardMember')}
                </Text>
              </View>
              <Text className="text-xs text-[#3C494C] mt-0.5 leading-4">
                {profile.isVerified
                  ? t('personalInfo.idApproved', { date: profile.idApprovalDate })
                  : t('personalInfo.memberSince', { date: profile.idApprovalDate })}
              </Text>
            </View>
          </View>
        </View>

        {/* Section 1: Basic Information */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between px-1 mb-2.5">
            <Text className="text-lg font-semibold text-[#131B2E]">{t('personalInfo.basicInfo')}</Text>
            <Pressable
              className="flex-row items-center gap-1 active:opacity-70"
              onPress={() => handleOpenEdit('basic')}
            >
              <Ionicons name="create-outline" size={13} color="#4D44E3" />
              <Text className="text-xs font-semibold text-[#4D44E3]">{t('common.edit')}</Text>
            </Pressable>
          </View>

          <View className="bg-white rounded-2xl p-4 shadow-sm border border-borderLight/40 gap-3">
            {/* Legal Name */}
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[11px] font-bold text-[#3C494C]">{t('personalInfo.legalName')}</Text>
                <Text className="text-base text-[#131B2E] mt-0.5">
                  {profile.legalName || t('personalInfo.notSet')}
                </Text>
              </View>
              <Ionicons name="lock-closed-outline" size={14} color="#BBC9CC" />
            </View>

            <View className="h-[1px] bg-[#E2E7FF]" />

            {/* Preferred Name */}
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[11px] font-bold text-[#3C494C]">{t('personalInfo.preferredName')}</Text>
                <Text className="text-base text-[#131B2E] mt-0.5">
                  {profile.preferredName || profile.legalName || t('personalInfo.notSet')}
                </Text>
              </View>
              <Ionicons name="person-outline" size={14} color="#BBC9CC" />
            </View>

            <View className="h-[1px] bg-[#E2E7FF]" />

            {/* Gender */}
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[11px] font-bold text-[#3C494C]">{t('personalInfo.gender')}</Text>
                <Text className="text-base text-[#131B2E] mt-0.5">{profile.gender}</Text>
              </View>
              <Ionicons name="male-female-outline" size={14} color="#BBC9CC" />
            </View>

            <View className="h-[1px] bg-[#E2E7FF]" />

            {/* Date of Birth */}
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[11px] font-bold text-[#3C494C]">{t('personalInfo.dob')}</Text>
                <Text className="text-base text-[#131B2E] mt-0.5">
                  {profile.dob || t('personalInfo.notSet')}
                </Text>
              </View>
              <Ionicons name="calendar-outline" size={14} color="#BBC9CC" />
            </View>
          </View>
        </View>

        {/* Section 2: Contact Details */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between px-1 mb-2.5">
            <Text className="text-lg font-semibold text-[#131B2E]">{t('personalInfo.contactDetails')}</Text>
            <Pressable
              className="flex-row items-center gap-1 active:opacity-70"
              onPress={() => handleOpenEdit('contact')}
            >
              <Ionicons name="create-outline" size={13} color="#4D44E3" />
              <Text className="text-xs font-semibold text-[#4D44E3]">{t('common.edit')}</Text>
            </Pressable>
          </View>

          <View className="bg-white rounded-2xl p-4 shadow-sm border border-borderLight/40 gap-3">
            {/* Email Address */}
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <Text className="text-[11px] font-bold text-[#3C494C]">{t('personalInfo.emailAddress')}</Text>
                <Text className="text-base text-[#131B2E] mt-0.5" numberOfLines={1}>
                  {profile.email || sessionEmail}
                </Text>
              </View>
              <View className="px-2.5 py-0.5 rounded-full bg-[#DBE1FF] flex-row items-center gap-1">
                <Ionicons name="checkmark-circle" size={11} color="#003EA8" />
                <Text className="text-[11px] font-bold text-[#003EA8]">{t('personalInfo.verified')}</Text>
              </View>
            </View>

            <View className="h-[1px] bg-[#E2E7FF]" />

            {/* Phone Number */}
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[11px] font-bold text-[#3C494C]">{t('profile.phoneNumber')}</Text>
                <Text className="text-base text-[#131B2E] mt-0.5">
                  {profile.phone || t('personalInfo.notSet')}
                </Text>
              </View>
              <View className="px-2.5 py-0.5 rounded-full bg-[#DBE1FF] flex-row items-center gap-1">
                <Ionicons name="checkmark-circle" size={11} color="#003EA8" />
                <Text className="text-[11px] font-bold text-[#003EA8]">
                  {profile.phone ? t('personalInfo.verified') : t('personalInfo.pending')}
                </Text>
              </View>
            </View>

            <View className="h-[1px] bg-[#E2E7FF]" />

            {/* Emergency Contact */}
            <View className="flex-row items-start justify-between">
              <View>
                <Text className="text-[11px] font-bold text-[#3C494C]">{t('personalInfo.emergencyContact')}</Text>
                <Text className="text-base text-[#131B2E] mt-0.5">
                  {profile.emergencyContactName
                    ? `${profile.emergencyContactName} (${profile.emergencyContactRelation || t('personalInfo.family')})`
                    : t('personalInfo.notSet')}
                </Text>
                {profile.emergencyContactPhone ? (
                  <Text className="text-sm text-[#3C494C] mt-0.5">{profile.emergencyContactPhone}</Text>
                ) : null}
              </View>
              <Ionicons name="call-outline" size={14} color="#BBC9CC" className="mt-1" />
            </View>
          </View>
        </View>

        {/* Section 3: Address & Location */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between px-1 mb-2.5">
            <Text className="text-lg font-semibold text-[#131B2E]">{t('personalInfo.addressAndLocation')}</Text>
            <Pressable
              className="flex-row items-center gap-1 active:opacity-70"
              onPress={() => handleOpenEdit('address')}
            >
              <Ionicons name="create-outline" size={13} color="#4D44E3" />
              <Text className="text-xs font-semibold text-[#4D44E3]">{t('common.edit')}</Text>
            </Pressable>
          </View>

          <View className="bg-white rounded-2xl p-4 shadow-sm border border-borderLight/40 gap-3">
            {/* Residential Address */}
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-2">
                <Text className="text-[11px] font-bold text-[#3C494C]">{t('personalInfo.residentialAddress')}</Text>
                <Text className="text-base text-[#131B2E] leading-6 mt-0.5">
                  {profile.address || t('personalInfo.notSet')}
                </Text>
              </View>
              <Ionicons name="home-outline" size={14} color="#BBC9CC" className="mt-1" />
            </View>

            <View className="h-[1px] bg-[#E2E7FF]" />

            {/* Nationality */}
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[11px] font-bold text-[#3C494C]">{t('personalInfo.nationality')}</Text>
                <Text className="text-base text-[#131B2E] mt-0.5">{profile.nationality || 'Vietnam'}</Text>
              </View>
              <Ionicons name="globe-outline" size={14} color="#BBC9CC" />
            </View>
          </View>
        </View>

        {/* Save Changes Button */}
        <View className="items-center gap-4 mb-2">
          <Pressable
            className="w-full h-12 rounded-full bg-[#0051D5] items-center justify-center shadow-md active:opacity-90"
            onPress={handleSaveChanges}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Ionicons name="checkmark-done-outline" size={18} color="#FFFFFF" />
                <Text className="text-sm font-semibold text-white">{t('personalInfo.saveChanges')}</Text>
              </View>
            )}
          </Pressable>

          {/* Privacy & Encryption notice */}
          <View className="flex-row items-start gap-2 px-3">
            <Ionicons name="lock-closed" size={14} color="#6C797D" className="mt-0.5" />
            <Text className="text-xs text-[#3C494C] text-center flex-1 leading-4">
              {i18n.language === 'vi'
                ? 'Dữ liệu cá nhân được mã hóa và lưu trữ an toàn theo tiêu chuẩn bảo mật của WanderStay trên Supabase.'
                : 'Personal data is securely encrypted and stored following WanderStay security standards on Supabase.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Interactive Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 shadow-2xl">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-textMain">
                {editSection === 'basic' && (i18n.language === 'vi' ? 'Chỉnh sửa thông tin cơ bản' : 'Edit Basic Information')}
                {editSection === 'contact' && (i18n.language === 'vi' ? 'Chỉnh sửa chi tiết liên hệ' : 'Edit Contact Details')}
                {editSection === 'address' && (i18n.language === 'vi' ? 'Chỉnh sửa địa chỉ & cư trú' : 'Edit Address & Location')}
              </Text>
              <Pressable
                className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                onPress={() => setEditModalVisible(false)}
              >
                <Ionicons name="close" size={18} color="#131B2E" />
              </Pressable>
            </View>

            <ScrollView className="max-h-96 gap-3 mb-6" showsVerticalScrollIndicator={false}>
              {editSection === 'basic' && (
                <View className="gap-3">
                  <View>
                    <Text className="text-xs font-semibold text-[#6C797D] mb-1">{t('personalInfo.legalName')}</Text>
                    <TextInput
                      value={legalName}
                      onChangeText={setLegalName}
                      placeholder={i18n.language === 'vi' ? 'VD: Nguyễn Văn A' : 'e.g. John Doe'}
                      placeholderTextColor="#8A90A6"
                      className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                    />
                  </View>
                  <View>
                    <Text className="text-xs font-semibold text-[#6C797D] mb-1">{t('personalInfo.preferredName')}</Text>
                    <TextInput
                      value={preferredName}
                      onChangeText={setPreferredName}
                      placeholder={i18n.language === 'vi' ? 'VD: Alex' : 'e.g. Alex'}
                      placeholderTextColor="#8A90A6"
                      className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                    />
                  </View>
                  <View>
                    <Text className="text-xs font-semibold text-[#6C797D] mb-1">{t('personalInfo.gender')}</Text>
                    <TextInput
                      value={gender}
                      onChangeText={setGender}
                      placeholder="Male / Female / Prefer not to say"
                      placeholderTextColor="#8A90A6"
                      className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                    />
                  </View>
                  <View>
                    <Text className="text-xs font-semibold text-[#6C797D] mb-1">{t('personalInfo.dob')}</Text>
                    <TextInput
                      value={dob}
                      onChangeText={setDob}
                      placeholder={i18n.language === 'vi' ? 'VD: 15/05/2000' : 'e.g. May 14, 1992'}
                      placeholderTextColor="#8A90A6"
                      className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                    />
                  </View>
                </View>
              )}

              {editSection === 'contact' && (
                <View className="gap-3">
                  <View>
                    <Text className="text-xs font-semibold text-[#6C797D] mb-1">{t('personalInfo.emailAddress')}</Text>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      placeholder="email@example.com"
                      placeholderTextColor="#8A90A6"
                      className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                    />
                  </View>
                  <View>
                    <Text className="text-xs font-semibold text-[#6C797D] mb-1">{t('profile.phoneNumber')}</Text>
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      placeholder="0912 345 678"
                      placeholderTextColor="#8A90A6"
                      className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                    />
                  </View>
                  <View>
                    <Text className="text-xs font-semibold text-[#6C797D] mb-1">{t('personalInfo.emergencyContact')}</Text>
                    <TextInput
                      value={emergencyName}
                      onChangeText={setEmergencyName}
                      placeholder={i18n.language === 'vi' ? 'VD: Nguyễn Văn B' : 'e.g. Jane Doe'}
                      placeholderTextColor="#8A90A6"
                      className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                    />
                  </View>
                  <View>
                    <Text className="text-xs font-semibold text-[#6C797D] mb-1">{i18n.language === 'vi' ? 'Mối quan hệ' : 'Relation'}</Text>
                    <TextInput
                      value={emergencyRelation}
                      onChangeText={setEmergencyRelation}
                      placeholder={i18n.language === 'vi' ? 'VD: Bố mẹ / Vợ chồng / Bạn bè' : 'e.g. Spouse / Parent / Friend'}
                      placeholderTextColor="#8A90A6"
                      className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                    />
                  </View>
                  <View>
                    <Text className="text-xs font-semibold text-[#6C797D] mb-1">{i18n.language === 'vi' ? 'SĐT người liên hệ khẩn cấp' : 'Emergency Contact Phone'}</Text>
                    <TextInput
                      value={emergencyPhone}
                      onChangeText={setEmergencyPhone}
                      keyboardType="phone-pad"
                      placeholder="0987 654 321"
                      placeholderTextColor="#8A90A6"
                      className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                    />
                  </View>
                </View>
              )}

              {editSection === 'address' && (
                <View className="gap-3">
                  <View>
                    <Text className="text-xs font-semibold text-[#6C797D] mb-1">{t('personalInfo.residentialAddress')}</Text>
                    <TextInput
                      value={address}
                      onChangeText={setAddress}
                      multiline
                      numberOfLines={3}
                      placeholder={i18n.language === 'vi' ? 'VD: 123 Đường Lê Lợi, Quận 1, TP.HCM' : 'e.g. 123 Main St, City, Country'}
                      placeholderTextColor="#8A90A6"
                      className="h-20 rounded-xl bg-[#F8F7FF] p-3 border border-borderLight text-sm text-[#131B2E]"
                    />
                  </View>
                  <View>
                    <Text className="text-xs font-semibold text-[#6C797D] mb-1">{t('personalInfo.nationality')}</Text>
                    <TextInput
                      value={nationality}
                      onChangeText={setNationality}
                      placeholder={i18n.language === 'vi' ? 'VD: Việt Nam' : 'e.g. Vietnam'}
                      placeholderTextColor="#8A90A6"
                      className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                    />
                  </View>
                </View>
              )}
            </ScrollView>

            <Pressable
              className="h-12 rounded-full bg-[#4D44E3] items-center justify-center shadow-sm active:opacity-90 flex-row gap-2"
              onPress={handleSaveModal}
              disabled={modalSaving}
            >
              {modalSaving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  <Text className="text-sm font-semibold text-white">{t('common.save')}</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
