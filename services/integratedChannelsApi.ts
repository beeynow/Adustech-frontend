import api, { getErrorMessage } from './api';

interface CreateChannelData {
  name: string;
  description?: string;
  visibility?: 'public' | 'private';
  scope?: 'global' | 'faculty' | 'department' | 'level';
}

interface SendMessageData {
  content: string;
}

const fail = (error: unknown, fallback: string): never => {
  throw new Error(getErrorMessage(error, fallback));
};

export const integratedChannelsApi = {
  autoJoinChannels: async () => {
    try {
      const response = await api.post('/integrated-channels/auto-join');
      return response.data;
    } catch (error) {
      fail(error, 'Failed to auto-join channels.');
    }
  },

  getAllChannels: async () => {
    try {
      const response = await api.get('/integrated-channels');
      return response.data;
    } catch (error) {
      fail(error, 'Failed to fetch channels.');
    }
  },

  getMyChannels: async () => {
    try {
      const response = await api.get('/integrated-channels/my-channels');
      return response.data;
    } catch (error) {
      fail(error, 'Failed to fetch your channels.');
    }
  },

  getFacultyRoom: async (facultyId: string) => {
    try {
      const response = await api.get(`/integrated-channels/faculty/${facultyId}`);
      return response.data;
    } catch (error) {
      fail(error, 'Failed to fetch faculty room.');
    }
  },

  getDepartmentRoom: async (departmentId: string) => {
    try {
      const response = await api.get(`/integrated-channels/department/${departmentId}`);
      return response.data;
    } catch (error) {
      fail(error, 'Failed to fetch department room.');
    }
  },

  getLevelRoom: async (levelId: string) => {
    try {
      const response = await api.get(`/integrated-channels/level/${levelId}`);
      return response.data;
    } catch (error) {
      fail(error, 'Failed to fetch level room.');
    }
  },

  getRecommendedChannels: async () => {
    try {
      const response = await api.get('/integrated-channels/recommended');
      return response.data;
    } catch (error) {
      fail(error, 'Failed to fetch recommended channels.');
    }
  },

  createChannel: async (channelData: CreateChannelData) => {
    try {
      const response = await api.post('/integrated-channels', channelData);
      return response.data;
    } catch (error) {
      fail(error, 'Failed to create channel.');
    }
  },

  joinChannel: async (channelId: string) => {
    try {
      const response = await api.post(`/integrated-channels/${channelId}/join`);
      return response.data;
    } catch (error) {
      fail(error, 'Failed to join channel.');
    }
  },

  leaveChannel: async (channelId: string) => {
    try {
      const response = await api.post(`/integrated-channels/${channelId}/leave`);
      return response.data;
    } catch (error) {
      fail(error, 'Failed to leave channel.');
    }
  },

  sendMessage: async (channelId: string, messageData: SendMessageData) => {
    try {
      const response = await api.post(`/integrated-channels/${channelId}/messages`, messageData);
      return response.data;
    } catch (error) {
      fail(error, 'Failed to send message.');
    }
  },

  getChannelMessages: async (channelId: string, page = 1, limit = 50) => {
    try {
      const response = await api.get(`/integrated-channels/${channelId}/messages`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      fail(error, 'Failed to fetch channel messages.');
    }
  },

  getChannelByScope: async (scope: 'global' | 'faculty' | 'department' | 'level') => {
    try {
      const channelsResponse = await api.get('/integrated-channels/my-channels');
      return (channelsResponse.data?.channels || []).filter((channel: any) => channel.scope === scope);
    } catch (error) {
      fail(error, 'Failed to fetch scoped channels.');
    }
  },

  getUserLevelChannel: async () => {
    try {
      const channelsResponse = await api.get('/integrated-channels/my-channels');
      const levelChannel = (channelsResponse.data?.channels || []).find((channel: any) => channel.scope === 'level');

      return {
        success: true,
        channel: levelChannel || null,
      };
    } catch (error) {
      fail(error, 'Failed to fetch level channel.');
    }
  },
};

export default integratedChannelsApi;
