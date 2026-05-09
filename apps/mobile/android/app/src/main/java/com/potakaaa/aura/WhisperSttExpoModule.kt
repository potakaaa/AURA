package com.potakaaa.aura

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class WhisperSttExpoModule : Module() {
    private val sttModule = WhisperSttModule()

    override fun definition() = ModuleDefinition {
        Name("AuraWhisperStt")

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
