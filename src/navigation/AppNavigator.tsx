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
import DescriptionScreen from '../screens/place/DescriptionScreen';
import FacilitiesScreen from '../screens/place/FacilitiesScreen';
import ReviewsScreen from '../screens/place/ReviewsScreen';
import MapScreen from '../screens/place/MapScreen';
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
        This screen will be replaced with the real screen in a later step.
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
      <Text className="text-2xl font-bold text-textMain text-center">You need to sign in</Text>
      <Text className="mt-2 text-base text-textMuted text-center">
        Sign in to view your {title}. Guests can still browse and search in the Search tab.
      </Text>
      <View className="mt-6 w-full">
        <AppButton title="Sign in" onPress={() => navigation.navigate('Login')} />
      </View>
      <Pressable className="mt-4 items-center" onPress={() => navigation.navigate('Search')}>
        <Text className="text-base font-bold text-brand">Back to Search</Text>
      </Pressable>
    </View>
  );
}

function ProfileTab({ navigation }: { navigation: any }) {
  const { session } = useAuth();
  if (!session) {
    return <GuardedScreen title="Profile" navigation={navigation} />;
  }
  return <ProfileScreen />;
}

function MyListsTab({ navigation }: { navigation: any }) {
  const { session } = useAuth();
  if (!session) {
    return <GuardedScreen title="Favorites" navigation={navigation} />;
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
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="My lists"
        options={{
          tabBarLabel: 'Favorites',
          tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" size={size} color={color} />,
        }}
      >
        {(props) => <MyListsTab {...props} />}
      </Tab.Screen>
      <Tab.Screen
        name="Booking"
        options={{
          tabBarLabel: 'Bookings',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      >
        {(props) => <GuardedScreen title="Bookings" {...props} />}
      </Tab.Screen>
      <Tab.Screen
        name="Inbox"
        options={{
          tabBarLabel: 'Inbox',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" size={size} color={color} />,
        }}
      >
        {(props) => <GuardedScreen title="Inbox" {...props} />}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{
          tabBarLabel: 'Profile',
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
        <Stack.Screen name="Description" component={DescriptionScreen} />
        <Stack.Screen name="Facilities" component={FacilitiesScreen} />
        <Stack.Screen name="Reviews" component={ReviewsScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
