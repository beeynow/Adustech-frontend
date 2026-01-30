import { Tabs } from 'expo-router';
import { useColorScheme, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? '#42A5F5' : '#1976D2',
        tabBarInactiveTintColor: isDark ? '#546E7A' : '#90A4AE',
        tabBarStyle: {
          backgroundColor: isDark ? '#0A1929' : '#FFFFFF',
          borderTopColor: isDark ? '#1E3A5F' : '#E0E0E0',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 16,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: isDark ? '#0A1929' : '#E6F4FE',
        },
        headerTintColor: isDark ? '#FFFFFF' : '#0A1929',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="channels"
        options={{
          title: 'Channels',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: '',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              width: 56,
              height: 36,
              backgroundColor: colorScheme === 'dark' ? '#42A5F5' : '#1976D2',
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ translateY: -6 }],
            }}>
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </View>
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="leadersboard"
        options={{
          title: 'Leadersboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'trophy' : 'trophy-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
