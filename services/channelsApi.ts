import api from './api';

export const channelsAPI = {
  list: async () => {
    const res = await api.get('/channels');
    return res.data;
  },
  create: async (payload: { name: string; description?: string; visibility?: 'public' | 'private' }) => {
    const res = await api.post('/channels', payload);
    return res.data;
  },
  get: async (id: string) => {
    const res = await api.get(`/channels/${id}`);
    return res.data;
  },
};
