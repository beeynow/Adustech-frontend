import api from './api';

export const postsAPI = {
  list: async (params?: { 
    q?: string; 
    category?: string; 
    page?: number; 
    limit?: number;
    departmentId?: string;
    level?: string;
  }) => {
    const res = await api.get('/posts', { params });
    return res.data;
  },
  create: async (payload: { 
    text?: string; 
    imageBase64?: string; 
    category?: string;
    departmentId?: string;
    level?: string;
  }) => {
    const res = await api.post('/posts', payload);
    return res.data;
  },
  toggleLike: async (id: string) => {
    const res = await api.post(`/posts/${id}/like`);
    return res.data;
  },
  toggleRepost: async (id: string) => {
    // Placeholder for repost functionality
    console.log('Repost not yet implemented:', id);
    return { message: 'Repost feature coming soon' };
  },
  get: async (id: string) => {
    const res = await api.get(`/posts/${id}`);
    return res.data;
  },
  listComments: async (id: string) => {
    const res = await api.get(`/posts/${id}/comments`);
    return res.data;
  },
  addComment: async (id: string, text: string) => {
    const res = await api.post(`/posts/${id}/comments`, { text });
    return res.data;
  },
  toggleLikeComment: async (id: string, commentId: string) => {
    const res = await api.post(`/posts/${id}/comments/${commentId}/like`);
    return res.data;
  }
};
