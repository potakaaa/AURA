export type WakeWordParseResult =
  | {
      readonly wakeWordDetected: false;
      readonly command: null;
      readonly transcriptWithoutWakeWord: string;
      readonly suppressedByCooldown: false;
    }
  | {
      readonly wakeWordDetected: true;
      readonly command: string | null;
      readonly transcriptWithoutWakeWord: string;
      readonly suppressedByCooldown: boolean;
    };

const WAKE_WORD_PATTERN = /\baura\b/i;
const WAKE_WORD_ALIAS_PATTERN =
  /^(?:hey[\s,.:;!?-]+|ok(?:ay)?[\s,.:;!?-]+)?(?:or\s+a|or\s+uh|our\s+a|ora|or\s+rat)\b/i;
const COMMAND_PREFIX_PATTERN = /^[\s,.:;!?-]+/;
const COMMAND_SUFFIX_PATTERN = /[\s,.:;!?-]+$/;
const DEFAULT_WAKE_WORD_COOLDOWN_MS = 2_500;

export interface WakeWordParserOptions {
  readonly cooldownMs?: number;
  readonly nowMs?: () => number;
}

function normalizeTranscript(transcript: string): string {
  return transcript.replace(/\s+/g, ' ').trim();
}

function normalizeTriggerKey(command: string | null): string {
  return (command ?? '__wake_only__').toLocaleLowerCase();
}

function removeWakeWord(transcript: string, matchIndex: number, matchLength: number): string {
  const beforeWakeWord = transcript.slice(0, matchIndex).replace(COMMAND_SUFFIX_PATTERN, '').trim();
  const afterWakeWord = transcript
    .slice(matchIndex + matchLength)
    .replace(COMMAND_PREFIX_PATTERN, '')
    .trim();

  return [beforeWakeWord, afterWakeWord].filter(Boolean).join(' ');
}

export function parseWakeWordCommand(transcript: string): WakeWordParseResult {
  const normalizedTranscript = normalizeTranscript(transcript);
  const match =
    WAKE_WORD_PATTERN.exec(normalizedTranscript) ??
    WAKE_WORD_ALIAS_PATTERN.exec(normalizedTranscript);

  if (!match) {
    return {
      wakeWordDetected: false,
      command: null,
      transcriptWithoutWakeWord: normalizedTranscript,
      suppressedByCooldown: false,
    };
  }

  const command = normalizedTranscript
    .slice(match.index + match[0].length)
    .replace(COMMAND_PREFIX_PATTERN, '')
    .trim();

  return {
    wakeWordDetected: true,
    command: command.length > 0 ? command : null,
    transcriptWithoutWakeWord: removeWakeWord(normalizedTranscript, match.index, match[0].length),
    suppressedByCooldown: false,
  };
}

export class WakeWordParser {
  private readonly cooldownMs: number;
  private readonly nowMs: () => number;
  private lastTriggerKey: string | null = null;
  private lastTriggeredAtMs = Number.NEGATIVE_INFINITY;

  public constructor(options: WakeWordParserOptions = {}) {
    this.cooldownMs = options.cooldownMs ?? DEFAULT_WAKE_WORD_COOLDOWN_MS;
    this.nowMs = options.nowMs ?? Date.now;
  }

  public parse(transcript: string): WakeWordParseResult {
    const parsed = parseWakeWordCommand(transcript);

    if (!parsed.wakeWordDetected) {
      return parsed;
    }

    const triggerKey = normalizeTriggerKey(parsed.command);
    const now = this.nowMs();
    const suppressedByCooldown =
      this.lastTriggerKey === triggerKey && now - this.lastTriggeredAtMs < this.cooldownMs;

    if (!suppressedByCooldown) {
      this.lastTriggerKey = triggerKey;
      this.lastTriggeredAtMs = now;
    }

    return {
      ...parsed,
      command: suppressedByCooldown ? null : parsed.command,
      suppressedByCooldown,
    };
  }

  public resetCooldown(): void {
    this.lastTriggerKey = null;
    this.lastTriggeredAtMs = Number.NEGATIVE_INFINITY;
  }
}
