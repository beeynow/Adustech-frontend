import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { channelsAPI } from '@/services/channelsApi';
import { departmentsAPI, type Department } from '@/services/departmentsApi';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/utils/toast';
import {
  ActionButton,
  EmptyState,
  HeroCard,
  InfoBanner,
  InputField,
  LoadingState,
  ScreenShell,
  SectionHeading,
  SurfaceCard,
} from '@/components/ui/AppChrome';
import { useAppTheme } from '@/utils/theme';

export default function CreateChannelScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useAppTheme();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);

  const canCreate = !!user && ['power', 'admin', 'd-admin'].includes(user.role || '');

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (selectedDept) {
      const department = departments.find((item) => item.id === selectedDept);
      setAvailableLevels(department?.levels || []);
      setSelectedLevel('');
      return;
    }

    setAvailableLevels([]);
    setSelectedLevel('');
  }, [selectedDept, departments]);

  const loadDepartments = async () => {
    try {
      setDepartmentsLoading(true);
      const data = await departmentsAPI.list({ isActive: true });
      setDepartments(data.departments || []);
    } catch {
      showToast.error('Failed to load departments.');
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const submit = async () => {
    if (!name.trim()) {
      showToast.error('Please enter a channel name', 'Name Required');
      return;
    }

    try {
      setSubmitting(true);

      const payload: any = {
        name: name.trim(),
        description: desc.trim() || undefined,
        visibility,
      };

      if (selectedDept) {
        payload.departmentId = selectedDept;
        if (selectedLevel) {
          payload.level = selectedLevel;
        }
      }

      const res = await channelsAPI.create(payload);
      showToast.success(res?.message || 'Channel created successfully.');
      router.replace('/channels-list');
    } catch (error: any) {
      showToast.error(error?.response?.data?.message || 'Failed to create channel', 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canCreate) {
    return (
      <ScreenShell>
        <EmptyState
          title="Only admins can create channels"
          subtitle="Ask an admin for elevated access if you need to open a new discussion space."
          icon="lock-closed-outline"
        />
      </ScreenShell>
    );
  }

  if (departmentsLoading) {
    return (
      <ScreenShell>
        <LoadingState label="Preparing channel options…" />
      </ScreenShell>
    );
  }

  const visibilitySummary = selectedDept
    ? selectedLevel
      ? `Only Level ${selectedLevel} students in the selected department will see this channel.`
      : 'All students in the selected department will see this channel.'
    : 'This channel will be visible across the broader community.';

  return (
    <ScreenShell scroll keyboard>
      <HeroCard
        eyebrow="Create Channel"
        title="Launch a cleaner communication space"
        subtitle="Set the audience, visibility, and academic scope so students land in the right room from the start."
        icon="add-circle-outline"
      />

      <SectionHeading
        title="Channel Details"
        subtitle="Fill in the essentials, then choose who should have access."
      />

      <SurfaceCard>
        <View style={{ gap: 14 }}>
          <View>
            <Text style={{ color: theme.textSoft, marginBottom: 8, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Channel Name
            </Text>
            <InputField
              icon="chatbubbles-outline"
              value={name}
              onChangeText={setName}
              placeholder="e.g. CSC 201 Study Group"
              editable={!submitting}
            />
          </View>

          <View>
            <Text style={{ color: theme.textSoft, marginBottom: 8, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Description
            </Text>
            <InputField
              multiline
              icon="document-text-outline"
              value={desc}
              onChangeText={setDesc}
              placeholder="What should members expect in this room?"
              editable={!submitting}
            />
          </View>

          <View>
            <Text style={{ color: theme.textSoft, marginBottom: 8, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Visibility
            </Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 18,
                overflow: 'hidden',
                backgroundColor: theme.input,
              }}
            >
              <Picker
                selectedValue={visibility}
                onValueChange={(value) => setVisibility(value as 'public' | 'private')}
                style={{ color: theme.text }}
              >
                <Picker.Item label="Public - anyone can join" value="public" />
                <Picker.Item label="Private - invite only" value="private" />
              </Picker>
            </View>
          </View>

          <View>
            <Text style={{ color: theme.textSoft, marginBottom: 8, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Department Scope
            </Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 18,
                overflow: 'hidden',
                backgroundColor: theme.input,
              }}
            >
              <Picker
                selectedValue={selectedDept}
                onValueChange={(value) => setSelectedDept(value)}
                style={{ color: theme.text }}
              >
                <Picker.Item label="None - general channel" value="" />
                {departments.map((department) => (
                  <Picker.Item key={department.id} label={department.name} value={department.id} />
                ))}
              </Picker>
            </View>
          </View>

          {selectedDept && availableLevels.length > 0 ? (
            <View>
              <Text style={{ color: theme.textSoft, marginBottom: 8, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Level Scope
              </Text>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 18,
                  overflow: 'hidden',
                  backgroundColor: theme.input,
                }}
              >
                <Picker
                  selectedValue={selectedLevel}
                  onValueChange={(value) => setSelectedLevel(value)}
                  style={{ color: theme.text }}
                >
                  <Picker.Item label="All levels" value="" />
                  {availableLevels.map((level) => (
                    <Picker.Item key={level} label={`Level ${level}`} value={level} />
                  ))}
                </Picker>
              </View>
            </View>
          ) : null}
        </View>
      </SurfaceCard>

      <InfoBanner
        message={visibilitySummary}
        tone="info"
        icon="information-circle-outline"
      />

      <ActionButton
        label={submitting ? 'Creating Channel…' : 'Create Channel'}
        icon={submitting ? undefined : 'sparkles-outline'}
        onPress={submit}
        disabled={submitting}
      />
    </ScreenShell>
  );
}
