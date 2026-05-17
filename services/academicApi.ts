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

export interface FacultyRecord {
  id: string;
  name: string;
  code?: string;
}

export interface DepartmentRecord {
  id: string;
  name: string;
  code?: string;
  facultyId?: string;
  faculty?: FacultyRecord;
}

export interface LevelRecord {
  id: string;
  levelNumber: number;
  displayName: string;
  department: DepartmentRecord & {
    faculty?: FacultyRecord;
  };
}

export interface AcademicPostRecord {
  id: string;
  title?: string;
  text?: string;
  content?: string;
  priority?: string;
  category?: string;
  imageUrl?: string;
  image_url?: string;
  isPinned?: boolean;
  likesCount?: number;
  commentsCount?: number;
  viewsCount?: number;
  isLiked?: boolean;
  createdAt?: string;
  author?: {
    id?: string;
    name?: string;
    fullName?: string;
    role?: string;
  };
}

export interface AcademicPagination {
  currentPage?: number;
  totalPages?: number;
  totalPosts?: number;
  hasMore?: boolean;
}

export interface AcademicFacultiesResponse {
  success: boolean;
  faculties: FacultyRecord[];
  total?: number;
}

export interface AcademicDepartmentsResponse {
  success: boolean;
  departments: DepartmentRecord[];
  total?: number;
}

export interface AcademicLevelsResponse {
  success: boolean;
  levels: LevelRecord[];
  total?: number;
}

export interface AcademicLevelResponse {
  success: boolean;
  level: LevelRecord;
}

export interface AcademicLevelPostsResponse {
  success: boolean;
  level?: LevelRecord;
  posts: AcademicPostRecord[];
  pagination: AcademicPagination;
}

export interface AcademicLikeResponse {
  success: boolean;
  isLiked: boolean;
  likesCount: number;
  message?: string;
}

export interface AcademicPostMutationResponse {
  success: boolean;
  message?: string;
  post?: AcademicPostRecord;
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
  getFaculties: async (): Promise<AcademicFacultiesResponse> => {
    try {
      const response = await api.get('/faculties');
      return response.data;
    } catch (error) {
      return extractError(error, 'Failed to fetch faculties.');
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

  getFacultyDepartments: async (facultyId: string): Promise<AcademicDepartmentsResponse> => {
    try {
      const response = await api.get(`/faculties/${facultyId}/departments`);
      return response.data;
    } catch (error) {
      return extractError(error, 'Failed to fetch departments.');
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

  getDepartmentLevels: async (departmentId: string): Promise<AcademicLevelsResponse> => {
    try {
      const response = await api.get(`/faculties/departments/${departmentId}/levels`);
      return response.data;
    } catch (error) {
      return extractError(error, 'Failed to fetch department levels.');
    }
  },

  getLevel: async (levelId: string): Promise<AcademicLevelResponse> => {
    try {
      const response = await api.get(`/faculties/levels/${levelId}`);
      return response.data;
    } catch (error) {
      return extractError(error, 'Failed to fetch level.');
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

  getLevelPosts: async (levelId: string, params: PaginationParams = {}): Promise<AcademicLevelPostsResponse> => {
    try {
      const response = await api.get(`/academic/posts/level/${levelId}`, { params });
      return response.data;
    } catch (error) {
      return extractError(error, 'Failed to fetch level posts.');
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

  createPost: async (postData: CreatePostData): Promise<AcademicPostMutationResponse> => {
    try {
      const response = await api.post('/academic/posts', mapAcademicPostPayload(postData));
      return response.data;
    } catch (error) {
      return extractError(error, 'Failed to create post.');
    }
  },

  updatePost: async (postId: string, updateData: Partial<CreatePostData>): Promise<AcademicPostMutationResponse> => {
    try {
      const response = await api.put(`/academic/posts/${postId}`, mapPartialAcademicPostPayload(updateData));
      return response.data;
    } catch (error) {
      return extractError(error, 'Failed to update post.');
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

  likePost: async (postId: string): Promise<AcademicLikeResponse> => {
    try {
      const response = await api.post(`/academic/posts/${postId}/like`);
      return {
        success: response.data?.success !== false,
        isLiked: response.data?.isLiked === true,
        likesCount: typeof response.data?.likesCount === 'number' ? response.data.likesCount : 0,
        message: response.data?.message,
      };
    } catch (error) {
      return extractError(error, 'Failed to update post like.');
    }
  },

  addComment: async (postId: string, text: string, parentId?: string) => {
    try {
      const response = await api.post(`/academic/posts/${postId}/comments`, {
        content: text,
        parentId,
      });
      return response.data;
    } catch (error) {
      return extractError(error, 'Failed to add comment.');
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
