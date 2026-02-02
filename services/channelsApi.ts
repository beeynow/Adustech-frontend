import api from './api';

export interface Channel {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  visibility?: 'public' | 'private';
  departmentId?: string;
  level?: string;
  createdById?: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  members?: Array<{
    userId: string;
    user: {
      id: string;
      name: string;
      email: string;
      profileImage?: string;
    };
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export const channelsAPI = {
  // List all channels (with optional department filtering)
  list: async (params?: { departmentId?: string; level?: string }) => {
    const res = await api.get('/channels', { params });
    return res.data;
  },

  // Create channel (with optional department and level)
  create: async (payload: { 
    name: string; 
    description?: string; 
    visibility?: 'public' | 'private';
    departmentId?: string;
    level?: string;
  }) => {
    const res = await api.post('/channels', payload);
    return res.data;
  },

  // Get single channel
  get: async (id: string) => {
    const res = await api.get(`/channels/${id}`);
    return res.data;
  },

  // Join a channel
  join: async (id: string) => {
    const res = await api.post(`/channels/${id}/join`);
    return res.data;
  },

  // Leave a channel
  leave: async (id: string) => {
    const res = await api.post(`/channels/${id}/leave`);
    return res.data;
  },
};
