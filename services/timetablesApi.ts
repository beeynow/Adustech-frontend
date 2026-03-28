import api from './api';

export interface TimetableCreator {
  id: string;
  name: string;
  email: string;
}

export interface TimetableRecord {
  id: string;
  title: string;
  details: string;
  effectiveDate: string;
  imageUrl: string;
  pdfUrl: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  User: TimetableCreator;
}

export interface CreateTimetablePayload {
  title: string;
  details?: string;
  imageBase64?: string;
  pdfBase64?: string;
  effectiveDate: string;
}

export const timetablesAPI = {
  list: async (): Promise<{ timetables: TimetableRecord[] }> => {
    const res = await api.get('/timetables');
    return res.data;
  },
  create: async (payload: CreateTimetablePayload): Promise<{ message: string; timetable: TimetableRecord }> => {
    const res = await api.post('/timetables', payload);
    return res.data;
  },
  get: async (id: string): Promise<{ timetable: TimetableRecord }> => {
    const res = await api.get(`/timetables/${id}`);
    return res.data;
  }
};
