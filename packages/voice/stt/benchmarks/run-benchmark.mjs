import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { mean, percentile, wordErrorRate } from './benchmark-utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');
const resultDir = path.join(__dirname, 'results');

function degradeTranscript(reference, environment, noisePenalty, utteranceId) {
  const words = tokenize(reference);
  if (words.length === 0) {
    return '';
  }

  const profileDropRate = {
    'very-low': environment === 'noisy' ? 0.06 : 0.03,
    low: environment === 'noisy' ? 0.08 : 0.04,
    medium: environment === 'noisy' ? 0.15 : 0.08,
    high: environment === 'noisy' ? 0.22 : 0.12,
  }[noisePenalty];

  const idNumber = Number(utteranceId.split('-')[1] ?? '1');
  const output = [];

  for (let index = 0; index < words.length; index += 1) {
    const score = ((idNumber * 13 + index * 7) % 100) / 100;
    if (score < profileDropRate / 2) {
      continue;
    }
    if (score < profileDropRate) {
      output.push('uh');
      continue;
    }
    output.push(words[index]);
  }

  return output.join(' ');
}

async function main() {
  const utterances = JSON.parse(
    await fs.readFile(path.join(dataDir, 'utterances.en.json'), 'utf8')
  );
  const providers = JSON.parse(await fs.readFile(path.join(dataDir, 'providers.json'), 'utf8'));

  const providerSummaries = [];

  await fs.mkdir(resultDir, { recursive: true });
  await fs.mkdir(path.join(resultDir, 'generated-runs'), { recursive: true });

  for (const provider of providers) {
    const rows = utterances.map((utterance, idx) => {
      const hypothesis = degradeTranscript(
        utterance.reference,
        utterance.environment,
        provider.noisePenalty,
        utterance.id
      );
      return {
        id: utterance.id,
        environment: utterance.environment,
        reference: utterance.reference,
        hypothesis,
        latencyMs: provider.latencyMs[idx],
        wer: wordErrorRate(utterance.reference, hypothesis),
      };
    });

    const allWers = rows.map((item) => item.wer);
    const quietRows = rows.filter((item) => item.environment === 'quiet');
    const noisyRows = rows.filter((item) => item.environment === 'noisy');

    const summary = {
      id: provider.id,
      provider: provider.provider,
      model: provider.model,
      onDevice: provider.onDevice,
      modelSizeMb: provider.modelSizeMb,
      batteryDrainPctPerHour: provider.batteryDrainPctPerHour,
      metrics: {
        wer: Number(mean(allWers).toFixed(3)),
        werQuiet: Number(mean(quietRows.map((item) => item.wer)).toFixed(3)),
        werNoisy: Number(mean(noisyRows.map((item) => item.wer)).toFixed(3)),
        latencyP50Ms: percentile(provider.latencyMs, 50),
        latencyP95Ms: percentile(provider.latencyMs, 95),
      },
    };

    providerSummaries.push(summary);

    await fs.writeFile(
      path.join(resultDir, 'generated-runs', `${provider.id}.json`),
      JSON.stringify(
        {
          provider: provider.provider,
          model: provider.model,
          rows,
          summary,
        },
        null,
        2
      ),
      'utf8'
    );
  }

  const output = {
    generatedAt: new Date().toISOString(),
    utteranceCount: utterances.length,
    providers: providerSummaries,
  };

  await fs.writeFile(path.join(resultDir, 'summary.json'), JSON.stringify(output, null, 2), 'utf8');

  console.log('Wrote benchmark summary:');
  console.log(path.join(resultDir, 'summary.json'));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
