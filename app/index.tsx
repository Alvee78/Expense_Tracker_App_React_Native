import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

const Index = () => {
  const router = useRouter();
  const { theme } = useTheme();

  // Theme colors
  const colors = theme === 'dark'
    ? {
        bg: '#18181b',
        text: '#fde047',
      }
    : {
        bg: '#fffde7', // light yellow
        text: '#18181b',
      };

  useEffect(() => {
    setTimeout(() => {
      router.replace('/(home)');
    }, 2000);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Image
        style={styles.logo}
        source={require('../assets/images/flash_image.jpg')}
      />
      <Text style={[styles.welcomeText, { color: colors.text }]}>
        Budget better, Live smarter
      </Text>
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
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
  },
});