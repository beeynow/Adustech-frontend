import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, useColorScheme, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { channelsAPI } from '../services/channelsApi';
import { departmentsAPI, Department } from '../services/departmentsApi';
import { useAuth } from '../context/AuthContext';
import { Picker } from '@react-native-picker/picker';
import { showToast } from '../utils/toast';

export default function CreateChannelScreen() {
  const { user } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (selectedDept) {
      const dept = departments.find(d => d.id === selectedDept);
      setAvailableLevels(dept?.levels || []);
      setSelectedLevel(''); // Reset level when department changes
    } else {
      setAvailableLevels([]);
      setSelectedLevel('');
    }
  }, [selectedDept, departments]);

  const loadDepartments = async () => {
    try {
      const data = await departmentsAPI.list({ isActive: true });
      setDepartments(data.departments || []);
    } catch (error) {
      console.error('Failed to load departments:', error);
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
        name, 
        description: desc,
        visibility,
      };
      
      // Add department and level if selected
      if (selectedDept) {
        payload.departmentId = selectedDept;
        if (selectedLevel) {
          payload.level = selectedLevel;
        }
      }
      
      const res = await channelsAPI.create(payload);
      setSubmitting(false);
      
      // Reset form
      setName(''); 
      setDesc('');
      setSelectedDept('');
      setSelectedLevel('');
      setVisibility('public');
      
      showToast.success(res?.message || 'Channel created successfully! 🎉', 'Success');
      try { require('expo-router').router.replace('/channels-list'); } catch {}
    } catch (e: any) {
      setSubmitting(false);
      showToast.error(e?.response?.data?.message || 'Failed to create channel', 'Error');
    }
  };

  const bg = isDark ? '#0A1929' : '#E6F4FE';
  const card = isDark ? '#0F213A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#0A1929';
  const muted = isDark ? '#90CAF9' : '#607D8B';
  const border = isDark ? 'rgba(66,165,245,0.25)' : 'rgba(25,118,210,0.15)';
  const pickerBg = isDark ? '#1E3A5F' : '#F5F5F5';

  if (!user || (user.role !== 'power' && user.role !== 'admin' && user.role !== 'd-admin')) {
    return (
      <View style={[styles.container, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }]}> 
        <Ionicons name="lock-closed-outline" size={48} color={muted} style={{ opacity: 0.5, marginBottom: 12 }} />
        <Text style={{ color: textPrimary, fontWeight: '800', fontSize: 16, textAlign: 'center', paddingHorizontal: 20 }}>
          Only admins can create channels.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]} contentContainerStyle={{ padding: 16 }}>
      <View style={[styles.card, { backgroundColor: card, borderColor: border }]}> 
        <Text style={[styles.title, { color: textPrimary }]}>Create Channel</Text>
        <Text style={{ color: muted, marginBottom: 16 }}>Create a space for specific topics or groups.</Text>

        <Text style={[styles.label, { color: textPrimary }]}>Channel Name</Text>
        <View style={[styles.inputWrap, { borderColor: border }]}>
          <Ionicons name="chatbubbles-outline" size={18} color={muted} />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g., CSC 201 Study Group"
            placeholderTextColor={muted}
            style={[styles.input, { color: textPrimary }]}
          />
        </View>

        <Text style={[styles.label, { color: textPrimary }]}>Description</Text>
        <View style={[styles.textAreaWrap, { borderColor: border }]}>
          <TextInput
            value={desc}
            onChangeText={setDesc}
            placeholder="Short description (optional)"
            placeholderTextColor={muted}
            style={[styles.textArea, { color: textPrimary }]}
            multiline
          />
        </View>

        <Text style={[styles.label, { color: textPrimary }]}>Visibility</Text>
        <View style={[styles.pickerWrap, { borderColor: border, backgroundColor: pickerBg }]}>
          <Picker
            selectedValue={visibility}
            onValueChange={(value) => setVisibility(value as 'public' | 'private')}
            style={{ color: textPrimary }}
          >
            <Picker.Item label="Public - Anyone can join" value="public" />
            <Picker.Item label="Private - Invite only" value="private" />
          </Picker>
        </View>

        <Text style={[styles.label, { color: textPrimary }]}>Department (Optional)</Text>
        <View style={[styles.pickerWrap, { borderColor: border, backgroundColor: pickerBg }]}>
          <Picker
            selectedValue={selectedDept}
            onValueChange={(value) => setSelectedDept(value)}
            style={{ color: textPrimary }}
          >
            <Picker.Item label="None - General Channel" value="" />
            {departments.map(dept => (
              <Picker.Item key={dept.id} label={dept.name} value={dept.id} />
            ))}
          </Picker>
        </View>

        {selectedDept && availableLevels.length > 0 && (
          <>
            <Text style={[styles.label, { color: textPrimary }]}>Level (Optional)</Text>
            <View style={[styles.pickerWrap, { borderColor: border, backgroundColor: pickerBg }]}>
              <Picker
                selectedValue={selectedLevel}
                onValueChange={(value) => setSelectedLevel(value)}
                style={{ color: textPrimary }}
              >
                <Picker.Item label="All Levels" value="" />
                {availableLevels.map(level => (
                  <Picker.Item key={level} label={`Level ${level}`} value={level} />
                ))}
              </Picker>
            </View>
          </>
        )}

        <View style={[styles.infoBox, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD', borderColor: border }]}>
          <Ionicons name="information-circle-outline" size={18} color={isDark ? '#64B5F6' : '#1976D2'} />
          <Text style={[styles.infoText, { color: isDark ? '#90CAF9' : '#1976D2' }]}>
            {selectedDept 
              ? selectedLevel 
                ? `Only ${selectedLevel} level students in the selected department will see this channel.`
                : 'All students in the selected department will see this channel.'
              : 'This channel will be visible to everyone.'}
          </Text>
        </View>

        <TouchableOpacity disabled={submitting} style={[styles.submitBtn, { opacity: submitting ? 0.6 : 1 }]} onPress={submit}>
          <Ionicons name="save-outline" size={18} color="#FFFFFF" />
          <Text style={styles.submitText}>{submitting ? 'Creating...' : 'Create Channel'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { 
    borderRadius: 16, 
    borderWidth: 1, 
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 8 },
  inputWrap: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    borderWidth: 1, 
    borderRadius: 12, 
    paddingHorizontal: 10, 
    height: 44, 
    marginBottom: 12 
  },
  input: { flex: 1 },
  textAreaWrap: { 
    borderWidth: 1, 
    borderRadius: 12, 
    padding: 10, 
    minHeight: 100, 
    marginBottom: 12 
  },
  textArea: { flex: 1, minHeight: 80, textAlignVertical: 'top' },
  pickerWrap: { 
    borderWidth: 1, 
    borderRadius: 12, 
    marginBottom: 12,
    overflow: 'hidden'
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  submitBtn: { 
    marginTop: 8, 
    backgroundColor: '#1976D2', 
    height: 48, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    flexDirection: 'row', 
    gap: 8 
  },
  submitText: { color: '#FFFFFF', fontWeight: '800' },
});
