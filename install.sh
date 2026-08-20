#!/usr/bin/env bash
#
# One-liner installer for a fresh Mac:
#   curl -fsSL https://raw.githubusercontent.com/jina-yoon/dotfiles/main/install.sh | bash

set -e

DOTFILES_ROOT="$HOME/.dotfiles"
REPO="https://github.com/jina-yoon/dotfiles.git"

if [ ! -d "$DOTFILES_ROOT" ]; then
  echo "› cloning dotfiles to $DOTFILES_ROOT"
  git clone "$REPO" "$DOTFILES_ROOT"
else
  echo "› $DOTFILES_ROOT already exists, pulling"
  git -C "$DOTFILES_ROOT" pull --ff-only
fi

"$DOTFILES_ROOT/script/bootstrap"
"$DOTFILES_ROOT/script/install"

echo
echo "Done. Open a new shell (or run: exec \$SHELL -l)"
