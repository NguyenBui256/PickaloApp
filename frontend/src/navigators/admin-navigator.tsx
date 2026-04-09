/**
 * Admin Navigation for ALOBO Booking platform.
 * Tab-based navigation for admin dashboard and management screens.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { AdminDashboardScreen } from '@screens/admin/admin-dashboard-screen';
import { AdminUsersScreen } from '@screens/admin/admin-users-screen';
import { AdminMerchantsScreen } from '@screens/admin/admin-merchants-screen';
import { AdminBookingsScreen } from '@screens/admin/admin-bookings-screen';
import { AdminContentScreen } from '@screens/admin/admin-content-screen';
import { AdminAuditLogScreen } from '@screens/admin/admin-audit-log-screen';

/**
 * Admin tab navigator parameter list.
 */
export type AdminTabParamList = {
  Dashboard: undefined;
  Users: undefined;
  Merchants: undefined;
  Bookings: undefined;
  Content: undefined;
  AuditLog: undefined;
};

/**
 * Navigation prop type for admin screens.
 */
export type AdminNavigationProp = BottomTabNavigationProp<AdminTabParamList>;

const Tab = createBottomTabNavigator<AdminTabParamList>();

/**
 * Admin tab navigator with all admin management screens.
 * Only accessible to users with ADMIN role.
 */
export function AdminNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#0066CC',
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Users"
        component={AdminUsersScreen}
        options={{
          title: 'Users',
          tabBarLabel: 'Users',
        }}
      />
      <Tab.Screen
        name="Merchants"
        component={AdminMerchantsScreen}
        options={{
          title: 'Merchants',
          tabBarLabel: 'Merchants',
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={AdminBookingsScreen}
        options={{
          title: 'Bookings',
          tabBarLabel: 'Bookings',
        }}
      />
      <Tab.Screen
        name="Content"
        component={AdminContentScreen}
        options={{
          title: 'Content',
          tabBarLabel: 'Content',
        }}
      />
      <Tab.Screen
        name="AuditLog"
        component={AdminAuditLogScreen}
        options={{
          title: 'Audit Log',
          tabBarLabel: 'Audit Log',
        }}
      />
    </Tab.Navigator>
  );
}
