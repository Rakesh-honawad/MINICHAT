import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import * as db from '../services/db';
import * as api from '../services/api';

type RootStackParamList = {
  OTPVerify: {
    phoneNumber: string;
    verificationId: string;
    username?: string;
    mode: 'register' | 'login';
  };
  Contacts: undefined;
  Welcome: undefined;
};

type OTPVerifyRouteProp = RouteProp<RootStackParamList, 'OTPVerify'>;

const OTPVerifyScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<OTPVerifyRouteProp>();

  const { phoneNumber, verificationId, username, mode } = route.params;

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Verifying OTP with Firebase...');
      
      // ✅ Create credential from verificationId and OTP
      const credential = auth.PhoneAuthProvider.credential(verificationId, otp);
      
      // ✅ Sign in with credential
      await auth().signInWithCredential(credential);
      console.log('✅ Firebase OTP verified');

      await db.openDatabase();

      // ========================================
      // 🔐 LOGIN (OLD USER)
      // ========================================
      if (mode === 'login') {
        console.log('🔐 LOGIN MODE: Fetching user from backend...');
        
        try {
          const backendUser = await api.loginUser(phoneNumber);

          if (!backendUser) {
            Alert.alert(
              'Account Not Found',
              'No account found with this number. Please register first.'
            );
            navigation.replace('Welcome');
            return;
          }

          await db.saveUser({
            deviceId: backendUser.deviceId,
            username: backendUser.username,
            phoneNumber: backendUser.phoneNumber,
            publicKey: backendUser.publicKey,
          });

          console.log('✅ Login successful');
          Alert.alert('Welcome Back!', `Logged in as ${backendUser.username}`);
          navigation.replace('Contacts');

        } catch (error: any) {
          if (error.response?.status === 404) {
            Alert.alert(
              'Account Not Found',
              'No account found. Please register first.'
            );
            navigation.replace('Welcome');
          } else {
            throw error;
          }
        }
      }

      // ========================================
      // 📝 REGISTER (NEW USER)
      // ========================================
      else {
        console.log('📝 REGISTER MODE: Creating account on backend...');

        try {
          const newUser = await api.registerUser({
            username: username!,
            phoneNumber: phoneNumber,
          });

          await db.saveUser({
            deviceId: newUser.deviceId,
            username: newUser.username,
            phoneNumber: newUser.phoneNumber,
            publicKey: newUser.publicKey,
          });

          console.log('✅ Registration successful');
          Alert.alert('Success!', 'Account created. You can now use Minichat!');
          navigation.replace('Contacts');

        } catch (error: any) {
          // If 409 = user exists, try login instead
          if (error.response?.status === 409) {
            console.log('⚠️ User already exists, logging in instead...');
            
            const backendUser = await api.loginUser(phoneNumber);
            
            await db.saveUser({
              deviceId: backendUser.deviceId,
              username: backendUser.username,
              phoneNumber: backendUser.phoneNumber,
              publicKey: backendUser.publicKey,
            });

            console.log('✅ Login successful');
            Alert.alert('Welcome Back!', `Logged in as ${backendUser.username}`);
            navigation.replace('Contacts');
          } else {
            throw error;
          }
        }
      }

    } catch (error: any) {
      console.error('❌ Verification error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 
        error.message || 
        'Verification failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.emoji}>📲</Text>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            {phoneNumber}
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
            maxLength={6}
            autoFocus
          />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>📡</Text>
          <Text style={styles.infoText}>
            {mode === 'login'
              ? 'Retrieving your account from server...'
              : 'Creating your account securely...'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Verifying...' : 'Verify & Continue'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.resendButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.resendText}>
            Didn't receive code? <Text style={styles.resendLink}>Resend</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default OTPVerifyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },

  header: {
    alignItems: 'center',
    marginBottom: 40,
  },

  emoji: {
    fontSize: 64,
    marginBottom: 16,
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
    textAlign: 'center',
    lineHeight: 22,
  },

  inputContainer: {
    marginBottom: 24,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: 8,
  },

  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'flex-start',
  },

  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },

  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#16A34A',
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

  resendButton: {
    alignItems: 'center',
  },

  resendText: {
    fontSize: 14,
    color: '#6B7280',
  },

  resendLink: {
    color: '#4A90E2',
    fontWeight: '600',
  },
});
