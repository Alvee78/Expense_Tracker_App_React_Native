import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const Index = () => {
  const router = useRouter();
  const { theme } = useTheme();

  // Modern grey-based light theme
  const colors = theme === 'dark'
    ? {
        bg: '#18181b',
        text: '#fde047',
      }
    : {
        bg: '#f3f4f6', // light grey background
        text: '#18181b', // dark text for splash in light mode
      };

  useEffect(() => {
    setTimeout(() => {
      router.replace('/(home)');
    }, 2000);
  }, []);

  return (
    <LinearGradient
      colors={['#f3f4f6', '#e5e7eb', '#22c55e']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBg}
    >
      
        <Image
          style={styles.logo}
          source={require('../assets/images/flash_image.jpg')}
        />
        <Text style={[styles.welcomeText, { color: colors.text }]}>
          Budget better, Live smarter
        </Text>
    </LinearGradient>
  );
};

export default Index;

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    height: '30%',
    width: '80%',
    borderRadius: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 50,
    letterSpacing: 1,
    textAlign: 'center',
  },
});