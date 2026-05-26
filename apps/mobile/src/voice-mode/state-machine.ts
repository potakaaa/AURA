import { parseWakeWordCommand, WakeWordParser } from './wake-word';

export type VoiceModeStatus = 'idle' | 'listening' | 'wake-detected' | 'processing' | 'error';

export interface VoiceModeError {
  readonly sessionId: string;
  readonly code:
    | 'permission_denied'
    | 'not_available'
    | 'audio_capture'
    | 'no_speech'
    | 'aborted'
    | 'network'
    | 'timeout'
    | 'unknown';
  readonly message: string;
  readonly recoverable: boolean;
  readonly rawCode?: string;
}

export interface VoiceModeCommand {
  readonly id: string;
  readonly text: string;
}

export interface VoiceModeSnapshot {
  readonly status: VoiceModeStatus;
  readonly partialTranscript: string;
  readonly lastCommand: VoiceModeCommand | null;
  readonly error: VoiceModeError | null;
  readonly wakeSignalId: number;
}

let commandCounter = 0;

function nextCommandId(): string {
  commandCounter += 1;
  return `voice-command-${commandCounter}`;
}

function createCommand(text: string): VoiceModeCommand {
  return {
    id: nextCommandId(),
    text,
  };
}

function isFatalError(error: VoiceModeError): boolean {
  return !error.recoverable || error.code === 'permission_denied' || error.code === 'not_available';
}

export class VoiceModeStateMachine {
  private readonly wakeWordParser = new WakeWordParser();
  private wakeSignalCounter = 0;

  private snapshot: VoiceModeSnapshot = {
    status: 'idle',
    partialTranscript: '',
    lastCommand: null,
    error: null,
    wakeSignalId: 0,
  };

  public getSnapshot(): VoiceModeSnapshot {
    return this.snapshot;
  }

  public startListening(): VoiceModeSnapshot {
    this.snapshot = {
      ...this.snapshot,
      status: 'listening',
      partialTranscript: '',
      error: null,
    };

    return this.snapshot;
  }

  public stop(): VoiceModeSnapshot {
    this.snapshot = {
      ...this.snapshot,
      status: 'idle',
      partialTranscript: '',
    };

    return this.snapshot;
  }

  public receivePartialTranscript(transcript: string): VoiceModeSnapshot {
    if (this.snapshot.status === 'idle' || this.snapshot.status === 'processing') {
      return this.snapshot;
    }

    const parsed = parseWakeWordCommand(transcript);
    const detectedWakeWord =
      this.snapshot.status === 'listening' &&
      parsed.wakeWordDetected &&
      !parsed.suppressedByCooldown;
    this.snapshot = {
      ...this.snapshot,
      status: detectedWakeWord ? 'wake-detected' : this.snapshot.status,
      partialTranscript: transcript,
      error: null,
      wakeSignalId: detectedWakeWord ? this.nextWakeSignalId() : this.snapshot.wakeSignalId,
    };

    return this.snapshot;
  }

  public receiveFinalTranscript(transcript: string): VoiceModeSnapshot {
    const normalizedTranscript = transcript.trim();
    const parsed = this.parseFinalTranscript(normalizedTranscript);
    const command = parsed.command;

    if (command) {
      this.snapshot = {
        ...this.snapshot,
        status: 'processing',
        partialTranscript: '',
        lastCommand: createCommand(command),
        error: null,
        wakeSignalId:
          this.snapshot.status === 'listening' &&
          parsed.wakeWordDetected &&
          !parsed.suppressedByCooldown
            ? this.nextWakeSignalId()
            : this.snapshot.wakeSignalId,
      };

      return this.snapshot;
    }

    if (this.snapshot.status === 'listening') {
      this.snapshot = {
        ...this.snapshot,
        status:
          parsed.wakeWordDetected && !parsed.suppressedByCooldown ? 'wake-detected' : 'listening',
        partialTranscript: '',
        error: null,
        wakeSignalId:
          parsed.wakeWordDetected && !parsed.suppressedByCooldown
            ? this.nextWakeSignalId()
            : this.snapshot.wakeSignalId,
      };

      return this.snapshot;
    }

    this.snapshot = {
      ...this.snapshot,
      status: 'wake-detected',
      partialTranscript: '',
      error: null,
    };

    return this.snapshot;
  }

