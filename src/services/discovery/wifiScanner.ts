import { PermissionsAndroid, Platform, DeviceEventEmitter, Alert, Linking, NativeModules } from 'react-native';

// ✅ Import native WiFi P2P module
const { WiFiP2PModule } = NativeModules;

let wifi: any = null;
try {
  wifi = require('rn-wifi-p2p');
} catch (e) {
  console.log('⚠️ rn-wifi-p2p module not available');
}

export class WiFiScanner {
  private isScanning = false;
  private isConnected = false;
  private peersListener: any = null;
  private connectionListener: any = null;
  private deviceListener: any = null;

  private isModuleAvailable(): boolean {
    return wifi !== null;
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;

    try {
      console.log('📋 Requesting WiFi Direct permissions...');

      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ];

      if (Platform.Version >= 33) {
        permissions.push(PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES);
      }

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      const allGranted = Object.values(granted).every(
        v => v === PermissionsAndroid.RESULTS.GRANTED
      );

      console.log('📡 WiFi Direct permissions:', allGranted ? 'Granted ✅' : 'Denied ❌');
      return allGranted;
    } catch (err) {
      console.error('❌ Permission error:', err);
      return false;
    }
  }

  async checkLocationEnabled(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const locationGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      if (!locationGranted) {
        Alert.alert(
          'Location Required',
          'WiFi Direct requires location services. Please enable location permission.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => Linking.openSettings() 
            },
          ]
        );
        return false;
      }

      console.log('✅ Location permission granted');
      return true;
    } catch (err) {
      console.error('❌ Location check error:', err);
      return false;
    }
  }

  async initialize(): Promise<boolean> {
    console.log('🔍 ========== WIFI DIRECT INIT ==========');

    try {
      if (Platform.OS !== 'android') {
        console.log('❌ WiFi Direct only works on Android');
        return false;
      }

      const ok = await this.requestPermissions();
      if (!ok) {
        console.log('❌ Permissions denied');
        return false;
      }

      const locationOk = await this.checkLocationEnabled();
      if (!locationOk) {
        console.log('❌ Location services disabled');
        return false;
      }

      // ✅ Initialize native module FIRST
      if (WiFiP2PModule) {
        try {
          await WiFiP2PModule.initialize();
          console.log('✅ Native WiFi P2P Module initialized (BroadcastReceiver registered)');
        } catch (error: any) {
          console.error('❌ Native module init error:', error);
        }
      } else {
        console.log('⚠️ WiFiP2PModule not available');
      }

      // Then initialize rn-wifi-p2p (if available)
      if (this.isModuleAvailable() && wifi.initialize) {
        wifi.initialize();
        console.log('⚙️ rn-wifi-p2p module initialized');
        
        await new Promise(res => setTimeout(() => res(undefined), 300));
        console.log('⏳ Android receiver binding complete');
      }

      console.log('✅ WiFi Direct initialized successfully');
      console.log('🔍 =====================================');
      return true;

    } catch (error: any) {
      console.error('❌ WiFi Direct init error:', error.message);
      console.log('🔍 =====================================');
      return false;
    }
  }

