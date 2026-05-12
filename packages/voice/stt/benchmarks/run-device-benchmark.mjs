import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { formatDateStamp, mean, percentile, wordErrorRate } from './benchmark-utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');
const resultDir = path.join(__dirname, 'results', 'device-runs');

function parseArgs(argv) {
  const args = { input: null, output: null };

  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--input') {
      args.input = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (value === '--output') {
      args.output = argv[index + 1] ?? null;
      index += 1;
    }
  }

  return args;
}

function normalizeRunRow(row) {
  if (!row || typeof row !== 'object') {
    throw new Error('Each device benchmark row must be an object.');
  }

  const hypothesis = row.hypothesis ?? row.transcript ?? row.transcribedText ?? '';
  const latencyMs = Number(row.latencyMs ?? row.latency ?? row.durationMs ?? 0);

  return {
    id: row.id,
    hypothesis,
    latencyMs,
  };
}

async function main() {
  const { input, output } = parseArgs(process.argv);
  if (!input) {
    throw new Error(
      'Usage: node stt/benchmarks/run-device-benchmark.mjs --input <device-run.json> [--output <path>]'
    );
  }

  const utterances = JSON.parse(
    await fs.readFile(path.join(dataDir, 'utterances.en.json'), 'utf8')
  );
  const rawRun = JSON.parse(await fs.readFile(input, 'utf8'));
  const deviceRows = Array.isArray(rawRun)
    ? rawRun
    : (rawRun.rows ?? rawRun.utterances ?? rawRun.transcripts);

  if (!Array.isArray(deviceRows)) {
    throw new Error('Input JSON must contain an array of rows, rows, utterances, or transcripts.');
  }

  const utteranceMap = new Map(utterances.map((utterance) => [utterance.id, utterance]));
  const rows = deviceRows.map((row, index) => {
    const normalized = normalizeRunRow(row);
    const utterance = utteranceMap.get(normalized.id) ?? utterances[index];

    if (!utterance) {
      throw new Error(`No utterance found for row ${index + 1}.`);
    }

    return {
      id: utterance.id,
      environment: utterance.environment,
      reference: utterance.reference,
      hypothesis: normalized.hypothesis,
      latencyMs: normalized.latencyMs,
      wer: wordErrorRate(utterance.reference, normalized.hypothesis),
    };
  });

  if (rows.length !== utterances.length) {
    throw new Error(`Expected ${utterances.length} device rows but received ${rows.length}.`);
  }

  const quietRows = rows.filter((item) => item.environment === 'quiet');
  const noisyRows = rows.filter((item) => item.environment === 'noisy');
  const summary = {
    generatedAt: new Date().toISOString(),
    source: path.resolve(input),
    utteranceCount: rows.length,
    metrics: {
      wer: Number(mean(rows.map((item) => item.wer)).toFixed(3)),
      werQuiet: Number(mean(quietRows.map((item) => item.wer)).toFixed(3)),
      werNoisy: Number(mean(noisyRows.map((item) => item.wer)).toFixed(3)),
      latencyP50Ms: percentile(
        rows.map((item) => item.latencyMs),
        50
      ),
      latencyP95Ms: percentile(
        rows.map((item) => item.latencyMs),
        95
      ),
    },
  };

  await fs.mkdir(resultDir, { recursive: true });

  const outputPath = output
    ? path.resolve(output)
    : path.join(resultDir, `device-${formatDateStamp()}.json`);

  await fs.writeFile(
    outputPath,
    JSON.stringify(
      {
        type: 'device-stt-benchmark',
        utterances,
        rows,
        summary,
      },
      null,
      2
    ),
    'utf8'
  );

  console.log('Wrote device benchmark:');
  console.log(outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
