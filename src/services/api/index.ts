import axios from 'axios';

// ⭐ Change this to your backend URL
const API_BASE_URL = 'http://10.182.17.144:3000/api'; // e.g., http://192.168.1.100:3000/api

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const registerUser = async (data: {
  username: string;
  phoneNumber: string;
}) => {
  try {
    console.log('📤 Registering user:', data.phoneNumber);
    const response = await apiClient.post('/auth/register', {
      username: data.username,
      phoneNumber: data.phoneNumber,
      deviceId: `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
    console.log('✅ Registration successful');
    return response.data;
  } catch (error: any) {
    console.error('❌ Registration failed:', error.response?.data || error.message);
    throw error;
  }
};

export const loginUser = async (phoneNumber: string) => {
  try {
    console.log('📤 Logging in:', phoneNumber);
    const response = await apiClient.post('/auth/login', { phoneNumber });
    console.log('✅ Login successful');
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log('⚠️ User not found');
      return null;
    }
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to get profile:', error.message);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, data: any) => {
  try {
    const response = await apiClient.put(`/users/${userId}`, data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to update profile:', error.message);
    throw error;
  }
};
