import { useCallback, useEffect, useMemo, useState } from "react";
import { ExpoSpeechRecognitionSession } from "@aura/voice";

export function useSTT() {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);

  const session = useMemo(
    () =>
      new ExpoSpeechRecognitionSession({
        onStatusChange: (status) => {
          setIsListening(status === "starting" || status === "listening");
        },
        onPartialTranscript: (result) => {
          setTranscript(result.transcript);
        },
        onFinalTranscript: (result) => {
          setTranscript(result.transcript);
        },
      }),
    [],
  );

  useEffect(() => {
    return () => {
      session.dispose();
    };
  }, [session]);

  const startListening = useCallback(async () => {
    setTranscript("");

    await session.start({
      action: "start",
      sessionId: crypto.randomUUID(),
      locale: "en-US",
      interimResults: true,
      continuous: false,
      maxAlternatives: 1,
      requiresOnDeviceRecognition: false,
    });
  }, [session]);

  return { transcript, isListening, startListening };
}
