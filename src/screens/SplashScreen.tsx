import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as db from '../services/db';

type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Contacts: undefined;
};

const SplashScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log('🔍 Checking for existing user...');
        
        // Open database
        await db.openDatabase();
        
        // Get user
        const user = await db.getUser();

        setTimeout(() => {
          if (user) {
            console.log('✅ User found:', user.username);
            navigation.replace('Contacts');
          } else {
            console.log('⚠️ No user found, going to Welcome');
            navigation.replace('Welcome');
          }
        }, 2000);
      } catch (error) {
        console.error('Error checking user:', error);
        navigation.replace('Welcome');
      }
    };

    checkUser();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>📱</Text>
        <Text style={styles.title}>Minichat</Text>
        <Text style={styles.subtitle}>Mesh Messaging</Text>
      </View>
    </SafeAreaView>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
});
