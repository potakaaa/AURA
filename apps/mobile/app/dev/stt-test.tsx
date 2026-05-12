import { useState } from "react";
import { Button, ScrollView, Text, View } from "react-native";

import {
  AndroidWhisperCppCapture,
  AndroidWhisperCppEngine,
  WhisperSttSession,
} from "@aura/voice";

const engine = new AndroidWhisperCppEngine("base");
const capture = new AndroidWhisperCppCapture();
const session = new WhisperSttSession(capture, engine, {
  chunking: {
    sampleRateHz: 16000,
    chunkSeconds: 1.5,
    overlapSeconds: 0.25,
  },
});

export default function SttTestScreen() {
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const append = (msg: string) => setLog((prev) => [...prev, msg]);

  const runTest = async () => {
    setRunning(true);
    append("▶ Starting capture...");

    try {
      const result = await session.transcribeFromCapture({
        utteranceId: "test-001",
        language: "en",
        environment: "quiet",
        maxDurationSeconds: 5,
      });

      append(`✅ Transcript: "${result.transcript}"`);
      append(`⏱ Latency: ${result.totalLatencyMs}ms`);
      append(`📦 Chunks: ${result.chunkCount}`);
    } catch (error) {
      append(`❌ Error: ${String(error)}`);
    }

    setRunning(false);
  };

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Button title={running ? "Listening..." : "Start 5s Test"} onPress={runTest} disabled={running} />
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