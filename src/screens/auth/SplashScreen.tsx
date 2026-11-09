import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';

export interface SplashScreenProps {
  navigation?: any;
  onFinish?: () => void;
}

export function WanderStayLogo({
  width = 64,
  height = 80,
}: {
  width?: number;
  height?: number;
}) {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 80" fill="none">
      <Path
        d="M24.9412 0.941162H21.6471C9.69412 0.941162 0 10.6353 0 22.5882V60.7059C0 64 4.23529 65.8823 6.77647 63.7176C17.6941 54.4 24.9412 40.5647 24.9412 25.1294V0.941162Z"
        fill="#00BDCB"
      />
      <Path
        d="M34.353 17.4118C34.353 25.2035 40.6789 31.5294 48.4706 31.5294C56.2624 31.5294 62.5883 25.2035 62.5883 17.4118C62.5883 9.62003 56.2624 3.29413 48.4706 3.29413C40.6789 3.29413 34.353 9.62003 34.353 17.4118V17.4118"
        fill="#8C52FF"
      />
      <Path
        d="M34.353 58.8235C34.353 66.6153 40.6789 72.9412 48.4706 72.9412C56.2624 72.9412 62.5883 66.6153 62.5883 58.8235C62.5883 51.0318 56.2624 44.7059 48.4706 44.7059C40.6789 44.7059 34.353 51.0318 34.353 58.8235V58.8235"
        fill="#3875F6"
      />
    </Svg>
  );
}

export default function SplashScreen({ navigation, onFinish }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const finishTriggered = useRef(false);

  useEffect(() => {
    // 1. Entrance animation (fade-in & spring scale)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Trigger fade out at 1300ms
    const fadeOutTimer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }, 1300);

    // 3. Guaranteed completion callback at 1500ms
    const finishTimer = setTimeout(() => {
      if (finishTriggered.current) return;
      finishTriggered.current = true;

      if (onFinish) {
        onFinish();
      } else if (navigation?.replace) {
        navigation.replace('MainTabs');
      } else if (navigation?.navigate) {
        navigation.navigate('MainTabs');
      }
    }, 1500);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(finishTimer);
    };
  }, [navigation, onFinish]);

  return (
    <View className="flex-1 bg-white items-center justify-center">
      <StatusBar style="dark" />
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          width: 64,
          height: 80,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <WanderStayLogo width={64} height={80} />
      </Animated.View>
    </View>
  );
}
