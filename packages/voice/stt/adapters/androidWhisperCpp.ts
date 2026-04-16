import type {
  SttAudioCapture,
  SttAudioChunk,
  SttEngine,
  SttEngineMetadata,
  SttTranscriptionRequest,
  SttTranscriptionResult,
} from "../types.js";

interface AndroidWhisperCppNativeModule {
  startCapture(config: {
    readonly sampleRateHz: 16000;
    readonly channelCount: 1;
    readonly maxDurationSeconds: number;
    readonly language: "en";
  }): Promise<void>;
  stopCapture(): Promise<void>;
  readCapturedPcm16kMono(): Promise<number[]>;
  transcribe(config: {
    readonly pcm16kMono: number[];
    readonly language: "en";
    readonly environment: "quiet" | "noisy";
  }): Promise<{
    readonly transcript: string;
    readonly latencyMs: number;
    readonly confidence?: number;
  }>;
}

function getNativeModule(): AndroidWhisperCppNativeModule {
  const maybeModule = (globalThis as { __AURA_WHISPER_CPP__?: AndroidWhisperCppNativeModule })
    .__AURA_WHISPER_CPP__;

  if (!maybeModule) {
    throw new Error(
      "Android whisper.cpp native module is not registered. " +
        "Attach `__AURA_WHISPER_CPP__` from native bridge initialization.",
    );
  }

  return maybeModule;
}

export class AndroidWhisperCppCapture implements SttAudioCapture {
  public async start(
    request: SttTranscriptionRequest,
    _onChunk: (chunk: SttAudioChunk) => Promise<void>,
  ): Promise<void> {
    await getNativeModule().startCapture({
      sampleRateHz: 16000,
      channelCount: 1,
      maxDurationSeconds: request.maxDurationSeconds,
      language: request.language,
    });
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
    const response = await getNativeModule().transcribe({
      pcm16kMono: Array.from(chunk.pcm16kMono),
      language: request.language,
      environment: request.environment,
    });

    return {
      utteranceId: request.utteranceId,
      transcript: response.transcript,
      latencyMs: response.latencyMs,
      confidence: response.confidence ?? null,
    };
  }
}
