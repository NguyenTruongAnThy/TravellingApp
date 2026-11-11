import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import AuthCard from '../../components/AuthCard';
import AuthHeader from '../../components/AuthHeader';
import {
  resetPasswordForEmail,
  verifyRecoveryCode,
} from '../../services/authService';

export default function ForgotPasswordScreen({
  navigation,
}: {
  navigation: any;
}) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [touchedCode, setTouchedCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resending, setResending] = useState(false);

  const emailError = useMemo(() => {
    if (!email) return t('auth.enterEmail');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t('auth.invalidEmail');
    return '';
  }, [email, t]);

  const isValid = !emailError;

  const handleSend = async () => {
    setTouchedEmail(true);
    setSubmitError('');
    if (!isValid) return;
    setLoading(true);
    try {
      await resetPasswordForEmail(email.trim());
      setSent(true);
    } catch {
      setSubmitError(t('auth.resetPasswordError'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setTouchedCode(true);
    setCodeError('');
    setResendMessage('');
    if (code.length < 6) return;
    setVerifying(true);
    try {
      await verifyRecoveryCode(email.trim(), code);
      navigation.navigate('ResetPassword', { verified: true });
    } catch {
      setCodeError(t('auth.invalidRecoveryCode'));
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setCodeError('');
    setResendMessage('');
    setResending(true);
    try {
      await resetPasswordForEmail(email.trim());
      setCode('');
      setTouchedCode(false);
      setResendMessage(t('auth.recoveryCodeResent'));
    } catch {
      setCodeError(t('auth.resetPasswordError'));
    } finally {
      setResending(false);
    }
  };

  if (sent) {
    return (
      <ScrollView
        className="flex-1 bg-appBg"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 24 }}
      >
        <Text className="text-3xl font-bold text-textMain text-center">
          {t('auth.resetLinkSentTitle')}
        </Text>
        <Text className="mt-3 text-base text-textMuted text-center">
          {t('auth.resetLinkSentDesc', { email: email.trim() })}
        </Text>

        <AuthCard>
          <Text className="text-base text-textMuted">
            {t('auth.recoveryCodeDesc')}
          </Text>

          <View className="mt-5">
            <AppInput
              label={t('auth.recoveryCodeLabel').toUpperCase()}
              icon="key-outline"
              placeholder={t('auth.recoveryCodePlaceholder')}
              keyboardType="phone-pad"
              autoCapitalize="none"
              value={code}
              onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 8))}
              onBlur={() => setTouchedCode(true)}
              error={codeError}
              touched={touchedCode}
            />
          </View>

          {resendMessage ? (
            <Text className="mt-3 text-sm text-green-600">{resendMessage}</Text>
          ) : null}

          <View className="mt-6">
            <AppButton
              title={t('auth.verifyCode')}
              onPress={handleVerifyCode}
              disabled={code.length < 6}
              loading={verifying}
            />
          </View>

          <View className="mt-5 items-center">
            <Text
              className="text-base font-bold text-brand"
              onPress={() => {
                if (!resending) handleResendCode();
              }}
            >
              {t('auth.resendRecoveryCode')}
            </Text>
          </View>
        </AuthCard>

        <View className="mt-8 w-full">
          <AppButton
            title={t('auth.backToSignIn')}
            onPress={() => navigation.goBack()}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-appBg"
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 48, paddingBottom: 24 }}
    >
      <AuthHeader onBack={() => navigation.goBack?.()} />

      <Text className="mt-6 text-3xl font-bold text-textMain">
        {t('auth.forgotPasswordTitle')}
      </Text>
      <Text className="mt-2 text-base text-textMuted">
        {t('auth.forgotPasswordDesc')}
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

        {submitError ? (
          <Text className="mt-3 text-sm text-red-500">{submitError}</Text>
        ) : null}

        <View className="mt-6">
          <AppButton
            title={t('auth.sendResetLink')}
            onPress={handleSend}
            disabled={!isValid}
            loading={loading}
          />
        </View>

        <View className="mt-5 items-center">
          <Text
            className="text-base font-bold text-brand"
            onPress={() => navigation.goBack()}
          >
            {t('auth.backToSignIn')}
          </Text>
        </View>
      </AuthCard>
    </ScrollView>
  );
}
