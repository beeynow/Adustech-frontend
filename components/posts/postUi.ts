import type { PostItem } from '@/services/postsApi';

const toSingleDecimalFloor = (value: number) => (Math.floor(value * 10) / 10).toFixed(1);

export const formatPostTimeAgo = (value?: string) => {
  if (!value) {
    return 'now';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'now';
  }

  const diff = Math.max(0, Date.now() - date.getTime());
  const mins = Math.floor(diff / 60000);

  if (mins < 1) {
    return 'now';
  }

  if (mins < 60) {
    return `${mins}m`;
  }

  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d`;
  }

  if (days < 30) {
    return `${Math.floor(days / 7)}w`;
  }

  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${month} ${date.getDate()}`;
};

export const formatPostCount = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return '0';
  }

  const safeValue = Math.trunc(value);

  if (value >= 1000000) {
    return `${toSingleDecimalFloor(safeValue / 1000000)}M`;
  }

  if (safeValue >= 100) {
    return `${toSingleDecimalFloor(safeValue / 1000)}k`;
  }

  return String(safeValue);
};

export const buildAuthorHandle = (name: string, fallbackId = '') => {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim();

  if (slug.length >= 3) {
    return `@${slug}`;
  }

  const safeId = fallbackId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toLowerCase();
  return `@adustech${safeId || 'user'}`;
};

export const getPostScopeLabel = (post: PostItem) => {
  if (post.scope === 'level' && post.level) {
    const departmentName = post.level.department?.name;
    return departmentName
      ? `${post.level.displayName || `${post.level.levelNumber || ''} Level`} / ${departmentName}`
      : (post.level.displayName || `${post.level.levelNumber || ''} Level`);
  }

  if (post.scope === 'department' && post.department) {
    return post.department.name;
  }

  if (post.scope === 'faculty' && post.faculty) {
    return post.faculty.name;
  }

  return 'Campus feed';
};

export const getPostScopeIcon = (post: PostItem) => {
  switch (post.scope) {
    case 'level':
      return 'layers-outline';
    case 'department':
      return 'business-outline';
    case 'faculty':
      return 'school-outline';
    default:
      return 'globe-outline';
  }
};

export const getRoleLabel = (role: string) => {
  switch (role) {
    case 'power':
      return 'Power Admin';
    case 'admin':
      return 'Admin';
    case 'd-admin':
      return 'Dept Admin';
    default:
      return '';
  }
};

export const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'Urgent';
    case 'high':
      return 'Priority';
    case 'low':
      return 'Low priority';
    default:
      return '';
  }
};

export const shouldShowPostTitle = (post: PostItem) => {
  const title = post.title.trim();
  const text = post.text.trim();

  if (!title) {
    return false;
  }

  if (!text) {
    return true;
  }

  if (title === text) {
    return false;
  }

  return !text.startsWith(title);
};
