import { useEffect, useState } from "react";
import { Button, ScrollView, Text, View } from "react-native";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

export default function SttTestScreen() {
  const [log, setLog] = useState<string[]>([]);
  const {
    status,
    isListening,
    partialTranscript,
    finalTranscript,
    error,
    startListening,
    stopListening,
    cancelListening,
    resetTranscript,
  } = useSpeechRecognition();

  const append = (msg: string) => setLog((prev) => [...prev, msg]);

  useEffect(() => {
    append(`status: ${status}`);
  }, [status]);

  useEffect(() => {
    if (partialTranscript) {
      append(`partial: "${partialTranscript}"`);
    }
  }, [partialTranscript]);

  useEffect(() => {
    if (finalTranscript) {
      append(`final: "${finalTranscript}"`);
    }
  }, [finalTranscript]);

  useEffect(() => {
    if (error) {
      append(`error: ${error.code} (${error.message})`);
    }
  }, [error]);

  const runTest = async () => {
    append("starting recognition...");
    await startListening();
  };

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Button
        title={isListening ? "Listening..." : "Start Speech Test"}
        onPress={runTest}
        disabled={isListening}
      />
      <View style={{ marginTop: 8 }}>
        <Button title="Stop" onPress={stopListening} disabled={!isListening} />
      </View>
      <View style={{ marginTop: 8 }}>
        <Button title="Cancel" onPress={cancelListening} disabled={!isListening && status !== "processing"} />
      </View>
      <View style={{ marginTop: 8 }}>
        <Button
          title="Reset"
          onPress={() => {
            resetTranscript();
            setLog([]);
          }}
        />
      </View>
      <ScrollView style={{ marginTop: 16 }}>
        {log.map((line, index) => (
          <Text key={index} style={{ fontFamily: "monospace", fontSize: 13 }}>
            {line}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}
