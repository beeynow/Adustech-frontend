import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, useColorScheme, Text, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Reset animations to initial values
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.3);
    slideAnim.setValue(50);
    progressAnim.setValue(0);
    setProgress(0);

    // Start logo animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate progress bar from 0 to 100% over 2 seconds
    Animated.timing(progressAnim, {
      toValue: 100,
      duration: 2000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        progressAnim.setValue(100);
        setProgress(100);
      }
    });

    // Listen to animated value and map to integer percent
    const id = progressAnim.addListener(({ value }) => {
      const pct = Math.max(0, Math.min(100, Math.round(value)));
      setProgress(pct);
    });

    return () => {
      progressAnim.removeListener(id);
      progressAnim.stopAnimation();
    };
  }, [fadeAnim, scaleAnim, slideAnim, progressAnim]);

  const backgroundColor = colorScheme === 'dark' ? '#0A1929' : '#E6F4FE';
  const isDark = colorScheme === 'dark';

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  // Shimmer over the logo
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    shimmerAnim.setValue(0);
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.inOut(Easing.linear),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoShadow}>
          <View>
            <Animated.Image
              source={require('../assets/images/plash.png')}
              style={[styles.logoImage, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
              resizeMode="contain"
            />
            {/* Shimmer overlay */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX: shimmerTranslate }, { rotate: '15deg' }],
                  opacity: fadeAnim,
                },
              ]}
            />
          </View>
        </View>
      </Animated.View>
      
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={[styles.brandName, isDark ? styles.textDark : styles.textLight]}>
          Welcome to ADUSTECH Family
        </Text>
      </Animated.View>

      {/* Loading Bar and Percentage */}
      <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
        <Text style={[styles.percentageText, isDark ? styles.textDark : styles.textLight]}>
          {progress}%
        </Text>
        <View style={[styles.progressBarContainer, isDark ? styles.progressBarDark : styles.progressBarLight]}>
          <Animated.View
            style={[
              styles.progressBar,
              isDark ? styles.progressBarFillDark : styles.progressBarFillLight,
              { width: progressWidth },
            ]}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
    height: height,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  logoShadow: {
    width: 220,
    height: 220,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  logoImage: {
    width: 180,
    height: 180,
  },
  textContainer: {
    alignItems: 'center',
  },
  brandName: {
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 6,
    marginBottom: 12,
  },
  textLight: {
    color: '#0A1929',
  },
  textDark: {
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: 18,
    letterSpacing: 3,
    fontWeight: '300',
  },
  subtextLight: {
    color: '#546E7A',
  },
  subtextDark: {
    color: '#90CAF9',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
    width: width * 0.7,
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 1,
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarLight: {
    backgroundColor: 'rgba(25, 118, 210, 0.2)',
  },
  progressBarDark: {
    backgroundColor: 'rgba(66, 165, 245, 0.2)',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressBarFillLight: {
    backgroundColor: '#1976D2',
  },
  progressBarFillDark: {
    backgroundColor: '#42A5F5',
  },
});
