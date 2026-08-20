#!/usr/bin/env bash
#
# macOS defaults. Run by `dot`. Add your own with `defaults write ...`.
# Some changes need a logout/restart to take effect.

set -e

# Show hidden files and all file extensions in Finder.
defaults write com.apple.finder AppleShowAllFiles -bool true
defaults write NSGlobalDomain AppleShowAllExtensions -bool true

# Don't write .DS_Store files to network or USB volumes.
defaults write com.apple.desktopservices DSDontWriteNetworkStores -bool true
defaults write com.apple.desktopservices DSDontWriteUSBStores -bool true

# Faster key repeat.
defaults write NSGlobalDomain KeyRepeat -int 2
defaults write NSGlobalDomain InitialKeyRepeat -int 15

killall Finder >/dev/null 2>&1 || true
