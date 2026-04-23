import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '@theme/colors';

import { OwnerDashboardScreen } from '../screens/owner/dashboard/OwnerDashboardScreen';
import { ScheduleManagementScreen } from '../screens/owner/schedule/ScheduleManagementScreen';
import { OwnerVenueListScreen } from '../screens/owner/venue/OwnerVenueListScreen';
import { ServiceManagementScreen } from '../screens/owner/service/ServiceManagementScreen';
import { OwnerProfileScreen } from '../screens/profile/OwnerProfileScreen';

export type OwnerTabParamList = {
  Dashboard: undefined;
  Schedules: undefined;
  MyVenues: undefined;
  Services: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<OwnerTabParamList>();

export function OwnerNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1976D2', // Owner primary color
        tabBarInactiveTintColor: COLORS.GRAY_MEDIUM,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#EEE',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={OwnerDashboardScreen}
        options={{
          tabBarLabel: 'Tổng quan',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Schedules"
        component={ScheduleManagementScreen}
        options={{
          tabBarLabel: 'Lịch đặt',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-multiselect" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MyVenues"
        component={OwnerVenueListScreen}
        options={{
          tabBarLabel: 'Sân của tôi',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="storefront" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Services"
        component={ServiceManagementScreen}
        options={{
          tabBarLabel: 'Dịch vụ',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="room-service" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={OwnerProfileScreen}
        options={{
          tabBarLabel: 'Tài khoản',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
