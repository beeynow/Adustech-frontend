import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { profileAPI, UserProfile } from '../../services/profileApi';
import { academicApi } from '../../services/academicApi';
import { useAuth } from '../../context/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { showToast } from '../../utils/toast';

type FacultyOption = {
  id: string;
  name: string;
  code?: string;
};

type DepartmentOption = {
  id: string;
  name: string;
  code?: string;
  facultyId: string;
};

type LevelOption = {
  id: string;
  levelNumber: number;
  displayName?: string;
};

export default function ProfileScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [autoSave, setAutoSave] = useState(true);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [level, setLevel] = useState('');
  const [department, setDepartment] = useState('');
  const [faculty, setFaculty] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [levelOptions, setLevelOptions] = useState<LevelOption[]>([]);
  const [academicsLoading, setAcademicsLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [levelsLoading, setLevelsLoading] = useState(false);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('');

  const [errors, setErrors] = useState<{ [k: string]: string | undefined }>({});

  const levels = useMemo(() => ['100', '200', '300', '400', '500'], []);
  const genders = useMemo(() => ['Male', 'Female', 'Other'] as const, []);

  const loadDepartments = async (facultyId: string) => {
    if (!facultyId) {
      setDepartments([]);
      return [];
    }

    try {
      setDepartmentsLoading(true);
      const response = await academicApi.getFacultyDepartments(facultyId);
      const options = (response?.departments || []) as DepartmentOption[];
      setDepartments(options);
      return options;
    } catch {
      setDepartments([]);
      showToast.error('Unable to load departments for the selected faculty.');
      return [];
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const loadLevels = async (departmentId: string) => {
    if (!departmentId) {
      setLevelOptions([]);
      return [];
    }

    try {
      setLevelsLoading(true);
      const response = await academicApi.getDepartmentLevels(departmentId);
      const options = (response?.levels || []) as LevelOption[];
      setLevelOptions(options);
      return options;
    } catch {
      setLevelOptions([]);
      showToast.error('Unable to load levels for the selected department.');
      return [];
    } finally {
      setLevelsLoading(false);
    }
  };

  const loadProfile = async () => {
    setLoading(true);

    try {
      setAcademicsLoading(true);
      const [result, facultiesResult] = await Promise.all([
        profileAPI.getProfile(),
        academicApi.getFaculties().catch(() => null),
      ]);

      const facultyOptions = (facultiesResult?.faculties || []) as FacultyOption[];
      setFaculties(facultyOptions);

      if (result.success && result.data.user) {
        const u = result.data.user as UserProfile;
        setProfile(u);
        setName(u.name || '');
        setBio(u.bio || '');
        setLevel(u.level || '');
        setDepartment(u.department || '');
        setFaculty(u.faculty || '');
        setPhone(u.phone || '');
        setGender((u.gender as any) || '');
        setDateOfBirth(u.dateOfBirth ? new Date(u.dateOfBirth as any).toISOString().slice(0, 10) : '');
        setAddress(u.address || '');
        setCountry(u.country || '');
        setProfileImage(u.profileImage || '');
        setSelectedFacultyId(u.facultyId || '');
        setSelectedDepartmentId(u.departmentId || '');
        setSelectedLevelId(u.levelId || '');

        if (u.facultyId) {
          await loadDepartments(u.facultyId);
        } else {
          setDepartments([]);
        }

        if (u.departmentId) {
          await loadLevels(u.departmentId);
        } else {
          setLevelOptions([]);
        }

        return;
      }

      showToast.error(result.message || 'Failed to load your profile.');
    } finally {
      setAcademicsLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = () => {
    const next: { [k: string]: string | undefined } = {};
    const academicSelectionChanged = selectedFacultyId !== (profile?.facultyId || '')
      || selectedDepartmentId !== (profile?.departmentId || '')
      || selectedLevelId !== (profile?.levelId || '');

    if (!name.trim()) next.name = 'Full name is required';
    if (phone && !/^\+?[0-9\-\s]{7,15}$/.test(phone)) next.phone = 'Enter a valid phone number';
    if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) next.dateOfBirth = 'Use format YYYY-MM-DD';
    if (level && !levels.includes(level)) next.level = `Level should be one of ${levels.join(', ')}`;
    if (gender && !genders.includes(gender)) next.gender = 'Gender must be Male, Female or Other';
    if (academicSelectionChanged && selectedFacultyId && departments.length > 0 && !selectedDepartmentId) {
      next.department = 'Choose a department to match the selected faculty';
    }
    if (academicSelectionChanged && selectedDepartmentId && levelOptions.length > 0 && !selectedLevelId) {
      next.level = 'Choose a level to match the selected department';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const scheduleAutoSave = () => {
    const academicSelectionChanged = selectedFacultyId !== (profile?.facultyId || '')
      || selectedDepartmentId !== (profile?.departmentId || '')
      || selectedLevelId !== (profile?.levelId || '');

    if (!autoSave || !editing || academicSelectionChanged) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      if (!validate()) return;
      await handleSave(true);
    }, 1200);
  };

  useEffect(() => {
    scheduleAutoSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, bio, level, department, faculty, phone, gender, dateOfBirth, address, country, profileImage, autoSave, editing, selectedFacultyId, selectedDepartmentId, selectedLevelId]);

  useEffect(() => () => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
  }, []);

  const pickImage = async () => {
    if (!editing) return;
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showToast.warning('Please allow access to your photos', 'Permission Required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setProfileImage(base64Image);
    }
  };

  const handleSave = async (silent = false) => {
    if (!validate()) return { success: false };
    setSaving(true);
    const result = await profileAPI.updateProfile({
      name,
      bio,
      levelId: selectedLevelId || undefined,
      level,
      departmentId: selectedDepartmentId || undefined,
      department,
      facultyId: selectedFacultyId || undefined,
      faculty,
      phone,
      gender,
      dateOfBirth: dateOfBirth || undefined,
      address,
      country,
      profileImage,
    });
    setSaving(false);

    if (result.success) {
      if (!silent) showToast.success('Your profile has been updated! ✨', 'Saved');
      if (!silent) setEditing(false);
      void loadProfile();
      return { success: true };
    }

    if (!silent) showToast.error(result.message || 'Failed to update profile', 'Error');
    return { success: false };
  };

  const handleFacultySelect = async (nextFaculty: FacultyOption) => {
    setSelectedFacultyId(nextFaculty.id);
    setFaculty(nextFaculty.name);
    setSelectedDepartmentId('');
    setDepartment('');
    setSelectedLevelId('');
    setLevel('');
    setLevelOptions([]);
    await loadDepartments(nextFaculty.id);
  };

  const handleDepartmentSelect = async (nextDepartment: DepartmentOption) => {
    const linkedFaculty = faculties.find((item) => item.id === nextDepartment.facultyId);

    setSelectedDepartmentId(nextDepartment.id);
    setDepartment(nextDepartment.name);
    setSelectedLevelId('');
    setLevel('');
    setLevelOptions([]);

    if (linkedFaculty) {
      setSelectedFacultyId(linkedFaculty.id);
      setFaculty(linkedFaculty.name);
    }

    await loadLevels(nextDepartment.id);
  };

  const handleLevelSelect = (nextLevel: LevelOption) => {
    setSelectedLevelId(nextLevel.id);
    setLevel(String(nextLevel.levelNumber));
  };

  if (loading) {
    return (
      <View style={[styles.center, styles.flex, { backgroundColor: isDark ? '#06152A' : '#EEF4FF' }]}> 
        <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#1D4ED8'} />
      </View>
    );
  }

  const headerGradient: [string, string] = isDark ? ['#06152A', '#0C2A4F'] : ['#1D4ED8', '#3B82F6'];
  const appBg = isDark ? '#06152A' : '#EEF4FF';
  const cardBg = isDark ? '#0D223D' : '#FFFFFF';
  const textPrimary = isDark ? '#ECF3FF' : '#0F172A';
  const muted = isDark ? '#9CB7D9' : '#64748B';
  const border = isDark ? '#1E3A5F' : '#DCE6F7';
  const academicSelectionChanged = selectedFacultyId !== (profile?.facultyId || '')
    || selectedDepartmentId !== (profile?.departmentId || '')
    || selectedLevelId !== (profile?.levelId || '');

  const completionFields = [name, bio, level, department, faculty, phone, gender, dateOfBirth, address, country, profileImage];
  const completion = Math.round((completionFields.filter((v) => (v || '').toString().trim().length > 0).length / completionFields.length) * 100);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: appBg }} contentContainerStyle={{ paddingBottom: 110 }} >
      <LinearGradient colors={headerGradient} style={styles.heroWrap}>
        <View style={styles.heroTopRow}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.85}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>{(name || profile?.name || '?').charAt(0).toUpperCase()}</Text>
              </View>
            )}
            {editing ? (
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={15} color="#FFFFFF" />
              </View>
            ) : null}
          </TouchableOpacity>

          <View style={styles.heroInfo}>
            <Text style={styles.displayName} numberOfLines={1}>{name || profile?.name || 'Student'}</Text>
            <Text style={styles.emailText} numberOfLines={1}>{profile?.email}</Text>
            <View style={styles.badgesRow}>
              <View style={styles.heroBadge}>
                <Ionicons name="school-outline" size={13} color="#E6F0FF" />
                <Text style={styles.heroBadgeText}>{department || 'Department not set'}</Text>
              </View>
              <View style={styles.heroBadge}>
                <Ionicons name="ribbon-outline" size={13} color="#E6F0FF" />
                <Text style={styles.heroBadgeText}>{user?.role || 'user'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.heroActions}>
            <TouchableOpacity
              onPress={() => router.push('/settings' as never)}
              style={styles.settingsIconButton}
              activeOpacity={0.85}
            >
              <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (editing) {
                  if (autoSaveTimer.current) {
                    clearTimeout(autoSaveTimer.current);
                  }
                  setEditing(false);
                  void loadProfile();
                  return;
                }

                setEditing(true);
              }}
              style={styles.editToggle}
            >
              <Ionicons name={editing ? 'close' : 'create-outline'} size={17} color="#FFFFFF" />
              <Text style={styles.editToggleText}>{editing ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.completionWrap}>
          <View style={styles.completionHeader}>
            <Text style={styles.completionLabel}>Profile Completion</Text>
            <Text style={styles.completionPercent}>{completion}%</Text>
          </View>
          <View style={styles.completionTrack}>
            <View style={[styles.completionFill, { width: `${completion}%` }]} />
          </View>
        </View>

        {editing ? (
          <View style={styles.autoRow}>
            <Text style={styles.autoRowLabel}>Auto-save</Text>
            <TouchableOpacity onPress={() => setAutoSave((v) => !v)} style={[styles.toggle, autoSave && styles.toggleOn]}>
              <View style={[styles.knob, autoSave && styles.knobOn]} />
            </TouchableOpacity>
          </View>
        ) : null}
        {editing && academicSelectionChanged ? (
          <Text style={styles.editingHint}>Academic changes wait for manual save so your selections stay in sync.</Text>
        ) : null}
      </LinearGradient>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: border }]}>
          <Ionicons name="business-outline" size={18} color={isDark ? '#93C5FD' : '#2563EB'} />
          <Text style={[styles.statLabel, { color: muted }]}>Faculty</Text>
          <Text style={[styles.statValue, { color: textPrimary }]} numberOfLines={1}>{faculty || 'Not set'}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: border }]}>
          <Ionicons name="layers-outline" size={18} color={isDark ? '#93C5FD' : '#2563EB'} />
          <Text style={[styles.statLabel, { color: muted }]}>Level</Text>
          <Text style={[styles.statValue, { color: textPrimary }]} numberOfLines={1}>{level || 'Not set'}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: border }]}>
          <Ionicons name="globe-outline" size={18} color={isDark ? '#93C5FD' : '#2563EB'} />
          <Text style={[styles.statLabel, { color: muted }]}>Country</Text>
          <Text style={[styles.statValue, { color: textPrimary }]} numberOfLines={1}>{country || 'Not set'}</Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}> 
        <Text style={[styles.cardTitle, { color: textPrimary }]}>Academic Identity</Text>
        <Text style={[styles.cardSubtitle, { color: muted }]}>Your official university profile details</Text>
        {editing ? (
          <Text style={[styles.selectorHint, { color: muted }]}>Choose from the live faculty, department, and level records so profile saves stay valid.</Text>
        ) : null}

        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, { color: muted }]}>Full Name</Text>
          <TextInput style={[styles.input, { color: textPrimary, borderColor: border }]} value={name} onChangeText={setName} editable={editing} placeholder="Full name" placeholderTextColor={muted} />
          {!!errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, { color: muted }]}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea, { color: textPrimary, borderColor: border }]}
            value={bio}
            onChangeText={setBio}
            editable={editing}
            placeholder="Brief academic intro"
            placeholderTextColor={muted}
            multiline
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, { color: muted }]}>Faculty</Text>
          {editing ? (
            <View style={[styles.selectorPanel, { borderColor: border, backgroundColor: isDark ? '#0A1B2F' : '#F8FAFC' }]}>
              {academicsLoading ? (
                <ActivityIndicator color={isDark ? '#60A5FA' : '#1D4ED8'} />
              ) : faculties.length ? (
                <View style={styles.chipsRow}>
                  {faculties.map((item) => {
                    const active = selectedFacultyId === item.id;
                    return (
                      <TouchableOpacity key={item.id} onPress={() => void handleFacultySelect(item)} style={[styles.chip, active && styles.chipActive]}>
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.code || item.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <Text style={[styles.selectorEmpty, { color: muted }]}>No active faculties available right now.</Text>
              )}
              <Text style={[styles.selectorValue, { color: faculty ? textPrimary : muted }]}>{faculty || 'No faculty selected'}</Text>
            </View>
          ) : (
            <View style={[styles.input, { borderColor: border, justifyContent: 'center' }]}>
              <Text style={{ color: faculty ? textPrimary : muted }}>{faculty || 'Not set'}</Text>
            </View>
          )}
        </View>

        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, { color: muted }]}>Department</Text>
          {editing ? (
            <View style={[styles.selectorPanel, { borderColor: border, backgroundColor: isDark ? '#0A1B2F' : '#F8FAFC' }]}>
              {departmentsLoading ? (
                <ActivityIndicator color={isDark ? '#60A5FA' : '#1D4ED8'} />
              ) : departments.length ? (
                <View style={styles.chipsRow}>
                  {departments.map((item) => {
                    const active = selectedDepartmentId === item.id;
                    return (
                      <TouchableOpacity key={item.id} onPress={() => void handleDepartmentSelect(item)} style={[styles.chip, active && styles.chipActive]}>
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.code || item.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <Text style={[styles.selectorEmpty, { color: muted }]}>
                  {selectedFacultyId ? 'No departments found for this faculty yet.' : 'Select a faculty first.'}
                </Text>
              )}
              <Text style={[styles.selectorValue, { color: department ? textPrimary : muted }]}>{department || 'No department selected'}</Text>
            </View>
          ) : (
            <View style={[styles.input, { borderColor: border, justifyContent: 'center' }]}>
              <Text style={{ color: department ? textPrimary : muted }}>{department || 'Not set'}</Text>
            </View>
          )}
          {!!errors.department && <Text style={styles.errorText}>{errors.department}</Text>}
        </View>

        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, { color: muted }]}>Level</Text>
          {editing ? (
            <View style={[styles.selectorPanel, { borderColor: border, backgroundColor: isDark ? '#0A1B2F' : '#F8FAFC' }]}>
              {levelsLoading ? (
                <ActivityIndicator color={isDark ? '#60A5FA' : '#1D4ED8'} />
              ) : levelOptions.length ? (
                <View style={styles.chipsRow}>
                  {levelOptions.map((item) => {
                    const active = selectedLevelId === item.id;
                    const label = item.displayName || String(item.levelNumber);
                    return (
                      <TouchableOpacity key={item.id} onPress={() => handleLevelSelect(item)} style={[styles.chip, active && styles.chipActive]}>
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <Text style={[styles.selectorEmpty, { color: muted }]}>
                  {selectedDepartmentId ? 'No active levels found for this department.' : 'Select a department first.'}
                </Text>
              )}
              <Text style={[styles.selectorValue, { color: level ? textPrimary : muted }]}>{level || 'No level selected'}</Text>
            </View>
          ) : (
            <View style={[styles.input, { borderColor: border, justifyContent: 'center' }]}>
              <Text style={{ color: level ? textPrimary : muted }}>{level || 'Not set'}</Text>
            </View>
          )}
          {!!errors.level && <Text style={styles.errorText}>{errors.level}</Text>}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}> 
        <Text style={[styles.cardTitle, { color: textPrimary }]}>Contact and Personal</Text>
        <Text style={[styles.cardSubtitle, { color: muted }]}>Used for campus communication and identification</Text>

        <View style={styles.row2}>
          <View style={styles.col}>
            <Text style={[styles.fieldLabel, { color: muted }]}>Phone</Text>
            <TextInput style={[styles.input, { color: textPrimary, borderColor: border }]} value={phone} onChangeText={setPhone} editable={editing} placeholder="Phone" placeholderTextColor={muted} keyboardType="phone-pad" />
            {!!errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>
          <View style={styles.col}>
            <Text style={[styles.fieldLabel, { color: muted }]}>Date of Birth</Text>
            <TextInput style={[styles.input, { color: textPrimary, borderColor: border }]} value={dateOfBirth} onChangeText={setDateOfBirth} editable={editing} placeholder="YYYY-MM-DD" placeholderTextColor={muted} />
            {!!errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, { color: muted }]}>Email</Text>
          <View style={[styles.input, { borderColor: border, justifyContent: 'center', backgroundColor: isDark ? '#0A1B2F' : '#F8FAFC' }]}>
            <Text style={{ color: muted }}>{profile?.email}</Text>
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, { color: muted }]}>Gender</Text>
          {editing ? (
            <View style={styles.chipsRow}>
              {genders.map((g) => {
                const active = gender === g;
                return (
                  <TouchableOpacity key={g} onPress={() => setGender(g)} style={[styles.chip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{g}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={[styles.input, { borderColor: border, justifyContent: 'center' }]}>
              <Text style={{ color: gender ? textPrimary : muted }}>{gender || 'Not set'}</Text>
            </View>
          )}
          {!!errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
        </View>

        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, { color: muted }]}>Address</Text>
          <TextInput style={[styles.input, { color: textPrimary, borderColor: border }]} value={address} onChangeText={setAddress} editable={editing} placeholder="Address" placeholderTextColor={muted} />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, { color: muted }]}>Country</Text>
          <TextInput style={[styles.input, { color: textPrimary, borderColor: border }]} value={country} onChangeText={setCountry} editable={editing} placeholder="Country" placeholderTextColor={muted} />
        </View>
      </View>

      <View style={styles.actionsWrap}>
        {editing ? (
          <View style={styles.inlineRow}>
            <TouchableOpacity
              style={[styles.button, styles.btnOutline, { borderColor: isDark ? '#F87171' : '#DC2626' }]}
              onPress={() => {
                if (autoSaveTimer.current) {
                  clearTimeout(autoSaveTimer.current);
                }
                setEditing(false);
                void loadProfile();
              }}
              disabled={saving}
            >
              <Text style={[styles.btnOutlineText, { color: isDark ? '#F87171' : '#DC2626' }]}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.btnPrimary]} onPress={() => handleSave(false)} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.btnPrimaryText}>Save Profile</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {user?.role === 'power' && (
              <>
                <TouchableOpacity style={[styles.button, styles.btnSecondary, { borderColor: border }]} onPress={() => router.push('/create-admin')}>
                  <Ionicons name="person-add-outline" size={18} color={isDark ? '#BFDBFE' : '#1D4ED8'} />
                  <Text style={[styles.btnSecondaryText, { color: isDark ? '#BFDBFE' : '#1D4ED8' }]}>Create Admin</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.btnSecondary, { borderColor: border }]} onPress={() => router.push('/admin-management')}>
                  <Ionicons name="settings-outline" size={18} color={isDark ? '#BFDBFE' : '#1D4ED8'} />
                  <Text style={[styles.btnSecondaryText, { color: isDark ? '#BFDBFE' : '#1D4ED8' }]}>Admin Management</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={[styles.button, styles.btnSecondary, { borderColor: border }]} onPress={() => router.push('/change-password')}>
              <Ionicons name="key-outline" size={18} color={isDark ? '#BFDBFE' : '#1D4ED8'} />
              <Text style={[styles.btnSecondaryText, { color: isDark ? '#BFDBFE' : '#1D4ED8' }]}>Change Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.btnDanger]}
              onPress={async () => {
                await logout();
                showToast.success('Logged out successfully. See you soon! 👋', 'Goodbye');
                router.replace('/login');
              }}
            >
              <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
              <Text style={styles.btnDangerText}>Logout</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },

  heroWrap: {
    paddingTop: 36,
    paddingBottom: 18,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  heroTopRow: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heroInfo: {
    marginLeft: 12,
    flex: 1,
    paddingTop: 2,
  },
  heroActions: {
    alignItems: 'flex-end',
    gap: 10,
  },
  settingsIconButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  displayName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emailText: {
    marginTop: 3,
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  heroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBadgeText: {
    color: '#E6F0FF',
    fontSize: 11,
    fontWeight: '700',
    maxWidth: 130,
  },
  editToggle: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  editToggleText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },

  completionWrap: {
    marginTop: 14,
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completionLabel: {
    color: '#E6F0FF',
    fontSize: 12,
    fontWeight: '600',
  },
  completionPercent: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  completionTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  completionFill: {
    height: '100%',
    backgroundColor: '#E6F0FF',
    borderRadius: 999,
  },

  autoRow: {
    marginTop: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  autoRowLabel: {
    color: '#E6F0FF',
    fontWeight: '600',
    fontSize: 13,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    padding: 2,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    transform: [{ translateX: 1 }],
  },
  knobOn: {
    transform: [{ translateX: 24 }],
  },

  statsGrid: {
    flexDirection: 'row',
    marginTop: -12,
    paddingHorizontal: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 11,
    paddingHorizontal: 10,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '800',
  },

  card: {
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 3,
    marginBottom: 12,
  },
  editingHint: {
    marginTop: 8,
    paddingHorizontal: 16,
    color: '#E6F0FF',
    fontSize: 12,
    lineHeight: 18,
  },
  selectorHint: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: -4,
    marginBottom: 12,
  },

  row2: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  fieldBlock: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  selectorPanel: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  selectorEmpty: {
    fontSize: 13,
    lineHeight: 19,
  },
  selectorValue: {
    fontSize: 13,
    fontWeight: '700',
  },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.3)',
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: 'rgba(37,99,235,0.15)',
    borderColor: '#2563EB',
  },
  chipText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 12,
  },
  chipTextActive: {
    color: '#1D4ED8',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 5,
  },

  actionsWrap: {
    marginTop: 14,
    paddingHorizontal: 12,
    gap: 9,
  },
  inlineRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: '#1D4ED8',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  btnOutline: {
    flex: 1,
    borderWidth: 1.8,
    backgroundColor: 'transparent',
  },
  btnOutlineText: {
    fontWeight: '800',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.2,
  },
  btnSecondaryText: {
    fontWeight: '800',
  },
  btnDanger: {
    backgroundColor: '#DC2626',
  },
  btnDangerText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
