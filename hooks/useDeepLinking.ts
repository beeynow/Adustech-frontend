import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { showToast } from '../utils/toast';

/**
 * Deep Linking Hook for Adustech Tech
 * Handles both app scheme (adustech://) and universal links (https://beeynow.online)
 */
export function useDeepLinking() {
  const router = useRouter();
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Get the initial URL when app is opened via link
    const getInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        console.log('📱 Initial URL:', initialUrl);
        if (initialUrl) {
          // Small delay to ensure app is fully loaded
          setTimeout(() => {
            handleDeepLink(initialUrl);
          }, 500);
        }
      } catch (error) {
        console.error('❌ Error getting initial URL:', error);
      }
    };

    // Handle deep link
    const handleDeepLink = (url: string) => {
      console.log('🔗 Deep link received:', url);
      
      try {
        const { hostname, path, queryParams } = Linking.parse(url);
        console.log('📍 Parsed - hostname:', hostname, 'path:', path, 'params:', queryParams);
        
        // Handle different routes based on path
        if (path) {
          // Remove leading slash
          const cleanPath = path.startsWith('/') ? path.slice(1) : path;
          console.log('🎯 Navigating to:', cleanPath);
        
          let navigationSuccess = false;

          switch (cleanPath) {
            case '':
            case 'home':
            case 'dashboard':
              router.push('/dashboard' as any);
              showToast.info('Opening Dashboard', 'Welcome');
              navigationSuccess = true;
              break;

            case 'post':
              if (queryParams?.id) {
                router.push(`/post/${queryParams.id}` as any);
                showToast.info('Opening Post', 'Deep Link');
                navigationSuccess = true;
              } else {
                console.warn('⚠️ Post ID missing');
                router.push('/dashboard' as any);
              }
              break;
            
            case 'event':
              if (queryParams?.id) {
                router.push(`/event/${queryParams.id}` as any);
                showToast.info('Opening Event', 'Deep Link');
                navigationSuccess = true;
              } else {
                console.warn('⚠️ Event ID missing');
                router.push('/events' as any);
              }
              break;
            
            case 'channel':
            case 'channels':
              if (queryParams?.id) {
                // Navigate to channel detail when implemented
                console.log('📢 Opening channel:', queryParams.id);
                router.push('/channels-list' as any);
                showToast.info('Opening Channel', 'Deep Link');
              } else {
                router.push('/channels-list' as any);
                showToast.info('Opening Channels', 'Deep Link');
              }
              navigationSuccess = true;
              break;
            
            case 'department':
            case 'departments':
              if (queryParams?.id) {
                router.push(`/department/${queryParams.id}` as any);
                showToast.info('Opening Department', 'Deep Link');
                navigationSuccess = true;
              } else {
                router.push('/departments' as any);
                showToast.info('Opening Departments', 'Deep Link');
                navigationSuccess = true;
              }
              break;
            
            case 'profile':
              router.push('/(tabs)/profile' as any);
              showToast.info('Opening Profile', 'Deep Link');
              navigationSuccess = true;
              break;
            
            case 'events':
              router.push('/events' as any);
              showToast.info('Opening Events', 'Deep Link');
              navigationSuccess = true;
              break;
            
            case 'timetable':
            case 'timetables':
              if (queryParams?.id) {
                router.push(`/timetable/${queryParams.id}` as any);
                showToast.info('Opening Timetable', 'Deep Link');
                navigationSuccess = true;
              } else {
                router.push('/timetable' as any);
                showToast.info('Opening Timetables', 'Deep Link');
                navigationSuccess = true;
              }
              break;
            
            case 'login':
              router.push('/login' as any);
              navigationSuccess = true;
              break;
            
            case 'register':
            case 'signup':
              router.push('/register' as any);
              navigationSuccess = true;
              break;

            case 'home':
              router.push('/(tabs)/home' as any);
              showToast.info('Opening Home', 'Deep Link');
              navigationSuccess = true;
              break;

            case 'explore':
              router.push('/(tabs)/explore' as any);
              showToast.info('Opening Explore', 'Deep Link');
              navigationSuccess = true;
              break;

            case 'notifications':
              router.push('/(tabs)/notifications' as any);
              showToast.info('Opening Notifications', 'Deep Link');
              navigationSuccess = true;
              break;
            
            default:
              console.warn('⚠️ Unknown path:', cleanPath);
              router.push('/dashboard' as any);
              showToast.warning(`Unknown path: ${cleanPath}`, 'Deep Link');
              break;
          }

          if (navigationSuccess) {
            console.log('✅ Navigation successful to:', cleanPath);
          }
        } else {
          // No specific path, go to dashboard
          console.log('📍 No path specified, going to dashboard');
          router.push('/dashboard' as any);
        }
      } catch (error) {
        console.error('❌ Error handling deep link:', error);
        showToast.error('Failed to open link', 'Deep Link Error');
        // Fallback to dashboard
        router.push('/dashboard' as any);
      }
    };

    // Listen for incoming links while app is open
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('🔔 Incoming deep link event:', event.url);
      handleDeepLink(event.url);
    });

    // Get initial URL only on first mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      getInitialURL();
    }

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up deep link listener');
      subscription.remove();
    };
  }, [router]);

  // Log when hook is initialized
  console.log('🚀 Deep linking hook initialized');
}
