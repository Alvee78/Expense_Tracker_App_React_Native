import { useTheme } from '@/context/ThemeContext';
import React, { ReactNode } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenWrapperProps = {
  style?: object;
  children: ReactNode;
};

const TabScreenWrapper = ({ style, children }: ScreenWrapperProps) => {
  const { theme } = useTheme();
  // Yellow-based for light theme, dark for dark theme
  const bgColor = theme === 'dark' ? '#18181b' : '#fde047'; // yellow-300
  const barStyle = theme === 'dark' ? 'light-content' : 'dark-content';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }, style]}>
      <StatusBar barStyle={barStyle} backgroundColor={bgColor} translucent={false} />
      {children}
    </SafeAreaView>
  );
};

export default TabScreenWrapper;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});