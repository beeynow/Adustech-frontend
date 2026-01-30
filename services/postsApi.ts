import api from './api';

export const postsAPI = {
  list: async (params?: { q?: string; category?: string; page?: number; limit?: number }) => {
    const res = await api.get('/posts', { params });
    return res.data;
  },
  create: async (payload: { text?: string; imageBase64?: string; category?: string }) => {
    const res = await api.post('/posts', payload);
    return res.data;
  },
  toggleLike: async (id: string) => {
    const res = await api.post(`/posts/${id}/like`);
    return res.data;
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
