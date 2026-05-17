import React, { useEffect, useRef, useState } from 'react';
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
  }>();
  const startedRef = useRef(false);
  const isDark = useColorScheme() === 'dark';

  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your ticket payment...');
  const [eventId, setEventId] = useState('');
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
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;

    const confirmPayment = async () => {
      const reference = pickParam(params.reference) || pickParam(params.trxref);
      const status = pickParam(params.status);

      if (!reference) {
        setState('error');
        setMessage('We could not read the Paystack transaction reference for this payment.');
        return;
      }

      try {
        let response;
        let lastError: any;

        for (const delayMs of CONFIRM_RETRY_DELAYS_MS) {
          if (delayMs > 0) {
            setMessage('Still checking Paystack and webhook confirmation...');
            await wait(delayMs);
          }

          try {
            response = await eventsAPI.confirmPaystackPayment({
              reference,
              status,
            });
            break;
          } catch (error: any) {
            lastError = error;

            const statusCode = Number(error?.status || error?.response?.status || 0);
            if (statusCode >= 400 && statusCode < 500 && statusCode !== 409) {
              break;
            }
          }
        }

        if (!response) {
          throw lastError || new Error('We could not confirm this payment.');
        }

        setEventId(response.event.id);
        setState('success');
        setMessage(response.message || 'Your ticket payment has been confirmed.');
        showToast.success(response.message || 'Ticket payment confirmed.');
      } catch (error: any) {
        setEventId('');
        setState('error');
        setMessage(error?.response?.data?.message || error?.message || 'We could not confirm this payment.');
        showToast.error(error?.response?.data?.message || error?.message || 'Payment confirmation failed.');
      }
    };

    confirmPayment();
  }, [params.reference, params.status, params.trxref]);

  const iconName = state === 'loading'
    ? 'time-outline'
    : state === 'success'
      ? 'checkmark-circle'
      : 'alert-circle';
  const iconColor = state === 'success'
    ? palette.success
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
                : 'Payment not confirmed'}
          </Text>

          <Text style={[styles.message, { color: palette.subtext }]}>{message}</Text>

          {state !== 'loading' ? (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: state === 'success' ? palette.success : palette.accent }]}
              onPress={() => {
                if (eventId) {
                  router.replace({ pathname: '/paid-ticket/[eventId]' as any, params: { eventId } });
                  return;
                }

                router.replace('/events');
              }}
            >
              <Text style={styles.primaryButtonText}>
                {eventId ? 'Open secure ticket' : 'Back to events'}
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
