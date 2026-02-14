/**
 * ============================================================================
 * INTEGRATED CHANNELS API SERVICE
 * Bulletproof channels system with auto profile integration
 * ============================================================================
 */

import api from './api';

interface CreateChannelData {
  name: string;
  description?: string;
  visibility?: 'public' | 'private';
  scope?: 'global' | 'faculty' | 'department' | 'level';
}

interface SendMessageData {
  content: string;
}

export const integratedChannelsApi = {
  // ============================================================================
  // CHANNEL MANAGEMENT
  // ============================================================================
  
  /**
   * Auto-join channels based on user profile
   * Called automatically after login/profile update
   */
  autoJoinChannels: async () => {
    try {
      const response = await api.post('/integrated-channels/auto-join');
      return response.data;
    } catch (error: any) {
      console.error('Error auto-joining channels:', error);
      throw error;
    }
  },

  /**
   * Get all available channels with membership status
   */
  getAllChannels: async () => {
    try {
      const response = await api.get('/integrated-channels');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching all channels:', error);
      throw error;
    }
  },

  /**
   * Get channels user is a member of
   */
  getMyChannels: async () => {
    try {
      const response = await api.get('/integrated-channels/my-channels');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching my channels:', error);
      throw error;
    }
  },

  /**
   * Get recommended channels based on user profile
   */
  getRecommendedChannels: async () => {
    try {
      const response = await api.get('/integrated-channels/recommended');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching recommended channels:', error);
      throw error;
    }
  },

  /**
   * Create a new channel (auto-associated with user profile)
   */
  createChannel: async (channelData: CreateChannelData) => {
    try {
      const response = await api.post('/integrated-channels', channelData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating channel:', error);
      throw error;
    }
  },

  /**
   * Join a channel
   */
  joinChannel: async (channelId: string) => {
    try {
      const response = await api.post(`/integrated-channels/${channelId}/join`);
      return response.data;
    } catch (error: any) {
      console.error('Error joining channel:', error);
      throw error;
    }
  },

  /**
   * Leave a channel
   */
  leaveChannel: async (channelId: string) => {
    try {
      const response = await api.post(`/integrated-channels/${channelId}/leave`);
      return response.data;
    } catch (error: any) {
      console.error('Error leaving channel:', error);
      throw error;
    }
  },

  // ============================================================================
  // MESSAGES
  // ============================================================================
  
  /**
   * Send message to channel
   */
  sendMessage: async (channelId: string, messageData: SendMessageData) => {
    try {
      const response = await api.post(`/integrated-channels/${channelId}/messages`, messageData);
      return response.data;
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  /**
   * Get channel messages
   */
  getChannelMessages: async (channelId: string, page: number = 1, limit: number = 50) => {
    try {
      const response = await api.get(`/integrated-channels/${channelId}/messages`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching channel messages:', error);
      throw error;
    }
  },

  // ============================================================================
  // CHANNEL CONTEXT HELPERS
  // ============================================================================
  
  /**
   * Get channel by scope (returns appropriate channel for user's context)
   */
  getChannelByScope: async (scope: 'global' | 'faculty' | 'department' | 'level') => {
    try {
      const channels = await api.get('/integrated-channels/my-channels');
      const filtered = channels.data.channels.filter((ch: any) => ch.scope === scope);
      return filtered;
    } catch (error: any) {
      console.error('Error fetching channels by scope:', error);
      throw error;
    }
  },

  /**
   * Get user's level channel (for department level room)
   */
  getUserLevelChannel: async () => {
    try {
      const response = await api.get('/integrated-channels/my-level-channel');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching level channel:', error);
      throw error;
    }
  }
};

export default integratedChannelsApi;
