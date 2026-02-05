import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator, useColorScheme } from 'react-native';

export default function DashboardScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Redirect authenticated users to tabs
        router.replace('/(tabs)/home');
      } else {
        // Redirect unauthenticated users to login
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading indicator while checking auth
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#0A1929' : '#E6F4FE' }}>
      <ActivityIndicator size="large" color={isDark ? '#42A5F5' : '#1976D2'} />
    </View>
  );
}
