package com.minichat

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

// ✅ IMPORT YOUR BLE PACKAGE
import com.minichat.ble.BLEPhyPackage

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {

          // ⭐ ADD YOUR BLE MODULE
          add(BLEPhyPackage())
          
          // ✅ ADD YOUR WIFI P2P MODULE
          add(WiFiP2PPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
