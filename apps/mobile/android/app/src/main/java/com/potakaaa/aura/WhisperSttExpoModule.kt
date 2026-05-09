package com.potakaaa.aura

import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class WhisperSttExpoModule : Module() {
    private val sttModule = WhisperSttModule()

    override fun definition() = ModuleDefinition {
        Name("AuraWhisperStt")

        OnCreate {
            val context = appContext.reactContext ?: return@OnCreate
            val outFile = File(context.filesDir, "ggml-base.bin")

            try {
                if (!outFile.exists()) {
                    context.assets.open("whisper/ggml-base.bin").use { input ->
                        outFile.outputStream().use { output ->
                            input.copyTo(output)
                        }
                    }
                }

                val loaded = WhisperJniBridge.loadModel(outFile.absolutePath)
                if (!loaded) {
                    Log.e(
                        "AuraWhisperStt",
                        "Failed to load whisper model from ${outFile.absolutePath}",
                    )
                }
            } catch (error: Exception) {
                Log.e("AuraWhisperStt", "Failed to prepare whisper model", error)
            }
        }

        AsyncFunction("startCapture") { maxDurationSeconds: Int, language: String ->
            sttModule.startCapture(maxDurationSeconds, language)
        }

        AsyncFunction("stopCapture") { ->
            sttModule.stopCapture()
        }

        AsyncFunction("readCapturedPcm16kMono") { ->
            sttModule.readCapturedPcm16kMono()
        }

        AsyncFunction("transcribe") { pcm: IntArray, language: String, env: String ->
            sttModule.transcribe(pcm, language, env)
        }
    }
}
