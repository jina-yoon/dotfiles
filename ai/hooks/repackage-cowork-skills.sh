#!/usr/bin/env bash
#
# Repackage any Cowork-shared skill whose source is newer than its .skill
# bundle, so the file waiting to be uploaded is never stale.
#
# Run as a PostToolUse hook. It deliberately ignores the tool payload on stdin
# and compares mtimes instead: edits reach these files via Edit, Write, or a
# shell command, and mtime is the one signal common to all three.
#
# Opt in per skill by listing its name in ai/cowork-skills.txt — skills that
# only ever run in Claude Code don't need a bundle.

set -uo pipefail

SKILLS_DIR="$HOME/.dotfiles/ai/skills"
LIST="$HOME/.dotfiles/ai/cowork-skills.txt"
OUT="$HOME/Desktop/cowork-skills"

[ -f "$LIST" ] || exit 0

built=()
while IFS= read -r name || [ -n "$name" ]; do
  name="${name%%#*}"                        # strip comments
  name="$(echo "$name" | tr -d '[:space:]')"
  [ -n "$name" ] || continue

  src="$SKILLS_DIR/$name"
  [ -d "$src" ] || continue
  bundle="$OUT/$name.skill"

  # Repackage when the bundle is missing or any source file is newer than it.
  if [ -f "$bundle" ] && [ -z "$(find "$src" -type f -newer "$bundle" -print -quit)" ]; then
    continue
  fi

  if "$HOME/.dotfiles/bin/skill-package" "$name" "$OUT" >/dev/null 2>&1; then
    built+=("$name")
  fi
done < "$LIST"

[ ${#built[@]} -gt 0 ] && echo "repackaged for Cowork: ${built[*]} → $OUT"
exit 0
