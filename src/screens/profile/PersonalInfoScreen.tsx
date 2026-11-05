import React, { useState } from 'react';
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
import { DEFAULT_PERSONAL_INFO, UserPersonalInfo } from '../../services/profileService';

interface PersonalInfoScreenProps {
  navigation?: any;
}

export default function PersonalInfoScreen({ navigation }: PersonalInfoScreenProps) {
  const [profile, setProfile] = useState<UserPersonalInfo>(DEFAULT_PERSONAL_INFO);
  const [saving, setSaving] = useState(false);

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editSection, setEditSection] = useState<'basic' | 'contact' | 'address'>('basic');

  // Form edit fields
  const [legalName, setLegalName] = useState(profile.legalName);
  const [preferredName, setPreferredName] = useState(profile.preferredName);
  const [gender, setGender] = useState(profile.gender);
  const [dob, setDob] = useState(profile.dob);

  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [emergencyName, setEmergencyName] = useState(profile.emergencyContactName);
  const [emergencyRelation, setEmergencyRelation] = useState(profile.emergencyContactRelation);
  const [emergencyPhone, setEmergencyPhone] = useState(profile.emergencyContactPhone);

  const [address, setAddress] = useState(profile.address);
  const [nationality, setNationality] = useState(profile.nationality);

  const handleOpenEdit = (section: 'basic' | 'contact' | 'address') => {
    setEditSection(section);
    setEditModalVisible(true);
  };

  const handleSaveModal = () => {
    setProfile({
      ...profile,
      legalName,
      preferredName,
      gender,
      dob,
      email,
      phone,
      emergencyContactName: emergencyName,
      emergencyContactRelation: emergencyRelation,
      emergencyContactPhone: emergencyPhone,
      address,
      nationality,
    });
    setEditModalVisible(false);
    Alert.alert('Updated', 'Section information updated.');
  };

  const handleSaveChanges = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      Alert.alert(
        'Changes Saved',
        'Your personal information is encrypted and securely synchronized.'
      );
    }, 700);
  };

  const handleChangePhoto = () => {
    Alert.alert('Change Profile Photo', 'Upload a clear headshot photo for your travel profile.', [
      { text: 'Choose from Library', onPress: () => {} },
      { text: 'Take Photo', onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleMoreOptions = () => {
    Alert.alert('Account Settings', 'Personal Information & Privacy', [
      {
        text: 'Download Data Archive',
        onPress: () =>
          Alert.alert('Data Archive', 'A link to download your personal data has been emailed.'),
      },
      {
        text: 'Privacy Policy',
        onPress: () => {},
      },
      { text: 'Close', style: 'cancel' },
    ]);
  };

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
          <Text className="text-lg font-bold text-textMain ml-1">Personal Information</Text>
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
            {profile.legalName}
          </Text>

          {/* Verified Traveler Pill */}
          <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-[#F2F3FF] mb-4">
            <Ionicons name="checkmark-circle" size={13} color="#0051D5" />
            <Text className="text-xs font-semibold text-[#0051D5]">Verified Traveler</Text>
          </View>

          {/* Identity Verified Status Container */}
          <View className="bg-[#F2F3FF] rounded-xl p-3.5 w-full flex-row items-start gap-3 border border-borderLight/40">
            <View className="w-8 h-8 rounded-full bg-[#0051D5]/10 items-center justify-center mt-0.5">
              <Ionicons name="shield-checkmark" size={16} color="#0051D5" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-[#131B2E]">Identity verified</Text>
                <Text className="text-[11px] font-bold text-[#0051D5]">Active</Text>
              </View>
              <Text className="text-xs text-[#3C494C] mt-0.5 leading-4">
                Government ID submitted and approved on {profile.idApprovalDate}
              </Text>
            </View>
          </View>
        </View>

        {/* Section 1: Basic Information */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between px-1 mb-2.5">
            <Text className="text-lg font-semibold text-[#131B2E]">Basic Information</Text>
            <Pressable
              className="flex-row items-center gap-1 active:opacity-70"
              onPress={() => handleOpenEdit('basic')}
            >
              <Ionicons name="create-outline" size={13} color="#4D44E3" />
              <Text className="text-xs font-semibold text-[#4D44E3]">Edit</Text>
            </Pressable>
          </View>

          <View className="bg-white rounded-2xl p-4 shadow-sm border border-borderLight/40 gap-3">
            {/* Legal Name */}
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[11px] font-bold text-[#3C494C]">Legal Name</Text>
                <Text className="text-base text-[#131B2E] mt-0.5">{profile.legalName}</Text>
              </View>
              <Ionicons name="lock-closed-outline" size={14} color="#BBC9CC" />
            </View>

            <View className="h-[1px] bg-[#E2E7FF]" />

            {/* Preferred Name */}
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[11px] font-bold text-[#3C494C]">Preferred Name</Text>
                <Text className="text-base text-[#131B2E] mt-0.5">{profile.preferredName}</Text>
              </View>
              <Ionicons name="person-outline" size={14} color="#BBC9CC" />
            </View>

            <View className="h-[1px] bg-[#E2E7FF]" />

            {/* Gender */}
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[11px] font-bold text-[#3C494C]">Gender</Text>
                <Text className="text-base text-[#131B2E] mt-0.5">{profile.gender}</Text>
              </View>
              <Ionicons name="male-female-outline" size={14} color="#BBC9CC" />
            </View>

            <View className="h-[1px] bg-[#E2E7FF]" />

            {/* Date of Birth */}
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[11px] font-bold text-[#3C494C]">Date of Birth</Text>
                <Text className="text-base text-[#131B2E] mt-0.5">{profile.dob}</Text>
              </View>
              <Ionicons name="calendar-outline" size={14} color="#BBC9CC" />
            </View>
          </View>
        </View>

        {/* Section 2: Contact Details */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between px-1 mb-2.5">
            <Text className="text-lg font-semibold text-[#131B2E]">Contact Details</Text>
            <Pressable
              className="flex-row items-center gap-1 active:opacity-70"
              onPress={() => handleOpenEdit('contact')}
            >
              <Ionicons name="create-outline" size={13} color="#4D44E3" />
              <Text className="text-xs font-semibold text-[#4D44E3]">Edit</Text>
            </Pressable>
          </View>

          <View className="bg-white rounded-2xl p-4 shadow-sm border border-borderLight/40 gap-3">
            {/* Email Address */}
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <Text className="text-[11px] font-bold text-[#3C494C]">Email Address</Text>
                <Text className="text-base text-[#131B2E] mt-0.5" numberOfLines={1}>
                  {profile.email}
                </Text>
              </View>
              <View className="px-2.5 py-0.5 rounded-full bg-[#DBE1FF] flex-row items-center gap-1">
                <Ionicons name="checkmark-circle" size={11} color="#003EA8" />
                <Text className="text-[11px] font-bold text-[#003EA8]">Verified</Text>
              </View>
            </View>

            <View className="h-[1px] bg-[#E2E7FF]" />

            {/* Phone Number */}
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[11px] font-bold text-[#3C494C]">Phone Number</Text>
                <Text className="text-base text-[#131B2E] mt-0.5">{profile.phone}</Text>
              </View>
              <View className="px-2.5 py-0.5 rounded-full bg-[#DBE1FF] flex-row items-center gap-1">
                <Ionicons name="checkmark-circle" size={11} color="#003EA8" />
                <Text className="text-[11px] font-bold text-[#003EA8]">Verified</Text>
              </View>
            </View>

            <View className="h-[1px] bg-[#E2E7FF]" />

            {/* Emergency Contact */}
            <View className="flex-row items-start justify-between">
              <View>
                <Text className="text-[11px] font-bold text-[#3C494C]">Emergency Contact</Text>
                <Text className="text-base text-[#131B2E] mt-0.5">
                  {profile.emergencyContactName} ({profile.emergencyContactRelation})
                </Text>
                <Text className="text-sm text-[#3C494C] mt-0.5">{profile.emergencyContactPhone}</Text>
              </View>
              <Ionicons name="call-outline" size={14} color="#BBC9CC" className="mt-1" />
            </View>
          </View>
        </View>

        {/* Section 3: Address & Location */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between px-1 mb-2.5">
            <Text className="text-lg font-semibold text-[#131B2E]">Address & Location</Text>
            <Pressable
              className="flex-row items-center gap-1 active:opacity-70"
              onPress={() => handleOpenEdit('address')}
            >
              <Ionicons name="create-outline" size={13} color="#4D44E3" />
              <Text className="text-xs font-semibold text-[#4D44E3]">Edit</Text>
            </Pressable>
          </View>

          <View className="bg-white rounded-2xl p-4 shadow-sm border border-borderLight/40 gap-3">
            {/* Residential Address */}
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-2">
                <Text className="text-[11px] font-bold text-[#3C494C]">Residential Address</Text>
                <Text className="text-base text-[#131B2E] leading-6 mt-0.5">
                  {profile.address}
                </Text>
              </View>
              <Ionicons name="home-outline" size={14} color="#BBC9CC" className="mt-1" />
            </View>

            <View className="h-[1px] bg-[#E2E7FF]" />

            {/* Nationality */}
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[11px] font-bold text-[#3C494C]">Nationality / Passport Country</Text>
                <Text className="text-base text-[#131B2E] mt-0.5">{profile.nationality}</Text>
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
                <Text className="text-sm font-semibold text-white">Save Changes</Text>
              </View>
            )}
          </Pressable>

          {/* Privacy & Encryption notice */}
          <View className="flex-row items-start gap-2 px-3">
            <Ionicons name="lock-closed" size={14} color="#6C797D" className="mt-0.5" />
            <Text className="text-xs text-[#3C494C] text-center flex-1 leading-4">
              Your personal information is encrypted and securely stored in compliance with privacy regulations.
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
                {editSection === 'basic' && 'Edit Basic Information'}
                {editSection === 'contact' && 'Edit Contact Details'}
                {editSection === 'address' && 'Edit Address & Location'}
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
                    <Text className="text-xs font-semibold text-[#6C797D] mb-1">Legal Name</Text>
                    <TextInput
                      value={legalName}
                      onChangeText={setLegalName}
                      className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                    />
                  </View>
                  <View>
                    <Text className="text-xs font-semibold text-[#6C797D] mb-1">Preferred Name</Text>
                    <TextInput
                      value={preferredName}
                      onChangeText={setPreferredName}
                      className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                    />
                  </View>
                  <View>
                    <Text className="text-xs font-semibold text-[#6C797D] mb-1">Gender</Text>
                    <TextInput
                      value={gender}
                      onChangeText={setGender}
                      className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                    />
                  </View>
                  <View>
                    <Text className="text-xs font-semibold text-[#6C797D] mb-1">Date of Birth</Text>
                    <TextInput
                      value={dob}
                      onChangeText={setDob}
                      className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                    />
                  </View>
                </View>
              )}

              {editSection === 'contact' && (
                <View className="gap-3">
                  <View>
                    <Text className="text-xs font-semibold text-[#6C797D] mb-1">Email Address</Text>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                    />
                  </View>
                  <View>
                    <Text className="text-xs font-semibold text-[#6C797D] mb-1">Phone Number</Text>
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                    />
                  </View>
                  <View>
                    <Text className="text-xs font-semibold text-[#6C797D] mb-1">Emergency Contact Name</Text>
                    <TextInput
                      value={emergencyName}
                      onChangeText={setEmergencyName}
                      className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                    />
                  </View>
                  <View>
                    <Text className="text-xs font-semibold text-[#6C797D] mb-1">Emergency Contact Phone</Text>
                    <TextInput
                      value={emergencyPhone}
                      onChangeText={setEmergencyPhone}
                      keyboardType="phone-pad"
                      className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                    />
                  </View>
                </View>
              )}

              {editSection === 'address' && (
                <View className="gap-3">
                  <View>
                    <Text className="text-xs font-semibold text-[#6C797D] mb-1">Residential Address</Text>
                    <TextInput
                      value={address}
                      onChangeText={setAddress}
                      multiline
                      numberOfLines={3}
                      className="h-20 rounded-xl bg-[#F8F7FF] p-3 border border-borderLight text-sm text-[#131B2E]"
                    />
                  </View>
                  <View>
                    <Text className="text-xs font-semibold text-[#6C797D] mb-1">Nationality / Passport Country</Text>
                    <TextInput
                      value={nationality}
                      onChangeText={setNationality}
                      className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                    />
                  </View>
                </View>
              )}
            </ScrollView>

            <Pressable
              className="h-12 rounded-full bg-[#4D44E3] items-center justify-center shadow-sm active:opacity-90"
              onPress={handleSaveModal}
            >
              <Text className="text-sm font-semibold text-white">Apply Updates</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
