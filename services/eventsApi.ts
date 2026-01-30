import api from './api';

export const eventsAPI = {
  list: async () => {
    const res = await api.get('/events');
    return res.data;
  },
  create: async (payload: { title: string; details?: string; imageBase64?: string; location?: string; startsAt: string; }) => {
    const res = await api.post('/events', payload);
    return res.data;
  },
  get: async (id: string) => {
    const res = await api.get(`/events/${id}`);
    return res.data;
  }
};
