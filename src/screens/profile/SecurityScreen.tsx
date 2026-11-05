import React, { useState } from 'react';
import {
  Alert,
  Modal,
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
import {
  DEFAULT_SECURITY_DATA,
  SecurityDevice,
  SecurityHealthData,
} from '../../services/profileService';

interface SecurityScreenProps {
  navigation?: any;
}

export default function SecurityScreen({ navigation }: SecurityScreenProps) {
  const [securityData, setSecurityData] = useState<SecurityHealthData>(DEFAULT_SECURITY_DATA);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(securityData.twoFactorEnabled);

  // Update Password Modal State
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Backup Codes Modal State
  const [backupCodesVisible, setBackupCodesVisible] = useState(false);
  const dummyBackupCodes = [
    '8F92-KLA8',
    '4M29-PQ81',
    '99X2-WND8',
    '31BL-4821',
    '77KA-9912',
    '23MN-8841',
    '55TZ-6623',
    '19PL-7734',
  ];

  const handleUpdatePassword = () => {
    if (!currentPassword.trim()) {
      Alert.alert('Missing Password', 'Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Weak Password', 'New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }

    setSecurityData({
      ...securityData,
      masterPasswordLastUpdated: 'Just now',
    });
    setPasswordModalVisible(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    Alert.alert('Password Updated', 'Your Master Password has been changed successfully.');
  };

  const handleDisconnectGoogle = () => {
    Alert.alert('Disconnect Google Account', 'Are you sure you want to unlink your Google login?', [
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Disconnected', 'Google account has been unlinked.');
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleManageApple = () => {
    Alert.alert('Apple ID', 'Apple ID Sign In with Hide My Email is currently active.');
  };

  const handleToggle2FA = (val: boolean) => {
    setTwoFactorEnabled(val);
    const newScore = val ? 92 : 72;
    const newStatus = val ? 'Strong' : 'Moderate';
    const newLevel = val ? 'Optimal' : 'Needs Review';
    const newSafeguards = val ? 4 : 3;

    setSecurityData({
      ...securityData,
      score: newScore,
      status: newStatus,
      level: newLevel,
      safeguardsConfigured: newSafeguards,
      twoFactorEnabled: val,
    });

    Alert.alert(
      val ? '2FA Enabled' : '2FA Disabled',
      val
        ? 'Two-Factor Authentication is active for all logins.'
        : 'Warning: Disabling 2FA lowers your security health score.'
    );
  };

  const handleLogoutDevice = (device: SecurityDevice) => {
    Alert.alert('Log Out Device', `Revoke access for ${device.name}?`, [
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          setSecurityData({
            ...securityData,
            devices: securityData.devices.filter((d) => d.id !== device.id),
          });
          Alert.alert('Session Terminated', `${device.name} has been logged out.`);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleLogoutAllOther = () => {
    Alert.alert(
      'Log Out All Other Sessions',
      'This will disconnect all devices except this iPhone 15 Pro.',
      [
        {
          text: 'Log Out Others',
          style: 'destructive',
          onPress: () => {
            setSecurityData({
              ...securityData,
              devices: securityData.devices.filter((d) => d.isCurrent),
            });
            Alert.alert('Success', 'All other devices have been logged out.');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleDownloadData = () => {
    Alert.alert('Download Account Data', 'A secure download archive will be prepared and sent to your email within 24 hours.', [
      { text: 'Request Archive', onPress: () => Alert.alert('Request Submitted', 'Archive is being compiled.') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Deactivate or Delete Account',
      'Would you like to temporarily deactivate or permanently delete your WanderStay account?',
      [
        { text: 'Pause Account', onPress: () => Alert.alert('Account Paused', 'Your account is now temporarily paused.') },
        { text: 'Delete Permanently', style: 'destructive', onPress: () => Alert.alert('Notice', 'Please contact WanderStay support to finalize permanent account deletion.') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleMoreOptions = () => {
    Alert.alert('Security Options', 'Account & Privacy Standards', [
      { text: 'View Security Audit Log', onPress: () => Alert.alert('Audit Log', 'No suspicious logins detected in the last 90 days.') },
      { text: 'Security Best Practices', onPress: () => {} },
      { text: 'Close', style: 'cancel' },
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
                      {securityData.level}
                    </Text>
                  </View>
                </View>

                <Text className="text-xl font-bold text-[#131B2E] tracking-tight">
                  Security Status: {securityData.status}
                </Text>
              </View>
            </View>

            <View className="items-end">
              <Text className="text-2xl font-extrabold text-[#4D44E3] tracking-tight">
                {securityData.score}
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
              style={{ width: `${securityData.score}%`, height: '100%', borderRadius: 9999 }}
            />
          </View>

          {/* Safeguards Summary */}
          <View className="flex-row items-center justify-between pt-1">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="checkmark-circle" size={15} color="#4D44E3" />
              <Text className="text-xs font-semibold text-[#131B2E]">
                {securityData.safeguardsConfigured} of {securityData.totalSafeguards} critical safeguards configured
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
                    Last updated {securityData.masterPasswordLastUpdated}
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
                    Connected as {securityData.googleConnectedEmail}
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
                  <Text className="text-xs text-[#3C494C] mt-0.5">{securityData.smsPhone}</Text>
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
                    {securityData.authenticatorApp}
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
                    Backup Recovery Codes
                  </Text>
                  <Text className="text-xs text-[#3C494C] mt-0.5">
                    {securityData.backupCodesRemaining} unused backup codes generated
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
            {securityData.devices.map((device, idx) => (
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
              <Text className="text-lg font-bold text-textMain">Update Master Password</Text>
              <Pressable
                className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                onPress={() => setPasswordModalVisible(false)}
              >
                <Ionicons name="close" size={18} color="#131B2E" />
              </Pressable>
            </View>

            <View className="gap-3 mb-6">
              <View>
                <Text className="text-xs font-semibold text-[#6C797D] mb-1">Current Password</Text>
                <TextInput
                  placeholder="••••••••••••"
                  placeholderTextColor="#8A90A6"
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-[#6C797D] mb-1">New Password</Text>
                <TextInput
                  placeholder="At least 8 characters"
                  placeholderTextColor="#8A90A6"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-[#6C797D] mb-1">Confirm New Password</Text>
                <TextInput
                  placeholder="Repeat new password"
                  placeholderTextColor="#8A90A6"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                />
              </View>
            </View>

            <Pressable
              className="h-12 rounded-full bg-[#4D44E3] items-center justify-center shadow-md active:opacity-90"
              onPress={handleUpdatePassword}
            >
              <Text className="text-sm font-semibold text-white">Save New Password</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Backup Recovery Codes Modal */}
      <Modal visible={backupCodesVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 shadow-2xl">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold text-textMain">Backup Recovery Codes</Text>
              <Pressable
                className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                onPress={() => setBackupCodesVisible(false)}
              >
                <Ionicons name="close" size={18} color="#131B2E" />
              </Pressable>
            </View>

            <Text className="text-xs text-[#3C494C] mb-4 leading-4">
              Keep these one-time codes in a safe place. You can use each code once to log in if you lose access to your primary 2FA device.
            </Text>

            <View className="flex-row flex-wrap gap-2.5 mb-6">
              {dummyBackupCodes.map((code, index) => (
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
                Alert.alert('Codes Saved', 'All backup codes copied to clipboard.');
              }}
            >
              <Text className="text-sm font-semibold text-white">Copy All Codes</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
