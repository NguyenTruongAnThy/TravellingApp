import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { SecurityDevice } from '../../services/profileService';

interface SecurityScreenProps {
  navigation?: any;
}

export default function SecurityScreen({ navigation }: SecurityScreenProps) {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const userEmail = session?.user?.email || 'user@wanderstay.com';

  const [userPhone, setUserPhone] = useState<string>('');
  const [masterPasswordLastUpdated, setMasterPasswordLastUpdated] = useState<string>(
    i18n.language === 'vi' ? 'Gần đây' : 'Recently'
  );
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(true);
  const [updatingPassword, setUpdatingPassword] = useState<boolean>(false);

  // Detect current operating system / device
  const currentDeviceName =
    Platform.OS === 'ios'
      ? 'Apple iPhone'
      : Platform.OS === 'android'
      ? (i18n.language === 'vi' ? 'Thiết bị Android' : 'Android Device')
      : (i18n.language === 'vi' ? 'Thiết bị di động' : 'Mobile Device');

  const [devices, setDevices] = useState<SecurityDevice[]>([
    {
      id: 'dev-current',
      name: currentDeviceName,
      location: i18n.language === 'vi' ? 'Hà Nội, Việt Nam' : 'Hanoi, Vietnam',
      lastActive: i18n.language === 'vi' ? 'Đang hoạt động' : 'Active now',
      isCurrent: true,
      deviceType: 'phone',
    },
    {
      id: 'dev-chrome',
      name: 'Chrome Windows / Web',
      location: i18n.language === 'vi' ? 'Việt Nam' : 'Vietnam',
      lastActive: i18n.language === 'vi' ? 'Hoạt động 2 giờ trước' : '2 hours ago',
      isCurrent: false,
      deviceType: 'laptop',
    },
  ]);

  // Update Password Modal State
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Backup Codes Modal State
  const [backupCodesVisible, setBackupCodesVisible] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Fetch real user phone & stored 2FA / Password update status
  useEffect(() => {
    async function loadSecurityData() {
      if (!userId) return;

      try {
        const { data } = await supabase
          .from('users')
          .select('phone')
          .eq('id', userId)
          .single();
        if (data?.phone) {
          setUserPhone(data.phone);
        }
      } catch (err) {
        console.log('Error fetching user phone:', err);
      }

      try {
        const saved2FA = await AsyncStorage.getItem(`@wanderstay_2fa_${userId}`);
        if (saved2FA !== null) {
          setTwoFactorEnabled(saved2FA === 'true');
        }
      } catch (err) {
        console.log('Error loading 2FA setting:', err);
      }

      try {
        const savedPassDate = await AsyncStorage.getItem(`@wanderstay_pass_updated_${userId}`);
        if (savedPassDate) {
          setMasterPasswordLastUpdated(savedPassDate);
        }
      } catch (err) {
        console.log('Error loading password update date:', err);
      }

      try {
        const savedCodes = await AsyncStorage.getItem(`@wanderstay_backup_codes_${userId}`);
        if (savedCodes) {
          setBackupCodes(JSON.parse(savedCodes));
        } else {
          const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
          const newCodes: string[] = [];
          for (let i = 0; i < 8; i++) {
            let p1 = '', p2 = '';
            for (let j = 0; j < 4; j++) {
              p1 += chars.charAt(Math.floor(Math.random() * chars.length));
              p2 += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            newCodes.push(`${p1}-${p2}`);
          }
          setBackupCodes(newCodes);
          await AsyncStorage.setItem(`@wanderstay_backup_codes_${userId}`, JSON.stringify(newCodes));
        }
      } catch (err) {}
    }

    loadSecurityData();
  }, [userId]);

  // Dynamic Security Health Score calculation
  const hasPassword = true;
  const hasEmail = Boolean(session?.user?.email);
  const hasPhone = Boolean(userPhone && userPhone.trim().length > 0);
  const has2FA = twoFactorEnabled;

  const score =
    (hasPassword ? 25 : 0) +
    (hasEmail ? 25 : 0) +
    (hasPhone ? 25 : 0) +
    (has2FA ? 25 : 0);
  const safeguardsConfigured =
    (hasPassword ? 1 : 0) +
    (hasEmail ? 1 : 0) +
    (hasPhone ? 1 : 0) +
    (has2FA ? 1 : 0);
  const totalSafeguards = 4;
  const status =
    score >= 90
      ? (i18n.language === 'vi' ? 'Tối ưu' : 'Optimal')
      : score >= 70
      ? (i18n.language === 'vi' ? 'Mạnh' : 'Strong')
      : (i18n.language === 'vi' ? 'Cần xem xét' : 'Needs Review');
  const level = score >= 90 ? 'Optimal' : score >= 70 ? 'Strong' : 'Moderate';

  const formattedPhone =
    userPhone && userPhone.length >= 6
      ? `${userPhone.slice(0, 3)} ••• ••${userPhone.slice(-3)}`
      : t('personalInfo.notSet');

  // Handle Real Password Update in Supabase Auth
  const handleUpdatePassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert(t('common.error'), i18n.language === 'vi' ? 'Vui lòng nhập mật khẩu mới.' : 'Please enter your new password.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), i18n.language === 'vi' ? 'Mật khẩu mới phải có ít nhất 6 ký tự.' : 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), i18n.language === 'vi' ? 'Mật khẩu xác nhận không khớp.' : 'Confirmation password does not match.');
      return;
    }

    try {
      setUpdatingPassword(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        Alert.alert(t('common.error'), error.message);
        return;
      }

      const nowText = i18n.language === 'vi' ? 'Vừa xong' : 'Just now';
      setMasterPasswordLastUpdated(nowText);
      if (userId) {
        await AsyncStorage.setItem(`@wanderstay_pass_updated_${userId}`, nowText);
      }

      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert(t('common.success'), i18n.language === 'vi' ? 'Mật khẩu chính đã được cập nhật thành công.' : 'Master password updated successfully.');
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || 'Error updating password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDisconnectGoogle = () => {
    Alert.alert(
      t('security.disconnect'),
      i18n.language === 'vi' ? 'Bạn có chắc chắn muốn hủy liên kết tài khoản Google này?' : 'Are you sure you want to disconnect this Google account?',
      [
        {
          text: t('security.disconnect'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(t('common.success'), i18n.language === 'vi' ? 'Tài khoản Google đã được hủy liên kết.' : 'Google account disconnected.');
          },
        },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const handleManageApple = () => {
    Alert.alert(t('security.appleId'), t('security.appleIdDesc'));
  };

  const handleToggle2FA = async (val: boolean) => {
    setTwoFactorEnabled(val);
    if (userId) {
      await AsyncStorage.setItem(`@wanderstay_2fa_${userId}`, val ? 'true' : 'false');
    }

    Alert.alert(
      val ? t('security.twoFactorOnTitle') : t('security.twoFactorOffTitle'),
      val
        ? t('security.twoFactorOnDesc')
        : t('security.twoFactorOffDesc', { score: score - 25 })
    );
  };

  const handleLogoutDevice = (device: SecurityDevice) => {
    Alert.alert(t('security.signOutDeviceTitle'), t('security.signOutDeviceDesc', { device: device.name }), [
      {
        text: t('security.signOutDevice'),
        style: 'destructive',
        onPress: () => {
          setDevices((prev) => prev.filter((d) => d.id !== device.id));
          Alert.alert(t('security.sessionEndedTitle'), t('security.sessionEndedDesc', { device: device.name }));
        },
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const handleLogoutAllOther = () => {
    Alert.alert(
      t('security.signOutAllTitle'),
      t('security.signOutAllDesc', { device: currentDeviceName }),
      [
        {
          text: t('security.signOutAll'),
          style: 'destructive',
          onPress: () => {
            setDevices((prev) => prev.filter((d) => d.isCurrent));
            Alert.alert(t('common.success'), t('security.signOutAllSuccessDesc'));
          },
        },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const handleDownloadData = () => {
    Alert.alert(
      t('security.downloadDataTitle'),
      t('security.downloadDataDesc'),
      [
        {
          text: t('security.requestCopy'),
          onPress: () => Alert.alert(t('security.requestSentTitle'), t('security.requestSentDesc')),
        },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('security.pauseOrDeleteTitle'),
      t('security.pauseOrDeleteDesc'),
      [
        {
          text: t('security.pause'),
          onPress: () => Alert.alert(t('security.pausedTitle'), t('security.pausedDesc')),
        },
        {
          text: t('security.deleteForever'),
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              t('common.notice'),
              t('security.deleteNoticeDesc')
            ),
        },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const handleMoreOptions = () => {
    Alert.alert(t('security.optionsTitle'), t('security.optionsDesc'), [
      {
        text: t('security.viewAuditLog'),
        onPress: () => Alert.alert(t('security.auditLogTitle'), t('security.auditLogDesc')),
      },
      { text: t('security.safetyStandards'), onPress: () => {} },
      { text: t('common.close'), style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAF8FF]" edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View className="h-16 px-4 flex-row items-center justify-between border-b border-[#E6E3F5]/80 bg-[#FAF8FF]">
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
          <Text className="text-lg font-bold text-textMain ml-1">Login & Security</Text>
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable
            className="w-9 h-9 rounded-full items-center justify-center bg-white shadow-sm border border-borderLight/30 active:opacity-70"
            onPress={handleMoreOptions}
          >
            <Ionicons name="ellipsis-horizontal" size={17} color="#131B2E" />
          </Pressable>
          <View className="w-8 h-8 rounded-full bg-[#006877] items-center justify-center shadow-sm ml-0.5">
            <Ionicons name="shield-checkmark" size={15} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
      >
        {/* Section - Security Health Score Hero */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-borderLight/40 mb-6 relative overflow-hidden">
          {/* Subtle background blur circle */}
          <View className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-[#4D44E3]/10" />

          {/* Top Row: Icon + Status + Score */}
          <View className="flex-row items-start justify-between">
            <View className="flex-row items-center gap-3.5 flex-1 pr-2">
              <View className="w-12 h-14 rounded-2xl bg-[#4D44E3] items-center justify-center shadow-md">
                <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
              </View>

              <View>
                <View className="flex-row items-center gap-2 mb-0.5">
                  <Text className="text-[11px] font-bold text-[#4D44E3] uppercase tracking-wider">
                    HEALTH SCORE
                  </Text>
                  <View className="px-2 py-0.5 rounded-full bg-[#EAEDFF] flex-row items-center gap-1">
                    <View className="w-1.5 h-1.5 rounded-full bg-[#4D44E3]" />
                    <Text className="text-[11px] font-bold text-[#4D44E3]">
                      {level}
                    </Text>
                  </View>
                </View>

                <Text className="text-xl font-bold text-[#131B2E] tracking-tight">
                  Security Status: {status}
                </Text>
              </View>
            </View>

            <View className="items-end">
              <Text className="text-2xl font-extrabold text-[#4D44E3] tracking-tight">
                {score}
              </Text>
              <Text className="text-xs font-semibold text-[#3C494C]">/100</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="h-2.5 rounded-full bg-[#E2E7FF] overflow-hidden my-3 relative">
            <LinearGradient
              colors={['#4D44E3', '#0051D5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ width: `${score}%`, height: '100%', borderRadius: 9999 }}
            />
          </View>

          {/* Safeguards Summary */}
          <View className="flex-row items-center justify-between pt-1">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="checkmark-circle" size={15} color="#4D44E3" />
              <Text className="text-xs font-semibold text-[#131B2E]">
                {safeguardsConfigured} of {totalSafeguards} critical safeguards configured
              </Text>
            </View>
            <Text className="text-xs font-bold text-[#4D44E3]">Protected</Text>
          </View>
        </View>

        {/* Section 1: Login Credentials */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-[#131B2E] px-1 mb-2.5">
            Login Credentials
          </Text>

          <View className="bg-white rounded-2xl p-4 shadow-sm border border-borderLight/40">
            {/* Master Password */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View className="w-10 h-10 rounded-full bg-[#E2E7FF] items-center justify-center">
                  <Ionicons name="lock-closed-outline" size={18} color="#4D44E3" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-[#131B2E]">Master Password</Text>
                  <Text className="text-xs text-[#3C494C] mt-0.5">
                    Last updated {masterPasswordLastUpdated}
                  </Text>
                </View>
              </View>

              <Pressable
                className="px-3.5 py-1.5 rounded-full bg-[#E2E7FF] active:opacity-70"
                onPress={() => setPasswordModalVisible(true)}
              >
                <Text className="text-xs font-bold text-[#4D44E3]">Update</Text>
              </Pressable>
            </View>

            <View className="h-[1px] bg-[#E2E7FF] my-3" />

            {/* Google Account */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View className="w-10 h-10 rounded-full bg-[#E2E7FF] items-center justify-center">
                  <Ionicons name="logo-google" size={18} color="#4D44E3" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-[#131B2E]">Google Account</Text>
                  <Text className="text-xs text-[#3C494C] mt-0.5" numberOfLines={1}>
                    Connected as {userEmail}
                  </Text>
                </View>
              </View>

              <Pressable
                className="px-3 py-1.5 rounded-full border border-borderLight active:opacity-70"
                onPress={handleDisconnectGoogle}
              >
                <Text className="text-xs font-semibold text-[#5A6478]">Disconnect</Text>
              </Pressable>
            </View>

            <View className="h-[1px] bg-[#E2E7FF] my-3" />

            {/* Apple ID */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View className="w-10 h-10 rounded-full bg-[#283044] items-center justify-center">
                  <Ionicons name="logo-apple" size={18} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-[#131B2E]">Apple ID</Text>
                  <Text className="text-xs text-[#3C494C] mt-0.5">Connected</Text>
                </View>
              </View>

              <Pressable
                className="px-3.5 py-1.5 rounded-full bg-[#E2E7FF] active:opacity-70"
                onPress={handleManageApple}
              >
                <Text className="text-xs font-bold text-[#4D44E3]">Manage</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Section 2: Two-Factor Authentication */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-[#131B2E] px-1 mb-2.5">
            Two-Factor Authentication
          </Text>

          <View className="bg-white rounded-2xl p-4 shadow-sm border border-borderLight/40">
            {/* 2FA Main Toggle Banner */}
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <Text className="text-base font-semibold text-[#131B2E]">2FA Protection</Text>
                <Text className="text-xs text-[#3C494C] mt-0.5">
                  Recommended for high security
                </Text>
              </View>
              <Switch
                value={twoFactorEnabled}
                onValueChange={handleToggle2FA}
                trackColor={{ false: '#E2E7FF', true: '#4D44E3' }}
                thumbColor="#FFFFFF"
                style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
              />
            </View>

            <View className="h-[1px] bg-[#E2E7FF] my-3" />

            {/* SMS Text Message */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View className="w-10 h-10 rounded-full bg-[#E2E7FF] items-center justify-center">
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#4D44E3" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-[#131B2E]">SMS Text Message</Text>
                  <Text className="text-xs text-[#3C494C] mt-0.5">{formattedPhone}</Text>
                </View>
              </View>

              <View className="px-2.5 py-0.5 rounded-full bg-[#E2E7FF]">
                <Text className="text-[11px] font-bold text-[#4D44E3]">Primary</Text>
              </View>
            </View>

            <View className="h-[1px] bg-[#E2E7FF] my-3" />

            {/* Authenticator App */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View className="w-10 h-10 rounded-full bg-[#E2E7FF] items-center justify-center">
                  <Ionicons name="phone-portrait-outline" size={18} color="#4D44E3" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-[#131B2E]">Authenticator App</Text>
                  <Text className="text-xs text-[#3C494C] mt-0.5">
                    Google Authenticator
                  </Text>
                </View>
              </View>

              <View className="px-2.5 py-0.5 rounded-full bg-[#E2E7FF]">
                <Text className="text-[11px] font-bold text-[#4D44E3]">Active</Text>
              </View>
            </View>

            <View className="h-[1px] bg-[#E2E7FF] my-3" />

            {/* Backup Recovery Codes */}
            <Pressable
              className="flex-row items-center justify-between active:opacity-70"
              onPress={() => setBackupCodesVisible(true)}
            >
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View className="w-10 h-10 rounded-full bg-[#E2E7FF] items-center justify-center">
                  <Ionicons name="key-outline" size={18} color="#4D44E3" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-[#131B2E]">
                    {t('security.backupCodes')}
                  </Text>
                  <Text className="text-xs text-[#3C494C] mt-0.5">
                    {t('security.backupCodesDesc')}
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={18} color="#8A90A6" />
            </Pressable>
          </View>
        </View>

        {/* Section 3: Where You're Logged In */}
        <View className="mb-6">
          <View className="px-1 mb-2.5">
            <Text className="text-lg font-semibold text-[#131B2E]">Where You're Logged In</Text>
            <Text className="text-xs text-[#3C494C] mt-0.5">
              Devices currently authorized to access WanderStay
            </Text>
          </View>

          <View className="bg-white rounded-2xl p-4 shadow-sm border border-borderLight/40 mb-3">
            {devices.map((device, idx) => (
              <React.Fragment key={device.id}>
                {idx > 0 && <View className="h-[1px] bg-[#E2E7FF] my-3" />}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3 flex-1 pr-2">
                    <View className="w-10 h-10 rounded-full bg-[#E2E7FF] items-center justify-center">
                      <Ionicons
                        name={
                          device.deviceType === 'phone'
                            ? 'phone-portrait-outline'
                            : device.deviceType === 'laptop'
                            ? 'laptop-outline'
                            : 'tablet-portrait-outline'
                        }
                        size={18}
                        color="#4D44E3"
                      />
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-base font-semibold text-[#131B2E]">
                          {device.name}
                        </Text>
                        {device.isCurrent && (
                          <View className="px-2 py-0.5 rounded-full bg-[#E2E7FF]">
                            <Text className="text-[10px] font-bold text-[#4D44E3]">
                              This device
                            </Text>
                          </View>
                        )}
                      </View>

                      <View className="flex-row items-center gap-1.5 mt-0.5">
                        {device.isCurrent && (
                          <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                        <Text className="text-xs text-[#3C494C]">
                          {device.location} • {device.lastActive}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {!device.isCurrent && (
                    <Pressable
                      className="px-3 py-1.5 rounded-full border border-red-200 active:opacity-70"
                      onPress={() => handleLogoutDevice(device)}
                    >
                      <Text className="text-xs font-semibold text-red-500">Log Out</Text>
                    </Pressable>
                  )}
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* Button: Log out of all other sessions */}
          <Pressable
            className="w-full py-3.5 rounded-2xl bg-white border border-borderLight items-center justify-center active:opacity-80 flex-row gap-2"
            onPress={handleLogoutAllOther}
          >
            <Ionicons name="log-out-outline" size={17} color="#BA1A1A" />
            <Text className="text-sm font-semibold text-[#BA1A1A]">
              Log out of all other sessions
            </Text>
          </Pressable>
        </View>

        {/* Section 4: Data & Privacy */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-[#131B2E] px-1 mb-2.5">
            Data & Privacy
          </Text>

          <View className="bg-white rounded-2xl p-4 shadow-sm border border-borderLight/40">
            {/* Download Account Data */}
            <Pressable
              className="flex-row items-center justify-between active:opacity-70"
              onPress={handleDownloadData}
            >
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View className="w-10 h-10 rounded-full bg-[#E2E7FF] items-center justify-center">
                  <Ionicons name="cloud-download-outline" size={18} color="#4D44E3" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-[#131B2E]">
                    Download Account Data
                  </Text>
                  <Text className="text-xs text-[#3C494C] mt-0.5">
                    Export booking history, messages, and profile
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={18} color="#8A90A6" />
            </Pressable>

            <View className="h-[1px] bg-[#E2E7FF] my-3" />

            {/* Deactivate or Delete Account */}
            <Pressable
              className="flex-row items-center justify-between active:opacity-70"
              onPress={handleDeleteAccount}
            >
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center">
                  <Ionicons name="trash-outline" size={18} color="#BA1A1A" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-[#BA1A1A]">
                    Deactivate or Delete Account
                  </Text>
                  <Text className="text-xs text-[#3C494C] mt-0.5">
                    Manage temporary pause or permanent removal
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={18} color="#8A90A6" />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Password Update Modal */}
      <Modal visible={passwordModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 shadow-2xl">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-textMain">{t('security.updatePasswordTitle')}</Text>
              <Pressable
                className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                onPress={() => setPasswordModalVisible(false)}
                disabled={updatingPassword}
              >
                <Ionicons name="close" size={18} color="#131B2E" />
              </Pressable>
            </View>

            <View className="gap-3 mb-6">
              <View>
                <Text className="text-xs font-semibold text-[#6C797D] mb-1">{t('security.newPasswordLabel')}</Text>
                <TextInput
                  placeholder={t('security.enterNewPassword')}
                  placeholderTextColor="#8A90A6"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-[#6C797D] mb-1">{t('security.confirmPasswordLabel')}</Text>
                <TextInput
                  placeholder={t('security.enterConfirmPassword')}
                  placeholderTextColor="#8A90A6"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                />
              </View>
            </View>

            <Pressable
              className="h-12 rounded-full bg-[#4D44E3] items-center justify-center shadow-md active:opacity-90 flex-row gap-2"
              onPress={handleUpdatePassword}
              disabled={updatingPassword}
            >
              {updatingPassword ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-sm font-semibold text-white">Save New Password</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Backup Recovery Codes Modal */}
      <Modal visible={backupCodesVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 shadow-2xl">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold text-textMain">{t('security.backupCodes')}</Text>
              <Pressable
                className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                onPress={() => setBackupCodesVisible(false)}
              >
                <Ionicons name="close" size={18} color="#131B2E" />
              </Pressable>
            </View>

            <Text className="text-xs text-[#3C494C] mb-4 leading-4">
              {t('security.backupCodesModalDesc')}
            </Text>

            <View className="flex-row flex-wrap gap-2.5 mb-6">
              {backupCodes.map((code, index) => (
                <View
                  key={index}
                  className="w-[47%] p-2.5 rounded-xl bg-[#F8F7FF] border border-borderLight items-center"
                >
                  <Text className="font-mono text-sm font-bold text-[#131B2E]">{code}</Text>
                </View>
              ))}
            </View>

            <Pressable
              className="h-12 rounded-full bg-[#4D44E3] items-center justify-center shadow-md active:opacity-90"
              onPress={() => {
                setBackupCodesVisible(false);
                Alert.alert(t('security.codesSavedTitle'), t('security.codesSavedDesc'));
              }}
            >
              <Text className="text-sm font-semibold text-white">{t('security.copyAllCodes')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
