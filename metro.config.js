const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

if (process.env.NODE_ENV !== 'production') {
  config.resolver.extraNodeModules = {
    ...(config.resolver.extraNodeModules || {}),
    'expo-keep-awake': path.resolve(__dirname, 'shims/expoKeepAwake.ts'),
  };
}

module.exports = config;
