import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { eventsAPI } from '../../services/eventsApi';
import { showToast } from '../../utils/toast';

const CONFIRM_RETRY_DELAYS_MS = [0, 1800, 4500, 8000];

const pickParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0] || '';
  }

  return value || '';
};

const wait = (delayMs: number) => new Promise((resolve) => {
  setTimeout(resolve, delayMs);
});

export default function PaystackCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    reference?: string | string[];
    trxref?: string | string[];
    status?: string | string[];
    transaction_id?: string | string[];
    transactionId?: string | string[];
  }>();
  const isDark = useColorScheme() === 'dark';

  const [state, setState] = useState<'loading' | 'success' | 'pending' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your ticket payment...');
  const [eventId, setEventId] = useState('');
  const [attemptKey, setAttemptKey] = useState(0);
  const [pendingAutoRetries, setPendingAutoRetries] = useState(0);
  const pageGradient: [string, string, string] = isDark
    ? ['#05111D', '#0C2237', '#12314C']
    : ['#F5FAFF', '#E4F1FF', '#D9ECFF'];

  const palette = {
    card: isDark ? 'rgba(7, 24, 38, 0.95)' : 'rgba(255, 255, 255, 0.96)',
    border: isDark ? 'rgba(108, 167, 247, 0.2)' : 'rgba(24, 96, 168, 0.12)',
    text: isDark ? '#F6FAFF' : '#09233B',
    subtext: isDark ? '#A8C6E6' : '#607488',
    accent: '#1976D2',
    success: '#0F9D58',
    danger: '#C62828',
  };

  useEffect(() => {
    let cancelled = false;

    const confirmPayment = async () => {
      const reference = pickParam(params.reference) || pickParam(params.trxref);
      const status = pickParam(params.status);
      const transactionId = pickParam(params.transactionId) || pickParam(params.transaction_id);

      if (!reference && !transactionId) {
        if (cancelled) {
          return;
        }

        setState('error');
        setMessage('We could not read the Paystack payment details for this confirmation.');
        return;
      }

      try {
        let response;
        let pendingResponse;
        let lastError: any;

        for (const delayMs of CONFIRM_RETRY_DELAYS_MS) {
          if (delayMs > 0) {
            if (cancelled) {
              return;
            }

            setMessage('Still checking Paystack and webhook confirmation...');
            await wait(delayMs);
          }

          try {
            const currentResponse = await eventsAPI.confirmPaystackPayment({
              reference,
              transactionId,
              status,
            });

            if (currentResponse.confirmationPending) {
              pendingResponse = currentResponse;
              break;
            }

            response = currentResponse;
            break;
          } catch (error: any) {
            lastError = error;

            const statusCode = Number(error?.status || error?.response?.status || 0);
            if (statusCode >= 400 && statusCode < 500) {
              break;
            }
          }
        }

        if (cancelled) {
          return;
        }

        if (!response) {
          if (pendingResponse) {
            setEventId(pendingResponse.event?.id || '');
            setState('pending');
            setPendingAutoRetries((value) => value + 1);
            setMessage(
              pendingResponse.message
                || 'Your payment is still being finalized by Paystack. Tap below to check again.'
            );
            return;
          }

          throw lastError || new Error('We could not confirm this payment.');
        }

        setEventId(response.event.id);
        setState('success');
        setPendingAutoRetries(0);
        setMessage(response.message || 'Your ticket payment has been confirmed.');
        showToast.success(response.message || 'Ticket payment confirmed.');
      } catch (error: any) {
        setEventId('');
        setState('error');
        setPendingAutoRetries(0);
        setMessage(error?.response?.data?.message || error?.message || 'We could not confirm this payment.');
        showToast.error(error?.response?.data?.message || error?.message || 'Payment confirmation failed.');
      }
    };

    void confirmPayment();

    return () => {
      cancelled = true;
    };
  }, [attemptKey, params.reference, params.status, params.transactionId, params.transaction_id, params.trxref]);

  useEffect(() => {
    if (state !== 'pending' || pendingAutoRetries >= 3) {
      return;
    }

    const timer = setTimeout(() => {
      setState('loading');
      setMessage('Rechecking your payment confirmation...');
      setAttemptKey((value) => value + 1);
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [pendingAutoRetries, state]);

  const iconName = state === 'loading'
    ? 'time-outline'
    : state === 'success'
      ? 'checkmark-circle'
      : state === 'pending'
        ? 'hourglass-outline'
        : 'alert-circle';
  const iconColor = state === 'success'
    ? palette.success
    : state === 'pending'
      ? palette.accent
    : state === 'error'
      ? palette.danger
      : palette.accent;

  return (
    <LinearGradient colors={pageGradient} style={styles.flex}>
      <View style={styles.center}>
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={[styles.iconShell, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(12,64,112,0.05)' }]}>
            {state === 'loading' ? (
              <ActivityIndicator size="large" color={palette.accent} />
            ) : (
              <Ionicons name={iconName} size={48} color={iconColor} />
            )}
          </View>

          <Text style={[styles.title, { color: palette.text }]}>
            {state === 'loading'
              ? 'Confirming payment'
              : state === 'success'
                ? 'Ticket is ready'
                : state === 'pending'
                  ? 'Still confirming'
                  : 'Payment not confirmed'}
          </Text>

          <Text style={[styles.message, { color: palette.subtext }]}>{message}</Text>

          {state !== 'loading' ? (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: state === 'success' ? palette.success : palette.accent }]}
              onPress={() => {
                if (state === 'pending') {
                  setState('loading');
                  setMessage('Rechecking your payment confirmation...');
                  setPendingAutoRetries(0);
                  setAttemptKey((value) => value + 1);
                  return;
                }

                if (eventId) {
                  router.replace({ pathname: '/paid-ticket/[eventId]' as any, params: { eventId } });
                  return;
                }

                router.replace('/events');
              }}
            >
              <Text style={styles.primaryButtonText}>
                {state === 'pending'
                  ? 'Check again'
                  : eventId
                    ? 'Open secure ticket'
                    : 'Back to events'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 16,
  },
  iconShell: {
    width: 92,
    height: 92,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 4,
    minWidth: 180,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
