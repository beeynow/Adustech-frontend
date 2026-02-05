import api from './api';

const PROFILE_BASE_URL = 'http://adustech-backend.vercel.app/api';

// For Android Emulator use: 'http://10.0.2.2:5000/api'
// For physical device, use your computer's IP address

export interface UserProfile {
  _id: string;
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
  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get(`${PROFILE_BASE_URL}/profile`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch profile' 
      };
    }
  },

  // Update user profile
  updateProfile: async (profileData: Partial<UserProfile>) => {
    try {
      const response = await api.put(`${PROFILE_BASE_URL}/profile`, profileData);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to update profile' 
      };
    }
  },

  // Upload profile image (Base64)
  uploadProfileImage: async (imageBase64: string) => {
    try {
      const response = await api.post(`${PROFILE_BASE_URL}/profile/image`, { imageBase64 });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to upload image' 
      };
    }
  },
};
