---
name: dev-trends
description: >-
  Read developer X/Twitter through Jina's own logged-in Chrome session and report
  what's actually moving in dev right now — the arguments people are having, the
  tools they're switching to, the things they've stopped talking about. Uses the
  Claude in Chrome browser tools against a curated List and a set of search
  queries, then cross-checks against Hacker News and GitHub Trending. Use whenever
  Jina asks what's trending, what she's missed, what dev X is talking about, what
  the discourse is on some topic, or wants a pulse-check on a specific tool or
  debate — including "what's new in AI tooling this week" or "am I behind on X?".
  This is trend awareness, not link curation: if she's assembling Further Reading
  links for the newsletter, use further-reading-finder instead.
---

# Dev Trends

Jina writes PostHog's *Product for Engineers* newsletter and needs to know what
developers are actually talking about — not what got announced. This skill reads
developer X through her own browser session, because X killed off free API access
and the accounts she already follows are better signal than any firehose.

The output is a briefing, not a link dump. She should be able to read it in three
minutes and walk into a conversation about any of it.

## What "trend" means here

You are looking for **movement**, not news. Concretely:

- **An argument with two sides.** Multiple credible people disagreeing about a
  practice, tool, or tradeoff. These are the most valuable finds — they're where
  the newsletter's opinions come from.
- **A migration.** People visibly switching to or away from something, with
  reasons attached. "We moved off X because Y" repeated by three unrelated people
  is a trend; one person's blog post is not.
- **A technique spreading.** A pattern, prompt, workflow, or architecture that
  several people independently picked up in the window.
- **A reversal.** Something the timeline loved three months ago that it's now
  cooling on, or vice versa. Easy to miss and very worth reporting.
- **A tool with real traction.** Not launch-day noise — evidence people are using
  it in anger a week later.

## What to ignore

- Funding, valuations, acquisitions, IPOs.
- Launch announcements and "we're excited to share" threads, unless the *reaction*
  is the story.
- Benchmark-score jockeying between model providers with no practical consequence.
- Drama, dunks, and quote-tweet pile-ons with no technical substance.
- Engagement-farming threads ("10 AI tools that will replace your job 🧵").
- Anything where the only evidence is one viral post with no corroboration.

The bar: would a senior product engineer at a 20-person startup change something
about how they work, or want to argue about it? If not, cut it.

## Before the first run

This skill needs two things set up once. If either is missing, say so and offer to
walk her through it rather than silently degrading:

1. **The Claude in Chrome extension connected**, with `x.com` allowed in the
   extension's site permissions. If `tabs_context_mcp` errors with "Browser
   extension is not connected," stop and tell her — there is no fallback that
   gets real X data.
2. **A curated X List** whose ID is recorded in `references/x-recipes.md`. The
   List is what makes this skill good; searches alone are noisy. If no List ID is
   filled in, run the search queries only and tell her at the end that a List
   would roughly double the signal, offering to help build one.

## The workflow

Read `references/x-recipes.md` for the exact URLs, queries, and the account
starter list. The shape of a run:

### 1. Set the window

Default to the **last 7 days**. If Jina names a window or a topic, use that. State
the window at the top of the output.

### 2. Open one tab and keep it

Call `tabs_context_mcp` first, then `tabs_create_mcp` once. Reuse that single tab
for every navigation — do not open a tab per query. Close it when you're done.

### 3. Read the List — but only for "today"

Navigate to the List URL and run the harvest loop in `references/x-recipes.md`.
**Do not use `get_page_text` on a timeline** — it returns a single post. The
harvester (a small injected script paired with real scroll events) is the only
extraction method that works here; the recipes file explains why.

Budget about 10 scroll rounds. On an active List that reaches roughly six hours
back, not seven days — X timelines are far too dense to scroll a week. Treat the
List as "what is happening right now" and let the searches cover the window.

Note which handles drive each topic. Two unrelated people making the same point is
the corroboration signal you're filtering for.

### 4. Run the search sweeps — this is where the window gets covered

