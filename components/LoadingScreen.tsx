import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';

interface LoadingProps {
  retryCount?: number;
  maxRetries?: number;
  message?: string;
}

const Loading = ({ retryCount = 0, maxRetries = 5, message }: LoadingProps) => {
  const { theme } = useTheme();

  const colors = theme === 'dark'
    ? {
        bg: '#0f1415',
        gradientBg: ['#1a1a1a', '#0f0f0f'],
        text: '#ffffff',
        primaryText: '#fbbf24',
        secondaryText: '#9ca3af',
        spinner: '#fbbf24',
        accent: '#f59e0b',
        containerBg: 'rgba(251, 191, 36, 0.08)',
        containerBorder: 'rgba(251, 191, 36, 0.2)',
        progressBg: 'rgba(251, 191, 36, 0.15)',
        progressFill: '#fbbf24',
      }
    : {
        bg: '#f0fdf4', // Green-50
        gradientBg: ['#dcfce7', '#f0fdf4'], // Green-100 to Green-50
        text: '#111827',
        primaryText: '#166534', // Green-800
        secondaryText: '#6b7280',
        spinner: '#16a34a', // Green-600
        accent: '#22c55e', // Green-500
        containerBg: 'rgba(22, 163, 74, 0.05)',
        containerBorder: 'rgba(22, 163, 74, 0.15)',
        progressBg: 'rgba(22, 163, 74, 0.1)',
        progressFill: '#16a34a',
      };

  // Enhanced animations
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);
  const textScale = useSharedValue(0.8);
  const progressWidth = useSharedValue(0);

  React.useEffect(() => {
    // Spinner pulse animation
    scale.value = withRepeat(
      withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Subtle rotation for spinner container
    rotation.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );

    // Fade in animation
    opacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });

    // Text scale animation
    textScale.value = withDelay(
      200,
      withTiming(1, { duration: 500, easing: Easing.back(1.2) })
    );

    // Progress bar animation (if retrying)
    if (retryCount > 0) {
      progressWidth.value = withTiming(
        (retryCount / maxRetries) * 100,
        { duration: 300, easing: Easing.out(Easing.ease) }
      );
    }
  }, [retryCount]);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
    opacity: opacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    transform: [{ scale: textScale.value }],
    opacity: opacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: interpolate(opacity.value, [0, 1], [20, 0]) }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const getLoadingMessage = () => {
    if (message) return message;
    if (retryCount > 0) {
      return `Reconnecting... (${retryCount}/${maxRetries})`;
    }
    return "Syncing your data...";
  };

  const getSubMessage = () => {
    if (retryCount > 0) {
      return "Checking network connection";
    }
    return "Getting things ready for you!";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Background gradient effect */}
      <View style={[styles.backgroundGradient, { backgroundColor: colors.gradientBg[0] }]} />
      
      <Animated.View style={[styles.contentContainer, containerStyle]}>
        {/* Main spinner container */}
        <Animated.View style={[
          styles.spinnerContainer, 
          {
            backgroundColor: colors.containerBg,
            borderColor: colors.containerBorder,
          },
          spinnerStyle
        ]}>
          <View style={styles.spinnerBox}>
            <ActivityIndicator size="large" color={colors.spinner} />
          </View>
        </Animated.View>

        {/* Loading text */}
        <Animated.View style={[styles.textContainer, textStyle]}>
          <Text style={[styles.primaryText, { color: colors.primaryText }]}>
            {getLoadingMessage()}
          </Text>
          <Text style={[styles.secondaryText, { color: colors.secondaryText }]}>
            {getSubMessage()}
          </Text>
        </Animated.View>

        {/* Progress bar for retries */}
        {retryCount > 0 && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBackground, { backgroundColor: colors.progressBg }]}>
              <Animated.View style={[
                styles.progressFill,
                { backgroundColor: colors.progressFill },
                progressStyle
              ]} />
            </View>
            <Text style={[styles.progressText, { color: colors.secondaryText }]}>
              Attempt {retryCount} of {maxRetries}
            </Text>
          </View>
        )}

        {/* Animated dots */}
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((index) => (
            <AnimatedDot
              key={index}
              delay={index * 200}
              color={colors.accent}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

// Animated dot component
const AnimatedDot = ({ delay, color }: { delay: number; color: string }) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.8, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[
      styles.dot,
      { backgroundColor: color },
      animatedStyle
    ]} />
  );
};

export default Loading;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  spinnerContainer: {
    borderRadius: 60,
    borderWidth: 1,
    padding: 8,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  spinnerBox: {
    padding: 24,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  primaryText: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: 22,
  },
  progressContainer: {
    width: '80%',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressBackground: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});