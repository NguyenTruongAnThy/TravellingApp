import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import AuthCard from '../../components/AuthCard';
import AuthHeader from '../../components/AuthHeader';
import SocialButton from '../../components/SocialButton';

export default function LoginScreen({ navigation }: { navigation: any }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailError = useMemo(() => {
    if (!email) return 'Please enter your email.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format.';
    return '';
  }, [email]);

  const passwordError = useMemo(() => {
    if (!password) return 'Please enter your password.';
    return '';
  }, [password]);

  const isValid = !emailError && !passwordError;

  const handleLogin = async () => {
    setTouchedEmail(true);
    setTouchedPassword(true);
    setSubmitError('');
    if (!isValid) return;
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      if (navigation.canGoBack && navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (err) {
      setSubmitError('Incorrect email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-appBg"
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 48, paddingBottom: 24 }}
    >
      <AuthHeader onBack={() => navigation.goBack?.()} />

      <Text className="mt-6 text-3xl font-bold text-textMain">Welcome back</Text>
      <Text className="mt-2 text-base text-textMuted">
        Sign in to manage your bookings and saved places
      </Text>

      <AuthCard>
        <AppInput
          label="EMAIL"
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
            label="PASSWORD"
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

        <Pressable className="mt-3 items-end">
          <Text className="text-sm font-bold text-brand">Forgot password?</Text>
        </Pressable>

        {submitError ? <Text className="mt-3 text-sm text-red-500">{submitError}</Text> : null}

        <View className="mt-6">
          <AppButton title="Continue →" onPress={handleLogin} disabled={!isValid} loading={loading} />
        </View>

        <Text className="mt-5 text-center text-sm text-textMuted">OR CONTINUE WITH</Text>
        <View className="mt-3 flex-row justify-between">
          <SocialButton source={require('../../../assets/Apple.png')} />
          <SocialButton source={require('../../../assets/GG.png')} />
          <SocialButton source={require('../../../assets/Fb.png')} />
        </View>

        <Text className="mt-5 text-center text-xs text-textMuted">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </AuthCard>

      <Pressable className="mt-8 items-center" onPress={() => navigation.navigate('Register')}>
        <Text className="text-base text-textMuted">
          Don't have an account? <Text className="font-bold text-brand">Sign Up</Text>
        </Text>
      </Pressable>
    </ScrollView>
  );
}
