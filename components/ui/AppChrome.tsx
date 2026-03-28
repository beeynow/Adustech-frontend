import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useAppTheme } from '@/utils/theme';

type ScreenShellProps = {
  children: React.ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  edges?: Edge[];
  keyboard?: boolean;
};

type HeroCardProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

type SurfaceCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

type ChipProps = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
  active?: boolean;
};

type ActionButtonProps = {
  label: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

type InfoBannerProps = {
  message: string;
  tone?: 'info' | 'success' | 'warning' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  action?: React.ReactNode;
};

type EmptyStateProps = {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  action?: React.ReactNode;
};

type LoadingStateProps = {
  label?: string;
};

type InputFieldProps = TextInputProps & {
  icon?: keyof typeof Ionicons.glyphMap;
  trailing?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

type FloatingActionButtonProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

type SegmentedControlProps<T extends string> = {
  value: T;
  items: Array<{ label: string; value: T }>;
  onChange: (value: T) => void;
};

export function ScreenShell({
  children,
  scroll = false,
  contentContainerStyle,
  style,
  edges = ['top'],
  keyboard = false,
}: ScreenShellProps) {
  const theme = useAppTheme();
  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.flex, contentContainerStyle]}>{children}</View>
  );

  const wrappedBody = keyboard ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {body}
    </KeyboardAvoidingView>
  ) : body;

  return (
    <LinearGradient colors={theme.backdropGradient} style={[styles.flex, style]}>
      <View pointerEvents="none" style={styles.ambientWrap}>
        <View style={[styles.orb, styles.orbOne, { backgroundColor: theme.accentSoft }]} />
        <View style={[styles.orb, styles.orbTwo, { backgroundColor: theme.successSoft }]} />
      </View>
      <SafeAreaView style={styles.flex} edges={edges}>
        {wrappedBody}
      </SafeAreaView>
    </LinearGradient>
  );
}

export function HeroCard({
  eyebrow,
  title,
  subtitle,
  icon = 'sparkles-outline',
  actions,
  children,
}: HeroCardProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.heroShell, { borderColor: theme.border }]}>
      <LinearGradient colors={theme.heroGradient} style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroIdentity}>
            <View style={[styles.heroIconWrap, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(31,122,224,0.1)' }]}>
              <Ionicons name={icon} size={20} color={theme.accent} />
            </View>
            <View style={styles.heroTextWrap}>
              {eyebrow ? (
                <Text style={[styles.heroEyebrow, { color: theme.accent }]}>{eyebrow}</Text>
              ) : null}
              <Text style={[styles.heroTitle, { color: theme.text }]}>{title}</Text>
            </View>
          </View>
          {actions}
        </View>
        {subtitle ? (
          <Text style={[styles.heroSubtitle, { color: theme.textMuted }]}>{subtitle}</Text>
        ) : null}
        {children}
      </LinearGradient>
    </View>
  );
}

