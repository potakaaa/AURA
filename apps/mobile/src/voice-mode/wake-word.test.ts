import { describe, expect, it } from 'vitest';

import { parseWakeWordCommand } from './wake-word';

describe('parseWakeWordCommand', () => {
  it('returns no command when wake word is absent', () => {
    expect(parseWakeWordCommand('summarize my emails')).toEqual({
      wakeWordDetected: false,
      command: null,
    });
  });

  it('extracts the command after AURA', () => {
    expect(parseWakeWordCommand('AURA summarize my emails')).toEqual({
      wakeWordDetected: true,
      command: 'summarize my emails',
    });
  });

  it('matches mixed case and punctuation', () => {
    expect(parseWakeWordCommand('hey, aura: turn on focus mode')).toEqual({
      wakeWordDetected: true,
      command: 'turn on focus mode',
    });
  });

  it('does not match embedded words', () => {
    expect(parseWakeWordCommand('the aural setting is too bright')).toEqual({
      wakeWordDetected: false,
      command: null,
    });
  });
});
