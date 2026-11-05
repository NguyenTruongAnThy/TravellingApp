import { View } from 'react-native';
import type { ReactNode } from 'react';

export default function AuthCard({ children }: { children: ReactNode }) {
  return <View className="mt-8 rounded-3xl bg-white border border-borderLight p-5">{children}</View>;
}
