import { ActivityIndicator, Pressable, Text } from 'react-native';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export default function AppButton({ title, onPress, disabled, loading }: Props) {
  return (
    <Pressable
      className={`rounded-full py-4 items-center ${disabled || loading ? 'bg-brand opacity-50' : 'bg-brand'}`}
      disabled={disabled || loading}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text className="text-base font-bold text-white">{title}</Text>
      )}
    </Pressable>
  );
}
