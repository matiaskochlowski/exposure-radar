---
name: pr-prep
description: Prepare a branch for human review. Runs the checks, self-reviews the diff, and drafts a PR description. Stops before pushing.
---

# PR prep

1. `git status` and `git diff main...HEAD --stat`. Make sure the change is one coherent thing.
   If it is not, propose how to split it.
2. Run `npm run verify`. Do not continue until it is green.
3. Use the `code-reviewer` subagent on the diff. Address the blocking findings, and list the
   rest as follow-ups.
4. If the diff touches parsers, links, storage or network code, also use the
   `security-reviewer` subagent.
5. Draft the PR description:
   - **What** changed, in user terms
   - **Why**, with a link to the ADR if a decision changed
   - **How it was verified**: commands run, screens checked, platforms
   - **Risk and rollback**
   - **AI involvement**: which parts an agent wrote, and what a human checked
6. **Stop.** Show the description and ask before `git push` / `gh pr create`. These are
   `ask` permissions on purpose.
