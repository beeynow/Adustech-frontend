import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getRuntimeConfig } from './config';

type ApiLogLevel = 'debug' | 'warn' | 'error';
type RecoverableAuthData = {
  message?: string;
  debug?: {
    otp?: string;
    resetToken?: string;
    expiresInMinutes?: number;
  };
  delivery?: {
    previewUrl?: string;
    mode?: string;
    message?: string;
  };
};
type ApiResponseSuccess<T> = {
  success: true;
  data: T;
};
type ApiResponseFailure = {
  success: false;
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
  requiresVerification?: boolean;
  pendingEmail?: string;
};

const runtimeConfig = getRuntimeConfig();
const isProduction = runtimeConfig.environment === 'production';
type RetriableRequestConfig = InternalAxiosRequestConfig & {
  __apiFallbackIndex?: number;
};

const log = (level: ApiLogLevel, message: string, payload?: unknown) => {
  if (isProduction && level === 'debug') {
    return;
  }

  if (payload === undefined) {
    if (level === 'error') {
      console.error(message);
      return;
    }

    if (level === 'warn') {
      console.warn(message);
      return;
    }

    console.log(message);
    return;
  }

  if (level === 'error') {
    console.error(message, payload);
    return;
  }

  if (level === 'warn') {
    console.warn(message, payload);
    return;
  }

  console.log(message, payload);
};

if (!isProduction) {
  log('debug', 'API backends configured', {
    executionEnvironment: runtimeConfig.executionEnvironment,
    resolutionMode: runtimeConfig.apiResolutionMode,
    apiUrls: runtimeConfig.apiUrls,
    localDevApiBaseUrl: runtimeConfig.localDevApiBaseUrl,
  });
}

export class ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;

  constructor(message: string, options?: { status?: number; code?: string; details?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.status = options?.status;
    this.code = options?.code;
    this.details = options?.details;
  }
}

const toApiError = (error: unknown, fallbackMessage: string): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  const axiosError = error as AxiosError<{ message?: string; error?: string; details?: unknown }>;
  const message =
    axiosError.response?.data?.message ||
    axiosError.response?.data?.error ||
    axiosError.message ||
    fallbackMessage;

  return new ApiError(message, {
    status: axiosError.response?.status,
    code: axiosError.code,
    details: axiosError.response?.data?.details ?? axiosError.response?.data,
  });
};

export const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
  return toApiError(error, fallbackMessage).message;
};

const toFailureResult = (error: unknown, fallbackMessage: string): ApiResponseFailure => {
  const apiError = toApiError(error, fallbackMessage);
  const details = apiError.details && typeof apiError.details === 'object'
    ? apiError.details as Record<string, unknown>
    : null;

  return {
    success: false,
    message: apiError.message,
    status: apiError.status,
    code: apiError.code,
    details: apiError.details,
    requiresVerification: details?.requiresVerification === true,
    pendingEmail: typeof details?.pendingEmail === 'string' ? details.pendingEmail : undefined,
  };
};

const toSuccessResult = <T>(data: T): ApiResponseSuccess<T> => ({
  success: true,
  data,
});

const getRecoverableAuthData = (
  error: unknown,
  fallbackMessage: string,
  recoverableMessagePattern: RegExp
): RecoverableAuthData | null => {
  const apiError = toApiError(error, fallbackMessage);
  if (apiError.status !== 503 || !recoverableMessagePattern.test(apiError.message)) {
    return null;
  }

  if (apiError.details && typeof apiError.details === 'object') {
    return apiError.details as RecoverableAuthData;
  }

  return { message: apiError.message };
};

const isRetriableApiFailure = (apiError: ApiError): boolean => {
  if (apiError.code === 'ECONNABORTED') {
    return true;
  }

  if (apiError.message.toLowerCase().includes('network')) {
    return true;
  }

  return typeof apiError.status === 'number' && apiError.status >= 500;
};

const getRegistrationFailureHint = (message: string): string => {
  if (runtimeConfig.environment !== 'development' || runtimeConfig.apiUrls.length < 2) {
    return message;
  }

  if (!/error registering user/i.test(message)) {
    return message;
  }

  return `${message} Expo Go also checked your fallback backend. If you want live signup during local testing, make sure the backend is running on your machine and reachable on port 5000.`;
};

const api: AxiosInstance = axios.create({
  baseURL: runtimeConfig.apiUrl,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 15000,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const retriableConfig = config as RetriableRequestConfig;
    const fallbackIndex = typeof retriableConfig.__apiFallbackIndex === 'number'
      ? retriableConfig.__apiFallbackIndex
      : 0;

    retriableConfig.baseURL = runtimeConfig.apiUrls[fallbackIndex] || runtimeConfig.apiUrl;

    log('debug', `API -> ${retriableConfig.method?.toUpperCase()} ${retriableConfig.baseURL}${retriableConfig.url}`);
    return config;
  },
  (error) => {
    const apiError = toApiError(error, 'Failed to prepare request.');
    log('error', 'API request setup error', apiError);
    return Promise.reject(apiError);
  }
);

