#include <jni.h>
#include <android/log.h>

#include <mutex>
#include <string>
#include <vector>

#include "whisper.h"

namespace {
constexpr const char *kLogTag = "whisper_jni";

std::mutex g_ctx_mutex;
whisper_context *g_ctx = nullptr;

std::string CollectSegments(struct whisper_context *ctx) {
  const int segment_count = whisper_full_n_segments(ctx);
  std::string result;
  for (int i = 0; i < segment_count; ++i) {
    const char *text = whisper_full_get_segment_text(ctx, i);
    if (text != nullptr) {
      result += text;
    }
  }
  return result;
}

std::vector<float> ConvertPcm16ToFloat(const jint *pcm_data, jsize length) {
  std::vector<float> audio(length);
  for (jsize i = 0; i < length; ++i) {
    audio[i] = static_cast<float>(pcm_data[i]) / 32768.0f;
  }
  return audio;
}
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_potakaaa_aura_WhisperJniBridge_loadModel(
    JNIEnv *env,
    jclass,
    jstring assetPath) {
  if (assetPath == nullptr) {
    return JNI_FALSE;
  }

  const char *model_path = env->GetStringUTFChars(assetPath, nullptr);
  whisper_context *ctx = whisper_init_from_file(model_path);
  env->ReleaseStringUTFChars(assetPath, model_path);

  if (ctx == nullptr) {
    __android_log_print(ANDROID_LOG_ERROR, kLogTag, "Failed to load model");
    return JNI_FALSE;
  }

  std::lock_guard<std::mutex> lock(g_ctx_mutex);
  if (g_ctx != nullptr) {
    whisper_free(g_ctx);
  }
  g_ctx = ctx;

  return JNI_TRUE;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_potakaaa_aura_WhisperJniBridge_transcribe(
    JNIEnv *env,
    jclass,
    jintArray pcm16kMono,
    jint sampleRateHz,
    jstring language) {
  if (pcm16kMono == nullptr) {
    return env->NewStringUTF("");
  }

  std::lock_guard<std::mutex> lock(g_ctx_mutex);
  if (g_ctx == nullptr) {
    __android_log_print(ANDROID_LOG_ERROR, kLogTag, "Model not loaded");
    return env->NewStringUTF("");
  }

  const jsize length = env->GetArrayLength(pcm16kMono);
  std::vector<jint> pcm_data(static_cast<size_t>(length));
  env->GetIntArrayRegion(pcm16kMono, 0, length, pcm_data.data());
  std::vector<float> audio = ConvertPcm16ToFloat(pcm_data.data(), length);

  whisper_full_params params = whisper_full_default_params(WHISPER_SAMPLING_GREEDY);
  params.print_progress = false;
  params.print_realtime = false;
  params.print_timestamps = false;
  params.translate = false;
  params.no_context = true;
  params.single_segment = false;
  params.sample_rate = static_cast<int>(sampleRateHz);

  const char *language_cstr = nullptr;
  if (language != nullptr) {
    language_cstr = env->GetStringUTFChars(language, nullptr);
    if (language_cstr != nullptr && language_cstr[0] != '\0') {
      params.language = language_cstr;
    }
  }

  const int status = whisper_full(g_ctx, params, audio.data(), static_cast<int>(audio.size()));

  if (language_cstr != nullptr && language != nullptr) {
    env->ReleaseStringUTFChars(language, language_cstr);
  }

  if (status != 0) {
    __android_log_print(ANDROID_LOG_ERROR, kLogTag, "whisper_full failed: %d", status);
    return env->NewStringUTF("");
  }

  std::string output = CollectSegments(g_ctx);
  return env->NewStringUTF(output.c_str());
}
