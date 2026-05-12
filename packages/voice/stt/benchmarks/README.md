# STT benchmark harness

## Purpose

Produce reproducible benchmark summaries for STT option comparison:

- WER on a 24-utterance English command set
- Latency percentiles (`p50`, `p95`)
- Model size and battery estimate columns

## Commands

From repository root:

```bash
node packages/voice/stt/benchmarks/run-benchmark.mjs
node packages/voice/stt/benchmarks/run-device-benchmark.mjs --input /path/to/device-run.json
node packages/voice/stt/smoke/run-smoke.mjs
```

From `packages/voice`:

```bash
pnpm stt:benchmark
pnpm stt:benchmark:device -- --input /path/to/device-run.json
```

## Inputs

- `data/utterances.en.json` - reference utterances and environment labels.
- `data/providers.json` - provider/model profiles, latency series, battery estimates.
- Device runs can be supplied as either a top-level array or a `{ "rows": [...] }` object.
- Each row should include `id`, `hypothesis` or `transcript`, and `latencyMs`.

## Outputs

- `results/summary.json` - aggregate benchmark summary.
- `results/generated-runs/*.json` - per-provider utterance-level rows.
- `results/device-runs/device-<date>.json` - device-run WER summary.
- `../smoke/results/quiet.json` - quiet environment smoke result.
- `../smoke/results/noisy.json` - noisy environment smoke result.
