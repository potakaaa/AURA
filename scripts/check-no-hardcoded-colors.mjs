#!/usr/bin/env node
/**
 * Fails if apps/mobile contains hardcoded color literals outside lib/raw-colors.ts.
 * Prefer Tailwind tokens (hsl(var(--…))) and THEME from @/lib/theme.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const MOBILE_ROOT = path.join(REPO_ROOT, 'apps', 'mobile');

const EXT = new Set(['.ts', '.tsx', '.js', '.jsx']);
const EXCLUDED_BASENAMES = new Set(['raw-colors.ts']);
const IGNORED_DIRS = new Set([
  'node_modules',
  '.expo',
  'dist',
  'build',
  'android',
  'ios',
  'assets',
]);

const HEX_RE = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const RGB_START_RE = /rgba?\(/g;

function findBadHslPositions(line) {
  const bad = [];
  let pos = 0;
  while (true) {
    const found = line.indexOf('hsl(', pos);
    if (found === -1) break;
    const after = line.slice(found + 4).trimStart();
    if (after.startsWith('var(--') || after.startsWith('${')) {
      pos = found + 4;
      continue;
    }
    bad.push(found);
    pos = found + 4;
  }
  return bad;
}

function stripLineComments(line) {
  const idx = line.indexOf('//');
  if (idx === -1) return line;
  const before = line.slice(0, idx);
  if (/['"`]/.test(before)) {
    return line;
  }
  return before;
}

function scanLine(code, lineNo, fileRel, issues) {
  HEX_RE.lastIndex = 0;
  let m;
  while ((m = HEX_RE.exec(code))) {
    issues.push(`${fileRel}:${lineNo}:${m.index + 1}: hex literal ${m[0]}`);
  }

  RGB_START_RE.lastIndex = 0;
  while ((m = RGB_START_RE.exec(code))) {
    const after = code.slice(m.index + m[0].length).trimStart();
    if (after.startsWith('var(--') || after.startsWith('${')) continue;
    issues.push(`${fileRel}:${lineNo}:${m.index + 1}: rgb/rgba literal`);
  }

  for (const col of findBadHslPositions(code)) {
    issues.push(`${fileRel}:${lineNo}:${col + 1}: hsl( must use hsl(var(--…)) or hsl(\`\${…}\`)`);
  }
}

function walk(dir, issues) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const name = ent.name;
    const full = path.join(dir, name);
    const rel = path.relative(REPO_ROOT, full);
    if (ent.isDirectory()) {
      if (IGNORED_DIRS.has(name)) continue;
      walk(full, issues);
      continue;
    }
    if (!ent.isFile()) continue;
    const ext = path.extname(name);
    if (!EXT.has(ext)) continue;
    if (EXCLUDED_BASENAMES.has(name)) continue;

    const content = fs.readFileSync(full, 'utf8');
    const withoutBlock = content.replace(/\/\*[\s\S]*?\*\//g, '');
    const lines = withoutBlock.split('\n');
    lines.forEach((line, i) => {
      const code = stripLineComments(line);
      if (code.trim() === '') return;
      scanLine(code, i + 1, rel, issues);
    });
  }
}

function main() {
  if (!fs.existsSync(MOBILE_ROOT)) {
    console.error(`check-no-hardcoded-colors: missing ${MOBILE_ROOT}`);
    process.exit(1);
  }
  const issues = [];
  walk(MOBILE_ROOT, issues);
  if (issues.length > 0) {
    console.error('Hardcoded color literals found in apps/mobile (use Tailwind/CSS vars or lib/raw-colors.ts):\n');
    for (const msg of issues) console.error(`  ${msg}`);
    process.exit(1);
  }
  console.log('check-no-hardcoded-colors: ok');
}

main();
