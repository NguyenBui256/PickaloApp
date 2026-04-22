/**
 * Main navigation structure for the ALOBO Booking app.
 * Uses React Navigation with native stack and bottom tabs.
 */

import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigatorScreenParams } from '@react-navigation/native';
import { PlaceholderScreen } from '@screens/PlaceholderScreen';
import { LoginScreen } from '@screens/auth/LoginScreen';
import { HomeScreen } from '@screens/home/HomeScreen';
import { VenueDetailScreen } from '@screens/venue/VenueDetailScreen';
import { MapVenueDetailOverlayScreen } from '@screens/venue/MapVenueDetailOverlayScreen';
import { MapScreen } from '@screens/map/MapScreen';
import { ExploreScreen } from '@screens/explore/ExploreScreen';
import { HighlightsScreen } from '@screens/highlights/HighlightsScreen';
import { ProfileScreen } from '@screens/profile/ProfileScreen';
import { BookingDetailsScreen } from '@screens/booking/BookingDetailsScreen';
import { PaymentScreen } from '@screens/booking/PaymentScreen';
import { FinalPaymentScreen } from '@screens/booking/FinalPaymentScreen';
import { BookingListScreen } from '@screens/profile/BookingListScreen';
import { BookingHistoryDetailScreen } from '@screens/profile/BookingHistoryDetailScreen';
import { SearchScreen } from '@screens/search/SearchScreen';
import { EditProfileScreen } from '@screens/profile/EditProfileScreen';
import { SettingsScreen } from '@screens/profile/SettingsScreen';
import { VenueRegistrationScreen } from '@screens/owner/venue/VenueRegistrationScreen';
import { MaintenanceSchedulerScreen } from '@screens/owner/venue/MaintenanceSchedulerScreen';
import { OwnerBookingDetailScreen } from '@screens/profile/OwnerBookingDetailScreen';
import { OwnerRevenueReportScreen } from '@screens/profile/OwnerRevenueReportScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '@theme/colors';
import { useAuthStore } from '../store/auth-store';
import { OwnerNavigator } from './OwnerNavigator';

/**
 * Screen types for type-safe navigation.
 */
export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  VenueDetails: { venueId: string };
  MapVenueDetailOverlay: { venueId: string };
  BookingDetails: { venueId: string };
  Payment: { venueId: string, selectedSlots: string[] };
  FinalPayment: { totalPrice: string, bookingId: string };
  BookingList: undefined;
  BookingHistoryDetail: { booking: any };
  PaymentResult: { bookingId: string };
  Search: undefined;
  EditProfile: undefined;
  Settings: undefined;
  VenueRegistration: undefined;
  MaintenanceScheduler: { venueId: string };
  OwnerBookingDetail: { booking: any };
  OwnerRevenueReport: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Map: undefined;
  Explore: undefined;
  Highlights: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthNavStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const ExploreTabButton = ({ children, onPress }: any) => {
  const shadowStyle = {
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  };

  return (
    <TouchableOpacity
      style={{
        ...shadowStyle,
        top: -20,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: COLORS.WHITE,
          borderWidth: 3,
          borderColor: COLORS.PRIMARY,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <MaterialCommunityIcons name="file-document-outline" size={32} color={COLORS.PRIMARY} />
      </View>
      <Text style={{ fontSize: 10, color: COLORS.PRIMARY, marginTop: 4, fontWeight: 'bold' }}>Khám phá</Text>
    </TouchableOpacity>
  );
};

/**
 * Main tab navigator (bottom tabs).
 * TODO: Implement actual screen components in Sprint 11.
 */
function MainTabs(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: COLORS.GRAY_MEDIUM,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap = 'home';
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Map') iconName = 'map-marker-radius';
          else if (route.name === 'Explore') iconName = 'compass-outline';
          else if (route.name === 'Highlights') iconName = 'fire';
          else if (route.name === 'Profile') iconName = 'account-circle';
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Trang chủ' }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ tabBarLabel: 'Bản đồ' }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarLabel: 'Khám phá',
          tabBarButton: (props) => <ExploreTabButton {...props} />
        }}
      />
      <Tab.Screen
        name="Highlights"
        component={HighlightsScreen}
        options={{ tabBarLabel: 'Nổi bật' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Tài khoản' }}
      />
    </Tab.Navigator>
  );
}

/**
 * Auth stack navigator.
 * TODO: Implement actual auth screens in Sprint 11.
 */
function AuthStack(): React.JSX.Element {
  return (
    <AuthNavStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthNavStack.Screen name="Login" component={LoginScreen} />
      <AuthNavStack.Screen name="Register" getComponent={() => () => createPlaceholderScreen('Register')} />
      <AuthNavStack.Screen
        name="ForgotPassword"
        getComponent={() => () => createPlaceholderScreen('Forgot Password')}
      />
    </AuthNavStack.Navigator>
  );
}

/**
 * Create a placeholder screen with given name.
 */
function createPlaceholderScreen(name: string): React.JSX.Element {
  return <PlaceholderScreen name={name} />;
}

/**
 * Root navigator with auth flow and main app tabs.
 */
export function AppNavigator(): React.JSX.Element {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated ? (
          <>
            {user?.role === 'MERCHANT' ? (
              <Stack.Screen name="Main" component={OwnerNavigator} />
            ) : (
              <Stack.Screen name="Main" component={MainTabs} />
            )}
            <Stack.Screen
              name="VenueDetails"
              component={VenueDetailScreen}
              options={{ presentation: 'card' }}
            />
            <Stack.Screen
              name="MapVenueDetailOverlay"
              component={MapVenueDetailOverlayScreen}
              options={{
                presentation: 'transparentModal',
                animation: 'slide_from_bottom',
                headerShown: false,
                gestureEnabled: false, // Use our custom swipe gesture
              }}
            />
            <Stack.Screen
              name="BookingDetails"
              component={BookingDetailsScreen}
            />
            <Stack.Screen
              name="Payment"
              component={PaymentScreen}
            />
            <Stack.Screen
              name="FinalPayment"
              component={FinalPaymentScreen}
            />
            <Stack.Screen
              name="BookingList"
              component={BookingListScreen}
            />
            <Stack.Screen
              name="BookingHistoryDetail"
              component={BookingHistoryDetailScreen}
            />
            <Stack.Screen
              name="Search"
              component={SearchScreen}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
            />
            <Stack.Screen
              name="VenueRegistration"
              component={VenueRegistrationScreen}
            />
            <Stack.Screen
              name="MaintenanceScheduler"
              component={MaintenanceSchedulerScreen}
            />
            <Stack.Screen
              name="OwnerBookingDetail"
              component={OwnerBookingDetailScreen}
            />
            <Stack.Screen
              name="OwnerRevenueReport"
              component={OwnerRevenueReportScreen}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
