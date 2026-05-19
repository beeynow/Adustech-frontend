import Constants from 'expo-constants';
import * as ExpoLinking from 'expo-linking';

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

const normalizeOptionalBaseUrl = (value: string | undefined): string | undefined => {
  if (!value?.trim()) {
    return undefined;
  }

  return normalizeBaseUrl(value);
};

const normalizeResolutionMode = (value: string | undefined): ApiResolutionMode | undefined => {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'local-first' || normalized === 'remote-first' || normalized === 'remote-only') {
    return normalized;
  }

  return undefined;
};

const normalizeCandidate = (value: string | undefined | null): string => value?.trim() || '';

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

const getExpoHostUriCandidates = (): string[] => {
  const constantRecord = Constants as typeof Constants & {
    expoConfig?: {
      hostUri?: string;
      extra?: {
        localApiBaseUrl?: string;
        expoClient?: {
          hostUri?: string;
        };
      };
    } | null;
    linkingUri?: string;
    experienceUrl?: string;
    expoGoConfig?: {
      debuggerHost?: string;
      developer?: {
        tool?: string;
      };
    } | null;
    manifest?: {
      debuggerHost?: string;
      hostUri?: string;
      bundleUrl?: string;
    } | null;
    manifest2?: {
      launchAsset?: {
        url?: string;
      };
      extra?: {
        expoClient?: {
          hostUri?: string;
        };
        expoGo?: {
          debuggerHost?: string;
        };
      };
    } | null;
  };

  const linkingUrl = (() => {
    try {
      return ExpoLinking.createURL('/');
    } catch {
      return '';
    }
  })();

  return [
    constantRecord.expoConfig?.hostUri,
    constantRecord.expoConfig?.extra?.expoClient?.hostUri,
    constantRecord.linkingUri,
    constantRecord.experienceUrl,
    constantRecord.expoGoConfig?.debuggerHost,
    constantRecord.manifest?.debuggerHost,
    constantRecord.manifest?.hostUri,
    constantRecord.manifest?.bundleUrl,
    constantRecord.manifest2?.extra?.expoClient?.hostUri,
    constantRecord.manifest2?.extra?.expoGo?.debuggerHost,
    constantRecord.manifest2?.launchAsset?.url,
    linkingUrl,
  ]
    .map(normalizeCandidate)
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index);
};

const readLocalApiBaseUrlOverride = (): string | undefined => {
  const fromPublicEnv = normalizeOptionalBaseUrl(process.env.EXPO_PUBLIC_LOCAL_API_BASE_URL);
  if (fromPublicEnv) {
    return fromPublicEnv;
  }

  const fromExpoExtra = normalizeOptionalBaseUrl(
    (Constants.expoConfig?.extra as { localApiBaseUrl?: string } | undefined)?.localApiBaseUrl
  );

  return fromExpoExtra;
};

const readApiResolutionModeOverride = (): ApiResolutionMode | undefined => {
  const fromPublicEnv = normalizeResolutionMode(process.env.EXPO_PUBLIC_API_RESOLUTION_MODE);
  if (fromPublicEnv) {
    return fromPublicEnv;
  }

  return normalizeResolutionMode(
    (Constants.expoConfig?.extra as { apiResolutionMode?: string } | undefined)?.apiResolutionMode
  );
};

const getLocalDevApiBaseUrl = (): string | undefined => {
  if (getRuntimeEnvironment() !== 'development' || !isExpoGoLikeRuntime()) {
    return undefined;
  }

  const manualOverride = readLocalApiBaseUrlOverride();
  if (manualOverride) {
    return manualOverride;
  }

  const configuredPort = Number.parseInt(String(process.env.EXPO_PUBLIC_LOCAL_API_PORT || ''), 10);
  const localApiPort = Number.isInteger(configuredPort) && configuredPort > 0
    ? configuredPort
    : DEFAULT_LOCAL_API_PORT;

  const candidates = getExpoHostUriCandidates();

  for (const candidate of candidates) {
    const normalizedCandidate = candidate
      .replace(/^exp:\/\//i, 'http://')
      .replace(/^exps:\/\//i, 'https://');

    let hostname = '';

    try {
      hostname = new URL(normalizedCandidate).hostname;
    } catch {
      hostname = normalizedCandidate
        .replace(/^https?:\/\//i, '')
        .split('/')[0]
        .split(':')[0]
        .trim();
    }

    if (!isLanDevelopmentHost(hostname)) {
      continue;
    }

    return `http://${hostname}:${localApiPort}`;
  }

  return undefined;
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

const isLocalDevelopmentBaseUrl = (baseUrl: string): boolean => {
  try {
    const parsedUrl = new URL(normalizeBaseUrl(baseUrl));
    return parsedUrl.protocol === 'http:' && isLanDevelopmentHost(parsedUrl.hostname);
  } catch {
    return false;
  }
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

const getApiBaseUrls = (localDevBaseUrl = getLocalDevApiBaseUrl()): string[] => {
  const env = getRuntimeEnvironment();
  const configuredBaseUrl = readEnvironmentBaseUrl();
  const resolutionModeOverride = readApiResolutionModeOverride();
  const fallbackBaseUrl = env === 'production' ? DEFAULT_PROD_BASE_URL : getDefaultDevBaseUrl();
  const normalizedRemoteBaseUrl = enforceSecureTransportForProduction(
    normalizeBaseUrl(configuredBaseUrl || fallbackBaseUrl),
    env
  );

  if (!localDevBaseUrl || resolutionModeOverride === 'remote-only') {
    return [normalizedRemoteBaseUrl];
  }

  if (resolutionModeOverride === 'remote-first') {
    return dedupeBaseUrls([normalizedRemoteBaseUrl, localDevBaseUrl]);
  }

  if (resolutionModeOverride === 'local-first') {
    return dedupeBaseUrls([localDevBaseUrl, normalizedRemoteBaseUrl]);
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
    return apiBaseUrls[0] && isLocalDevelopmentBaseUrl(apiBaseUrls[0]) ? 'local-first' : 'remote-only';
  }

  return apiBaseUrls[0].startsWith('http://') ? 'local-first' : 'remote-first';
};

export const getRuntimeConfig = () => {
  const localDevApiBaseUrl = getLocalDevApiBaseUrl();
  const apiBaseUrls = getApiBaseUrls(localDevApiBaseUrl);
  const apiUrls = apiBaseUrls.map((baseUrl) => `${baseUrl}/api`);
  const resolutionModeOverride = readApiResolutionModeOverride() || null;

  return {
    environment: getRuntimeEnvironment(),
    executionEnvironment: getExecutionEnvironment(),
    apiBaseUrl: apiBaseUrls[0],
    apiUrl: apiUrls[0],
    apiBaseUrls,
    apiUrls,
    apiResolutionMode: getApiResolutionMode(apiBaseUrls),
    apiResolutionModeOverride: resolutionModeOverride,
    localDevApiBaseUrl: localDevApiBaseUrl || null,
    manualLocalApiBaseUrl: readLocalApiBaseUrlOverride() || null,
    hostUriCandidates: getExpoHostUriCandidates(),
  };
};
