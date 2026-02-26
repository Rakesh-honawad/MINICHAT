import { NativeModules, NativeEventEmitter, Platform, PermissionsAndroid,Alert,
  Linking  } from "react-native";

const { BLEPhyModule } = NativeModules;

export interface BLEDevice {
  deviceId: string;
  name: string;
  address: string;
  rssi: number;
  signalStrength: number;
  timestamp: number;
}

class BLEPhyNative {
  private eventEmitter: NativeEventEmitter | null = null;
  private deviceFoundListener: any = null;
  private scanFailedListener: any = null;

  constructor() {
    if (Platform.OS === "android" && BLEPhyModule) {
      this.eventEmitter = new NativeEventEmitter(BLEPhyModule);
    }
  }

  /** Check if native module is available */
  isAvailable(): boolean {
    return Platform.OS === "android" && BLEPhyModule != null;
  }

  // ✅ ADD THIS NEW METHOD
  /** Request runtime BLE permissions (Android 12+) */
async requestPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  try {
    console.log('📋 Requesting BLE permissions...');

    const permissions: any[] = [];

    // Always need location for BLE
    permissions.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);

    if (Platform.Version >= 31) {
      // Android 12+ (API 31+)
      permissions.push(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      );
    }

    if (Platform.Version >= 33) {
      // Android 13+ (API 33+)
      permissions.push(PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES);
    }

    console.log('📋 Requesting permissions:', permissions);

    const granted = await PermissionsAndroid.requestMultiple(permissions);
    
    console.log('📋 Permission results:', granted);

    const allGranted = Object.values(granted).every(
      v => v === PermissionsAndroid.RESULTS.GRANTED
    );

    if (!allGranted) {
      console.log('⚠️ Some permissions denied');
      
      // Show which ones were denied
      Object.entries(granted).forEach(([perm, status]) => {
        if (status !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log(`   ❌ Denied: ${perm}`);
        }
      });

      Alert.alert(
        'Permissions Required',
        'Please grant Bluetooth and Location permissions for BLE to work.\n\nGo to Settings → Apps → MiniChat → Permissions',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
    }

    console.log('📡 BLE permissions:', allGranted ? 'Granted ✅' : 'Denied ❌');
    return allGranted;
  } catch (err) {
    console.error('❌ Permission error:', err);
    return false;
  }
}


  /** Check for BLE 5.0 Coded PHY support */
  async isCodedPhySupported(): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const result = await BLEPhyModule.isCodedPhySupported();
      console.log("📡 Coded PHY support:", result);
      return result;
    } catch (err) {
      console.error("❌ Error checking coded PHY:", err);
      return false;
    }
  }

  /** Start long-range (Coded PHY) Scan */
  async startCodedPhyScan(
    serviceUUID: string,
    onDeviceFound: (d: BLEDevice) => void
  ): Promise<boolean> {
    if (!this.isAvailable()) throw new Error("BLEPHY module not available");

    // ✅ ADD PERMISSION CHECK HERE
    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      console.error('❌ BLE permissions denied');
      return false;
    }

    this.clearListeners();

    try {
      this.deviceFoundListener = this.eventEmitter!.addListener(
        "BLEPhyDeviceFound",
        onDeviceFound
      );

      this.scanFailedListener = this.eventEmitter!.addListener(
        "BLEPhyScanFailed",
        (err) => console.error("❌ Native scan failed:", err)
      );

      await BLEPhyModule.startCodedPhyScan(serviceUUID);

      console.log("✅ Started BLE 5.0 Coded PHY Scan (500–1000m)");
      return true;
    } catch (err) {
      console.error("❌ Error starting coded PHY scan:", err);
      return false;
    }
  }

  /** Standard BLE 4.2 scan (fallback) */
  async startStandardScan(
    serviceUUID: string,
    onDeviceFound: (d: BLEDevice) => void
  ): Promise<boolean> {
    if (!this.isAvailable()) throw new Error("BLEPHY module not available");

    // ✅ ADD PERMISSION CHECK HERE
    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      console.error('❌ BLE permissions denied');
      return false;
    }

    this.clearListeners();

    try {
      this.deviceFoundListener = this.eventEmitter!.addListener(
        "BLEPhyDeviceFound",
        onDeviceFound
      );

      await BLEPhyModule.startStandardScan(serviceUUID);

      console.log("🔍 Started standard BLE scan (40–60m)");
      return true;
    } catch (err) {
      console.error("❌ Error starting standard scan:", err);
      return false;
    }
  }

  /** Stop scan */
  async stopScan(): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await BLEPhyModule.stopScan();
      console.log("⏹️ Scan stopped");
    } finally {
      this.clearListeners();
    }
  }

  /** Start long-range Advertising */
  async startCodedPhyAdvertising(
    serviceUUID: string,
    deviceName: string
  ): Promise<boolean> {
    if (!this.isAvailable()) throw new Error("BLEPHY module not available");

    // ✅ ADD PERMISSION CHECK HERE
    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      console.error('❌ BLE permissions denied');
      return false;
    }

    try {
      await BLEPhyModule.startCodedPhyAdvertising(serviceUUID, deviceName);
      console.log("📢 Started BLE Coded PHY Advertising (500–1000m)");
      return true;
    } catch (err) {
      console.error("❌ Error starting advertising:", err);
      return false;
    }
  }

  /** Stop advertising */
  async stopAdvertising(): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await BLEPhyModule.stopAdvertising();
      console.log("⏹️ Advertising stopped");
    } catch (err) {
      console.error("❌ Error stopping advertising:", err);
    }
  }

  /** Clean up listeners */
  private clearListeners() {
    if (this.deviceFoundListener) {
      this.deviceFoundListener.remove();
      this.deviceFoundListener = null;
    }
    if (this.scanFailedListener) {
      this.scanFailedListener.remove();
      this.scanFailedListener = null;
    }
  }
}

export const blePhyNative = new BLEPhyNative();