export function SurfaceCard({ children, style }: SurfaceCardProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.surfaceCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          shadowColor: theme.shadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionHeading({ title, subtitle, action }: SectionHeadingProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionHeadingText}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>{subtitle}</Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

export function Chip({ label, icon, tone = 'neutral', active = false }: ChipProps) {
  const theme = useAppTheme();
  const colors = getTone(theme, tone, active);

  return (
    <View style={[styles.chip, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      {icon ? <Ionicons name={icon} size={14} color={colors.text} /> : null}
      <Text style={[styles.chipText, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

export function ActionButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  style,
}: ActionButtonProps) {
  const theme = useAppTheme();
  const content = (
    <>
      {icon ? <Ionicons name={icon} size={18} color={variant === 'primary' ? '#FFFFFF' : theme.accent} /> : null}
      <Text style={[styles.buttonText, { color: variant === 'primary' ? '#FFFFFF' : theme.accent }]}>{label}</Text>
    </>
  );

  if (variant === 'primary') {
    return (
      <Pressable disabled={disabled} onPress={onPress} style={[style, disabled && styles.disabled]}>
        <LinearGradient colors={theme.heroGradientStrong} style={styles.primaryButton}>
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.secondaryButton,
        {
          backgroundColor: variant === 'ghost' ? 'transparent' : theme.surface,
          borderColor: theme.borderStrong,
        },
        style,
        disabled && styles.disabled,
      ]}
    >
      {content}
    </Pressable>
  );
}

export function InfoBanner({
  message,
  tone = 'info',
  icon = 'information-circle-outline',
  action,
}: InfoBannerProps) {
  const theme = useAppTheme();
  const colors = getTone(theme, tone === 'info' ? 'accent' : tone, false);

  return (
    <View style={[styles.banner, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Ionicons name={icon} size={18} color={colors.text} />
      <Text style={[styles.bannerText, { color: colors.text }]}>{message}</Text>
      {action}
    </View>
  );
}

export function EmptyState({
  title,
  subtitle,
  icon = 'sparkles-outline',
  action,
}: EmptyStateProps) {
  const theme = useAppTheme();

  return (
    <SurfaceCard style={styles.emptyCard}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.accentSoft }]}>
        <Ionicons name={icon} size={26} color={theme.accent} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>{subtitle}</Text> : null}
      {action}
    </SurfaceCard>
  );
}

export function LoadingState({ label = 'Loading…' }: LoadingStateProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator size="large" color={theme.accent} />
      <Text style={[styles.loadingLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

export function InputField({
  icon,
  trailing,
  containerStyle,
  multiline,
  ...props
}: InputFieldProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.inputWrap,
        {
          minHeight: multiline ? 124 : 58,
          backgroundColor: theme.input,
          borderColor: theme.border,
          alignItems: multiline ? 'flex-start' : 'center',
        },
        containerStyle,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={theme.textMuted}
          style={multiline ? styles.inputIconTop : undefined}
        />
      ) : null}
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={theme.textSoft}
        style={[
          styles.inputField,
          {
            color: theme.text,
            minHeight: multiline ? 104 : undefined,
            textAlignVertical: multiline ? 'top' : 'center',
          },
        ]}
      />
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

export function FloatingActionButton({
  icon = 'add',
  onPress,
}: FloatingActionButtonProps) {
  const theme = useAppTheme();

  return (
    <Pressable onPress={onPress} style={styles.fabShell}>
      <LinearGradient colors={theme.heroGradientStrong} style={styles.fab}>
        <Ionicons name={icon} size={24} color="#FFFFFF" />
      </LinearGradient>
    </Pressable>
  );
}

export function SegmentedControl<T extends string>({
  value,
  items,
  onChange,
}: SegmentedControlProps<T>) {
  const theme = useAppTheme();

  return (
    <View style={[styles.segmentedWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            style={[
              styles.segmentedItem,
              {
                backgroundColor: active ? theme.accent : 'transparent',
              },
            ]}
          >
            <Text style={[styles.segmentedText, { color: active ? '#FFFFFF' : theme.textMuted }]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function getTone(theme: ReturnType<typeof useAppTheme>, tone: 'accent' | 'success' | 'warning' | 'danger' | 'neutral', active: boolean) {
  if (tone === 'success') {
    return {
      bg: active ? theme.success : theme.successSoft,
      border: active ? theme.success : theme.successSoft,
      text: active ? '#FFFFFF' : theme.success,
    };
  }

  if (tone === 'warning') {
    return {
      bg: active ? theme.warning : theme.warningSoft,
      border: active ? theme.warning : theme.warningSoft,
      text: active ? '#FFFFFF' : theme.warning,
    };
  }

  if (tone === 'danger') {
    return {
      bg: active ? theme.danger : theme.dangerSoft,
      border: active ? theme.danger : theme.dangerSoft,
      text: active ? '#FFFFFF' : theme.danger,
    };
  }

  if (tone === 'accent') {
    return {
      bg: active ? theme.accent : theme.accentSoft,
      border: active ? theme.accent : theme.accentSoft,
      text: active ? '#FFFFFF' : theme.accent,
    };
  }

  return {
    bg: active ? theme.surfaceStrong : theme.surfaceMuted,
    border: theme.border,
    text: active ? theme.text : theme.textMuted,
  };
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    gap: 20
  },
  ambientWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbOne: {
    width: 220,
    height: 220,
    top: 44,
    right: -90,
  },
  orbTwo: {
    width: 180,
    height: 180,
    bottom: 80,
    left: -60,
  },
  heroShell: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroCard: {
    padding: 20,
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroIdentity: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  heroIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextWrap: {
    flex: 1,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  surfaceCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 26,
    elevation: 8,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  sectionHeadingText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 18,
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 18,
  },
  disabled: {
    opacity: 0.55,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  banner: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingWrap: {
    flex: 1,
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputWrap: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  inputIconTop: {
    marginTop: 4,
  },
  trailing: {
    alignSelf: 'center',
  },
  fabShell: {
    position: 'absolute',
    right: 18,
    bottom: 26,
  },
  fab: {
    width: 62,
    height: 62,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#06111D',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 10,
  },
  segmentedWrap: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 18,
    padding: 4,
    gap: 4,
  },
  segmentedItem: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
  },
  segmentedText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
