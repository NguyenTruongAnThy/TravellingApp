import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function PlaceholderScreen({ title }: { title: string }) {
  const { signOut } = useAuth();
  return (
    <View className="flex-1 bg-appBg items-center justify-center px-6">
      <Text className="text-2xl font-bold text-textMain">{title}</Text>
      <Text className="mt-2 text-base text-textMuted text-center">
        Màn này sẽ được thay bằng màn thật ở bước sau.
      </Text>
      {title === 'Profile' ? (
        <Pressable
          className="mt-8 rounded-full bg-brand py-3 px-8"
          onPress={() => signOut()}
        >
          <Text className="text-base font-bold text-white">Log out</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#8A90A6',
      }}
    >
      <Tab.Screen name="Search" options={{ tabBarLabel: 'Search' }}>
        {() => <PlaceholderScreen title="Search" />}
      </Tab.Screen>
      <Tab.Screen name="My lists" options={{ tabBarLabel: 'My lists' }}>
        {() => <PlaceholderScreen title="My lists" />}
      </Tab.Screen>
      <Tab.Screen name="Booking" options={{ tabBarLabel: 'Booking' }}>
        {() => <PlaceholderScreen title="Booking" />}
      </Tab.Screen>
      <Tab.Screen name="Inbox" options={{ tabBarLabel: 'Inbox' }}>
        {() => <PlaceholderScreen title="Inbox" />}
      </Tab.Screen>
      <Tab.Screen name="Profile" options={{ tabBarLabel: 'Profile' }}>
        {() => <PlaceholderScreen title="Profile" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 bg-appBg items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? (
        <MainTabs />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
