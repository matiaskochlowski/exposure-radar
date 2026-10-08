#!/usr/bin/env node
// PostToolUse(Write|Edit|MultiEdit): run Prettier on the file that was just written, so the
// agent never spends a turn on formatting and diffs stay clean. Failures are non-blocking.
import { execFileSync } from 'node:child_process';
import { readHookInput } from './read-stdin.mjs';

const input = await readHookInput();
const filePath = input.tool_input?.file_path;
if (!filePath || !/\.(?:[cm]?[jt]sx?|json|md|css)$/.test(filePath)) process.exit(0);
if (filePath.includes('/node_modules/') || filePath.endsWith('kev-snapshot.json')) process.exit(0);

try {
  execFileSync('npx', ['prettier', '--write', '--log-level', 'warn', filePath], {
    cwd: process.env.CLAUDE_PROJECT_DIR ?? process.cwd(),
    stdio: ['ignore', 'ignore', 'pipe'],
  });
} catch (err) {
  process.stderr.write(`prettier skipped ${filePath}: ${err.stderr?.toString() ?? err.message}\n`);
}
process.exit(0);
