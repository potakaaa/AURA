import { describe, expect, it } from 'vitest';

import { parseWakeWordCommand, WakeWordParser } from './wake-word';

describe('parseWakeWordCommand', () => {
  it('returns no command when wake word is absent', () => {
    expect(parseWakeWordCommand('summarize my emails')).toMatchObject({
      wakeWordDetected: false,
      command: null,
      transcriptWithoutWakeWord: 'summarize my emails',
      suppressedByCooldown: false,
    });
  });

  it('extracts the command after AURA', () => {
    expect(parseWakeWordCommand('AURA summarize my emails')).toMatchObject({
      wakeWordDetected: true,
      command: 'summarize my emails',
      transcriptWithoutWakeWord: 'summarize my emails',
      suppressedByCooldown: false,
    });
  });

  it('matches mixed case and punctuation', () => {
    expect(parseWakeWordCommand('hey, aura: turn on focus mode')).toMatchObject({
      wakeWordDetected: true,
      command: 'turn on focus mode',
      transcriptWithoutWakeWord: 'hey turn on focus mode',
      suppressedByCooldown: false,
    });
  });

  it('supports Hey AURA command phrasing', () => {
    expect(parseWakeWordCommand("Hey AURA, what's my schedule?")).toMatchObject({
      wakeWordDetected: true,
      command: "what's my schedule?",
      transcriptWithoutWakeWord: "Hey what's my schedule?",
      suppressedByCooldown: false,
    });
  });

  it.each([
    ['or a summarize my emails', 'summarize my emails'],
    ['or rat find the latest document', 'find the latest document'],
    ['hey, or uh schedule my day', 'schedule my day'],
    ['our a what is next', 'what is next'],
    ['ora start focus mode', 'start focus mode'],
  ])('accepts common AURA misrecognition "%s"', (transcript, command) => {
    expect(parseWakeWordCommand(transcript)).toMatchObject({
      wakeWordDetected: true,
      command,
      transcriptWithoutWakeWord: command,
      suppressedByCooldown: false,
    });
  });

  it('only matches ambiguous wake-word aliases at the start of the utterance', () => {
    expect(parseWakeWordCommand('send the report or a summary')).toMatchObject({
      wakeWordDetected: false,
      command: null,
      transcriptWithoutWakeWord: 'send the report or a summary',
      suppressedByCooldown: false,
    });
  });

  it('does not match embedded words', () => {
    expect(parseWakeWordCommand('the aural setting is too bright')).toMatchObject({
      wakeWordDetected: false,
      command: null,
      transcriptWithoutWakeWord: 'the aural setting is too bright',
      suppressedByCooldown: false,
    });
  });

  it('suppresses duplicate command triggers inside the cooldown', () => {
    let now = 1_000;
    const parser = new WakeWordParser({
      cooldownMs: 2_500,
      nowMs: () => now,
    });

    expect(parser.parse('AURA summarize my notes')).toMatchObject({
      wakeWordDetected: true,
      command: 'summarize my notes',
      suppressedByCooldown: false,
    });

    now = 2_000;
    expect(parser.parse('aura summarize my notes')).toMatchObject({
      wakeWordDetected: true,
      command: null,
      suppressedByCooldown: true,
    });
  });

  it('allows the same command after the cooldown expires', () => {
    let now = 1_000;
    const parser = new WakeWordParser({
      cooldownMs: 2_500,
      nowMs: () => now,
    });

    parser.parse('AURA summarize my notes');
    now = 3_600;

    expect(parser.parse('AURA summarize my notes')).toMatchObject({
      wakeWordDetected: true,
      command: 'summarize my notes',
      suppressedByCooldown: false,
    });
  });
});
