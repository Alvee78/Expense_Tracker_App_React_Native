import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

const Loading = () => {
  const { theme } = useTheme();

  const colors = theme === 'dark'
    ? {
        bg: '#18181b',
        text: '#fde047',
        spinner: '#fde047',
        accent: '#b45309',
      }
    : {
        bg: '#fde047',
        text: '#18181b',
        spinner: '#18181b',
        accent: '#b45309',
      };

  // Pulse animation for spinner
  const scale = useSharedValue(1);
  React.useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.2, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Animated.View style={[styles.spinnerBox, animatedStyle]}>
        <ActivityIndicator size="large" color={colors.spinner} />
      </Animated.View>
      <Text style={[styles.text, { color: colors.text }]}>Please wait...</Text>
      <Text style={[styles.subtext, { color: colors.accent }]}>
        Getting things ready for you!
      </Text>
    </View>
  );
};

export default Loading;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerBox: {
    padding: 18,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 18,
  },
  text: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
  },
  subtext: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});