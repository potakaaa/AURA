import { describe, expect, it } from 'vitest';

import { VoiceModeStateMachine } from './state-machine';

const recoverableError = {
  sessionId: 's1',
  code: 'no_speech' as const,
  message: 'No speech detected.',
  recoverable: true,
};

const permissionError = {
  sessionId: 's1',
  code: 'permission_denied' as const,
  message: 'Permission denied.',
  recoverable: false,
};

describe('VoiceModeStateMachine', () => {
  it('transitions from idle to listening', () => {
    const machine = new VoiceModeStateMachine();

    expect(machine.getSnapshot().status).toBe('idle');
    expect(machine.startListening().status).toBe('listening');
  });

  it('moves to wake-detected when the final transcript is only the wake word', () => {
    const machine = new VoiceModeStateMachine();

    machine.startListening();
    const snapshot = machine.receiveFinalTranscript('AURA');

    expect(snapshot.status).toBe('wake-detected');
    expect(snapshot.lastCommand).toBeNull();
    expect(snapshot.wakeSignalId).toBe(1);
  });

  it('moves to processing when the wake word includes a command', () => {
    const machine = new VoiceModeStateMachine();

    machine.startListening();
    const snapshot = machine.receiveFinalTranscript('AURA summarize my emails');

    expect(snapshot.status).toBe('processing');
    expect(snapshot.lastCommand?.text).toBe('summarize my emails');
    expect(snapshot.wakeSignalId).toBe(1);
  });

  it('signals the wake cue only once for repeated partial wake detections', () => {
    const machine = new VoiceModeStateMachine();

    machine.startListening();
    const first = machine.receivePartialTranscript('AURA');
    const second = machine.receivePartialTranscript('AURA summarize');

    expect(first.status).toBe('wake-detected');
    expect(first.wakeSignalId).toBe(1);
    expect(second.status).toBe('wake-detected');
    expect(second.wakeSignalId).toBe(1);
  });

  it('captures the next final transcript after wake-only speech', () => {
    const machine = new VoiceModeStateMachine();

    machine.startListening();
    machine.receiveFinalTranscript('AURA');
    machine.handleRecognitionEnd();
    const snapshot = machine.receiveFinalTranscript('schedule my day');

    expect(snapshot.status).toBe('processing');
    expect(snapshot.lastCommand?.text).toBe('schedule my day');
  });

  it('can promote a partial wake command when no final transcript arrives', () => {
    const machine = new VoiceModeStateMachine();

    machine.startListening();
    machine.receivePartialTranscript('AURA find the latest document about our backend setup');
    const snapshot = machine.promotePartialTranscriptToCommand();

    expect(snapshot.status).toBe('processing');
    expect(snapshot.partialTranscript).toBe('');
    expect(snapshot.wakeSignalId).toBe(1);
    expect(snapshot.lastCommand?.text).toBe(
      'find the latest document about our backend setup'
    );
  });

  it('restarts listening after recoverable errors and recognition end', () => {
    const machine = new VoiceModeStateMachine();

    machine.startListening();

    expect(machine.handleError(recoverableError).status).toBe('listening');
    expect(machine.handleRecognitionEnd().status).toBe('listening');
  });

  it('enters error and does not retry after permission errors', () => {
    const machine = new VoiceModeStateMachine();

    machine.startListening();

    const snapshot = machine.handleError(permissionError);
    expect(snapshot.status).toBe('error');
    expect(snapshot.error?.code).toBe('permission_denied');
    expect(machine.handleRecognitionEnd().status).toBe('error');
  });
});
