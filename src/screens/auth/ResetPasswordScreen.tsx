import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import AuthCard from '../../components/AuthCard';
import AuthHeader from '../../components/AuthHeader';
import { supabase } from '../../lib/supabase';
import {
  signOut,
  updatePassword,
} from '../../services/authService';

// Mở bằng deep link wanderstay://reset-password?code=... (PKCE)
// hoặc wanderstay://reset-password#access_token=...&refresh_token=... (implicit).
// AppNavigator bắt link này và navigate tới đây kèm token qua route.params.
export default function ResetPasswordScreen({
  navigation,
  route,
}: {
  navigation: any;
  route?: {
    params?: {
      code?: string;
      accessToken?: string;
      refreshToken?: string;
      verified?: boolean;
    };
  };
}) {
  const { t } = useTranslation();
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Thiết lập session recovery từ token trong link email.
  useEffect(() => {
    // Luồng mã OTP (Expo Go/demo): verifyOtp đã thiết lập session recovery
    // nên bỏ qua bước đổi token lấy session.
    if (route?.params?.verified) {
      setSessionReady(true);
      return;
    }
    const code = route?.params?.code;
    const accessToken = route?.params?.accessToken;
    const refreshToken = route?.params?.refreshToken;
    let cancelled = false;
    // Luồng PKCE (mặc định của supabase-js v2): đổi code lấy session.
    // Luồng implicit (cũ): token nằm trong phần hash của URL.
    const establishSession = code
      ? supabase.auth.exchangeCodeForSession(code)
      : accessToken && refreshToken
        ? supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
        : null;
    if (!establishSession) {
      setSessionError(t('auth.resetPasswordError'));
      return;
    }
    establishSession.then(({ error }) => {
      if (cancelled) return;
      if (error) setSessionError(t('auth.resetPasswordError'));
      else setSessionReady(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const passwordLongEnough = newPassword.length >= 8;
  const passwordHasNumberAndSpecial =
    /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword);
  const passwordError = !newPassword
    ? t('auth.enterPassword')
    : !passwordLongEnough || !passwordHasNumberAndSpecial
      ? t('auth.passwordRequirements')
      : '';
  const confirmError =
    confirmPassword && confirmPassword !== newPassword
      ? t('auth.passwordMismatch')
      : '';

  const isValid = sessionReady && !passwordError && !confirmError && !!confirmPassword;

  const handleSubmit = async () => {
    setTouched(true);
    setSubmitError('');
    if (!isValid) return;
    setLoading(true);
    try {
      await updatePassword(newPassword);
      // Đăng xuất phiên recovery để user đăng nhập lại bằng mật khẩu mới.
      await signOut();
      setDone(true);
    } catch {
      setSubmitError(t('auth.resetPasswordError'));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View className="flex-1 bg-appBg px-6 pt-16 items-center">
        <Text className="text-3xl font-bold text-textMain text-center">
          {t('auth.resetPasswordSuccessTitle')}
        </Text>
        <Text className="mt-3 text-base text-textMuted text-center">
          {t('auth.resetPasswordSuccessDesc')}
        </Text>
        <View className="mt-8 w-full">
          <AppButton
            title={t('auth.signIn')}
            onPress={() => navigation.reset({ index: 1, routes: [{ name: 'MainTabs' }, { name: 'Login' }] })}
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-appBg"
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 48, paddingBottom: 24 }}
    >
      <AuthHeader onBack={() => navigation.goBack?.()} />

      <Text className="mt-6 text-3xl font-bold text-textMain">
        {t('auth.resetPasswordTitle')}
      </Text>

      <AuthCard>
        {sessionError ? (
          <Text className="text-sm text-red-500">{sessionError}</Text>
        ) : (
          <>
            <AppInput
              label={t('auth.newPassword').toUpperCase()}
              icon="lock-closed-outline"
              placeholder="••••••••"
              secure
              value={newPassword}
              onChangeText={setNewPassword}
              onBlur={() => setTouched(true)}
              error={passwordError}
              touched={touched}
            />

            <View className="mt-5">
              <AppInput
                label={t('auth.confirmNewPassword').toUpperCase()}
                icon="lock-closed-outline"
                placeholder="••••••••"
                secure
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onBlur={() => setTouched(true)}
                error={confirmError}
                touched={touched}
              />
            </View>

            {submitError ? (
              <Text className="mt-3 text-sm text-red-500">{submitError}</Text>
            ) : null}

            <View className="mt-6">
              <AppButton
                title={t('auth.resetPasswordTitle')}
                onPress={handleSubmit}
                disabled={!isValid}
                loading={loading}
              />
            </View>
          </>
        )}
      </AuthCard>
    </ScrollView>
  );
}
