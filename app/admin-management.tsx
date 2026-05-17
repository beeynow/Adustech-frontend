import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/services/api';
import { showToast } from '@/utils/toast';
import {
  ActionButton,
  Chip,
  EmptyState,
  HeroCard,
  LoadingState,
  ScreenShell,
  SectionHeading,
  SurfaceCard,
} from '@/components/ui/AppChrome';
import { useAppTheme } from '@/utils/theme';

interface AdminItem {
  id: string;
  name: string;
  email: string;
  role: 'power' | 'admin' | 'd-admin';
  status?: 'active' | 'pending';
  allowlisted?: boolean;
  managedDepartment?: {
    id: string;
    name: string;
  } | null;
  createdAt?: string;
}

export default function AdminManagementScreen() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<AdminItem[]>([]);

  const load = async () => {
    setLoading(true);
    const res = await authAPI.listAdmins();
    if (res.success) {
      setAdmins(res.data.admins || []);
    } else {
      showToast.error(res.message || 'Failed to load admin accounts.');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const confirmDemote = (email: string, role: string) => {
    if (role === 'power') {
      Alert.alert('Not allowed', 'Cannot demote the primary power admin.');
      return;
    }

    const actionLabel = role === 'pending' ? 'Remove Admin Email' : 'Demote Admin';
    const actionMessage = role === 'pending'
      ? `Remove ${email} from the admin allowlist?`
      : `Are you sure you want to demote ${email} to user?`;

    Alert.alert(actionLabel, actionMessage, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: role === 'pending' ? 'Remove' : 'Demote',
        style: 'destructive',
        onPress: async () => {
          const res = await authAPI.demoteAdmin(email);
          if (res.success) {
            showToast.success(res.data.message || 'Admin demoted.');
            load();
          } else {
            showToast.error(res.message || 'Failed to demote admin.');
          }
        },
      },
    ]);
  };

  if (user?.role !== 'power') {
    return (
      <ScreenShell>
        <EmptyState
          title="Restricted workspace"
          subtitle="Only the power admin can manage university admin accounts from this page."
          icon="shield-outline"
        />
      </ScreenShell>
    );
  }

  if (loading) {
    return (
      <ScreenShell>
        <LoadingState label="Loading admin accounts…" />
      </ScreenShell>
    );
  }

  const departmentAdmins = admins.filter((admin) => admin.role === 'd-admin').length;

  return (
    <ScreenShell scroll>
      <HeroCard
        eyebrow="Admin Management"
        title="Control elevated access with clarity"
        subtitle="Review active admin accounts, department ownership, and role coverage from one sharper dashboard."
        icon="shield-checkmark-outline"
        actions={(
          <View style={{ width: 118 }}>
            <ActionButton label="Create" icon="add" onPress={() => router.push('/create-admin')} />
          </View>
        )}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Chip label={`${admins.filter((admin) => admin.status !== 'pending').length} active admins`} icon="people-outline" tone="accent" />
          <Chip label={`${admins.filter((admin) => admin.status === 'pending').length} pending emails`} icon="mail-unread-outline" tone="neutral" />
          <Chip label={`${departmentAdmins} department admins`} icon="business-outline" tone="success" />
          <Chip label="Power-only controls" icon="lock-closed-outline" tone="warning" />
        </View>
      </HeroCard>

      <SectionHeading
        title="Current Roles"
        subtitle="Use refresh to pull the latest assignments before making any role changes."
        action={<ActionButton label="Refresh" icon="refresh" variant="ghost" onPress={load} />}
      />

      {admins.length === 0 ? (
        <EmptyState
          title="No admin accounts found"
          subtitle="Create the first admin account to delegate operational responsibilities across the platform."
          icon="person-add-outline"
        />
      ) : (
        <View style={{ gap: 12 }}>
          {admins.map((admin) => {
            const roleTone: 'accent' | 'success' | 'warning' | 'danger' | 'neutral' = admin.role === 'power'
              ? 'warning'
              : admin.role === 'd-admin'
                ? 'success'
                : 'accent';
            return (
              <SurfaceCard key={admin.id}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.accentSoft,
                    }}
                  >
                    <Text style={{ color: theme.accent, fontSize: 20, fontWeight: '900' }}>
                      {admin.name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                      <Chip label={admin.status === 'pending' ? 'pending admin email' : admin.role} icon="ribbon-outline" tone={admin.status === 'pending' ? 'neutral' : roleTone} />
                      {admin.allowlisted && admin.status !== 'pending' ? (
                        <Chip label="allowlisted" icon="mail-outline" tone="success" />
                      ) : null}
                      {admin.managedDepartment?.name ? (
                        <Chip label={admin.managedDepartment.name} icon="business-outline" tone="neutral" />
                      ) : null}
                    </View>

                    <Text style={{ color: theme.text, fontSize: 17, fontWeight: '900' }}>
                      {admin.status === 'pending' ? 'Awaiting user registration' : admin.name}
                    </Text>
                    <Text style={{ color: theme.textMuted, marginTop: 4 }}>{admin.email}</Text>
                    {admin.createdAt ? (
                      <Text style={{ color: theme.textSoft, marginTop: 10, fontSize: 12, fontWeight: '700' }}>
                        Added {new Date(admin.createdAt).toLocaleDateString()}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {admin.role !== 'power' ? (
                  <ActionButton
                    label={admin.status === 'pending' ? 'Remove email' : 'Demote to user'}
                    icon={admin.status === 'pending' ? 'trash-outline' : 'arrow-down-circle-outline'}
                    variant="secondary"
                    onPress={() => confirmDemote(admin.email, admin.status === 'pending' ? 'pending' : admin.role)}
                    style={{ marginTop: 16 }}
                  />
                ) : (
                  <View style={{ marginTop: 16 }}>
                    <Chip label="Protected role" icon="shield-checkmark-outline" tone="warning" />
                  </View>
                )}
              </SurfaceCard>
            );
          })}
        </View>
      )}
    </ScreenShell>
  );
}
