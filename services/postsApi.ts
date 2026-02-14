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
    const res = await api.post(`/posts/${id}/repost`);
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
  addComment: async (id: string, text: string, parentId?: string) => {
    const res = await api.post(`/posts/${id}/comments`, { text, parentId });
    return res.data;
  },
  toggleLikeComment: async (postId: string, commentId: string) => {
    const res = await api.post(`/posts/${postId}/comments/${commentId}/like`);
    return res.data;
  }
};
