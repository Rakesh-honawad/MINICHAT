import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import * as db from './src/services/db';

const App = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize DB
      await db.openDatabase();

      // Check if user exists
      const user = await db.getUser();
      if (!user) {
        // ✅ ONLY create if truly needed
        // Most users will already have data from login
        console.log('⚠️ No user found, skipping default user creation');
        // Removed the default user creation - let authentication handle it
      }

      setIsReady(true);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setIsReady(true); // Continue anyway
    }
  };

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return <AppNavigator />;
};

export default App;
