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

export default function LoginScreen({ navigation }: { navigation: any }) {
  const { t, i18n } = useTranslation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<
    null | 'google' | 'facebook'
  >(null);
  const [socialError, setSocialError] = useState('');

  const emailError = useMemo(() => {
    if (!email) return t('auth.enterEmail');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t('auth.invalidEmail');
    return '';
  }, [email, t]);

  const passwordError = useMemo(() => {
    if (!password) return t('auth.enterPassword');
    return '';
  }, [password, t]);

  const isValid = !emailError && !passwordError;

  const handleLogin = async () => {
    setTouchedEmail(true);
    setTouchedPassword(true);
    setSubmitError('');
    if (!isValid) return;
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // Login-guard: if Login was opened from another tab/screen (e.g. Detail),
      // go back to that screen after a successful sign-in. If Login is the first
      // screen and cannot go back, stay, because the session has changed.
      if (navigation.canGoBack && navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (err) {
      setSubmitError(t('auth.loginError'));
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

  return (
    <ScrollView
      className="flex-1 bg-appBg"
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 48, paddingBottom: 24 }}
    >
      <AuthHeader onBack={() => navigation.goBack?.()} />

      <Text className="mt-6 text-3xl font-bold text-textMain">{t('auth.welcomeBack')}</Text>
      <Text className="mt-2 text-base text-textMuted">
        {t('auth.loginSubtitle')}
      </Text>

      <AuthCard>
        <AppInput
          label={t('auth.email').toUpperCase()}
          icon="mail-outline"
          placeholder="name@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          onBlur={() => setTouchedEmail(true)}
          error={emailError}
          touched={touchedEmail}
        />

        <View className="mt-5">
          <AppInput
            label={t('auth.password').toUpperCase()}
            icon="lock-closed-outline"
            placeholder="••••••••"
            secure
            value={password}
            onChangeText={setPassword}
            onBlur={() => setTouchedPassword(true)}
            error={passwordError}
            touched={touchedPassword}
          />
        </View>

        <Pressable className="mt-3 items-end" onPress={() => navigation.navigate('ForgotPassword')}>
          <Text className="text-sm font-bold text-brand">
            {i18n.language === 'vi' ? 'Quên mật khẩu?' : 'Forgot password?'}
          </Text>
        </Pressable>

        {submitError ? <Text className="mt-3 text-sm text-red-500">{submitError}</Text> : null}

        <View className="mt-6">
          <AppButton title={t('auth.signIn')} onPress={handleLogin} disabled={!isValid} loading={loading} />
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
            ? 'Bằng việc tiếp tục, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.'
            : 'By continuing, you agree to the Terms of Service and Privacy Policy.'}
        </Text>
      </AuthCard>

      <Pressable className="mt-8 items-center" onPress={() => navigation.navigate('Register')}>
        <Text className="text-base text-textMuted">
          {t('auth.noAccount')} <Text className="font-bold text-brand">{t('auth.signUp')}</Text>
        </Text>
      </Pressable>
    </ScrollView>
  );
}
