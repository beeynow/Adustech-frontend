import { Tabs, useRouter } from 'expo-router';
import { useColorScheme, View, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { useAnimatedStyle, withSpring, interpolate } from 'react-native-reanimated';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../utils/permissions';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  // Check if user can access upload tab (only power admin and admin)
  const canUpload = user?.role === 'power' || user?.role === 'admin';

  // Protect tabs - redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? '#64B5F6' : '#1976D2',
        tabBarInactiveTintColor: isDark ? '#546E7A' : '#B0BEC5',
        tabBarStyle: {
          backgroundColor: isDark ? '#0A1929' : '#FFFFFF',
          borderTopColor: isDark ? 'rgba(66,165,245,0.2)' : 'rgba(25,118,210,0.1)',
          borderTopWidth: 2,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? 34 : 20, // Increased bottom padding
          paddingTop: 8,
          paddingHorizontal: 8,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: isDark ? '#0A1929' : '#E6F4FE',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: isDark ? '#FFFFFF' : '#0A1929',
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 20,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              transform: [{ scale: focused ? 1.1 : 1 }],
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={26} color={color} />
              {focused && (
                <View style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: color,
                  marginTop: 4,
                }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="channels"
        options={{
          title: 'Channels',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              transform: [{ scale: focused ? 1.1 : 1 }],
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={24} color={color} />
              {focused && (
                <View style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: color,
                  marginTop: 4,
                }} />
              )}
            </View>
          ),
        }}
      />
      {/* Upload tab - Only visible for power admin and admin */}
      {canUpload && (
        <Tabs.Screen
          name="upload"
          options={{
            title: '',
            tabBarIcon: ({ color, focused }) => (
              <View style={{
                width: 60,
                height: 60,
                backgroundColor: isDark ? '#42A5F5' : '#1976D2',
                borderRadius: 30,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: -28,
                shadowColor: isDark ? '#42A5F5' : '#1976D2',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
                borderWidth: 4,
                borderColor: isDark ? '#0A1929' : '#FFFFFF',
                transform: [{ scale: focused ? 1.05 : 1 }],
              }}>
                <Ionicons name="add" size={28} color="#FFFFFF" />
              </View>
            ),
            headerShown: false,
          }}
        />
      )}
      <Tabs.Screen
        name="leadersboard"
        options={{
          title: 'Leaders',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              transform: [{ scale: focused ? 1.1 : 1 }],
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons name={focused ? 'trophy' : 'trophy-outline'} size={24} color={color} />
              {focused && (
                <View style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: color,
                  marginTop: 4,
                }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              transform: [{ scale: focused ? 1.1 : 1 }],
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
              {focused && (
                <View style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: color,
                  marginTop: 4,
                }} />
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
