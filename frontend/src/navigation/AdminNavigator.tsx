import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '@theme/colors';

import { AdminDashboardScreen } from '../screens/admin/dashboard/AdminDashboardScreen';
import { AdminUserManagementScreen } from '../screens/admin/users/AdminUserManagementScreen';
import { AdminVenueManagementScreen } from '../screens/admin/venues/AdminVenueManagementScreen';
import { AdminPostManagementScreen } from '../screens/admin/posts/AdminPostManagementScreen';
import { AdminProfileScreen } from '../screens/admin/profile/AdminProfileScreen';

export type AdminTabParamList = {
  Dashboard: undefined;
  Users: undefined;
  Venues: undefined;
  Posts: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

export function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.PRIMARY,
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
        component={AdminDashboardScreen}
        options={{
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Users"
        component={AdminUserManagementScreen}
        options={{
          tabBarLabel: 'Người dùng',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Venues"
        component={AdminVenueManagementScreen}
        options={{
          tabBarLabel: 'Quản lý sân',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="stadium" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Posts"
        component={AdminPostManagementScreen}
        options={{
          tabBarLabel: 'Bài đăng',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="newspaper-variant-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={AdminProfileScreen}
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
