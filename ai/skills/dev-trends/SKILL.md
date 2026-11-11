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
metadata:
  cowork: true
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

### 1. Set the window — and pin down the actual question

Default to the **last 7 days**. If Jina names a window or a topic, use that. State
the window at the top of the output.

For a topic request, write down in one sentence what would and would not count as
an answer *before* you search, then test every finding against it before you
write. Adjacent-but-different topics dominate search results and will quietly take
over a brief: "multi-agent systems" (agents coordinating with agents) is not
"multiplayer AI" (people collaborating with each other through agents); "AI code
review" is not "how teams review each other's agent output." The
highest-engagement result is often the off-target one, because the adjacent topic
is usually the bigger one. If your best material answers a neighbouring question,
say so explicitly and report it as context — never as the answer.

Seven days is right for "what's moving." For a specific or niche topic, widen to
30–60 days and state the window — a week of a narrow topic is mostly noise.

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

### 4b. Attribute to the post, not the person

Every opinion you quote links to that specific post —
`x.com/<handle>/status/<id>`. **Never link a bare profile.** A profile link is not
a citation: Jina can't find the quote, and it reads as sourced when it isn't.

So this is a harvesting rule before it's a writing rule. The status URL is the
field you never trim. When a dump comes back truncated, re-dump in slices
(`Object.values(window.__h).slice(n)`) or cut the post text and the engagement
counts — keep the handle and the URL. If you reach the end of a run holding a
quote whose URL you don't have, spend one `from:<handle> since:<date>` query to
recover it, or cut the quote. Saying "unsourced" is fine; a profile link is not.

Two checks before a quote is safe to use:

- **Read the author's own replies.** A flat one-line take is often qualified or
  walked back by the author within the hour, and quoting the opener alone can
  invert their real position. Any post you're about to build a "disagreement"
  section on gets a self-reply check first.
- **Check who's selling something.** On any tooling topic, many of the loudest
  voices ship a product in that exact category, sometimes launched the same week
  as the post. That doesn't disqualify them, but it changes what the post is
  evidence of. Flag it inline — "(ships a competing harness)" — rather than
  passing vendor positioning off as practitioner testimony. If *every*
  enthusiastic voice on a theme has a horse in the race, that uniformity is
  itself the finding, and worth saying out loud.

### 5. Cross-check off-platform

X tells you what people are *saying*; these tell you whether it's real. Use
`WebFetch` — no browser needed:

- **Hacker News** via the Algolia API for the same window (recipe in references).
  A topic hot on both X and HN is confirmed; hot on X only is often a bubble.
- **GitHub Trending** for the weekly view. If a tool is being talked about, check
  whether the stars back it up. Sanity-check what comes back — if the "weekly"
  list is topped by freeCodeCamp, TensorFlow and Vue, you got a stale cache.
  Drop it and say so rather than reporting it.

Also use these to find the *underlying artifact* — the blog post, repo, or paper a
thread is reacting to. Link the artifact wherever one exists.

**Always pair an HN-sourced item with its HN discussion link.** Any time a story
reached the brief through Hacker News — or you cite its points/comments — give
both links: the artifact itself *and* the HN thread at
`https://news.ycombinator.com/item?id=<objectID>`. The discussion is often the
better read, and Jina needs it to check what commenters actually objected to.
Capture the `objectID` alongside title, URL, points and comments on every
Algolia fetch so it's never missing at write-up time. Format it as
`[artifact](url) ([HN](https://news.ycombinator.com/item?id=<objectID>), 895 pts/770 comments)`.
For Ask HN / Tell HN posts with no external URL, the HN link *is* the artifact.
If a fetch ever gives you a comment ID rather than a story ID, resolve it to the
story before linking.

When a claim rests on a study or a number, go get the study. "A Harvard study
found…" inside someone's manifesto is a claim about a study, not a source. Either
land on the paper and quote its real figures, or mark the number `[unverified]`.

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
**Signal:** where you saw it – handles linked to the specific posts, HN stories linked to their discussion pages, GitHub, and roughly how much
**What's happening:** 2–4 sentences. Specific nouns. Who's saying what.
**The disagreement:** if there is one, both sides in a sentence each. Skip if genuinely one-sided.
**Worth reading:** [artifact](url) ([HN](https://news.ycombinator.com/item?id=<objectID>) if it came via HN) – one line on why
```

Then two short closing sections:

- **Quiet signals** — three or four one-liners on things that are small now but
  moving. Low bar for inclusion; label them as speculative. HN-sourced ones get
  their discussion link too.
- **Cooling off** — anything the timeline has visibly lost interest in since the
  last run, if you can tell.

Finish with a one-line note on which sources you actually reached, flag anything
that failed, and list any quote you had to leave unsourced so Jina knows not to
use it.

Write in PostHog's voice: short sentences, specific nouns, no throat-clearing, no
"the developer community is buzzing about." Use en-dashes with spaces ( – ), not
em-dashes. Name people by handle when attributing an opinion — Jina needs to know
whose take it is — and link that handle to the post you're quoting.

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
- **A harvester dump comes back truncated** → re-dump in slices rather than
  shortening the fields. If you must shorten, cut post text first and the URL
  last. Never let truncation be the reason a quote loses its link.
- **`f=top` results reshuffle between page loads** → Top ranking is not stable, so
  a post you saw on the first pass may not render on a second. Capture handle,
  URL, text and engagement on the first pass; don't count on re-finding it.
- **`news.ycombinator.com` returns 429** → don't retry in a loop. Read comment
  bodies through the Algolia API instead
  (`hn.algolia.com/api/v1/search?tags=comment,story_<id>`), and note in the
  closing line that you have usernames but not per-comment vote counts. Still
  include the `news.ycombinator.com/item?id=<id>` discussion link in the brief —
  a 429 for you doesn't mean Jina can't open it.
- **A `WebFetch` returns `PROVENANCE_REQUIRED`** → the fetch needs Jina to approve
  a permission prompt, and she may be away. Don't retry in a loop and don't
  substitute a guess. Fall back to what the HN API already gave you (titles,
  points, comment counts are reliable on their own), and say in the closing note
  which articles you characterised without reading in full.
- **A `computer` or `javascript_tool` call times out at 45s** → the page is mid-
  navigation or a script is still running. Wait, then re-issue the single call on
  its own rather than re-running the whole batch.

