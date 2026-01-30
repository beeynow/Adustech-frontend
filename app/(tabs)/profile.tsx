import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { profileAPI, UserProfile } from '../../services/profileApi';
import { useAuth } from '../../context/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [autoSave, setAutoSave] = useState(true);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Form state
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

  // Validation state
  const [errors, setErrors] = useState<{ [k: string]: string | undefined }>({});

  const levels = useMemo(() => ['100','200','300','400','500'], []);
  const genders = useMemo(() => ['Male','Female','Other'] as const, []);

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const result = await profileAPI.getProfile();
    if (result.success && result.data.user) {
      const u = result.data.user as UserProfile & { dateOfBirth?: string };
      setProfile(u);
      setName(u.name || '');
      setBio(u.bio || '');
      setLevel(u.level || '');
      setDepartment(u.department || '');
      setFaculty(u.faculty || '');
      setPhone(u.phone || '');
      setGender((u.gender as any) || '');
      setDateOfBirth(u?.dateOfBirth ? new Date(u.dateOfBirth as any).toISOString().slice(0,10) : '');
      setAddress(u.address || '');
      setCountry(u.country || '');
      setProfileImage(u.profileImage || '');
    }
    setLoading(false);
  };

  const validate = () => {
    const next: { [k: string]: string | undefined } = {};
    if (!name.trim()) next.name = 'Full name is required';
    if (phone && !/^\+?[0-9\-\s]{7,15}$/.test(phone)) next.phone = 'Enter a valid phone number';
    if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) next.dateOfBirth = 'Use format YYYY-MM-DD';
    if (level && !levels.includes(level)) next.level = 'Level should be one of ' + levels.join(', ');
    if (gender && !genders.includes(gender)) next.gender = 'Gender must be Male, Female or Other';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const scheduleAutoSave = () => {
    if (!autoSave || !editing) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      if (!validate()) return;
      await handleSave(true);
    }, 1200);
  };

  useEffect(() => {
    scheduleAutoSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, bio, level, department, faculty, phone, gender, dateOfBirth, address, country, profileImage, autoSave, editing]);

  const pickImage = async () => {
    if (!editing) return;
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photos');
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
      level,
      department,
      faculty,
      phone,
      gender,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      address,
      country,
      profileImage,
    });
    setSaving(false);

    if (result.success) {
      if (!silent) Alert.alert('Saved', 'Your profile has been updated');
      if (!silent) setEditing(false);
      loadProfile();
      return { success: true };
    } else {
      if (!silent) Alert.alert('Error', result.message || 'Failed to update profile');
      return { success: false };
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, styles.flex, { backgroundColor: isDark ? '#0A1929' : '#E6F4FE' }]}>
        <ActivityIndicator size="large" color={isDark ? '#42A5F5' : '#1976D2'} />
      </View>
    );
  }

  const headerGradient = isDark ? ['#0A1929', '#102B4C'] : ['#1976D2', '#42A5F5'];
  const cardBg = isDark ? '#0F213A' : '#FFFFFF';
  const muted = isDark ? '#90CAF9' : '#607D8B';
  const textPrimary = isDark ? '#FFFFFF' : '#0A1929';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: isDark ? '#0A1929' : '#E6F4FE' }}>
      {/* Header */}
      <LinearGradient colors={headerGradient} style={styles.headerWrap}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}> 
                <Text style={styles.avatarInitial}>{(name || profile?.name || '?').charAt(0).toUpperCase()}</Text>
              </View>
            )}
            {editing && (
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={[styles.displayName, { color: '#FFFFFF' }]} numberOfLines={1}>
              {name || profile?.name || 'User'}
            </Text>
            <Text style={[styles.emailText, { color: 'rgba(255,255,255,0.85)' }]} numberOfLines={1}>
              {profile?.email}
            </Text>
            <View style={styles.badgesRow}>
              <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.35)' }]}>
                <Ionicons name="ribbon-outline" size={14} color="#FFFFFF" />
                <Text style={styles.badgeText}>{user?.role || 'user'}</Text>
              </View>
              {level ? (
                <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.35)' }]}>
                  <Ionicons name="school-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.badgeText}>Level {level}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setEditing((e) => !e)}
            style={[styles.editToggle, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.2)' }]}
          >
            <Ionicons name={editing ? 'close' : 'create-outline'} size={18} color="#FFFFFF" />
            <Text style={styles.editToggleText}>{editing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>

        {/* Auto-save toggle */}
        {editing && (
          <View style={styles.autoRow}>
            <Text style={{ color: 'rgba(255,255,255,0.9)' }}>Auto-save</Text>
            <TouchableOpacity
              onPress={() => setAutoSave((v) => !v)}
              style={[styles.toggle, { borderColor: 'rgba(255,255,255,0.6)' }, autoSave && styles.toggleOn]}
            >
              <View style={[styles.knob, autoSave && styles.knobOn]} />
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      {/* Quick stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: cardBg }]}>
          <Ionicons name="school-outline" size={18} color={isDark ? '#90CAF9' : '#1976D2'} />
          <Text style={[styles.statLabel, { color: muted }]}>Department</Text>
          <Text style={[styles.statValue, { color: textPrimary }]} numberOfLines={1}>{department || '—'}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: cardBg }]}>
          <Ionicons name="business-outline" size={18} color={isDark ? '#90CAF9' : '#1976D2'} />
          <Text style={[styles.statLabel, { color: muted }]}>Faculty</Text>
          <Text style={[styles.statValue, { color: textPrimary }]} numberOfLines={1}>{faculty || '—'}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: cardBg }]}>
          <Ionicons name="bar-chart-outline" size={18} color={isDark ? '#90CAF9' : '#1976D2'} />
          <Text style={[styles.statLabel, { color: muted }]}>Level</Text>
          <Text style={[styles.statValue, { color: textPrimary }]} numberOfLines={1}>{level || '—'}</Text>
        </View>
      </View>

      {/* About */}
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>About</Text>
        </View>
        <View style={styles.fieldRow}>
          <Ionicons name="document-text-outline" size={18} color={muted} />
          <View style={{ flex: 1 }}>
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              placeholder="Tell us about yourself"
              placeholderTextColor={muted}
              value={bio}
              onChangeText={setBio}
              editable={editing}
              multiline
            />
          </View>
        </View>
      </View>

      {/* Academic Info */}
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>Academic Info</Text>
        </View>
        <View style={styles.fieldRow}>
          <Ionicons name="school-outline" size={18} color={muted} />
          <View style={{ flex: 1 }}>
            {editing ? (
              <View style={styles.chipsRow}>
                {levels.map((lv) => (
                  <TouchableOpacity key={lv} onPress={() => setLevel(lv)} style={[styles.chip, level === lv && styles.chipActive]}>
                    <Text style={[styles.chipText, level === lv && styles.chipTextActive]}>{lv}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={[styles.inputStatic, { color: level ? textPrimary : muted }]}>{level || 'Level (e.g., 100, 200)'}</Text>
            )}
            {!!errors.level && <Text style={styles.errorText}>{errors.level}</Text>}
          </View>
        </View>
        <View style={styles.fieldRow}>
          <Ionicons name="albums-outline" size={18} color={muted} />
          <View style={{ flex: 1 }}>
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              placeholder="Department"
              placeholderTextColor={muted}
              value={department}
              onChangeText={setDepartment}
              editable={editing}
            />
          </View>
        </View>
        <View style={styles.fieldRow}>
          <Ionicons name="business-outline" size={18} color={muted} />
          <View style={{ flex: 1 }}>
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              placeholder="Faculty"
              placeholderTextColor={muted}
              value={faculty}
              onChangeText={setFaculty}
              editable={editing}
            />
          </View>
        </View>
      </View>

      {/* Contact */}
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>Contact</Text>
        </View>
        <View style={styles.fieldRow}>
          <Ionicons name="call-outline" size={18} color={muted} />
          <View style={{ flex: 1 }}>
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              placeholder="Phone"
              placeholderTextColor={muted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={editing}
            />
            {!!errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>
        </View>
        <View style={styles.fieldRow}>
          <Ionicons name="mail-outline" size={18} color={muted} />
          <Text style={[styles.inputStatic, { color: muted }]} numberOfLines={1}>{profile?.email}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Ionicons name="location-outline" size={18} color={muted} />
          <View style={{ flex: 1 }}>
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              placeholder="Address"
              placeholderTextColor={muted}
              value={address}
              onChangeText={setAddress}
              editable={editing}
            />
          </View>
        </View>
        <View style={styles.fieldRow}>
          <Ionicons name="flag-outline" size={18} color={muted} />
          <View style={{ flex: 1 }}>
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              placeholder="Country"
              placeholderTextColor={muted}
              value={country}
              onChangeText={setCountry}
              editable={editing}
            />
          </View>
        </View>
      </View>

      {/* Personal */}
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>Personal</Text>
        </View>
        <View style={styles.fieldRow}>
          <Ionicons name="transgender-outline" size={18} color={muted} />
          <View style={{ flex: 1 }}>
            {editing ? (
              <View style={styles.chipsRow}>
                {genders.map((g) => (
                  <TouchableOpacity key={g} onPress={() => setGender(g)} style={[styles.chip, gender === g && styles.chipActive]}>
                    <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={[styles.inputStatic, { color: gender ? textPrimary : muted }]}>{gender || 'Gender'}</Text>
            )}
            {!!errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
          </View>
        </View>
        <View style={styles.fieldRow}>
          <Ionicons name="calendar-outline" size={18} color={muted} />
          <View style={{ flex: 1 }}>
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              placeholder="Date of Birth (YYYY-MM-DD)"
              placeholderTextColor={muted}
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              editable={editing}
            />
            {!!errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsWrap}>
        {editing ? (
          <View style={styles.inlineRow}>
            <TouchableOpacity
              style={[styles.button, styles.btnOutline, { borderColor: isDark ? '#EF4444' : '#DC2626' }]}
              onPress={() => {
                setEditing(false);
                loadProfile();
              }}
              disabled={saving}
            >
              <Text style={[styles.btnOutlineText, { color: isDark ? '#EF4444' : '#DC2626' }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.btnPrimary]}
              onPress={() => handleSave(false)}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.btnPrimaryText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {user?.role === 'power' && (
              <>
                <TouchableOpacity style={[styles.button, styles.btnSecondary]} onPress={() => router.push('/create-admin')}>
                  <Ionicons name="person-add-outline" size={18} color={isDark ? '#FFFFFF' : '#1976D2'} />
                  <Text style={[styles.btnSecondaryText, { color: isDark ? '#FFFFFF' : '#1976D2' }]}>Create Admin</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.btnSecondary]} onPress={() => router.push('/admin-management')}>
                  <Ionicons name="settings-outline" size={18} color={isDark ? '#FFFFFF' : '#1976D2'} />
                  <Text style={[styles.btnSecondaryText, { color: isDark ? '#FFFFFF' : '#1976D2' }]}>Admin Management</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={[styles.button, styles.btnSecondary]} onPress={() => router.push('/change-password')}>
              <Ionicons name="key-outline" size={18} color={isDark ? '#FFFFFF' : '#1976D2'} />
              <Text style={[styles.btnSecondaryText, { color: isDark ? '#FFFFFF' : '#1976D2' }]}>Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.btnDanger]}
              onPress={() => {
                Alert.alert('Logout', 'Are you sure you want to logout?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } }
                ]);
              }}
            >
              <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
              <Text style={styles.btnDangerText}>Logout</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  headerWrap: { paddingTop: 36, paddingBottom: 16 },
  headerContent: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#FFFFFF' },
  avatarPlaceholder: { backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#FFFFFF', fontSize: 32, fontWeight: '800' },
  cameraBadge: { position: 'absolute', right: -2, bottom: -2, width: 28, height: 28, borderRadius: 14, backgroundColor: '#1976D2', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  headerText: { marginLeft: 12, flex: 1 },
  displayName: { fontSize: 22, fontWeight: '800' },
  emailText: { marginTop: 2, fontSize: 12 },
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  editToggle: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  editToggleText: { color: '#FFFFFF', fontWeight: '700' },
  autoRow: { marginTop: 12, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggle: { width: 50, height: 28, borderRadius: 14, borderWidth: 2, padding: 2, justifyContent: 'center' },
  toggleOn: { backgroundColor: 'rgba(255,255,255,0.25)' },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', transform: [{ translateX: 2 }] },
  knobOn: { transform: [{ translateX: 22 }] },

  statsRow: { flexDirection: 'row', paddingHorizontal: 12, marginTop: -12 },
  statCard: { flex: 1, marginHorizontal: 4, borderRadius: 14, padding: 12, alignItems: 'flex-start', gap: 4, elevation: 3 },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 14, fontWeight: '700' },

  card: { marginTop: 12, marginHorizontal: 12, borderRadius: 16, padding: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  fieldRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  input: { flex: 1, minHeight: 20 },
  inputStatic: { flex: 1, minHeight: 20 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(25,118,210,0.35)' },
  chipActive: { backgroundColor: 'rgba(25,118,210,0.12)', borderColor: '#1976D2' },
  chipText: { color: '#1976D2', fontWeight: '700', fontSize: 12 },
  chipTextActive: { color: '#1976D2' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 4 },

  actionsWrap: { paddingHorizontal: 12, marginTop: 16, gap: 8 },
  inlineRow: { flexDirection: 'row', gap: 8 },
  button: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  btnPrimary: { backgroundColor: '#1976D2', flex: 1 },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '800' },
  btnOutline: { borderWidth: 2, backgroundColor: 'transparent', flex: 1 },
  btnOutlineText: { fontWeight: '800' },
  btnSecondary: { backgroundColor: 'transparent', borderWidth: 2, borderColor: 'rgba(25,118,210,0.25)' },
  btnSecondaryText: { fontWeight: '800' },
  btnDanger: { backgroundColor: '#EF4444' },
  btnDangerText: { color: '#FFFFFF', fontWeight: '800' },
});
