import React from 'react';
import {
  EmptyState,
  HeroCard,
  InfoBanner,
  ScreenShell,
} from '@/components/ui/AppChrome';

export default function InvitesScreen() {
  return (
    <ScreenShell scroll>
      <HeroCard
        eyebrow="Invitations"
        title="Committee and group invites"
        subtitle="This space is ready for future membership requests, team invitations, and organization approvals."
        icon="mail-unread-outline"
      />

      <EmptyState
        title="No pending invites yet"
        subtitle="When departments, clubs, or committees invite you into a new space, the invitation will show up here with clear accept and decline actions."
        icon="people-outline"
      />

      <InfoBanner
        message="Once invites are connected to the backend, this page can become a clean approval inbox without any structural redesign."
        tone="info"
        icon="sparkles-outline"
      />
    </ScreenShell>
  );
}
