import { useSpeechRecognition } from "./useSpeechRecognition";

export function useSTT() {
  const { transcript, isListening, startListening } = useSpeechRecognition();

  return { transcript, isListening, startListening };
}
