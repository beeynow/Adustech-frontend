import api, { getErrorMessage } from './api';

interface PaginationParams {
  page?: number;
  limit?: number;
  category?: string;
  priority?: string;
}

interface CreatePostData {
  title: string;
  content: string;
  faculty_id?: string | null;
  level_id?: string | null;
  category?: string;
  priority?: string;
  image_url?: string;
}

const mapAcademicPostPayload = (postData: CreatePostData) => ({
  title: postData.title,
  content: postData.content,
  faculty_id: postData.faculty_id ?? undefined,
  level_id: postData.level_id ?? undefined,
  category: postData.category ?? 'General',
  priority: postData.priority ?? 'normal',
  image_url: postData.image_url,
});

const mapPartialAcademicPostPayload = (postData: Partial<CreatePostData>) => ({
  ...(postData.title !== undefined ? { title: postData.title } : {}),
  ...(postData.content !== undefined ? { content: postData.content } : {}),
  ...(postData.faculty_id !== undefined ? { faculty_id: postData.faculty_id } : {}),
  ...(postData.level_id !== undefined ? { level_id: postData.level_id } : {}),
  ...(postData.category !== undefined ? { category: postData.category } : {}),
  ...(postData.priority !== undefined ? { priority: postData.priority } : {}),
  ...(postData.image_url !== undefined ? { image_url: postData.image_url } : {}),
});

const extractError = (error: unknown, fallback: string) => {
  throw new Error(getErrorMessage(error, fallback));
};

export const academicApi = {
  getFaculties: async () => {
    try {
      const response = await api.get('/faculties');
      return response.data;
    } catch (error) {
      extractError(error, 'Failed to fetch faculties.');
    }
  },

  getFaculty: async (facultyId: string) => {
    try {
      const response = await api.get(`/faculties/${facultyId}`);
      return response.data;
    } catch (error) {
      extractError(error, 'Failed to fetch faculty.');
    }
  },

  getFacultyDepartments: async (facultyId: string) => {
    try {
      const response = await api.get(`/faculties/${facultyId}/departments`);
      return response.data;
    } catch (error) {
      extractError(error, 'Failed to fetch departments.');
    }
  },

  getDepartment: async (departmentId: string) => {
    try {
      const response = await api.get(`/faculties/departments/${departmentId}`);
      return response.data;
    } catch (error) {
      extractError(error, 'Failed to fetch department.');
    }
  },

  getDepartmentLevels: async (departmentId: string) => {
    try {
      const response = await api.get(`/faculties/departments/${departmentId}/levels`);
      return response.data;
    } catch (error) {
      extractError(error, 'Failed to fetch department levels.');
    }
  },

  getLevel: async (levelId: string) => {
    try {
      const response = await api.get(`/faculties/levels/${levelId}`);
      return response.data;
    } catch (error) {
      extractError(error, 'Failed to fetch level.');
    }
  },

  getGlobalPosts: async (params: PaginationParams = {}) => {
    try {
      const response = await api.get('/academic/posts/global', { params });
      return response.data;
    } catch (error) {
      extractError(error, 'Failed to fetch global posts.');
    }
  },

  getFacultyPosts: async (facultyId: string, params: PaginationParams = {}) => {
    try {
      const response = await api.get(`/academic/posts/faculty/${facultyId}`, { params });
      return response.data;
    } catch (error) {
      extractError(error, 'Failed to fetch faculty posts.');
    }
  },

  getLevelPosts: async (levelId: string, params: PaginationParams = {}) => {
    try {
      const response = await api.get(`/academic/posts/level/${levelId}`, { params });
      return response.data;
    } catch (error) {
      extractError(error, 'Failed to fetch level posts.');
    }
  },

  getPost: async (postId: string) => {
    try {
      const response = await api.get(`/academic/posts/${postId}`);
      return response.data;
    } catch (error) {
      extractError(error, 'Failed to fetch post.');
    }
  },

  createPost: async (postData: CreatePostData) => {
    try {
      const response = await api.post('/academic/posts', mapAcademicPostPayload(postData));
      return response.data;
    } catch (error) {
      extractError(error, 'Failed to create post.');
    }
  },

  updatePost: async (postId: string, updateData: Partial<CreatePostData>) => {
    try {
      const response = await api.put(`/academic/posts/${postId}`, mapPartialAcademicPostPayload(updateData));
      return response.data;
    } catch (error) {
      extractError(error, 'Failed to update post.');
    }
  },

  deletePost: async (postId: string) => {
    try {
      const response = await api.delete(`/academic/posts/${postId}`);
      return response.data;
    } catch (error) {
      extractError(error, 'Failed to delete post.');
    }
  },

  likePost: async (postId: string) => {
    try {
      const response = await api.post(`/academic/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      extractError(error, 'Failed to update post like.');
    }
  },

  addComment: async (postId: string, text: string, parentId?: string) => {
    try {
      const response = await api.post(`/academic/posts/${postId}/comments`, {
        text,
        parentId,
      });
      return response.data;
    } catch (error) {
      extractError(error, 'Failed to add comment.');
    }
  },

  getUserAcademicContext: async () => {
    try {
      const response = await api.get('/faculties/context');
      return response.data;
    } catch (error) {
      extractError(error, 'Failed to fetch academic context.');
    }
  },

  getUserDepartmentLevels: async () => {
    try {
      const contextResponse = await api.get('/faculties/context');
      const departmentId = contextResponse.data?.context?.department?.id;

      if (!departmentId) {
        return {
          success: true,
          levels: [],
        };
      }

      const response = await api.get(`/faculties/departments/${departmentId}/levels`);
      return response.data;
    } catch (error) {
      extractError(error, 'Failed to fetch department levels.');
    }
  },
};

export default academicApi;
