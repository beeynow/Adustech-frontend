import Constants from 'expo-constants';
import { Platform } from 'react-native';

type RuntimeEnvironment = 'development' | 'production' | 'test';

const DEFAULT_PROD_BASE_URL = 'https://adustech-backend.vercel.app';

const getExpoHostBaseUrl = (): string | undefined => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any)?.manifest?.debuggerHost;

  if (!hostUri || typeof hostUri !== 'string') {
    return undefined;
  }

  const host = hostUri.split(':')[0];
  if (!host) {
    return undefined;
  }

  return `http://${host}:5000`;
};

const getDefaultDevBaseUrl = (): string => {
  const expoHostBaseUrl = getExpoHostBaseUrl();
  if (expoHostBaseUrl) {
    return expoHostBaseUrl;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }
  return 'http://localhost:5000';
};

const normalizeBaseUrl = (baseUrl: string): string => {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error(`Invalid API base URL "${baseUrl}". Include http:// or https://`);
  }
  return trimmed;
};

const getRuntimeEnvironment = (): RuntimeEnvironment => {
  if (__DEV__) {
    return 'development';
  }
  return 'production';
};

const readEnvironmentBaseUrl = (): string | undefined => {
  const fromPublicEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromPublicEnv) {
    return fromPublicEnv;
  }

  const fromExpoExtra = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl;
  return fromExpoExtra;
};

const enforceSecureTransportForProduction = (baseUrl: string, env: RuntimeEnvironment): string => {
  if (env !== 'production') {
    return baseUrl;
  }

  if (baseUrl.startsWith('http://')) {
    return baseUrl.replace('http://', 'https://');
  }

  return baseUrl;
};

export const getApiBaseUrl = (): string => {
  const env = getRuntimeEnvironment();
  const configuredBaseUrl = readEnvironmentBaseUrl();
  const fallbackBaseUrl = env === 'production' ? DEFAULT_PROD_BASE_URL : getDefaultDevBaseUrl();

  return enforceSecureTransportForProduction(
    normalizeBaseUrl(configuredBaseUrl || fallbackBaseUrl),
    env
  );
};

export const getApiUrl = (): string => `${getApiBaseUrl()}/api`;

export const getRuntimeConfig = () => ({
  environment: getRuntimeEnvironment(),
  apiBaseUrl: getApiBaseUrl(),
  apiUrl: getApiUrl(),
});
