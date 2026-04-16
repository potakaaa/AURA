import { createOverlappingChunks, mergeChunkTranscripts, type ChunkingConfig } from "./chunking.js";
import type {
  SttAudioCapture,
  SttEngine,
  SttSessionOutput,
  SttTranscriptionRequest,
} from "./types.js";

export interface SttSessionConfig {
  readonly chunking: ChunkingConfig;
}

export class WhisperSttSession {
  private readonly transcripts: string[] = [];

  private totalLatencyMs = 0;

  private chunkCount = 0;

  public constructor(
    private readonly capture: SttAudioCapture,
    private readonly engine: SttEngine,
    private readonly config: SttSessionConfig,
  ) {}

  public async transcribePcmBuffer(
    pcm16kMono: Int16Array,
    request: SttTranscriptionRequest,
  ): Promise<SttSessionOutput> {
    const chunks = createOverlappingChunks(pcm16kMono, this.config.chunking);

    for (const chunk of chunks) {
      const result = await this.engine.transcribeChunk(chunk, request);
      this.transcripts.push(result.transcript);
      this.totalLatencyMs += result.latencyMs;
      this.chunkCount += 1;
    }

    return {
      utteranceId: request.utteranceId,
      transcript: mergeChunkTranscripts(this.transcripts),
      totalLatencyMs: this.totalLatencyMs,
      chunkCount: this.chunkCount,
    };
  }

  public async transcribeFromCapture(request: SttTranscriptionRequest): Promise<SttSessionOutput> {
    this.reset();
    const collected: number[] = [];

    await this.capture.start(request, async (chunk) => {
      for (const sample of chunk.pcm16kMono) {
        collected.push(sample);
      }
    });

    await this.capture.stop();

    if (collected.length > 0) {
      return this.transcribePcmBuffer(Int16Array.from(collected), request);
    }

    const captureWithRead = this.capture as SttAudioCapture & {
      readCapturedPcm16kMono?: () => Promise<Int16Array>;
    };

    if (captureWithRead.readCapturedPcm16kMono) {
      const pcm = await captureWithRead.readCapturedPcm16kMono();
      return this.transcribePcmBuffer(pcm, request);
    }

    throw new Error("No audio received from capture source.");
  }

  private reset(): void {
    this.transcripts.length = 0;
    this.totalLatencyMs = 0;
    this.chunkCount = 0;
  }
}
