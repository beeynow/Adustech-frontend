import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import IntegratedChannelRoom from '@/components/channels/IntegratedChannelRoom';
import integratedChannelsApi from '@/services/integratedChannelsApi';
import { departmentsAPI, type Department } from '@/services/departmentsApi';
import { showToast } from '@/utils/toast';
import { useAppTheme } from '@/utils/theme';

export default function DepartmentChannelScreen() {
  const theme = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [department, setDepartment] = useState<Department | null>(null);

  useEffect(() => {
    const loadDepartment = async () => {
      try {
        const response = await departmentsAPI.get(String(id));
        setDepartment(response.department || null);
      } catch (error: any) {
        showToast.error(error?.message || 'Failed to load department information.');
      }
    };

    loadDepartment();
  }, [id]);

  const resolveChannel = useCallback(async () => {
    const response = await integratedChannelsApi.getDepartmentRoom(String(id));
    return response.channel;
  }, [id]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {department?.levelRecords?.length ? (
        <View
          style={{
            paddingTop: 50,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
            backgroundColor: theme.backgroundMuted,
          }}
        >
          <View style={{ paddingHorizontal: 18 }}>
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '900' }}>Department Levels</Text>
            <Text style={{ color: theme.textMuted, marginTop: 4, marginBottom: 12, lineHeight: 20 }}>
              Switch directly into a level-specific room when you need narrower announcements.
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, gap: 10 }}>
            {department.levelRecords.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                }}
                onPress={() => router.push(`/level-channel/${level.id}`)}
              >
                <Ionicons name="layers-outline" size={16} color={theme.accent} />
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: '800' }}>{level.displayName}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <IntegratedChannelRoom
        resolveChannel={resolveChannel}
        emptyStateTitle="Department announcement room is ready"
        readOnlyMessage="This room is for department-wide announcements only. Only the 2 assigned admins of this department can post."
      />
    </View>
  );
}
