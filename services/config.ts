import Constants from 'expo-constants';

type RuntimeEnvironment = 'development' | 'production' | 'test';

const DEFAULT_DEV_BASE_URL = 'https://adustech-backend.vercel.app';
const DEFAULT_PROD_BASE_URL = 'https://adustech-backend.vercel.app';

const getDefaultDevBaseUrl = (): string => DEFAULT_DEV_BASE_URL;

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
  const fromPublicEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
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
