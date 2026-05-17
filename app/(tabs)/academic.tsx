import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { academicApi } from '@/services/academicApi';
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
import { showToast } from '@/utils/toast';

export default function AcademicPage() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [faculty, setFaculty] = useState<any>(null);
  const [department, setDepartment] = useState<any>(null);
  const [levels, setLevels] = useState<any[]>([]);
  const [userLevel, setUserLevel] = useState<any>(null);

  useEffect(() => {
    loadAcademicStructure();
  }, []);

  const loadAcademicStructure = async () => {
    try {
      setLoading(true);
      const contextData = await academicApi.getUserAcademicContext();
      const academicContext = contextData?.context || {};

      setFaculty(academicContext.faculty || null);
      setDepartment(academicContext.department || null);
      setUserLevel(academicContext.level || null);

      if (academicContext.department?.id) {
        const levelsData = await academicApi.getDepartmentLevels(academicContext.department.id);
        setLevels(levelsData.levels || []);
      } else {
        setLevels([]);
      }
    } catch {
      showToast.error('Unable to load your academic structure right now.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ScreenShell>
        <LoadingState label="Loading academic structure…" />
      </ScreenShell>
    );
  }

  const canCreate = ['admin', 'power', 'd-admin'].includes(user?.role || '');

  return (
    <ScreenShell scroll>
      <HeroCard
        eyebrow="Academic Board"
        title="Navigate your academic spaces faster"
        subtitle="University-wide updates, faculty rooms, department announcements, and level channels now sit behind a simpler modern hub."
        icon="school-outline"
        actions={(
          <View style={{ width: 114 }}>
            <ActionButton label="Refresh" icon="refresh" variant="secondary" onPress={loadAcademicStructure} />
          </View>
        )}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {faculty ? <Chip label={faculty.code || faculty.name} icon="school-outline" tone="success" /> : null}
          {department ? <Chip label={department.code || department.name} icon="business-outline" tone="accent" /> : null}
          {userLevel ? <Chip label={userLevel.displayName || `Level ${userLevel.levelNumber}`} icon="layers-outline" tone="warning" /> : null}
        </View>
      </HeroCard>

      <SectionHeading
        title="Academic Spaces"
        subtitle="Open the room that matches the scope of the update you want to read."
      />

      <View style={{ gap: 12 }}>
        <Pressable onPress={() => router.push('/(tabs)/home' as any)}>
          <SurfaceCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
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
                <Ionicons name="globe-outline" size={22} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 17, fontWeight: '900' }}>University Updates</Text>
                <Text style={{ color: theme.textMuted, marginTop: 6, lineHeight: 21 }}>
                  Read the broadest notices and campus-wide announcements in the main feed.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSoft} />
            </View>
          </SurfaceCard>
        </Pressable>

        {faculty ? (
          <Pressable onPress={() => router.push(`/faculty-channel/${faculty.id}`)}>
            <SurfaceCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.successSoft,
                  }}
                >
                  <Ionicons name="school-outline" size={22} color={theme.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 17, fontWeight: '900' }}>{faculty.name}</Text>
                  <Text style={{ color: theme.textMuted, marginTop: 6, lineHeight: 21 }}>
                    Faculty-specific updates curated by the faculty administration.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textSoft} />
              </View>
            </SurfaceCard>
          </Pressable>
        ) : null}

        {department ? (
          <Pressable onPress={() => router.push(`/department/${department.id}`)}>
            <SurfaceCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.warningSoft,
                  }}
                >
                  <Ionicons name="business-outline" size={22} color={theme.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 17, fontWeight: '900' }}>{department.name}</Text>
                  <Text style={{ color: theme.textMuted, marginTop: 6, lineHeight: 21 }}>
                    Department-wide messages, updates, and announcements from assigned admins.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textSoft} />
              </View>
            </SurfaceCard>
          </Pressable>
        ) : null}
      </View>

      <SectionHeading
        title="Level Rooms"
        subtitle="Jump straight into the level that matters for your current academic journey."
      />

      {levels.length === 0 ? (
        <EmptyState
          title="No department levels available"
          subtitle="Your level spaces will appear here once the department structure is available in your profile."
          icon="layers-outline"
        />
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {levels.map((level) => {
            const isUserLevel = level.id === userLevel?.id;
            return (
              <Pressable key={level.id} style={{ width: '47.5%' }} onPress={() => router.push(`/level-channel/${level.id}`)}>
                <SurfaceCard style={{ minHeight: 176, justifyContent: 'space-between' }}>
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isUserLevel ? theme.accentSoft : theme.surfaceMuted,
                    }}
                  >
                    <Ionicons
                      name={isUserLevel ? 'bookmark' : 'book-outline'}
                      size={22}
                      color={isUserLevel ? theme.accent : theme.textMuted}
                    />
                  </View>

                  <View>
                    <Text style={{ color: theme.text, fontSize: 22, fontWeight: '900' }}>{level.levelNumber}</Text>
                    <Text style={{ color: theme.textMuted, marginTop: 6, lineHeight: 20 }}>
                      {level.displayName}
                    </Text>
                  </View>

                  {isUserLevel ? (
                    <Chip label="Your level" icon="checkmark-circle-outline" tone="accent" />
                  ) : (
                    <Chip label="Open room" icon="arrow-forward" tone="neutral" />
                  )}
                </SurfaceCard>
              </Pressable>
            );
          })}
        </View>
      )}

      {canCreate ? (
        <ActionButton
          label="Create Campus Post"
          icon="add-circle-outline"
          onPress={() => router.push('/(tabs)/upload' as any)}
        />
      ) : null}
    </ScreenShell>
  );
}
