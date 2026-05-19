import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_REFERRAL_CODE_KEY = 'pendingReferralCode';
type ReferralProgramCopy = {
  pointsPerSuccessfulReferral: number;
  rewardLabel?: string;
  qualificationRule?: string;
  eligibilityRule?: string;
};

export const normalizeReferralCode = (value: string) => value
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, '');

export const formatReferralCode = (value: string) => {
  const normalized = normalizeReferralCode(value);
  if (!normalized) {
    return '';
  }

  return normalized.match(/.{1,4}/g)?.join('-') || normalized;
};

export const storePendingReferralCode = async (value: string) => {
  const normalized = normalizeReferralCode(value);

  if (!normalized) {
    await AsyncStorage.removeItem(PENDING_REFERRAL_CODE_KEY);
    return;
  }

  await AsyncStorage.setItem(PENDING_REFERRAL_CODE_KEY, normalized);
};

export const getPendingReferralCode = async () => {
  const saved = await AsyncStorage.getItem(PENDING_REFERRAL_CODE_KEY);
  return saved ? normalizeReferralCode(saved) : '';
};

export const clearPendingReferralCode = async () => {
  await AsyncStorage.removeItem(PENDING_REFERRAL_CODE_KEY);
};

export const buildReferralShareMessage = (
  referralLink: string,
  referralCode: string,
  program: ReferralProgramCopy
) => {
  const normalizedCode = normalizeReferralCode(referralCode);
  const formattedCode = formatReferralCode(normalizedCode);
  const rewardLabel = program.rewardLabel || `${program.pointsPerSuccessfulReferral} points per verified signup`;

  return [
    'Join ADUSTECH with my verified invite link.',
    referralLink,
    '',
    `Referral code: ${formattedCode}`,
    rewardLabel,
    program.qualificationRule || 'Referral rewards unlock after email verification.',
  ].join('\n');
};

export const formatReferralConversion = (value: number) => `${Math.max(0, Math.min(100, Math.round(value)))}%`;
