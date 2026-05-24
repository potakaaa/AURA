package com.potaka.AURA

import android.media.AudioManager
import android.media.ToneGenerator
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AuraWakeCueModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = NAME

  @ReactMethod
  fun play() {
    try {
      val toneGenerator = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 80)
      toneGenerator.startTone(ToneGenerator.TONE_PROP_ACK, 180)
      toneGenerator.release()
    } catch (_: RuntimeException) {
      // Wake cue is non-critical.
    }
  }

  companion object {
    const val NAME = "AuraWakeCue"
  }
}
