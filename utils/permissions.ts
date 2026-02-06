// Permission utility functions for role-based access control

export type UserRole = 'power' | 'admin' | 'd-admin' | 'user';

export interface PermissionContext {
  role?: UserRole;
  departmentId?: number;
  channelId?: number;
  channelDepartmentId?: number;
}

/**
 * Check if user can post to the home page/main feed
 * Only power admins and admins can post to home
 */
export const canPostToHome = (role?: UserRole): boolean => {
  return role === 'power' || role === 'admin';
};

/**
 * Check if user can post to a specific channel
 * - Power and admin can post anywhere
 * - D-admin can only post to their department's channels
 * - Regular users CANNOT post anywhere
 */
export const canPostToChannel = (context: PermissionContext): boolean => {
  const { role, departmentId, channelDepartmentId } = context;
  
  // Power and admin can post anywhere
  if (role === 'power' || role === 'admin') {
    return true;
  }
  
  // D-admin can only post to their department's channels
  if (role === 'd-admin') {
    return departmentId !== undefined && 
           channelDepartmentId !== undefined && 
           departmentId === channelDepartmentId;
  }
  
  // Regular users CANNOT post anywhere
  return false;
};

/**
 * Check if user can create a channel
 * Only power admins and admins can create channels
 */
export const canCreateChannel = (role?: UserRole): boolean => {
  return role === 'power' || role === 'admin';
};

/**
 * Check if user can create an event
 * - Power and admin can create global events
 * - D-admin can create department events
 */
export const canCreateEvent = (role?: UserRole): boolean => {
  return role === 'power' || role === 'admin' || role === 'd-admin';
};

/**
 * Check if user can manage users (promote/demote)
 * Only power admins can manage admins
 */
export const canManageUsers = (role?: UserRole): boolean => {
  return role === 'power';
};

/**
 * Check if user can delete any post
 * Power and admin can delete any post
 * D-admin can delete posts in their department
 */
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

/**
 * Get user role display name
 */
export const getRoleDisplayName = (role?: UserRole): string => {
  switch (role) {
    case 'power': return 'Power Admin';
    case 'admin': return 'Admin';
    case 'd-admin': return 'Department Admin';
    case 'user': return 'User';
    default: return 'User';
  }
};

/**
 * Get role badge color
 */
export const getRoleBadgeColor = (role?: UserRole): string => {
  switch (role) {
    case 'power': return '#9C27B0'; // Purple
    case 'admin': return '#F44336'; // Red
    case 'd-admin': return '#FF9800'; // Orange
    case 'user': return '#2196F3'; // Blue
    default: return '#2196F3';
  }
};

/**
 * Get permission error message
 */
export const getPermissionErrorMessage = (action: string, role?: UserRole): string => {
  const roleName = getRoleDisplayName(role);
  
  switch (action) {
    case 'post-home':
      return 'Only Power Admins and Admins can post to the home feed. Contact an administrator if you need posting privileges.';
    case 'post-channel':
      if (role === 'd-admin') {
        return 'As a Department Admin, you can only post to channels in your department.';
      } else if (role === 'user' || !role) {
        return 'Only administrators can create posts. You can like, comment, and share existing posts.';
      }
      return 'You do not have permission to post in this channel.';
    case 'create-channel':
      return 'Only Power Admins and Admins can create channels.';
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
