import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import SearchScreen from '../screens/search/SearchScreen';
import DetailScreen from '../screens/place/DetailScreen';
import MyListsScreen from '../screens/favorites/MyListsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import AppButton from '../components/AppButton';

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

function GuardedScreen({ title, navigation }: { title: string; navigation: any }) {
  const { session } = useAuth();
  if (session) {
    return <PlaceholderScreen title={title} />;
  }
  return (
    <View className="flex-1 bg-appBg items-center justify-center px-6">
      <Text className="text-2xl font-bold text-textMain text-center">Bạn cần đăng nhập</Text>
      <Text className="mt-2 text-base text-textMuted text-center">
        Đăng nhập để xem {title} của bạn. Khách vãng lai vẫn xem và tìm kiếm được ở tab Tìm kiếm.
      </Text>
      <View className="mt-6 w-full">
        <AppButton title="Đăng nhập" onPress={() => navigation.navigate('Login')} />
      </View>
      <Pressable className="mt-4 items-center" onPress={() => navigation.navigate('Search')}>
        <Text className="text-base font-bold text-brand">Quay lại Tìm kiếm</Text>
      </Pressable>
    </View>
  );
}

function ProfileTab({ navigation }: { navigation: any }) {
  const { session } = useAuth();
  if (!session) {
    return <GuardedScreen title="Hồ sơ" navigation={navigation} />;
  }
  return <ProfileScreen />;
}

function MyListsTab({ navigation }: { navigation: any }) {
  const { session } = useAuth();
  if (!session) {
    return <GuardedScreen title="Yêu thích" navigation={navigation} />;
  }
  return <MyListsScreen navigation={navigation} />;
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
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Tìm kiếm',
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="My lists"
        options={{
          tabBarLabel: 'Yêu thích',
          tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" size={size} color={color} />,
        }}
      >
        {(props) => <MyListsTab {...props} />}
      </Tab.Screen>
      <Tab.Screen
        name="Booking"
        options={{
          tabBarLabel: 'Đặt phòng',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      >
        {(props) => <GuardedScreen title="Đặt phòng" {...props} />}
      </Tab.Screen>
      <Tab.Screen
        name="Inbox"
        options={{
          tabBarLabel: 'Tin nhắn',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" size={size} color={color} />,
        }}
      >
        {(props) => <GuardedScreen title="Tin nhắn" {...props} />}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{
          tabBarLabel: 'Hồ sơ',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      >
        {(props) => <ProfileTab {...props} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 bg-appBg items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Detail" component={DetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
