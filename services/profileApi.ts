import api from './api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  profileImage?: string;
  level?: string;
  levelId?: string | null;
  department?: string;
  departmentId?: string | null;
  faculty?: string;
  facultyId?: string | null;
  phone?: string;
  dateOfBirth?: string | Date | null;
  gender?: 'Male' | 'Female' | 'Other' | '';
  address?: string;
  country?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
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
        message: error.response?.data?.errors?.[0]?.msg
          || error.response?.data?.message
          || error.response?.data?.error
          || 'Failed to update profile',
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
