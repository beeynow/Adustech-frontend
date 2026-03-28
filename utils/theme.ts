import { useColorScheme } from 'react-native';

export type AppTheme = {
  isDark: boolean;
  background: string;
  backgroundMuted: string;
  surface: string;
  surfaceMuted: string;
  surfaceStrong: string;
  input: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSoft: string;
  accent: string;
  accentAlt: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  shadow: string;
  backdropGradient: [string, string, string];
  heroGradient: [string, string];
  heroGradientStrong: [string, string];
};

export const getTheme = (isDark: boolean): AppTheme => ({
  isDark,
  background: isDark ? '#061523' : '#F3F8FF',
  backgroundMuted: isDark ? '#0B2034' : '#E4F0FF',
  surface: isDark ? 'rgba(8, 26, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)',
  surfaceMuted: isDark ? 'rgba(13, 36, 58, 0.94)' : 'rgba(244, 248, 255, 0.95)',
  surfaceStrong: isDark ? '#102842' : '#FFFFFF',
  input: isDark ? '#102842' : '#F8FBFF',
  border: isDark ? 'rgba(123, 170, 230, 0.18)' : 'rgba(33, 93, 158, 0.12)',
  borderStrong: isDark ? 'rgba(123, 170, 230, 0.28)' : 'rgba(33, 93, 158, 0.2)',
  text: isDark ? '#F4FAFF' : '#0A243D',
  textMuted: isDark ? '#A9C6E8' : '#60758A',
  textSoft: isDark ? '#7F9CBD' : '#8AA0B6',
  accent: '#1F7AE0',
  accentAlt: '#0F9D58',
  accentSoft: isDark ? 'rgba(31, 122, 224, 0.2)' : 'rgba(31, 122, 224, 0.1)',
  success: '#11A36B',
  successSoft: isDark ? 'rgba(17, 163, 107, 0.18)' : 'rgba(17, 163, 107, 0.1)',
  warning: '#D88A16',
  warningSoft: isDark ? 'rgba(216, 138, 22, 0.18)' : 'rgba(216, 138, 22, 0.1)',
  danger: '#E0526B',
  dangerSoft: isDark ? 'rgba(224, 82, 107, 0.18)' : 'rgba(224, 82, 107, 0.1)',
  shadow: '#06111D',
  backdropGradient: isDark
    ? ['#061523', '#0C2138', '#133459']
    : ['#F8FBFF', '#EAF3FF', '#D7E9FF'],
  heroGradient: isDark
    ? ['rgba(13, 44, 70, 0.96)', 'rgba(26, 89, 149, 0.96)']
    : ['rgba(255, 255, 255, 0.98)', 'rgba(230, 242, 255, 0.98)'],
  heroGradientStrong: isDark
    ? ['#0D2C46', '#1A5995']
    : ['#0F66C6', '#47A7FF'],
});

export const useAppTheme = () => {
  const isDark = useColorScheme() === 'dark';
  return getTheme(isDark);
};
