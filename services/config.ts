import Constants from 'expo-constants';

type RuntimeEnvironment = 'development' | 'production' | 'test';
type ExpoHostSource = {
  hostUri?: string;
  debuggerHost?: string;
};
type ExpoManifestV2 = {
  extra?: {
    expoClient?: ExpoHostSource;
  };
};

const DEFAULT_DEV_PORT = 5000;
const DEFAULT_DEV_BASE_URL = `http://127.0.0.1:${DEFAULT_DEV_PORT}`;
const DEFAULT_PROD_BASE_URL = 'https://adustech-backend.vercel.app';

const extractHostFromUri = (value?: string | null): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim().replace(/^[a-z]+:\/\//i, '');
  const host = trimmed.split('/')[0]?.split(':')[0]?.trim();
  return host || undefined;
};

const getExpoHost = (): string | undefined => {
  const expoConfig = Constants.expoConfig as ExpoHostSource | null;
  const expoGoConfig = Constants.expoGoConfig as ExpoHostSource | null;
  const manifest2 = Constants.manifest2 as ExpoManifestV2 | null;

  const candidates = [
    expoConfig?.hostUri,
    expoGoConfig?.debuggerHost,
    expoGoConfig?.hostUri,
    manifest2?.extra?.expoClient?.hostUri,
  ];

  for (const candidate of candidates) {
    const host = extractHostFromUri(candidate);
    if (host) {
      return host;
    }
  }

  return undefined;
};

const getDefaultDevBaseUrl = (): string => {
  const expoHost = getExpoHost();
  return expoHost ? `http://${expoHost}:${DEFAULT_DEV_PORT}` : DEFAULT_DEV_BASE_URL;
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
