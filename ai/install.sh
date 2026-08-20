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

# Register the Cowork repackaging hook. settings.json holds machine-local
# things too, so merge this one entry in rather than overwriting the file.
HOOK="\$HOME/.dotfiles/ai/hooks/repackage-cowork-skills.sh 2>/dev/null || true"
SETTINGS="$CLAUDE_DIR/settings.json"

if ! command -v jq >/dev/null 2>&1; then
  echo "  skipping Cowork hook (jq not installed)"
elif [ -e "$SETTINGS" ] && ! jq -e . "$SETTINGS" >/dev/null 2>&1; then
  echo "  skipping Cowork hook ($SETTINGS is not valid JSON)"
else
  [ -e "$SETTINGS" ] || echo '{}' > "$SETTINGS"
  if jq -e --arg c "$HOOK" \
       '[.hooks.PostToolUse[]?.hooks[]?.command] | any(. == $c)' \
       "$SETTINGS" >/dev/null; then
    echo "  Cowork hook already registered"
  else
    tmp="$(mktemp)"
    jq --arg c "$HOOK" '
      .hooks.PostToolUse = ((.hooks.PostToolUse // []) + [{
        matcher: "Edit|Write|Bash",
        hooks: [{
          type: "command",
          command: $c,
          timeout: 15,
          statusMessage: "Repackaging Cowork skills"
        }]
      }])
    ' "$SETTINGS" > "$tmp" && mv "$tmp" "$SETTINGS"
    echo "  registered Cowork repackaging hook"
  fi
fi
