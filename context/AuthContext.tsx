import React, { createContext, startTransition, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, clearApiAuthToken, setApiAuthToken } from '../services/api';
import { unregisterCurrentDeviceForPushAsync } from '../services/pushNotifications';
import type { UserRole } from '../utils/permissions';
import { normalizeEmail } from '../utils/validation';
import { clearPendingReferralCode, normalizeReferralCode } from '../utils/referrals';

interface User {
  name: string;
  email: string;
  role?: UserRole;
}

type AuthEmailResult = {
  success: boolean;
  message?: string;
  debugOtp?: string;
  debugResetToken?: string;
  mailPreviewUrl?: string;
  status?: number;
};

type LoginResult = {
  success: boolean;
  message?: string;
  requiresVerification?: boolean;
  pendingEmail?: string;
};

type VerifyOtpResult = {
  success: boolean;
  message?: string;
  autoLoggedIn?: boolean;
  referral?: {
    applied: boolean;
    pointsAwarded: number;
    referrerName: string;
  } | null;
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (name: string, email: string, password: string, referralCode?: string) => Promise<AuthEmailResult>;
  verifyOTP: (email: string, otp: string) => Promise<VerifyOtpResult>;
  resendOTP: (email: string) => Promise<AuthEmailResult>;
  forgotPassword: (email: string) => Promise<AuthEmailResult>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  refreshSession: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const STORAGE_KEYS = {
  user: 'user',
  authToken: 'authToken',
  pendingEmail: 'pendingEmail',
  resetEmail: 'resetEmail',
} as const;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const sanitizeUser = (raw: any, fallbackEmail?: string): User | null => {
  if (!raw && !fallbackEmail) {
    return null;
  }

  const email = typeof raw?.email === 'string' ? raw.email : fallbackEmail;
  if (!email) {
    return null;
  }

  return {
    name: typeof raw?.name === 'string' && raw.name.trim().length > 0
      ? raw.name.trim()
      : normalizeEmail(email).split('@')[0],
    email: normalizeEmail(email),
    role: raw?.role,
  };
};

const parseUserFromMeResponse = (payload: any): User | null => {
  const directUser = payload?.user;
  const nestedUser = payload?.data?.user;
  const candidate = directUser || nestedUser || payload;
  return sanitizeUser(candidate);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistAuthToken = async (token?: string | null) => {
    const normalizedToken = typeof token === 'string' ? token.trim() : '';

    if (normalizedToken) {
      setApiAuthToken(normalizedToken);
      await AsyncStorage.setItem(STORAGE_KEYS.authToken, normalizedToken);
      return normalizedToken;
    }

    clearApiAuthToken();
    await AsyncStorage.removeItem(STORAGE_KEYS.authToken);
    return null;
  };

  const clearAuthStorage = async () => {
    clearApiAuthToken();
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.user,
      STORAGE_KEYS.authToken,
      STORAGE_KEYS.pendingEmail,
      STORAGE_KEYS.resetEmail,
    ]);
    await clearPendingReferralCode();
  };

  const refreshSession = async (): Promise<boolean> => {
    const me = await authAPI.me();
    if (!me.success) {
      if (me.status === 401 || me.status === 403) {
        startTransition(() => setUser(null));
        await clearAuthStorage();
        return false;
      }

      return Boolean(user);
    }

    const hydratedUser = parseUserFromMeResponse(me.data);
    if (!hydratedUser) {
      startTransition(() => setUser(null));
      await AsyncStorage.removeItem(STORAGE_KEYS.user);
      return false;
    }

    if (typeof me.data?.authToken === 'string' && me.data.authToken.trim().length > 0) {
      await persistAuthToken(me.data.authToken);
    }

    startTransition(() => setUser(hydratedUser));
    await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(hydratedUser));
    return true;
  };

  const checkAuthStatus = async () => {
    try {
      const rawAuthToken = await AsyncStorage.getItem(STORAGE_KEYS.authToken);
      const normalizedStoredToken = typeof rawAuthToken === 'string' ? rawAuthToken.trim() : '';

      if (normalizedStoredToken) {
        setApiAuthToken(normalizedStoredToken);
      } else {
        clearApiAuthToken();
      }

      const rawUser = await AsyncStorage.getItem(STORAGE_KEYS.user);
      if (!rawUser) {
        startTransition(() => setUser(null));
        if (normalizedStoredToken) {
          await refreshSession();
        }
        return;
      }

      const parsedLocalUser = sanitizeUser(JSON.parse(rawUser));
      if (!parsedLocalUser) {
        await AsyncStorage.removeItem(STORAGE_KEYS.user);
        startTransition(() => setUser(null));
        if (normalizedStoredToken) {
          await refreshSession();
        }
        return;
      }

      startTransition(() => setUser(parsedLocalUser));
      await refreshSession();
    } catch {
      await clearAuthStorage();
      startTransition(() => setUser(null));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const register = async (name: string, email: string, password: string, referralCode?: string) => {
    const normalizedEmail = normalizeEmail(email);
    const normalizedReferralCode = referralCode ? normalizeReferralCode(referralCode) : '';
    const result = await authAPI.register(name.trim(), normalizedEmail, password, normalizedReferralCode || undefined);
    if (result.success) {
      await AsyncStorage.setItem(STORAGE_KEYS.pendingEmail, normalizedEmail);
      if (normalizedReferralCode) {
        await clearPendingReferralCode();
      }
      return {
        success: true,
        message: result.data?.message,
        debugOtp: result.data?.debug?.otp,
        mailPreviewUrl: result.data?.delivery?.previewUrl,
      };
    }
    return { success: false, message: result.message, status: result.status };
  };

  const verifyOTP = async (email: string, otp: string) => {
    const normalizedEmail = normalizeEmail(email);
    const result = await authAPI.verifyOTP(normalizedEmail, otp.trim());
    if (result.success) {
      const mappedUser = sanitizeUser(result.data?.user, normalizedEmail);
      if (typeof result.data?.authToken === 'string' && result.data.authToken.trim().length > 0) {
        await persistAuthToken(result.data.authToken);
      }
      if (mappedUser) {
        startTransition(() => setUser(mappedUser));
        await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(mappedUser));
      }
      await AsyncStorage.removeItem(STORAGE_KEYS.pendingEmail);
      return {
        success: true,
        message: result.data.message,
        autoLoggedIn: Boolean(mappedUser),
        referral: result.data.referral || null,
      };
    }
    return { success: false, message: result.message };
  };

  const resendOTP = async (email: string) => {
    const normalizedEmail = normalizeEmail(email);
    const result = await authAPI.resendOTP(normalizedEmail);
    if (result.success) {
      return {
        success: true,
        message: result.data?.message,
        debugOtp: result.data?.debug?.otp,
        mailPreviewUrl: result.data?.delivery?.previewUrl,
      };
    }
    return result;
  };

  const login = async (email: string, password: string) => {
    const normalizedEmail = normalizeEmail(email);
    const result = await authAPI.login(normalizedEmail, password);
    if (result.success) {
      const mappedUser = sanitizeUser(result.data?.user, normalizedEmail);
      if (!mappedUser) {
        return { success: false, message: 'Invalid account data returned by server.' };
      }

      if (typeof result.data?.authToken === 'string' && result.data.authToken.trim().length > 0) {
        await persistAuthToken(result.data.authToken);
      }

      startTransition(() => setUser(mappedUser));
      await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(mappedUser));
      await AsyncStorage.removeItem(STORAGE_KEYS.pendingEmail);
      return { success: true, message: result.data.message };
    }

    if (result.requiresVerification || result.message?.includes('Email not verified') || result.message?.includes('verify OTP')) {
      await AsyncStorage.setItem(STORAGE_KEYS.pendingEmail, result.pendingEmail || normalizedEmail);
    }
    return {
      success: false,
      message: result.message,
      requiresVerification: result.requiresVerification,
      pendingEmail: result.pendingEmail,
    };
  };

  const logout = async () => {
    try {
      await unregisterCurrentDeviceForPushAsync();
    } catch (error) {
      console.warn('Failed to unregister push token during logout', error);
    }

    await authAPI.logout();
    startTransition(() => setUser(null));
    await clearAuthStorage();
  };

  const forgotPassword = async (email: string) => {
    const normalizedEmail = normalizeEmail(email);
    const result = await authAPI.forgotPassword(normalizedEmail);
    if (result.success) {
      await AsyncStorage.setItem(STORAGE_KEYS.resetEmail, normalizedEmail);
      return {
        success: true,
        message: result.data.message,
        debugResetToken: result.data?.debug?.resetToken,
        mailPreviewUrl: result.data?.delivery?.previewUrl,
      };
    }
    return {
      success: false,
      message: result.message,
      status: result.status,
      debugResetToken: (result.details as any)?.debug?.resetToken,
      mailPreviewUrl: (result.details as any)?.delivery?.previewUrl,
    };
  };

  const resetPassword = async (email: string, token: string, newPassword: string) => {
    const normalizedEmail = normalizeEmail(email);
    const result = await authAPI.resetPassword(normalizedEmail, token.trim(), newPassword);
    if (result.success) {
      await AsyncStorage.removeItem(STORAGE_KEYS.resetEmail);
      return { success: true, message: result.data.message };
    }
    return { success: false, message: result.message };
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const result = await authAPI.changePassword(currentPassword, newPassword);
    if (result.success) {
      return { success: true, message: result.data.message };
    }
    return { success: false, message: result.message };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        verifyOTP,
        resendOTP,
        forgotPassword,
        resetPassword,
        changePassword,
        refreshSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
