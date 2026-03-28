import React from 'react';
import { Linking, Text, View } from 'react-native';
import {
  ActionButton,
  Chip,
  HeroCard,
  InfoBanner,
  ScreenShell,
  SectionHeading,
  SurfaceCard,
} from '@/components/ui/AppChrome';
import { useAppTheme } from '@/utils/theme';

const SUPPORT_NUMBERS = ['+2347030158810', '+2348037769325', '+2349073471497'];

export default function SupportScreen() {
  const theme = useAppTheme();

  const openWhatsApp = async (number: string) => {
    const phone = number.replace(/\D/g, '');

    try {
      await Linking.openURL(`whatsapp://send?phone=${phone}`);
    } catch {
      Linking.openURL(`https://wa.me/${phone}`).catch(() => {});
    }
  };

  return (
    <ScreenShell scroll>
      <HeroCard
        eyebrow="Support"
        title="Help that feels close by"
        subtitle="Reach the ADUSTECH support team through the fastest channel for account issues, feedback, and platform questions."
        icon="headset-outline"
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Chip label="WhatsApp first" icon="logo-whatsapp" tone="success" />
          <Chip label="Email support" icon="mail-outline" tone="accent" />
          <Chip label="Phone fallback" icon="call-outline" tone="warning" />
        </View>
      </HeroCard>

      <SectionHeading
        title="Direct Contacts"
        subtitle="Tap any number to start a WhatsApp conversation with support."
      />
      <View style={{ gap: 12 }}>
        {SUPPORT_NUMBERS.map((number) => (
          <SurfaceCard key={number}>
            <Text style={{ color: theme.text, fontSize: 17, fontWeight: '900' }}>{number}</Text>
            <Text style={{ color: theme.textMuted, marginTop: 6, marginBottom: 14, lineHeight: 20 }}>
              Best for quick help with sign-in issues, posting problems, and urgent platform questions.
            </Text>
            <ActionButton label="Open WhatsApp" icon="logo-whatsapp" onPress={() => openWhatsApp(number)} />
          </SurfaceCard>
        ))}
      </View>

      <SectionHeading
        title="Other Channels"
        subtitle="Use these when you want a formal report, call, or web-based help article."
      />
      <View style={{ gap: 12 }}>
        <SurfaceCard>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: '900' }}>Email Support</Text>
          <Text style={{ color: theme.textMuted, marginTop: 6, marginBottom: 14 }}>
            Send account details or longer issue reports to the main support mailbox.
          </Text>
          <ActionButton label="Compose Email" icon="mail-outline" onPress={() => Linking.openURL('mailto:support@adustech.app')} />
        </SurfaceCard>

        <SurfaceCard>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: '900' }}>Help Center</Text>
          <Text style={{ color: theme.textMuted, marginTop: 6, marginBottom: 14 }}>
            Browse public guides and troubleshooting resources from the web support center.
          </Text>
          <ActionButton label="Visit Help Center" icon="globe-outline" variant="secondary" onPress={() => Linking.openURL('https://beeynow.online/help')} />
        </SurfaceCard>

        <SurfaceCard>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: '900' }}>Call Support</Text>
          <Text style={{ color: theme.textMuted, marginTop: 6, marginBottom: 14 }}>
            Use a phone call when the issue is urgent and you need human assistance quickly.
          </Text>
          <ActionButton label="Call Now" icon="call-outline" variant="secondary" onPress={() => Linking.openURL('tel:+2349073471497')} />
        </SurfaceCard>
      </View>

      <InfoBanner
        message="Support responses are fastest on WhatsApp, especially during active academic hours."
        tone="success"
        icon="time-outline"
      />
    </ScreenShell>
  );
}
