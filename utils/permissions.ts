// Permission utility functions for role-based access control

export type UserRole = 'power' | 'admin' | 'd-admin' | 'user';

export interface PermissionContext {
  role?: UserRole;
  departmentId?: number;
  channelId?: number;
  channelDepartmentId?: number;
}

export const canPostToHome = (role?: UserRole): boolean => {
  return role === 'power' || role === 'admin' || role === 'd-admin';
};

export const canPostToChannel = (context: PermissionContext): boolean => {
  const { role, departmentId, channelDepartmentId } = context;

  if (role === 'power' || role === 'admin') {
    return true;
  }

  if (role === 'd-admin') {
    return departmentId !== undefined &&
      channelDepartmentId !== undefined &&
      departmentId === channelDepartmentId;
  }

  return false;
};

// Policy aligned with UI and current backend behavior.
export const canCreateChannel = (role?: UserRole): boolean => {
  return role === 'power' || role === 'admin' || role === 'd-admin';
};

export const canCreateEvent = (role?: UserRole): boolean => {
  return role === 'power' || role === 'admin' || role === 'd-admin';
};

export const canManageUsers = (role?: UserRole): boolean => {
  return role === 'power';
};

export const canVerifyEventTickets = (role?: UserRole): boolean => {
  return role === 'power' || role === 'admin';
};

export const canDeletePost = (context: PermissionContext): boolean => {
  const { role, departmentId, channelDepartmentId } = context;

  if (role === 'power' || role === 'admin') {
    return true;
  }

  if (role === 'd-admin') {
    return departmentId !== undefined &&
      channelDepartmentId !== undefined &&
      departmentId === channelDepartmentId;
  }

  return false;
};

export const getRoleDisplayName = (role?: UserRole): string => {
  switch (role) {
    case 'power': return 'Power Admin';
    case 'admin': return 'Admin';
    case 'd-admin': return 'Department Admin';
    case 'user': return 'User';
    default: return 'User';
  }
};

export const getRoleBadgeColor = (role?: UserRole): string => {
  switch (role) {
    case 'power': return '#9C27B0';
    case 'admin': return '#F44336';
    case 'd-admin': return '#FF9800';
    case 'user': return '#2196F3';
    default: return '#2196F3';
  }
};

export const getPermissionErrorMessage = (action: string, role?: UserRole): string => {
  switch (action) {
    case 'post-home':
      return role === 'd-admin'
        ? 'Department Admins can create posts, but they must target their managed department and level.'
        : 'Only administrators can create posts. Department admins can publish department-level updates.';
    case 'post-channel':
      if (role === 'd-admin') {
        return 'As a Department Admin, you can only post to channels in your department.';
      } else if (role === 'user' || !role) {
        return 'Only administrators can create posts. You can like, comment, and share existing posts.';
      }
      return 'You do not have permission to post in this channel.';
    case 'create-channel':
      return 'Only administrators can create channels.';
    case 'create-event':
      return 'You do not have permission to create events.';
    case 'manage-users':
      return 'Only Power Admins can manage user roles.';
    case 'delete-post':
      return 'You do not have permission to delete this post.';
    default:
      return 'You do not have permission to perform this action.';
  }
};
