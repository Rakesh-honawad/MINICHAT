package com.minichat.ble;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanFilter;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.bluetooth.le.AdvertiseCallback;
import android.bluetooth.le.AdvertiseData;
import android.bluetooth.le.AdvertiseSettings;
import android.bluetooth.le.BluetoothLeAdvertiser;
import android.os.Build;
import android.os.ParcelUuid;
import android.util.Log;

import androidx.annotation.RequiresApi;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.ArrayList;
import java.util.List;

public class BLEPhyModule extends ReactContextBaseJavaModule {

    private static final String TAG = "BLEPhyModule";
    private static final String EVENT_DEVICE_FOUND = "BLE_DEVICE_DISCOVERED";
    private static final String EVENT_SCAN_FAILED = "BLEPhyScanFailed";

    private final ReactApplicationContext reactContext;
    private BluetoothLeScanner scanner;
    private BluetoothLeAdvertiser advertiser;
    private ScanCallback scanCallback;
    private AdvertiseCallback advertiseCallback;
    private AdvertiseCallback standardAdvertiseCallback;
    private boolean isScanning = false;
    private boolean isAdvertising = false;

    public BLEPhyModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;

        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter != null) {
            scanner = adapter.getBluetoothLeScanner();
            advertiser = adapter.getBluetoothLeAdvertiser();
        }
    }

    @Override
    public String getName() {
        return "BLEPhyModule";
    }

    @ReactMethod
    public void isCodedPhySupported(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
                boolean supported = adapter != null && adapter.isLeCodedPhySupported();
                Log.d(TAG, "📡 Coded PHY support: " + supported);
                promise.resolve(supported);
                return;
            }
            Log.d(TAG, "📡 Coded PHY support: false (API < 26)");
            promise.resolve(false);
        } catch (Exception e) {
            Log.e(TAG, "Error checking coded PHY", e);
            promise.resolve(false);
        }
    }

    // ======================== SCANNING ========================

    @ReactMethod
    public void startCodedPhyScan(String serviceUUID, Promise promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            promise.reject("UNSUPPORTED", "Coded PHY requires Android 8.0+");
            return;
        }

        if (isScanning) {
            Log.w(TAG, "⚠️ Scan already running");
            promise.resolve(true);
            return;
        }

        if (scanner == null) {
            promise.reject("NO_SCANNER", "Bluetooth scanner unavailable");
            return;
        }

        try {
            List<ScanFilter> filters = new ArrayList<>();
            if (serviceUUID != null && !serviceUUID.isEmpty()) {
                filters.add(
                    new ScanFilter.Builder()
                        .setServiceUuid(ParcelUuid.fromString(serviceUUID))
                        .build()
                );
            }

            ScanSettings settings = new ScanSettings.Builder()
                .setLegacy(false)
                .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
                .setPhy(BluetoothDevice.PHY_LE_CODED)
                .build();

            scanCallback = new ScanCallback() {
                @Override
                public void onScanResult(int type, ScanResult result) {
                    handleScanResult(result);
                }

                @Override
                public void onBatchScanResults(List<ScanResult> results) {
                    for (ScanResult r : results) {
                        handleScanResult(r);
                    }
                }

                @Override
                public void onScanFailed(int errorCode) {
                    Log.e(TAG, "❌ Coded PHY scan failed: " + errorCode);
                    WritableMap map = Arguments.createMap();
                    map.putInt("errorCode", errorCode);
                    sendEvent(EVENT_SCAN_FAILED, map);
                    isScanning = false;
                }
            };

            scanner.startScan(filters, settings, scanCallback);
            isScanning = true;

            Log.d(TAG, "✅ Started BLE 5.0 Coded PHY Scan (500–1000m)");
            promise.resolve(true);

        } catch (Exception e) {
            Log.e(TAG, "Scan start error", e);
            promise.reject("SCAN_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopScan(Promise promise) {
        if (!isScanning || scanCallback == null) {
            promise.resolve(false);
            return;
        }

        try {
            scanner.stopScan(scanCallback);
            scanCallback = null;
            isScanning = false;
            Log.d(TAG, "⏹ Scan stopped");
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("STOP_ERROR", e.getMessage());
        }
    }

    // ======================== ADVERTISING ========================

    @ReactMethod
    public void startCodedPhyAdvertising(String serviceUUID, String deviceName, Promise promise) {
        if (isAdvertising) {
            Log.w(TAG, "⚠️ Already advertising");
            promise.resolve(true);
            return;
        }

        if (advertiser == null) {
            promise.reject("NO_ADVERTISER", "No advertiser available");
            return;
        }

        try {
            // ✅ Start STANDARD BLE advertising (compatible with ALL devices)
            startStandardAdvertising(serviceUUID);

            isAdvertising = true;
            Log.d(TAG, "📢 Started BLE advertising (all devices compatible)");
            promise.resolve(true);

        } catch (Exception e) {
            Log.e(TAG, "Advertise error", e);
            promise.reject("ADVERTISE_ERROR", e.getMessage());
        }
    }

    // ✅ Standard BLE advertising (50m range - BLE 4.2 compatible)
    private void startStandardAdvertising(String serviceUUID) {
        AdvertiseSettings settings = new AdvertiseSettings.Builder()
            .setConnectable(false)
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .setTimeout(0)
            .build();

        AdvertiseData data = new AdvertiseData.Builder()
            .setIncludeDeviceName(true)
            .addServiceUuid(ParcelUuid.fromString(serviceUUID))
            .build();

        standardAdvertiseCallback = new AdvertiseCallback() {
            @Override
            public void onStartSuccess(AdvertiseSettings settingsInEffect) {
                Log.d(TAG, "✅ Standard BLE advertising started (50m range)");
            }

            @Override
            public void onStartFailure(int errorCode) {
                Log.e(TAG, "❌ Standard advertising failed: " + errorCode);
            }
        };

        advertiser.startAdvertising(settings, data, standardAdvertiseCallback);
    }

    @ReactMethod
    public void stopAdvertising(Promise promise) {
        if (!isAdvertising) {
            promise.resolve(false);
            return;
        }

        try {
            // Stop standard advertising
            if (standardAdvertiseCallback != null) {
                advertiser.stopAdvertising(standardAdvertiseCallback);
                standardAdvertiseCallback = null;
                Log.d(TAG, "⏹ Standard advertising stopped");
            }

            // Stop Coded PHY advertising
            if (advertiseCallback != null) {
                advertiser.stopAdvertising(advertiseCallback);
                advertiseCallback = null;
                Log.d(TAG, "⏹ Coded PHY advertising stopped");
            }

            isAdvertising = false;
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("STOP_ERROR", e.getMessage());
        }
    }

    // ======================== HELPERS ========================

    private void handleScanResult(ScanResult result) {
        BluetoothDevice device = result.getDevice();
        if (device == null || device.getName() == null) return;

        WritableMap map = Arguments.createMap();
        map.putString("deviceId", device.getAddress());
        map.putString("name", device.getName());
        map.putString("address", device.getAddress());
        map.putInt("rssi", result.getRssi());
        map.putInt("signalStrength", calculateSignalStrength(result.getRssi()));
        map.putDouble("timestamp", System.currentTimeMillis());

        sendEvent(EVENT_DEVICE_FOUND, map);
    }

    private int calculateSignalStrength(int rssi) {
        return Math.min(100, Math.max(0, (rssi + 100) * 2));
    }

    private void sendEvent(String event, WritableMap map) {
        if (reactContext.hasActiveCatalystInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(event, map);
        }
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Required by React Native
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Required by React Native
    }
}
