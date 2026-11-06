import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
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
import BookingsScreen from '../screens/booking/BookingsScreen';
import ConfirmAndPayScreen from '../screens/booking/ConfirmAndPayScreen';
import PaymentSuccessScreen from '../screens/booking/PaymentSuccessScreen';
import TripReceiptScreen from '../screens/booking/TripReceiptScreen';
import SmartKeyScreen from '../screens/booking/SmartKeyScreen';
import DirectionsScreen from '../screens/booking/DirectionsScreen';
import InboxListScreen from '../screens/inbox/InboxListScreen';
import HostChatScreen from '../screens/inbox/HostChatScreen';
import TravelAssistantScreen from '../screens/inbox/TravelAssistantScreen';
import PersonalInfoScreen from '../screens/profile/PersonalInfoScreen';
import SecurityScreen from '../screens/profile/SecurityScreen';
import PaymentsWalletScreen from '../screens/profile/PaymentsWalletScreen';
import AppButton from '../components/AppButton';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function GuardedScreen({ title }: { title: string }) {
  const navigation = useNavigation<any>();
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

function ProfileTab() {
  const { session } = useAuth();
  if (!session) {
    return <GuardedScreen title="Profile" />;
  }
  return <ProfileScreen />;
}

function MyListsTab() {
  const { session } = useAuth();
  if (!session) {
    return <GuardedScreen title="Favorites" />;
  }
  return <MyListsScreen />;
}

function BookingTab() {
  const { session } = useAuth();
  if (!session) {
    return <GuardedScreen title="Bookings" />;
  }
  return <BookingsScreen />;
}

function InboxTab() {
  const { session } = useAuth();
  if (!session) {
    return <GuardedScreen title="Inbox" />;
  }
  return <InboxListScreen />;
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
        component={MyListsTab}
        options={{
          tabBarLabel: 'Favorites',
          tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Booking"
        component={BookingTab}
        options={{
          tabBarLabel: 'Bookings',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Inbox"
        component={InboxTab}
        options={{
          tabBarLabel: 'Inbox',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileTab}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { loading } = useAuth();

  return (
    <NavigationContainer>
      {loading ? (
        <View className="flex-1 bg-appBg items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Detail" component={DetailScreen} />
          <Stack.Screen name="Description" component={DescriptionScreen} />
          <Stack.Screen name="Facilities" component={FacilitiesScreen} />
          <Stack.Screen name="Reviews" component={ReviewsScreen} />
          <Stack.Screen name="Map" component={MapScreen} />

          {/* Extended Stack Screens from Feature Branches */}
          <Stack.Screen name="ConfirmAndPay" component={ConfirmAndPayScreen} />
          <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
          <Stack.Screen name="Bookings" component={BookingsScreen} />
          <Stack.Screen name="TripReceipt" component={TripReceiptScreen} />
          <Stack.Screen name="SmartKey" component={SmartKeyScreen} />
          <Stack.Screen name="Directions" component={DirectionsScreen} />
          <Stack.Screen name="InboxList" component={InboxListScreen} />
          <Stack.Screen name="HostChat" component={HostChatScreen} />
          <Stack.Screen name="TravelAssistant" component={TravelAssistantScreen} />
          <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
          <Stack.Screen name="Security" component={SecurityScreen} />
          <Stack.Screen name="PaymentsWallet" component={PaymentsWalletScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
