import api, { getErrorMessage } from './api';

export type PostScope = 'global' | 'faculty' | 'department' | 'level';

export interface PostAuthor {
  id: string;
  name: string;
  profileImage: string;
  role: string;
  department: string;
  level: string;
  faculty: string;
}

export interface PostFaculty {
  id: string;
  name: string;
  code: string;
}

export interface PostDepartment {
  id: string;
  name: string;
  code: string;
  faculty: PostFaculty | null;
}

export interface PostLevel {
  id: string;
  levelNumber: number | null;
  displayName: string;
  department: PostDepartment | null;
}

export interface PostReply {
  id: string;
  postId: string;
  parentId: string | null;
  text: string;
  userName: string;
  author: PostAuthor;
  likesCount: number;
  repliesCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
  parent: {
    id: string;
    userName: string;
    text: string;
  } | null;
  replies: PostReply[];
}

export type PostComment = PostReply;

export interface PostItem {
  id: string;
  title: string;
  text: string;
  excerpt: string;
  category: string;
  priority: string;
  imageUrl: string;
  scope: PostScope;
  userId: string;
  userName: string;
  author: PostAuthor;
  faculty: PostFaculty | null;
  department: PostDepartment | null;
  departmentId: string;
  level: PostLevel | null;
  levelId: string;
  levelValue: string;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  isLiked: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  comments?: PostComment[];
}

export interface PostPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasMore: boolean;
}

export interface ListPostsParams {
  q?: string;
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
  departmentId?: string;
  level?: string;
  levelId?: string;
}

export interface PostsListResponse {
  success: boolean;
  posts: PostItem[];
  pagination: PostPagination;
}

export interface PostMutationResponse {
  success: boolean;
  message: string;
  post: PostItem;
}

export interface LikeMutationResponse {
  success: boolean;
  liked: boolean;
  likesCount: number;
  message: string;
}

export interface PostDetailResponse {
  success: boolean;
  post: PostItem;
}

export interface PostCommentsResponse {
  success: boolean;
  comments: PostComment[];
  total: number;
}

export interface CommentMutationResponse {
  success: boolean;
  message: string;
  comment: PostComment;
  commentsCount: number;
}

const normalizeString = (value: unknown): string => {
  return typeof value === 'string' ? value : '';
};

const normalizeNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (Array.isArray(value)) {
    return value.length;
  }

  return 0;
};

const normalizeBoolean = (value: unknown): boolean => value === true;

const toPostScope = (value: unknown): PostScope => {
  switch (value) {
    case 'faculty':
    case 'department':
    case 'level':
      return value;
    default:
      return 'global';
  }
};

const normalizeFaculty = (faculty: any): PostFaculty | null => {
  if (!faculty || typeof faculty !== 'object') {
    return null;
  }

  return {
    id: normalizeString(faculty.id),
    name: normalizeString(faculty.name),
    code: normalizeString(faculty.code),
  };
};

const normalizeDepartment = (department: any): PostDepartment | null => {
  if (!department || typeof department !== 'object') {
    return null;
  }

  return {
    id: normalizeString(department.id),
    name: normalizeString(department.name),
    code: normalizeString(department.code),
    faculty: normalizeFaculty(department.faculty),
  };
};

const normalizeLevel = (level: any, fallbackLevelValue = ''): PostLevel | null => {
  if (level && typeof level === 'object') {
    return {
      id: normalizeString(level.id),
      levelNumber: typeof level.levelNumber === 'number' ? level.levelNumber : normalizeNumber(level.levelNumber) || null,
      displayName: normalizeString(level.displayName),
      department: normalizeDepartment(level.department),
    };
  }

  const normalizedFallback = normalizeString(fallbackLevelValue);
  if (!normalizedFallback) {
    return null;
  }

  const parsedLevelNumber = normalizeNumber(normalizedFallback) || null;

  return {
    id: '',
    levelNumber: parsedLevelNumber,
    displayName: parsedLevelNumber ? `${parsedLevelNumber} Level` : normalizedFallback,
    department: null,
  };
};

