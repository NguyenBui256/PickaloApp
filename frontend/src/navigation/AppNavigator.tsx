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

/**
 * Screen types for type-safe navigation.
 */
export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  VenueDetails: { venueId: string };
  BookingDetails: { bookingId: string };
  Payment: { bookingId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Bookings: undefined;
  Messages: undefined;
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
 * Main tab navigator (bottom tabs).
 * TODO: Implement actual screen components in Sprint 11.
 */
function MainTabs(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" getComponent={() => createPlaceholderScreen('Home')} />
      <Tab.Screen name="Search" getComponent={() => createPlaceholderScreen('Search')} />
      <Tab.Screen name="Bookings" getComponent={() => createPlaceholderScreen('Bookings')} />
      <Tab.Screen name="Messages" getComponent={() => createPlaceholderScreen('Messages')} />
      <Tab.Screen name="Profile" getComponent={() => createPlaceholderScreen('Profile')} />
    </Tab.Navigator>
  );
}

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
      <Stack.Screen name="Login" getComponent={() => createPlaceholderScreen('Login')} />
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
              getComponent={() => createPlaceholderScreen('Venue Details')}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="BookingDetails"
              getComponent={() => createPlaceholderScreen('Booking Details')}
            />
            <Stack.Screen name="Payment" getComponent={() => createPlaceholderScreen('Payment')} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
