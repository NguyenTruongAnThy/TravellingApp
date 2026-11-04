import { Image, Pressable } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

export default function SocialButton({ source, onPress }: { source: ImageSourcePropType; onPress?: () => void }) {
  return (
    <Pressable
      className="flex-1 mx-1 rounded-xl border border-borderLight py-3 items-center bg-white"
      onPress={onPress}
    >
      <Image source={source} style={{ width: 24, height: 24 }} resizeMode="contain" />
    </Pressable>
  );
}
