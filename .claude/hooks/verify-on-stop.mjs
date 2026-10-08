#!/usr/bin/env node
// Stop: before Claude reports "done", run the definition of done (typecheck + lint + test)
// if code or config changed since the last green run. On failure, exit 2 and Claude keeps
// working with the output as feedback. `stop_hook_active` prevents an endless loop.
import { execFileSync, execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readHookInput } from './read-stdin.mjs';

const WATCHED = [
  'src',
  'scripts',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'eslint.config.js',
  'app.json',
  'app.config.js',
  'jest.setup.js',
  'jest.global-setup.js',
];

const input = await readHookInput();
if (input.stop_hook_active) process.exit(0);

const cwd = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const stateFile = join(cwd, '.claude', '.last-verified');
const git = (...args) => execFileSync('git', args, { cwd, maxBuffer: 64 * 1024 * 1024 }).toString();

// Fingerprint of the working tree for the watched paths: tracked changes plus the content
// of untracked files. A read-only turn leaves it unchanged, so it costs nothing.
const untracked = git('ls-files', '--others', '--exclude-standard', '--', ...WATCHED)
  .split('\n')
  .filter(Boolean);
const fingerprint = createHash('sha256')
  .update(git('rev-parse', 'HEAD'))
  .update(git('diff', 'HEAD', '--', ...WATCHED))
  .update(untracked.map((f) => `${f}:${git('hash-object', '--', f)}`).join(''))
  .digest('hex');

if (existsSync(stateFile) && readFileSync(stateFile, 'utf8') === fingerprint) process.exit(0);
if (!git('status', '--porcelain', '--', ...WATCHED).trim()) {
  writeFileSync(stateFile, fingerprint);
  process.exit(0);
}

try {
  execSync('npm run --silent verify', { cwd, stdio: 'pipe', timeout: 280_000 });
  writeFileSync(stateFile, fingerprint);
  process.exit(0);
} catch (err) {
  const out = `${err.stdout ?? ''}${err.stderr ?? ''}`.split('\n').slice(-60).join('\n');
  process.stderr.write(
    `npm run verify failed, so the task is not done yet. Fix these before stopping:\n${out}\n`,
  );
  process.exit(2);
}
