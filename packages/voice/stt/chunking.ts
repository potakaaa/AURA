import type { SttAudioChunk } from "./types.js";

export interface ChunkingConfig {
  readonly sampleRateHz: 16000;
  readonly chunkSeconds: number;
  readonly overlapSeconds: number;
}

const MIN_CHUNK_SECONDS = 1;
const MAX_CHUNK_SECONDS = 2;

export function assertChunkingConfig(config: ChunkingConfig): void {
  if (config.chunkSeconds < MIN_CHUNK_SECONDS) {
    throw new Error("chunkSeconds must be at least 1 second");
  }

  if (config.chunkSeconds > MAX_CHUNK_SECONDS) {
    throw new Error("chunkSeconds must be at most 2 seconds");
  }

  if (config.overlapSeconds < 0 || config.overlapSeconds >= config.chunkSeconds) {
    throw new Error("overlapSeconds must be >= 0 and < chunkSeconds");
  }
}

export function createOverlappingChunks(
  pcm16kMono: Int16Array,
  config: ChunkingConfig,
): SttAudioChunk[] {
  assertChunkingConfig(config);

  const samplesPerChunk = Math.floor(config.sampleRateHz * config.chunkSeconds);
  const overlapSamples = Math.floor(config.sampleRateHz * config.overlapSeconds);
  const stride = samplesPerChunk - overlapSamples;

  if (pcm16kMono.length === 0 || stride <= 0) {
    return [];
  }

  const chunks: SttAudioChunk[] = [];
  let cursor = 0;

  while (cursor < pcm16kMono.length) {
    const sliceEnd = Math.min(cursor + samplesPerChunk, pcm16kMono.length);
    const chunkPcm = pcm16kMono.slice(cursor, sliceEnd);

    const startMs = Math.floor((cursor / config.sampleRateHz) * 1000);
    const endMs = Math.floor((sliceEnd / config.sampleRateHz) * 1000);

    chunks.push({
      pcm16kMono: chunkPcm,
      startMs,
      endMs,
    });

    if (sliceEnd >= pcm16kMono.length) {
      break;
    }

    cursor += stride;
  }

  return chunks;
}

export function mergeChunkTranscripts(parts: readonly string[]): string {
  const normalized = parts
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (normalized.length === 0) {
    return "";
  }

  const mergedWords: string[] = normalized[0].split(/\s+/);

  for (let index = 1; index < normalized.length; index += 1) {
    const nextWords = normalized[index].split(/\s+/);
    let overlap = 0;

    const maxOverlap = Math.min(mergedWords.length, nextWords.length);

    for (let candidate = maxOverlap; candidate > 0; candidate -= 1) {
      const mergedSuffix = mergedWords.slice(mergedWords.length - candidate).join(" ");
      const nextPrefix = nextWords.slice(0, candidate).join(" ");

      if (mergedSuffix === nextPrefix) {
        overlap = candidate;
        break;
      }
    }

    mergedWords.push(...nextWords.slice(overlap));
  }

  return mergedWords.join(" ").trim();
}
