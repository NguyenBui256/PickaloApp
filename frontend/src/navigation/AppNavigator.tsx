/**
 * Main navigation structure for the ALOBO Booking app.
 * Uses React Navigation with native stack and bottom tabs.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native-stack';
import { PlaceholderScreen } from '@screens/PlaceholderScreen';
import { LoginScreen } from '@screens/auth/LoginScreen';
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../theme/colors';

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
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Custom button for the central "Explore" tab.
 */
const ExploreTabButton = ({ children, onPress }: any) => (
  <TouchableOpacity
    style={{
      top: -20,
      justifyContent: 'center',
      alignItems: 'center',
      ...styles.shadow,
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
      <Icon name="file-document-outline" size={32} color={COLORS.PRIMARY} />
    </View>
    <Text style={{ fontSize: 10, color: COLORS.PRIMARY, marginTop: 4, fontWeight: 'bold' }}>Khám phá</Text>
  </TouchableOpacity>
);

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
          let iconName = '';
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Map') iconName = 'map-marker-radius';
          else if (route.name === 'Explore') iconName = 'compass-outline';
          else if (route.name === 'Highlights') iconName = 'fire';
          else if (route.name === 'Profile') iconName = 'account-circle';
          return <Icon name={iconName} size={size} color={color} />;
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

const styles = {
  shadow: {
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  }
};

/**
 * Auth stack navigator.
 * TODO: Implement actual auth screens in Sprint 11.
 */
function AuthStack(): React.JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" getComponent={() => createPlaceholderScreen('Register')} />
      <Stack.Screen
        name="ForgotPassword"
        getComponent={() => createPlaceholderScreen('Forgot Password')}
      />
    </Stack.Navigator>
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
  // TODO: Implement auth state checking and conditional navigation
  const isAuthenticated = false; // Will come from auth store

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
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
                headerShown: false 
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
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