Work through the queries in `references/x-recipes.md`, adjusting the `since:` date.
Each is a direct URL navigation — never type into the search box. Re-inject the
harvester after every navigation, then 3–4 scroll rounds per query.

The `f=top` tab with a `min_faves` floor is the workhorse: it surfaces the week's
loudest posts in one page, which is exactly what the List can't give you.

Skip queries irrelevant to a topic-specific request. For "what's the discourse on
X?", build three targeted queries from the operator reference instead of running
the standard sweep.

### 4a. Read engagement ratios, not engagement

The single most useful filter, and it costs nothing — the harvester already
captures the counts:

- **Replies ≳ ¼ of likes → an argument.** People type when they disagree. A post
  with 3,978 likes and 974 replies is a fight worth reporting; one with 3,978
  likes and 40 replies is applause.
- **On Hacker News, comments approaching or exceeding points → the same signal.**
  Five stories in one week with ratios like that is a theme, not a coincidence.
- **High views, low replies → reach without engagement.** Usually wire-service
  amplification of something. Note the amplification, find the practitioners.

Lead with the argument-shaped items. That's the whole point of the brief.

### 5. Cross-check off-platform

X tells you what people are *saying*; these tell you whether it's real. Use
`WebFetch` — no browser needed:

- **Hacker News** via the Algolia API for the same window (recipe in references).
  A topic hot on both X and HN is confirmed; hot on X only is often a bubble.
- **GitHub Trending** for the weekly view. If a tool is being talked about, check
  whether the stars back it up.

Also use these to find the *underlying artifact* — the blog post, repo, or paper a
thread is reacting to. Link the artifact, not the thread, wherever one exists.

### 6. Be a good citizen

Read-only, always. Never like, repost, reply, follow, bookmark, or click anything
that writes to her account. Cap a run at roughly 15 page loads; if X starts
returning "Something went wrong. Try reloading," you're going too fast — wait 30
seconds, reload, and reduce the remaining scroll depth.

## Output format

Lead with a two-sentence "if you read nothing else" summary. Then themes, ranked
by how much movement there is behind them — not by volume.

```
## <Theme, stated as the actual claim or shift>
**Signal:** where you saw it – handles, HN, GitHub, and roughly how much
**What's happening:** 2–4 sentences. Specific nouns. Who's saying what.
**The disagreement:** if there is one, both sides in a sentence each. Skip if genuinely one-sided.
**Worth reading:** [artifact](url) – one line on why
```

Then two short closing sections:

- **Quiet signals** — three or four one-liners on things that are small now but
  moving. Low bar for inclusion; label them as speculative.
- **Cooling off** — anything the timeline has visibly lost interest in since the
  last run, if you can tell.

Finish with a one-line note on which sources you actually reached, and flag
anything that failed.

Write in PostHog's voice: short sentences, specific nouns, no throat-clearing, no
"the developer community is buzzing about." Use en-dashes with spaces ( – ), not
em-dashes. Name people by handle when attributing an opinion — Jina needs to know
whose take it is.

## When things go wrong

- **Extension not connected** → stop, say so, don't substitute WebSearch results
  and pretend they're X. Offer the HN + GitHub cross-check pass alone as a
  partial, clearly labelled.
- **Login wall or logged-out view** → she's signed out in that Chrome profile.
  Tell her; don't try to log in.
- **A query returns nothing** → likely too high a `min_faves` threshold for a niche
  topic. Halve it once and retry, then move on.
- **Rate limiting** → wait and reduce depth, as above. Report a shallower run
  honestly rather than a thin one silently.
- **A `WebFetch` returns `PROVENANCE_REQUIRED`** → the fetch needs Jina to approve
  a permission prompt, and she may be away. Don't retry in a loop and don't
  substitute a guess. Fall back to what the HN API already gave you (titles,
  points, comment counts are reliable on their own), and say in the closing note
  which articles you characterised without reading in full.
- **A `computer` or `javascript_tool` call times out at 45s** → the page is mid-
  navigation or a script is still running. Wait, then re-issue the single call on
  its own rather than re-running the whole batch.
