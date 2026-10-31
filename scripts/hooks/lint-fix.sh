#!/usr/bin/env bash
# postToolUse hook: runs `eslint --fix` on the file the agent just edited/created in src/.
# Never fails the agent: always exits 0.

input="$(cat)"
tool="$(jq -r '.toolName // .tool_name // empty' <<<"$input" 2>/dev/null)"

case "$tool" in
  edit | create) ;;
  *) exit 0 ;;
esac

root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
file="$(jq -r '(.toolArgs // .tool_input) | if type == "string" then (fromjson? // {}) else . end | .path // empty' <<<"$input" 2>/dev/null)"
[ -z "$file" ] && exit 0

rel="${file#"$root"/}"
case "$rel" in
  src/*.ts) ;;
  *) exit 0 ;;
esac
[ -f "$root/$rel" ] || exit 0

cd "$root" && npx --no-install eslint --fix "$rel" >&2 || true
exit 0
