import { useCallback, useEffect, useState } from "react";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";

export function useSTT() {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);

  useSpeechRecognitionEvent("result", (event) => {
    const joined = event.results
      .map((result) => result.transcript)
      .join(" ")
      .trim();
    setTranscript(joined);
  });

  useSpeechRecognitionEvent("end", () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent("error", () => {
    setIsListening(false);
  });

  useEffect(() => {
    return () => {
      ExpoSpeechRecognitionModule.abort();
    };
  }, []);

  const startListening = useCallback(async () => {
    setTranscript("");

    const permissions = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permissions.granted) {
      setIsListening(false);
      return;
    }

    setIsListening(true);

    await ExpoSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: true,
      continuous: false,
      maxAlternatives: 1,
      requiresOnDeviceRecognition: false,
    });
  }, []);

  return { transcript, isListening, startListening };
}
