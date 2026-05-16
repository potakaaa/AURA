import { useState } from "react";
import { Button, ScrollView, Text, View } from "react-native";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";

export default function SttTestScreen() {
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const append = (msg: string) => setLog((prev) => [...prev, msg]);

  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results.map((result) => result.transcript).join(" ").trim();
    append(`transcript: \"${transcript}\"`);
  });

  useSpeechRecognitionEvent("end", () => {
    setRunning(false);
    append("recognition ended");
  });

  useSpeechRecognitionEvent("error", (event) => {
    setRunning(false);
    append(`error: ${event.error} (${event.message})`);
  });

  const runTest = async () => {
    setRunning(true);
    append("starting recognition...");

    try {
      const permissions = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permissions.granted) {
        append("permission denied");
        setRunning(false);
        return;
      }

      await ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
      });
    } catch (error) {
      append(`error: ${String(error)}`);
      setRunning(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Button title={running ? "Listening..." : "Start Speech Test"} onPress={runTest} disabled={running} />
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
