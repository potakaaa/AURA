package com.potakaaa.aura

object WhisperJniBridge {
    init {
        System.loadLibrary("whisper_jni")
    }

    external fun loadModel(assetPath: String): Boolean
    external fun transcribe(pcm16kMono: IntArray, sampleRateHz: Int, language: String): String
}
