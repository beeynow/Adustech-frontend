/**
 * ============================================================================
 * ACADEMIC API SERVICE
 * Complete academic system API calls for faculty, departments, levels, posts
 * ============================================================================
 */

import api from './api';

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

export const academicApi = {
  // ============================================================================
  // FACULTIES
  // ============================================================================
  
  /**
   * Get all faculties
   */
  getFaculties: async () => {
    try {
      const response = await api.get('/faculties');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching faculties:', error);
      throw error?.response?.data || error;
    }
  },

  /**
   * Get single faculty by ID
   */
  getFaculty: async (facultyId: string) => {
    try {
      const response = await api.get(`/faculties/${facultyId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching faculty:', error);
      throw error?.response?.data || error;
    }
  },

  // ============================================================================
  // DEPARTMENTS
  // ============================================================================
  
  /**
   * Get all departments for a faculty
   */
  getFacultyDepartments: async (facultyId: string) => {
    try {
      const response = await api.get(`/faculties/${facultyId}/departments`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },

  /**
   * Get single department by ID
   */
  getDepartment: async (departmentId: string) => {
    try {
      const response = await api.get(`/departments/departments/${departmentId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching department:', error);
      throw error?.response?.data || error;
    }
  },

  // ============================================================================
  // LEVELS (100-500)
  // ============================================================================
  
  /**
   * Get all levels for a department (100, 200, 300, 400, 500)
   */
  getDepartmentLevels: async (departmentId: string) => {
    try {
      const response = await api.get(`/departments/departments/${departmentId}/levels`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching levels:', error);
      throw error?.response?.data || error;
    }
  },

  /**
   * Get single level by ID
   */
  getLevel: async (levelId: string) => {
    try {
      const response = await api.get(`/levels/levels/${levelId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching level:', error);
      throw error?.response?.data || error;
    }
  },

  // ============================================================================
  // POSTS (Academic Notice Board)
  // ============================================================================
  
  /**
   * Get global posts (home page)
   */
  getGlobalPosts: async (params: PaginationParams = {}) => {
    try {
      const response = await api.get('/academic/posts/global', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching global posts:', error);
      throw error;
    }
  },

  /**
   * Get faculty posts
   */
  getFacultyPosts: async (facultyId: string, params: PaginationParams = {}) => {
    try {
      const response = await api.get(`/academic/posts/faculty/${facultyId}`, { params });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching faculty posts:', error);
      throw error;
    }
  },

  /**
   * Get department level posts (isolated room)
   */
  getLevelPosts: async (levelId: string, params: PaginationParams = {}) => {
    try {
      const response = await api.get(`/academic/posts/level/${levelId}`, { params });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching level posts:', error);
      throw error;
    }
  },

  /**
   * Get single post by ID
   */
  getPost: async (postId: string) => {
    try {
      const response = await api.get(`/academic/posts/${postId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching post:', error);
      throw error;
    }
  },

  /**
   * Create a new post
   */
  createPost: async (postData: CreatePostData) => {
    try {
      const response = await api.post('/academic/posts', postData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  /**
   * Update a post
   */
  updatePost: async (postId: string, updateData: Partial<CreatePostData>) => {
    try {
      const response = await api.put(`/academic/posts/${postId}`, updateData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating post:', error);
      throw error;
    }
  },

  /**
   * Delete a post
   */
  deletePost: async (postId: string) => {
    try {
      const response = await api.delete(`/academic/posts/${postId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },

  /**
   * Like/unlike a post
   */
  likePost: async (postId: string) => {
    try {
      const response = await api.post(`/academic/posts/${postId}/like`);
      return response.data;
    } catch (error: any) {
      console.error('Error liking post:', error);
      throw error;
    }
  },

  /**
   * Add comment to post
   */
  addComment: async (postId: string, content: string, parentId?: string) => {
    try {
      const response = await api.post(`/academic/posts/${postId}/comments`, {
        content,
        parentId
      });
      return response.data;
    } catch (error: any) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  // ============================================================================
  // USER NAVIGATION HELPERS
  // ============================================================================
  
  /**
   * Get user's academic context (faculty, department, level)
   */
  getUserAcademicContext: async () => {
    try {
      const response = await api.get('/profile/academic-context');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching academic context:', error);
      throw error;
    }
  },

  /**
   * Get available levels for user's department
   */
  getUserDepartmentLevels: async () => {
    try {
      const response = await api.get('/profile/department-levels');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching department levels:', error);
      throw error;
    }
  }
};

export default academicApi;
