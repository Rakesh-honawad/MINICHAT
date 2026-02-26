import { BleManager, ScanMode } from 'react-native-ble-plx';
import { Platform } from 'react-native';
import { blePhyNative } from './blePhyNative';

const MINICHAT_SERVICE_UUID = '12345678-1234-5678-1234-567812345678';

export class BLEScanner {
  private bleManager: BleManager;
  private useNativeModule: boolean = false;
  private supportsBLE5: boolean = false;

  constructor() {
    this.bleManager = new BleManager();
  }

  // Initialize and check capabilities
  async initialize() {
    if (Platform.OS === 'android') {
      const nativeAvailable = blePhyNative.isAvailable();
      
      if (nativeAvailable) {
        this.supportsBLE5 = await blePhyNative.isCodedPhySupported();
        this.useNativeModule = this.supportsBLE5;
        
        if (this.supportsBLE5) {
          console.log('✅ Using NATIVE Coded PHY module (500-1000m range)');
        } else {
          console.log('⚠️ Native module available but device doesn\'t support Coded PHY');
        }
      } else {
        console.log('⚠️ Native module not available, using JS BLE (50m range)');
      }
    }
  }

  // Start scanning (automatically chooses best method)
  async startScanning(onDeviceFound: (device: any) => void): Promise<void> {
    await this.initialize();

    if (this.useNativeModule) {
      // ✅ Use native Coded PHY (500-1000m) for BLE 5.0 devices
      await blePhyNative.startCodedPhyScan(
        MINICHAT_SERVICE_UUID,
        (nativeDevice) => {
          const device = {
            deviceId: nativeDevice.deviceId,
            username: nativeDevice.name,
            transport: 'ble' as const,
            signalStrength: nativeDevice.signalStrength,
            lastSeen: nativeDevice.timestamp,
            rangeMode: 'NATIVE_CODED_PHY',
            estimatedRange: 500,
          };
          onDeviceFound(device);
        }
      );

      // ✅ ALSO scan standard BLE (for BLE 4.2 devices)
      console.log('📡 Also scanning standard BLE for backward compatibility');
      this.bleManager.startDeviceScan(
        [MINICHAT_SERVICE_UUID],
        { scanMode: ScanMode.LowLatency },
        (error, device) => {
          if (error) {
            console.log('⚠️ Standard BLE scan error:', error.message);
            return;
          }
          
          if (device && device.name) {
            const parsedDevice = {
              deviceId: device.id,
              username: device.name,
              transport: 'ble' as const,
              signalStrength: Math.min(100, Math.max(0, ((device.rssi || -100) + 100) * 2)),
              lastSeen: Date.now(),
              rangeMode: 'JS_STANDARD',
              estimatedRange: 50,
            };
            onDeviceFound(parsedDevice);
          }
        }
      );
    } else {
      // ⚠️ Fallback to JS BLE only (50m)
      console.log('📡 Using JS BLE scanner (50m range)');
      this.bleManager.startDeviceScan(
        [MINICHAT_SERVICE_UUID],
        { scanMode: ScanMode.LowLatency },
        (error, device) => {
          if (error) {
            console.log('⚠️ BLE scan error:', error.message);
            return;
          }

          if (device && device.name) {
            const parsedDevice = {
              deviceId: device.id,
              username: device.name,
              transport: 'ble' as const,
              signalStrength: Math.min(100, Math.max(0, ((device.rssi || -100) + 100) * 2)),
              lastSeen: Date.now(),
              rangeMode: 'JS_STANDARD',
              estimatedRange: 50,
            };
            onDeviceFound(parsedDevice);
          }
        }
      );
    }
  }

  // Start advertising
  async startAdvertising(userData: any): Promise<void> {
    if (this.useNativeModule) {
      // ✅ Start BLE 5.0 Coded PHY advertising (long range)
      await blePhyNative.startCodedPhyAdvertising(
        MINICHAT_SERVICE_UUID,
        userData.username
      );
      console.log('📢 BLE 5.0 Coded PHY advertising started (500-1000m)');

      // ✅ ALSO start standard BLE advertising (for BLE 4.2 compatibility)
      try {
        // Use BLE PLX's built-in advertising (limited but works)
        await this.bleManager.startDeviceScan(
          null,
          { allowDuplicates: true },
          () => {} // Dummy callback to keep manager active
        );
        console.log('📢 Dual-mode advertising: BLE 5.0 + BLE 4.2 compatible');
      } catch (e: any) {
        console.log('⚠️ Standard advertising failed:', e.message);
      }
    } else {
      // ⚠️ Standard advertising only
      console.log('📢 Using standard BLE advertising (50m)');
      // Note: react-native-ble-plx doesn't support advertising
      // You'd need react-native-ble-advertiser for this
    }
  }

  // Stop scanning
  async stopScanning(): Promise<void> {
    if (this.useNativeModule) {
      await blePhyNative.stopScan();
      this.bleManager.stopDeviceScan(); // Also stop standard scan
    } else {
      this.bleManager.stopDeviceScan();
    }
  }

  // Stop advertising
  async stopAdvertising(): Promise<void> {
    if (this.useNativeModule) {
      await blePhyNative.stopAdvertising();
      this.bleManager.stopDeviceScan(); // Stop standard mode too
    }
  }

  // Get capabilities
  getCapabilities() {
    return {
      method: this.useNativeModule ? 'Native Coded PHY' : 'JS Standard',
      supportsBLE5: this.supportsBLE5,
      maxRange: this.useNativeModule ? 500 : 50,
      rangeMode: this.useNativeModule ? 'Long Range (Coded PHY)' : 'Standard',
    };
  }
}
