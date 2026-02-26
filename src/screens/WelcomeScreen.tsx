import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Welcome: undefined;
  Register: { mode: 'register' | 'login' };
  OTPVerify: {
    phoneNumber: string;
    verificationId: string;
    username?: string;
    mode: 'register' | 'login';
  };
  Contacts: undefined;
};

const WelcomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>📱</Text>
          <Text style={styles.title}>Welcome to Minichat</Text>
          <Text style={styles.subtitle}>
            Secure offline messaging with mesh networking
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🔒</Text>
            <Text style={styles.featureText}>End-to-end encrypted</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📡</Text>
            <Text style={styles.featureText}>Works offline via mesh</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🚀</Text>
            <Text style={styles.featureText}>No internet needed</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Register', { mode: 'register' })}
          >
            <Text style={styles.primaryButtonText}>I'm New Here</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Register', { mode: 'login' })}
          >
            <Text style={styles.secondaryButtonText}>I Have an Account</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          By continuing, you agree to our Terms & Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },

  header: {
    alignItems: 'center',
    marginTop: 60,
  },

  emoji: {
    fontSize: 80,
    marginBottom: 24,
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  features: {
    gap: 20,
    marginVertical: 40,
  },

  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  featureIcon: {
    fontSize: 28,
    marginRight: 16,
  },

  featureText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },

  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },

  primaryButton: {
    height: 56,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 17,
  },

  secondaryButton: {
    height: 56,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4A90E2',
  },

  secondaryButtonText: {
    color: '#4A90E2',
    fontWeight: '700',
    fontSize: 17,
  },

  footer: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
});
