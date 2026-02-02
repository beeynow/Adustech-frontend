/**
 * Local Deep Link Testing Utility
 * Use this in your app to test deep links during development
 */

import * as Linking from 'expo-linking';

export const testDeepLinks = {
  // Test universal links
  testProfile: () => {
    console.log('🧪 Testing: Profile link');
    Linking.openURL('https://beeynow.online/profile');
  },

  testEvents: () => {
    console.log('🧪 Testing: Events link');
    Linking.openURL('https://beeynow.online/events');
  },

  testEvent: (id: string = '123') => {
    console.log('🧪 Testing: Specific event link');
    Linking.openURL(`https://beeynow.online/event?id=${id}`);
  },

  testPost: (id: string = '456') => {
    console.log('🧪 Testing: Specific post link');
    Linking.openURL(`https://beeynow.online/post?id=${id}`);
  },

  testDepartment: (id: string = '789') => {
    console.log('🧪 Testing: Department link');
    Linking.openURL(`https://beeynow.online/department?id=${id}`);
  },

  testChannels: () => {
    console.log('🧪 Testing: Channels link');
    Linking.openURL('https://beeynow.online/channels');
  },

  testDashboard: () => {
    console.log('🧪 Testing: Dashboard link');
    Linking.openURL('https://beeynow.online/dashboard');
  },

  // Test app scheme
  testAppSchemeProfile: () => {
    console.log('🧪 Testing: App scheme - Profile');
    Linking.openURL('adustech://profile');
  },

  testAppSchemeEvents: () => {
    console.log('🧪 Testing: App scheme - Events');
    Linking.openURL('adustech://events');
  },

  testAppSchemeDashboard: () => {
    console.log('🧪 Testing: App scheme - Dashboard');
    Linking.openURL('adustech://dashboard');
  },

  // Test all links
  testAll: async () => {
    console.log('🧪 Testing all deep links...');
    const tests = [
      { name: 'Dashboard', url: 'https://beeynow.online/dashboard' },
      { name: 'Profile', url: 'https://beeynow.online/profile' },
      { name: 'Events', url: 'https://beeynow.online/events' },
      { name: 'Channels', url: 'https://beeynow.online/channels' },
      { name: 'Departments', url: 'https://beeynow.online/departments' },
    ];

    for (const test of tests) {
      console.log(`  Testing: ${test.name} - ${test.url}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('✅ All tests queued');
  },

  // Get current linking configuration
  getConfig: () => {
    const url = Linking.createURL('test');
    console.log('📱 App URL scheme:', url);
    return url;
  },

  // Parse a URL to see how it will be handled
  parseUrl: (url: string) => {
    const parsed = Linking.parse(url);
    console.log('🔍 Parsed URL:', {
      hostname: parsed.hostname,
      path: parsed.path,
      queryParams: parsed.queryParams,
    });
    return parsed;
  },
};

// Export for use in development
export default testDeepLinks;

// Usage in your app:
// import testDeepLinks from './test-deep-link-local';
// testDeepLinks.testProfile();
// testDeepLinks.testAll();
