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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';

type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  OTPVerify: { 
    confirmation: any;
    userData?: { username?: string; phone: string };

    isLogin: boolean; // ✅ Flag to indicate login vs register
  };
  Contacts: undefined;
};

const LoginScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (phone.length !== 10) {
      Alert.alert('Invalid Phone', 'Enter a valid 10-digit number');
      return;
    }

    const number = '+91' + phone;
    setIsLoading(true);

    try {
      // Send OTP
      const confirmation = await auth().signInWithPhoneNumber(number);

      // Navigate to OTP verify with flag isLogin=true
      navigation.navigate('OTPVerify', {
       confirmation,
       isLogin: true,
       userData: { phone: number },  // <-- Required
});

    } catch (error: any) {
      console.error('OTP Error:', error);
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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Phone */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter your registered number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={10}
              />
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>🔐</Text>
            <Text style={styles.infoText}>
              Enter the phone number you used when registering
            </Text>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => navigation.navigate('Welcome')}
          >
            <Text style={styles.footerText}>
              Don't have an account? <Text style={styles.footerLink}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },

  header: {
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
    marginBottom: 20,
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

  footerButton: {
    alignItems: 'center',
  },

  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },

  footerLink: {
    color: '#4A90E2',
    fontWeight: '600',
  },
});
