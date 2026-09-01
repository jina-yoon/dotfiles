---
name: further-reading-finder
description: >-
  Scan Hacker News, Reddit, the PostHog blog, developer X/Twitter, and Slack
  (#dev-ai, #devel-random, #industry-news) to find candidate links for the
  "Further Reading" section of PostHog's Product for Engineers newsletter.
  Returns an annotated shortlist of ~10-15 links that teach a technique, surface
  a genuinely useful tool/project, or make a sharp argument for a product-engineer
  audience — and hard-rejects funding rounds, launches, and company PR. Use this
  whenever Jina is gathering further-reading links, doing newsletter link curation,
  looking for "good articles/projects/tweets" to include, or asks what's worth
  linking since the last issue — even if she doesn't say "further reading" by name.
---

# Further Reading Finder

Jina hand-curates the "Further Reading" links for PostHog's *Product for Engineers*
newsletter. Every issue she trawls the same sources looking for a handful of links
that are actually worth a busy engineer's click. This skill does the trawling and
the first-pass filtering so she can spend her judgment on the final call, not the
hunting.

The output is a shortlist she reviews — not final copy. Your job is to cast a wide
net, ruthlessly cut the junk, and hand back candidates with enough context that she
can accept or reject each one in a few seconds.

## The audience you're filtering for

The newsletter goes to three groups, in priority order:

1. **Product engineers** — developers who own product work at startups. This is the
   primary ICP. Filter as if you're picking links for a sharp senior engineer at a
   20-person startup who has 20 minutes and hates having their time wasted.
2. **Technical founders** — CEOs of early startups who still read code.
3. **Software engineers** curious about product and startup culture.

A link earns a spot if it would make that person think "huh, I'm glad I read that."

## What counts as a good pick

Include a link if it clearly does one of these:

- **Teaches a technique.** How-tos, engineering deep-dives, postmortems, war
  stories with a real lesson, architecture write-ups. The reader comes away able to
  do something they couldn't before, or understanding a tradeoff more clearly.
- **Surfaces a useful tool or project.** A new open-source library, dev tool, or
  project a product engineer could actually reach for. Prefer things with substance
  over "Show HN" posts that are thin wrappers or launch-day vaporware.
- **Makes a sharp argument.** A well-reasoned opinion on engineering practice,
  trends, or tradeoffs — the kind of piece that's worth linking because it changes
  how someone thinks, not because it's loud.

## What to hard-reject

Cut these on sight, no matter how much buzz they have:

- Funding rounds, valuations, acquisitions, IPOs.
- Product launches, "we're announcing," press releases, changelog-as-news.
- Company PR and thought-leadership fluff with no takeaway.
- Hype cycles, drama, and outrage-bait with no technical substance.
- Listicles and SEO content ("10 best X tools of 2026").
- Anything paywalled hard enough that the reader can't get value without a
  subscription.

When in doubt, ask: *does the reader learn something they can use, or is this just
news about a company?* If it's the latter, cut it.

## Determining the time window

Further Reading covers what's new since the last issue. Figure out the window like
this:

1. If Jina gives you a date or range ("since July 13," "last two weeks"), use it.
2. Otherwise, default to the **last 14 days** — the newsletter runs roughly weekly to
   biweekly. State the exact window you used at the top of your output so she can
   correct it.

The publishing schedule lives in GitHub issue #10212 in PostHog/posthog.com if you
ever need to confirm the last publish date.

## The workflow

Read `references/sources.md` for the exact fetch recipes (API URLs, query strings,
subreddits, Slack channels). The short version:

1. **Pull from every reachable source** for the window. Hacker News is reliable via
   `web_fetch` (Algolia API); the PostHog blog comes from the `posthog.com` git repo
   (pull the local clone, or fall back to the GitHub repo — do not use the RSS feed,
   it returns broken binary); Reddit and X go through `WebSearch` and deserve a real
   multi-query pass, not a token one; Slack needs the Slack connector (see the note
   below). Gather generously here — over-pull and filter later.
2. **Deduplicate.** The same article shows up on HN, Reddit, and Slack constantly.
   Merge duplicates and note that cross-source interest as a signal it's worth
   including.
3. **Filter hard** against the good-pick and hard-reject criteria above. Most of what
   you pull will not survive this. That's correct — you're aiming for ~10-15 keepers,
   not a firehose.
4. **Annotate each survivor** in the format below.
5. **Rank** so the strongest, most clearly-teaching picks are at the top.

If a source is unreachable (e.g., Slack isn't authorized, X returns nothing useful),
say so briefly at the end rather than silently dropping it — Jina needs to know which
wells you actually drew from.

## Output format

Lead with a one-line note on the window and which sources you reached. Then a ranked
list. For each pick:

```
**[Title](url)** — Source · Type
One line on what it actually is.
Why it's worth linking: the specific thing a product engineer takes away.
```

- **Type** is one of: Technique · Tool · Opinion.
- **Source** names where you found it (HN, Reddit r/…, PostHog blog, X/@handle, Slack #channel). If it surfaced in more than one place, list them — that's a signal.
- Keep the annotations in PostHog's voice: short sentences, specific nouns, no
  throat-clearing, no "this article explores…". Say what it teaches, plainly. Use
  en-dashes with spaces around them ( – ), not em-dashes or hyphens.

**Example of a good entry:**

```
**[How we cut our p99 latency in half by rethinking connection pooling](https://example.com)** — HN (312 pts) · Technique
A payments startup's write-up of chasing tail latency down to their Postgres pool config.
Why it's worth linking: concrete before/after numbers and the exact pool settings they changed – readers can copy the approach.
```

**Example of something you'd cut (don't include, shown for calibration):**

`"Acme raises $40M Series B to reinvent observability"` — funding news, zero takeaway.
`"Announcing Widget 3.0"` — launch PR unless the release notes teach a real technique.

## A note on Slack

The three Slack channels (#dev-ai, #devel-random, #industry-news) are often the
highest-signal source because a human already vouched for the link by sharing it. But
reading them requires the Slack connector to be authorized. If the Slack tools aren't
available, do the rest of the sources and tell Jina at the end: "I couldn't reach
Slack — authorize the connector and I'll fold those channels in." Don't let a missing
Slack block the whole run.
