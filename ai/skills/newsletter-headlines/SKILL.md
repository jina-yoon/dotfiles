---
name: newsletter-headlines
description: Generate title and subtitle options for an issue of PostHog's newsletter (build mode, formerly Product for Engineers), calibrated against every past issue and PostHog's own title guidelines. Use this whenever someone is naming, retitling, or workshopping a newsletter issue — including when they paste a few headline ideas and ask "which of these is best", "any better options?", "help me title this", "what should I call this issue", or share a draft or pitch and ask for a headline, subject line, or subtitle. Also use when they're unhappy with a working title, want to A/B a subject line for the email, or want to check a title against what's already been published. Trigger on this even if they don't say the word "newsletter" — if the piece is for PostHog's newsletter or blog and the ask is about the title, use this skill.
---

# Newsletter headlines

The title is the frame for the entire piece, and it's the only part most people read. It's worth more effort than it usually gets. Your job here is to produce enough genuinely different options that the writer can *see* the space of possible framings, then to have an opinion about which ones are strongest.

The failure mode to avoid is producing fifteen titles that are all the same idea reworded. Fifteen synonyms is not a set of options. Five distinct framings, each with a couple of executions, is.

## What you're working with

The writer will usually give you some combination of: a few headline ideas they've already had, a draft, or a rough pitch for the piece. Whatever arrives:

**Read their existing ideas as evidence, not as a starting point to polish.** If someone offers three title ideas, those ideas encode what they think the piece is about — often more honestly than the draft does. Notice what all three are reaching for, and notice what none of them are reaching for. The best option you produce is frequently the angle their ideas were circling but never landed on.

**Find the sharpest specific thing in the piece.** Titles are made out of concrete material: a number (5x conversion, 30,000 applications, 11 to 150 people), a named enemy (collaboration, product management, the code review bottleneck), a counterintuitive claim, a role the reader isn't. If you can't find any of that in what you were given, that's the real problem — say so, and name the one or two facts that would make every option sharper. Don't block on it though; generate from what you have.

If you were only given a topic and no substance, still generate. Just be explicit that the options are framings rather than finished titles, and ask for the specifics that would let you do better.

## Before you generate

Read `references/patterns.md` — past titles sliced by format, with notes on why each format works and when it doesn't. Read `references/archive.md` when you need to check that a candidate isn't a near-repeat of a published issue, or when a format seems overused. Both files are short.

Two things worth internalizing from the archive: the biggest hits ("Collaboration sucks", "Product management is broken. Engineers can fix it") don't describe what the piece is about — they stake out a position. And the team's own retrospective judgment was that "Using your own product is a superpower" was too boring and generic, despite being perfectly clear. Clarity isn't the bar. A reader has to feel like they're missing something.

## What makes a title work here

**Be bold and direct.** Take a side. A title that could sit above anyone's article about the topic is a failure even if it's accurate.

**Create a gap.** The reader should feel a distance between where they are and where they'd be after reading. Hint at knowledge that's non-obvious, hard-won, or slightly forbidden.

**Aim for a specific reader.** Engineers, founders, first-time managers, people hiring. A title aimed at everyone lands on no one.

**Less is better.** Gmail truncates around 35-40 characters on mobile. You don't have to fit inside that, but the load-bearing part of the title has to be in the first ~40 characters. "LLMs are picking winners. Here's how to become one" survives truncation because the first clause is already a complete provocation.

**The subtitle is half the unit.** Never generate a title without one. The pairing does the work: if the title is a provocation, the subtitle says plainly what the reader gets ("Stop being the code review bottleneck" / "4 ways to make AI code review suck less (with prompts)"). If the title is descriptive, the subtitle carries the voice and the jokes ("Non-obvious SEO advice for startups" / "Win the web with 10 weird tricks, Google hates me").

**Sound like PostHog.** Plain words, contractions, a bit of swearing where it fits, jokes that don't apologize for themselves. Never the LinkedIn register: no "unlock", "supercharge", "leverage", "harness the power of", "in today's fast-paced world", "game-changer". No colon-subtitle construction inside the title itself ("Agent Autonomy: A Practical Framework") — that's a conference talk, not this newsletter.

## Generating the options

Work across angles, not across wordings. Generate widely in your head — pull angles from `patterns.md`, pick the ones that suit this piece rather than marching through the list — then ship only the **10 best, ranked**. The breadth is for you; the writer sees the survivors.

Angles worth reaching for most times:

- **The provocation** — a flat claim with no hedging. Always include at least two of these, even if the piece feels too gentle for it. They're the highest-ceiling format and they force you to say what the piece actually argues.
- **What nobody tells you / what people get wrong** — names a gap in the reader's model.
- **The mistake** — accusatory, loss-framed. Only if the piece really delivers mistakes.
- **The reveal** — the hidden cost of a good thing, or the hidden power of a boring thing.
- **The role transfer** — how to think like X, an engineer's guide to Y.
- **The receipts** — a number or named outcome doing the persuading.

Check the set before you rank it: if the ten cover fewer than four genuinely different angles, or if two of them differ only by a synonym, cut and replace rather than shipping near-duplicates. Ranking is your real opinion about which title you'd run, not a tour of the formats — #1 should be the one you'd actually publish, and it shouldn't default to the safest option in the set.

Reuse a format from the archive freely — these are house formats, not one-time gimmicks. But if a candidate is close enough to a published title that a subscriber would feel déjà vu, mark it with a short `⚠️` note naming the issue it echoes and let the writer decide.

## Output format

Brevity is the point. The writer is scanning for a title, not reading an essay about titling — a long response buries the good options. Lead with the ranked list, no preamble, no angle headings, no per-option rationale. Then a few lines of commentary at the end. That's the whole response.

```
1. **Title text** (34)
   Subtitle text
2. **Another title** (41)
   Subtitle text
...through 10
```

The number in parentheses is the title's character count — the whole string including spaces and punctuation, so the writer can see what Gmail will do to it. Count it rather than estimating.

Then close with **three or four sentences, maximum**, covering only what's worth saying:

- what #1 is betting on, and the one thing that would sink it
- if the writer brought their own ideas: what they were all missing in one clause
- anything genuinely worth flagging — a missing fact that would sharpen everything, an archive collision

If none of that applies, write less. Silence beats filler.

## After

Offer, in one line, to run more variations inside whichever direction they like — most writers find their angle in the list and then want depth in it, which beats another ten across the board.
