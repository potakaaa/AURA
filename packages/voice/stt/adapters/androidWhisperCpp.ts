import type {
  SttAudioCapture,
  SttAudioChunk,
  SttEngine,
  SttEngineMetadata,
  SttTranscriptionRequest,
  SttTranscriptionResult,
} from "../types.js";
import { requireNativeModule } from "expo-modules-core";

interface AndroidWhisperCppNativeModule {
  startCapture(maxDurationSeconds: number, language: "en"): Promise<void>;
  stopCapture(): Promise<void>;
  readCapturedPcm16kMono(): Promise<number[]>;
  transcribe(
    pcm16kMono: number[],
    language: "en",
    environment: "quiet" | "noisy",
  ): Promise<{
    readonly transcript: string;
    readonly latencyMs: number;
    readonly confidence?: number;
  }>;
}

function getNativeModule(): AndroidWhisperCppNativeModule {
  try {
    return requireNativeModule<AndroidWhisperCppNativeModule>("AuraWhisperStt");
  } catch {
    throw new Error(
      "Android whisper.cpp native module `AuraWhisperStt` is unavailable. " +
        "This requires an Android dev/client build with the native module compiled in; " +
        "Expo Go does not include custom native modules.",
    );
  }
}

export class AndroidWhisperCppCapture implements SttAudioCapture {
  public async start(
    request: SttTranscriptionRequest,
    _onChunk: (chunk: SttAudioChunk) => Promise<void>,
  ): Promise<void> {
    await getNativeModule().startCapture(request.maxDurationSeconds, request.language);
  }

  public async stop(): Promise<void> {
    await getNativeModule().stopCapture();
  }

  public async readCapturedPcm16kMono(): Promise<Int16Array> {
    const data = await getNativeModule().readCapturedPcm16kMono();
    return Int16Array.from(data);
  }
}

export class AndroidWhisperCppEngine implements SttEngine {
  public readonly metadata: SttEngineMetadata;

  public constructor(model: "tiny" | "base" | "small") {
    const modelSizes: Record<"tiny" | "base" | "small", number> = {
      tiny: 75,
      base: 142,
      small: 466,
    };

    this.metadata = {
      provider: "whisper.cpp",
      model,
      modelSizeMb: modelSizes[model],
      onDevice: true,
    };
  }

  public async transcribeChunk(
    chunk: SttAudioChunk,
    request: SttTranscriptionRequest,
  ): Promise<SttTranscriptionResult> {
    const response = await getNativeModule().transcribe(
      Array.from(chunk.pcm16kMono),
      request.language,
      request.environment,
    );

    return {
      utteranceId: request.utteranceId,
      transcript: response.transcript,
      latencyMs: response.latencyMs,
      confidence: response.confidence ?? null,
    };
  }
}
