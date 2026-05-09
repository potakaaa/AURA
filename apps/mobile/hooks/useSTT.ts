import { useCallback, useState } from "react";
import {
  AndroidWhisperCppCapture,
  AndroidWhisperCppEngine,
  WhisperSttSession,
} from "@aura/voice";

const engine = new AndroidWhisperCppEngine("base");
const capture = new AndroidWhisperCppCapture();
const session = new WhisperSttSession(capture, engine, {
  chunking: { windowSeconds: 1.5, overlapSeconds: 0.25 },
});

export function useSTT() {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);

  const startListening = useCallback(async () => {
    setIsListening(true);
    const result = await session.transcribeFromCapture({
      utteranceId: crypto.randomUUID(),
      language: "en",
      environment: "quiet",
      maxDurationSeconds: 15,
    });
    setTranscript(result.transcript);
    setIsListening(false);
  }, []);

  return { transcript, isListening, startListening };
}
