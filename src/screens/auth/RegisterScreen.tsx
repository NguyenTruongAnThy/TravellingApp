import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import AuthCard from '../../components/AuthCard';
import AuthHeader from '../../components/AuthHeader';
import SocialButton from '../../components/SocialButton';

export default function RegisterScreen({ navigation }: { navigation: any }) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
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
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const strengthScore =
    (passwordLongEnough ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);
  const strengthLabel =
    strengthScore >= 3 ? 'Strong' : strengthScore === 2 ? 'Medium' : password ? 'Weak' : '';

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
        <View className="mt-8 w-full">
          <AppButton title="Đăng nhập ngay" onPress={() => navigation.navigate('Login')} />
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

      <Text className="mt-6 text-3xl font-bold text-textMain">Create an account</Text>
      <Text className="mt-2 text-base text-textMuted">
        Find and book your perfect stay around the world
      </Text>

      <AuthCard>
        <AppInput
          label="YOUR NAME"
          icon="person-outline"
          placeholder="Nguyễn Văn A"
          value={name}
          onChangeText={setName}
          error={nameError}
          touched={touched}
        />

        <View className="mt-5">
          <AppInput
            label="ENTER YOUR EMAIL"
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
            label="PHONE (OPTIONAL)"
            icon="call-outline"
            placeholder="0912 345 678"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View className="mt-5">
          <AppInput
            label="ENTER YOUR PASSWORD"
            icon="lock-closed-outline"
            placeholder="Create strong password"
            secure
            value={password}
            onChangeText={setPassword}
            error={passwordError}
            touched={touched}
          />
        </View>

        <View className="mt-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-textMuted">Password strength</Text>
            <Text className="text-sm font-bold text-brand">{strengthLabel}</Text>
          </View>
          <View className="mt-2 flex-row gap-2">
            <View className={`flex-1 h-2 rounded-full ${strengthScore >= 1 ? 'bg-brand' : 'bg-borderLight'}`} />
            <View className={`flex-1 h-2 rounded-full ${strengthScore >= 2 ? 'bg-brand' : 'bg-borderLight'}`} />
            <View className={`flex-1 h-2 rounded-full ${strengthScore >= 3 ? 'bg-brand' : 'bg-borderLight'}`} />
          </View>
        </View>
        <Text className={`mt-3 text-sm ${passwordLongEnough ? 'text-green-600 font-bold' : 'text-textMuted'}`}>
          {passwordLongEnough ? '✓' : '○'} At least 8 characters
        </Text>
        <Text
          className={`mt-1 text-sm ${passwordHasNumberAndSpecial ? 'text-green-600 font-bold' : 'text-textMuted'}`}
        >
          {passwordHasNumberAndSpecial ? '✓' : '○'} Contains a number &amp; special character
        </Text>

        {submitError ? <Text className="mt-3 text-sm text-red-500">{submitError}</Text> : null}

        <View className="mt-6">
          <AppButton title="Continue →" onPress={handleRegister} disabled={!isValid} loading={loading} />
        </View>

        <Text className="mt-5 text-center text-sm text-textMuted">OR CONTINUE WITH</Text>
        <View className="mt-3 flex-row justify-between">
          <SocialButton source={require('../../../assets/Apple.png')} />
          <SocialButton source={require('../../../assets/GG.png')} />
          <SocialButton source={require('../../../assets/Fb.png')} />
        </View>

        <Text className="mt-5 text-center text-xs text-textMuted">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </AuthCard>

      <Pressable className="mt-8 items-center" onPress={() => navigation.navigate('Login')}>
        <Text className="text-base text-textMuted">
          Already have an account? <Text className="font-bold text-brand">Log in</Text>
        </Text>
      </Pressable>
    </ScrollView>
  );
}
