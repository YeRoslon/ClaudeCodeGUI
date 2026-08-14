#!/bin/bash
# Project git guardrail: Claude Code PreToolUse hook that blocks destructive git
# commands before they run. Blocks force push / reset --hard / clean / branch -D /
# checkout-restore of "."; ordinary `git push` is allowed.
# Parses the hook JSON with node (jq is not guaranteed to be installed).

INPUT=$(cat)
export INPUT
COMMAND=$(node -e 'const j = JSON.parse(process.env.INPUT); const c = (j && j.tool_input && j.tool_input.command) || ""; process.stdout.write(c)')

DANGEROUS_PATTERNS=(
  "git reset --hard"
  "git clean -fd"
  "git clean -f"
  "git branch -D"
  "git checkout \."
  "git restore \."
  "push --force"
  "git push -f"
  "reset --hard"
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern"; then
    echo "BLOCKED: '$COMMAND' matches dangerous pattern '$pattern'. The user has prevented you from doing this." >&2
    exit 2
  fi
done

exit 0
