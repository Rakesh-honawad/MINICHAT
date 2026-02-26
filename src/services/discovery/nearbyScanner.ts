export class NearbyScanner {
  private isScanning: boolean = false;

  async startScanning(onDeviceFound: (device: any) => void): Promise<void> {
    console.log('⏳ Nearby Connections not yet implemented');
    // Will implement in Phase 2.3
  }

  async stopScanning(): Promise<void> {
    this.isScanning = false;
  }

  // ✅ ADD THIS METHOD
  getCapabilities() {
    return {
      supported: false,
      maxRange: 100,
      maxSpeed: 0,
      method: 'Google Nearby Connections (Not Implemented)',
      powerConsumption: 'Medium',
      bestFor: 'Cross-platform (Android + iOS)',
    };
  }

  // ✅ ADD THIS METHOD
  getIsScanning(): boolean {
    return this.isScanning;
  }
}
