#!/usr/bin/env node
// Stop: before Claude reports "done", run the definition of done (typecheck + lint + test)
// if source files changed. On failure, exit 2 and Claude keeps working with the output as
// feedback. `stop_hook_active` prevents an endless loop if it still cannot get to green.
import { execSync } from 'node:child_process';
import { readHookInput } from './read-stdin.mjs';

const input = await readHookInput();
if (input.stop_hook_active) process.exit(0);

const cwd = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const changed = execSync('git status --porcelain -- src scripts', { cwd }).toString().trim();
if (!changed) process.exit(0);

try {
  execSync('npm run --silent verify', { cwd, stdio: 'pipe', timeout: 280_000 });
  process.exit(0);
} catch (err) {
  const out = `${err.stdout ?? ''}${err.stderr ?? ''}`.split('\n').slice(-60).join('\n');
  process.stderr.write(
    `npm run verify failed, so the task is not done yet. Fix these before stopping:\n${out}\n`,
  );
  process.exit(2);
}