  public promotePartialTranscriptToCommand(): VoiceModeSnapshot {
    const normalizedTranscript = this.snapshot.partialTranscript.trim();
    const parsed = this.parseFinalTranscript(normalizedTranscript);
    const command = parsed.command;

    if (!command) {
      return this.snapshot;
    }

    this.snapshot = {
      ...this.snapshot,
      status: 'processing',
      partialTranscript: '',
      lastCommand: createCommand(command),
      error: null,
      wakeSignalId:
        this.snapshot.status === 'listening' &&
        parsed.wakeWordDetected &&
        !parsed.suppressedByCooldown
          ? this.nextWakeSignalId()
          : this.snapshot.wakeSignalId,
    };

    return this.snapshot;
  }

  public completeProcessing(): VoiceModeSnapshot {
    if (this.snapshot.status !== 'processing') {
      return this.snapshot;
    }

    this.snapshot = {
      ...this.snapshot,
      status: 'listening',
      partialTranscript: '',
      error: null,
    };

    return this.snapshot;
  }

  public handleRecognitionEnd(): VoiceModeSnapshot {
    if (this.snapshot.status === 'error' || this.snapshot.status === 'idle') {
      return this.snapshot;
    }

    const nextStatus =
      this.snapshot.status === 'processing' || this.snapshot.status === 'wake-detected'
        ? this.snapshot.status
        : 'listening';
    this.snapshot = {
      ...this.snapshot,
      status: nextStatus,
      partialTranscript: '',
    };

    return this.snapshot;
  }

  public handleError(error: VoiceModeError): VoiceModeSnapshot {
    if (!isFatalError(error)) {
      this.snapshot = {
        ...this.snapshot,
        status: 'listening',
        partialTranscript: '',
        error: null,
      };

      return this.snapshot;
    }

    this.snapshot = {
      ...this.snapshot,
      status: 'error',
      partialTranscript: '',
      error,
    };

    return this.snapshot;
  }

  public resetError(): VoiceModeSnapshot {
    this.snapshot = {
      ...this.snapshot,
      status: this.snapshot.status === 'error' ? 'idle' : this.snapshot.status,
      error: null,
    };

    return this.snapshot;
  }

  private parseFinalTranscript(normalizedTranscript: string): {
    wakeWordDetected: boolean;
    suppressedByCooldown: boolean;
    command: string | null;
  } {
    if (!normalizedTranscript) {
      return {
        wakeWordDetected: false,
        suppressedByCooldown: false,
        command: null,
      };
    }

    if (this.snapshot.status === 'wake-detected') {
      const parsed = this.wakeWordParser.parse(normalizedTranscript);
      if (parsed.suppressedByCooldown) {
        return parsed;
      }
      return {
        wakeWordDetected: parsed.wakeWordDetected,
        suppressedByCooldown: false,
        command: parsed.wakeWordDetected ? parsed.command : normalizedTranscript,
      };
    }

    if (this.snapshot.status !== 'listening') {
      return {
        wakeWordDetected: false,
        suppressedByCooldown: false,
        command: null,
      };
    }

    const parsed = this.wakeWordParser.parse(normalizedTranscript);
    return {
      wakeWordDetected: parsed.wakeWordDetected,
      suppressedByCooldown: parsed.suppressedByCooldown,
      command: parsed.suppressedByCooldown || !parsed.wakeWordDetected ? null : parsed.command,
    };
  }

  private nextWakeSignalId(): number {
    this.wakeSignalCounter += 1;
    return this.wakeSignalCounter;
  }
}
