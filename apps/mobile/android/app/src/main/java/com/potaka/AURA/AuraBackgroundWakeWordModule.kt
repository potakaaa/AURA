package com.potaka.AURA

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener

class AuraBackgroundWakeWordModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
  private var permissionPromise: Promise? = null

  override fun getName(): String = NAME

  @ReactMethod
  fun start(promise: Promise) {
    val intent = Intent(reactContext, AuraWakeWordService::class.java).apply {
      action = AuraWakeWordService.ACTION_START
      putExtra(AuraWakeWordService.EXTRA_LISTENING_ENABLED, true)
    }
    ContextCompat.startForegroundService(reactContext, intent)
    promise.resolve(runningResult(true))
  }

  @ReactMethod
  fun stop(promise: Promise) {
    val intent = Intent(reactContext, AuraWakeWordService::class.java).apply {
      action = AuraWakeWordService.ACTION_STOP
    }
    reactContext.startService(intent)
    promise.resolve(runningResult(false))
  }

  @ReactMethod
  fun isRunning(promise: Promise) {
    promise.resolve(runningResult(AuraWakeWordService.isRunning))
  }

  @ReactMethod
  fun setListeningEnabled(enabled: Boolean, promise: Promise) {
    if (!AuraWakeWordService.isRunning) {
      promise.resolve(runningResult(false))
      return
    }

    val intent = Intent(reactContext, AuraWakeWordService::class.java).apply {
      action = AuraWakeWordService.ACTION_SET_LISTENING
      putExtra(AuraWakeWordService.EXTRA_LISTENING_ENABLED, enabled)
    }
    reactContext.startService(intent)
    promise.resolve(runningResult(AuraWakeWordService.isRunning))
  }

  @ReactMethod
  fun requestNotificationPermission(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
      promise.resolve(permissionResult(granted = true, canAskAgain = false))
      return
    }

    if (
      ContextCompat.checkSelfPermission(reactContext, Manifest.permission.POST_NOTIFICATIONS) ==
        PackageManager.PERMISSION_GRANTED
    ) {
      promise.resolve(permissionResult(granted = true, canAskAgain = false))
      return
    }

    val activity = reactApplicationContext.getCurrentActivity() as? PermissionAwareActivity
    if (activity == null) {
      promise.resolve(permissionResult(granted = false, canAskAgain = false))
      return
    }

    permissionPromise?.resolve(permissionResult(granted = false, canAskAgain = true))
    permissionPromise = promise

    activity.requestPermissions(
      arrayOf(Manifest.permission.POST_NOTIFICATIONS),
      NOTIFICATION_PERMISSION_REQUEST,
      PermissionListener { requestCode, _, grantResults ->
        if (requestCode != NOTIFICATION_PERMISSION_REQUEST) {
          return@PermissionListener false
        }

        val granted = grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED
        val canAskAgain = activity.shouldShowRequestPermissionRationale(
          Manifest.permission.POST_NOTIFICATIONS,
        )
        permissionPromise?.resolve(permissionResult(granted, canAskAgain))
        permissionPromise = null
        true
      },
    )
  }

  private fun runningResult(running: Boolean) = Arguments.createMap().apply {
    putBoolean("running", running)
  }

  private fun permissionResult(granted: Boolean, canAskAgain: Boolean) =
    Arguments.createMap().apply {
      putBoolean("granted", granted)
      putBoolean("canAskAgain", canAskAgain)
    }

  companion object {
    private const val NOTIFICATION_PERMISSION_REQUEST = 4218
    const val NAME = "AuraBackgroundWakeWord"
  }
}
