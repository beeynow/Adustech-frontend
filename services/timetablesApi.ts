import api from './api';

export const timetablesAPI = {
  list: async () => {
    const res = await api.get('/timetables');
    return res.data;
  },
  create: async (payload: { title: string; details?: string; imageBase64?: string; pdfBase64?: string; effectiveDate: string; }) => {
    const res = await api.post('/timetables', payload);
    return res.data;
  },
  get: async (id: string) => {
    const res = await api.get(`/timetables/${id}`);
    return res.data;
  }
};
