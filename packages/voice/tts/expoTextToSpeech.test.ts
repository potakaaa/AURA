import { beforeEach, describe, expect, it, vi } from "vitest";

const { speechState, speakMock, stopMock, isSpeakingAsyncMock, getAvailableVoicesAsyncMock } =
  vi.hoisted(() => ({
    speechState: {
      options: null as null | Record<string, unknown>,
      maxSpeechInputLength: 100,
    },
    speakMock: vi.fn((text: string, options: Record<string, unknown>) => {
      speechState.options = options;
    }),
    stopMock: vi.fn(async () => {}),
    isSpeakingAsyncMock: vi.fn(async () => false),
    getAvailableVoicesAsyncMock: vi.fn(async () => [
      { identifier: "voice-1", name: "Ava", language: "en-US", quality: "Enhanced" },
    ]),
  }));

vi.mock("expo-speech", () => ({
  get maxSpeechInputLength() {
    return speechState.maxSpeechInputLength;
  },
  speak: speakMock,
  stop: stopMock,
  isSpeakingAsync: isSpeakingAsyncMock,
  getAvailableVoicesAsync: getAvailableVoicesAsyncMock,
}));

import { ExpoTextToSpeechSession } from "./expoTextToSpeech";

describe("ExpoTextToSpeechSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    speechState.options = null;
    speechState.maxSpeechInputLength = 100;
  });

  it("starts speech with normalized options", async () => {
    const onStatusChange = vi.fn();
    const onStart = vi.fn();
    const session = new ExpoTextToSpeechSession({ onStatusChange, onStart });

    await session.speak({
      utteranceId: "u1",
      text: " Hello Aura ",
      locale: "en-US",
      rate: 0.94,
      pitch: 1,
      voice: "voice-1",
    });

    expect(stopMock).toHaveBeenCalledOnce();
    expect(speakMock).toHaveBeenCalledWith(
      "Hello Aura",
      expect.objectContaining({
        language: "en-US",
        rate: 0.94,
        pitch: 1,
        voice: "voice-1",
      }),
    );

    (speechState.options?.onStart as () => void)();

    expect(onStatusChange).toHaveBeenCalledWith("speaking");
    expect(onStart).toHaveBeenCalledWith("u1");
  });

  it("stops the current utterance before a new one", async () => {
    const session = new ExpoTextToSpeechSession();

    await session.speak({
      utteranceId: "u1",
      text: "First",
      locale: "en-US",
      rate: 1,
      pitch: 1,
    });
    (speechState.options?.onStart as () => void)();

    await session.speak({
      utteranceId: "u2",
      text: "Second",
      locale: "en-US",
      rate: 1,
      pitch: 1,
    });

    expect(stopMock).toHaveBeenCalledTimes(2);
  });

  it("emits stopped and error transitions", async () => {
    const onStatusChange = vi.fn();
    const onStopped = vi.fn();
    const onError = vi.fn();
    const session = new ExpoTextToSpeechSession({ onStatusChange, onStopped, onError });

    await session.speak({
      utteranceId: "u1",
      text: "Reply",
      locale: "en-US",
      rate: 1,
      pitch: 1,
    });

    (speechState.options?.onStart as () => void)();
    (speechState.options?.onStopped as () => void)();

    expect(onStatusChange).toHaveBeenLastCalledWith("stopped");
    expect(onStopped).toHaveBeenCalledWith("u1");

    await session.speak({
      utteranceId: "u2",
      text: "Reply",
      locale: "en-US",
      rate: 1,
      pitch: 1,
    });
    (speechState.options?.onError as (error: unknown) => void)(new Error("interrupted"));

    expect(onStatusChange).toHaveBeenLastCalledWith("error");
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: "interrupted" }));
  });

  it("rejects empty and over-limit text", async () => {
    const onError = vi.fn();
    const session = new ExpoTextToSpeechSession({ onError });

    await expect(
      session.speak({
        utteranceId: "empty",
        text: " ",
        locale: "en-US",
        rate: 1,
        pitch: 1,
      }),
    ).rejects.toThrow("non-empty text");

    speechState.maxSpeechInputLength = 4;

    await expect(
      session.speak({
        utteranceId: "long",
        text: "Too long",
        locale: "en-US",
        rate: 1,
        pitch: 1,
      }),
    ).rejects.toThrow("character limit");

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: "invalid_text" }));
  });

  it("returns available voices", async () => {
    const session = new ExpoTextToSpeechSession();

    await expect(session.getAvailableVoices()).resolves.toEqual([
      { identifier: "voice-1", name: "Ava", language: "en-US", quality: "Enhanced" },
    ]);
  });
});
