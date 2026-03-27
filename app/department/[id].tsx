import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import IntegratedChannelRoom from '@/components/channels/IntegratedChannelRoom';
import integratedChannelsApi from '@/services/integratedChannelsApi';
import { departmentsAPI, Department } from '@/services/departmentsApi';
import { showToast } from '@/utils/toast';

export default function DepartmentChannelScreen() {
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
    <View style={styles.container}>
      {department?.levelRecords?.length ? (
        <View style={styles.levelStrip}>
          <Text style={styles.levelStripTitle}>Department Levels</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levelChips}>
            {department.levelRecords.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={styles.levelChip}
                onPress={() => router.push(`/level-channel/${level.id}`)}
              >
                <Text style={styles.levelChipText}>{level.displayName}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  levelStrip: {
    backgroundColor: '#FFFFFF',
    paddingTop: 52,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  levelStripTitle: {
    paddingHorizontal: 18,
    marginBottom: 10,
    fontSize: 15,
    fontWeight: '800',
    color: '#10213A',
  },
  levelChips: {
    paddingHorizontal: 18,
    gap: 10,
  },
  levelChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#E8F0FF',
  },
  levelChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1452CC',
  },
});
