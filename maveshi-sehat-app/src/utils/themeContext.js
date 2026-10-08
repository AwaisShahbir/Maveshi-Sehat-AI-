import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import { LIGHT_THEME, DARK_THEME, PALETTE, HCI } from './theme';
import { getProfile, subscribeProfile, setDarkMode as storeSetDarkMode, toggleDarkMode as storeToggleDarkMode } from './profileStore';

const ThemeContext = createContext({
  isDark: false,
  colors: LIGHT_THEME,
  palette: PALETTE,
  hci: HCI,
  toggleTheme: () => {},
  setDarkMode: () => {},
});

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const initialProfile = getProfile();
  
  // Use profile preference, fallback to false
  const [isDark, setIsDark] = useState(Boolean(initialProfile?.isDarkMode));

  useEffect(() => {
    const unsub = subscribeProfile((updatedProfile) => {
      if (typeof updatedProfile.isDarkMode === 'boolean') {
        setIsDark(updatedProfile.isDarkMode);
      }
    });
    return () => unsub();
  }, []);

  const toggleTheme = () => {
    storeToggleDarkMode();
  };

  const setDarkMode = (val) => {
    storeSetDarkMode(val);
  };

  const colors = useMemo(() => {
    return isDark ? DARK_THEME : LIGHT_THEME;
  }, [isDark]);

  const value = useMemo(() => ({
    isDark,
    colors,
    palette: PALETTE,
    hci: HCI,
    toggleTheme,
    setDarkMode,
  }), [isDark, colors]);

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.headerBackground}
        translucent={false}
      />
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      isDark: false,
      colors: LIGHT_THEME,
      palette: PALETTE,
      hci: HCI,
      toggleTheme: () => {},
      setDarkMode: () => {},
    };
  }
  return context;
};

export default ThemeContext;
