import { EventEmitter } from 'events';
import { BLEScanner } from './bleScanner';
import { WiFiScanner } from './wifiScanner';
import { NearbyScanner } from './nearbyScanner';
import { Device, DiscoveryEvent } from '../../types/models';
import * as db from '../db';

class DeviceDiscovery {
  private bleScanner: BLEScanner;
  private wifiScanner: WiFiScanner;
  private nearbyScanner: NearbyScanner;
  private eventEmitter: EventEmitter;
  private discoveredDevices: Map<string, Device> = new Map();
  private isScanning: boolean = false;

  constructor() {
    this.bleScanner = new BLEScanner();
    this.wifiScanner = new WiFiScanner();
    this.nearbyScanner = new NearbyScanner();
    this.eventEmitter = new EventEmitter();
  }

  // ✅ ADD THIS - Start discovery with user data
async startDiscovery(userData: {
  userId: string;
  username?: string;
  publicKey?: string;
}): Promise<void> {
  if (this.isScanning) {
    console.log('⚠️ Already scanning');
    return;
  }

  const username = userData.username || 'Unknown';
  
  console.log('📡 Starting multi-transport discovery...');
  this.isScanning = true;

  try {
    // 1. BLE 5.0 (Long range, low power)
    await this.bleScanner.initialize();
    await this.bleScanner.startAdvertising({ ...userData, username });
    await this.bleScanner.startScanning((device) => this.handleDeviceFound(device));
    console.log('✅ BLE 5.0: Active (500-1000m, 2 Mbps)');

    // 2. WiFi Direct (Medium range, high speed)
    const wifiAvailable = await this.wifiScanner.isAvailable();
    if (wifiAvailable) {
      await this.wifiScanner.startScanning((device) => this.handleDeviceFound(device));
      console.log('✅ WiFi Direct: Active (200m, 250 Mbps)');
    } else {
      console.log('⚠️ WiFi Direct: Not available');
    }

    console.log('✅ Discovery started successfully');
  } catch (error) {
    console.error('❌ Discovery error:', error);
    this.isScanning = false;
  }
}



  // Start all scanners (keep your existing method)
  async startScanning(): Promise<void> {
    if (this.isScanning) {
      console.log('⚠️ Already scanning');
      return;
    }

    console.log('📡 Starting device discovery...');
    this.isScanning = true;

    try {
      // Run all scanners in parallel
      await Promise.all([
        this.bleScanner.startScanning((device) => this.handleDeviceFound(device)),
        this.wifiScanner.startScanning((device) => this.handleDeviceFound(device)),
        this.nearbyScanner.startScanning((device) => this.handleDeviceFound(device)),
      ]);

      console.log('✅ All scans completed');
      this.isScanning = false;
    } catch (error) {
      console.error('❌ Discovery error:', error);
      this.isScanning = false;
    }
  }

  // ✅ RENAME THIS - Stop all discovery
  async stopDiscovery(): Promise<void> {
    if (!this.isScanning) return;

    console.log('🛑 Stopping all discovery');
    this.isScanning = false;

    try {
      await Promise.all([
        this.bleScanner.stopScanning(),
        this.bleScanner.stopAdvertising(),
        this.wifiScanner.stopScanning(),
        this.nearbyScanner.stopScanning(),
      ]);
      console.log('⏹️ Discovery stopped');
    } catch (error) {
      console.error('❌ Error stopping discovery:', error);
    }
  }

  // Keep your existing stopScanning for backward compatibility
  async stopScanning(): Promise<void> {
    await this.stopDiscovery();
  }

  // Handle discovered device
  private async handleDeviceFound(device: Device): Promise<void> {
    try {
      // Skip if already discovered
      if (this.discoveredDevices.has(device.deviceId)) {
        return;
      }

      console.log('✅ Device found:', device.username, `(${device.transport})`);

      // Add to map
      this.discoveredDevices.set(device.deviceId, device);

      // Save to database
      await db.saveDevice(device);

      // Emit event
      this.eventEmitter.emit('deviceFound', {
        type: 'deviceFound',
        device,
      } as DiscoveryEvent);
    } catch (error) {
      console.error('❌ Error handling device:', error);
    }
  }

  // ✅ ADD THIS - Get capabilities
  getCapabilities() {
    return {
      ble: this.bleScanner.getCapabilities(),
      wifi: this.wifiScanner.getCapabilities(),
      nearby: this.nearbyScanner.getCapabilities(),
    };
  }

  // Get discovered devices
  getDiscoveredDevices(): Device[] {
    return Array.from(this.discoveredDevices.values());
  }

  // Clear devices
  clearDevices(): void {
    this.discoveredDevices.clear();
    console.log('🗑️ Cleared discovered devices');
  }

  // Event listeners
  on(event: string, listener: (data: any) => void): void {
    this.eventEmitter.on(event, listener);
  }

  off(event: string, listener: (data: any) => void): void {
    this.eventEmitter.off(event, listener);
  }

  // Check if scanning
  getIsScanning(): boolean {
    return this.isScanning;
  }
}

// Export singleton instance
export const discovery = new DeviceDiscovery();

export const startDeviceDiscovery = async () => {
  await discovery.startScanning();
};

export const stopDeviceDiscovery = async () => {
  await discovery.stopScanning();
};

export const onDeviceFound = (callback: (device: Device) => void) => {
  discovery.on('deviceFound', (event: DiscoveryEvent) => {
    callback(event.device);
  });
};

export const getDiscoveredDevices = () => {
  return discovery.getDiscoveredDevices();
};
