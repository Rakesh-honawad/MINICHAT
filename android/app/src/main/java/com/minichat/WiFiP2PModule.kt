package com.minichat

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.wifi.p2p.WifiP2pDevice
import android.net.wifi.p2p.WifiP2pDeviceList
import android.net.wifi.p2p.WifiP2pManager
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule

class WiFiP2PModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {

    private var wifiP2pManager: WifiP2pManager? = null
    private var wifiP2pChannel: WifiP2pManager.Channel? = null
    private var wifiP2pReceiver: WiFiP2PBroadcastReceiver? = null
    private var intentFilter: IntentFilter? = null

    override fun getName(): String = "WiFiP2PModule"

    @ReactMethod
    fun initialize(promise: Promise) {
        try {
            wifiP2pManager = reactApplicationContext.getSystemService(Context.WIFI_P2P_SERVICE) as? WifiP2pManager
            
            if (wifiP2pManager == null) {
                promise.reject("ERROR", "WiFi P2P not available")
                return
            }

            wifiP2pChannel = wifiP2pManager?.initialize(reactApplicationContext, reactApplicationContext.mainLooper, null)

            intentFilter = IntentFilter().apply {
                addAction(WifiP2pManager.WIFI_P2P_STATE_CHANGED_ACTION)
                addAction(WifiP2pManager.WIFI_P2P_PEERS_CHANGED_ACTION)
                addAction(WifiP2pManager.WIFI_P2P_CONNECTION_CHANGED_ACTION)
                addAction(WifiP2pManager.WIFI_P2P_THIS_DEVICE_CHANGED_ACTION)
            }

            wifiP2pReceiver = WiFiP2PBroadcastReceiver(wifiP2pManager, wifiP2pChannel, reactApplicationContext)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                reactApplicationContext.registerReceiver(wifiP2pReceiver, intentFilter, Context.RECEIVER_EXPORTED)
            } else {
                reactApplicationContext.registerReceiver(wifiP2pReceiver, intentFilter)
            }

            Log.d("WiFiP2PModule", "✅ Initialized and registered receiver")
            promise.resolve("Initialized")
        } catch (e: Exception) {
            Log.e("WiFiP2PModule", "❌ Init error: ${e.message}")
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun startDiscovery(promise: Promise) {
        try {
            wifiP2pManager?.discoverPeers(wifiP2pChannel, object : WifiP2pManager.ActionListener {
                override fun onSuccess() {
                    Log.d("WiFiP2PModule", "✅ Discovery started successfully")
                    promise.resolve("Discovery started")
                }

                override fun onFailure(reasonCode: Int) {
                    val reason = when (reasonCode) {
                        WifiP2pManager.ERROR -> "Internal error"
                        WifiP2pManager.P2P_UNSUPPORTED -> "P2P unsupported"
                        WifiP2pManager.BUSY -> "Busy"
                        else -> "Unknown error: $reasonCode"
                    }
                    Log.e("WiFiP2PModule", "❌ Discovery failed: $reason")
                    promise.reject("ERROR", reason)
                }
            })
        } catch (e: Exception) {
            Log.e("WiFiP2PModule", "❌ Discovery error: ${e.message}")
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopDiscovery(promise: Promise) {
        try {
            wifiP2pManager?.stopPeerDiscovery(wifiP2pChannel, object : WifiP2pManager.ActionListener {
                override fun onSuccess() {
                    Log.d("WiFiP2PModule", "✅ Discovery stopped")
                    promise.resolve("Stopped")
                }

                override fun onFailure(reasonCode: Int) {
                    Log.e("WiFiP2PModule", "❌ Stop failed: $reasonCode")
                    promise.reject("ERROR", "Failed to stop: $reasonCode")
                }
            })
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        try {
            if (wifiP2pReceiver != null) {
                reactApplicationContext.unregisterReceiver(wifiP2pReceiver)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}

class WiFiP2PBroadcastReceiver(
    private val manager: WifiP2pManager?,
    private val channel: WifiP2pManager.Channel?,
    private val reactContext: ReactApplicationContext
) : BroadcastReceiver() {

    override fun onReceive(context: Context?, intent: Intent?) {
        Log.d("WiFiP2PReceiver", "📡 Received: ${intent?.action}")
        
        when (intent?.action) {
            WifiP2pManager.WIFI_P2P_STATE_CHANGED_ACTION -> {
                val state = intent.getIntExtra(WifiP2pManager.EXTRA_WIFI_STATE, -1)
                val enabled = state == WifiP2pManager.WIFI_P2P_STATE_ENABLED
                Log.d("WiFiP2PReceiver", "📶 WiFi P2P State: ${if (enabled) "Enabled" else "Disabled"}")
                sendEvent("WIFI_P2P_STATE_CHANGED", enabled)
            }
            
            WifiP2pManager.WIFI_P2P_PEERS_CHANGED_ACTION -> {
                Log.d("WiFiP2PReceiver", "👥 Peers changed - requesting peer list")
                manager?.requestPeers(channel) { peers: WifiP2pDeviceList? ->
                    val deviceList = peers?.deviceList ?: emptyList()
                    Log.d("WiFiP2PReceiver", "📱 Found ${deviceList.size} peers")
                    
                    val peersArray = Arguments.createArray()
                    deviceList.forEach { device ->
                        Log.d("WiFiP2PReceiver", "  ➡️ ${device.deviceName} (${device.deviceAddress})")
                        peersArray.pushMap(createDeviceMap(device))
                    }
                    
                    val result = Arguments.createMap().apply {
                        putArray("devices", peersArray)
                    }
                    sendEvent("WIFI_P2P_PEERS_UPDATED", result)
                }
            }
            
            WifiP2pManager.WIFI_P2P_CONNECTION_CHANGED_ACTION -> {
                Log.d("WiFiP2PReceiver", "🔗 Connection changed")
                manager?.requestConnectionInfo(channel) { info ->
                    val result = Arguments.createMap().apply {
                        putBoolean("groupFormed", info.groupFormed)
                        putBoolean("isGroupOwner", info.isGroupOwner)
                    }
                    sendEvent("WIFI_P2P_CONNECTION_CHANGED", result)
                }
            }
            
            WifiP2pManager.WIFI_P2P_THIS_DEVICE_CHANGED_ACTION -> {
                val device = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    intent.getParcelableExtra(WifiP2pManager.EXTRA_WIFI_P2P_DEVICE, WifiP2pDevice::class.java)
                } else {
                    @Suppress("DEPRECATION")
                    intent.getParcelableExtra(WifiP2pManager.EXTRA_WIFI_P2P_DEVICE)
                }
                
                device?.let {
                    Log.d("WiFiP2PReceiver", "📱 This device: ${it.deviceName}")
                    sendEvent("WIFI_P2P_THIS_DEVICE_CHANGED", createDeviceMap(it))
                }
            }
        }
    }

    private fun createDeviceMap(device: WifiP2pDevice): WritableMap {
        return Arguments.createMap().apply {
            putString("deviceName", device.deviceName)
            putString("deviceAddress", device.deviceAddress)
            putInt("status", device.status)
            putBoolean("isGroupOwner", device.isGroupOwner)
            putString("primaryDeviceType", device.primaryDeviceType ?: "Unknown")
            putString("secondaryDeviceType", device.secondaryDeviceType ?: "Unknown")
        }
    }

    private fun sendEvent(eventName: String, data: Any?) {
        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit(eventName, data)
        } catch (e: Exception) {
            Log.e("WiFiP2PReceiver", "❌ Error sending event $eventName: ${e.message}")
        }
    }
}
