// src/contexts/ThemeContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => Promise<void>;
  theme: ThemeColors;
};

type ThemeColors = {
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  headerColor: string;
  subTextColor: string;
  borderColor: string;
  primaryColor: string;
  errorColor: string;
};

// Create the context with default values
const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: async () => {},
  theme: {
    backgroundColor: '#f8f9fa',
    cardColor: 'white',
    textColor: '#333333',
    headerColor: '#333333',
    subTextColor: '#666666',
    borderColor: '#eaeaea',
    primaryColor: '#3DC3C9',
    errorColor: '#ff6b6b',
  },
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  // Load theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedThemePreference = await AsyncStorage.getItem('dark_mode_enabled');
        if (storedThemePreference !== null) {
          setIsDarkMode(storedThemePreference === 'true');
        } else {
          // If no stored preference, use system preference
          setIsDarkMode(systemColorScheme === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };

    loadThemePreference();
  }, [systemColorScheme]);

  // Generate theme colors based on current mode
  const theme: ThemeColors = {
    backgroundColor: isDarkMode ? '#121212' : '#f8f9fa',
    cardColor: isDarkMode ? '#1e1e1e' : 'white',
    textColor: isDarkMode ? '#e1e1e1' : '#333333',
    headerColor: isDarkMode ? '#e1e1e1' : '#333333',
    subTextColor: isDarkMode ? '#a0a0a0' : '#666666',
    borderColor: isDarkMode ? '#333333' : '#eaeaea',
    primaryColor: '#3DC3C9',
    errorColor: '#ff6b6b',
  };

  // Toggle theme function
  const toggleTheme = async () => {
    const newDarkModeValue = !isDarkMode;
    setIsDarkMode(newDarkModeValue);
    try {
      await AsyncStorage.setItem('dark_mode_enabled', newDarkModeValue.toString());
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);