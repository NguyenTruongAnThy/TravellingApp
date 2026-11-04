import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }: { navigation: any }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailError = useMemo(() => {
    if (!email) return 'Vui lòng nhập email.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email chưa đúng định dạng.';
    return '';
  }, [email]);

  const passwordError = useMemo(() => {
    if (!password) return 'Vui lòng nhập mật khẩu.';
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
    } catch (err) {
      setSubmitError('Email hoặc mật khẩu chưa đúng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-appBg" contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 48, paddingBottom: 24 }}>
      <View className="flex-row items-center">
        <Pressable onPress={() => navigation.goBack?.()}>
          <Text className="text-2xl text-textMain">‹</Text>
        </Pressable>
        <Image
          source={require('../../../assets/logo-wanderstay.png')}
          style={{ width: 32, height: 32, marginLeft: 12 }}
          resizeMode="contain"
        />
        <Text className="ml-2 text-xl font-bold text-textMain">WanderStay</Text>
      </View>

      <Text className="mt-6 text-3xl font-bold text-textMain">Welcome back</Text>
      <Text className="mt-2 text-base text-textMuted">
        Log in to access your bookings and saved favorites
      </Text>

      <View className="mt-8 rounded-3xl bg-white p-5">
        <Text className="text-xs font-bold tracking-wide text-textMain">
          ENTER YOUR EMAIL
        </Text>
        <TextInput
          className="mt-2 rounded-xl border border-borderLight px-4 py-3 text-base text-textMain"
          placeholder="name@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          onBlur={() => setTouchedEmail(true)}
        />
        {touchedEmail && emailError ? (
          <Text className="mt-2 text-sm text-red-500">{emailError}</Text>
        ) : null}

        <Text className="mt-5 text-xs font-bold tracking-wide text-textMain">
          ENTER YOUR PASSWORD
        </Text>
        <View className="mt-2 flex-row items-center rounded-xl border border-borderLight px-4">
          <Text className="mr-2 text-base">🔒</Text>
          <TextInput
            className="flex-1 py-3 text-base text-textMain"
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            onBlur={() => setTouchedPassword(true)}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Text className="text-base">{showPassword ? '🙈' : '👁'}</Text>
          </Pressable>
        </View>
        {touchedPassword && passwordError ? (
          <Text className="mt-2 text-sm text-red-500">{passwordError}</Text>
        ) : null}

        <Pressable className="mt-3 items-end">
          <Text className="text-sm font-bold text-brand">Forgot password?</Text>
        </Pressable>

        {submitError ? (
          <Text className="mt-3 text-sm text-red-500">{submitError}</Text>
        ) : null}

        <Pressable
          className={`mt-6 rounded-full py-4 items-center ${isValid && !loading ? 'bg-brand' : 'bg-brand opacity-50'}`}
          disabled={!isValid || loading}
          onPress={handleLogin}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-base font-bold text-white">Continue →</Text>
          )}
        </Pressable>

        <Text className="mt-5 text-center text-sm text-textMuted">
          OR CONTINUE WITH
        </Text>
        <View className="mt-3 flex-row justify-between">
          <Pressable className="flex-1 mx-1 rounded-xl border border-borderLight py-3 items-center">
            <Image
              source={require('../../../assets/Apple.png')}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          </Pressable>
          <Pressable className="flex-1 mx-1 rounded-xl border border-borderLight py-3 items-center">
            <Image
              source={require('../../../assets/GG.png')}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          </Pressable>
          <Pressable className="flex-1 mx-1 rounded-xl border border-borderLight py-3 items-center">
            <Image
              source={require('../../../assets/Fb.png')}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          </Pressable>
        </View>

        <Text className="mt-5 text-center text-xs text-textMuted">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>

      <Pressable
        className="mt-8 items-center"
        onPress={() => navigation.navigate('Register')}
      >
        <Text className="text-base text-textMuted">
          Don&apos;t have an account? <Text className="font-bold text-brand">Sign up</Text>
        </Text>
      </Pressable>
    </ScrollView>
  );
}
