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

export default function RegisterScreen({ navigation }: { navigation: any }) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const nameError = !name.trim() ? 'Vui lòng nhập họ tên.' : '';
  const emailError = useMemo(() => {
    if (!email) return 'Vui lòng nhập email.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email chưa đúng định dạng.';
    return '';
  }, [email]);

  const passwordLongEnough = password.length >= 8;
  const passwordHasNumberAndSpecial = /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
  const passwordError = !password
    ? 'Vui lòng nhập mật khẩu.'
    : !passwordLongEnough || !passwordHasNumberAndSpecial
      ? 'Mật khẩu chưa đạt yêu cầu bên dưới.'
      : '';

  const isValid = !nameError && !emailError && !passwordError;

  const handleRegister = async () => {
    setTouched(true);
    setSubmitError('');
    if (!isValid) return;
    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim(), phone.trim() || undefined);
      setSuccess(true);
    } catch (err) {
      setSubmitError('Không tạo được tài khoản. Email này có thể đã được đăng ký.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View className="flex-1 bg-appBg px-6 pt-16 items-center">
        <Text className="text-3xl font-bold text-textMain text-center">Đăng ký thành công</Text>
        <Text className="mt-3 text-base text-textMuted text-center">
          Tài khoản của bạn đã được tạo. Vui lòng đăng nhập để tiếp tục.
        </Text>
        <Pressable
          className="mt-8 rounded-full bg-brand py-3 px-8"
          onPress={() => navigation.navigate('Login')}
        >
          <Text className="text-base font-bold text-white">Đăng nhập ngay</Text>
        </Pressable>
      </View>
    );
  }

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

      <Text className="mt-6 text-3xl font-bold text-textMain">Create an account</Text>
      <Text className="mt-2 text-base text-textMuted">
        Find and book your perfect stay around the world
      </Text>

      <View className="mt-8 rounded-3xl bg-white p-5">
        <Text className="text-xs font-bold tracking-wide text-textMain">YOUR NAME</Text>
        <TextInput
          className="mt-2 rounded-xl border border-borderLight px-4 py-3 text-base text-textMain"
          placeholder="Nguyễn Văn A"
          value={name}
          onChangeText={setName}
        />
        {touched && nameError ? (
          <Text className="mt-2 text-sm text-red-500">{nameError}</Text>
        ) : null}

        <Text className="mt-5 text-xs font-bold tracking-wide text-textMain">ENTER YOUR EMAIL</Text>
        <TextInput
          className="mt-2 rounded-xl border border-borderLight px-4 py-3 text-base text-textMain"
          placeholder="name@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        {touched && emailError ? (
          <Text className="mt-2 text-sm text-red-500">{emailError}</Text>
        ) : null}

        <Text className="mt-5 text-xs font-bold tracking-wide text-textMain">PHONE (OPTIONAL)</Text>
        <TextInput
          className="mt-2 rounded-xl border border-borderLight px-4 py-3 text-base text-textMain"
          placeholder="0912 345 678"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Text className="mt-5 text-xs font-bold tracking-wide text-textMain">ENTER YOUR PASSWORD</Text>
        <View className="mt-2 flex-row items-center rounded-xl border border-borderLight px-4">
          <Text className="mr-2 text-base">🔒</Text>
          <TextInput
            className="flex-1 py-3 text-base text-textMain"
            placeholder="Create strong password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Text className="text-base">{showPassword ? '🙈' : '👁'}</Text>
          </Pressable>
        </View>
        <Text className="mt-3 text-sm text-textMuted">
          {passwordLongEnough ? '✓' : '○'} At least 8 characters
        </Text>
        <Text className="mt-1 text-sm text-textMuted">
          {passwordHasNumberAndSpecial ? '✓' : '○'} Contains a number &amp; special character
        </Text>
        {touched && passwordError ? (
          <Text className="mt-2 text-sm text-red-500">{passwordError}</Text>
        ) : null}

        {submitError ? (
          <Text className="mt-3 text-sm text-red-500">{submitError}</Text>
        ) : null}

        <Pressable
          className={`mt-6 rounded-full py-4 items-center ${isValid && !loading ? 'bg-brand' : 'bg-brand opacity-50'}`}
          disabled={!isValid || loading}
          onPress={handleRegister}
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
      </View>

      <Pressable
        className="mt-8 items-center"
        onPress={() => navigation.navigate('Login')}
      >
        <Text className="text-base text-textMuted">
          Already have an account? <Text className="font-bold text-brand">Log in</Text>
        </Text>
      </Pressable>
    </ScrollView>
  );
}
