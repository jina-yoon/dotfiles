#!/usr/bin/env bash
#
# Repackage any Cowork-shared skill whose source is newer than its .skill
# bundle, so the file waiting to be uploaded is never stale.
#
# Run as a PostToolUse hook. It deliberately ignores the tool payload on stdin
# and compares mtimes instead: edits reach these files via Edit, Write, or a
# shell command, and mtime is the one signal common to all three.
#
# A skill opts in by declaring `cowork: true` under `metadata:` in its own
# SKILL.md frontmatter — the marker travels with the skill, so there's no
# second place to keep in sync. `metadata` is the one frontmatter key whose
# nested fields Cowork's validator ignores, so the marker is safe to upload.

set -uo pipefail

SKILLS_DIR="$HOME/.dotfiles/ai/skills"
OUT="$HOME/Desktop/cowork-skills"

[ -d "$SKILLS_DIR" ] || exit 0

built=()
for src in "$SKILLS_DIR"/*/; do
  [ -f "$src/SKILL.md" ] || continue
  name="$(basename "$src")"

  # Only the frontmatter block, and only a cowork flag nested under metadata.
  awk '
    /^---[[:space:]]*$/ { if (++d == 2) exit; next }
    d == 1 && /^metadata:[[:space:]]*$/ { m = 1; next }
    d == 1 && /^[^[:space:]#]/ { m = 0 }
    d == 1 && m && /^[[:space:]]+cowork:[[:space:]]*true[[:space:]]*$/ { found = 1 }
    END { exit !found }
  ' "$src/SKILL.md" || continue

  bundle="$OUT/$name.skill"

  # Repackage when the bundle is missing or any source file is newer than it.
  if [ -f "$bundle" ] && [ -z "$(find "$src" -type f -newer "$bundle" -print -quit)" ]; then
    continue
  fi

  if "$HOME/.dotfiles/bin/skill-package" "$name" "$OUT" >/dev/null 2>&1; then
    built+=("$name")
  fi
done

[ ${#built[@]} -gt 0 ] && echo "repackaged for Cowork: ${built[*]} → $OUT"
exit 0
