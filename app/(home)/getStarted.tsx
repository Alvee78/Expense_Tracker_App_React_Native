import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { verticalScale } from 'react-native-size-matters';
import CustomButton from '../../components/CustomButton';
import ScreenWrapper from '../../components/ScreenWrapper';
import Typography from '../../components/Typography';

const welcome = () => {
  const router = useRouter();
  const { theme } = useTheme();

  // Theme colors
  const colors = theme === 'dark'
    ? {
        bg: '#18181b',
        footer: '#232323',
        textMain: '#fde047',
        textSecondary: '#a1a1aa',
        border: '#fde047',
        button: '#fde047',
        buttonText: '#18181b',
      }
    : {
        bg: '#fffde7', // light yellow
        footer: '#fff9c4', // soft yellow
        textMain: '#18181b',
        textSecondary: '#6b7280',
        border: '#fde047',
        button: '#fde047',
        buttonText: '#fff',
      };

  return (
    <ScreenWrapper style={[styles.container, { backgroundColor: colors.bg }]}>
      <View>
        <Animated.Image
          entering={FadeInUp.duration(1000)}
          source={require('../../assets/images/welcome.png')}
          style={styles.welcomeImage}
          resizeMode='contain'
        />

        <View style={[styles.footer, { backgroundColor: colors.footer, borderColor: colors.border }]}>
          <Animated.View
            entering={FadeInDown.duration(1000)}
            style={{ alignItems: 'center' }}>
            <Typography
              size={24}
              fontWeight={'800'}
              color={colors.textMain}
            >
              Welcome to Expense
            </Typography>
            <Typography
              size={24}
              fontWeight={'800'}
              color={colors.textMain}
            >
              Tracker
            </Typography>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(1000).delay(500)}
            style={{ alignItems: 'center' }}>
            <Typography
              size={16}
              color={colors.textSecondary}
              style={{ alignSelf: 'center' }}
            >
              Track your expenses and manage
            </Typography>
            <Typography
              size={16}
              color={colors.textSecondary}
              style={{ alignSelf: 'center' }}
            >
              your budget effectively.
            </Typography>
          </Animated.View>
          <Animated.View
            entering={FadeInDown.duration(1000).delay(1000)}
            style={styles.buttonContainer}>
            <CustomButton
              onPress={() => router.push('./authSelection')}
              title="Get Started"
              style={{ backgroundColor: colors.button }}
              textStyle={{ color: colors.buttonText }}
            />
          </Animated.View>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  welcomeImage: {
    width: '100%',
    height: verticalScale(300),
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: verticalScale(70),
  },
  footer: {
    alignItems: 'center',
    paddingTop: verticalScale(30),
    paddingBottom: verticalScale(30),
    gap: verticalScale(8),
    borderRadius: 30,
    marginHorizontal: verticalScale(16),
    marginBottom: verticalScale(24),
    borderWidth: 1,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: verticalScale(16),
    marginTop: verticalScale(16),
  },
});