async startScanning(onDeviceFound: (device: any) => void): Promise<void> {
  console.log('📡 ========== WIFI DIRECT SCANNING START ==========');

  if (this.isScanning) {
    console.log('⚠️ Already scanning');
    return;
  }

  const ready = await this.initialize();
  if (!ready) {
    console.log('❌ WiFi Direct init failed');
    return;
  }

  try {
    // ✅ CRITICAL FIX: Stop any existing discovery BEFORE registering listeners
    if (WiFiP2PModule) {
      try {
        await WiFiP2PModule.stopDiscovery();
        console.log('⏹️ Stopped any existing native discovery');
      } catch (err) {
        console.log('ℹ️ No previous discovery to stop');
      }
    }

    if (wifi?.stopDiscoveringPeers) {
      try {
        await wifi.stopDiscoveringPeers();
        console.log('⏹️ Stopped any existing rn-wifi-p2p discovery');
      } catch (err) {
        console.log('ℹ️ No previous rn-wifi-p2p discovery to stop');
      }
    }

    // ✅ Add small delay to let system clean up
    await new Promise(res => setTimeout(res, 500));

    // Remove old listeners
    if (this.peersListener) {
      this.peersListener.remove();
    }
    if (this.connectionListener) {
      this.connectionListener.remove();
    }
    if (this.deviceListener) {
      this.deviceListener.remove();
    }

    console.log('📡 Registering WiFi P2P event listeners...');
    
    this.peersListener = DeviceEventEmitter.addListener(
      'WIFI_P2P_PEERS_UPDATED',
      (event: any) => {
        console.log('📡 ✅✅✅ WIFI_P2P_PEERS_UPDATED event received:', event);
        const peers = event?.devices || [];
        console.log(`📡 WiFi Direct peers found: ${peers.length}`);

        if (Array.isArray(peers) && peers.length > 0) {
          peers.forEach((peer: any) => {
            console.log(`   ➡️ ${peer.deviceName} (${peer.deviceAddress})`);

            const device = {
              deviceId: peer.deviceAddress || `wifi_${Date.now()}`,
              username: peer.deviceName || 'WiFi Direct Device',
              transport: 'wifi' as const,
              signalStrength: 75,
              lastSeen: Date.now(),
              isConnected: peer.status === 0 || peer.isGroupOwner,
              wifiMetadata: {
                status: peer.status,
                primaryDeviceType: peer.primaryDeviceType,
                secondaryDeviceType: peer.secondaryDeviceType,
                isGroupOwner: peer.isGroupOwner,
              },
            };

            onDeviceFound(device);
          });
        } else {
          console.log('   ℹ️ No peers available yet');
        }
      }
    );

    this.connectionListener = DeviceEventEmitter.addListener(
      'WIFI_P2P_CONNECTION_CHANGED',
      (info: any) => {
        console.log('📊 ✅✅✅ WIFI_P2P_CONNECTION_CHANGED event received:', info);
        if (info?.groupFormed) {
          this.isConnected = true;
          console.log('🤝 WiFi Direct group formed!');
        } else {
          this.isConnected = false;
        }
      }
    );

    this.deviceListener = DeviceEventEmitter.addListener(
      'WIFI_P2P_THIS_DEVICE_CHANGED',
      (device: any) => {
        console.log('📱 ✅✅✅ WIFI_P2P_THIS_DEVICE_CHANGED event:', device);
      }
    );

    console.log('✅ Event listeners registered');

    // ✅ Use NATIVE module for discovery
    let started = false;

    if (WiFiP2PModule) {
      console.log('➡️ Using native WiFiP2PModule.startDiscovery()');
      try {
        await WiFiP2PModule.startDiscovery();
        started = true;
        console.log('✅ Native discovery started');
      } catch (err: any) {
        console.error('❌ Native discovery failed:', err.message);
        
        // If "Busy", wait and retry once
        if (err.message?.includes('Busy')) {
          console.log('⏳ Waiting 2s and retrying...');
          await new Promise(res => setTimeout(res, 2000));
          
          try {
            await WiFiP2PModule.startDiscovery();
            started = true;
            console.log('✅ Native discovery started (retry success)');
          } catch (retryErr: any) {
            console.error('❌ Retry also failed:', retryErr.message);
          }
        }
      }
    }

    if (!started) {
      console.log('❌ WiFi Direct discovery could not start');
      console.log('ℹ️ BLE 5.0 is still working fine!');
    } else {
      this.isScanning = true;
      console.log('✅ WiFi Direct scanning started successfully!');
      console.log('   Range: ~200m');
      console.log('   Speed: Up to 250 Mbps');
      console.log('   Waiting for peer discovery events...');
    }

    console.log('📡 ================================================');

  } catch (err: any) {
    console.error('❌ WiFi scan error:', err.message);
    console.error('   Stack:', err.stack);
    this.isScanning = false;
  }
}


  async stopScanning(): Promise<void> {
    if (!this.isScanning) return;

    try {
      // Stop native module discovery
      if (WiFiP2PModule) {
        try {
          await WiFiP2PModule.stopDiscovery();
          console.log('⏹ Native discovery stopped');
        } catch (err) {
          console.log('⚠️ Native stop failed (might not be running)');
        }
      }

      // Stop rn-wifi-p2p discovery
      if (wifi) {
        if (wifi.stopDiscoveringPeers) {
          await wifi.stopDiscoveringPeers();
        } else if (wifi.stopPeerDiscovery) {
          await wifi.stopPeerDiscovery();
        }
      }

      // Remove listeners
      if (this.peersListener) {
        this.peersListener.remove();
        this.peersListener = null;
      }
      if (this.connectionListener) {
        this.connectionListener.remove();
        this.connectionListener = null;
      }
      if (this.deviceListener) {
        this.deviceListener.remove();
        this.deviceListener = null;
      }

      this.isScanning = false;
      console.log('⏹ WiFi Direct scanning stopped');
    } catch (err) {
      console.error('❌ Stop error:', err);
    }
  }

  async connectToPeer(deviceAddress: string): Promise<boolean> {
    if (!wifi) return false;
    try {
      console.log('🔗 Connecting to:', deviceAddress);
      await wifi.connect(deviceAddress);
      console.log('✅ Connection initiated');
      return true;
    } catch (err) {
      console.error('❌ Connect error:', err);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected || !wifi) return;
    try {
      await wifi.removeGroup();
      this.isConnected = false;
      console.log('⏹ Disconnected from WiFi Direct');
    } catch (err) {
      console.error('❌ Disconnect error:', err);
    }
  }

  getCapabilities() {
    return {
      supported: WiFiP2PModule != null || this.isModuleAvailable(),
      maxRange: 200,
      maxSpeed: 250,
      method: 'WiFi Direct P2P',
      powerConsumption: 'High',
      bestFor: 'File transfer, offline chat, media sharing',
    };
  }

  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    if (!WiFiP2PModule && !this.isModuleAvailable()) return false;

    try {
      const result = await this.initialize();
      return result;
    } catch (error) {
      return false;
    }
  }

  getIsScanning(): boolean {
    return this.isScanning;
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  async getConnectionInfo() {
    if (!wifi) return null;
    try {
      return await wifi.getConnectionInfo();
    } catch (error) {
      return null;
    }
  }
}
