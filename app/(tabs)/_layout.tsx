import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeIn, LinearTransition, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';

const TAB_META = {
  home: {
    label: 'Home',
    icon: 'home-outline',
    activeIcon: 'home',
  },
  channels: {
    label: 'Rooms',
    icon: 'grid-outline',
    activeIcon: 'grid',
  },
  upload: {
    label: 'Create',
    icon: 'add',
    activeIcon: 'add',
  },
  leadersboard: {
    label: 'Rank',
    icon: 'trophy-outline',
    activeIcon: 'trophy',
  },
  profile: {
    label: 'Me',
    icon: 'person-outline',
    activeIcon: 'person',
  },
} as const satisfies Record<string, {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}>;

function FloatingTabBar({ state, descriptors, navigation, canUpload }: BottomTabBarProps & { canUpload: boolean }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const visibleRoutes = state.routes.filter((route) => route.name !== 'upload' || canUpload);
  const isCompact = width < 390;

  const centerSlotWidth = isCompact ? 76 : 84;
  const centerButtonSize = isCompact ? 58 : 62;
  const centerButtonOffset = isCompact ? -24 : -28;
  const horizontalInset = isCompact ? 14 : 18;

  const leftRoutes = visibleRoutes.filter(
    (route) => route.name === 'home' || route.name === 'channels'
  );

  const rightRoutes = visibleRoutes.filter(
    (route) => route.name === 'leadersboard' || route.name === 'profile'
  );

  const uploadRoute = visibleRoutes.find((route) => route.name === 'upload');

  const renderTabItem = (route: typeof visibleRoutes[number]) => {
    const descriptor = descriptors[route.key];
    const options = descriptor.options;
    const meta = TAB_META[route.name as keyof typeof TAB_META];

    if (!meta) return null;

    const originalIndex = state.routes.findIndex((candidate) => candidate.key === route.key);
    const isFocused = state.index === originalIndex;

    const onPress = () => {
      Haptics.selectionAsync().catch(() => {});

      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    const onLongPress = () => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    };

    return (
      <View key={route.key} style={styles.sideTabSlot}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={isFocused ? { selected: true } : {}}
          accessibilityLabel={options.tabBarAccessibilityLabel}
          testID={options.tabBarButtonTestID}
          onPress={onPress}
          onLongPress={onLongPress}
          style={styles.edgePressable}
        >
          <Animated.View
            layout={LinearTransition.springify().damping(17).stiffness(170)}
            style={[styles.itemShell, isFocused ? styles.itemShellActive : styles.itemShellIdle]}
          >
            <Ionicons
              name={isFocused ? meta.activeIcon : meta.icon}
              size={route.name === 'profile' ? 23 : 21}
              color={isFocused ? '#12100F' : 'rgba(255,255,255,0.78)'}
            />
            {isFocused ? (
              <Text style={styles.activeLabel} numberOfLines={1}>
                {meta.label}
              </Text>
            ) : null}
          </Animated.View>
        </Pressable>
      </View>
    );
  };

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View
        entering={FadeIn.duration(220)}
        layout={LinearTransition.springify().damping(18).stiffness(180)}
        style={[
          styles.tabBarWrap,
          {
            bottom: Math.max(insets.bottom, 10) + 10,
            left: horizontalInset,
            right: horizontalInset,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(13, 13, 15, 0.96)', 'rgba(22, 19, 18, 0.98)']}
          style={styles.tabBarGradient}
        >
          <View style={styles.tabRail}>
            <View style={styles.sideGroup}>
              {leftRoutes.map(renderTabItem)}
            </View>

            {uploadRoute ? (
              <View style={[styles.centerSlot, { width: centerSlotWidth }]}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    const originalIndex = state.routes.findIndex((r) => r.key === uploadRoute.key);
                    const isFocused = state.index === originalIndex;

                    Haptics.selectionAsync().catch(() => {});

                    const event = navigation.emit({
                      type: 'tabPress',
                      target: uploadRoute.key,
                      canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                      navigation.navigate(uploadRoute.name, uploadRoute.params);
                    }
                  }}
                  style={[styles.centerButtonPressable, { marginTop: centerButtonOffset }]}
                >
                  <Animated.View entering={ZoomIn.duration(280)} style={styles.centerButtonWrap}>
                    <LinearGradient
                      colors={['#61B7FF', '#1F85FF', '#0B63F6']}
                      style={[
                        styles.centerButton,
                        {
                          width: centerButtonSize,
                          height: centerButtonSize,
                          borderRadius: centerButtonSize / 2,
                        },
                      ]}
                    >
                      <Ionicons name="add" size={30} color="#FFFFFF" />
                    </LinearGradient>
                  </Animated.View>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.sideGroup}>
              {rightRoutes.map(renderTabItem)}
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  const isDark = useColorScheme() === 'dark';
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  const canUpload = user?.role === 'power' || user?.role === 'admin';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} canUpload={canUpload} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#08182B' : '#F8FBFF',
        },
        headerTintColor: isDark ? '#F8FBFF' : '#0F172A',
        headerShadowVisible: false,
        headerTitleStyle: {
          fontSize: 19,
          fontWeight: '900',
        },
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 118 : 102,
          elevation: 0,
        },
        sceneStyle: {
          backgroundColor: isDark ? '#07111F' : '#F8FBFF',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="channels"
        options={{
          title: 'Rooms',
        }}
      />

      {canUpload ? (
        <Tabs.Screen
          name="upload"
          options={{
            title: 'Create',
            headerShown: false,
          }}
        />
      ) : (
        <Tabs.Screen
          name="upload"
          options={{
            href: null,
          }}
        />
      )}

      <Tabs.Screen
        name="leadersboard"
        options={{
          title: 'Leaders',
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrap: {
    position: 'absolute',
  },

  tabBarGradient: {
  borderRadius: 32,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
  paddingTop: 0,
  paddingBottom: Platform.OS === 'ios' ? 16 : 12,
  paddingHorizontal: 10,
  overflow: 'visible',
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 18 },
  shadowOpacity: 0.22,
  shadowRadius: 28,
  elevation: 18,
},

  tabRail: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: 66,
  },

  sideGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
  },

  sideTabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  centerSlot: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  edgePressable: {
  width: '100%',
  alignItems: 'center',
  justifyContent: 'flex-end',
  paddingTop: 12,
},

  itemShell: {
    minHeight: 46,
    minWidth: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },

  itemShellIdle: {
    width: 46,
    backgroundColor: 'transparent',
  },

  itemShellActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 6,
    backgroundColor: '#F5EEDF',
    maxWidth: 92,
  },

  activeLabel: {
    color: '#12100F',
    fontSize: 11,
    fontWeight: '800',
    flexShrink: 1,
  },

  centerButtonPressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  centerButtonWrap: {
    shadowColor: '#157CFF',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },

  centerButton: {
    borderWidth: 4,
    borderColor: '#0E0D0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
