#!/usr/bin/env bash
#
# Symlink every skill in ai/skills into ~/.claude/skills so Claude Code
# picks them up, plus the two instruction files:
#
#   ai/AGENTS.md -> ~/AGENTS.md          the actual instructions, read by
#                                        Claude Code, Codex, Cursor, et al.
#   ai/CLAUDE.md -> ~/.claude/CLAUDE.md  a one-line "@~/AGENTS.md" import so
#                                        Claude Code pulls in the same file

set -e

AI_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$HOME/.claude"

# Replace our own symlinks, but never clobber a real file someone put there.
link () {
  local src=$1 dst=$2 label=$3
  if [ -L "$dst" ]; then
    rm "$dst"
  elif [ -e "$dst" ]; then
    echo "  skipping $label (a real file already exists at $dst)"
    return
  fi
  mkdir -p "$(dirname "$dst")"
  ln -s "$src" "$dst"
  echo "  linked $label"
}

mkdir -p "$CLAUDE_DIR/skills"

shopt -s nullglob
for skill in "$AI_ROOT"/skills/*/; do
  name="$(basename "$skill")"
  link "${skill%/}" "$CLAUDE_DIR/skills/$name" "skill: $name"
done

if [ -f "$AI_ROOT/AGENTS.md" ]; then
  link "$AI_ROOT/AGENTS.md" "$HOME/AGENTS.md" "AGENTS.md"
fi

if [ -f "$AI_ROOT/CLAUDE.md" ]; then
  link "$AI_ROOT/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md" "CLAUDE.md"
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
