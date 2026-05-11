import { describe, expect, it } from "vitest";

import { assertChunkingConfig, createOverlappingChunks, mergeChunkTranscripts } from "./chunking.js";

describe("createOverlappingChunks", () => {
  it("splits a 3-second buffer into overlapping 1.5s windows", () => {
    const sampleRate = 16000;
    const pcm = new Int16Array(sampleRate * 3);
    const chunks = createOverlappingChunks(pcm, {
      sampleRateHz: 16000,
      chunkSeconds: 1.5,
      overlapSeconds: 0.25,
    });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].startMs).toBe(0);
    expect(chunks[0].pcm16kMono.length).toBe(sampleRate * 1.5);
  });

  it("returns a single chunk when buffer fits within one window", () => {
    const pcm = new Int16Array(16000);
    const chunks = createOverlappingChunks(pcm, {
      sampleRateHz: 16000,
      chunkSeconds: 1.5,
      overlapSeconds: 0.25,
    });

    expect(chunks.length).toBe(1);
  });
});

describe("assertChunkingConfig", () => {
  it("rejects invalid overlap settings", () => {
    expect(() =>
      assertChunkingConfig({
        sampleRateHz: 16000,
        chunkSeconds: 1.5,
        overlapSeconds: 1.5,
      }),
    ).toThrow("overlapSeconds must be >= 0 and < chunkSeconds");
  });
});

describe("mergeChunkTranscripts", () => {
  it("deduplicates overlapping words at chunk boundaries", () => {
    const result = mergeChunkTranscripts([
      "set a reminder",
      "reminder for tomorrow",
      "for tomorrow at nine",
    ]);

    expect(result).toBe("set a reminder for tomorrow at nine");
  });
});