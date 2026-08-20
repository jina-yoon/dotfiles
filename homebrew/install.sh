#!/usr/bin/env bash
#
# Homebrew: install it if missing, then install everything in the Brewfile.

set -e

if ! command -v brew >/dev/null 2>&1; then
  echo "  Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

echo "  Installing Brewfile packages..."
brew bundle --file="$(dirname "${BASH_SOURCE[0]}")/Brewfile"
