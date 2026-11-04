import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: string;
  secure?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences';
  error?: string;
  touched?: boolean;
  onBlur?: () => void;
};

export default function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  secure,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error,
  touched,
  onBlur,
}: Props) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <Text className="text-xs font-bold tracking-wide text-textMain">{label}</Text>
      <View
        className={`mt-2 flex-row items-center rounded-xl border px-4 ${touched && error ? 'border-red-500' : focused ? 'border-brand' : 'border-borderLight'}`}
      >
        {icon ? <Ionicons name={icon as any} size={20} color="#5A6478" /> : null}
        <TextInput
          className="flex-1 py-3 text-base text-textMain ml-2"
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          secureTextEntry={secure && !show}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
        {secure ? (
          <Pressable onPress={() => setShow(!show)}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color="#5A6478" />
          </Pressable>
        ) : null}
      </View>
      {touched && error ? <Text className="mt-2 text-sm text-red-500">{error}</Text> : null}
    </View>
  );
}