const normalizeAuthor = (author: any, fallbackName = ''): PostAuthor => {
  const name = normalizeString(author?.name) || fallbackName || 'Unknown';

  return {
    id: normalizeString(author?.id),
    name,
    profileImage: normalizeString(author?.profileImage),
    role: normalizeString(author?.role) || 'user',
    department: normalizeString(author?.department),
    level: normalizeString(author?.level),
    faculty: normalizeString(author?.faculty),
  };
};

const normalizeComment = (comment: any): PostComment => {
  const userName = normalizeString(comment?.userName);

  return {
    id: normalizeString(comment?.id || comment?._id),
    postId: normalizeString(comment?.postId),
    parentId: normalizeString(comment?.parentId) || null,
    text: normalizeString(comment?.text || comment?.content),
    userName,
    author: normalizeAuthor(comment?.author || comment?.User || comment?.user, userName),
    likesCount: normalizeNumber(comment?.likesCount ?? comment?.likes ?? comment?.totalLikes),
    repliesCount: normalizeNumber(comment?.repliesCount ?? comment?.replies),
    isLiked: normalizeBoolean(comment?.isLiked ?? comment?.liked),
    createdAt: normalizeString(comment?.createdAt),
    updatedAt: normalizeString(comment?.updatedAt),
    parent: comment?.parent ? {
      id: normalizeString(comment.parent.id),
      userName: normalizeString(comment.parent.userName),
      text: normalizeString(comment.parent.text),
    } : null,
    replies: Array.isArray(comment?.replies) ? comment.replies.map(normalizeComment) : [],
  };
};

const inferScope = (post: any): PostScope => {
  if (post?.scope) {
    return toPostScope(post.scope);
  }

  if (post?.level || post?.levelId) {
    return 'level';
  }

  if (post?.department || post?.departmentId) {
    return 'department';
  }

  if (post?.faculty || post?.facultyId) {
    return 'faculty';
  }

  return 'global';
};

const normalizePost = (post: any): PostItem => {
  const userName = normalizeString(post?.userName || post?.author?.name);
  const levelValue =
    normalizeString(post?.levelValue) ||
    (typeof post?.level === 'string' ? post.level : '') ||
    (typeof post?.level?.levelNumber === 'number' ? String(post.level.levelNumber) : '');
  const text = normalizeString(post?.text || post?.content);

  return {
    id: normalizeString(post?.id || post?._id),
    title: normalizeString(post?.title) || text.slice(0, 80) || 'Post',
    text,
    excerpt: normalizeString(post?.excerpt) || text.slice(0, 140),
    category: normalizeString(post?.category) || 'All',
    priority: normalizeString(post?.priority) || 'normal',
    imageUrl: normalizeString(post?.imageUrl || post?.image || post?.imageBase64),
    scope: inferScope(post),
    userId: normalizeString(post?.userId || post?.author?.id),
    userName,
    author: normalizeAuthor(post?.author || post?.user, userName),
    faculty: normalizeFaculty(post?.faculty),
    department: normalizeDepartment(post?.department),
    departmentId: normalizeString(post?.departmentId || post?.department?.id),
    level: normalizeLevel(typeof post?.level === 'object' ? post.level : null, levelValue),
    levelId: normalizeString(post?.levelId || post?.level?.id),
    levelValue,
    likesCount: normalizeNumber(post?.likesCount ?? post?.totalLikes ?? post?.likes),
    commentsCount: normalizeNumber(post?.commentsCount ?? post?.totalComments ?? post?.comments),
    viewsCount: normalizeNumber(post?.viewsCount ?? post?.totalViews ?? post?.views),
    isLiked: normalizeBoolean(post?.isLiked ?? post?.liked),
    isPinned: normalizeBoolean(post?.isPinned),
    createdAt: normalizeString(post?.createdAt),
    updatedAt: normalizeString(post?.updatedAt),
    comments: Array.isArray(post?.comments) ? post.comments.map(normalizeComment) : undefined,
  };
};

