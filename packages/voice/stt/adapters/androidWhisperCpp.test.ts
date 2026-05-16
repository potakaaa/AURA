import { beforeEach, describe, expect, it, vi } from "vitest";
import { AndroidWhisperCppCapture, AndroidWhisperCppEngine } from "./androidWhisperCpp.js";

const nativeModuleMock = {
  startCapture: vi.fn(async () => {}),
  stopCapture: vi.fn(async () => {}),
  readCapturedPcm16kMono: vi.fn(async () => [1, -2, 3]),
  transcribe: vi.fn(async () => ({
    transcript: "hello world",
    latencyMs: 123,
    confidence: 0.87,
  })),
};

vi.mock("expo-modules-core", () => ({
  requireNativeModule: vi.fn(() => nativeModuleMock),
}));

describe("AndroidWhisperCpp adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls startCapture with positional args", async () => {
    const capture = new AndroidWhisperCppCapture();

    await capture.start(
      {
        utteranceId: "u-1",
        language: "en",
        environment: "quiet",
        maxDurationSeconds: 15,
      },
      async () => {},
    );

    expect(nativeModuleMock.startCapture).toHaveBeenCalledWith(15, "en");
  });

  it("calls transcribe with positional args", async () => {
    const engine = new AndroidWhisperCppEngine("base");

    const result = await engine.transcribeChunk(
      {
        pcm16kMono: Int16Array.from([5, -7, 10]),
        startMs: 1000,
        endMs: 1200,
      },
      {
        utteranceId: "u-1",
        language: "en",
        environment: "noisy",
        maxDurationSeconds: 20,
      },
    );

    expect(nativeModuleMock.transcribe).toHaveBeenCalledWith([5, -7, 10], "en", "noisy");
    expect(result.transcript).toBe("hello world");
  });
});
