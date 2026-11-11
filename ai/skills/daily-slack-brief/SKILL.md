---
name: daily-slack-brief
description: Build Jina's PostHog Slack briefing – what she might have missed from her management chain and teammates, plus newsletter content ideas from the dev channels. Use when she asks what she missed in Slack, for a catch-up or briefing, what's happened while she was out, or whether anything needs her reply. Drafts for review; only DMs her if she asks.
---

# Daily Slack brief

Build Jina's PostHog Slack briefing. Jina (Slack user `U09STHEMXH6`) is a technical content marketer on the editorial/content team – newsletters, blogs, SEO, socials. PostHog is fully remote, so important announcements live in Slack. The point is that she doesn't miss team/company happenings, and that newsletter ideas surface.

**Delivery:** present the brief in the conversation by default. Only send it as a Slack DM (`slack_send_message`, `channel_id U09STHEMXH6`) if she asks for it in Slack. It goes to her and nobody else – never post to another channel or DM anyone else.

## Timeframe

Run `date` first. Default to the last 24 hours. On a Monday, or after she's been away, widen to cover the gap (Friday morning through now) so the weekend isn't lost. Use `after:` / `before:` filters accordingly.

## Section 1 – "What I might've missed"

Editorial/marketing/company signal: announcements, FYIs, decisions, plans, deadlines, asks. Prioritize her management chain and direct teammates – search each with `from:<@ID> after:<date>`:

- Charles Cook (`U01CW2QE6KH`) – skip-skip manager, exec
- Andy Vandervell (`U02QPCBE9S7`) – skip manager, content marketing lead
- Ian Vanagas (`U0432HMTU57`) – her direct manager
- Liam Graham (`U0ANEP1GXHC`) – direct teammate
- Natalia Amorim (`U09DG4X7P0B`) – direct teammate

Include a message only if it's genuinely notable. Skip routine chatter, emoji reactions, pure scheduling logistics. Flag anything that @mentions her or clearly awaits her reply.

**PTO check.** One cheap search per person:
`from:<@ID> after:<recent date> (PTO OR holiday OR vacation OR "off" OR OOO OR away OR leave OR "back on")`
Also watch for others referencing time off in messages you already read – "before your PTO", "while I'm out", "when X is back". If anyone is out or has upcoming PTO, add a short `🌴 PTO watch` line near the top naming who and the dates as stated. Mark `[unverified]` if exact dates aren't explicit – don't guess. One or two lines total. If nobody is out, omit the line silently rather than saying everyone is in.

## Section 2 – "Newsletter content ideas"

Internal dev projects/demos, or links and tools that could work as Further Reading for a product-engineer audience:

- `#demo-posthog-anything` (`C0AP5NXF8D7`) – internal dev projects and demos
- `#devel-random` (`C02EJABQ39R`) – shared links and articles
- `#dev-ai` (`C09KTRWD3HD`) – links, articles, AI/dev discussion

Standouts only: a cool demo, a sharp article, a genuinely useful tool or argument. Skip funding rounds, launches, company PR.

## Every item

Who posted, one line on why it matters, and a clickable permalink. Prefer a permalink the Slack tools return; otherwise build it as `https://posthog.slack.com/archives/<CHANNEL_ID>/p<TS with the dot removed>` (ts `1725480000.123456` → `p1725480000123456`).

Never invent, paraphrase, or smooth over content you didn't read. If you're unsure what a message says, link it and say so. Mark anything uncertain `[unverified]`.

## Format

Tight and skimmable – short bullets, lead with the point, no preamble. Header line like `☕ Daily brief — <weekday>, <Month DD>`. If a section has nothing, say so in one line rather than padding. If the whole period is quiet, say that.
