import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

interface User {
  name: string;
  email: string;
  role?: 'power' | 'admin' | 'd-admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  verifyOTP: (email: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  resendOTP: (email: string) => Promise<{ success: boolean; message?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        console.log('Auth status loaded:', parsed);
      } else {
        console.log('No user data found in storage');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const result = await authAPI.register(name, email, password);
    if (result.success) {
      // Store email for OTP verification
      await AsyncStorage.setItem('pendingEmail', email);
      return { success: true, message: result.data.message };
    }
    return { success: false, message: result.message };
  };

  const verifyOTP = async (email: string, otp: string) => {
    const result = await authAPI.verifyOTP(email, otp);
    if (result.success) {
      // Clear pending email
      await AsyncStorage.removeItem('pendingEmail');
      return { success: true, message: result.data.message };
    }
    return { success: false, message: result.message };
  };

  const resendOTP = async (email: string) => {
    const result = await authAPI.resendOTP(email);
    return result;
  };

  const login = async (email: string, password: string) => {
    const result = await authAPI.login(email, password);
    if (result.success) {
      // Extract user data from response
      const name = result.data.user?.name || email.split('@')[0];
      const role = result.data.user?.role as User['role'] | undefined;
      const userData: User = { 
        name, 
        email: result.data.user?.email || email, 
        role 
      };
      
      // Save user data to state and AsyncStorage
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      // Log for debugging
      console.log('User logged in and saved:', userData);
      
      return { success: true, message: result.data.message };
    }
    // Store email for potential OTP verification
    if (result.message?.includes('Email not verified') || result.message?.includes('verify OTP')) {
      await AsyncStorage.setItem('pendingEmail', email);
    }
    return { success: false, message: result.message };
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
    await AsyncStorage.removeItem('user');
  };

  const forgotPassword = async (email: string) => {
    const result = await authAPI.forgotPassword(email);
    if (result.success) {
      await AsyncStorage.setItem('resetEmail', email);
      return { success: true, message: result.data.message };
    }
    return { success: false, message: result.message };
  };

  const resetPassword = async (email: string, token: string, newPassword: string) => {
    const result = await authAPI.resetPassword(email, token, newPassword);
    if (result.success) {
      await AsyncStorage.removeItem('resetEmail');
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
