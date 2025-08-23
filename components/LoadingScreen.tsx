import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface LoadingProps {
  message?: string;
}

const Loading = ({ message = "Loading..." }: LoadingProps) => {
  const { theme } = useTheme();

  const colors = theme === 'dark'
    ? {
        bg: '#18181b',
        text: '#fde047',
        spinner: '#22c55e',
      }
    : {
        bg: '#f3f4f6',
        text: '#22c55e',
        spinner: '#22c55e',
      };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ActivityIndicator size="large" color={colors.spinner} />
      <Text style={[styles.text, { color: colors.text }]}>
        {message}
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
    paddingHorizontal: 20,
  },
  icon: {
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 20,
    textAlign: 'center',
  },
});