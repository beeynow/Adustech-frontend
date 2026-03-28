import React from 'react';
import { Linking, Text, View } from 'react-native';
import Constants from 'expo-constants';
import {
  ActionButton,
  HeroCard,
  ScreenShell,
  SectionHeading,
  SurfaceCard,
} from '@/components/ui/AppChrome';
import { useAppTheme } from '@/utils/theme';

export default function InfoScreen() {
  const theme = useAppTheme();
  const appName = Constants.expoConfig?.name || 'ADUSTECH';
  const version = Constants.expoConfig?.version || Constants.nativeAppVersion || '1.0.0';
  const build = Constants.nativeBuildVersion || '-';

  const infoRows = [
    { label: 'Version', value: `${version} (${build})` },
    { label: 'Website', value: 'adustech.app' },
    { label: 'Support', value: 'support@adustech.app' },
  ];

  return (
    <ScreenShell scroll>
      <HeroCard
        eyebrow="About"
        title={appName}
        subtitle="A cleaner home for campus communication, academic updates, channels, events, and student-facing university tools."
        icon="information-circle-outline"
      />

      <SectionHeading title="Build Details" subtitle="Current app and contact metadata." />
      <SurfaceCard>
        <View style={{ gap: 14 }}>
          {infoRows.map((row) => (
            <View
              key={row.label}
              style={{
                paddingBottom: 14,
                borderBottomWidth: row.label === infoRows[infoRows.length - 1].label ? 0 : 1,
                borderBottomColor: theme.border,
              }}
            >
              <Text style={{ color: theme.textSoft, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {row.label}
              </Text>
              <Text style={{ color: theme.text, marginTop: 6, fontSize: 16, fontWeight: '700' }}>{row.value}</Text>
            </View>
          ))}
        </View>
      </SurfaceCard>

      <SectionHeading title="Platform Summary" subtitle="What the app is built to help students and admins do well." />
      <SurfaceCard>
        <Text style={{ color: theme.text, fontSize: 17, fontWeight: '900' }}>Connected university life</Text>
        <Text style={{ color: theme.textMuted, marginTop: 8, lineHeight: 22 }}>
          ADUSTECH brings academic notices, department rooms, events, timetables, and community updates into one mobile workspace.
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
          <View style={{ flex: 1 }}>
            <ActionButton label="Visit Site" icon="globe-outline" onPress={() => Linking.openURL('https://adustech.app')} />
          </View>
          <View style={{ flex: 1 }}>
            <ActionButton label="Contact Support" icon="mail-outline" variant="secondary" onPress={() => Linking.openURL('mailto:support@adustech.app')} />
          </View>
        </View>
      </SurfaceCard>
    </ScreenShell>
  );
}
