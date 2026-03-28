import React from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/utils/theme';

type PostAvatarProps = {
  name: string;
  imageUri?: string;
  size?: number;
};

export function PostAvatar({ name, imageUri, size = 44 }: PostAvatarProps) {
  const theme = useAppTheme();
  const letter = name.trim().charAt(0).toUpperCase() || 'A';

  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: theme.borderStrong,
          },
        ]}
      />
    );
  }

  return (
    <LinearGradient
      colors={theme.heroGradientStrong}
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: Math.max(16, size * 0.34) }]}>{letter}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    borderWidth: 1,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});