api.interceptors.response.use(
  (response) => {
    log('debug', `API <- ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const apiError = toApiError(error, 'Request failed. Please try again.');
    const originalConfig = error.config as RetriableRequestConfig | undefined;
    const currentFallbackIndex = typeof originalConfig?.__apiFallbackIndex === 'number'
      ? originalConfig.__apiFallbackIndex
      : 0;
    const nextFallbackIndex = currentFallbackIndex + 1;

    if (
      originalConfig
      && nextFallbackIndex < runtimeConfig.apiUrls.length
      && isRetriableApiFailure(apiError)
    ) {
      const fromBaseUrl = runtimeConfig.apiUrls[currentFallbackIndex] || runtimeConfig.apiUrl;
      const toBaseUrl = runtimeConfig.apiUrls[nextFallbackIndex];

      originalConfig.__apiFallbackIndex = nextFallbackIndex;
      log('warn', 'Retrying request with fallback API backend', {
        method: originalConfig.method,
        url: originalConfig.url,
        fromBaseUrl,
        toBaseUrl,
        status: apiError.status,
        code: apiError.code,
      });

      return api.request(originalConfig);
    }

    if (apiError.code === 'ECONNABORTED') {
      log('warn', 'API timeout error', apiError);
    } else if (apiError.message.toLowerCase().includes('network')) {
      log('warn', 'API network error', apiError);
    } else {
      log('error', 'API response error', apiError);
    }

    return Promise.reject(apiError);
  }
);

export const authAPI = {
  register: async (name: string, email: string, password: string, referralCode?: string) => {
    try {
      const response = await api.post('/auth/register', { name, email, password, referralCode });
      return toSuccessResult(response.data);
    } catch (error) {
      const recoverableData = getRecoverableAuthData(
        error,
        'Registration failed. Please try again.',
        /account was created/i
      );
      if (recoverableData) {
        return toSuccessResult(recoverableData);
      }

      return {
        ...toFailureResult(error, 'Registration failed. Please try again.'),
        message: getRegistrationFailureHint(
          getErrorMessage(error, 'Registration failed. Please try again.')
        ),
      };
    }
  },

  verifyOTP: async (email: string, otp: string) => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      return toSuccessResult(response.data);
    } catch (error) {
      return toFailureResult(error, 'OTP verification failed.');
    }
  },

  resendOTP: async (email: string) => {
    try {
      const response = await api.post('/auth/resend-otp', { email });
      return toSuccessResult(response.data);
    } catch (error) {
      const recoverableData = getRecoverableAuthData(
        error,
        'Failed to resend OTP.',
        /new otp was generated/i
      );
      if (recoverableData) {
        return toSuccessResult(recoverableData);
      }

      return toFailureResult(error, 'Failed to resend OTP.');
    }
  },

  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return toSuccessResult(response.data);
    } catch (error) {
      return toFailureResult(error, 'Login failed. Please check your credentials.');
    }
  },

  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return toSuccessResult(response.data);
    } catch (error) {
      return toFailureResult(error, 'Logout failed.');
    }
  },

  forgotPassword: async (email: string) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return toSuccessResult(response.data);
    } catch (error) {
      const recoverableData = getRecoverableAuthData(
        error,
        'Failed to initiate password reset.',
        /generated a reset code/i
      );
      if (recoverableData) {
        return toSuccessResult(recoverableData);
      }

      return toFailureResult(error, 'Failed to initiate password reset.');
    }
  },

  resetPassword: async (email: string, token: string, newPassword: string) => {
    try {
      const response = await api.post('/auth/reset-password', { email, token, newPassword });
      return toSuccessResult(response.data);
    } catch (error) {
      return toFailureResult(error, 'Failed to reset password.');
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      const response = await api.post('/auth/change-password', { currentPassword, newPassword });
      return toSuccessResult(response.data);
    } catch (error) {
      return toFailureResult(error, 'Failed to change password.');
    }
  },

  createAdmin: async (payload: { email: string }) => {
    try {
      const response = await api.post('/auth/create-admin', payload);
      return toSuccessResult(response.data);
    } catch (error) {
      return toFailureResult(error, 'Failed to create admin.');
    }
  },

  listAdmins: async () => {
    try {
      const response = await api.get('/auth/admins');
      return toSuccessResult(response.data);
    } catch (error) {
      return toFailureResult(error, 'Failed to list admins.');
    }
  },

  demoteAdmin: async (email: string) => {
    try {
      const response = await api.post('/auth/demote-admin', { email });
      return toSuccessResult(response.data);
    } catch (error) {
      return toFailureResult(error, 'Failed to demote admin.');
    }
  },

  me: async () => {
    try {
      const response = await api.get('/auth/me');
      return toSuccessResult(response.data);
    } catch (error) {
      return toFailureResult(error, 'Not authenticated');
    }
  },

  getDashboard: async () => {
    try {
      const response = await api.get('/auth/dashboard');
      return toSuccessResult(response.data);
    } catch (error) {
      return toFailureResult(error, 'Failed to fetch dashboard data.');
    }
  },
};

export default api;
