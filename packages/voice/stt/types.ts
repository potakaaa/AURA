export type SttEnvironment = "quiet" | "noisy";

export interface SttAudioChunk {
  readonly pcm16kMono: Int16Array;
  readonly startMs: number;
  readonly endMs: number;
}

export interface SttTranscriptionRequest {
  readonly utteranceId: string;
  readonly language: "en";
  readonly environment: SttEnvironment;
  readonly maxDurationSeconds: number;
}

export interface SttTranscriptionResult {
  readonly utteranceId: string;
  readonly transcript: string;
  readonly latencyMs: number;
  readonly confidence: number | null;
}

export interface SttEngineMetadata {
  readonly provider: string;
  readonly model: string;
  readonly modelSizeMb: number | null;
  readonly onDevice: boolean;
}

export interface SttEngine {
  readonly metadata: SttEngineMetadata;
  transcribeChunk(
    chunk: SttAudioChunk,
    request: SttTranscriptionRequest,
  ): Promise<SttTranscriptionResult>;
}

export interface SttAudioCapture {
  start(
    request: SttTranscriptionRequest,
    onChunk: (chunk: SttAudioChunk) => Promise<void>,
  ): Promise<void>;
  stop(): Promise<void>;
}

export interface SttSessionOutput {
  readonly utteranceId: string;
  readonly transcript: string;
  readonly totalLatencyMs: number;
  readonly chunkCount: number;
}
