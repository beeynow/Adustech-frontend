import axios, { AxiosError, AxiosInstance } from 'axios';
import { getRuntimeConfig } from './config';

type ApiLogLevel = 'debug' | 'warn' | 'error';

const runtimeConfig = getRuntimeConfig();
const isProduction = runtimeConfig.environment === 'production';

const log = (level: ApiLogLevel, message: string, payload?: unknown) => {
  if (isProduction && level === 'debug') {
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
    log('debug', `API -> ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
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
  (error) => {
    const apiError = toApiError(error, 'Request failed. Please try again.');

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
  register: async (name: string, email: string, password: string) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Registration failed. Please try again.'),
      };
    }
  },

  verifyOTP: async (email: string, otp: string) => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'OTP verification failed.'),
      };
    }
  },

  resendOTP: async (email: string) => {
    try {
      const response = await api.post('/auth/resend-otp', { email });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Failed to resend OTP.'),
      };
    }
  },

  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Login failed. Please check your credentials.'),
      };
    }
  },

  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Logout failed.'),
      };
    }
  },

  forgotPassword: async (email: string) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Failed to initiate password reset.'),
      };
    }
  },

  resetPassword: async (email: string, token: string, newPassword: string) => {
    try {
      const response = await api.post('/auth/reset-password', { email, token, newPassword });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Failed to reset password.'),
      };
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      const response = await api.post('/auth/change-password', { currentPassword, newPassword });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Failed to change password.'),
      };
    }
  },

  createAdmin: async (payload: { email: string }) => {
    try {
      const response = await api.post('/auth/create-admin', payload);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Failed to create admin.'),
      };
    }
  },

  listAdmins: async () => {
    try {
      const response = await api.get('/auth/admins');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Failed to list admins.'),
      };
    }
  },

  demoteAdmin: async (email: string) => {
    try {
      const response = await api.post('/auth/demote-admin', { email });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Failed to demote admin.'),
      };
    }
  },

  me: async () => {
    try {
      const response = await api.get('/auth/me');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Not authenticated'),
      };
    }
  },

  getDashboard: async () => {
    try {
      const response = await api.get('/auth/dashboard');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Failed to fetch dashboard data.'),
      };
    }
  },
};

export default api;
