import { Image, Pressable, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AuthHeader({ onBack }: { onBack?: () => void }) {
  return (
    <View className="flex-row items-center">
      <Pressable
        className="w-9 h-9 rounded-full bg-white items-center justify-center border border-borderLight"
        onPress={onBack}
      >
        <Ionicons name="arrow-back" size={20} color="#131B2E" />
      </Pressable>
      <Image
        source={require('../../assets/logo-wanderstay.png')}
        style={{ width: 32, height: 32, marginLeft: 12 }}
        resizeMode="contain"
      />
      <Text className="ml-2 text-xl font-bold text-textMain">WanderStay</Text>
    </View>
  );
}
