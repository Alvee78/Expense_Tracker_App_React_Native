import ScreenWrapper from '@/components/ScreenWrapper';
import Typography from '@/components/Typography';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { verticalScale } from 'react-native-size-matters';
import { LinearGradient } from 'expo-linear-gradient';const AuthSelection = () => {
  const router = useRouter();
  const { theme } = useTheme();

  // Modern grey-based light theme
  const colors = theme === 'dark'
    ? {
        bg: '#18181b',
        footer: '#232323',
        border: '#fde047',
        title: '#fde047',
        subtitle: '#a1a1aa',
        button: '#fde047',
        buttonText: '#18181b',
        buttonSecondary: '#232323',
        buttonTextSecondary: '#fde047',
      }
    : {
        bg: '#f3f4f6',        // light grey background
        footer: '#e5e7eb',    // grey footer
        border: '#e5e7eb',    // subtle grey border
        title: '#22c55e',     // green accent for title
        subtitle: '#6b7280',  // medium grey subtitle
        button: '#22c55e',    // green button
        buttonText: '#fff',   // white button text
        buttonSecondary: '#fff',
        buttonTextSecondary: '#22c55e',
      };

  return (
<LinearGradient
    colors={['#f3f4f6', '#e5e7eb', '#22c55e']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.gradientBg}
  >
    <ScreenWrapper style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View style={styles.inner}>
        <Animated.Image
          entering={FadeInUp.duration(1000)}
          source={require('../../assets/images/welcome.png')}
          style={styles.welcomeImage}
          resizeMode="contain"
        />
        <View style={[styles.footer, { backgroundColor: colors.footer, borderColor: colors.border }]}>
          <Animated.View
            entering={FadeInDown.duration(1000)}
            style={{ alignItems: 'center', height: verticalScale(100) }}
          >
            <Typography style={[styles.title, { color: colors.title }]} size={24} fontWeight="800">
              Welcome!
            </Typography>
            <Typography style={[styles.subtitle, { color: colors.subtitle }]} size={16}>
              Sign in to continue or create a new account.
            </Typography>
          </Animated.View>
          <Animated.View
            entering={FadeInDown.duration(1000).delay(500)}
            style={styles.buttonContainer}
          >
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.button }]}
              onPress={() => router.push('/(auth)/sign-in')}
            >
              <Typography style={[styles.buttonText, { color: colors.buttonText }]}>Sign in</Typography>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.buttonSecondary,
                { backgroundColor: colors.buttonSecondary, borderColor: colors.border },
              ]}
              onPress={() => router.push('/(auth)/sign-up')}
            >
              <Typography style={[styles.buttonTextSecondary, { color: colors.buttonTextSecondary }]}>Sign up</Typography>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </ScreenWrapper>
  </LinearGradient>
  );
};

export default AuthSelection;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  inner: {
    width: '100%',
    flex: 1,
  },
  welcomeImage: {
    width: '100%',
    height: verticalScale(300),
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: verticalScale(90),
  },
  footer: {
    alignItems: 'center',
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(30),
    gap: verticalScale(8),
    borderRadius: 30,
    marginHorizontal: verticalScale(16),
    marginBottom: verticalScale(40),
    borderWidth: 1,
    height: verticalScale(250),
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: verticalScale(16),
    marginTop: verticalScale(-16), height: verticalScale(100)
  },
  button: {
    paddingVertical: verticalScale(12),
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: verticalScale(16),
    marginTop: verticalScale(8),
    height: verticalScale(50)
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 18,
  },
  buttonSecondary: {
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    paddingVertical: verticalScale(12),
    paddingHorizontal: verticalScale(16),
    marginTop: verticalScale(4),
    height: verticalScale(50),
  },
  buttonTextSecondary: {
    fontWeight: '600',
    fontSize: 18,
  },
    gradientBg: {
    flex: 1,
    justifyContent: 'center',
  },
});