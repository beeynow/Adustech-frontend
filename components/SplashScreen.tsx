import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  useColorScheme,
  Image,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Icon entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowContent(true);
    });

    // Continuous pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Shimmer effect
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Glow pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <LinearGradient
      colors={isDark 
        ? ['#0A1929', '#102B4C', '#1E3A5F'] 
        : ['#1976D2', '#42A5F5', '#64B5F6']
      }
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Animated background particles */}
      <View style={styles.particlesContainer}>
        {[...Array(20)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                left: `${(i * 5) % 100}%`,
                top: `${(i * 7) % 100}%`,
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.2],
                }),
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -50],
                  }),
                }],
              },
            ]}
          />
        ))}
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Icon Container with Glow Effect */}
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              transform: [
                { scale: Animated.multiply(scaleAnim, pulseAnim) },
                { rotate },
              ],
            },
          ]}
        >
          {/* Outer glow rings */}
          <Animated.View 
            style={[
              styles.glowRing, 
              styles.glowRing1, 
              { 
                backgroundColor: isDark ? 'rgba(66,165,245,0.15)' : 'rgba(255,255,255,0.25)',
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.7],
                }),
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.glowRing, 
              styles.glowRing2, 
              { 
                backgroundColor: isDark ? 'rgba(66,165,245,0.2)' : 'rgba(255,255,255,0.35)',
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              }
            ]} 
          />
          
          {/* Main Icon Circle */}
          <View style={[
            styles.iconCircle,
            {
              backgroundColor: '#FFFFFF',
              shadowColor: isDark ? '#42A5F5' : '#1976D2',
            },
          ]}>
            {/* Shimmer effect */}
            <Animated.View
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX: shimmerTranslate }],
                },
              ]}
            />
            
            {/* App Icon/Logo */}
            <Image
              source={require('../assets/images/icon.png')}
              style={styles.iconImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* App Name with modern styling */}
        {showContent && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            }}
          >
            <Text style={[
              styles.appName,
              { 
                color: '#FFFFFF',
                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              },
            ]}>
              ADUSTECH
            </Text>
            <View style={[styles.underline, {
              backgroundColor: isDark ? '#42A5F5' : '#FFFFFF',
            }]} />
          </Animated.View>
        )}

        {/* Subtitle with fade in */}
        {showContent && (
          <Animated.Text
            style={[
              styles.subtitle,
              { 
                color: isDark ? '#90CAF9' : '#E3F2FD',
                opacity: fadeAnim,
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                }],
              },
            ]}
          >
            Campus Hub for Students
          </Animated.Text>
        )}

        {/* Modern Loading Dots */}
        <View style={styles.loadingContainer}>
          <View style={styles.dotsContainer}>
            {[0, 1, 2].map((i) => (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isDark ? '#42A5F5' : '#FFFFFF',
                    opacity: fadeAnim,
                    transform: [{
                      scale: pulseAnim.interpolate({
                        inputRange: [1, 1.08],
                        outputRange: i === 1 ? [1, 1.3] : [0.8, 1],
                      }),
                    }],
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Tagline */}
        {showContent && (
          <Animated.Text
            style={[
              styles.tagline,
              { 
                color: isDark ? '#64B5F6' : 'rgba(255,255,255,0.9)',
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.8],
                }),
              },
            ]}
          >
            Connecting Students, Building Community
          </Animated.Text>
        )}
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particlesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: 40,
  },
  glowRing: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowRing1: {
    width: 220,
    height: 220,
    top: -35,
    left: -35,
  },
  glowRing2: {
    width: 180,
    height: 180,
    top: -15,
    left: -15,
  },
  iconCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    overflow: 'hidden',
    borderWidth: 5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
  },
  iconImage: {
    width: 110,
    height: 110,
  },
  appName: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 8,
    textAlign: 'center',
  },
  underline: {
    width: 80,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 15,
    textAlign: 'center',
  },
  loadingContainer: {
    marginTop: 50,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginTop: 60,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
