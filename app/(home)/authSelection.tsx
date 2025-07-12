import React from 'react';
import { StyleSheet, View, Image, Touchable, TouchableOpacity } from 'react-native';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typography from '@/components/Typography';
import CustomButton from '@/components/CustomButton';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { verticalScale } from 'react-native-size-matters';
import { useRouter } from 'expo-router';

const AuthSelection = () => {
  const router = useRouter();

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.inner}>
        <Animated.Image
            entering={FadeInUp.duration(1000)}
          source={require('../../assets/images/welcome.png')}
          style={styles.welcomeImage}
          resizeMode="contain"
        />
        <View style={styles.footer}>
          <Animated.View
            entering={FadeInDown.duration(1000)}
            style={{ alignItems: 'center' }}
          >
            <Typography style={styles.title} size={24} fontWeight="800">
              Welcome!
            </Typography>
            <Typography style={styles.subtitle} size={16} color="#6b7280">
              Sign in to continue or create a new account.
            </Typography>
          </Animated.View>
          <Animated.View
            entering={FadeInDown.duration(1000).delay(500)}
            style={styles.buttonContainer}
          >
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push('/(auth)/sign-in')}
            >
              <Typography style={styles.buttonText}>Sign in</Typography>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.buttonSecondary}
        
              onPress={() => router.push('/(auth)/sign-up')}
            >
              <Typography style={styles.buttonTextSecondary}>Sign up</Typography>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default AuthSelection;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#e0f7ef',
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
    backgroundColor: '#f8f8f8ff',
    alignItems: 'center',
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(30),
    gap: verticalScale(8),
    borderRadius: 30,
    marginHorizontal: verticalScale(16),
    marginBottom: verticalScale(40),
    borderColor: '#22c55e',
    borderWidth: 1,
    height: verticalScale(260)
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#22c55e',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: verticalScale(16),
    marginTop: verticalScale(-16),
  },
  button: {
    backgroundColor: '#22c55e',
    paddingVertical: verticalScale(12),
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: verticalScale(16),
    marginTop: verticalScale(8),
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#22c55e',
    paddingVertical: verticalScale(12),
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: verticalScale(16),
    marginTop: verticalScale(4),
  },
  buttonTextSecondary: {
    color: '#22c55e',
    fontWeight: '600',
    fontSize: 18,
  },
});