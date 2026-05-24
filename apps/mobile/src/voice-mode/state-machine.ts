import { parseWakeWordCommand } from './wake-word';

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
  private snapshot: VoiceModeSnapshot = {
    status: 'idle',
    partialTranscript: '',
    lastCommand: null,
    error: null,
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
    this.snapshot = {
      ...this.snapshot,
      status:
        this.snapshot.status === 'listening' && parsed.wakeWordDetected
          ? 'wake-detected'
          : this.snapshot.status,
      partialTranscript: transcript,
      error: null,
    };

    return this.snapshot;
  }

  public receiveFinalTranscript(transcript: string): VoiceModeSnapshot {
    const normalizedTranscript = transcript.trim();
    const command = this.extractCommand(normalizedTranscript);

    if (command) {
      this.snapshot = {
        ...this.snapshot,
        status: 'processing',
        partialTranscript: '',
        lastCommand: createCommand(command),
        error: null,
      };

      return this.snapshot;
    }

    if (this.snapshot.status === 'listening') {
      const parsed = parseWakeWordCommand(normalizedTranscript);
      this.snapshot = {
        ...this.snapshot,
        status: parsed.wakeWordDetected ? 'wake-detected' : 'listening',
        partialTranscript: '',
        error: null,
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

  private extractCommand(normalizedTranscript: string): string | null {
    if (!normalizedTranscript) {
      return null;
    }

    if (this.snapshot.status === 'wake-detected') {
      const parsed = parseWakeWordCommand(normalizedTranscript);
      return parsed.wakeWordDetected ? parsed.command : normalizedTranscript;
    }

    if (this.snapshot.status !== 'listening') {
      return null;
    }

    const parsed = parseWakeWordCommand(normalizedTranscript);
    return parsed.wakeWordDetected ? parsed.command : null;
  }
}
