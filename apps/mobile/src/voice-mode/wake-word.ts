export type WakeWordParseResult =
  | {
      readonly wakeWordDetected: false;
      readonly command: null;
    }
  | {
      readonly wakeWordDetected: true;
      readonly command: string | null;
    };

const WAKE_WORD_PATTERN = /\baura\b/i;
const COMMAND_PREFIX_PATTERN = /^[\s,.:;!?-]+/;

export function parseWakeWordCommand(transcript: string): WakeWordParseResult {
  const normalizedTranscript = transcript.trim();
  const match = WAKE_WORD_PATTERN.exec(normalizedTranscript);

  if (!match) {
    return {
      wakeWordDetected: false,
      command: null,
    };
  }

  const command = normalizedTranscript
    .slice(match.index + match[0].length)
    .replace(COMMAND_PREFIX_PATTERN, '')
    .trim();

  return {
    wakeWordDetected: true,
    command: command.length > 0 ? command : null,
  };
}
