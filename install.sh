#!/usr/bin/env bash
#
# Installer for a fresh Mac:
#
#   curl -fsSL https://raw.githubusercontent.com/jina-yoon/dotfiles/main/install.sh | bash

set -e

DOTFILES_ROOT="$HOME/.dotfiles"
REPO="jina-yoon/dotfiles"

if [ ! -d "$DOTFILES_ROOT" ]; then
  echo "› cloning dotfiles to $DOTFILES_ROOT"
  if command -v gh >/dev/null 2>&1; then
    gh repo clone "$REPO" "$DOTFILES_ROOT"
  else
    git clone "https://github.com/$REPO.git" "$DOTFILES_ROOT"
  fi
else
  echo "› $DOTFILES_ROOT already exists, pulling"
  git -C "$DOTFILES_ROOT" pull --ff-only
fi

"$DOTFILES_ROOT/script/bootstrap"
"$DOTFILES_ROOT/script/install"

echo
echo "Done. Open a new shell (or run: exec \$SHELL -l)"
