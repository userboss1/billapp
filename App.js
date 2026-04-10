import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, MD3LightTheme, IconButton } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDatabase } from './src/db/database';
import PinLockScreen from './src/screens/PinLockScreen';
import AppNavigator from './src/navigation/AppNavigator';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#006064',
    secondary: '#00838f',
    surface: '#ffffff',
    background: '#f0fafa',
  },
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const setup = async () => {
      try {
        await initDatabase();
        setDbReady(true);
      } catch (error) {
        console.error('Database init error:', error);
      }
    };
    setup();
  }, []);

  if (!dbReady) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <PinLockScreen onUnlock={() => setIsAuthenticated(true)} />
        </SafeAreaProvider>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
