import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_REFERRAL_CODE_KEY = 'pendingReferralCode';

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
