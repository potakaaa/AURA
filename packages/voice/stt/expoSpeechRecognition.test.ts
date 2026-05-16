import { describe, expect, it, vi, beforeEach } from "vitest";

type CallbackMap = Record<string, ((event: any) => void)[]>;

const {
  callbacks,
  startMock,
  stopMock,
  abortMock,
  getPermissionsAsyncMock,
  requestPermissionsAsyncMock,
} = vi.hoisted(() => ({
  callbacks: {} as CallbackMap,
  startMock: vi.fn(),
  stopMock: vi.fn(),
  abortMock: vi.fn(),
  getPermissionsAsyncMock: vi.fn(async () => ({
    granted: true,
    canAskAgain: true,
    status: "granted",
  })),
  requestPermissionsAsyncMock: vi.fn(async () => ({
    granted: true,
    canAskAgain: true,
    status: "granted",
  })),
}));

vi.mock("expo-speech-recognition", () => ({
  ExpoSpeechRecognitionModule: {
    addListener: (eventName: string, listener: (event: any) => void) => {
      callbacks[eventName] ??= [];
      callbacks[eventName].push(listener);
      return { remove: () => {} };
    },
    start: startMock,
    stop: stopMock,
    abort: abortMock,
    getPermissionsAsync: getPermissionsAsyncMock,
    requestPermissionsAsync: requestPermissionsAsyncMock,
  },
}));

import { ExpoSpeechRecognitionSession } from "./expoSpeechRecognition.js";

function emit(eventName: string, payload: any) {
  for (const callback of callbacks[eventName] ?? []) {
    callback(payload);
  }
}

describe("ExpoSpeechRecognitionSession", () => {
  beforeEach(() => {
    Object.keys(callbacks).forEach((key) => {
      callbacks[key] = [];
    });
    vi.clearAllMocks();

    getPermissionsAsyncMock.mockResolvedValue({
      granted: true,
      canAskAgain: true,
      status: "granted",
    });
    requestPermissionsAsyncMock.mockResolvedValue({
      granted: true,
      canAskAgain: true,
      status: "granted",
    });
  });

  it("starts recognition and forwards partial/final transcripts", async () => {
    const partial = vi.fn();
    const final = vi.fn();

    const session = new ExpoSpeechRecognitionSession({
      onPartialTranscript: partial,
      onFinalTranscript: final,
    });

    await session.start({
      action: "start",
      sessionId: "s1",
      locale: "en-US",
      interimResults: true,
      continuous: false,
      maxAlternatives: 1,
      requiresOnDeviceRecognition: false,
    });

    expect(startMock).toHaveBeenCalledOnce();

    emit("result", {
      isFinal: false,
      results: [{ transcript: "hello", confidence: 0.9, segments: [] }],
    });
    emit("result", {
      isFinal: true,
      results: [{ transcript: "hello world", confidence: 0.95, segments: [] }],
    });

    expect(partial).toHaveBeenCalledOnce();
    expect(final).toHaveBeenCalledOnce();
    expect(partial.mock.calls[0][0].kind).toBe("partial");
    expect(final.mock.calls[0][0].kind).toBe("final");

    session.dispose();
  });

  it("normalizes permission denied errors", async () => {
    const onError = vi.fn();

    getPermissionsAsyncMock.mockResolvedValue({
      granted: false,
      canAskAgain: false,
      status: "denied",
    });
    requestPermissionsAsyncMock.mockResolvedValue({
      granted: false,
      canAskAgain: false,
      status: "denied",
    });

    const session = new ExpoSpeechRecognitionSession({ onError });

    await session.start({
      action: "start",
      sessionId: "s2",
      locale: "en-US",
      interimResults: true,
    });

    expect(startMock).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0].code).toBe("permission_denied");

    session.dispose();
  });

  it("supports stop and cancel controls", async () => {
    const session = new ExpoSpeechRecognitionSession();

    await session.start({
      action: "start",
      sessionId: "s3",
      locale: "en-US",
      interimResults: true,
    });

    await session.stop({ action: "stop", sessionId: "s3" });
    await session.cancel({ action: "cancel", sessionId: "s3" });

    expect(stopMock).toHaveBeenCalledOnce();
    expect(abortMock).toHaveBeenCalledOnce();

    session.dispose();
  });
});
