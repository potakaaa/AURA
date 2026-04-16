package com.aura.voice.stt

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.system.measureTimeMillis

/**
 * POC-only Android module scaffold.
 * Hook this class into your RN/Expo native module registration.
 */
class WhisperSttModule {
    private var audioRecord: AudioRecord? = null
    private val isCapturing = AtomicBoolean(false)
    private val capturedSamples = mutableListOf<Short>()
    private val sampleRateHz = 16000
    private var maxDurationSeconds: Int = 15

    fun startCapture(maxDurationSeconds: Int, language: String) {
        require(language == "en") { "POC supports English only." }
        this.maxDurationSeconds = maxDurationSeconds
        capturedSamples.clear()

        val minBuffer = AudioRecord.getMinBufferSize(
            sampleRateHz,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        )

        audioRecord = AudioRecord(
            MediaRecorder.AudioSource.MIC,
            sampleRateHz,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
            minBuffer.coerceAtLeast(sampleRateHz * 2)
        )

        val recorder = audioRecord ?: error("AudioRecord init failed")
        recorder.startRecording()
        isCapturing.set(true)

        Thread {
            val scratch = ShortArray(1024)
            var readTotal = 0
            val maxSamples = sampleRateHz * this.maxDurationSeconds

            while (isCapturing.get() && readTotal < maxSamples) {
                val read = recorder.read(scratch, 0, scratch.size)
                if (read > 0) {
                    for (i in 0 until read) {
                        capturedSamples.add(scratch[i])
                    }
                    readTotal += read
                }
            }
        }.start()
    }

    fun stopCapture() {
        isCapturing.set(false)
        audioRecord?.stop()
        audioRecord?.release()
        audioRecord = null
    }

    fun readCapturedPcm16kMono(): IntArray {
        val output = IntArray(capturedSamples.size)
        for (i in capturedSamples.indices) {
            output[i] = capturedSamples[i].toInt()
        }
        return output
    }

    fun transcribe(pcm16kMono: IntArray, language: String, environment: String): Map<String, Any> {
        require(language == "en") { "POC supports English only." }
        require(environment == "quiet" || environment == "noisy") {
            "Environment must be quiet or noisy."
        }

        var transcript = ""
        val latencyMs = measureTimeMillis {
            transcript = WhisperJniBridge.transcribe(
                pcm16kMono = pcm16kMono,
                sampleRateHz = sampleRateHz,
                language = language
            )
        }

        return mapOf(
            "transcript" to transcript,
            "latencyMs" to latencyMs
        )
    }
}

/**
 * Placeholder JNI contract for whisper.cpp.
 * Replace with your actual JNI bridge implementation.
 */
object WhisperJniBridge {
    fun transcribe(pcm16kMono: IntArray, sampleRateHz: Int, language: String): String {
        // TODO: Bind whisper.cpp JNI entrypoint.
        if (pcm16kMono.isEmpty()) {
            return ""
        }
        return "[POC transcript placeholder]"
    }
}
