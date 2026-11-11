# dotfiles

My personal dotfiles. Topic-based, symlinked into `$HOME` by a small bootstrap
script — the [holman](https://github.com/holman/dotfiles) /
[haacked](https://github.com/haacked/dotfiles) approach.

## Install

On a fresh Mac:

```sh
curl -fsSL https://raw.githubusercontent.com/jina-yoon/dotfiles/main/install.sh | bash
```

Or step by step:

```sh
git clone https://github.com/jina-yoon/dotfiles.git ~/.dotfiles
cd ~/.dotfiles
script/bootstrap
script/install
```

## How it works

Everything is organized into **topic directories** (`zsh/`, `git/`, `node/`,
`ai/`, …). Four filename conventions do all the work:

| Pattern | What happens |
| --- | --- |
| `topic/*.symlink` | Symlinked into `$HOME` as a dotfile. `zsh/zshrc.symlink` → `~/.zshrc` |
| `topic/path.zsh` | Sourced **first**, before anything else. Put `$PATH` changes here. |
| `topic/*.zsh` | Sourced by `~/.zshrc` on every new shell. |
| `topic/completion.zsh` | Sourced **last**, after `compinit`. |
| `topic/install.sh` | Run by `script/install`. |

Anything in `bin/` is on your `$PATH`.

## Commands

| Command | What it does |
| --- | --- |
| `script/bootstrap` | Creates the `~/.*` symlinks. Safe to re-run. |
| `script/install` | Runs every `topic/install.sh`. |
| `dot` | Pull, apply macOS defaults, bootstrap, install. Run it after a `git pull`. |

## Adding things

- **A new shell alias** → add it to `zsh/aliases.zsh`, or create `topic/aliases.zsh`.
- **A new dotfile** → put it at `topic/<name>.symlink` and run `script/bootstrap`.
  It lands at `~/.<name>`.
- **A new topic** → `mkdir tool/`, drop `*.zsh` / `*.symlink` / `install.sh` in it.
  Nothing else to wire up.
- **A Claude Code skill** → put it in `ai/skills/<name>/` and run `script/install`.
  It gets symlinked into `~/.claude/skills/`. To also use it in Cowork, see below.
- **A global AI instruction** → add it to `ai/AGENTS.md`. See below.
- **A Homebrew package** → add it to `homebrew/Brewfile`.

## Global AI instructions

`ai/AGENTS.md` holds the instructions that apply to every project on this
machine. `script/install` puts it where each tool looks:

| Path | What it is |
| --- | --- |
| `~/AGENTS.md` | Symlink to `ai/AGENTS.md`. The file itself. |
| `~/.claude/CLAUDE.md` | Symlink to `ai/CLAUDE.md`, which is one line: `@~/AGENTS.md` |

`AGENTS.md` lives in `$HOME` rather than `~/.claude/` because that's the path
Codex, Cursor, and friends look for — keeping it there means one file for all of
them. Claude Code only auto-loads `~/.claude/CLAUDE.md`, so that file exists
purely to `@`-import the real one. (`@` is Claude Code's import syntax; it
resolves relative to the importing file and nests up to 5 levels deep.)

Edits are live in both directions — the symlinks point at the repo, so there's
nothing to re-run after changing `ai/AGENTS.md`.

## Skills in both Claude Code and Cowork

`ai/skills/<name>/` is the source of truth. The two clients pick it up differently:

| Client | How | Picks up edits |
| --- | --- | --- |
| Claude Code | `script/install` symlinks it into `~/.claude/skills/` | Live — edit the file, done |
| Cowork | Upload a `.skill` bundle in the desktop app | Only on re-upload |

Cowork loads skills from its own server-synced plugin directory and never reads
`~/.claude/skills`, so there's no way to symlink it. The upload itself is gated
behind a button press in the desktop app and can't be scripted — but the
packaging is automatic.

A skill opts in by declaring this in its own `SKILL.md` frontmatter:

```yaml
metadata:
  cowork: true
```

A PostToolUse hook (`ai/hooks/repackage-cowork-skills.sh`) then rebuilds
`~/Desktop/cowork-skills/<name>.skill` whenever that skill's source changes.
Drag the file into Cowork's skill settings and delete the previous version, so
the two clients don't drift.

The marker lives in the skill rather than a separate list so there's only one
place to remember. `metadata` is the one frontmatter key whose nested fields
Cowork's validator ignores, so the flag is safe to upload.

The hook compares mtimes rather than reading the tool payload, so it catches
edits made by Edit, Write, or a shell command alike. To build a bundle by hand:

```sh
skill-package my-sprint-update [output-dir]
```

`script/install` registers the hook in `~/.claude/settings.json`. That file
isn't in this repo (it holds machine-local settings too), so the entry is
merged in rather than overwritten — re-running is safe, and existing hooks are
left alone.

## Seeing every skill I've written

Skills I author end up spread across dotfiles, `~/.claude/skills`, Cowork,
`~/Documents/Claude/Scheduled`, and a handful of repos. `skill-status` reads all
of them and reports where two copies have diverged:

```sh
skill-status                 # full report
skill-status --drift-only    # just the problems
skill-status --diff <name>   # full diff of one skill against its Cowork copy
skill-status --json          # machine-readable
skill-status --all           # include repo skills written by other people
skill-status --no-repos      # skip the repo scan
```

Exit code is `0` clean, `1` drift found, `2` tool error — so it works as a check.

It's read-only; it never pushes to a surface. Drift it catches: dotfiles and
Cowork disagreeing, a Cowork skill with no dotfiles backup, an exported skill
sitting uncommitted, a stale or missing `.skill` bundle, a dangling symlink in
`~/.claude/skills`, and a frontmatter `name:` that doesn't match its folder
(which Cowork rejects on upload).

Edits flow both ways — Cowork exports down into `ai/skills/`, and edits made
here are packaged and uploaded up — so when the two disagree the tool compares
Cowork's `updatedAt` against the local mtime and names the stale side rather
than assuming one. If the two timestamps are within two minutes, or Cowork
reports none, it says so and leaves the call to me.

Which repos get scanned is an explicit list in `ai/skill-sources.json`. Within
them, authorship comes from `git log` rather than path — most skills in these
checkouts are teammates', so only mine are shown by default (`--all` for the
rest). Emails that count as mine are seeded from git config; add more under an
`authors` key in the config.

Cowork has no equivalent signal. Its `creatorType: "user"` only means *some
account* uploaded the skill, not that I wrote it — anything imported from
elsewhere carries the same tag. List those by name under `not_mine` in the
config and they stop counting as mine; they're still shown, marked as excluded,
so the filtering is never silent.

For *installed* plugins rather than authored skills, the built-ins already
cover it: `claude plugin list --json`, `claude plugin details <name>` (skills
plus token cost), and `claude plugin validate <dir> --strict`.

## Chrome extensions

`chrome/` holds unpacked Chrome extensions I've written. Chrome can't install
these from a script, so load each one by hand: `chrome://extensions` → turn on
**Developer mode** → **Load unpacked** → pick the folder.

| Extension | What it does |
| --- | --- |
| [`chrome/transcriptor`](chrome/transcriptor) | Pulls a YouTube video's existing transcript and opens it as clean Markdown in a new tab. |

## Local overrides

Machine-specific things that shouldn't be committed:

- `~/.gitconfig.local` — git name/email, generated by `script/bootstrap`.
- `~/.localrc` — sourced at the end of `~/.zshrc` if it exists.
