import api from './api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  profileImage?: string;
  level?: string;
  department?: string;
  faculty?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'Male' | 'Female' | 'Other' | '';
  address?: string;
  country?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const profileAPI = {
  getProfile: async () => {
    try {
      const response = await api.get('/profile');
      const user = response.data?.user || response.data;
      return { success: true, data: { ...response.data, user } };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch profile',
      };
    }
  },

  updateProfile: async (profileData: Partial<UserProfile>) => {
    try {
      const response = await api.put('/profile', profileData);
      const user = response.data?.user || response.data;
      return { success: true, data: { ...response.data, user } };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile',
      };
    }
  },

  uploadProfileImage: async (imageBase64: string) => {
    try {
      const response = await api.post('/profile/image', { imageBase64 });
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to upload image',
      };
    }
  },
};
