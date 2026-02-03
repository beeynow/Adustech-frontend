import { useEffect, useState, useCallback } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { View } from "react-native";
import SplashScreenComponent from "../components/SplashScreen";
import { AuthProvider } from "../context/AuthContext";
import Toast from "react-native-toast-message";

// Immediately hide the native splash screen and show our custom one
SplashScreen.hideAsync().catch(() => {
  // Splash screen might already be hidden, that's okay
});

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('🎨 Custom Splash Screen Loading...');
        
        // Pre-load fonts, make any API calls you need to do here
        // Add any additional loading logic here
        
        // Wait for 2 seconds before showing the main app
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('✅ Splash Screen Complete - Moving to Index Page');
      } catch (e) {
        console.warn('Splash screen error:', e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []); // Empty array - only runs once on initial mount

  const onLayoutRootView = useCallback(() => {
    // No need to hide splash screen here - already hidden at startup
  }, []);

  // Show custom splash screen until app is ready
  if (!appIsReady) {
    return <SplashScreenComponent />;
  }

  return (
    <AuthProvider>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <Stack screenOptions={{
          headerShown: false,
        }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
          <Stack.Screen name="dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <Toast />
      </View>
    </AuthProvider>
  );
}
