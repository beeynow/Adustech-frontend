import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuth } from '../context/AuthContext';
import { type VerifyEventTicketResponse, eventsAPI } from '../services/eventsApi';
import { getEventTicketStatusLabel, getEventTicketStatusTone } from '../utils/events';
import { canVerifyEventTickets } from '../utils/permissions';
import { showToast } from '../utils/toast';

export default function EventTicketVerifierScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ eventTitle?: string | string[] }>();
  const { user } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const [permission, requestPermission] = useCameraPermissions();

  const [activeMode, setActiveMode] = useState<'scan' | 'manual'>('scan');
  const [manualCode, setManualCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [scanEnabled, setScanEnabled] = useState(true);
  const [result, setResult] = useState<VerifyEventTicketResponse | null>(null);
  const pageGradient: [string, string, string] = isDark
    ? ['#05111D', '#0C2237', '#12314C']
    : ['#F5FAFF', '#E6F2FF', '#DDEEFF'];

  const eventTitle = Array.isArray(params.eventTitle)
    ? params.eventTitle[0] || 'Event ticket verifier'
    : params.eventTitle || 'Event ticket verifier';

  const palette = {
    card: isDark ? 'rgba(7, 24, 38, 0.95)' : 'rgba(255, 255, 255, 0.96)',
    border: isDark ? 'rgba(108, 167, 247, 0.2)' : 'rgba(24, 96, 168, 0.12)',
    text: isDark ? '#F6FAFF' : '#09233B',
    subtext: isDark ? '#A8C6E6' : '#607488',
    accent: '#1976D2',
    accentSoft: isDark ? 'rgba(25,118,210,0.18)' : 'rgba(25,118,210,0.09)',
  };

  const handleVerification = async (payload: { ticketCode?: string; qrPayload?: string; method: 'scanner' | 'manual' }) => {
    if (processing) {
      return;
    }

    try {
      setProcessing(true);
      const response = await eventsAPI.verifyTicket(payload);
      setResult(response);
      showToast.success(response.alreadyVerified ? 'This ticket was already checked in.' : response.message);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Unable to verify this ticket.';
      showToast.error(errorMessage);
    } finally {
      setProcessing(false);
      setScanEnabled(false);
    }
  };

  const statusTone = getEventTicketStatusTone(result?.ticket || null);

  if (!canVerifyEventTickets(user?.role)) {
    return (
      <LinearGradient colors={pageGradient} style={styles.flex}>
        <View style={styles.lockedWrap}>
          <View style={[styles.lockedCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Ionicons name="shield-checkmark-outline" size={38} color={palette.accent} />
            <Text style={[styles.lockedTitle, { color: palette.text }]}>Only campus admins can verify tickets</Text>
            <Text style={[styles.lockedSubtitle, { color: palette.subtext }]}>
              Ask a power admin or main campus admin to open the verifier for entry check-in.
            </Text>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: palette.accent }]} onPress={() => router.back()}>
              <Text style={styles.primaryButtonText}>Go back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={pageGradient} style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <TouchableOpacity style={[styles.circleButton, { backgroundColor: palette.card, borderColor: palette.border }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color={palette.accent} />
          </TouchableOpacity>
        </View>

        <View style={[styles.heroCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>Entry Operations</Text>
          <Text style={[styles.heroTitle, { color: palette.text }]}>Verify event tickets with live QR scanning.</Text>
          <Text style={[styles.heroSubtitle, { color: palette.subtext }]}>
            {eventTitle}
          </Text>
        </View>

        <View style={styles.modeRow}>
          {(['scan', 'manual'] as const).map((mode) => {
            const active = activeMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modeChip,
                  {
                    backgroundColor: active ? palette.accent : palette.card,
                    borderColor: active ? palette.accent : palette.border,
                  },
                ]}
                onPress={() => setActiveMode(mode)}
              >
                <Text style={[styles.modeChipText, { color: active ? '#FFFFFF' : palette.text }]}>
                  {mode === 'scan' ? 'Scan QR' : 'Manual code'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeMode === 'scan' ? (
          <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>QR scanner</Text>
            <Text style={[styles.sectionSubtitle, { color: palette.subtext }]}>
              Scan the attendee QR pass and we will validate payment and check-in status instantly.
            </Text>

            {!permission ? (
              <View style={styles.cameraPlaceholder}>
                <ActivityIndicator size="large" color={palette.accent} />
              </View>
            ) : permission.granted ? (
              <View style={styles.cameraWrap}>
                <CameraView
                  style={styles.camera}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={scanEnabled && !processing ? ({ data }: { data: string }) => {
                    if (!data) {
                      return;
                    }

                    handleVerification({ qrPayload: data, method: 'scanner' });
                  } : undefined}
                />
                <View pointerEvents="none" style={styles.cameraOverlay}>
                  <View style={styles.scanFrame} />
                </View>
              </View>
            ) : (
              <View style={styles.permissionCard}>
                <Ionicons name="camera-outline" size={30} color={palette.accent} />
                <Text style={[styles.permissionTitle, { color: palette.text }]}>Camera access is required</Text>
                <Text style={[styles.permissionSubtitle, { color: palette.subtext }]}>
                  Allow camera access so the verifier can scan attendee QR tickets.
                </Text>
                <TouchableOpacity style={[styles.primaryButton, { backgroundColor: palette.accent }]} onPress={requestPermission}>
                  <Text style={styles.primaryButtonText}>Allow camera</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: palette.border, backgroundColor: palette.accentSoft }]}
              onPress={() => {
                setResult(null);
                setScanEnabled(true);
              }}
            >
              <Text style={[styles.secondaryButtonText, { color: palette.text }]}>Ready for next scan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Manual verification</Text>
            <Text style={[styles.sectionSubtitle, { color: palette.subtext }]}>
              Use the attendee ticket ID if scanning is not available.
            </Text>

            <TextInput
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="characters"
              placeholder="Enter ticket ID"
              placeholderTextColor={isDark ? '#7E97B2' : '#89A0B5'}
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F6FAFF',
                  color: palette.text,
                  borderColor: palette.border,
                },
              ]}
            />

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: palette.accent, opacity: processing ? 0.7 : 1 }]}
              disabled={processing}
              onPress={() => handleVerification({ ticketCode: manualCode.trim(), method: 'manual' })}
            >
              <Text style={styles.primaryButtonText}>{processing ? 'Verifying...' : 'Verify ticket'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {result ? (
          <View style={[styles.resultCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <View style={styles.resultHeader}>
              <View>
                <Text style={[styles.resultTitle, { color: palette.text }]}>Verification result</Text>
                <Text style={[styles.resultSubtitle, { color: palette.subtext }]}>{result.event?.title || eventTitle}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: statusTone.background }]}>
                <Text style={[styles.statusPillText, { color: statusTone.accent }]}>
                  {getEventTicketStatusLabel(result.ticket)}
                </Text>
              </View>
            </View>

            <View style={styles.resultGrid}>
              <View style={[styles.metricCard, { backgroundColor: palette.accentSoft }]}>
                <Text style={[styles.metricLabel, { color: palette.subtext }]}>Ticket ID</Text>
                <Text style={[styles.metricValue, { color: palette.text }]} numberOfLines={1}>{result.ticket.ticketId}</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: palette.accentSoft }]}>
                <Text style={[styles.metricLabel, { color: palette.subtext }]}>Holder</Text>
                <Text style={[styles.metricValue, { color: palette.text }]} numberOfLines={1}>{result.holder.name}</Text>
              </View>
            </View>

            <Text style={[styles.holderMeta, { color: palette.subtext }]}>{result.holder.email}</Text>
            <Text style={[styles.verificationMessage, { color: palette.text }]}>{result.message}</Text>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: palette.border, backgroundColor: palette.accentSoft }]}
              onPress={() => {
                setResult(null);
                setManualCode('');
                setScanEnabled(true);
              }}
            >
              <Text style={[styles.secondaryButtonText, { color: palette.text }]}>Verify another ticket</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 56,
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 20,
    gap: 6,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 31,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modeChipText: {
    fontSize: 14,
    fontWeight: '800',
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  cameraWrap: {
    height: 320,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(4, 17, 29, 0.18)',
  },
  scanFrame: {
    width: 220,
    height: 220,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  cameraPlaceholder: {
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionCard: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  permissionSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 14,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  resultSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  resultGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 5,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  holderMeta: {
    fontSize: 14,
  },
  verificationMessage: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  lockedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  lockedCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 12,
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  lockedSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
