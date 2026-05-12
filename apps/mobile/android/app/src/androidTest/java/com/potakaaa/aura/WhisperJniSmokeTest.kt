package com.potakaaa.aura

import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class WhisperJniSmokeTest {

    @Test
    fun transcribe_silentBuffer_returnsEmptyOrShortString() {
        val silence = IntArray(16000) { 0 }
        val result = WhisperJniBridge.transcribe(
            pcm16kMono = silence,
            sampleRateHz = 16000,
            language = "en"
        )

        assertNotNull(result)
        assertTrue("Expected short/empty output on silence", result.trim().length < 20)
    }

    @Test
    fun transcribe_doesNotCrash_onMaxBuffer() {
        val longBuffer = IntArray(16000 * 15) { 0 }
        val result = WhisperJniBridge.transcribe(longBuffer, 16000, "en")

        assertNotNull(result)
    }
}