---
name: cowork-skills-sync
description: Mirror Jina's custom Cowork skills into her dotfiles repo at ~/.dotfiles/ai/skills as a one-way export, writing only files that actually changed. Use when she asks to sync, export, mirror, or back up her Cowork skills to dotfiles, or to check whether the repo copy has drifted from her live skills.
---

# Cowork skills sync

Mirror Jina's custom Cowork skills into her dotfiles repo on `jinas-macbook-pro-local`. **One-way:** her Cowork account is the live copy, the repo is a versioned mirror. Never write back toward Cowork.

**Target:** `/Users/jinayoon/.dotfiles/ai/skills/` – a connected folder, mounted at `$HOME/mnt/skills` for `device_bash`. Skill folders sit directly under it, one per skill.

If the device is unreachable (desktop app closed) or the folder isn't connected so `$HOME/mnt/skills` doesn't exist, don't retry or work around it – say which of the two it was and stop.

## 1. Build the export in the cloud session

Locate the synced skills manifest by globbing `/root/.claude/skills/synced/*/manifest.json`. It sits in a bucket subdirectory whose name is account- or install-specific – **never hardcode the path**. If the glob matches more than one, use the most recently modified and note the ambiguity.

Select skills where `source == "plugin"`, excluding `pr-security-review` and `triage-vuln` by name (stock templates, not hers). Everything else tagged `plugin` is in scope, including skills she's authored since – **do not hardcode the skill list**.

As of 2026-11-11 the manifest contains no skills tagged `custom` at all; the only sources present are `anthropic`, `anthropic-example` and `plugin`. If a run finds **zero** skills in scope, treat that as a bug and say so loudly – never report it as a quiet "nothing changed".

Each selected skill's full folder is at `SYNCED_DIR/<name>/` – `SKILL.md` plus any `references/`, `assets/`, `scripts/` subdirs. Compute a sha256 for every file.

If `/Users/jinayoon/.dotfiles/ai/skills/export-cowork-skills.py` exists on the device, stage and use it rather than reimplementing; it takes an output dir argument and writes a `manifest.json` with per-file sha256.

## 2. Work out what changed

Stage `/Users/jinayoon/.dotfiles/ai/skills/.cowork-export.json` – it holds the previous run's per-file sha256. **Also hash the files currently on disk** via `device_bash`, because she may have edited the repo copy by hand. Write a file only if it's new or its on-disk hash differs from the freshly exported version. Skip unchanged files silently.

## 3. Write

`mkdir -p` any needed subdirectories first. Then **one** `SendUserFile` call with all changed files as an array, then **one** `device_commit_files` call mapping each returned `fileUuid` to its `/Users/jinayoon/.dotfiles/ai/skills/...` path. Write the refreshed manifest to `.cowork-export.json`. Verify by hashing the written files on the device against the manifest.

**Never delete anything, and never touch a file that isn't part of the export.** Hers, leave alone: `my-sprint-update/evals/`, `.gitkeep`, `.DS_Store`, and the hand-written skills in this folder that aren't in Cowork (`daily-slack-brief`, `github-board-sync`, `editorial-sprint-issue`, `work-log-update`, `cowork-skills-sync`). Those are expected, not strays.

If a skill folder from a previous export is on disk but absent from the new manifest – a skill she deleted in Cowork – do **not** remove it. List it as a possible stray.

## 4. Commit if possible

Check `git -C $HOME/mnt/skills rev-parse --show-toplevel`. As of 2026-11-11 the repo root is `/Users/jinayoon/.dotfiles` and only `ai/` and `ai/skills` are connected, so `.git` is **not** reachable and committing is impossible. In that case write the files and tell her they're sitting uncommitted in the working tree, and that she needs:

```
cd ~/.dotfiles && git add ai && git commit
```

Only connecting `/Users/jinayoon/.dotfiles` itself would let this commit directly.

If the repo root **is** reachable: `git add` the skills paths and commit locally with a message naming the changed skills and their Cowork `updatedAt` dates. **Never push**, and never touch any branch other than the current one.

## 5. Report

Which skills changed and why, which were skipped as unchanged, any strays, whether a commit happened. If nothing changed at all, one line.
