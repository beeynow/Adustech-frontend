import api from './api';

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  faculty?: string;
  levels: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface DepartmentUser {
  id: string;
  name: string;
  email: string;
  level: string;
  department: string;
  profileImage?: string;
  role: string;
}

export const departmentsAPI = {
  // Get all departments
  list: async (params?: { isActive?: boolean }) => {
    const res = await api.get('/departments', { params });
    return res.data;
  },

  // Get department by ID
  get: async (id: string) => {
    const res = await api.get(`/departments/${id}`);
    return res.data;
  },

  // Get department levels
  getLevels: async (id: string) => {
    const res = await api.get(`/departments/${id}/levels`);
    return res.data;
  },

  // Get users in department (Admin only)
  getUsers: async (id: string, level?: string) => {
    const params = level ? { level } : undefined;
    const res = await api.get(`/departments/${id}/users`, { params });
    return res.data;
  },

  // Create department (Power Admin only)
  create: async (payload: {
    name: string;
    code: string;
    description?: string;
    faculty?: string;
    levels?: string[];
  }) => {
    const res = await api.post('/departments', payload);
    return res.data;
  },

  // Update department (Power Admin only)
  update: async (id: string, payload: Partial<{
    name: string;
    code: string;
    description: string;
    faculty: string;
    levels: string[];
    isActive: boolean;
  }>) => {
    const res = await api.put(`/departments/${id}`, payload);
    return res.data;
  },

  // Delete department (Power Admin only)
  delete: async (id: string) => {
    const res = await api.delete(`/departments/${id}`);
    return res.data;
  },
};
