#!/usr/bin/env node
// PreToolUse(Write|Edit|MultiEdit): refuse to write anything that looks like a credential.
// Exit code 2 blocks the tool call, and stderr is shown to Claude so it can fix the edit.
import { readHookInput } from './read-stdin.mjs';

const PATTERNS = [
  ['Anthropic API key', /sk-ant-[A-Za-z0-9_-]{20,}/],
  ['OpenAI API key', /sk-(?:proj-)?[A-Za-z0-9]{32,}/],
  ['GitHub token', /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b|github_pat_[A-Za-z0-9_]{60,}/],
  ['AWS access key id', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['Slack token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ['Private key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
];

const input = await readHookInput();
const toolInput = input.tool_input ?? {};
const filePath = String(toolInput.file_path ?? '');
const chunks = [
  toolInput.content,
  toolInput.new_string,
  ...(Array.isArray(toolInput.edits) ? toolInput.edits.map((e) => e?.new_string) : []),
].filter((c) => typeof c === 'string');

// This file has to contain the patterns themselves, so it is exempt.
if (filePath.endsWith('.claude/hooks/block-secrets.mjs')) process.exit(0);

for (const text of chunks) {
  for (const [label, re] of PATTERNS) {
    if (re.test(text)) {
      process.stderr.write(
        `Blocked: the content for ${filePath || 'this edit'} looks like it contains a credential (${label}). ` +
          'Secrets must never be committed or shipped in the client bundle (docs/SECURITY.md, ADR 0003). ' +
          'Use a placeholder and load real values from a server-side environment instead.\n',
      );
      process.exit(2);
    }
  }
}
process.exit(0);
