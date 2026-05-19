import Constants from 'expo-constants';

type RuntimeEnvironment = 'development' | 'production' | 'test';
type ApiResolutionMode = 'local-first' | 'remote-first' | 'remote-only';

const DEFAULT_DEV_BASE_URL = 'https://adustech-backend.vercel.app';
const DEFAULT_PROD_BASE_URL = 'https://adustech-backend.vercel.app';
const DEFAULT_LOCAL_API_PORT = 5000;

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

const getExecutionEnvironment = (): string => {
  const constantRecord = Constants as typeof Constants & {
    executionEnvironment?: string;
    appOwnership?: string | null;
  };

  return constantRecord.executionEnvironment || constantRecord.appOwnership || '';
};

const isExpoGoLikeRuntime = (): boolean => {
  const executionEnvironment = getExecutionEnvironment();
  return executionEnvironment === 'storeClient' || executionEnvironment === 'expo';
};

const isLanDevelopmentHost = (hostname: string): boolean => {
  if (!hostname) {
    return false;
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '10.0.2.2') {
    return true;
  }

  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return true;
  }

  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return true;
  }

  const match = hostname.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (!match) {
    return false;
  }

  const secondOctet = Number.parseInt(match[1], 10);
  return secondOctet >= 16 && secondOctet <= 31;
};

const getExpoHostUri = (): string => {
  const constantRecord = Constants as typeof Constants & {
    expoConfig?: {
      hostUri?: string;
    } | null;
    linkingUri?: string;
    experienceUrl?: string;
    expoGoConfig?: {
      debuggerHost?: string;
    } | null;
    manifest2?: {
      extra?: {
        expoGo?: {
          debuggerHost?: string;
        };
      };
    };
  };

  return [
    constantRecord.expoConfig?.hostUri,
    constantRecord.linkingUri,
    constantRecord.experienceUrl,
    constantRecord.expoGoConfig?.debuggerHost,
    constantRecord.manifest2?.extra?.expoGo?.debuggerHost,
  ]
    .map((value) => value?.trim() || '')
    .find(Boolean) || '';
};

const getLocalDevApiBaseUrl = (): string | undefined => {
  if (getRuntimeEnvironment() !== 'development' || !isExpoGoLikeRuntime()) {
    return undefined;
  }

  const hostUri = getExpoHostUri();
  if (!hostUri) {
    return undefined;
  }

  const host = hostUri
    .replace(/^https?:\/\//i, '')
    .split('/')[0]
    .split(':')[0]
    .trim();

  if (!isLanDevelopmentHost(host)) {
    return undefined;
  }

  const configuredPort = Number.parseInt(String(process.env.EXPO_PUBLIC_LOCAL_API_PORT || ''), 10);
  const localApiPort = Number.isInteger(configuredPort) && configuredPort > 0
    ? configuredPort
    : DEFAULT_LOCAL_API_PORT;

  return `http://${host}:${localApiPort}`;
};

const dedupeBaseUrls = (baseUrls: string[]): string[] => {
  const unique = new Set<string>();

  baseUrls.forEach((candidate) => {
    const normalized = candidate.trim();
    if (normalized) {
      unique.add(normalized);
    }
  });

  return Array.from(unique);
};

const isDefaultHostedBackend = (baseUrl: string): boolean => {
  return normalizeBaseUrl(baseUrl) === normalizeBaseUrl(DEFAULT_PROD_BASE_URL);
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

const getApiBaseUrls = (): string[] => {
  const env = getRuntimeEnvironment();
  const configuredBaseUrl = readEnvironmentBaseUrl();
  const fallbackBaseUrl = env === 'production' ? DEFAULT_PROD_BASE_URL : getDefaultDevBaseUrl();
  const normalizedRemoteBaseUrl = enforceSecureTransportForProduction(
    normalizeBaseUrl(configuredBaseUrl || fallbackBaseUrl),
    env
  );
  const localDevBaseUrl = getLocalDevApiBaseUrl();

  if (!localDevBaseUrl) {
    return [normalizedRemoteBaseUrl];
  }

  if (!configuredBaseUrl || isDefaultHostedBackend(normalizedRemoteBaseUrl)) {
    return dedupeBaseUrls([localDevBaseUrl, normalizedRemoteBaseUrl]);
  }

  return dedupeBaseUrls([normalizedRemoteBaseUrl, localDevBaseUrl]);
};

export const getApiBaseUrl = (): string => {
  return getApiBaseUrls()[0];
};

export const getApiUrl = (): string => `${getApiBaseUrl()}/api`;

export const getApiUrls = (): string[] => getApiBaseUrls().map((baseUrl) => `${baseUrl}/api`);

const getApiResolutionMode = (apiBaseUrls: string[]): ApiResolutionMode => {
  if (apiBaseUrls.length <= 1) {
    return 'remote-only';
  }

  return apiBaseUrls[0].startsWith('http://') ? 'local-first' : 'remote-first';
};

export const getRuntimeConfig = () => ({
  environment: getRuntimeEnvironment(),
  executionEnvironment: getExecutionEnvironment(),
  apiBaseUrl: getApiBaseUrl(),
  apiUrl: getApiUrl(),
  apiBaseUrls: getApiBaseUrls(),
  apiUrls: getApiUrls(),
  apiResolutionMode: getApiResolutionMode(getApiBaseUrls()),
  localDevApiBaseUrl: getLocalDevApiBaseUrl() || null,
});