const normalizePagination = (pagination: any): PostPagination => ({
  total: normalizeNumber(pagination?.total ?? pagination?.totalPosts),
  page: normalizeNumber(pagination?.page ?? pagination?.currentPage) || 1,
  limit: normalizeNumber(pagination?.limit) || 20,
  pages: normalizeNumber(pagination?.pages ?? pagination?.totalPages) || 1,
  hasMore: normalizeBoolean(pagination?.hasMore),
});

const extractError = (error: unknown, fallbackMessage: string): never => {
  throw new Error(getErrorMessage(error, fallbackMessage));
};

export const postsAPI = {
  list: async (params?: ListPostsParams): Promise<PostsListResponse> => {
    try {
      const response = await api.get('/posts', {
        params: {
          ...(params?.page ? { page: params.page } : {}),
          ...(params?.limit ? { limit: params.limit } : {}),
          ...(params?.category ? { category: params.category } : {}),
          ...(params?.departmentId ? { departmentId: params.departmentId } : {}),
          ...(params?.level ? { level: params.level } : {}),
          ...(params?.levelId ? { levelId: params.levelId } : {}),
          ...((params?.search || params?.q) ? { search: params.search || params.q } : {}),
        },
      });

      return {
        success: response.data?.success !== false,
        posts: Array.isArray(response.data?.posts) ? response.data.posts.map(normalizePost) : [],
        pagination: normalizePagination(response.data?.pagination),
      };
    } catch (error) {
      return extractError(error, 'Failed to fetch posts.');
    }
  },

  create: async (payload: {
    text?: string;
    imageBase64?: string;
    category?: string;
    departmentId?: string;
    level?: string;
    levelId?: string;
  }): Promise<PostMutationResponse> => {
    try {
      const response = await api.post('/posts', payload);
      return {
        success: response.data?.success !== false,
        message: normalizeString(response.data?.message),
        post: normalizePost(response.data?.post),
      };
    } catch (error) {
      return extractError(error, 'Failed to create post.');
    }
  },

  toggleLike: async (id: string): Promise<LikeMutationResponse> => {
    try {
      const response = await api.post(`/posts/${id}/like`);
      return {
        success: response.data?.success !== false,
        liked: normalizeBoolean(response.data?.liked),
        likesCount: normalizeNumber(response.data?.likesCount ?? response.data?.totalLikes),
        message: normalizeString(response.data?.message),
      };
    } catch (error) {
      return extractError(error, 'Failed to update post like.');
    }
  },

  get: async (id: string): Promise<PostDetailResponse> => {
    try {
      const response = await api.get(`/posts/${id}`);
      return {
        success: response.data?.success !== false,
        post: normalizePost(response.data?.post),
      };
    } catch (error) {
      return extractError(error, 'Failed to fetch post.');
    }
  },

  listComments: async (id: string): Promise<PostCommentsResponse> => {
    try {
      const response = await api.get(`/posts/${id}/comments`);
      return {
        success: response.data?.success !== false,
        comments: Array.isArray(response.data?.comments) ? response.data.comments.map(normalizeComment) : [],
        total: normalizeNumber(response.data?.total),
      };
    } catch (error) {
      return extractError(error, 'Failed to fetch comments.');
    }
  },

  addComment: async (id: string, text: string, parentId?: string): Promise<CommentMutationResponse> => {
    try {
      const response = await api.post(`/posts/${id}/comments`, { text, parentId });
      return {
        success: response.data?.success !== false,
        message: normalizeString(response.data?.message),
        comment: normalizeComment(response.data?.comment),
        commentsCount: normalizeNumber(response.data?.commentsCount),
      };
    } catch (error) {
      return extractError(error, 'Failed to add comment.');
    }
  },

  toggleLikeComment: async (postId: string, commentId: string): Promise<LikeMutationResponse> => {
    try {
      const response = await api.post(`/posts/${postId}/comments/${commentId}/like`);
      return {
        success: response.data?.success !== false,
        liked: normalizeBoolean(response.data?.liked),
        likesCount: normalizeNumber(response.data?.likesCount ?? response.data?.totalLikes),
        message: normalizeString(response.data?.message),
      };
    } catch (error) {
      return extractError(error, 'Failed to update comment like.');
    }
  },
};
