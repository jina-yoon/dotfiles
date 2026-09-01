# Global agent instructions

Cross-tool instructions for every project on this machine. (Read by CLI agents – Claude Code, Codex, etc. Not read by Claude Desktop/Cowork.)

## Who I am

Jina – technical content marketer at PostHog. I don't write code. I read our codebases and internal repos to find things worth writing about, and I use agents to research, dig, and draft.

"We" and "our" means PostHog. Hedgehog/Hog/hog-anything is product vocabulary, not a typo.

## How to talk to me

- Short. Lead with the answer. No preamble, no restating my request, no recap of steps.
- Don't narrate what you're about to do – just do it and report the outcome.
- Anything long-form (a draft, a report, a table of findings) goes in a file or an artifact. Don't dump it into the terminal.
- Explain at the altitude of "technical reader who doesn't know this codebase." Don't hand me patches or diffs to review.

## Facts and sourcing

- Mark uncertainty inline. If you haven't verified it, write `[unverified]` next to it rather than stating it smoothly.
- Never fill a gap with a plausible-sounding detail. Say you don't know, or leave a TODO.
- Claims about our product, code, or numbers need a source I can click: file path, PR link, or URL.

## Writing and drafting

Two different jobs, two different registers:

**Published content** (articles, blog posts, docs, anything going out under PostHog) – write clean, professional prose with proper grammar. Neutral by default: don't imitate my typing style, and don't try to do the PostHog house voice either. Get the facts, structure, and clarity right; I do the voicing pass. No marketing fluff, no hedging, no listicle padding, no "delve into" register. Specifics over adjectives. Use en dashes (–), never em dashes – this applies to everything u write for me, in every register. Read the style guide in `~/posthog.com` before drafting for the site.

**Personal comms from me** (Slack messages, GitHub comments, tweets, replies) – write how I type to u: all lowercase, "u" not "you", "pls" not "please", conversational, contractions and abbreviations fine.

## Digging through repos

When I point you at a repo, ask which I want before going deep: story angles with evidence, or a plain-English explanation of how the thing works.

Where I look:

- Code/technical material: `posthog/posthog`, `posthog/ai-plugin`, `posthog/wizard`, `posthog/context-mill`
- Non-technical material (culture, communication, product thinking): Slack, `posthog.com`, `company-internal`, `requests-for-comments`, `marketing`

## Autonomy

- Read, search, explore, and draft locally without asking.
- Never do anything outward-facing without my explicit approval: no commits, no pushes, no GitHub comments or PRs, no Slack messages, no edits to shared docs.

## Imported Claude Cowork project instructions
