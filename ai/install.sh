#!/usr/bin/env bash
#
# Symlink every skill in ai/skills into ~/.claude/skills so Claude Code
# picks them up. Also links ai/CLAUDE.md to ~/.claude/CLAUDE.md if present.

set -e

AI_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$HOME/.claude"

mkdir -p "$CLAUDE_DIR/skills"

shopt -s nullglob
for skill in "$AI_ROOT"/skills/*/; do
  name="$(basename "$skill")"
  dst="$CLAUDE_DIR/skills/$name"
  if [ -L "$dst" ]; then
    rm "$dst"
  elif [ -e "$dst" ]; then
    echo "  skipping $name (a real directory already exists at $dst)"
    continue
  fi
  ln -s "${skill%/}" "$dst"
  echo "  linked skill: $name"
done

if [ -f "$AI_ROOT/CLAUDE.md" ] && [ ! -e "$CLAUDE_DIR/CLAUDE.md" ]; then
  ln -s "$AI_ROOT/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md"
  echo "  linked CLAUDE.md"
fi
