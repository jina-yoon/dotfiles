# YouTube Transcript → Markdown

A tiny Chrome extension that pulls the **existing** transcript off a YouTube
video page and opens it in a new tab as clean, readable Markdown. It does not
transcribe anything — it just reads what YouTube already rendered.

## What it does

1. You're on a `youtube.com/watch?v=…` page.
2. Click the extension's toolbar button.
3. It reads the caption track straight from the YouTube player (the same feed
   the player uses for on-screen captions), so it doesn't depend on the
   transcript panel's markup. If that path is unavailable it falls back to
   opening and scraping the transcript panel.
4. The new tab shows the transcript reflowed into paragraphs with periodic
   timestamp markers (clickable, jump back to the video), plus **Copy Markdown**
   and **Download .md** buttons.

## How it pulls the transcript

YouTube's transcript-panel DOM changes often, and the raw `timedtext` caption
API is gated behind a per-session Proof-of-Origin token (`pot`). So instead of
scraping the panel, `background.js` (injected into the page's `MAIN` world):

1. Reads the available caption tracks from `ytInitialPlayerResponse`.
2. Briefly drives the player's caption module to trigger its own authenticated
   `timedtext` request, and captures that signed URL (which carries a valid
   `pot`). The signature isn't bound to the language, so the captured URL is
   retargeted to the video's spoken language and fetched as JSON.
3. Requests that only match the current video id are used, so a pre-roll ad's
   captions are never mistaken for the video's.

The transcript-panel scrape remains as a fallback for older page layouts.

## Install (load unpacked)

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top-right).
3. Click **Load unpacked** and select this folder
   (`~/.dotfiles/chrome/transcriptor`).
4. Pin the extension so the toolbar button is visible.

Open a YouTube video and click the button. No page reload needed.

## Notes

- Works on videos that have captions available (most do), auto-generated or
  manual. If a video has none, the new tab will say so.
- Grabs the video's spoken-language track (from its auto-generated captions when
  present, otherwise the first available track).
- The formatting knobs live at the top of `viewer.js`:
  - `MARKER_EVERY` — seconds between timestamp markers (default 120)
  - `PARA_SOFT` / `PARA_HARD` — paragraph length targets
- No icons are bundled, so Chrome shows a default puzzle-piece icon. Drop
  `icon16/48/128.png` files in and add an `"icons"` block to `manifest.json` if
  you want a custom one.

## Files

- `manifest.json` — MV3 config
- `background.js` — service worker: scrapes the page on click, opens the viewer
- `viewer.html` / `viewer.js` — the new tab: reflow, render, copy, download
