import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type Theme = "light" | "dark";

interface ThemeContextProps {
  theme: Theme;
  toggleTheme: () => void;
  isDataUpdated: boolean;
  setIsDataUpdated: (value: boolean) => void;
  currency: string;
  setCurrency: (value: string) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [isDataUpdated, setIsDataUpdated] = useState<boolean>(true);
  const [currency, setCurrency] = useState<string>('৳');

  useEffect(() => {
    AsyncStorage.getItem('appTheme').then(stored => {
      if (stored === 'light' || stored === 'dark') setTheme(stored);
    });
    AsyncStorage.getItem('currency').then(storedCurrency => {
      if (storedCurrency) setCurrency(storedCurrency);
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('appTheme', theme);
  }, [theme]);

  useEffect(() => {
    AsyncStorage.setItem('currency', currency);
  }, [currency]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDataUpdated, setIsDataUpdated, currency, setCurrency }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};