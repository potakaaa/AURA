cmake_minimum_required(VERSION 3.22.1)
project(whisper_jni)

# whisper.cpp source - add as git submodule or copy source
add_subdirectory(src/main/cpp/whisper.cpp)

add_library(whisper_jni SHARED
  src/main/cpp/whisper_jni.cpp
)

target_compile_options(whisper PRIVATE -O2)
target_compile_definitions(whisper PRIVATE GGML_USE_NEON)

target_compile_options(whisper_jni PRIVATE -O2)

target_include_directories(whisper_jni PRIVATE
  src/main/cpp/whisper.cpp
)

target_link_libraries(whisper_jni
  whisper
  android
  log
)
