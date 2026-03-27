import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '../context/AuthContext';
import SplashScreenComponent from '../components/SplashScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppToast } from '../components/AppToast';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Native splash could already be controlled by platform lifecycle.
});

const MIN_SPLASH_MS = 800;

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const prepare = async () => {
      try {
        await Promise.all([
          new Promise((resolve) => setTimeout(resolve, MIN_SPLASH_MS)),
        ]);
      } finally {
        if (mounted) {
          setAppIsReady(true);
        }
      }
    };

    prepare();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!appIsReady) {
      return;
    }

    SplashScreen.hideAsync().catch(() => {
      // Ignore hide race conditions.
    });
  }, [appIsReady]);

  if (!appIsReady) {
    return <SplashScreenComponent />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
          <Stack.Screen name="dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <AppToast />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
