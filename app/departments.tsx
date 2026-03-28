import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { departmentsAPI, type Department } from '@/services/departmentsApi';
import {
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

export default function DepartmentsScreen() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const theme = useAppTheme();

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const data = await departmentsAPI.list({ isActive: true });
      setDepartments(data.departments || []);
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ScreenShell>
        <LoadingState label="Loading department channels…" />
      </ScreenShell>
    );
  }

  const totalLevels = departments.reduce((sum, department) => sum + (department.levels?.length || 0), 0);

  return (
    <ScreenShell scroll>
      <HeroCard
        eyebrow="Departments"
        title="Academic spaces organized clearly"
        subtitle="Browse department channels with a more modern view of codes, faculty context, and available levels."
        icon="school-outline"
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Chip label={`${departments.length} departments`} icon="business-outline" tone="accent" />
          <Chip label={`${totalLevels} level groups`} icon="layers-outline" tone="success" />
        </View>
      </HeroCard>

      <SectionHeading
        title="Department Channels"
        subtitle="Open any department to view its announcement room and level-specific spaces."
      />

      {departments.length === 0 ? (
        <EmptyState
          title="No departments available"
          subtitle="Departments will appear here once administrators publish the academic structure."
          icon="school-outline"
        />
      ) : (
        <View style={{ gap: 12 }}>
          {departments.map((department) => (
            <Pressable key={department.id} onPress={() => router.push(`/department/${department.id}`)}>
              <SurfaceCard>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                  <View
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.accentSoft,
                    }}
                  >
                    <Ionicons name="school-outline" size={24} color={theme.accent} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontSize: 17, fontWeight: '900' }}>{department.name}</Text>
                        <Text style={{ color: theme.accent, marginTop: 4, fontSize: 13, fontWeight: '800' }}>{department.code}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={theme.textSoft} />
                    </View>

                    {!!department.description ? (
                      <Text style={{ color: theme.textMuted, marginTop: 10, lineHeight: 21 }}>
                        {department.description}
                      </Text>
                    ) : null}

                    {department.faculty ? (
                      <Text style={{ color: theme.textSoft, marginTop: 8, fontSize: 13, fontWeight: '700' }}>
                        Faculty: {department.faculty}
                      </Text>
                    ) : null}

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                      {(department.levels || []).map((level) => (
                        <Chip key={level} label={`Level ${level}`} icon="layers-outline" tone="neutral" />
                      ))}
                    </View>
                  </View>
                </View>
              </SurfaceCard>
            </Pressable>
          ))}
        </View>
      )}
    </ScreenShell>
  );
}
