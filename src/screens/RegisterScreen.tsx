import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';

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

const RegisterScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const mode = (route.params as any)?.mode || 'register';

  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

 const handleSubmit = async () => {
  // ... validation code ...

  const phoneNumber = '+91' + phone;
  setIsLoading(true);

  try {
    console.log(`📱 ${mode === 'register' ? 'Registering' : 'Logging in'}:`, phoneNumber);

    // Send OTP via Firebase
    const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
    console.log('✅ OTP sent successfully');

    // ✅ Check if verificationId exists
    if (!confirmation.verificationId) {
      throw new Error('Failed to get verification ID');
    }

    // Navigate to OTP verify
    navigation.navigate('OTPVerify', {
      phoneNumber,
      verificationId: confirmation.verificationId, // ✅ Now TypeScript knows it's not null
      username: mode === 'register' ? username.trim() : undefined,
      mode,
    });

  } catch (error: any) {
    console.error('❌ OTP Error:', error);
    Alert.alert('Error', error.message || 'Failed to send OTP');
  } finally {
    setIsLoading(false);
  }
};

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {mode === 'register' ? 'Create Account' : 'Welcome Back!'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'register' 
              ? 'Set up your Minichat profile' 
              : 'Login to continue chatting'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Username (only for registration) */}
          {mode === 'register' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#9CA3AF"
                value={username}
                onChangeText={setUsername}
                maxLength={30}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          )}

          {/* Phone */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter 10-digit number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={10}
                autoFocus={mode === 'login'}
              />
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>📱</Text>
            <Text style={styles.infoText}>
              We'll send a verification code to verify your number
            </Text>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Sending OTP...' : 'Continue'}
            </Text>
          </TouchableOpacity>

          {/* Toggle Link */}
{/* Toggle Link */}
<TouchableOpacity 
  style={styles.toggleContainer}
  onPress={() => {
    // ✅ Replace current screen with opposite mode
    const newMode = mode === 'register' ? 'login' : 'register';
    navigation.replace('Register', { mode: newMode });
  }}>
  <Text style={styles.toggleText}>
    {mode === 'register'
      ? 'Already have an account? '
      : "Don't have an account? "}
    <Text style={styles.toggleBold}>
      {mode === 'register' ? 'Login' : 'Register'}
    </Text>
  </Text>
</TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },

  header: {
    marginTop: 20,
    marginBottom: 40,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  backIcon: {
    fontSize: 24,
    color: '#374151',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: '#6B7280',
  },

  form: {
    width: '100%',
  },

  inputContainer: {
    marginBottom: 24,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },

  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  countryCode: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'center',
  },

  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },

  phoneInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },

  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },

  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },

  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 18,
  },

  button: {
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

  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 17,
  },

  toggleContainer: {
    marginTop: 24,
    alignItems: 'center',
  },

  toggleText: {
    fontSize: 15,
    color: '#6B7280',
  },

  toggleBold: {
    color: '#4A90E2',
    fontWeight: '600',
  },
});
