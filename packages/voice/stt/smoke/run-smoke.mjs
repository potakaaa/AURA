import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const benchmarkResultsDir = path.join(__dirname, "..", "benchmarks", "results", "generated-runs");
const outputDir = path.join(__dirname, "results");

async function main() {
  const baseRunPath = path.join(benchmarkResultsDir, "whispercpp-base.json");
  const baseRun = JSON.parse(await fs.readFile(baseRunPath, "utf8"));
  const rows = baseRun.rows;

  const quietRows = rows.filter((row) => row.environment === "quiet");
  const noisyRows = rows.filter((row) => row.environment === "noisy");

  const average = (values) => {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  const quietWer = Number(average(quietRows.map((row) => row.wer)).toFixed(3));
  const noisyWer = Number(average(noisyRows.map((row) => row.wer)).toFixed(3));

  const quietResult = {
    environment: "quiet",
    provider: baseRun.provider,
    model: baseRun.model,
    utteranceCount: quietRows.length,
    wer: quietWer,
    threshold: 0.12,
    pass: quietWer <= 0.12,
  };

  const noisyResult = {
    environment: "noisy",
    provider: baseRun.provider,
    model: baseRun.model,
    utteranceCount: noisyRows.length,
    wer: noisyWer,
    threshold: 0.2,
    pass: noisyWer <= 0.2,
  };

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, "quiet.json"), JSON.stringify(quietResult, null, 2), "utf8");
  await fs.writeFile(path.join(outputDir, "noisy.json"), JSON.stringify(noisyResult, null, 2), "utf8");

  console.log("Smoke test outputs written:");
  console.log(path.join(outputDir, "quiet.json"));
  console.log(path.join(outputDir, "noisy.json"));

  if (!quietResult.pass || !noisyResult.pass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
