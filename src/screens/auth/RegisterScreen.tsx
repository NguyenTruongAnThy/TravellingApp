import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import AuthCard from '../../components/AuthCard';
import AuthHeader from '../../components/AuthHeader';
import SocialButton from '../../components/SocialButton';
import { signInWithOAuth } from '../../services/authService';

export default function RegisterScreen({ navigation }: { navigation: any }) {
  const { t, i18n } = useTranslation();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<
    null | 'google' | 'facebook'
  >(null);
  const [socialError, setSocialError] = useState('');

  const nameError = !name.trim() ? t('auth.enterFullName') : '';
  const emailError = useMemo(() => {
    if (!email) return t('auth.enterEmail');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t('auth.invalidEmail');
    return '';
  }, [email, t]);

  const passwordLongEnough = password.length >= 8;
  const passwordHasNumberAndSpecial = /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
  const passwordError = !password
    ? t('auth.enterPassword')
    : !passwordLongEnough || !passwordHasNumberAndSpecial
      ? t('auth.passwordRequirements')
      : '';

  const isValid = !nameError && !emailError && !passwordError;
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const strengthScore =
    (passwordLongEnough ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);
  const strengthLabel =
    strengthScore >= 3
      ? (i18n.language === 'vi' ? 'Mạnh' : 'Strong')
      : strengthScore === 2
      ? (i18n.language === 'vi' ? 'Trung bình' : 'Medium')
      : password
      ? (i18n.language === 'vi' ? 'Yếu' : 'Weak')
      : '';

  const handleRegister = async () => {
    setTouched(true);
    setSubmitError('');
    if (!isValid) return;
    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim(), phone.trim() || undefined);
      setSuccess(true);
    } catch (err) {
      setSubmitError(i18n.language === 'vi' ? 'Không thể tạo tài khoản. Email này có thể đã được đăng ký.' : 'Could not create the account. This email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'facebook') => {
    if (socialLoading) return;
    setSocialError('');
    setSocialLoading(provider);
    try {
      const ok = await signInWithOAuth(provider);
      // AuthContext cập nhật session qua onAuthStateChange.
      // Mở Login từ màn khác (vd Detail) thì quay lại màn đó sau khi đăng nhập.
      if (ok && navigation.canGoBack && navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch {
      setSocialError(t('auth.socialError'));
    } finally {
      setSocialLoading(null);
    }
  };

  if (success) {
    return (
      <View className="flex-1 bg-appBg px-6 pt-16 items-center">
        <Text className="text-3xl font-bold text-textMain text-center">{t('auth.registerSuccessTitle')}</Text>
        <Text className="mt-3 text-base text-textMuted text-center">
          {t('auth.registerSuccessDesc')}
        </Text>
        <View className="mt-8 w-full">
          <AppButton title={t('auth.signIn')} onPress={() => navigation.navigate('Login')} />
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

      <Text className="mt-6 text-3xl font-bold text-textMain">{t('auth.createAccount')}</Text>
      <Text className="mt-2 text-base text-textMuted">
        {i18n.language === 'vi' ? 'Tìm và đặt chỗ ở phù hợp nhất cho chuyến đi của bạn' : 'Find and book a stay that fits your trip'}
      </Text>

      <AuthCard>
        <AppInput
          label={t('auth.fullName').toUpperCase()}
          icon="person-outline"
          placeholder="Nguyễn Văn A"
          value={name}
          onChangeText={setName}
          error={nameError}
          touched={touched}
        />

        <View className="mt-5">
          <AppInput
            label={t('auth.email').toUpperCase()}
            icon="mail-outline"
            placeholder="name@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            error={emailError}
            touched={touched}
          />
        </View>

        <View className="mt-5">
          <AppInput
            label={`${t('auth.phoneNumber').toUpperCase()} (${i18n.language === 'vi' ? 'TÙY CHỌN' : 'OPTIONAL'})`}
            icon="call-outline"
            placeholder="0912 345 678"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View className="mt-5">
          <AppInput
            label={t('auth.password').toUpperCase()}
            icon="lock-closed-outline"
            placeholder={i18n.language === 'vi' ? 'Nhập mật khẩu an toàn' : 'Create a strong password'}
            secure
            value={password}
            onChangeText={setPassword}
            error={passwordError}
            touched={touched}
          />
        </View>

        <View className="mt-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-textMuted">
              {i18n.language === 'vi' ? 'Độ mạnh mật khẩu' : 'Password strength'}
            </Text>
            <Text className="text-sm font-bold text-brand">{strengthLabel}</Text>
          </View>
          <View className="mt-2 flex-row gap-2">
            <View className={`flex-1 h-2 rounded-full ${strengthScore >= 1 ? 'bg-brand' : 'bg-borderLight'}`} />
            <View className={`flex-1 h-2 rounded-full ${strengthScore >= 2 ? 'bg-brand' : 'bg-borderLight'}`} />
            <View className={`flex-1 h-2 rounded-full ${strengthScore >= 3 ? 'bg-brand' : 'bg-borderLight'}`} />
          </View>
        </View>
        <Text className={`mt-3 text-sm ${passwordLongEnough ? 'text-green-600 font-bold' : 'text-textMuted'}`}>
          {passwordLongEnough ? '✓' : '○'} {i18n.language === 'vi' ? 'Tối thiểu 8 ký tự' : 'At least 8 characters'}
        </Text>
        <Text
          className={`mt-1 text-sm ${passwordHasNumberAndSpecial ? 'text-green-600 font-bold' : 'text-textMuted'}`}
        >
          {passwordHasNumberAndSpecial ? '✓' : '○'} {i18n.language === 'vi' ? 'Bao gồm số và ký tự đặc biệt' : 'Includes a number and a special character'}
        </Text>

        {submitError ? <Text className="mt-3 text-sm text-red-500">{submitError}</Text> : null}

        <View className="mt-6">
          <AppButton title={t('auth.createAccount')} onPress={handleRegister} disabled={!isValid} loading={loading} />
        </View>

        <Text className="mt-5 text-center text-sm text-textMuted">
          {i18n.language === 'vi' ? 'HOẶC TIẾP TỤC VỚI' : 'OR CONTINUE WITH'}
        </Text>
        <View className="mt-3 flex-row justify-between">
          <SocialButton source={require('../../../assets/Apple.png')} />
          <SocialButton
            source={require('../../../assets/GG.png')}
            onPress={() => handleSocialSignIn('google')}
          />
          <SocialButton
            source={require('../../../assets/Fb.png')}
            onPress={() => handleSocialSignIn('facebook')}
          />
        </View>

        {socialError ? (
          <Text className="mt-3 text-sm text-red-500 text-center">{socialError}</Text>
        ) : null}

        <Text className="mt-5 text-center text-xs text-textMuted">
          {i18n.language === 'vi'
            ? 'Bằng việc đăng ký, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.'
            : 'By signing up, you agree to the Terms of Service and Privacy Policy.'}
        </Text>
      </AuthCard>

      <Pressable className="mt-8 items-center" onPress={() => navigation.navigate('Login')}>
        <Text className="text-base text-textMuted">
          {t('auth.haveAccount')} <Text className="font-bold text-brand">{t('auth.signIn')}</Text>
        </Text>
      </Pressable>
    </ScrollView>
  );
}
