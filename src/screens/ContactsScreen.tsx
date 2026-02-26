import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  GestureResponderEvent,
  RefreshControl,
  Alert,
  NativeModules,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Contact, RootStackParamList } from '../types/navigation';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as db from '../services/db';
import { discovery } from '../services/discovery';
import { Device, User } from '../types/models';


const ContactsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bleCapabilities, setBleCapabilities] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [nearbyDevices, setNearbyDevices] = useState(0);

  // On mount
  useEffect(() => {
    initializeScreen();
    testBLEModule(); // ✅ Test native module

    return () => {
      discovery.stopDiscovery();
    };
  }, []);

  // Reload when focused
  useFocusEffect(
    useCallback(() => { 
      loadContactsFromDB(); 
    }, [])
  );

  // ✅ TEST BLE MODULE
  const testBLEModule = async () => {
    console.log('🔍 ========== BLE MODULE TEST ==========');
    
    try {
      // Check if native module exists
      const hasBLEPhy = NativeModules.BLEPhyModule != null;
      console.log('1. Native BLEPhyModule loaded:', hasBLEPhy);
      
      if (hasBLEPhy) {
        // Check Coded PHY support
        const codedPhy = await NativeModules.BLEPhyModule.isCodedPhySupported();
        console.log('2. Coded PHY supported:', codedPhy);
        
        if (codedPhy) {
          console.log('✅ USING BLE 5.0 LONG RANGE (500-1000m)');
        } else {
          console.log('⚠️ BLE 5.0 not supported on this device');
          console.log('📡 Using standard BLE (50m)');
        }
      } else {
        console.log('❌ Native module NOT loaded');
        console.log('📡 Using JS BLE library (50m)');
      }
    } catch (error) {
      console.log('❌ Error testing BLE module:', error);
    }
    
    console.log('🔍 ====================================');
  };

  const initializeScreen = async () => {
    try {
      await db.openDatabase();
      
      // Get current user
      const user = await db.getUser();
      if (!user) {
        navigation.replace('Welcome');
        return;
      }
      setCurrentUser(user);
      console.log('👤 Current user:', user.username);

      // Add dummy contact for testing
      await db.addDummyContact();
      await loadContactsFromDB();

      // ✅ START BLE DISCOVERY
      await startBLEDiscovery(user);

      setLoading(false);
    } catch (error) {
      console.error('❌ Initialization error:', error);
      Alert.alert('Error', 'Failed to initialize');
      setLoading(false);
    }
  };

  // ✅ START BLE DISCOVERY
  const startBLEDiscovery = async (user: User) => {
    try {
      console.log('📡 Starting BLE discovery for:', user.username);

      // Start discovery service
    await discovery.startDiscovery({
      userId: user.userId || user.deviceId || user.id || '',  // ✅ Fallback chain
      username: user.username || 'Unknown',                    // ✅ Provide default
      publicKey: user.publicKey || '',
    });

      // Get capabilities
      const caps = discovery.getCapabilities();
      setBleCapabilities(caps);
      setIsScanning(true);

      console.log('📊 BLE Capabilities:', JSON.stringify(caps, null, 2));

      // Listen for new devices
      discovery.on('deviceFound', handleDeviceFound);

      // Update nearby devices count
      const devices = await db.getDevices();
      setNearbyDevices(devices.length);

    } catch (error) {
      console.error('❌ Discovery start error:', error);
    }
  };

  // Handle new device found
  const handleDeviceFound = async (device: Device) => {
    console.log('🔔 Device found:', device.username, '- Signal:', device.signalStrength + '%');
    await loadContactsFromDB();
    
    // Update nearby devices count
    const devices = await db.getDevices();
    setNearbyDevices(devices.length);
  };

  // Load contacts from DB
  const loadContactsFromDB = async () => {
    try {
      const allContacts: Contact[] = await db.getContacts();
      console.log('📇 Loaded contacts:', allContacts.length);
      setContacts(allContacts || []);
    } catch (error) {
      console.error('❌ Failed to load contacts:', error);
      setContacts([]);
    }
  };

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadContactsFromDB();
    const devices = await db.getDevices();
    setNearbyDevices(devices.length);
    setRefreshing(false);
  };

  // Search logic
  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Navigation helpers
  const openChat = (contact: Contact) => {
    navigation.navigate('Chat', { contact });
  };
  const openContactProfile = (contact: Contact) => {
    navigation.navigate('ContactProfile', { contact });
  };
  const openUserProfile = () => {
    navigation.navigate('UserProfile');
  };
  const onAvatarPress = (e: GestureResponderEvent, contact: Contact) => {
    e.stopPropagation();
    openContactProfile(contact);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ BLE STATUS BANNER */}
      {bleCapabilities?.ble && (
        <View style={[
          styles.bleBanner,
          { backgroundColor: bleCapabilities.ble.supportsBLE5 ? '#10B981' : '#F59E0B' }
        ]}>
          <Text style={styles.bleBannerText}>
            {bleCapabilities.ble.supportsBLE5 ? '🚀' : '📡'} 
            {' '}{bleCapabilities.ble.rangeMode || 'Standard'} Mode
          </Text>
          <Text style={styles.bleBannerSubtext}>
            Range: {bleCapabilities.ble.maxRange}m
            {isScanning && ' • Scanning...'}
            {nearbyDevices > 0 && ` • ${nearbyDevices} nearby`}
          </Text>
        </View>
      )}

      {/* TOP BAR */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.title}>Minichat</Text>
        </View>

        <TouchableOpacity onPress={openUserProfile} style={styles.userBlock}>
          <View style={styles.userAvatar}>
            <Text style={{ color: '#fff', fontSize: 16 }}>
              {currentUser?.username?.charAt(0) || 'Y'}
            </Text>
          </View>
          <Text style={styles.userNameSmall}>
            {currentUser?.username || 'You'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <TextInput
        style={styles.search}
        placeholder="Search contacts..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#9CA3AF"
      />

      {/* ✅ TEST BUTTON (Remove in production) */}
      <TouchableOpacity 
        style={styles.testButton}
        onPress={async () => {
          console.log('🧪 Manual test triggered');
          await testBLEModule();
          await onRefresh();
        }}
      >
        <Text style={styles.testButtonText}>
          🧪 Test BLE Discovery
        </Text>
      </TouchableOpacity>
      {/* ✅ SIMULATION CONTROLS - Add this after testButton, before FlatList */}
<View style={styles.simulationSection}>
  <Text style={styles.sectionTitle}>🧪 Device Simulation</Text>
  
  {/* Simulate Device Found */}
  <TouchableOpacity 
    style={[styles.simButton, { backgroundColor: '#10B981' }]}
    onPress={async () => {
      const testDevice = {
        deviceId: `BLE:${Math.random().toString(36).substr(2, 9)}`,
        username: `User-${Math.floor(Math.random() * 999)}`,
        transport: 'ble' as const,
        signalStrength: 70 + Math.floor(Math.random() * 30),
        lastSeen: Date.now(),
        isConnected: false,
      };
      
      await db.saveDevice(testDevice);
      console.log('✅ Simulated device:', testDevice.username, 
                  'Signal:', testDevice.signalStrength + '%');
      
      const devices = await db.getDevices();
      setNearbyDevices(devices.length);
    }}
  >
    <Text style={styles.simButtonText}>📡 Add Random Device</Text>
  </TouchableOpacity>

  {/* View All Devices */}
  <TouchableOpacity 
    style={[styles.simButton, { backgroundColor: '#3B82F6' }]}
    onPress={async () => {
      const devices = await db.getDevices();
      console.log('📟 ========== NEARBY DEVICES ==========');
      devices.forEach((d, i) => {
        console.log(`${i + 1}. ${d.username}`);
        console.log(`   ID: ${d.deviceId}`);
        console.log(`   Signal: ${d.signalStrength}%`);
        console.log(`   Last: ${new Date(d.lastSeen).toLocaleTimeString()}`);
      });
      console.log(`📟 Total: ${devices.length} devices`);
      console.log('📟 ===================================');
      
      setNearbyDevices(devices.length);
    }}
  >
    <Text style={styles.simButtonText}>
      📋 View Devices ({nearbyDevices})
    </Text>
  </TouchableOpacity>

  {/* Simulate 5 Devices */}
  <TouchableOpacity 
    style={[styles.simButton, { backgroundColor: '#8B5CF6' }]}
    onPress={async () => {
      const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
      
      for (const name of names) {
        await db.saveDevice({
          deviceId: `BLE:${Math.random().toString(36).substr(2, 9)}`,
          username: name,
          transport: 'ble' as const,
          signalStrength: 50 + Math.floor(Math.random() * 50),
          lastSeen: Date.now(),
          isConnected: Math.random() > 0.5,
        });
      }
      
      const devices = await db.getDevices();
      setNearbyDevices(devices.length);
      console.log('🎭 Added 5 test devices! Total:', devices.length);
    }}
  >
    <Text style={styles.simButtonText}>🎭 Add 5 Devices</Text>
  </TouchableOpacity>

  {/* Clear All */}
  <TouchableOpacity 
    style={[styles.simButton, { backgroundColor: '#EF4444' }]}
    onPress={async () => {
      await db.clearDevices();
      setNearbyDevices(0);
      console.log('🗑️ All devices cleared');
    }}
  >
    <Text style={styles.simButtonText}>🗑️ Clear All</Text>
  </TouchableOpacity>
</View>

{/* CONTACTS LIST - This stays the same */}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => openChat(item)} activeOpacity={0.8}>
            {/* Avatar */}
            <TouchableOpacity style={styles.avatar} activeOpacity={0.7} onPress={(e) => onAvatarPress(e, item)}>
              {item.avatarUri ? (
                <Image source={{ uri: item.avatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
              )}
            </TouchableOpacity>

            {/* Info */}
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.phone}>{item.phone}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4A90E2"
            colors={['#4A90E2']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>
              {isScanning ? '🔍' : '📡'}
            </Text>
            <Text style={styles.emptyText}>
              {isScanning ? 'Scanning for devices...' : 'No contacts found'}
            </Text>
            <Text style={styles.emptySubtext}>
              {bleCapabilities?.ble?.supportsBLE5 
                ? 'Using long-range BLE (500-1000m)'
                : 'Using standard BLE (50m)'}
            </Text>
            <Text style={styles.emptySubtext}>
              Pull down to refresh or tap test button
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default ContactsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },

  // ✅ BLE Banner styles
  bleBanner: {
    padding: 12,
    alignItems: 'center',
  },

  bleBannerText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  bleBannerSubtext: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.9,
  },

  // ✅ Test button styles
  testButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    alignItems: 'center',
  },

  testButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4A90E2',
  },

  userBlock: {
    alignItems: 'center',
  },

  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  userNameSmall: {
    marginTop: 4,
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },

  search: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },

  info: {
    flex: 1,
    marginLeft: 12,
  },

  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },

  phone: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },

  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },

  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
  //simulation sectuon sylts
  simulationSection: {
  marginHorizontal: 16,
  marginBottom: 16,
  padding: 16,
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 3,
  elevation: 2,
},

sectionTitle: {
  fontSize: 13,
  fontWeight: '700',
  color: '#6B7280',
  marginBottom: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
},

simButton: {
  padding: 12,
  borderRadius: 8,
  marginBottom: 8,
  alignItems: 'center',
},

simButtonText: {
  color: '#FFFFFF',
  fontSize: 13,
  fontWeight: '600',
},


});
// At the top of ContactsScreen.tsx
const __DEV__ = true;  // ✅ Set to false for production

// Then wrap the simulation section:
{__DEV__ && (
  <View style={styles.simulationSection}>
    <Text style={styles.sectionTitle}>🧪 Device Simulation</Text>
    {/* All your simulation buttons */}
  </View>
)}

