package com.potaka.AURA

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.core.app.NotificationCompat
import java.util.Locale

class AuraWakeWordService : Service(), RecognitionListener {
  private val mainHandler = Handler(Looper.getMainLooper())
  private var recognizer: SpeechRecognizer? = null
  private var shouldListen = false
  private var isRecognizerActive = false
  private var lastWakeAtMs = 0L

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_STOP -> {
        stopListening()
        stopForeground(STOP_FOREGROUND_REMOVE)
        isRunning = false
        stopSelf()
        return START_NOT_STICKY
      }
      ACTION_SET_LISTENING -> {
        if (!isRunning) {
          isRunning = true
          startAsForegroundService()
        }
        setListeningEnabled(intent.getBooleanExtra(EXTRA_LISTENING_ENABLED, false))
      }
      else -> {
        isRunning = true
        startAsForegroundService()
        setListeningEnabled(intent?.getBooleanExtra(EXTRA_LISTENING_ENABLED, true) ?: true)
      }
    }

    return START_STICKY
  }

  override fun onDestroy() {
    stopListening()
    isRunning = false
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun startAsForegroundService() {
    val notification = createNotification()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(
        NOTIFICATION_ID,
        notification,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE,
      )
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
  }

  private fun setListeningEnabled(enabled: Boolean) {
    shouldListen = enabled
    if (enabled) {
      startListening()
    } else {
      stopListening()
    }
  }

  private fun startListening() {
    if (!shouldListen || isRecognizerActive || !SpeechRecognizer.isRecognitionAvailable(this)) {
      return
    }

    mainHandler.post {
      if (!shouldListen || isRecognizerActive) {
        return@post
      }

      recognizer?.destroy()
      recognizer = SpeechRecognizer.createSpeechRecognizer(this).also {
        it.setRecognitionListener(this)
      }

      val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
        putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.US.toLanguageTag())
        putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
        putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
        putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 600_000)
        putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 600_000)
        putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 600_000)
      }

      isRecognizerActive = true
      recognizer?.startListening(intent)
    }
  }

  private fun stopListening() {
    shouldListen = false
    isRecognizerActive = false
    mainHandler.removeCallbacksAndMessages(null)
    try {
      recognizer?.cancel()
    } catch (_: RuntimeException) {
    }
    recognizer?.destroy()
    recognizer = null
  }

  private fun restartListeningSoon() {
    isRecognizerActive = false
    recognizer?.destroy()
    recognizer = null

    if (!shouldListen) {
      return
    }

    mainHandler.postDelayed({ startListening() }, RESTART_DELAY_MS)
  }

  private fun handleTranscript(transcript: String?) {
    if (transcript.isNullOrBlank()) {
      return
    }

    if (!WAKE_WORD_REGEX.containsMatchIn(transcript)) {
      return
    }

    val now = System.currentTimeMillis()
    if (now - lastWakeAtMs < WAKE_COOLDOWN_MS) {
      return
    }

    lastWakeAtMs = now
    playWakeCue()
  }

  private fun playWakeCue() {
    try {
      val toneGenerator = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 80)
      toneGenerator.startTone(ToneGenerator.TONE_PROP_ACK, 180)
      mainHandler.postDelayed({ toneGenerator.release() }, 220)
    } catch (_: RuntimeException) {
      // Wake cue is non-critical.
    }
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }

    val channel = NotificationChannel(
      NOTIFICATION_CHANNEL_ID,
      "AURA wake word",
      NotificationManager.IMPORTANCE_LOW,
    ).apply {
      description = "Keeps Android background wake-word listening visible."
      setShowBadge(false)
    }

    val notificationManager =
      getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    notificationManager.createNotificationChannel(channel)
  }

  private fun createNotification(): Notification {
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
      ?: Intent(this, MainActivity::class.java)
    val pendingIntent = PendingIntent.getActivity(
      this,
      0,
      launchIntent,
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )

    return NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
      .setSmallIcon(applicationInfo.icon)
      .setContentTitle("AURA is listening for wake word")
      .setContentText("Say AURA while the app is backgrounded.")
      .setContentIntent(pendingIntent)
      .setOngoing(true)
      .setSilent(true)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .build()
  }

  override fun onReadyForSpeech(params: Bundle?) = Unit
  override fun onBeginningOfSpeech() = Unit
  override fun onRmsChanged(rmsdB: Float) = Unit
  override fun onBufferReceived(buffer: ByteArray?) = Unit
  override fun onEndOfSpeech() = Unit
  override fun onEvent(eventType: Int, params: Bundle?) = Unit

  override fun onError(error: Int) {
    restartListeningSoon()
  }

  override fun onResults(results: Bundle?) {
    val transcripts = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
    handleTranscript(transcripts?.firstOrNull())
    restartListeningSoon()
  }

  override fun onPartialResults(partialResults: Bundle?) {
    val transcripts = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
    handleTranscript(transcripts?.firstOrNull())
  }

  companion object {
    const val ACTION_START = "com.potaka.AURA.action.START_WAKE_WORD"
    const val ACTION_STOP = "com.potaka.AURA.action.STOP_WAKE_WORD"
    const val ACTION_SET_LISTENING = "com.potaka.AURA.action.SET_WAKE_WORD_LISTENING"
    const val EXTRA_LISTENING_ENABLED = "listeningEnabled"

    private const val NOTIFICATION_CHANNEL_ID = "aura_wake_word"
    private const val NOTIFICATION_ID = 4217
    private const val RESTART_DELAY_MS = 300L
    private const val WAKE_COOLDOWN_MS = 2_500L
    private val WAKE_WORD_REGEX = Regex("\\baura\\b", RegexOption.IGNORE_CASE)

    @Volatile
    var isRunning: Boolean = false
      private set
  }
}
