package com.potaka.AURA

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
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
import android.speech.tts.TextToSpeech
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import kotlin.concurrent.thread
import org.json.JSONArray
import org.json.JSONObject

class AuraWakeWordService : Service(), RecognitionListener, TextToSpeech.OnInitListener {
  private val mainHandler = Handler(Looper.getMainLooper())
  private var recognizer: SpeechRecognizer? = null
  private var textToSpeech: TextToSpeech? = null
  private var shouldListen = false
  private var isRecognizerActive = false
  private var isProcessingCommand = false
  private var isAwaitingCommand = false
  private var isTextToSpeechReady = false
  private var pendingSpeech: String? = null
  private var pendingPartialCommand: String? = null
  private var lastWakeAtMs = 0L
  private var lastCommandAtMs = 0L

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
    textToSpeech = TextToSpeech(this, this)
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
    textToSpeech?.stop()
    textToSpeech?.shutdown()
    textToSpeech = null
    isRunning = false
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun startAsForegroundService() {
    val notification = createNotification(
      "AURA is listening for wake word",
      "Say AURA while the app is backgrounded.",
    )
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

    if (!hasMicrophonePermission()) {
      Log.w(TAG, "Cannot start wake-word recognition because RECORD_AUDIO is not granted.")
      updateNotification("AURA needs microphone access", "Open AURA and allow microphone permission.")
      return
    }

    mainHandler.post {
      if (!shouldListen || isRecognizerActive || !hasMicrophonePermission()) {
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
    pendingPartialCommand = null
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

  private fun handleTranscript(transcript: String?, isFinal: Boolean) {
    if (transcript.isNullOrBlank()) {
      return
    }

    val parsed = parseWakeWordCommand(transcript)
    if (!parsed.wakeWordDetected) {
      if (isAwaitingCommand) {
        val command = transcript.trim()
        if (command.isNotBlank()) {
          if (isFinal) {
            isAwaitingCommand = false
            dispatchCommand(command)
          } else {
            schedulePartialCommandDispatch(command)
          }
        }
      }
      return
    }

    val now = System.currentTimeMillis()
    if (now - lastWakeAtMs >= WAKE_COOLDOWN_MS) {
      lastWakeAtMs = now
      Log.i(TAG, "Wake word detected from ${if (isFinal) "final" else "partial"} transcript.")
      playWakeCue()
    }

    val command = parsed.command
    if (!isFinal) {
      if (command.isNullOrBlank()) {
        isAwaitingCommand = true
        updateNotification("AURA heard you", "Listening for your command.")
      } else {
        schedulePartialCommandDispatch(command)
      }
      return
    }

    if (command.isNullOrBlank()) {
      isAwaitingCommand = true
      updateNotification("AURA heard you", "Listening for your command.")
      return
    }

    isAwaitingCommand = false
    dispatchCommand(command)
  }

  private fun schedulePartialCommandDispatch(command: String) {
    Log.i(TAG, "Scheduling partial wake command dispatch.")
    pendingPartialCommand = command
    mainHandler.removeCallbacks(dispatchPendingPartialCommand)
    mainHandler.postDelayed(dispatchPendingPartialCommand, PARTIAL_COMMAND_DISPATCH_DELAY_MS)
  }

  private val dispatchPendingPartialCommand = Runnable {
    val command = pendingPartialCommand?.trim()
    pendingPartialCommand = null

    if (command.isNullOrBlank() || !shouldListen) {
      return@Runnable
    }

    Log.i(TAG, "Dispatching debounced partial wake command.")
    isAwaitingCommand = false
    dispatchCommand(command)
  }

  private fun dispatchCommand(command: String) {
    val normalizedCommand = command.trim()
    if (normalizedCommand.isBlank()) {
      return
    }

    val now = System.currentTimeMillis()
    if (now - lastCommandAtMs < COMMAND_COOLDOWN_MS) {
      Log.i(TAG, "Suppressing duplicate wake command inside cooldown.")
      return
    }

    pendingPartialCommand = null
    mainHandler.removeCallbacks(dispatchPendingPartialCommand)
    lastCommandAtMs = now
    Log.i(TAG, "Dispatching wake command to assistant.")
    sendCommandToAssistant(normalizedCommand)
  }

  private fun parseWakeWordCommand(transcript: String): WakeWordParseResult {
    val match = WAKE_WORD_REGEX.find(transcript) ?: WAKE_WORD_ALIAS_REGEX.find(transcript)
      ?: return WakeWordParseResult(wakeWordDetected = false, command = null)
    val command = transcript
      .substring(match.range.last + 1)
      .trim()
      .trimStart(',', '.', '?', '!', ':', ';', '-', ' ')
      .trim()

    return WakeWordParseResult(
      wakeWordDetected = true,
      command = command.ifBlank { null },
    )
  }

  private fun sendCommandToAssistant(command: String) {
    if (isProcessingCommand) {
      return
    }

    val apiBaseUrl = getConfiguredApiBaseUrl()
    if (apiBaseUrl.isNullOrBlank()) {
      Log.w(TAG, "Cannot send background command because API base URL is not configured.")
      updateNotification("AURA heard a command", "Open AURA once so background assistant can be configured.")
      speak("Open AURA once so I can connect to the assistant.")
      return
    }

    isProcessingCommand = true
    updateNotification("AURA is thinking", command)

    thread(name = "AuraBackgroundAssistantRequest") {
      val reply = try {
        requestAssistantReply(apiBaseUrl, command)
      } catch (error: Exception) {
        Log.w(TAG, "Background assistant request failed.", error)
        null
      }

      mainHandler.post {
        isProcessingCommand = false
        if (reply.isNullOrBlank()) {
          updateNotification("AURA could not respond", "Check your connection and try again.")
          speak("I could not get a response right now.")
        } else {
          updateNotification("AURA responded", reply)
          speak(reply)
        }
      }
    }
  }

  private fun getConfiguredApiBaseUrl(): String? {
    return getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
      .getString(PREF_API_BASE_URL, null)
      ?.trim()
      ?.trimEnd('/')
  }

  private fun hasMicrophonePermission(): Boolean {
    return ContextCompat.checkSelfPermission(this, android.Manifest.permission.RECORD_AUDIO) ==
      PackageManager.PERMISSION_GRANTED
  }

  private fun requestAssistantReply(apiBaseUrl: String, command: String): String? {
    val url = URL("$apiBaseUrl/llm/chat")
    val connection = (url.openConnection() as HttpURLConnection).apply {
      requestMethod = "POST"
      connectTimeout = NETWORK_TIMEOUT_MS
      readTimeout = NETWORK_TIMEOUT_MS
      doOutput = true
      setRequestProperty("Content-Type", "application/json")
      setRequestProperty("Accept", "application/json")
    }

    try {
      val messages = JSONArray()
        .put(JSONObject().put("role", "system").put("content", SYSTEM_PROMPT))
        .put(JSONObject().put("role", "user").put("content", command))
      val body = JSONObject().put("messages", messages).toString()

      OutputStreamWriter(connection.outputStream).use { writer ->
        writer.write(body)
      }

      val responseCode = connection.responseCode
      Log.i(TAG, "Background assistant HTTP response code: $responseCode.")
      if (responseCode !in 200..299) {
        return null
      }

      val responseBody = connection.inputStream.bufferedReader().use { it.readText() }
      return JSONObject(responseBody).optString("reply").trim().ifBlank { null }
    } finally {
      connection.disconnect()
    }
  }

  private fun updateNotification(title: String, text: String) {
    val notificationManager =
      getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    notificationManager.notify(NOTIFICATION_ID, createNotification(title, text))
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

  private fun createNotification(title: String, text: String): Notification {
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
      .setContentTitle(title)
      .setContentText(text)
      .setStyle(NotificationCompat.BigTextStyle().bigText(text))
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
    handleTranscript(transcripts?.firstOrNull(), isFinal = true)
    restartListeningSoon()
  }

  override fun onPartialResults(partialResults: Bundle?) {
    val transcripts = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
    handleTranscript(transcripts?.firstOrNull(), isFinal = false)
  }

  override fun onInit(status: Int) {
    isTextToSpeechReady = status == TextToSpeech.SUCCESS
    if (isTextToSpeechReady) {
      textToSpeech?.language = Locale.US
      pendingSpeech?.let {
        pendingSpeech = null
        speak(it)
      }
    }
  }

  private fun speak(text: String) {
    if (!isTextToSpeechReady) {
      pendingSpeech = text
      return
    }

    textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "aura-background-reply")
  }

  companion object {
    const val ACTION_START = "com.potaka.AURA.action.START_WAKE_WORD"
    const val ACTION_STOP = "com.potaka.AURA.action.STOP_WAKE_WORD"
    const val ACTION_SET_LISTENING = "com.potaka.AURA.action.SET_WAKE_WORD_LISTENING"
    const val EXTRA_LISTENING_ENABLED = "listeningEnabled"
    const val PREFERENCES_NAME = "aura_background_wake_word"
    const val PREF_API_BASE_URL = "apiBaseUrl"

    private const val NOTIFICATION_CHANNEL_ID = "aura_wake_word"
    private const val NOTIFICATION_ID = 4217
    private const val RESTART_DELAY_MS = 300L
    private const val WAKE_COOLDOWN_MS = 2_500L
    private const val COMMAND_COOLDOWN_MS = 2_500L
    private const val PARTIAL_COMMAND_DISPATCH_DELAY_MS = 900L
    private const val NETWORK_TIMEOUT_MS = 30_000
    private const val TAG = "AuraWakeWordService"
    private const val SYSTEM_PROMPT =
      "You are Aura, a concise voice-first personal assistant. Answer clearly and keep replies useful for a mobile chat."
    private val WAKE_WORD_REGEX = Regex("\\baura\\b", RegexOption.IGNORE_CASE)
    private val WAKE_WORD_ALIAS_REGEX = Regex(
      "^(?:hey[\\s,.:;!?-]+|ok(?:ay)?[\\s,.:;!?-]+)?(?:or\\s+a|or\\s+uh|our\\s+a|ora|or\\s+rat)\\b",
      RegexOption.IGNORE_CASE,
    )

    @Volatile
    var isRunning: Boolean = false
      private set
  }

  private data class WakeWordParseResult(
    val wakeWordDetected: Boolean,
    val command: String?,
  )
}
