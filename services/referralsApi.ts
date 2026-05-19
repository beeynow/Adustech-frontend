import api, { getErrorMessage } from './api';

export interface ReferralProgram {
  pointsPerSuccessfulReferral: number;
  rewardLabel: string;
  qualificationRule: string;
  eligibilityRule: string;
}

export interface ReferralPreview {
  code: string;
  referralLink: string;
  referrer: {
    id: string;
    name: string;
    department: string;
    profileImage: string;
  };
  program: ReferralProgram;
}

export interface ReferralHistoryItem {
  id: string;
  status: string;
  source: string;
  pointsAwarded: number;
  referralCode: string;
  completedAt: string | null;
  createdAt: string;
  referredUser: {
    id: string;
    name: string;
    email: string;
    department: string;
    profileImage: string;
    isVerified: boolean;
  };
}

export interface ReferralOverview {
  summary: {
    points: number;
    completedReferrals: number;
    totalReferrals: number;
    pendingReferrals: number;
    conversionRate: number;
    rank: number;
    weeklyPoints: number;
  };
  share: {
    referralCode: string;
    referralLink: string;
    message: string;
  };
  invitedBy: {
    id: string;
    name: string;
    department: string;
    referralCode: string;
  } | null;
  program: ReferralProgram;
  history: ReferralHistoryItem[];
}

export interface ReferralLeaderboardEntry {
  id: string;
  name: string;
  department: string;
  profileImage: string;
  points: number;
  completedReferrals: number;
  weeklyPoints: number;
  rank: number;
  change: number;
}

export interface ReferralLeaderboardResponse {
  scope: 'all' | 'department' | 'weekly';
  leaders: ReferralLeaderboardEntry[];
  currentUserRank: number | null;
  scopeMessage: string;
  program: ReferralProgram;
}

export const referralsAPI = {
  getPreview: async (code: string): Promise<ReferralPreview> => {
    const response = await api.get(`/referrals/code/${encodeURIComponent(code)}`);
    return response.data;
  },

  getOverview: async (): Promise<ReferralOverview> => {
    const response = await api.get('/referrals/me');
    return response.data;
  },

  getLeaderboard: async (scope: 'all' | 'department' | 'weekly'): Promise<ReferralLeaderboardResponse> => {
    const response = await api.get('/referrals/leaderboard', {
      params: { scope },
    });

    return response.data;
  },

  extractErrorMessage: (error: unknown, fallbackMessage: string) => getErrorMessage(error, fallbackMessage),
};
